import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantService } from '../../database/tenant.service';

@Injectable()
export class SubscriptionsScopeInterceptor implements NestInterceptor {
  constructor(private readonly tenants: TenantService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.switchToHttp().getRequest().user?.role !== 'SUPER_ADMIN') {
      return next.handle();
    }
    // Authentication and role guards have already run. Platform operations need
    // a separate context; school principals must keep their tenant filter.
    return new Observable(subscriber =>
      this.tenants.run(() => next.handle().subscribe(subscriber))
    );
  }
}
