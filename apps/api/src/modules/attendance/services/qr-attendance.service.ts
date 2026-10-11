import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AttendanceStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { RedisService } from '../../../common/services/redis.service';

/**
 * QR Attendance Token Payload
 */
interface QRAttendanceToken {
  /** Session ID to bind QR to specific attendance session */
  sessionId: string;
  /** Class ID */
  classId?: string;
  /** Stream ID (optional) */
  streamId?: string;
  /** Tenant ID for multi-tenant security */
  tenantId: string;
  /** Teacher/staff ID who created the session */
  createdBy: string;
  /** Session type */
  type: 'class_attendance' | 'event_attendance';
  /** Creation timestamp */
  iat: number;
  /** Expiration timestamp */
  exp: number;
}

/**
 * QR Scan Request
 */
export interface QRScanRequest {
  token: string;
  studentId: string;
  scannedAt?: Date;
}

/**
 * QR Session Configuration
 */
export interface QRSessionConfig {
  classId?: string;
  streamId?: string;
  tenantId: string;
  createdBy: string;
  type: 'class_attendance' | 'event_attendance';
  expiryMinutes?: number;
}

/**
 * QR Attendance Service
 * 
 * Implements secure QR code-based attendance with:
 * - JWT-based time-limited tokens (5-minute default expiry)
 * - Session binding to specific class/stream
 * - Replay attack prevention (one scan per student per session)
 * - Tenant isolation
 * - Server-side validation
 * - Duplicate scan detection
 * 
 * Security Features:
 * - Tokens cannot be reused across sessions
 * - Tokens expire after configured time (default 5 minutes)
 * - Each student can only scan once per session
 * - Tokens are bound to specific tenant and class
 * - Server-side verification prevents tampering
 */
@Injectable()
export class QRAttendanceService {
  private readonly logger = new Logger(QRAttendanceService.name);
  private readonly QR_SCANS_PREFIX = 'qr:scans:';
  private readonly DEFAULT_EXPIRY_MINUTES = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Generate a secure QR attendance token
   */
  async generateQRToken(config: QRSessionConfig): Promise<{
    token: string;
    sessionId: string;
    expiresAt: Date;
  }> {
    // Generate unique session ID
    const sessionId = `qr-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const expiryMinutes = config.expiryMinutes || this.DEFAULT_EXPIRY_MINUTES;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Create JWT payload
    const payload: QRAttendanceToken = {
      sessionId,
      classId: config.classId,
      streamId: config.streamId,
      tenantId: config.tenantId,
      createdBy: config.createdBy,
      type: config.type,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    // Sign JWT with short-lived secret
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: `${expiryMinutes}m`,
    });

    this.logger.log(
      `Generated QR token for session ${sessionId}, class ${config.classId}, expires in ${expiryMinutes} minutes`
    );

    // Store session metadata in Redis for additional validation
    await this.redis.set(
      `qr:session:${sessionId}`,
      JSON.stringify({
        classId: config.classId,
        streamId: config.streamId,
        tenantId: config.tenantId,
        createdBy: config.createdBy,
        createdAt: new Date().toISOString(),
      }),
      expiryMinutes * 60 + 60 // Extra minute buffer
    );

    return {
      token,
      sessionId,
      expiresAt,
    };
  }

  /**
   * Verify and process QR code scan
   */
  async verifyAndMarkAttendance(
    request: QRScanRequest,
    tenantId: string
  ): Promise<{
    success: boolean;
    attendanceId?: string;
    student?: any;
    message: string;
  }> {
    try {
      // 1. Verify JWT token
      const payload = await this.verifyQRToken(request.token);

      // 2. Verify tenant match (prevent cross-tenant attacks)
      if (payload.tenantId !== tenantId) {
        throw new UnauthorizedException('Invalid QR code for this school');
      }

      // 3. Check if student exists and belongs to the class
      const student = await this.prisma.student.findUnique({
        where: {
          id: request.studentId,
          tenantId,
        },
        include: {
          currentClass: true,
        },
      });

      if (!student) {
        throw new BadRequestException('Student not found');
      }

      // 4. Verify student is in the correct class (if class-specific QR)
      if (payload.classId && student.currentClassId !== payload.classId) {
        throw new BadRequestException(
          `This QR code is for ${payload.classId} only. Student is in ${student.currentClassId}.`
        );
      }

      // 5. Check for duplicate scan (replay attack prevention)
      const scanKey = this.getScanKey(payload.sessionId, request.studentId);
      const alreadyScanned = await this.redis.exists(scanKey);

      if (alreadyScanned) {
        return {
          success: false,
          message: 'Already marked present in this session',
        };
      }

      // 6. Mark attendance
      const scannedAt = request.scannedAt || new Date();
      const attendance = await this.prisma.attendanceRecord.create({
        data: {
          studentId: request.studentId,
          classId: student.currentClassId!,
          streamId: student.currentStreamId,
          date: scannedAt,
          status: this.calculateAttendanceStatus(scannedAt),
          remarks: `QR scan - Session: ${payload.sessionId} (DYNAMIC_QR)`,
          markedBy: payload.createdBy,
          arrivalTime: scannedAt,
          tenantId,
        },
      });

      // 7. Record scan to prevent duplicates
      await this.redis.set(
        scanKey,
        JSON.stringify({
          attendanceId: attendance.id,
          scannedAt: scannedAt.toISOString(),
          studentId: request.studentId,
        }),
        // Keep record for session expiry + 1 hour
        (payload.exp - payload.iat) + 3600
      );

      this.logger.log(
        `QR attendance marked: Student ${request.studentId}, ` +
        `Session ${payload.sessionId}, Attendance ${attendance.id}`
      );

      return {
        success: true,
        attendanceId: attendance.id,
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          admissionNumber: student.admissionNumber,
          class: student.currentClass?.name,
        },
        message: `Attendance marked successfully for ${student.firstName} ${student.lastName}`,
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(`QR scan verification failed: ${error.message}`, error.stack);
      
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('QR code has expired. Please request a new one.');
      }

      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid QR code');
      }

      throw new BadRequestException('Failed to process QR scan');
    }
  }

  /**
   * Verify QR token and extract payload
   */
  private async verifyQRToken(token: string): Promise<QRAttendanceToken> {
    try {
      const payload = this.jwtService.verify<QRAttendanceToken>(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Additional session validation from Redis
      const sessionKey = `qr:session:${payload.sessionId}`;
      const sessionData = await this.redis.get(sessionKey);

      if (!sessionData) {
        throw new UnauthorizedException('QR session has expired or is invalid');
      }

      return payload;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired QR code');
    }
  }

  /**
   * Calculate attendance status based on time
   */
  private calculateAttendanceStatus(scannedAt: Date): AttendanceStatus {
    const hour = scannedAt.getHours();
    const minute = scannedAt.getMinutes();

    // Before 8:15 AM = Present
    // 8:15 AM - 9:00 AM = Late
    // After 9:00 AM = Absent (shouldn't mark via QR)
    
    if (hour < 8 || (hour === 8 && minute < 15)) {
      return AttendanceStatus.PRESENT;
    } else if (hour < 9) {
      return AttendanceStatus.LATE;
    } else {
      return AttendanceStatus.PRESENT; // Still mark as present if scanning after hours
    }
  }

  /**
   * Get scan key for Redis duplicate detection
   */
  private getScanKey(sessionId: string, studentId: string): string {
    return `${this.QR_SCANS_PREFIX}${sessionId}:${studentId}`;
  }

  /**
   * Get active session information
   */
  async getSessionInfo(sessionId: string): Promise<any> {
    const sessionKey = `qr:session:${sessionId}`;
    const sessionData = await this.redis.get(sessionKey);

    if (!sessionData) {
      throw new BadRequestException('Session not found or expired');
    }

    const session = JSON.parse(sessionData);

    // Get scan count for this session
    const scanKeys = await this.redis.keys(`${this.QR_SCANS_PREFIX}${sessionId}:*`);

    return {
      sessionId,
      ...session,
      scanCount: scanKeys.length,
    };
  }

  /**
   * Invalidate a QR session (emergency stop)
   */
  async invalidateSession(sessionId: string, tenantId: string): Promise<void> {
    const sessionKey = `qr:session:${sessionId}`;
    const sessionData = await this.redis.get(sessionKey);

    if (sessionData) {
      const session = JSON.parse(sessionData);
      
      // Verify tenant owns this session
      if (session.tenantId !== tenantId) {
        throw new UnauthorizedException('Cannot invalidate session from another school');
      }

      await this.redis.del(sessionKey);
      this.logger.log(`QR session ${sessionId} invalidated by tenant ${tenantId}`);
    }
  }

  /**
   * Get session statistics (for teacher dashboard)
   */
  async getSessionStats(sessionId: string, tenantId: string): Promise<{
    sessionId: string;
    totalScans: number;
    uniqueStudents: string[];
    isActive: boolean;
  }> {
    const sessionKey = `qr:session:${sessionId}`;
    const sessionData = await this.redis.get(sessionKey);

    if (!sessionData) {
      return {
        sessionId,
        totalScans: 0,
        uniqueStudents: [],
        isActive: false,
      };
    }

    const session = JSON.parse(sessionData);

    // Verify tenant
    if (session.tenantId !== tenantId) {
      throw new UnauthorizedException('Cannot access session from another school');
    }

    // Get all scans for this session
    const scanKeys = await this.redis.keys(`${this.QR_SCANS_PREFIX}${sessionId}:*`);
    
    const uniqueStudents = scanKeys.map(key => {
      const parts = key.split(':');
      return parts[parts.length - 1]; // Extract student ID
    });

    return {
      sessionId,
      totalScans: scanKeys.length,
      uniqueStudents,
      isActive: true,
    };
  }
}
