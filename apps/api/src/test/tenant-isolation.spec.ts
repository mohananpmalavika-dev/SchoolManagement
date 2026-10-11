import { createTenantFilterMiddleware } from '@krypton/database';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { TenantService } from '../database/tenant.service';

describe('Tenant Isolation Verification Suite', () => {
  describe('Prisma Tenant Filter Middleware', () => {
    let currentTenantId: string | null = null;
    const getTenantId = () => currentTenantId;
    const middleware = createTenantFilterMiddleware(getTenantId);

    beforeEach(() => {
      currentTenantId = 'school_alpha_123';
    });

    it('should inject tenantId into where clause for direct models on findMany', async () => {
      const next = jest.fn().mockResolvedValue([]);
      const params = {
        model: 'Student' as any,
        action: 'findMany' as any,
        args: { where: { firstName: 'Alice' } },
        dataPath: [],
        runInTransaction: false,
      };

      await middleware(params, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(params.args.where).toEqual({
        firstName: 'Alice',
        tenantId: 'school_alpha_123',
      });
    });

    it('should override cross-tenant where clause injection to enforce isolation', async () => {
      const next = jest.fn().mockResolvedValue([]);
      const params = {
        model: 'Student' as any,
        action: 'findMany' as any,
        args: { where: { tenantId: 'school_beta_hacker' } },
        dataPath: [],
        runInTransaction: false,
      };

      await middleware(params, next);

      expect(next).toHaveBeenCalledTimes(1);
      // School A tenant context must override the malicious School B attempt
      expect(params.args.where.tenantId).toBe('school_alpha_123');
    });

    it('should convert findUnique to findFirst to enforce tenant scoping', async () => {
      const next = jest.fn().mockResolvedValue(null);
      const params = {
        model: 'Staff' as any,
        action: 'findUnique' as any,
        args: { where: { id: 'staff_999' } },
        dataPath: [],
        runInTransaction: false,
      };

      await middleware(params, next);

      expect(params.action).toBe('findFirst');
      expect(params.args.where).toEqual({
        id: 'staff_999',
        tenantId: 'school_alpha_123',
      });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should reject cross-tenant creation with Forbidden Error', async () => {
      const next = jest.fn();
      const params = {
        model: 'Student' as any,
        action: 'create' as any,
        args: {
          data: {
            firstName: 'Bob',
            tenantId: 'school_beta_456', // Attempting to write into another school
          },
        },
        dataPath: [],
        runInTransaction: false,
      };

      await expect(middleware(params, next)).rejects.toThrow('Cross-tenant write denied');
      expect(next).not.toHaveBeenCalled();
    });

    it('should assign current tenantId to created records when matching or omitted', async () => {
      const next = jest.fn().mockResolvedValue({ id: 'rec_1' });
      const params = {
        model: 'Student' as any,
        action: 'create' as any,
        args: {
          data: {
            firstName: 'Charlie',
          },
        },
        dataPath: [],
        runInTransaction: false,
      };

      await middleware(params, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect((params.args.data as any).tenantId).toBe('school_alpha_123');
    });

    it('should reject cross-tenant batch insertion in createMany', async () => {
      const next = jest.fn();
      const params = {
        model: 'Student' as any,
        action: 'createMany' as any,
        args: {
          data: [
            { firstName: 'Student 1', tenantId: 'school_alpha_123' },
            { firstName: 'Student 2', tenantId: 'school_beta_hacker' },
          ],
        },
        dataPath: [],
        runInTransaction: false,
      };

      await expect(middleware(params, next)).rejects.toThrow('Cross-tenant write denied');
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject tenant reassignment during update operations', async () => {
      const next = jest.fn();
      const params = {
        model: 'Staff' as any,
        action: 'update' as any,
        args: {
          where: { id: 'staff_1' },
          data: {
            tenantId: 'school_stolen_id',
          },
        },
        dataPath: [],
        runInTransaction: false,
      };

      await expect(middleware(params, next)).rejects.toThrow('Tenant reassignment denied');
      expect(next).not.toHaveBeenCalled();
    });

    it('should bypass tenant filtering for exempt global models like Plan', async () => {
      const next = jest.fn().mockResolvedValue([]);
      const params = {
        model: 'Plan' as any,
        action: 'findMany' as any,
        args: { where: { isActive: true } },
        dataPath: [],
        runInTransaction: false,
      };

      await middleware(params, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(params.args.where).toEqual({ isActive: true });
    });
  });

  describe('TenantGuard Access Control', () => {
    let tenantGuard: TenantGuard;
    let tenantService: TenantService;
    let reflector: Reflector;

    beforeEach(() => {
      tenantService = new TenantService();
      reflector = new Reflector();
      tenantGuard = new TenantGuard(tenantService, reflector);
    });

    const mockExecutionContext = (req: any): ExecutionContext => ({
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}) as any,
        getNext: () => ({}) as any,
      }),
      getHandler: () => (() => {}) as any,
      getClass: () => (() => {}) as any,
      getArgs: () => [] as any,
      getArgByIndex: () => ({}) as any,
      switchToRpc: () => ({}) as any,
      switchToWs: () => ({}) as any,
      getType: () => 'http' as any,
    });

    it('should allow request if route has skipTenantCheck decorator', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const context = mockExecutionContext({});

      expect(tenantGuard.canActivate(context)).toBe(true);
    });

    it('should allow SUPER_ADMIN role without tenant requirement', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = mockExecutionContext({
        user: { role: 'SUPER_ADMIN', email: 'super@krypton.io' },
      });

      expect(tenantGuard.canActivate(context)).toBe(true);
    });

    it('should resolve tenant from authenticated user context if not set', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = mockExecutionContext({
        user: { role: 'SCHOOL_ADMIN', tenantId: 'school_authenticated_42' },
      });

      expect(tenantGuard.canActivate(context)).toBe(true);
      expect(tenantService.getTenantId()).toBe('school_authenticated_42');
    });

    it('should reject request with UnauthorizedException if no tenant context exists', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = mockExecutionContext({
        user: { role: 'TEACHER' }, // No tenantId on user and none in service
      });

      expect(() => tenantGuard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });
});
