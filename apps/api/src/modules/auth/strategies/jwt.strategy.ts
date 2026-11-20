import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { TenantService } from '../../../database/tenant.service';

export function cookieExtractor(req: any): string | null {
  if (!req) return null;
  if (req.cookies && (req.cookies.accessToken || req.cookies.access_token)) {
    return req.cookies.accessToken || req.cookies.access_token;
  }
  if (req.headers && req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)(?:accessToken|access_token)=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private prisma: PrismaService, private tenants: TenantService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }
  async validate(payload: any) {
    if (payload.type !== 'access') throw new UnauthorizedException('Invalid token type');
    // Resolve identity before applying the requested school scope; only the verified role
    // below may authorize a platform administrator to select another school.
    const user = await this.tenants.run(async () => await this.prisma.user.findUnique({ where: { id: payload.sub }, include: { tenant: true } }));
    if (!user || !user.isActive || user.tokenVersion !== payload.ver) throw new UnauthorizedException('Session expired');
    if (user.role !== 'SUPER_ADMIN' && !['ACTIVE', 'TRIAL'].includes(user.tenant.status)) throw new UnauthorizedException('School account inactive');
    const context = this.tenants.getTenantId();
    if (context && context !== user.tenantId && user.role !== 'SUPER_ADMIN') throw new UnauthorizedException('Access denied to this school');
    if (!context) this.tenants.setTenantId(user.tenantId);
    return { id: user.id, userId: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, tenantId: user.tenantId };
  }
}
