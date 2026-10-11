import { Injectable,UnauthorizedException,BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
@Injectable()
export class AuthService {
 constructor(private prisma:PrismaService,private jwt:JwtService,private config:ConfigService){}
 async validateUser(email:string,password:string){
  const matches=await this.prisma.user.findMany({where:{email:email.trim().toLowerCase(),isActive:true},include:{tenant:true},take:2});
  // Tenant domains resolve duplicate emails; shared hosts require globally unambiguous logins.
  if(matches.length!==1)return null;const user=matches[0];
  if(!await bcrypt.compare(password,user.passwordHash))return null;
  if(user.role!=='SUPER_ADMIN'&&!['ACTIVE','TRIAL'].includes(user.tenant.status))throw new UnauthorizedException('Your school account is inactive. Contact support.');
  const {passwordHash,mfaSecret,...safe}=user;return safe;
 }
 private publicUser(user:any){return {id:user.id,email:user.email,firstName:user.firstName,lastName:user.lastName,role:user.role,tenantId:user.tenantId};}
 private issue(user:any){
  const payload={sub:user.id,tenantId:user.tenantId,ver:user.tokenVersion};
  return {accessToken:this.jwt.sign({...payload,type:'access'}),refreshToken:this.jwt.sign({...payload,type:'refresh'},{secret:this.config.getOrThrow('JWT_REFRESH_SECRET'),expiresIn:this.config.get('JWT_REFRESH_EXPIRES_IN','7d')}),user:this.publicUser(user)};
 }
 async login(dto:LoginDto){const user=await this.validateUser(dto.email,dto.password);if(!user)throw new UnauthorizedException('Invalid email or password');if(user.mfaEnabled)throw new UnauthorizedException('This account requires MFA. Contact your administrator to configure a supported sign-in provider.');await this.prisma.user.update({where:{id:user.id},data:{lastLoginAt:new Date()}});return this.issue(user);}
 async refreshToken(token:string){
  try {const payload=this.jwt.verify(token,{secret:this.config.getOrThrow('JWT_REFRESH_SECRET')});if(payload.type!=='refresh')throw new Error('Invalid token type');
   const user=await this.prisma.user.findUnique({where:{id:payload.sub},include:{tenant:true}});
   if(!user||!user.isActive||user.tokenVersion!==payload.ver||(user.role!=='SUPER_ADMIN'&&!['ACTIVE','TRIAL'].includes(user.tenant.status)))throw new Error('Session invalid');
   return {accessToken:this.jwt.sign({sub:user.id,tenantId:user.tenantId,ver:user.tokenVersion,type:'access'})};
  }catch{throw new UnauthorizedException('Session expired. Please sign in again.');}
 }
 async logout(userId:string){await this.prisma.user.update({where:{id:userId},data:{tokenVersion:{increment:1}}});return {message:'Signed out of all sessions'};}
 async changePassword(userId:string,current:string,next:string){
  const user=await this.prisma.user.findUnique({where:{id:userId}});
  if(!user||!await bcrypt.compare(current,user.passwordHash))throw new BadRequestException('Current password is incorrect');
  await this.prisma.user.update({where:{id:userId},data:{passwordHash:await bcrypt.hash(next,12),tokenVersion:{increment:1},mustChangePassword:false}});
  return {message:'Password changed. Sign in again.'};
 }
}