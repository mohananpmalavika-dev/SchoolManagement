import { Module } from '@nestjs/common';
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
  providers: [AppService],
})
export class AppModule {}
