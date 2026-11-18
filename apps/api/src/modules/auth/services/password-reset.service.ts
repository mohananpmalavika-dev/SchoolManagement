import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../database/prisma.service';
import { RedisService } from '../../../common/services/redis.service';
import { EmailService } from '../../../common/services/email.service';

/**
 * Password Reset Service
 * 
 * Implements secure password reset flow with:
 * - Crypto-secure reset tokens (32 bytes random)
 * - 24-hour token expiry
 * - Rate limiting on reset requests (3 per hour per email)
 * - Single-use tokens (invalidated after use)
 * - Password strength validation
 * - Email notifications
 * - Audit logging
 * 
 * Security Features:
 * - Tokens are cryptographically random (not predictable)
 * - Tokens stored hashed in Redis (not reversible)
 * - Rate limiting prevents token exhaustion attacks
 * - Single-use tokens prevent replay attacks
 * - Notifications on password change
 */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly TOKEN_EXPIRY_HOURS = 24;
  private readonly RATE_LIMIT_WINDOW_SECONDS = 3600; // 1 hour
  private readonly MAX_RESET_REQUESTS = 3;
  private readonly MIN_PASSWORD_LENGTH = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  // Called only for accounts already linked by the admission transaction. The recipient
  // may be the guardian's mailbox when the student has a generated login ID.
  async sendAccountInvitation(user: {
    id: string; email: string; firstName: string; lastName: string;
    role: string; mustChangePassword: boolean;
  }, recipient: string): Promise<boolean> {
    try {
      let token: string | undefined;
      if (user.mustChangePassword) {
        token = crypto.randomBytes(32).toString('hex');
        await this.redis.set(`password-reset:token:${user.id}`, JSON.stringify({
          tokenHash: await bcrypt.hash(token, 10), userId: user.id,
          email: user.email, createdAt: new Date().toISOString(),
        }), this.TOKEN_EXPIRY_HOURS * 3600);
      }
      return await this.email.sendAccountInvitation(recipient, user, token);
    } catch {
      this.logger.warn(`Account invitation delivery failed for user ${user.id}`);
      return false;
    }
  }

  /**
   * Request password reset - sends email with reset link
   */
  async requestPasswordReset(email: string): Promise<{
    success: boolean;
    message: string;
  }> {
    // Always return success to prevent email enumeration
    const safeResponse = {
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    };

    try {
      // Normalize email
      const normalizedEmail = email.trim().toLowerCase();

      // Check rate limit
      const rateLimitKey = `password-reset:rate:${normalizedEmail}`;
      const requestCount = await this.incrementRateLimit(rateLimitKey);

      if (requestCount > this.MAX_RESET_REQUESTS) {
        this.logger.warn(
          `Password reset rate limit exceeded for ${normalizedEmail}. ` +
          `Requests: ${requestCount}/${this.MAX_RESET_REQUESTS}`
        );
        // Still return success to prevent enumeration
        return safeResponse;
      }

      // Find user (check all users, not just active - allow password reset for inactive accounts)
      const user = await this.prisma.user.findFirst({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          tenantId: true,
        },
      });

      if (!user) {
        // User not found, but don't reveal this
        this.logger.debug(`Password reset requested for non-existent email: ${normalizedEmail}`);
        return safeResponse;
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(resetToken, 10);

      // Store token in Redis with expiry
      const tokenKey = `password-reset:token:${user.id}`;
      await this.redis.set(
        tokenKey,
        JSON.stringify({
          tokenHash,
          userId: user.id,
          email: user.email,
          createdAt: new Date().toISOString(),
        }),
        this.TOKEN_EXPIRY_HOURS * 3600
      );

      // Send reset email
      const userName = `${user.firstName} ${user.lastName}`;
      await this.email.sendPasswordReset(user.email, resetToken, userName);

      this.logger.log(
        `Password reset token generated for user ${user.id}. ` +
        `Token expires in ${this.TOKEN_EXPIRY_HOURS} hours.`
      );

      // Log security event
      await this.logSecurityEvent(user.id, user.tenantId, 'PASSWORD_RESET_REQUESTED', {
        email: user.email,
      });

      return safeResponse;
    } catch (error: any) {
      this.logger.error(`Password reset request failed: ${error.message}`, error.stack);
      // Still return success to prevent information leakage
      return safeResponse;
    }
  }

  /**
   * Verify reset token validity
   */
  async verifyResetToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
    email?: string;
  }> {
    try {
      // Search for token across all user tokens
      // This is safe because tokens are hashed
      const tokenKeys = await this.redis.keys('password-reset:token:*');

      for (const key of tokenKeys) {
        const tokenData = await this.redis.get(key);
        if (!tokenData) continue;

        const data = JSON.parse(tokenData);
        const isMatch = await bcrypt.compare(token, data.tokenHash);

        if (isMatch) {
          return {
            valid: true,
            userId: data.userId,
            email: data.email,
          };
        }
      }

      return { valid: false };
    } catch (error: any) {
      this.logger.error(`Token verification failed: ${error.message}`);
      return { valid: false };
    }
  }

  /**
   * Reset password using valid token
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Validate password strength
      this.validatePasswordStrength(newPassword);

      // Verify token
      const verification = await this.verifyResetToken(token);

      if (!verification.valid || !verification.userId) {
        throw new BadRequestException(
          'Invalid or expired reset token. Please request a new password reset.'
        );
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: verification.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          tenantId: true,
          passwordHash: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if new password is same as old password
      const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
      if (isSamePassword) {
        throw new BadRequestException(
          'New password cannot be the same as your current password'
        );
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password and invalidate all sessions
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          tokenVersion: { increment: 1 }, // Invalidate all existing sessions
          mustChangePassword: false,
          updatedAt: new Date(),
        },
      });

      // Invalidate the reset token (single-use)
      const tokenKey = `password-reset:token:${user.id}`;
      await this.redis.del(tokenKey);

      // Send confirmation email
      const userName = `${user.firstName} ${user.lastName}`;
      await this.email.sendPasswordChanged(user.email, userName);

      this.logger.log(`Password reset successful for user ${user.id}`);

      // Log security event
      await this.logSecurityEvent(user.id, user.tenantId, 'PASSWORD_RESET_COMPLETED', {
        email: user.email,
      });

      return {
        success: true,
        message: 'Password reset successfully. You can now sign in with your new password.',
      };
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Password reset failed: ${error.message}`, error.stack);
      throw new BadRequestException('Password reset failed. Please try again.');
    }
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    if (!password || password.length < this.MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`
      );
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password123', 'admin123456', 'welcome12345', 'qwerty123456',
      '123456789012', 'password1234', 'admin1234567'
    ];

    if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
      throw new BadRequestException('Password is too common. Please choose a stronger password.');
    }
  }

  /**
   * Increment rate limit counter
   */
  private async incrementRateLimit(key: string): Promise<number> {
    const client = await this.redis.getClient();
    const count = await client.incr(key);

    // Set expiry on first request
    if (count === 1) {
      await this.redis.expire(key, this.RATE_LIMIT_WINDOW_SECONDS);
    }

    return count;
  }

  /**
   * Get remaining reset attempts
   */
  async getRemainingAttempts(email: string): Promise<{
    remaining: number;
    resetAt?: Date;
  }> {
    const normalizedEmail = email.trim().toLowerCase();
    const rateLimitKey = `password-reset:rate:${normalizedEmail}`;
    
    const countStr = await this.redis.get(rateLimitKey);
    const count = countStr ? parseInt(countStr, 10) : 0;
    const remaining = Math.max(0, this.MAX_RESET_REQUESTS - count);

    if (remaining === 0) {
      const ttl = await this.redis.ttl(rateLimitKey);
      const resetAt = new Date(Date.now() + ttl * 1000);
      return { remaining, resetAt };
    }

    return { remaining };
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(
    userId: string,
    tenantId: string | null,
    eventType: string,
    metadata: any
  ): Promise<void> {
    try {
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
          ${tenantId},
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

  /**
   * Admin: Invalidate all reset tokens for a user
   */
  async invalidateUserTokens(userId: string): Promise<void> {
    const tokenKey = `password-reset:token:${userId}`;
    await this.redis.del(tokenKey);
    this.logger.log(`Invalidated password reset tokens for user ${userId}`);
  }

  /**
   * Get active token info for monitoring (admin only)
   */
  async getActiveTokensCount(): Promise<number> {
    const tokenKeys = await this.redis.keys('password-reset:token:*');
    return tokenKeys.length;
  }
}
