import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validate } from 'class-validator';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetService } from './services/password-reset.service';
import { MfaService } from './services/mfa.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { cookieExtractor } from './strategies/jwt.strategy';

describe('HttpOnly Cookie Authentication Suite', () => {
  let controller: AuthController;
  let authService: Partial<Record<keyof AuthService, jest.Mock>>;

  const mockConfig: Record<string, any> = {
    NODE_ENV: 'production',
    JWT_ACCESS_TTL_SECONDS: 3600,
    JWT_REFRESH_TTL_SECONDS: 604800,
  };

  const configService = {
    get: jest.fn((key: string, fallback?: any) => mockConfig[key] ?? fallback),
    getOrThrow: jest.fn((key: string) => {
      if (mockConfig[key] === undefined) throw new Error(`Missing ${key}`);
      return mockConfig[key];
    }),
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      verifyMfaLogin: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      changePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: PasswordResetService, useValue: {} },
        { provide: MfaService, useValue: {} },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('cookieExtractor', () => {
    it('extracts token from req.cookies.accessToken', () => {
      const req = { cookies: { accessToken: 'cookie-jwt-token' } };
      expect(cookieExtractor(req)).toBe('cookie-jwt-token');
    });

    it('extracts token from req.cookies.access_token fallback', () => {
      const req = { cookies: { access_token: 'cookie-jwt-token-snake' } };
      expect(cookieExtractor(req)).toBe('cookie-jwt-token-snake');
    });

    it('extracts token from raw cookie header when cookie-parser was skipped', () => {
      const req = { headers: { cookie: 'other=123; accessToken=raw-header-jwt; session=abc' } };
      expect(cookieExtractor(req)).toBe('raw-header-jwt');
    });

    it('returns null if request has no cookies or matching tokens', () => {
      expect(cookieExtractor(null)).toBeNull();
      expect(cookieExtractor({})).toBeNull();
      expect(cookieExtractor({ cookies: {} })).toBeNull();
      expect(cookieExtractor({ headers: { cookie: 'unrelated=value' } })).toBeNull();
    });
  });

  describe('RefreshTokenDto validation', () => {
    it('accepts empty object when refresh token is provided via HttpOnly cookie', async () => {
      const dto = new RefreshTokenDto();
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('accepts string refresh token in body for API/mobile clients', async () => {
      const dto = new RefreshTokenDto();
      dto.refreshToken = 'explicit-refresh-token';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('AuthController cookie lifecycle', () => {
    it('sets HttpOnly accessToken and refreshToken cookies on successful login', async () => {
      authService.login!.mockResolvedValue({
        accessToken: 'new-access-jwt',
        refreshToken: 'new-refresh-jwt',
        user: { id: 'u1', role: 'PRINCIPAL' },
      });

      const res = {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      };

      const result = await controller.login(
        { email: 'admin@school.test', password: 'Password123!' },
        res as any,
      );

      expect(result).toHaveProperty('accessToken', 'new-access-jwt');
      expect(res.cookie).toHaveBeenCalledTimes(2);

      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'new-access-jwt',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 3600 * 1000,
        }),
      );

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-jwt',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 604800 * 1000,
        }),
      );
    });

    it('sets HttpOnly cookies on successful MFA verification', async () => {
      authService.verifyMfaLogin!.mockResolvedValue({
        accessToken: 'mfa-access-jwt',
        refreshToken: 'mfa-refresh-jwt',
        user: { id: 'u1', role: 'PRINCIPAL' },
      });

      const res = { cookie: jest.fn() };
      const result = await controller.verifyLoginMfa(
        { mfaSessionToken: 'session-token', code: '123456' },
        res as any,
      );

      expect(result).toHaveProperty('accessToken', 'mfa-access-jwt');
      expect(res.cookie).toHaveBeenCalledWith('accessToken', 'mfa-access-jwt', expect.any(Object));
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'mfa-refresh-jwt', expect.any(Object));
    });

    it('refreshes token from HttpOnly cookie when body is empty', async () => {
      authService.refreshToken!.mockResolvedValue({
        accessToken: 'refreshed-access-jwt',
      });

      const req = {
        cookies: { refreshToken: 'cookie-refresh-token' },
      };
      const res = { cookie: jest.fn() };

      const result = await controller.refresh(new RefreshTokenDto(), req as any, res as any);

      expect(authService.refreshToken).toHaveBeenCalledWith('cookie-refresh-token');
      expect(result).toEqual({ accessToken: 'refreshed-access-jwt' });
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'refreshed-access-jwt',
        expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'lax' }),
      );
    });

    it('throws UnauthorizedException when refresh token is missing in both body and cookie', async () => {
      const req = { cookies: {} };
      const res = { cookie: jest.fn() };

      await expect(
        controller.refresh(new RefreshTokenDto(), req as any, res as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('clears all authentication cookies upon logout', async () => {
      authService.logout!.mockResolvedValue({ message: 'Signed out of all sessions' });

      const req = { user: { userId: 'u1' } };
      const res = { clearCookie: jest.fn() };

      const result = await controller.logout(req as any, res as any);

      expect(authService.logout).toHaveBeenCalledWith('u1');
      expect(res.clearCookie).toHaveBeenCalledWith(
        'accessToken',
        expect.objectContaining({ httpOnly: true, path: '/' }),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({ httpOnly: true, path: '/' }),
      );
      expect(result).toHaveProperty('message');
    });
  });
});
