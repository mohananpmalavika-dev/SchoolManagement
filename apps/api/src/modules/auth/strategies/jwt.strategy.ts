import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { TenantService } from '../../../database/tenant.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Verify user still exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Set tenant context from JWT if not already set
    if (!this.tenantService.getTenantId() && user.tenantId) {
      this.tenantService.setTenantId(user.tenantId);
    }

    // Verify tenant context matches user's tenant
    const contextTenantId = this.tenantService.getTenantId();
    if (contextTenantId && contextTenantId !== user.tenantId) {
      // Special case: Super admin can access any tenant
      if (user.role !== 'SUPER_ADMIN') {
        throw new UnauthorizedException('Access denied to this school');
      }
    }

    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
    };
  }
}
