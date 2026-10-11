import {Controller,Get,Post,Body,Request,HttpCode,Query,Param} from '@nestjs/common';
import {ApiTags,ApiOperation,ApiResponse} from '@nestjs/swagger';
import {IsString,MinLength,MaxLength,IsEmail,IsOptional} from 'class-validator';
import {AuthService} from './auth.service';
import {PasswordResetService} from './services/password-reset.service';
import {Public} from '../../common/decorators/public.decorator';
import {Roles} from '../../common/decorators/roles.decorator';
import {LoginDto} from './dto/login.dto';
import {RefreshTokenDto} from './dto/refresh-token.dto';
import {Throttle} from '@nestjs/throttler';

class ChangePasswordDto {
 @IsString() @MaxLength(128) currentPassword:string;
 @IsString() @MinLength(12) @MaxLength(128) newPassword:string;
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
 @IsString() @MinLength(12) @MaxLength(128) newPassword:string;
}

class VerifyResetTokenDto {
 @IsString() token:string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
 constructor(
   private auth:AuthService,
   private passwordReset:PasswordResetService,
 ){}
 
 @Public() @Post('login') @HttpCode(200) @Throttle({default:{limit:10,ttl:60000}})
 @ApiOperation({ summary: 'Login with email and password' })
 @ApiResponse({ status: 200, description: 'Successfully authenticated' })
 @ApiResponse({ status: 401, description: 'Invalid credentials or account locked' })
 login(@Body() dto:LoginDto){return this.auth.login(dto);}
 
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
 @Roles('SUPER_ADMIN', 'PRINCIPAL')
 @ApiOperation({ summary: 'Unlock a locked account (admin only)' })
 @ApiResponse({ status: 200, description: 'Account unlocked successfully' })
 @ApiResponse({ status: 403, description: 'Insufficient permissions' })
 unlockAccount(@Request() req:any, @Body() dto:UnlockAccountDto){
   return this.auth.unlockAccount(req.user.userId, dto.email, dto.reason);
 }
 
 @Get('admin/lockout-status/:email')
 @Roles('SUPER_ADMIN', 'PRINCIPAL')
 @ApiOperation({ summary: 'Check lockout status for an email (admin only)' })
 @ApiResponse({ status: 200, description: 'Lockout status retrieved' })
 checkLockoutStatus(@Param('email') email:string){
   return this.auth.checkLockoutStatus(email);
 }
}
