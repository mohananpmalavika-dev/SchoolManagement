import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { QRAttendanceService, QRSessionConfig } from './qr-attendance.service';
import { PrismaService } from '../../../database/prisma.service';
import { RedisService } from '../../../common/services/redis.service';

describe('QRAttendanceService', () => {
  let service: QRAttendanceService;
  let jwtService: JwtService;
  let redisService: RedisService;
  let prismaService: PrismaService;

  const mockRedisClient = {
    incr: jest.fn(),
  };

  const mockRedisService = {
    getClient: jest.fn(() => Promise.resolve(mockRedisClient)),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
  };

  const mockPrismaService = {
    student: {
      findUnique: jest.fn(),
    },
    attendance: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRAttendanceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<QRAttendanceService>(QRAttendanceService);
    jwtService = module.get<JwtService>(JwtService);
    redisService = module.get<RedisService>(RedisService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('generateQRToken', () => {
    it('should generate a valid QR token', async () => {
      const config: QRSessionConfig = {
        classId: 'class-123',
        streamId: 'stream-456',
        tenantId: 'tenant-789',
        createdBy: 'teacher-001',
        type: 'class_attendance',
        expiryMinutes: 5,
      };

      mockJwtService.sign.mockReturnValue('mock-jwt-token');
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.generateQRToken(config);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('expiresAt');
      expect(result.token).toBe('mock-jwt-token');
      expect(result.sessionId).toMatch(/^qr-session-/);
      
      // Verify JWT was signed with correct payload
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          classId: config.classId,
          streamId: config.streamId,
          tenantId: config.tenantId,
          createdBy: config.createdBy,
          type: config.type,
        }),
        expect.objectContaining({
          secret: 'test-secret',
          expiresIn: '5m',
        })
      );

      // Verify session stored in Redis
      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining('qr:session:'),
        expect.any(String),
        360 // 5 minutes + 1 minute buffer
      );
    });

    it('should use default expiry of 5 minutes', async () => {
      const config: QRSessionConfig = {
        tenantId: 'tenant-789',
        createdBy: 'teacher-001',
        type: 'class_attendance',
      };

      mockJwtService.sign.mockReturnValue('mock-jwt-token');
      mockRedisService.set.mockResolvedValue(undefined);

      await service.generateQRToken(config);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          expiresIn: '5m',
        })
      );
    });
  });

  describe('verifyAndMarkAttendance', () => {
    const mockToken = 'mock-jwt-token';
    const mockPayload = {
      sessionId: 'session-123',
      classId: 'class-123',
      tenantId: 'tenant-789',
      createdBy: 'teacher-001',
      type: 'class_attendance' as const,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300,
    };

    const mockStudent = {
      id: 'student-001',
      firstName: 'John',
      lastName: 'Doe',
      admissionNumber: 'ADM001',
      classId: 'class-123',
      streamId: 'stream-456',
      tenantId: 'tenant-789',
      class: { name: 'Grade 5A' },
    };

    it('should successfully mark attendance for valid QR scan', async () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ tenantId: 'tenant-789' })
      );
      mockRedisService.exists.mockResolvedValue(false);
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.attendance.create.mockResolvedValue({
        id: 'attendance-001',
        studentId: mockStudent.id,
        status: 'PRESENT',
      });
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.verifyAndMarkAttendance(
        { token: mockToken, studentId: 'student-001' },
        'tenant-789'
      );

      expect(result.success).toBe(true);
      expect(result.attendanceId).toBe('attendance-001');
      expect(result.student?.name).toBe('John Doe');
      expect(mockPrismaService.attendance.create).toHaveBeenCalled();
    });

    it('should reject QR from different tenant', async () => {
      mockJwtService.verify.mockReturnValue({
        ...mockPayload,
        tenantId: 'different-tenant',
      });
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ tenantId: 'different-tenant' })
      );

      await expect(
        service.verifyAndMarkAttendance(
          { token: mockToken, studentId: 'student-001' },
          'tenant-789'
        )
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject student not in correct class', async () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ tenantId: 'tenant-789' })
      );
      mockPrismaService.student.findUnique.mockResolvedValue({
        ...mockStudent,
        classId: 'different-class',
      });

      await expect(
        service.verifyAndMarkAttendance(
          { token: mockToken, studentId: 'student-001' },
          'tenant-789'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent duplicate scan (replay attack)', async () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ tenantId: 'tenant-789' })
      );
      mockRedisService.exists.mockResolvedValue(true); // Already scanned
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);

      const result = await service.verifyAndMarkAttendance(
        { token: mockToken, studentId: 'student-001' },
        'tenant-789'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Already marked present');
      expect(mockPrismaService.attendance.create).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        const error: any = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await expect(
        service.verifyAndMarkAttendance(
          { token: mockToken, studentId: 'student-001' },
          'tenant-789'
        )
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        const error: any = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await expect(
        service.verifyAndMarkAttendance(
          { token: mockToken, studentId: 'student-001' },
          'tenant-789'
        )
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject if session not found in Redis', async () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockRedisService.get.mockResolvedValue(null); // Session not found

      await expect(
        service.verifyAndMarkAttendance(
          { token: mockToken, studentId: 'student-001' },
          'tenant-789'
        )
      ).rejects.toThrow('QR session has expired or is invalid');
    });
  });

  describe('getSessionStats', () => {
    it('should return session statistics', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({
          classId: 'class-123',
          tenantId: 'tenant-789',
        })
      );
      mockRedisService.keys.mockResolvedValue([
        'qr:scans:session-123:student-001',
        'qr:scans:session-123:student-002',
        'qr:scans:session-123:student-003',
      ]);

      const stats = await service.getSessionStats('session-123', 'tenant-789');

      expect(stats.sessionId).toBe('session-123');
      expect(stats.totalScans).toBe(3);
      expect(stats.uniqueStudents).toHaveLength(3);
      expect(stats.isActive).toBe(true);
    });

    it('should reject access from different tenant', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({
          classId: 'class-123',
          tenantId: 'different-tenant',
        })
      );

      await expect(
        service.getSessionStats('session-123', 'tenant-789')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return empty stats for expired session', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const stats = await service.getSessionStats('session-123', 'tenant-789');

      expect(stats.isActive).toBe(false);
      expect(stats.totalScans).toBe(0);
    });
  });

  describe('invalidateSession', () => {
    it('should invalidate active session', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ tenantId: 'tenant-789' })
      );
      mockRedisService.del.mockResolvedValue(1);

      await service.invalidateSession('session-123', 'tenant-789');

      expect(mockRedisService.del).toHaveBeenCalledWith('qr:session:session-123');
    });

    it('should reject invalidation from different tenant', async () => {
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ tenantId: 'different-tenant' })
      );

      await expect(
        service.invalidateSession('session-123', 'tenant-789')
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
