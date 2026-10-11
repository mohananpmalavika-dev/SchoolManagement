import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantService } from '../../database/tenant.service';

/**
 * Decorator to get current tenant ID from request context
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantService: TenantService = request.tenantService;
    
    return tenantService?.getTenantId();
  },
);
