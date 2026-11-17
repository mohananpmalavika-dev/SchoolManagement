import {TenantService} from './tenant.service';
import {createTenantFilterMiddleware} from '@krypton/database';
describe('tenant isolation',()=>{
 it('retains independent tenant context across concurrent asynchronous requests',async()=>{
  const tenants=new TenantService();
  const results=await Promise.all(['school-a','school-b'].map((id,index)=>tenants.run(async()=>{tenants.setTenantId(id);await new Promise(resolve=>setTimeout(resolve,index?5:15));return tenants.getTenantId();})));
  expect(results).toEqual(['school-a','school-b']);expect(tenants.getTenantId()).toBeNull();
 });
 it.each(['findUnique','update','delete','count','aggregate','upsert'])('scopes %s on tenant-bearing models',async action=>{
  const next=jest.fn(async params=>params);const middleware=createTenantFilterMiddleware(()=> 'school-a');
  await middleware({model:'Student',action:action as any,args:{where:{id:'student',tenantId:'school-b'},create:{firstName:'A'}},dataPath:[],runInTransaction:false},next);
  expect(next.mock.calls[0][0].args.where.tenantId).toBe('school-a');
 });
 it('uses the tenant primary key rather than a nonexistent tenantId column',async()=>{
  const next=jest.fn(async params=>params);await createTenantFilterMiddleware(()=> 'school-a')({model:'Tenant',action:'findMany',args:{},dataPath:[],runInTransaction:false},next);
  expect(next.mock.calls[0][0].args.where).toEqual({id:'school-a'});
 });
 it('scopes relation-only records through their parent',async()=>{
  const next=jest.fn(async params=>params);await createTenantFilterMiddleware(()=> 'school-a')({model:'GuardianStudentLink',action:'findMany',args:{},dataPath:[],runInTransaction:false},next);
  expect(next.mock.calls[0][0].args.where).toEqual({AND:[{guardian:{tenantId:'school-a'}}]});
 });
 it('rejects attempts to reassign records to another tenant',async()=>{
  const next=jest.fn();await expect(createTenantFilterMiddleware(()=> 'school-a')({model:'Student',action:'create',args:{data:{tenantId:'school-b'}},dataPath:[],runInTransaction:false},next)).rejects.toThrow('Cross-tenant');expect(next).not.toHaveBeenCalled();
 });
});
