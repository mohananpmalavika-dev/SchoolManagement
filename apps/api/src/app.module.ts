import { validateEnvironment } from './config/environment';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PortalScopeGuard } from './common/guards/portal-scope.guard';
import { TenantService } from './database/tenant.service';
import { TenantResolutionMiddleware } from './common/middleware/tenant-resolution.middleware';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { PlatformModule } from './modules/platform/platform.module';
import { StudentsModule } from './modules/students/students.module';
import { GuardiansModule } from './modules/guardians/guardians.module';
import { FeesModule } from './modules/fees/fees.module';
import { MpesaModule } from './modules/mpesa/mpesa.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { StaffModule } from './modules/staff/staff.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests
      },
    ]),

    // Database
    DatabaseModule,

    // Feature Modules
    AuthModule,
    WorkspaceModule,
    PlatformModule,
    StudentsModule,
    GuardiansModule,
    FeesModule,
    MpesaModule,
    AttendanceModule,
    ExaminationsModule,
    StaffModule,
    CommunicationsModule,
    TimetableModule,
    SubscriptionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }, { provide: APP_GUARD, useClass: JwtAuthGuard }, { provide: APP_GUARD, useClass: RolesGuard }, { provide: APP_GUARD, useClass: PortalScopeGuard }],
})
export class AppModule implements NestModule {
 constructor(private tenants:TenantService){}
 configure(consumer:MiddlewareConsumer){
  consumer.apply((req:any,res:any,next:()=>void)=>this.tenants.run(next),TenantResolutionMiddleware).forRoutes('{*path}');
 }
}
