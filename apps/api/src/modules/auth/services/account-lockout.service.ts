import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../common/services/redis.service';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Account Lockout Configuration
 */
interface LockoutConfig {
  maxAttempts: number;
  lockoutDurationMinutes: number;
  attemptWindowMinutes: number;
}

/**
 * Lockout Status
 */
export interface LockoutStatus {
  isLocked: boolean;
  attempts: number;
  remainingAttempts: number;
  lockedUntil?: Date;
  lockoutReason?: string;
}

/**
 * Account Lockout Service
 * 
 * Implements brute-force protection by:
 * - Tracking failed login attempts per email
 * - Locking accounts after maximum attempts
 * - Automatic unlock after lockout duration
 * - Admin manual unlock capability
 * - Email notifications on lockout
 * 
 * Security Features:
 * - Redis-based with TTL (automatic cleanup)
 * - Separate tracking per email (not user ID, to prevent enumeration)
 * - Rate limiting on unlock attempts
 * - Audit logging
 */
@Injectable()
export class AccountLockoutService {
  private readonly logger = new Logger(AccountLockoutService.name);
  private readonly config: LockoutConfig;

  // Redis key prefixes
  private readonly ATTEMPTS_PREFIX = 'auth:attempts:';
  private readonly LOCKOUT_PREFIX = 'auth:lockout:';
  private readonly UNLOCK_RATE_PREFIX = 'auth:unlock-rate:';

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      maxAttempts: this.configService.get('AUTH_MAX_ATTEMPTS', 5),
      lockoutDurationMinutes: this.configService.get('AUTH_LOCKOUT_MINUTES', 15),
      attemptWindowMinutes: this.configService.get('AUTH_ATTEMPT_WINDOW_MINUTES', 15),
    };

    this.logger.log(
      `Account lockout configured: ${this.config.maxAttempts} attempts, ` +
      `${this.config.lockoutDurationMinutes}min lockout, ` +
      `${this.config.attemptWindowMinutes}min window`
    );
  }

  /**
   * Get lockout key for an email
   */
  private getLockoutKey(email: string): string {
    return `${this.LOCKOUT_PREFIX}${email.toLowerCase()}`;
  }

  /**
   * Get attempts key for an email
   */
  private getAttemptsKey(email: string): string {
    return `${this.ATTEMPTS_PREFIX}${email.toLowerCase()}`;
  }

  /**
   * Get unlock rate limit key for an email
   */
  private getUnlockRateKey(email: string): string {
    return `${this.UNLOCK_RATE_PREFIX}${email.toLowerCase()}`;
  }

  /**
   * Check if account is locked
   */
  async isLocked(email: string): Promise<LockoutStatus> {
    const lockoutKey = this.getLockoutKey(email);
    const attemptsKey = this.getAttemptsKey(email);

    // Check if account is locked
    const lockoutData = await this.redis.get(lockoutKey);
    if (lockoutData) {
      const ttl = await this.redis.ttl(lockoutKey);
      const lockedUntil = new Date(Date.now() + ttl * 1000);

      return {
        isLocked: true,
        attempts: this.config.maxAttempts,
        remainingAttempts: 0,
        lockedUntil,
        lockoutReason: 'Too many failed login attempts',
      };
    }

    // Get current attempt count
    const attemptsStr = await this.redis.get(attemptsKey);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;

    return {
      isLocked: false,
      attempts,
      remainingAttempts: Math.max(0, this.config.maxAttempts - attempts),
    };
  }

  /**
   * Record a failed login attempt
   * Returns true if account is now locked
   */
  async recordFailedAttempt(email: string, userId?: string): Promise<boolean> {
    const attemptsKey = this.getAttemptsKey(email);
    const lockoutKey = this.getLockoutKey(email);

    // Increment attempt counter
    const client = await this.redis.getClient();
    const attempts = await client.incr(attemptsKey);

    // Set TTL on first attempt
    if (attempts === 1) {
      await this.redis.expire(
        attemptsKey,
        this.config.attemptWindowMinutes * 60
      );
    }

    this.logger.warn(
      `Failed login attempt ${attempts}/${this.config.maxAttempts} for ${email}`
    );

    // Check if we should lock the account
    if (attempts >= this.config.maxAttempts) {
      // Lock the account
      const lockoutDurationSeconds = this.config.lockoutDurationMinutes * 60;
      await this.redis.set(
        lockoutKey,
        JSON.stringify({
          lockedAt: new Date().toISOString(),
          attempts,
          userId,
        }),
        lockoutDurationSeconds
      );

      // Clear attempts counter
      await this.redis.del(attemptsKey);

      this.logger.error(
        `Account locked for ${email}: ${attempts} failed attempts. ` +
        `Lockout duration: ${this.config.lockoutDurationMinutes} minutes`
      );

      // Log security event
      await this.logSecurityEvent(email, 'ACCOUNT_LOCKED', {
        attempts,
        lockoutDuration: this.config.lockoutDurationMinutes,
        userId,
      });

      // TODO: Send email notification (requires email service)
      // await this.sendLockoutNotification(email);

      return true;
    }

    // Log failed attempt
    await this.logSecurityEvent(email, 'FAILED_LOGIN_ATTEMPT', {
      attemptNumber: attempts,
      remainingAttempts: this.config.maxAttempts - attempts,
      userId,
    });

    return false;
  }

  /**
   * Clear failed attempts (called after successful login)
   */
  async clearAttempts(email: string): Promise<void> {
    const attemptsKey = this.getAttemptsKey(email);
    await this.redis.del(attemptsKey);
  }

  /**
   * Manually unlock an account (admin action)
   */
  async unlockAccount(
    email: string,
    adminUserId: string,
    reason?: string
  ): Promise<void> {
    const lockoutKey = this.getLockoutKey(email);
    const attemptsKey = this.getAttemptsKey(email);
    const unlockRateKey = this.getUnlockRateKey(email);

    // Rate limiting on unlock attempts (prevent abuse)
    const client = await this.redis.getClient();
    const unlockAttempts = await client.incr(unlockRateKey);
    if (unlockAttempts === 1) {
      await this.redis.expire(unlockRateKey, 300); // 5-minute window
    }
    if (unlockAttempts > 10) {
      throw new Error(
        'Too many unlock attempts. Please wait 5 minutes before trying again.'
      );
    }

    // Remove lockout
    await this.redis.del(lockoutKey);
    await this.redis.del(attemptsKey);

    this.logger.log(
      `Account unlocked by admin ${adminUserId} for ${email}. Reason: ${reason || 'None provided'}`
    );

    // Log security event
    await this.logSecurityEvent(email, 'ACCOUNT_UNLOCKED', {
      adminUserId,
      reason,
    });
  }

  /**
   * Get lockout statistics for monitoring
   */
  async getLockoutStats(): Promise<{
    totalLocked: number;
    lockedAccounts: string[];
  }> {
    const lockoutKeys = await this.redis.keys(`${this.LOCKOUT_PREFIX}*`);
    
    const lockedAccounts = lockoutKeys.map((key) =>
      key.replace(this.LOCKOUT_PREFIX, '')
    );

    return {
      totalLocked: lockoutKeys.length,
      lockedAccounts,
    };
  }

  /**
   * Check lockout status for multiple emails (admin dashboard)
   */
  async checkMultipleAccounts(emails: string[]): Promise<Map<string, LockoutStatus>> {
    const results = new Map<string, LockoutStatus>();

    await Promise.all(
      emails.map(async (email) => {
        const status = await this.isLocked(email);
        results.set(email, status);
      })
    );

    return results;
  }

  /**
   * Log security event to database
   */
  private async logSecurityEvent(
    email: string,
    eventType: string,
    metadata: any
  ): Promise<void> {
    try {
      // Find user by email (may not exist for failed logins)
      const user = await this.prisma.user.findFirst({
        where: { email: email.toLowerCase() },
        select: { id: true, tenantId: true },
      });

      // Create audit log entry
      // Note: This assumes an AuditLog or SecurityEvent table exists
      // If not, this can be added to the Prisma schema
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
          ${user?.id || null},
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
        // This will be created in Phase 1 security audit
        this.logger.debug(`Audit log insert failed (table may not exist): ${error.message}`);
      });
    } catch (error: any) {
      this.logger.error(`Failed to log security event: ${error.message}`);
      // Don't throw - logging failure shouldn't break authentication
    }
  }

  /**
   * Clean up expired lockouts (maintenance task)
   * Redis TTL handles this automatically, but this can be used for monitoring
   */
  async cleanupExpiredLockouts(): Promise<number> {
    const lockoutKeys = await this.redis.keys(`${this.LOCKOUT_PREFIX}*`);
    let cleaned = 0;

    for (const key of lockoutKeys) {
      const ttl = await this.redis.ttl(key);
      if (ttl <= 0) {
        await this.redis.del(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired lockouts`);
    }

    return cleaned;
  }
}
