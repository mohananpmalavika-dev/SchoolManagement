import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../modules/auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService Security Suite', () => {
  let authService: AuthService;
  let prisma: any;
  let jwt: any;
  let config: any;

  const mockUser = {
    id: 'user_123',
    email: 'admin@school.com',
    passwordHash: '',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'SCHOOL_ADMIN',
    tenantId: 'school_1',
    tokenVersion: 1,
    isActive: true,
    mfaEnabled: false,
    tenant: {
      id: 'school_1',
      status: 'ACTIVE',
    },
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
  });

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    jwt = {
      sign: jest.fn().mockImplementation((payload) => `mock_token_${payload.type || 'token'}`),
      verify: jest.fn(),
    };

    config = {
      get: jest.fn().mockImplementation((key, defaultVal) => defaultVal || 'test_val'),
      getOrThrow: jest.fn().mockImplementation((key) => `secret_for_${key}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should successfully validate user with correct credentials and active school', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await authService.validateUser('admin@school.com', 'CorrectPassword123!');

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockUser.id);
      expect(result?.email).toBe(mockUser.email);
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should return null on incorrect password', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await authService.validateUser('admin@school.com', 'WrongPassword!');

      expect(result).toBeNull();
    });

    it('should reject login if tenant account is suspended or inactive', async () => {
      const suspendedUser = {
        ...mockUser,
        tenant: { id: 'school_1', status: 'SUSPENDED' },
      };
      prisma.user.findMany.mockResolvedValue([suspendedUser]);

      await expect(
        authService.validateUser('admin@school.com', 'CorrectPassword123!'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should issue access token and refresh token upon successful authentication', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'admin@school.com',
        password: 'CorrectPassword123!',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
        }),
      );
    });

    it('should throw UnauthorizedException if credentials fail', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await expect(
        authService.login({
          email: 'nonexistent@school.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should rotate access token when refresh token and tokenVersion match', async () => {
      jwt.verify.mockReturnValue({
        sub: mockUser.id,
        tenantId: mockUser.tenantId,
        ver: 1,
        type: 'refresh',
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.refreshToken('valid_refresh_token');

      expect(result).toHaveProperty('accessToken');
    });

    it('should throw UnauthorizedException if tokenVersion has been bumped (revoked session)', async () => {
      jwt.verify.mockReturnValue({
        sub: mockUser.id,
        tenantId: mockUser.tenantId,
        ver: 1, // Old version
        type: 'refresh',
      });
      // Database has newer version (e.g. user logged out or changed password)
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        tokenVersion: 2,
      });

      await expect(authService.refreshToken('old_refresh_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should increment tokenVersion to revoke all active sessions', async () => {
      prisma.user.update.mockResolvedValue({ ...mockUser, tokenVersion: 2 });

      const response = await authService.logout(mockUser.id);

      expect(response).toEqual({ message: 'Signed out of all sessions' });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { tokenVersion: { increment: 1 } },
      });
    });
  });

  describe('changePassword', () => {
    it('should verify current password and increment tokenVersion on password update', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, tokenVersion: 2 });

      const response = await authService.changePassword(
        mockUser.id,
        'CorrectPassword123!',
        'NewStrongPassword456!',
      );

      expect(response).toEqual({ message: 'Password changed. Sign in again.' });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            tokenVersion: { increment: 1 },
            mustChangePassword: false,
          }),
        }),
      );
    });

    it('should throw BadRequestException if current password verification fails', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authService.changePassword(mockUser.id, 'WrongCurrentPassword', 'NewPassword!'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
