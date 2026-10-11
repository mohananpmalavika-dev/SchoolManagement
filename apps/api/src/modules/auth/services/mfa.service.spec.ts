import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { MfaService } from './mfa.service';
import { PrismaService } from '../../../database/prisma.service';
import { RedisService } from '../../../common/services/redis.service';
import * as bcrypt from 'bcryptjs';

// Mock otplib to avoid ESM issues with Jest
jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn(() => 'JBSWY3DPEHPK3PXP'),
    generate: jest.fn((secret: string) => '123456'),
    verify: jest.fn(({ token, secret }: { token: string; secret: string }) => {
      // Valid token for testing
      return token === '123456';
    }),
    keyuri: jest.fn((email: string, issuer: string, secret: string) => 
      `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`
    ),
    options: {},
  },
}));

// Mock QRCode to avoid rendering issues
jest.mock('qrcode', () => ({
  toDataURL: jest.fn((text: string) => Promise.resolve('data:image/png;base64,mockQRCode')),
}));

describe('MfaService', () => {
  let service: MfaService;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $executeRaw: jest.fn(),
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue({
      incr: jest.fn(),
    }),
    del: jest.fn(),
    expire: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MfaService>(MfaService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);

    jest.clearAllMocks();
  });

  describe('generateMfaSetup', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      mfaEnabled: false,
    };

    it('should generate MFA setup with secret, QR code, and backup codes', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser });
      mockPrismaService.$executeRaw.mockResolvedValue(1);

      const result = await service.generateMfaSetup(mockUser.id);

      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCodeDataUrl');
      expect(result).toHaveProperty('backupCodes');
      expect(result.secret).toBeTruthy();
      expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
      expect(result.backupCodes).toHaveLength(10);
      expect(result.backupCodes[0]).toHaveLength(8); // 4 bytes = 8 hex chars (configurable length)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          mfaSecret: expect.any(String),
          mfaBackupCodes: expect.any(Array),
          mfaEnabled: false,
        }),
      });
    });

    it('should reject if MFA is already enabled', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });

      await expect(service.generateMfaSetup(mockUser.id)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.generateMfaSetup(mockUser.id)).rejects.toThrow(
        'MFA is already enabled'
      );
    });

    it('should reject if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.generateMfaSetup('invalid-id')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('verifyAndEnableMfa', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      mfaEnabled: false,
      mfaSecret: null,
      tenantId: 'tenant-1',
    };

    it('should enable MFA with valid TOTP token', async () => {
      const secret = 'JBSWY3DPEHPK3PXP'; // Mocked secret
      const token = '123456'; // Mocked valid token

      const redisClient = mockRedisService.getClient();
      redisClient.incr.mockResolvedValue(1);
      mockRedisService.expire.mockResolvedValue(true);
      mockRedisService.del.mockResolvedValue(1);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        mfaSecret: secret,
      });
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });
      mockPrismaService.$executeRaw.mockResolvedValue(1);

      const result = await service.verifyAndEnableMfa(mockUser.id, token);

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully enabled');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { mfaEnabled: true },
      });
      expect(redis.del).toHaveBeenCalled();
    });

    it('should reject invalid TOTP token', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const invalidToken = '000000'; // Will not match mocked valid token

      const redisClient = mockRedisService.getClient();
      redisClient.incr.mockResolvedValue(1);
      mockRedisService.expire.mockResolvedValue(true);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        mfaSecret: secret,
      });

      await expect(
        service.verifyAndEnableMfa(mockUser.id, invalidToken)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should enforce rate limiting', async () => {
      const redisClient = mockRedisService.getClient();
      redisClient.incr.mockResolvedValue(6); // Exceeded limit of 5

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        mfaSecret: 'secret',
      });

      await expect(
        service.verifyAndEnableMfa(mockUser.id, '123456')
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.verifyAndEnableMfa(mockUser.id, '123456')
      ).rejects.toThrow('Too many verification attempts');
    });

    it('should reject if MFA already enabled', async () => {
      const redisClient = mockRedisService.getClient();
      redisClient.incr.mockResolvedValue(1);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        mfaEnabled: true,
      });

      await expect(
        service.verifyAndEnableMfa(mockUser.id, '123456')
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.verifyAndEnableMfa(mockUser.id, '123456')
      ).rejects.toThrow('MFA is already enabled');
    });

    it('should reject if MFA setup not found', async () => {
      const redisClient = mockRedisService.getClient();
      redisClient.incr.mockResolvedValue(1);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        mfaSecret: null,
      });

      await expect(
        service.verifyAndEnableMfa(mockUser.id, '123456')
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.verifyAndEnableMfa(mockUser.id, '123456')
      ).rejects.toThrow('MFA setup not found');
    });
  });

  describe('verifyMfaToken', () => {
    const mockUser = {
      id: 'user-123',
      mfaEnabled: true,
      mfaSecret: null,
      mfaBackupCodes: [],
    };

    it('should verify valid TOTP token', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const token = '123456'; // Mocked valid token

      const redisClient = mockRedisService.getClient();
      redisClient.incr.mockResolvedValue(1);
      mockRedisService.expire.mockResolvedValue(true);
      mockRedisService.del.mockResolvedValue(1);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        mfaSecret: secret,
      });

      const result = await service.verifyMfaToken(mockUser.id, token);

      expect(result).toBe(true);
      expect(redis.del).toHaveBeenCalled();
    });

    it('should verify valid backup code', async () => {
      const backupCode = 'a1b2c3d4e5f6g7h8';
      const hashedBackupCode = await bcrypt.hash(backupCode, 10);

      const redisClient = mockRedisService.getClient();
      redisClient.incr.mockResolvedValue(1);
      mockRedisService.expire.mockResolvedValue(true);
      mockRedisService.del.mockResolvedValue(1);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        mfaSecret: 'JBSWY3DPEHPK3PXP', // Mocked secret
        mfaBackupCodes: [hashedBackupCode, 'another-hash'],
      });
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        mfaBackupCodes: ['another-hash'],
      });
      mockPrismaService.$executeRaw.mockResolvedValue(1);

      const result = await service.verifyMfaToken(mockUser.id, backupCode);

      expect(result).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          mfaBackupCodes: ['another-hash'],
        },
      });
      expect(redis.del).toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      const secret = 'JBSWY3DPEHPK3PXP';

      const redisClient = mockRedisService.getClient();
      redisClient.incr.mockResolvedValue(1);
      mockRedisService.expire.mockResolvedValue(true);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        mfaSecret: secret,
      });

      const result = await service.verifyMfaToken(mockUser.id, '000000');

      expect(result).toBe(false);
    });

    it('should enforce rate limiting', async () => {
      const redisClient = mockRedisService.getClient();
      redisClient.incr.mockResolvedValue(6); // Exceeded limit

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        mfaSecret: 'secret',
      });

      await expect(service.verifyMfaToken(mockUser.id, '123456')).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.verifyMfaToken(mockUser.id, '123456')).rejects.toThrow(
        'Too many verification attempts'
      );
    });

    it('should reject if MFA not configured', async () => {
      const redisClient = mockRedisService.getClient();
      redisClient.incr.mockResolvedValue(1);

      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        mfaEnabled: false,
      });

      await expect(service.verifyMfaToken(mockUser.id, '123456')).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.verifyMfaToken(mockUser.id, '123456')).rejects.toThrow(
        'MFA not configured'
      );
    });
  });

  describe('disableMfa', () => {
    // Password hash for 'OldPassword123!' - generated with bcrypt.hash('OldPassword123!', 12)
    const passwordHash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // Actually let's just use bcrypt.compare in the test
    
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash,  // Will be generated fresh in the actual test
      mfaEnabled: true,
      tenantId: 'tenant-1',
    };

    it('should disable MFA with valid password', async () => {
      // Generate a fresh password hash for testing
      const passwordHash = await bcrypt.hash('OldPassword123!', 12);
      
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash,
      });
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
      });
      mockPrismaService.$executeRaw.mockResolvedValue(1);

      const result = await service.disableMfa(mockUser.id, 'OldPassword123!');

      expect(result.success).toBe(true);
      expect(result.message).toContain('disabled successfully');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: [],
        },
      });
    });

    it('should reject invalid password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.disableMfa(mockUser.id, 'WrongPassword123!')
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.disableMfa(mockUser.id, 'WrongPassword123!')
      ).rejects.toThrow('Invalid password');
    });

    it('should reject if MFA not enabled', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        mfaEnabled: false,
      });

      await expect(
        service.disableMfa(mockUser.id, 'OldPassword123!')
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.disableMfa(mockUser.id, 'OldPassword123!')
      ).rejects.toThrow('MFA is not enabled');
    });
  });

  describe('isMfaRequired', () => {
    it('should return true for SUPER_ADMIN', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ role: 'SUPER_ADMIN' });
      const result = await service.isMfaRequired('user-123');
      expect(result).toBe(true);
    });

    it('should return true for PRINCIPAL', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ role: 'PRINCIPAL' });
      const result = await service.isMfaRequired('user-123');
      expect(result).toBe(true);
    });

    it('should return false for other roles', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ role: 'TEACHER' });
      const result = await service.isMfaRequired('user-123');
      expect(result).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const result = await service.isMfaRequired('invalid-id');
      expect(result).toBe(false);
    });
  });

  describe('getMfaStatus', () => {
    it('should return MFA status', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        mfaEnabled: true,
        mfaBackupCodes: ['hash1', 'hash2', 'hash3'],
        role: 'SUPER_ADMIN',
      });

      const result = await service.getMfaStatus('user-123');

      expect(result).toEqual({
        enabled: true,
        required: true,
        backupCodesRemaining: 3,
      });
    });

    it('should handle user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMfaStatus('invalid-id')).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
