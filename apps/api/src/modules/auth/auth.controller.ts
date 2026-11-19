import {Controller,Get,Post,Body,Request,HttpCode,Query,Param,Delete} from '@nestjs/common';
import {ApiTags,ApiOperation,ApiResponse} from '@nestjs/swagger';
import {IsString,MinLength,MaxLength,IsEmail,IsOptional} from 'class-validator';
import {AuthService} from './auth.service';
import {PasswordResetService} from './services/password-reset.service';
import {MfaService} from './services/mfa.service';
import {Public} from '../../common/decorators/public.decorator';
import {Roles} from '../../common/decorators/roles.decorator';
import {UserRole} from '@krypton/types';
import {LoginDto} from './dto/login.dto';
import {RefreshTokenDto} from './dto/refresh-token.dto';
import {VerifyMfaTokenDto, DisableMfaDto, RegenerateBackupCodesDto} from './dto/mfa.dto';
import {Throttle} from '@nestjs/throttler';

class ChangePasswordDto {
 @IsString() @MaxLength(128) currentPassword:string;
 @IsString() @MinLength(6) @MaxLength(128) newPassword:string;
}

class UnlockAccountDto {
 @IsEmail() email:string;
 @IsOptional() @IsString() @MaxLength(500) reason?:string;
}

class RequestPasswordResetDto {
 @IsEmail() email:string;
}

class ResetPasswordDto {
 @IsString() token:string;
 @IsString() @MinLength(6) @MaxLength(128) newPassword:string;
}

class VerifyResetTokenDto {
 @IsString() token:string;
}

class VerifyLoginMfaDto {
 @IsString() @MinLength(1) @MaxLength(2048) mfaSessionToken:string;
 @IsString() @MinLength(6) @MaxLength(8) code:string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
 constructor(
   private auth:AuthService,
   private passwordReset:PasswordResetService,
   private mfa:MfaService,
 ){}
 
 @Public() @Post('login') @HttpCode(200) @Throttle({default:{limit:10,ttl:60000}})
 @ApiOperation({ summary: 'Login with email and password' })
 @ApiResponse({ status: 200, description: 'Successfully authenticated' })
 @ApiResponse({ status: 401, description: 'Invalid credentials or account locked' })
 login(@Body() dto:LoginDto){return this.auth.login(dto);}

 @Public() @Post('mfa/verify-login') @HttpCode(200) @Throttle({default:{limit:10,ttl:60000}})
 @ApiOperation({ summary: 'Verify MFA code during login and obtain access tokens' })
 @ApiResponse({ status: 200, description: 'Successfully authenticated via MFA' })
 @ApiResponse({ status: 401, description: 'Invalid or expired MFA code' })
 verifyLoginMfa(@Body() dto:VerifyLoginMfaDto){
   return this.auth.verifyMfaLogin(dto.mfaSessionToken, dto.code);
 }
 
 @Public() @Post('refresh') @HttpCode(200)
 @ApiOperation({ summary: 'Refresh access token' })
 refresh(@Body() dto:RefreshTokenDto){return this.auth.refreshToken(dto.refreshToken);}
 
 @Get('me') 
 @ApiOperation({ summary: 'Get current user profile' })
 me(@Request() req:any){return {id:req.user.userId,...req.user};}
 
 @Post('logout') @HttpCode(200) 
 @ApiOperation({ summary: 'Logout and invalidate all tokens' })
 logout(@Request() req:any){return this.auth.logout(req.user.userId);}
 
 @Post('password') @HttpCode(200) 
 @ApiOperation({ summary: 'Change password' })
 password(@Request() req:any,@Body() dto:ChangePasswordDto){return this.auth.changePassword(req.user.userId,dto.currentPassword,dto.newPassword);}
 
 @Post('admin/unlock-account') @HttpCode(200)
 @Roles(UserRole.SUPER_ADMIN, UserRole.PRINCIPAL)
 @ApiOperation({ summary: 'Unlock a locked account (admin only)' })
 @ApiResponse({ status: 200, description: 'Account unlocked successfully' })
 @ApiResponse({ status: 403, description: 'Insufficient permissions' })
 unlockAccount(@Request() req:any, @Body() dto:UnlockAccountDto){
   return this.auth.unlockAccount(req.user.userId, dto.email, dto.reason);
 }
 
 @Get('admin/lockout-status/:email')
 @Roles(UserRole.SUPER_ADMIN, UserRole.PRINCIPAL)
 @ApiOperation({ summary: 'Check lockout status for an email (admin only)' })
 @ApiResponse({ status: 200, description: 'Lockout status retrieved' })
 checkLockoutStatus(@Param('email') email:string){
   return this.auth.checkLockoutStatus(email);
 }
 
 @Public() @Post('password-reset/request') @HttpCode(200)
 @Throttle({default:{limit:3,ttl:3600000}}) // 3 requests per hour
 @ApiOperation({ summary: 'Request password reset link via email' })
 @ApiResponse({ status: 200, description: 'Password reset email sent (if account exists)' })
 @ApiResponse({ status: 429, description: 'Too many password reset requests' })
 requestPasswordReset(@Body() dto:RequestPasswordResetDto){
   return this.passwordReset.requestPasswordReset(dto.email);
 }
 
 @Public() @Post('password-reset/verify') @HttpCode(200)
 @ApiOperation({ summary: 'Verify password reset token validity' })
 @ApiResponse({ status: 200, description: 'Token is valid' })
 @ApiResponse({ status: 400, description: 'Token is invalid or expired' })
 verifyResetToken(@Body() dto:VerifyResetTokenDto){
   return this.passwordReset.verifyResetToken(dto.token);
 }
 
 @Public() @Post('password-reset/reset') @HttpCode(200)
 @ApiOperation({ summary: 'Reset password using valid token' })
 @ApiResponse({ status: 200, description: 'Password successfully reset' })
 @ApiResponse({ status: 400, description: 'Token is invalid, expired, or password is weak' })
 resetPassword(@Body() dto:ResetPasswordDto){
   return this.passwordReset.resetPassword(dto.token, dto.newPassword);
 }
 
 @Public() @Get('password-reset/attempts/:email')
 @ApiOperation({ summary: 'Get remaining password reset attempts for email' })
 @ApiResponse({ status: 200, description: 'Remaining attempts retrieved' })
 getRemainingAttempts(@Param('email') email:string){
   return this.passwordReset.getRemainingAttempts(email);
 }

 // MFA Endpoints
 @Post('mfa/setup') @HttpCode(200)
 @ApiOperation({ summary: 'Generate MFA setup (QR code and backup codes)' })
 @ApiResponse({ status: 200, description: 'MFA setup generated' })
 @ApiResponse({ status: 400, description: 'MFA already enabled' })
 generateMfaSetup(@Request() req:any){
   return this.mfa.generateMfaSetup(req.user.userId);
 }
 
 @Post('mfa/verify-enable') @HttpCode(200)
 @Throttle({default:{limit:5,ttl:300000}}) // 5 attempts per 5 minutes
 @ApiOperation({ summary: 'Verify TOTP token and enable MFA' })
 @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
 @ApiResponse({ status: 401, description: 'Invalid token' })
 @ApiResponse({ status: 429, description: 'Too many verification attempts' })
 verifyAndEnableMfa(@Request() req:any, @Body() dto:VerifyMfaTokenDto){
   return this.mfa.verifyAndEnableMfa(req.user.userId, dto.token);
 }
 
 @Delete('mfa') @HttpCode(200)
 @ApiOperation({ summary: 'Disable MFA (requires password confirmation)' })
 @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
 @ApiResponse({ status: 401, description: 'Invalid password' })
 disableMfa(@Request() req:any, @Body() dto:DisableMfaDto){
   return this.mfa.disableMfa(req.user.userId, dto.password);
 }
 
 @Post('mfa/backup-codes/regenerate') @HttpCode(200)
 @ApiOperation({ summary: 'Regenerate backup codes (requires MFA token)' })
 @ApiResponse({ status: 200, description: 'Backup codes regenerated' })
 @ApiResponse({ status: 401, description: 'Invalid MFA token' })
 regenerateBackupCodes(@Request() req:any, @Body() dto:RegenerateBackupCodesDto){
   return this.mfa.regenerateBackupCodes(req.user.userId, dto.mfaToken);
 }
 
 @Get('mfa/status')
 @ApiOperation({ summary: 'Get MFA status for current user' })
 @ApiResponse({ status: 200, description: 'MFA status retrieved' })
 getMfaStatus(@Request() req:any){
   return this.mfa.getMfaStatus(req.user.userId);
 }
}
