import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AccountLockoutService } from './services/account-lockout.service';
import { MfaService } from './services/mfa.service';
import { validatePasswordStrength } from './utils/password-strength.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private accountLockout: AccountLockoutService,
    private mfa: MfaService,
  ) { }

  async validateUser(email: string, password: string) {
    const matches = await this.prisma.user.findMany({ where: { email: email.trim().toLowerCase(), isActive: true }, include: { tenant: true }, take: 2 });
    // Tenant domains resolve duplicate emails; shared hosts require globally unambiguous logins.
    if (matches.length !== 1) return null; const user = matches[0];
    if (!await bcrypt.compare(password, user.passwordHash)) return null;
    if (user.role !== 'SUPER_ADMIN' && !['ACTIVE', 'TRIAL'].includes(user.tenant.status)) throw new UnauthorizedException('Your school account is inactive. Contact support.');
    const { passwordHash, mfaSecret, ...safe } = user; return safe;
  }

  private publicUser(user: any) { return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, tenantId: user.tenantId }; }

  private issue(user: any) {
    const payload = { sub: user.id, tenantId: user.tenantId, ver: user.tokenVersion };
    return { accessToken: this.jwt.sign({ ...payload, type: 'access' }), refreshToken: this.jwt.sign({ ...payload, type: 'refresh' }, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET'), expiresIn: Number(this.config.get('JWT_REFRESH_TTL_SECONDS', 604800)) }), user: this.publicUser(user) };
  }

  async login(dto: LoginDto) {
    // Check if account is locked
    const lockoutStatus = await this.accountLockout.isLocked(dto.email);
    if (lockoutStatus.isLocked) {
      const minutesRemaining = lockoutStatus.lockedUntil
        ? Math.ceil((lockoutStatus.lockedUntil.getTime() - Date.now()) / 60000)
        : 0;
      throw new UnauthorizedException(
        `Account temporarily locked due to multiple failed login attempts. ` +
        `Please try again in ${minutesRemaining} minute(s).`
      );
    }

    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      // Record failed attempt
      const isNowLocked = await this.accountLockout.recordFailedAttempt(dto.email);

      if (isNowLocked) {
        throw new UnauthorizedException(
          `Account locked due to too many failed login attempts. ` +
          `Please try again in ${this.config.get('AUTH_LOCKOUT_MINUTES', 15)} minutes.`
        );
      }

      // Get remaining attempts
      const status = await this.accountLockout.isLocked(dto.email);
      throw new UnauthorizedException(
        `Invalid email or password. ${status.remainingAttempts} attempt(s) remaining before account lockout.`
      );
    }

    // Successful login - clear any failed attempts
    await this.accountLockout.clearAttempts(dto.email);

    if (user.mfaEnabled) {
      const mfaSessionToken = this.jwt.sign(
        { sub: user.id, tenantId: user.tenantId, ver: user.tokenVersion, type: 'mfa_pending' },
        { expiresIn: '5m' },
      );
      return {
        requiresMfa: true,
        mfaSessionToken,
        user: this.publicUser(user),
      };
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.issue(user);
  }

  async verifyMfaLogin(mfaSessionToken: string, code: string) {
    try {
      const payload = this.jwt.verify(mfaSessionToken);
      if (payload.type !== 'mfa_pending') {
        throw new UnauthorizedException('Invalid MFA session token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { tenant: true },
      });

      if (!user || !user.isActive || !user.mfaEnabled || user.tokenVersion !== payload.ver || user.tenantId !== payload.tenantId || (user.role !== 'SUPER_ADMIN' && !['ACTIVE', 'TRIAL'].includes(user.tenant.status))) {
        throw new UnauthorizedException('MFA session is no longer valid. Please sign in again.');
      }
      const isValid = await this.mfa.verifyMfaToken(payload.sub, code);
      if (!isValid) {
        throw new UnauthorizedException('Invalid verification code');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return this.issue(user);
    } catch (err: any) {
      if (err instanceof UnauthorizedException || err instanceof BadRequestException) {
        throw err;
      }
      throw new UnauthorizedException('MFA session expired or invalid');
    }
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwt.verify(token, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET') }); if (payload.type !== 'refresh') throw new Error('Invalid token type');
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, include: { tenant: true } });
      if (!user || !user.isActive || user.tokenVersion !== payload.ver || (user.role !== 'SUPER_ADMIN' && !['ACTIVE', 'TRIAL'].includes(user.tenant.status))) throw new Error('Session invalid');
      return { accessToken: this.jwt.sign({ sub: user.id, tenantId: user.tenantId, ver: user.tokenVersion, type: 'access' }) };
      return this.issue(user);
    } catch { throw new UnauthorizedException('Session expired. Please sign in again.'); }
  }

  async logout(userId: string) { await this.prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } }); return { message: 'Signed out of all sessions' }; }

  async changePassword(userId: string, current: string, next: string) {
    validatePasswordStrength(next);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !await bcrypt.compare(current, user.passwordHash)) throw new BadRequestException('Current password is incorrect');
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(next, 12), tokenVersion: { increment: 1 }, mustChangePassword: false } });
    return { message: 'Password changed. Sign in again.' };
  }

  /**
   * Admin endpoint to unlock a locked account
   */
  async unlockAccount(adminUserId: string, email: string, reason?: string) {
    await this.accountLockout.unlockAccount(email, adminUserId, reason);
    return { message: `Account ${email} has been unlocked` };
  }

  /**
   * Check lockout status for an email
   */
  async checkLockoutStatus(email: string) {
    return await this.accountLockout.isLocked(email);
  }
}
