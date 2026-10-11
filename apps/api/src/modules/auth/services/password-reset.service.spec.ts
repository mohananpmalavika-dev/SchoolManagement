import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';
import { PrismaService } from '../../../database/prisma.service';
import { RedisService } from '../../../common/services/redis.service';
import { EmailService } from '../../../common/services/email.service';
import * as bcrypt from 'bcrypt';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let prisma: PrismaService;
  let redis: RedisService;
  let email: EmailService;
  let config: ConfigService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue({
      incr: jest.fn(),
    }),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
  };

  const mockEmailService = {
    sendPasswordReset: jest.fn(),
    sendPasswordChanged: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
    email = module.get<EmailService>(EmailService);
    config = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe('requestPasswordReset', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      tenantId: 'tenant-1',
    };

    it('should create reset token and send email for valid user', async () => {
      const redisClient = mockRedisService.getClient();
      redisClient.incr.mockResolvedValue(1);
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue(undefined);
      mockRedisService.expire.mockResolvedValue(true);
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.$executeRaw.mockResolvedValue(1);
      mockEmailService.sendPasswordReset.mockResolvedValue(undefined);

      const result = await service.requestPasswordReset(mockUser.email);

      expect(result).toEqual({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
      expect(mockRedisService.set).toHaveBeenCalled();
      expect(email.sendPasswordReset).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String),
        'John Doe'
      );
    });

    it('should return generic success message for non-existent user (security)', async () => {
      const redisClient = mockRedisService.getClient();
      redisClient.incr.mockResolvedValue(1);
      mockRedisService.expire.mockResolvedValue(true);
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.requestPasswordReset('nonexistent@example.com');

      expect(result).toEqual({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
      expect(mockRedisService.set).not.toHaveBeenCalled();
      expect(email.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('should enforce rate limiting (max attempts)', async () => {
      const redisClient = mockRedisService.getClient();
      redisClient.incr.mockResolvedValue(4); // Already exceeded max (3)
      mockRedisService.expire.mockResolvedValue(true);

      const result = await service.requestPasswordReset(mockUser.email);

      // Should still return success (security - prevent enumeration)
      expect(result).toEqual({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('should handle email service failures gracefully', async () => {
      const redisClient = mockRedisService.getClient();
      redisClient.incr.mockResolvedValue(1);
      mockRedisService.expire.mockResolvedValue(true);
      mockRedisService.set.mockResolvedValue(undefined);
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.$executeRaw.mockResolvedValue(1);
      mockEmailService.sendPasswordReset.mockRejectedValue(
        new Error('Email service down')
      );

      const result = await service.requestPasswordReset(mockUser.email);

      expect(result.success).toBe(true);
      // Should still return success to not leak user existence
    });
  });

  describe('verifyResetToken', () => {
    it('should return valid for matching token', async () => {
      const tokenHash = await require('bcryptjs').hash('valid-token', 10);
      mockRedisService.keys.mockResolvedValue(['password-reset:token:user-123']);
      mockRedisService.get.mockResolvedValue(JSON.stringify({
        tokenHash,
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
      }));

      const result = await service.verifyResetToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.email).toBe('test@example.com');
    });

    it('should return invalid for non-matching token', async () => {
      const tokenHash = await require('bcryptjs').hash('different-token', 10);
      mockRedisService.keys.mockResolvedValue(['password-reset:token:user-123']);
      mockRedisService.get.mockResolvedValue(JSON.stringify({
        tokenHash,
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
      }));

      const result = await service.verifyResetToken('wrong-token');

      expect(result.valid).toBe(false);
    });

    it('should return invalid when no tokens exist', async () => {
      mockRedisService.keys.mockResolvedValue([]);

      const result = await service.verifyResetToken('any-token');

      expect(result).toEqual({ valid: false });
    });
  });

  describe('resetPassword', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      tenantId: 'tenant-1',
      passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzGQxF5xtO', // "OldPassword123!"
    };

    it('should reset password with valid token and strong password', async () => {
      const tokenHash = await require('bcryptjs').hash('valid-token', 10);
      mockRedisService.keys.mockResolvedValue(['password-reset:token:user-123']);
      mockRedisService.get.mockResolvedValueOnce(JSON.stringify({
        tokenHash,
        userId: mockUser.id,
        email: mockUser.email,
        createdAt: new Date().toISOString(),
      }));
      mockRedisService.del.mockResolvedValue(1);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, passwordHash: 'new-hash' });
      mockPrismaService.$executeRaw.mockResolvedValue(1);
      mockEmailService.sendPasswordChanged.mockResolvedValue(undefined);

      const newPassword = 'StrongP@ssw0rd123';
      const result = await service.resetPassword('valid-token', newPassword);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Password reset successfully');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          passwordHash: expect.any(String),
          tokenVersion: { increment: 1 },
          mustChangePassword: false,
        }),
      });
      expect(mockRedisService.del).toHaveBeenCalledWith(`password-reset:token:${mockUser.id}`);
      expect(email.sendPasswordChanged).toHaveBeenCalledWith(
        mockUser.email,
        'John Doe'
      );
    });

    it('should reject weak password (too short)', async () => {
      mockPrismaService.passwordResetToken.findFirst.mockResolvedValue(validToken);

      await expect(service.resetPassword('valid-token', 'Short1!')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.resetPassword('valid-token', 'Short1!')).rejects.toThrow(
        'Password must be at least 12 characters long'
      );
    });

    it('should reject weak password (missing uppercase)', async () => {
      mockPrismaService.passwordResetToken.findFirst.mockResolvedValue(validToken);

      await expect(
        service.resetPassword('valid-token', 'weakpassword123!')
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject weak password (missing lowercase)', async () => {
      mockPrismaService.passwordResetToken.findFirst.mockResolvedValue(validToken);

      await expect(
        service.resetPassword('valid-token', 'WEAKPASSWORD123!')
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject weak password (missing number)', async () => {
      mockPrismaService.passwordResetToken.findFirst.mockResolvedValue(validToken);

      await expect(
        service.resetPassword('valid-token', 'WeakPassword!')
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject weak password (missing special char)', async () => {
      mockPrismaService.passwordResetToken.findFirst.mockResolvedValue(validToken);

      await expect(
        service.resetPassword('valid-token', 'WeakPassword123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject common passwords', async () => {
      mockPrismaService.passwordResetToken.findFirst.mockResolvedValue(validToken);

      await expect(
        service.resetPassword('valid-token', 'Password123!')
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.resetPassword('valid-token', 'Password123!')
      ).rejects.toThrow('Password is too common');
    });

    it('should reject invalid token', async () => {
      mockRedisService.keys.mockResolvedValue([]);

      await expect(
        service.resetPassword('invalid-token', 'StrongP@ssw0rd123')
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.resetPassword('invalid-token', 'StrongP@ssw0rd123')
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should reject expired token (handled by Redis TTL)', async () => {
      // When token expires, Redis returns null
      mockRedisService.keys.mockResolvedValue(['password-reset:token:user-123']);
      mockRedisService.get.mockResolvedValue(null);

      await expect(
        service.resetPassword('expired-token', 'StrongP@ssw0rd123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject token when user not found', async () => {
      const tokenHash = await require('bcryptjs').hash('valid-token', 10);
      mockRedisService.keys.mockResolvedValue(['password-reset:token:user-123']);
      mockRedisService.get.mockResolvedValue(JSON.stringify({
        tokenHash,
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: new Date().toISOString(),
      }));
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword('valid-token', 'StrongP@ssw0rd123')
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete token from Redis on successful reset', async () => {
      const tokenHash = await require('bcryptjs').hash('valid-token', 10);
      mockRedisService.keys.mockResolvedValue(['password-reset:token:user-123']);
      mockRedisService.get.mockResolvedValue(JSON.stringify({
        tokenHash,
        userId: mockUser.id,
        email: mockUser.email,
        createdAt: new Date().toISOString(),
      }));
      mockRedisService.del.mockResolvedValue(1);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser });
      mockPrismaService.$executeRaw.mockResolvedValue(1);

      await service.resetPassword('valid-token', 'StrongP@ssw0rd123');

      expect(mockRedisService.del).toHaveBeenCalledWith('password-reset:token:user-123');
    });
  });

  describe('getRemainingAttempts', () => {
    it('should return max attempts when no attempts made', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getRemainingAttempts('test@example.com');

      expect(result.remaining).toBe(3);
      expect(result.resetAt).toBeUndefined();
    });

    it('should return remaining attempts when some made', async () => {
      mockRedisService.get.mockResolvedValue('2');

      const result = await service.getRemainingAttempts('test@example.com');

      expect(result.remaining).toBe(1);
    });

    it('should return zero and reset time when max attempts reached', async () => {
      mockRedisService.get.mockResolvedValue('3');
      mockRedisService.ttl.mockResolvedValue(1800); // 30 minutes

      const result = await service.getRemainingAttempts('test@example.com');

      expect(result.remaining).toBe(0);
      expect(result.resetAt).toBeDefined();
      expect(result.resetAt).toBeInstanceOf(Date);
    });
  });
});
