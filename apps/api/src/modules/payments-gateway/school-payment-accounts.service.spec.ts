import { BadRequestException, ConflictException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { SchoolPaymentAccountsService } from './school-payment-accounts.service';

describe('School payment account isolation and credential history', () => {
  const base = { expectedAccountId: '', merchantName: 'School A', razorpayEnabled: true, razorpayKeyId: 'rzp_test_schoolA',
    razorpayKeySecret: 'secret-school-a', razorpayWebhookSecret: 'webhook-school-a', upiVpa: 'schoola@bank' };
  let db: any, tenants: any, encryption: any, service: SchoolPaymentAccountsService, config: any;
  beforeEach(() => {
    db = { school: { findMany: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }), findFirst: jest.fn().mockResolvedValue({ id: 'school-a' }) },
      invoice: { findFirst: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      schoolPaymentAccount: { findFirst: jest.fn(), updateMany: jest.fn(), create: jest.fn().mockImplementation(({ data }) => ({ id: 'v2', ...data })) },
      paymentGatewayTransaction: { findFirst: jest.fn() } };
    db.$transaction = jest.fn(work => work(db));
    tenants = { requireTenantContext: jest.fn(() => 'tenant-a'), run: jest.fn(work => work()) };
    encryption = { encrypt: jest.fn(async value => 'encrypted:' + value), decrypt: jest.fn(async value => value.replace('encrypted:', '')) };
    config = { get: jest.fn((key: string) => ({ ENCRYPTION_MASTER_KEY: 'm'.repeat(32), ENCRYPTION_SALT: 'a'.repeat(64),
      RAZORPAY_KEY_ID: 'rzp_test_legacy', RAZORPAY_KEY_SECRET: 'legacy-secret', RAZORPAY_WEBHOOK_SECRET: 'legacy-webhook' } as any)[key]) };
    service = new SchoolPaymentAccountsService(db, tenants, encryption, config);
  });
  it('encrypts secrets and returns only safe settings', async () => {
    const result = await service.save('school-a', base, 'owner');
    expect(db.school.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'school-a', tenantId: 'tenant-a' } }));
    expect(db.schoolPaymentAccount.create).toHaveBeenCalledWith({ data: expect.objectContaining({ tenantId: 'tenant-a', schoolId: 'school-a',
      razorpayKeySecret: 'encrypted:secret-school-a', razorpayWebhookSecret: 'encrypted:webhook-school-a', configuredBy: 'owner' }) });
    expect(result).toMatchObject({ hasKeySecret: true, hasWebhookSecret: true });
    expect(JSON.stringify(result)).not.toMatch(/secret-school-a|webhook-school-a|encrypted:/);
  });
  it('cannot configure another tenant?s school', async () => {
    db.school.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.save('foreign', base, 'owner')).rejects.toThrow(NotFoundException);
    expect(db.schoolPaymentAccount.create).not.toHaveBeenCalled();
  });
  it('rejects stale settings before retiring an account', async () => {
    db.schoolPaymentAccount.findFirst.mockResolvedValue({ id: 'newer' });
    await expect(service.save('school-a', base, 'owner')).rejects.toThrow(ConflictException);
    expect(db.schoolPaymentAccount.updateMany).not.toHaveBeenCalled();
  });
  it('retains encrypted secrets for the same key ID and creates a replacement version', async () => {
    const previous = { id: 'v1', razorpayKeyId: base.razorpayKeyId, razorpayKeySecret: 'encrypted:old-secret', razorpayWebhookSecret: 'encrypted:old-hook' };
    db.schoolPaymentAccount.findFirst.mockResolvedValue(previous);
    await service.save('school-a', { ...base, expectedAccountId: 'v1', razorpayKeySecret: undefined, razorpayWebhookSecret: undefined }, 'owner');
    expect(db.schoolPaymentAccount.updateMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a', schoolId: 'school-a', isCurrent: true }, data: { isCurrent: false } });
    expect(db.schoolPaymentAccount.create).toHaveBeenCalledWith({ data: expect.objectContaining({ razorpayKeySecret: previous.razorpayKeySecret, razorpayWebhookSecret: previous.razorpayWebhookSecret }) });
    expect(encryption.encrypt).not.toHaveBeenCalled();
  });
  it('requires replacement secrets when the merchant key changes', async () => {
    db.schoolPaymentAccount.findFirst.mockResolvedValue({ id: 'v1', razorpayKeyId: 'rzp_test_old', razorpayKeySecret: 'old', razorpayWebhookSecret: 'old' });
    await expect(service.save('school-a', { ...base, expectedAccountId: 'v1', razorpayKeySecret: undefined, razorpayWebhookSecret: undefined }, 'owner')).rejects.toThrow(BadRequestException);
  });
  it('allows UPI-only accounts without encryption configuration', async () => {
    config.get.mockReturnValue(undefined);
    await expect(service.save('school-a', { expectedAccountId: '', merchantName: 'UPI school', razorpayEnabled: false, upiVpa: 'school@bank' }, 'owner')).resolves.toMatchObject({ upiVpa: 'school@bank', hasKeySecret: false });
  });
  it('requires persistent encryption for Razorpay', async () => {
    config.get.mockReturnValue(undefined);
    await expect(service.save('school-a', base, 'owner')).rejects.toThrow(ServiceUnavailableException);
  });
  it('disables test checkout keys in production', async () => {
    const get = config.get.getMockImplementation();config.get.mockImplementation((key: string) => key === 'NODE_ENV' ? 'production' : get(key));
    await expect(service.save('school-a', base, 'owner')).rejects.toThrow('live Razorpay keys');
    await expect(service.credentials({ razorpayKeyId: base.razorpayKeyId, razorpayKeySecret: 'encrypted:test' })).rejects.toThrow('Test payments');
  });
  it('routes by the invoice?s saved school in the tenant', async () => {
    db.invoice.findFirst.mockResolvedValue({ paymentSchoolId: 'school-a' });
    db.schoolPaymentAccount.findFirst.mockResolvedValue({ id: 'account-a' });
    await expect(service.forInvoice('invoice-a')).resolves.toEqual({ id: 'account-a' });
    expect(db.schoolPaymentAccount.findFirst).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a', schoolId: 'school-a', isCurrent: true, school: { tenantId: 'tenant-a', isActive: true } } });
  });
  it('does not fall back to shared keys for unconfigured schools', async () => {
    db.invoice.findFirst.mockResolvedValue({ paymentSchoolId: 'school-a' });
    await expect(service.forInvoice('invoice-a')).rejects.toThrow(ServiceUnavailableException);
    expect(config.get).not.toHaveBeenCalled();
  });
  it('rejects missing and unassigned invoices', async () => {
    await expect(service.forInvoice('missing')).rejects.toThrow(NotFoundException);
    db.invoice.findFirst.mockResolvedValue({ paymentSchoolId: null });
    await expect(service.forInvoice('legacy')).rejects.toThrow('assign this invoice');
  });
  it('uses retired account credentials for outstanding orders', async () => {
    db.schoolPaymentAccount.findFirst.mockResolvedValue({ id: 'old-a', isCurrent: false, razorpayKeyId: 'rzp_test_oldA', razorpayKeySecret: 'encrypted:old-school-a' });
    await expect(service.forTransaction({ paymentAccountId: 'old-a', tenantId: 'tenant-a' })).resolves.toEqual({ keyId: 'rzp_test_oldA', keySecret: 'old-school-a' });
    expect(db.schoolPaymentAccount.findFirst).toHaveBeenCalledWith({ where: { id: 'old-a', tenantId: 'tenant-a' } });
  });
  it('does not substitute global keys for a lost account snapshot', async () => {
    await expect(service.forTransaction({ paymentAccountId: 'lost', tenantId: 'tenant-a' })).rejects.toThrow(ServiceUnavailableException);
    expect(config.get).not.toHaveBeenCalled();
  });
  it('preserves legacy verification only for pre-existing orders', async () => {
    await expect(service.forTransaction({ tenantId: 'tenant-a', paymentAccountId: null })).resolves.toEqual({ keyId: 'rzp_test_legacy', keySecret: 'legacy-secret' });
  });
  it('resolves webhook secrets from the original order and tenant in an isolated context', async () => {
    db.paymentGatewayTransaction.findFirst.mockResolvedValue({ tenantId: 'tenant-b', paymentAccountId: 'historic-b' });
    db.schoolPaymentAccount.findFirst.mockResolvedValue({ razorpayWebhookSecret: 'encrypted:school-b-webhook' });
    await expect(service.webhookSecret('order_B')).resolves.toBe('school-b-webhook');
    expect(tenants.run).toHaveBeenCalledTimes(1);
    expect(db.schoolPaymentAccount.findFirst).toHaveBeenCalledWith({ where: { id: 'historic-b', tenantId: 'tenant-b' } });
  });
  it('rejects unknown orders and missing snapshots without a shared-secret fallback', async () => {
    await expect(service.webhookSecret('unknown')).resolves.toBeNull();
    db.paymentGatewayTransaction.findFirst.mockResolvedValue({ tenantId: 'tenant-b', paymentAccountId: 'lost-b' });
    await expect(service.webhookSecret('order_B')).resolves.toBeNull();
    expect(config.get).not.toHaveBeenCalled();
  });
  it('claims only unassigned invoices without gateway orders', async () => {
    db.invoice.findFirst.mockResolvedValue({ id: 'invoice-a', paymentSchoolId: null });
    await expect(service.assignInvoice('school-a', 'INV-001')).resolves.toMatchObject({ assigned: true });
    expect(db.invoice.updateMany).toHaveBeenCalledWith({ where: { id: 'invoice-a', tenantId: 'tenant-a', paymentSchoolId: null, paymentGatewayTransactions: { none: {} } }, data: { paymentSchoolId: 'school-a' } });
    db.invoice.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.assignInvoice('school-a', 'INV-001')).rejects.toThrow(ConflictException);
  });
  it('does not expose secrets or credential history in school lists', async () => {
    db.school.findMany.mockResolvedValue([{ id: 'school-a', name: 'School A', isActive: true, paymentAccounts: [{ id: 'v1', ...base, razorpayKeySecret: 'hidden', razorpayWebhookSecret: 'also-hidden' }] }]);
    const result = await service.list();
    expect(JSON.stringify(result)).not.toContain('hidden');
    expect(result[0].account).toMatchObject({ hasKeySecret: true, hasWebhookSecret: true });
  });
});
