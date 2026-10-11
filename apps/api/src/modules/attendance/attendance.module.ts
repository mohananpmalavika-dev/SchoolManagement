import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AttendanceService } from './attendance.service';
import { QRAttendanceService } from './services/qr-attendance.service';
import { AttendanceController } from './attendance.controller';
import { DatabaseModule } from '../../database/database.module';
import { RedisService } from '../../common/services/redis.service';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, QRAttendanceService, RedisService],
  exports: [AttendanceService, QRAttendanceService],
})
export class AttendanceModule {}

