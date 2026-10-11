import {Controller,Get,Post,Body,Request,HttpCode} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {IsString,MinLength,MaxLength} from 'class-validator';
import {AuthService} from './auth.service';
import {Public} from '../../common/decorators/public.decorator';
import {LoginDto} from './dto/login.dto';
import {RefreshTokenDto} from './dto/refresh-token.dto';
import {Throttle} from '@nestjs/throttler';
class ChangePasswordDto {
 @IsString() @MaxLength(128) currentPassword:string;
 @IsString() @MinLength(12) @MaxLength(128) newPassword:string;
}
@ApiTags('auth')
@Controller('auth')
export class AuthController {
 constructor(private auth:AuthService){}
 @Public() @Post('login') @HttpCode(200) @Throttle({default:{limit:10,ttl:60000}})
 login(@Body() dto:LoginDto){return this.auth.login(dto);}
 @Public() @Post('refresh') @HttpCode(200)
 refresh(@Body() dto:RefreshTokenDto){return this.auth.refreshToken(dto.refreshToken);}
 @Get('me') me(@Request() req:any){return {id:req.user.userId,...req.user};}
 @Post('logout') @HttpCode(200) logout(@Request() req:any){return this.auth.logout(req.user.userId);}
 @Post('password') @HttpCode(200) password(@Request() req:any,@Body() dto:ChangePasswordDto){return this.auth.changePassword(req.user.userId,dto.currentPassword,dto.newPassword);}
}