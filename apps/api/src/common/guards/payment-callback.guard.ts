import {Injectable,CanActivate,ExecutionContext,UnauthorizedException,ServiceUnavailableException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {timingSafeEqual} from 'node:crypto';
@Injectable()
export class PaymentCallbackGuard implements CanActivate{
 constructor(private config:ConfigService){}
 canActivate(context:ExecutionContext){
  const secret=this.config.get<string>('MPESA_CALLBACK_TOKEN');if(!secret)throw new ServiceUnavailableException('Payment callbacks are not configured');
  const req=context.switchToHttp().getRequest();const token=req.query.token;
  if(typeof token!=='string'||Buffer.byteLength(token)!==Buffer.byteLength(secret)||!timingSafeEqual(Buffer.from(token),Buffer.from(secret)))throw new UnauthorizedException('Invalid callback credential');
  return true;
 }
}