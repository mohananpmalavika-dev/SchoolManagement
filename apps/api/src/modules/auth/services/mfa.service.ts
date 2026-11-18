import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../database/prisma.service';
import { RedisService } from '../../../common/services/redis.service';

/**
 * Multi-Factor Authentication Service
 * 
 * Implements TOTP-based MFA using Google Authenticator protocol:
 * - TOTP token generation and verification (30-second window)
 * - QR code generation for authenticator app setup
 * - Backup codes (10 single-use codes, bcrypt hashed)
 * - MFA enforcement for SUPER_ADMIN and PRINCIPAL roles
 * - Rate limiting on verification attempts
 * 
 * Security Features:
 * - Crypto-secure secret generation (32 bytes base32)
 * - Backup codes hashed with bcrypt (single-use)
 * - Rate limiting prevents brute-force attacks
 * - Redis-based verification tracking
 * - Audit logging of MFA events
 */
@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);
  private readonly APP_NAME = 'Krypton School ERP';
  private readonly MAX_VERIFICATION_ATTEMPTS = 5;
  private readonly VERIFICATION_WINDOW_SECONDS = 300; // 5 minutes
  private readonly BACKUP_CODE_LENGTH = 8;
  private readonly NUM_BACKUP_CODES = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    // Configure otplib
    authenticator.options = {
      window: 1, // Allow 1 step before/after (30 seconds each = ±30 seconds tolerance)
    };
  }

  /**
   * Generate MFA secret and QR code for user setup
   */
  async generateMfaSetup(userId: string): Promise<{
    secret: string;
    qrCodeDataUrl: string;
    backupCodes: string[];
  }> {
    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          mfaEnabled: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.mfaEnabled) {
        throw new BadRequestException(
          'MFA is already enabled. Disable it first to generate new setup.'
        );
      }

      // Generate secret
      const secret = authenticator.generateSecret();

      // Generate OTP auth URL
      const otpauthUrl = authenticator.keyuri(
        user.email,
        this.APP_NAME,
        secret
      );

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      const hashedBackupCodes = await Promise.all(
        backupCodes.map(code => bcrypt.hash(code, 10))
      );

      // Store secret and backup codes in database (not yet enabled)
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaSecret: secret,
          mfaBackupCodes: hashedBackupCodes,
          mfaEnabled: false, // Not enabled until verified
        },
      });

      this.logger.log(`MFA setup generated for user ${userId}`);

      // Log security event
      await this.logSecurityEvent(userId, 'MFA_SETUP_GENERATED', {
        email: user.email,
      });

      return {
        secret,
        qrCodeDataUrl,
        backupCodes,
      };
    } catch (error: any) {
      this.logger.error(`MFA setup generation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify TOTP token and enable MFA
   */
  async verifyAndEnableMfa(userId: string, token: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Check rate limit
      const rateLimitKey = `mfa:verify:${userId}`;
      const attempts = await this.incrementVerificationAttempts(rateLimitKey);

      if (attempts > this.MAX_VERIFICATION_ATTEMPTS) {
        throw new BadRequestException(
          'Too many verification attempts. Please try again later.'
        );
      }

      // Get user with MFA secret
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          mfaEnabled: true,
          mfaSecret: true,
          tenantId: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.mfaEnabled) {
        throw new BadRequestException('MFA is already enabled');
      }

      if (!user.mfaSecret) {
        throw new BadRequestException('MFA setup not found. Generate setup first.');
      }

      // Verify token
      const isValid = authenticator.verify({
        token,
        secret: user.mfaSecret,
      });

      if (!isValid) {
        throw new UnauthorizedException(
          `Invalid verification code. ${this.MAX_VERIFICATION_ATTEMPTS - attempts} attempts remaining.`
        );
      }

      // Enable MFA
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
        },
      });

      // Clear rate limit
      await this.redis.del(rateLimitKey);

      this.logger.log(`MFA enabled for user ${userId}`);

      // Log security event
      await this.logSecurityEvent(userId, 'MFA_ENABLED', {
        email: user.email,
        tenantId: user.tenantId,
      });

      return {
        success: true,
        message: 'MFA has been successfully enabled.',
      };
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`MFA enablement failed: ${error.message}`, error.stack);
      throw new BadRequestException('MFA enablement failed. Please try again.');
    }
  }

  /**
   * Verify TOTP token during login
   */
  async verifyMfaToken(userId: string, token: string): Promise<boolean> {
    try {
      // Check rate limit
      const rateLimitKey = `mfa:login:${userId}`;
      const attempts = await this.incrementVerificationAttempts(rateLimitKey);

      if (attempts > this.MAX_VERIFICATION_ATTEMPTS) {
        this.logger.warn(`MFA verification rate limit exceeded for user ${userId}`);
        throw new UnauthorizedException(
          'Too many verification attempts. Please try again later.'
        );
      }

      // Get user with MFA secret
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          mfaEnabled: true,
          mfaSecret: true,
          mfaBackupCodes: true,
        },
      });

      if (!user || !user.mfaEnabled || !user.mfaSecret) {
        throw new UnauthorizedException('MFA not configured');
      }

      // Try TOTP verification first
      const isTotpValid = authenticator.verify({
        token,
        secret: user.mfaSecret,
      });

      if (isTotpValid) {
        // Clear rate limit on successful verification
        await this.redis.del(rateLimitKey);
        this.logger.log(`MFA verification successful for user ${userId}`);
        return true;
      }

      // Try backup code verification
      if (user.mfaBackupCodes && user.mfaBackupCodes.length > 0) {
        for (let i = 0; i < user.mfaBackupCodes.length; i++) {
          const isBackupCodeValid = await bcrypt.compare(token, user.mfaBackupCodes[i]);

          if (isBackupCodeValid) {
            // Remove used backup code
            const updatedBackupCodes = user.mfaBackupCodes.filter((_, index) => index !== i);
            await this.prisma.user.update({
              where: { id: userId },
              data: {
                mfaBackupCodes: updatedBackupCodes,
              },
            });

            // Clear rate limit
            await this.redis.del(rateLimitKey);

            this.logger.log(`MFA backup code used by user ${userId}. ${updatedBackupCodes.length} codes remaining.`);

            // Log security event
            await this.logSecurityEvent(userId, 'MFA_BACKUP_CODE_USED', {
              remainingCodes: updatedBackupCodes.length,
            });

            return true;
          }
        }
      }

      // Both TOTP and backup code failed
      this.logger.warn(`MFA verification failed for user ${userId}. Attempts: ${attempts}/${this.MAX_VERIFICATION_ATTEMPTS}`);
      return false;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`MFA verification error: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Disable MFA for user (requires password confirmation)
   */
  async disableMfa(userId: string, password: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Get user with password hash
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          mfaEnabled: true,
          tenantId: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!user.mfaEnabled) {
        throw new BadRequestException('MFA is not enabled');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      // Disable MFA
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: [],
        },
      });

      this.logger.log(`MFA disabled for user ${userId}`);

      // Log security event
      await this.logSecurityEvent(userId, 'MFA_DISABLED', {
        email: user.email,
        tenantId: user.tenantId,
      });

      return {
        success: true,
        message: 'MFA has been disabled successfully.',
      };
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`MFA disable failed: ${error.message}`, error.stack);
      throw new BadRequestException('MFA disable failed. Please try again.');
    }
  }

  /**
   * Regenerate backup codes (requires MFA token)
   */
  async regenerateBackupCodes(userId: string, mfaToken: string): Promise<{
    backupCodes: string[];
  }> {
    try {
      // Verify MFA token first
      const isValid = await this.verifyMfaToken(userId, mfaToken);
      if (!isValid) {
        throw new UnauthorizedException('Invalid MFA token');
      }

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes();
      const hashedBackupCodes = await Promise.all(
        backupCodes.map(code => bcrypt.hash(code, 10))
      );

      // Update backup codes
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaBackupCodes: hashedBackupCodes,
        },
      });

      this.logger.log(`Backup codes regenerated for user ${userId}`);

      // Log security event
      await this.logSecurityEvent(userId, 'MFA_BACKUP_CODES_REGENERATED', {});

      return { backupCodes };
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Backup code regeneration failed: ${error.message}`, error.stack);
      throw new BadRequestException('Backup code regeneration failed. Please try again.');
    }
  }

  /**
   * Check if MFA is required for user role
   */
  async isMfaRequired(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) return false;

    // MFA required for SUPER_ADMIN and PRINCIPAL roles
    return user.role === 'SUPER_ADMIN' || user.role === 'PRINCIPAL';
  }

  /**
   * Get MFA status for user
   */
  async getMfaStatus(userId: string): Promise<{
    enabled: boolean;
    required: boolean;
    backupCodesRemaining: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        mfaEnabled: true,
        mfaBackupCodes: true,
        role: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const required = user.role === 'SUPER_ADMIN' || user.role === 'PRINCIPAL';
    const backupCodesRemaining = user.mfaBackupCodes?.length || 0;

    return {
      enabled: user.mfaEnabled || false,
      required,
      backupCodesRemaining,
    };
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.NUM_BACKUP_CODES; i++) {
      const code = crypto.randomBytes(this.BACKUP_CODE_LENGTH / 2).toString('hex');
      codes.push(code);
    }
    return codes;
  }

  /**
   * Increment verification attempts (rate limiting)
   */
  private async incrementVerificationAttempts(key: string): Promise<number> {
    const client = await this.redis.getClient();
    const count = await client.incr(key);

    // Set expiry on first attempt
    if (count === 1) {
      await this.redis.expire(key, this.VERIFICATION_WINDOW_SECONDS);
    }

    return count;
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(
    userId: string,
    eventType: string,
    metadata: any
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { tenantId: true },
      });

      await this.prisma.$executeRaw`
        INSERT INTO audit_logs (
          user_id,
          tenant_id,
          event_type,
          event_data,
          ip_address,
          user_agent,
          created_at
        ) VALUES (
          ${userId},
          ${user?.tenantId || null},
          ${eventType},
          ${JSON.stringify(metadata)}::jsonb,
          NULL,
          NULL,
          NOW()
        )
        ON CONFLICT DO NOTHING
      `.catch((error) => {
        // Silently fail if audit_logs table doesn't exist yet
        this.logger.debug(`Audit log insert failed: ${error.message}`);
      });
    } catch (error: any) {
      this.logger.error(`Failed to log security event: ${error.message}`);
    }
  }
}
