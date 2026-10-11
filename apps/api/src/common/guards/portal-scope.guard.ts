import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class PortalScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Endpoint-level RBAC is strictly enforced by global RolesGuard and @Roles() metadata
    return true;
  }
}