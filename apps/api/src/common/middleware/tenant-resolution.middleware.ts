import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';

/**
 * Middleware to resolve tenant from:
 * 1. Subdomain (e.g., demo.kryptonschool.com)
 * 2. Custom domain (e.g., www.exampleschool.ac.ke)
 * 3. JWT token (tenantId claim)
 */
@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      let tenant = null;
      const host = req.hostname;

      // Try to resolve tenant from subdomain
      const subdomain = this.extractSubdomain(host);
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        tenant = await this.prisma.tenant.findUnique({
          where: { subdomain },
          select: { id: true, subdomain: true, status: true },
        });

        if (tenant) {
          this.tenantService.setSubdomain(subdomain);
        }
      }

      // Try to resolve tenant from custom domain
      if (!tenant) {
        tenant = await this.prisma.tenant.findUnique({
          where: { customDomain: host },
          select: { id: true, customDomain: true, status: true },
        });

        if (tenant) {
          this.tenantService.setCustomDomain(host);
        }
      }

      // Try to resolve tenant from explicit headers (for mobile/API clients and testing)
      if (!tenant) {
        const headerSubdomain = req.headers['x-tenant-subdomain'] as string;
        const headerTenantId = req.headers['x-tenant-id'] as string;
        if (headerSubdomain) {
          tenant = await this.prisma.tenant.findUnique({
            where: { subdomain: headerSubdomain.toLowerCase().trim() },
            select: { id: true, subdomain: true, status: true },
          });
          if (tenant) {
            this.tenantService.setSubdomain(headerSubdomain);
          }
        } else if (headerTenantId) {
          tenant = await this.prisma.tenant.findUnique({
            where: { id: headerTenantId.trim() },
            select: { id: true, subdomain: true, status: true },
          });
        }
      }

      // If tenant found, set tenant context
      if (tenant) {
        // Check if tenant is active
        if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
          throw new UnauthorizedException(
            `School account is ${tenant.status.toLowerCase()}. Please contact support.`
          );
        }

        this.tenantService.setTenantId(tenant.id);
      }

      next();
    } catch (error: any) {
      next(error);
    }
  }

  private extractSubdomain(host: string): string | null {
    // Remove port if present
    const hostname = host.split(':')[0];
    
    // Split by dots
    const parts = hostname.split('.');
    
    // If we have at least 3 parts (subdomain.domain.tld), extract subdomain
    if (parts.length >= 3) {
      return parts[0];
    }
    
    // For localhost or single domain, no subdomain
    return null;
  }
}
