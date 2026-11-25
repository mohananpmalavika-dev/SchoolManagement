import { Injectable, CanActivate, ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class PortalScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // These controllers currently use shared in-memory sample data. They must not
    // accept official records until durable tenant-scoped implementations exist.
    if (process.env.NODE_ENV === 'production' && ['AdmissionsController', 'CertificatesController', 'TransportController'].includes(context.getClass().name)) {
      throw new ServiceUnavailableException('This preview service is not available in production yet.');
    }
    canActivate(_context: ExecutionContext): boolean {
      return true;
    }
  }
