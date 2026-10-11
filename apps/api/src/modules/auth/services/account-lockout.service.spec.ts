import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AccountLockoutService } from './account-lockout.service';
import { RedisService } from '../../../common/services/redis.service';
import { PrismaService } from '../../../database/prisma.service';

describe('AccountLockoutService', () => {
  let service: AccountLockoutService;
  let redisService: RedisService;
  let prismaService: PrismaService;

  const mockRedisClient = {
    incr: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
    expire: jest.fn(),
    keys: jest.fn(),
  };

  const mockRedisService = {
    getClient: jest.fn(() => mockRedisClient),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
    expire: jest.fn(),
    keys: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
    },
    $executeRaw: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        AUTH_MAX_ATTEMPTS: 5,
        AUTH_LOCKOUT_MINUTES: 15,
        AUTH_ATTEMPT_WINDOW_MINUTES: 15,
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountLockoutService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AccountLockoutService>(AccountLockoutService);
    redisService = module.get<RedisService>(RedisService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('isLocked', () => {
    it('should return not locked for new email', async () => {
      mockRedisService.get.mockResolvedValueOnce(null); // lockout key
      mockRedisService.get.mockResolvedValueOnce(null); // attempts key

      const result = await service.isLocked('test@example.com');

      expect(result.isLocked).toBe(false);
      expect(result.attempts).toBe(0);
      expect(result.remainingAttempts).toBe(5);
    });

    it('should return locked status with remaining time', async () => {
      mockRedisService.get.mockResolvedValueOnce(
        JSON.stringify({ lockedAt: new Date().toISOString(), attempts: 5 })
      );
      mockRedisService.ttl.mockResolvedValueOnce(600); // 10 minutes remaining

      const result = await service.isLocked('test@example.com');

      expect(result.isLocked).toBe(true);
      expect(result.attempts).toBe(5);
      expect(result.remainingAttempts).toBe(0);
      expect(result.lockedUntil).toBeInstanceOf(Date);
      expect(result.lockoutReason).toBe('Too many failed login attempts');
    });

    it('should return attempt count when not locked', async () => {
      mockRedisService.get.mockResolvedValueOnce(null); // lockout key
      mockRedisService.get.mockResolvedValueOnce('3'); // attempts key

      const result = await service.isLocked('test@example.com');

      expect(result.isLocked).toBe(false);
      expect(result.attempts).toBe(3);
      expect(result.remainingAttempts).toBe(2);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should increment attempt counter on first failure', async () => {
      mockRedisClient.incr.mockResolvedValueOnce(1);
      mockPrismaService.user.findFirst.mockResolvedValueOnce(null);

      const isLocked = await service.recordFailedAttempt('test@example.com');

      expect(isLocked).toBe(false);
      expect(mockRedisClient.incr).toHaveBeenCalledWith('auth:attempts:test@example.com');
      expect(mockRedisService.expire).toHaveBeenCalledWith(
        'auth:attempts:test@example.com',
        900 // 15 minutes
      );
    });

    it('should not lock account before max attempts', async () => {
      mockRedisClient.incr.mockResolvedValueOnce(4);
      mockPrismaService.user.findFirst.mockResolvedValueOnce(null);

      const isLocked = await service.recordFailedAttempt('test@example.com');

      expect(isLocked).toBe(false);
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('should lock account after max attempts', async () => {
      mockRedisClient.incr.mockResolvedValueOnce(5);
      mockPrismaService.user.findFirst.mockResolvedValueOnce({
        id: 'user-123',
        tenantId: 'tenant-123',
      });

      const isLocked = await service.recordFailedAttempt('test@example.com', 'user-123');

      expect(isLocked).toBe(true);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        'auth:lockout:test@example.com',
        expect.any(String),
        900 // 15 minutes
      );
      expect(mockRedisService.del).toHaveBeenCalledWith('auth:attempts:test@example.com');
    });

    it('should log security event on lockout', async () => {
      mockRedisClient.incr.mockResolvedValueOnce(5);
      mockPrismaService.user.findFirst.mockResolvedValueOnce({
        id: 'user-123',
        tenantId: 'tenant-123',
      });
      mockPrismaService.$executeRaw.mockResolvedValueOnce(1);

      await service.recordFailedAttempt('test@example.com', 'user-123');

      expect(mockPrismaService.$executeRaw).toHaveBeenCalled();
    });
  });

  describe('clearAttempts', () => {
    it('should clear failed attempts for email', async () => {
      mockRedisService.del.mockResolvedValueOnce(1);

      await service.clearAttempts('test@example.com');

      expect(mockRedisService.del).toHaveBeenCalledWith('auth:attempts:test@example.com');
    });
  });

  describe('unlockAccount', () => {
    it('should unlock account and clear attempts', async () => {
      mockRedisClient.incr.mockResolvedValueOnce(1);
      mockRedisService.del.mockResolvedValue(1);
      mockPrismaService.user.findFirst.mockResolvedValueOnce({
        id: 'user-123',
        tenantId: 'tenant-123',
      });

      await service.unlockAccount('test@example.com', 'admin-123', 'User requested unlock');

      expect(mockRedisService.del).toHaveBeenCalledWith('auth:lockout:test@example.com');
      expect(mockRedisService.del).toHaveBeenCalledWith('auth:attempts:test@example.com');
    });

    it('should rate limit unlock attempts', async () => {
      mockRedisClient.incr.mockResolvedValueOnce(11); // Exceed rate limit

      await expect(
        service.unlockAccount('test@example.com', 'admin-123')
      ).rejects.toThrow('Too many unlock attempts');
    });

    it('should allow unlock within rate limit', async () => {
      mockRedisClient.incr.mockResolvedValueOnce(5); // Within limit
      mockRedisService.del.mockResolvedValue(1);
      mockPrismaService.user.findFirst.mockResolvedValueOnce(null);

      await service.unlockAccount('test@example.com', 'admin-123');

      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });

  describe('getLockoutStats', () => {
    it('should return lockout statistics', async () => {
      mockRedisService.keys.mockResolvedValueOnce([
        'auth:lockout:user1@example.com',
        'auth:lockout:user2@example.com',
      ]);

      const stats = await service.getLockoutStats();

      expect(stats.totalLocked).toBe(2);
      expect(stats.lockedAccounts).toEqual(['user1@example.com', 'user2@example.com']);
    });

    it('should return zero when no accounts locked', async () => {
      mockRedisService.keys.mockResolvedValueOnce([]);

      const stats = await service.getLockoutStats();

      expect(stats.totalLocked).toBe(0);
      expect(stats.lockedAccounts).toEqual([]);
    });
  });

  describe('checkMultipleAccounts', () => {
    it('should check lockout status for multiple emails', async () => {
      mockRedisService.get
        .mockResolvedValueOnce(null) // user1 lockout
        .mockResolvedValueOnce('2') // user1 attempts
        .mockResolvedValueOnce(JSON.stringify({ lockedAt: new Date().toISOString() })) // user2 lockout
        .mockResolvedValueOnce(null); // user2 attempts (not checked when locked)

      mockRedisService.ttl.mockResolvedValueOnce(600);

      const results = await service.checkMultipleAccounts([
        'user1@example.com',
        'user2@example.com',
      ]);

      expect(results.size).toBe(2);
      expect(results.get('user1@example.com')?.isLocked).toBe(false);
      expect(results.get('user1@example.com')?.attempts).toBe(2);
      expect(results.get('user2@example.com')?.isLocked).toBe(true);
    });
  });

  describe('cleanupExpiredLockouts', () => {
    it('should clean up expired lockouts', async () => {
      mockRedisService.keys.mockResolvedValueOnce([
        'auth:lockout:expired1@example.com',
        'auth:lockout:expired2@example.com',
        'auth:lockout:active@example.com',
      ]);

      mockRedisService.ttl
        .mockResolvedValueOnce(-1) // expired
        .mockResolvedValueOnce(-2) // expired
        .mockResolvedValueOnce(300); // active

      mockRedisService.del.mockResolvedValue(1);

      const cleaned = await service.cleanupExpiredLockouts();

      expect(cleaned).toBe(2);
      expect(mockRedisService.del).toHaveBeenCalledTimes(2);
    });

    it('should return zero when no expired lockouts', async () => {
      mockRedisService.keys.mockResolvedValueOnce([]);

      const cleaned = await service.cleanupExpiredLockouts();

      expect(cleaned).toBe(0);
    });
  });
});
