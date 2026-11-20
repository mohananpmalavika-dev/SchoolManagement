import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { TenantService } from '../../database/tenant.service';
import { requireHr } from './hrms.policy';

/** Bind every HR actor to the school selected by authenticated tenant resolution. */
@Injectable()
export class HrScopeGuard implements CanActivate {
  constructor(private readonly tenants: TenantService) {}
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    requireHr(request.user);
    const tenantId = this.tenants.requireTenantContext();
    if (request.user.role === 'SUPER_ADMIN') {
      const selected = request.headers['x-tenant-id'];
      if (typeof selected !== 'string' || !isUUID(selected) || selected !== tenantId)
        throw new ForbiddenException('Select an active school before opening staff HR');
      request.user = { ...request.user, tenantId };
    } else if (request.user.tenantId !== tenantId) {
      throw new ForbiddenException('HR school context does not match your account');
    }
    return true;
  }
}
