import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantService } from '../../database/tenant.service';
import { SKIP_TENANT_CHECK_KEY } from '../decorators/skip-tenant-check.decorator';

/**
 * Guard to ensure tenant context is set
 * Most endpoints require a tenant context
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private tenantService: TenantService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route should skip tenant check (e.g., platform admin routes)
    const skipTenantCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_CHECK_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (skipTenantCheck) {
      return true;
    }

    // Require tenant context
    const tenantId = this.tenantService.getTenantId();
    
    if (!tenantId) {
      throw new UnauthorizedException(
        'Tenant context required. Please access via school domain or subdomain.'
      );
    }

    return true;
  }
}
