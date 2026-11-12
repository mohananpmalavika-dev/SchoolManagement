import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PredictiveAnalyticsController } from './predictive-analytics.controller';
import { PredictiveAnalyticsService } from './predictive-analytics.service';

describe('predictive analytics access and tenant isolation', () => {
  it('requires a tenant before any database access', async () => {
    const prisma = { student: { findMany: jest.fn() }, tenant: { findFirst: jest.fn() } };
    const service = new PredictiveAnalyticsService(prisma as any, { requireTenantContext: () => { throw new Error('Tenant context required'); } } as any);
    await expect(service.report()).rejects.toThrow('Tenant context required');
    expect(prisma.student.findMany).not.toHaveBeenCalled(); expect(prisma.tenant.findFirst).not.toHaveBeenCalled();
  });
  it('scopes students and each sensitive nested relation to the authenticated tenant', async () => {
    const prisma = { student: { findMany: jest.fn().mockResolvedValue([]) }, tenant: { findFirst: jest.fn().mockResolvedValue({ currency: 'INR' }) } };
    const service = new PredictiveAnalyticsService(prisma as any, { requireTenantContext: () => 'school-a' } as any);
    const report = await service.report();
    const query = prisma.student.findMany.mock.calls[0][0];
    expect(query.where).toEqual({ tenantId: 'school-a', deletedAt: null });
    for (const relation of ['attendanceRecords', 'grades', 'invoices']) expect(query.select[relation].where.tenantId).toBe('school-a');
    expect(query.select.invoices.select.payments.where.tenantId).toBe('school-a');
    expect(query.select.grades.where.examination.tenantId).toBe('school-a');
    expect(query.select.gender).toBeUndefined(); expect(query.select.medicalConditions).toBeUndefined();
    expect(report.summary.students).toBe(0);
  });
  it.each(['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN'])('allows school leadership: %s', role => {
    const context = { getHandler: () => PredictiveAnalyticsController.prototype.report,
      getClass: () => PredictiveAnalyticsController, switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) } as unknown as ExecutionContext;
    expect(new RolesGuard(new Reflector()).canActivate(context)).toBe(true);
  });
  it.each(['PARENT', 'STUDENT', 'TEACHER', 'ACCOUNTANT', 'SUPER_ADMIN'])('denies risk records to other roles: %s', role => {
    const context = { getHandler: () => PredictiveAnalyticsController.prototype.report,
      getClass: () => PredictiveAnalyticsController, switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) } as unknown as ExecutionContext;
    expect(() => new RolesGuard(new Reflector()).canActivate(context)).toThrow('Insufficient permissions');
  });
});
