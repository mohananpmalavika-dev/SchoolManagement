import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountLockoutService } from './services/account-lockout.service';
import { PasswordResetService } from './services/password-reset.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RedisService } from '../../common/services/redis.service';
import { EmailService } from '../../common/services/email.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(configService.get('JWT_ACCESS_TTL_SECONDS', 900)),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    AccountLockoutService, 
    PasswordResetService,
    EmailService,
    RedisService, 
    JwtStrategy, 
    LocalStrategy
  ],
  exports: [AuthService, AccountLockoutService],
})
export class AuthModule {}

