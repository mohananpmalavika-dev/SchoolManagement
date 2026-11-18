import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsScopeInterceptor } from './subscriptions-scope.interceptor';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsScopeInterceptor],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
