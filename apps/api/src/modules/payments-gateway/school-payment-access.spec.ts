import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SchoolPaymentAccountDto } from './dto/school-payment-account.dto';
import { PaymentsGatewayController } from './payments-gateway.controller';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolRecordAccessGuard } from '../../common/guards/school-record-access.guard';
import { PaymentsGatewayModule } from './payments-gateway.module';
import { PrismaService } from '../../database/prisma.service';

describe('Payment settings authorization and input validation', () => {
  it('wires school credentials, callback authentication and existing fee services in Nest', async () => {
    const module = await Test.createTestingModule({ imports: [PaymentsGatewayModule] })
      .overrideProvider(PrismaService).useValue({}).compile();
    expect(module.get(PaymentsGatewayController)).toBeDefined();
    await module.close();
  });
  const payload = { expectedAccountId: '', merchantName: 'School A', razorpayEnabled: false, upiVpa: 'schoola@bank' };
  const context = (handler: string, role: string, changes: any = {}) => ({
    getClass: () => PaymentsGatewayController,
    getHandler: () => (PaymentsGatewayController.prototype as any)[handler],
    switchToHttp: () => ({ getRequest: () => ({ user: { role, userId: 'parent-a' }, query: { invoiceId: 'invoice-a' }, ...changes }) }),
  }) as unknown as ExecutionContext;
  it('allows accountants to read, and owners/principals/admins to save settings', () => {
    const guard = new RolesGuard(new Reflector());
    expect(guard.canActivate(context('schoolAccounts', 'ACCOUNTANT'))).toBe(true);
    for (const role of ['SCHOOL_OWNER', 'PRINCIPAL', 'SCHOOL_ADMIN']) {
      expect(guard.canActivate(context('saveSchoolAccount', role))).toBe(true);
      expect(guard.canActivate(context('assignInvoiceSchool', role))).toBe(true);
    }
  });
  it.each(['PARENT', 'STUDENT', 'TEACHER', 'RECEPTIONIST', 'ACCOUNTANT'])('prevents %s from rerouting payment settings', role => {
    const guard = new RolesGuard(new Reflector());
    expect(() => guard.canActivate(context('saveSchoolAccount', role))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context('assignInvoiceSchool', role))).toThrow(ForbiddenException);
  });
  it('checks a linked child before exposing invoice payment options', async () => {
    const db: any = { invoice: { findFirst: jest.fn().mockResolvedValue({ studentId: 'child-a' }) },
      student: { findFirst: jest.fn().mockResolvedValue({ id: 'child-a' }) }, guardianStudentLink: { findFirst: jest.fn().mockResolvedValue({ id: 'link-a' }) } };
    const guard = new SchoolRecordAccessGuard(db, { requireTenantContext: () => 'tenant-a' } as any);
    await expect(guard.canActivate(context('options', 'PARENT'))).resolves.toBe(true);
    expect(db.invoice.findFirst).toHaveBeenCalledWith({ where: { id: 'invoice-a', tenantId: 'tenant-a' } });
    expect(db.guardianStudentLink.findFirst).toHaveBeenCalledWith({ where: { studentId: 'child-a', guardian: { tenantId: 'tenant-a', userId: 'parent-a' } } });
    db.guardianStudentLink.findFirst.mockResolvedValue(null);
    await expect(guard.canActivate(context('options', 'PARENT'))).rejects.toThrow(ForbiddenException);
  });
  it('accepts a UPI-only school configuration', async () => {
    await expect(validate(plainToInstance(SchoolPaymentAccountDto, payload, { enableImplicitConversion: true }))).resolves.toEqual([]);
  });
  it.each([null, 'false', 'true', 0, 1])('rejects a coerced Razorpay enable flag %j', async value => {
    const result = await validate(plainToInstance(SchoolPaymentAccountDto, { ...payload, razorpayEnabled: value }, { enableImplicitConversion: true }));
    expect(result.some(error => error.property === 'razorpayEnabled')).toBe(true);
  });
  it.each([
    { razorpayKeySecret: null }, { razorpayWebhookSecret: null }, { razorpayKeyId: null },
    { razorpayKeyId: 'not-a-razorpay-key' }, { upiVpa: 'https://wrong.test' },
  ])('rejects malformed credentials %j', async changes => {
    const result = await validate(plainToInstance(SchoolPaymentAccountDto, { ...payload, ...changes }, { enableImplicitConversion: true }));
    expect(result.length).toBeGreaterThan(0);
  });
});
