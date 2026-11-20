import { validateEnvironment } from './config/environment';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PortalScopeGuard } from './common/guards/portal-scope.guard';
import { TenantService } from './database/tenant.service';
import { TenantResolutionMiddleware } from './common/middleware/tenant-resolution.middleware';
import { EncryptionUtil } from './common/utils/encryption.util';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { PlatformModule } from './modules/platform/platform.module';
import { StudentsModule } from './modules/students/students.module';
import { GuardiansModule } from './modules/guardians/guardians.module';
import { FeesModule } from './modules/fees/fees.module';
import { PaymentsGatewayModule } from './modules/payments-gateway/payments-gateway.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { StaffModule } from './modules/staff/staff.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { ChatModule } from './modules/chat/chat.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PredictiveAnalyticsModule } from './modules/predictive-analytics/predictive-analytics.module';
import { TeacherAIModule } from './modules/teacher-ai/teacher-ai.module';
import { AdvancedAnalyticsModule } from './modules/advanced-analytics/advanced-analytics.module';
import { ActivityFeedModule } from './modules/activity-feed/activity-feed.module';
import { MediaModule } from './modules/media/media.module';
import { BehaviorModule } from './modules/behavior/behavior.module';
import { HomeworkModule } from './modules/homework/homework.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ParentPortalModule } from './modules/parent-portal/parent-portal.module';
import { GovernmentModule } from './modules/government/government.module';
import { BackupModule } from './modules/backup/backup.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { ParentEngagementNotificationsModule } from './modules/parent-engagement-notifications/parent-engagement-notifications.module';
import { HrmsModule } from './modules/hrms/hrms.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OperationsHealthService } from './operations-health.service';
import { OperationsHealthController } from './operations-health.controller';
import { RedisService } from './common/services/redis.service';
import { OperationsModule } from './modules/operations/operations.module';
import { PreschoolModule } from './modules/preschool/preschool.module';
import { PushModule } from './modules/push/push.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
      envFilePath: ['.env.local', '.env'],
    }),

    // Schedule Module (for automated tasks like backups)
    ScheduleModule.forRoot(),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests
      },
    ]),

    // Bull Queue (for background jobs)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    // Database
    DatabaseModule,

    // Feature Modules
    AuthModule,
    WorkspaceModule,
    OperationsModule,
    PreschoolModule,
    PushModule,
    PlatformModule,
    StudentsModule,
    GuardiansModule,
    FeesModule,
    PaymentsGatewayModule,
    AttendanceModule,
    ExaminationsModule,
    StaffModule,
    CommunicationsModule,
    ChatModule,
    TimetableModule,
    SubscriptionsModule,
    PredictiveAnalyticsModule,
    TeacherAIModule,
    AdvancedAnalyticsModule,
    ActivityFeedModule,
    MediaModule,
    BehaviorModule,
    HomeworkModule,
    BookingsModule,
    ParentPortalModule,
    GovernmentModule,
    BackupModule,
    CertificatesModule,
    ParentEngagementNotificationsModule,
    HrmsModule,
  ],
  controllers: [AppController, OperationsHealthController],
  providers: [
    AppService,
    OperationsHealthService,
    RedisService,
    EncryptionUtil, // Global encryption utility for sensitive credentials
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PortalScopeGuard },
  ],
})
export class AppModule implements NestModule {
 constructor(private tenants:TenantService){}
 configure(consumer:MiddlewareConsumer){
  consumer.apply((req:any,res:any,next:()=>void)=>this.tenants.run(next),TenantResolutionMiddleware).forRoutes('{*path}');
 }
}
