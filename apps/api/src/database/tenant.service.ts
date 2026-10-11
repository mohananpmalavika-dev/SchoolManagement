import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
interface TenantContext { tenantId: string | null; subdomain: string | null; customDomain: string | null }
@Injectable()
export class TenantService {
 private readonly storage = new AsyncLocalStorage<TenantContext>();
 run<T>(operation:()=>T):T {return this.storage.run({tenantId:null,subdomain:null,customDomain:null},operation);}
 private context(){const value=this.storage.getStore();if(!value)throw new Error('Tenant request context is not initialized');return value;}
 setTenantId(id:string|null){this.context().tenantId=id;}
 getTenantId(){return this.storage.getStore()?.tenantId||null;}
 setSubdomain(value:string|null){this.context().subdomain=value;}
 getSubdomain(){return this.storage.getStore()?.subdomain||null;}
 setCustomDomain(value:string|null){this.context().customDomain=value;}
 getCustomDomain(){return this.storage.getStore()?.customDomain||null;}
 getTenantContext(){return this.storage.getStore()||null;}
 clearTenantContext(){Object.assign(this.context(),{tenantId:null,subdomain:null,customDomain:null});}
 hasTenantContext(){return !!this.getTenantId();}
 requireTenantContext():string {const id=this.getTenantId();if(!id)throw new Error('Tenant context required');return id;}
}