import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { OperationsHealthService } from './operations-health.service';
import { OperationsHealthController } from './operations-health.controller';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantService } from './database/tenant.service';

describe('Operator go-live health',()=>{
  function fixture(){
    const core:any={getDetailedHealth:jest.fn().mockResolvedValue({})};
    const db:any={user:{count:jest.fn().mockResolvedValue(1)}};
    const storage:any={checkConnectivity:jest.fn().mockResolvedValue('healthy')};
    const email:any={checkConnectivity:jest.fn().mockResolvedValue('healthy')};
    const backups:any={operationalStatus:jest.fn().mockResolvedValue({localStorage:'healthy',offsite:'healthy',backup:'healthy',rehearsal:'healthy'})};
    return {core,db,storage,email,backups,service:new OperationsHealthService(core,db,new TenantService(),storage,email,backups,new ConfigService({NODE_ENV:'production'}))};
  }
  it('requires storage, SMTP, offsite freshness and a rehearsed restore in production',async()=>{
    const {service,db}=fixture();expect((await service.report()).status).toBe('ready');
    expect(db.user.count).toHaveBeenCalledWith({where:{role:'SUPER_ADMIN',isActive:true,mustChangePassword:false,mfaEnabled:true}});
    const broken=fixture();broken.backups.operationalStatus.mockResolvedValue({localStorage:'healthy',backup:'healthy',offsite:'unconfigured',rehearsal:'unverified'});
    const report=await broken.service.report();expect(report.status).toBe('degraded');expect(report.required).toContain('restoreRehearsal');
    expect(report.acceptance.government).toBe('manual-submission-only');
  });
  it('sanitizes failures and reports missing initial administrator setup',async()=>{
    const {service,storage,db}=fixture();storage.checkConnectivity.mockRejectedValue(new Error('PRIVATE credentials'));db.user.count.mockResolvedValue(0);
    const report=await service.report();expect(report.checks.storage).toBe('unhealthy');expect(report.checks.administrator).toBe('unconfigured');
    expect(JSON.stringify(report)).not.toContain('PRIVATE');
  });
  it('bounds dependencies and shares concurrent probes',async()=>{
    jest.useFakeTimers();try{
      const {service,email}=fixture();email.checkConnectivity.mockReturnValue(new Promise(()=>{}));
      const first=service.report(),second=service.report();expect(first).toBe(second);
      await jest.advanceTimersByTimeAsync(3501);expect((await first).checks.smtp).toBe('unhealthy');
      await service.report();expect(email.checkConnectivity).toHaveBeenCalledTimes(1);
    } finally{jest.useRealTimers();}
  });
  it('restricts diagnostics to authenticated platform administrators',()=>{
    const guard=new RolesGuard(new Reflector());
    const context=(role:string)=>({getClass:()=>OperationsHealthController,getHandler:()=>OperationsHealthController.prototype.health,
      switchToHttp:()=>({getRequest:()=>({user:{role}})})}) as any;
    expect(guard.canActivate(context('SUPER_ADMIN'))).toBe(true);
    for(const role of ['PRINCIPAL','PARENT','TEACHER','STUDENT','UNKNOWN'])expect(()=>guard.canActivate(context(role))).toThrow();
  });
});
