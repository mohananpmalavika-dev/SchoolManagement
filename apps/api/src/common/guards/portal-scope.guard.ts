import {Injectable,CanActivate,ExecutionContext,ForbiddenException} from '@nestjs/common';
@Injectable()
export class PortalScopeGuard implements CanActivate{
 canActivate(context:ExecutionContext){
  const req=context.switchToHttp().getRequest();const role=req.user?.role;
  if(!role)return true;
  const path=req.path.replace(/^\/api\/v1/,'');
  if(['PARENT','TEACHER','CLASS_TEACHER','EXAM_OFFICER','STUDENT'].includes(role)&&!path.startsWith('/workspace/')&&!path.startsWith('/auth/'))throw new ForbiddenException('Use your role-specific workspace');
  return true;
 }
}