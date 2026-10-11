import { Injectable, Scope } from '@nestjs/common';

/**
 * Service to manage tenant context in request scope
 * This uses AsyncLocalStorage pattern to maintain tenant context
 * throughout the request lifecycle
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantService {
  private tenantId: string | null = null;
  private subdomain: string | null = null;
  private customDomain: string | null = null;

  setTenantId(tenantId: string | null): void {
    this.tenantId = tenantId;
  }

  getTenantId(): string | null {
    return this.tenantId;
  }

  setSubdomain(subdomain: string | null): void {
    this.subdomain = subdomain;
  }

  getSubdomain(): string | null {
    return this.subdomain;
  }

  setCustomDomain(customDomain: string | null): void {
    this.customDomain = customDomain;
  }

  getCustomDomain(): string | null {
    return this.customDomain;
  }

  clearTenantContext(): void {
    this.tenantId = null;
    this.subdomain = null;
    this.customDomain = null;
  }

  hasTenantContext(): boolean {
    return this.tenantId !== null;
  }

  requireTenantContext(): string {
    if (!this.tenantId) {
      throw new Error('Tenant context is required but not set');
    }
    return this.tenantId;
  }
}
