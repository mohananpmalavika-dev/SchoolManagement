import axios from 'axios';
import { createHmac } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { PaymentsGatewayService } from './payments-gateway.service';
import { SchoolPaymentAccountsService } from './school-payment-accounts.service';
import { GatewayChoice } from './dto/gateway-payment.dto';

describe('Orders use only the billed school’s account', () => {
  const accounts = {
    a: { id: 'account-a', tenantId: 'tenant-a', schoolId: 'school-a', merchantName: 'School A', razorpayEnabled: true,
      razorpayKeyId: 'rzp_test_AAAA', razorpayKeySecret: 'enc:secret-a', razorpayWebhookSecret: 'enc:hook-a', upiVpa: 'schoola@bank' },
    b: { id: 'account-b', tenantId: 'tenant-a', schoolId: 'school-b', merchantName: 'School B', razorpayEnabled: true,
      razorpayKeyId: 'rzp_test_BBBB', razorpayKeySecret: 'enc:secret-b', razorpayWebhookSecret: 'enc:hook-b', upiVpa: 'schoolb@bank' },
  };
  let db: any, service: PaymentsGatewayService, fees: any;
  beforeEach(() => {
    jest.restoreAllMocks();
    db = {
      invoice: { findFirst: jest.fn(({ where }) => ({ paymentSchoolId: where.id === 'invoice-a' ? 'school-a' : 'school-b' })) },
      schoolPaymentAccount: { findFirst: jest.fn(({ where }) => Object.values(accounts).find(account => account.id === where.id || account.schoolId === where.schoolId)) },
      paymentGatewayTransaction: { create: jest.fn(({ data }) => ({ id: 'tx-' + data.invoiceId, ...data })), findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }), update: jest.fn() },
    };
    db.$transaction = jest.fn(work => work(db));
    const tenants: any = { requireTenantContext: () => 'tenant-a' };
    const config: any = { get: (_key: string, fallback: any) => fallback };
    const encryption: any = { decrypt: async (value: string) => value.replace('enc:', '') };
    const accountService = new SchoolPaymentAccountsService(db, tenants, encryption, config);
    fees = { findOneInvoice: jest.fn().mockResolvedValue({ balanceAmount: 10000, invoiceNumber: 'INV', status: 'PENDING' }),
      recordPayment: jest.fn().mockResolvedValue({ id: 'ledger-payment' }) };
    service = new PaymentsGatewayService(db, tenants, fees, config, accountService);
    jest.spyOn(axios, 'post').mockImplementation(async (_url, body: any) => ({ data: { id: body.notes.schoolId === 'school-a' ? 'order_A' : 'order_B', amount: body.amount, currency: 'INR' } }));
  });

  it('creates orders for two schools with different Basic credentials and checkout keys', async () => {
    for (const key of ['a', 'b'] as const) {
      const account = accounts[key];
      const result = await service.initiatePayment({ invoiceId: 'invoice-' + key, amount: 10000 }, 'parent');
      expect(result.razorpayKeyId).toBe(account.razorpayKeyId);
      expect(axios.post).toHaveBeenLastCalledWith('https://api.razorpay.com/v1/orders', expect.objectContaining({ notes: expect.objectContaining({ schoolId: account.schoolId }) }),
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Basic ' + Buffer.from(account.razorpayKeyId + ':secret-' + key).toString('base64') }) }));
      expect(db.paymentGatewayTransaction.create).toHaveBeenLastCalledWith({ data: expect.objectContaining({ paymentAccountId: account.id, tenantId: 'tenant-a', invoiceId: 'invoice-' + key }) });
    }
  });
  it('generates different UPI receiving destinations and never credits an intent', async () => {
    for (const key of ['a', 'b'] as const) {
      const result = await service.initiatePayment({ invoiceId: 'invoice-' + key, amount: 10000, gateway: GatewayChoice.UPI, upiVpa: 'caller-controlled@bank' });
      const params = new URL(result.upiIntentUri!).searchParams;
      expect(params.get('pa')).toBe(accounts[key].upiVpa);
      expect(params.get('pn')).toBe(accounts[key].merchantName);
      expect(db.paymentGatewayTransaction.create).toHaveBeenLastCalledWith({ data: expect.objectContaining({ paymentAccountId: accounts[key].id, status: 'PENDING' }) });
    }
    expect(fees.recordPayment).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });
  it('options are scoped to the invoice and reveal no secrets or receiving account credentials', async () => {
    await expect(service.options('invoice-a')).resolves.toEqual({ razorpay: true, upi: true, merchantName: 'School A' });
    await expect(service.options('invoice-b')).resolves.toEqual({ razorpay: true, upi: true, merchantName: 'School B' });
  });
  it('rejects an invalid provider order response before saving or opening checkout', async () => {
    jest.mocked(axios.post).mockResolvedValue({ data: { id: 'order_A', amount: 1, currency: 'INR' } });
    await expect(service.initiatePayment({ invoiceId: 'invoice-a', amount: 10000 })).rejects.toThrow('Failed to initiate');
    expect(db.paymentGatewayTransaction.create).not.toHaveBeenCalled();
  });
  it('verifies and fetches captured payment with the original account credentials', async () => {
    db.paymentGatewayTransaction.findFirst.mockResolvedValue({ id: 'tx-a', tenantId: 'tenant-a', paymentAccountId: accounts.a.id,
      gatewayOrderId: 'order_A', invoiceId: 'invoice-a', amount: 10000, currency: 'INR', initiatedBy: 'parent' });
    jest.spyOn(axios, 'get').mockResolvedValue({ data: { id: 'pay_A', order_id: 'order_A', amount: 10000, currency: 'INR', status: 'captured' } });
    const signature = createHmac('sha256', 'secret-a').update('order_A|pay_A').digest('hex');
    await expect(service.verifyRazorpayCheckout({ razorpayOrderId: 'order_A', razorpayPaymentId: 'pay_A', razorpaySignature: signature })).resolves.toMatchObject({ status: 'COMPLETED' });
    expect(axios.get).toHaveBeenCalledWith('https://api.razorpay.com/v1/payments/pay_A', { auth: { username: 'rzp_test_AAAA', password: 'secret-a' }, timeout: 15000 });
  });
  it('rejects another school’s checkout signature before provider or ledger calls', async () => {
    db.paymentGatewayTransaction.findFirst.mockResolvedValue({ tenantId: 'tenant-a', paymentAccountId: accounts.a.id, gatewayOrderId: 'order_A' });
    const signature = createHmac('sha256', 'secret-b').update('order_A|pay_A').digest('hex');
    const get = jest.spyOn(axios, 'get');
    await expect(service.verifyRazorpayCheckout({ razorpayOrderId: 'order_A', razorpayPaymentId: 'pay_A', razorpaySignature: signature })).rejects.toThrow(BadRequestException);
    expect(get).not.toHaveBeenCalled(); expect(fees.recordPayment).not.toHaveBeenCalled();
  });
  it('cannot reconcile a payment into a different school in the same tenant', async () => {
    db.paymentGatewayTransaction.findFirstOrThrow.mockResolvedValue({ id: 'tx-a', gateway: 'UPI', paymentAccountId: accounts.a.id });
    await expect(service.manualReconcile({ transactionId: 'tx-a', invoiceId: 'invoice-b' }, 'accountant')).rejects.toThrow('receiving school');
    expect(fees.recordPayment).not.toHaveBeenCalled();
  });
  it('allows manual bank reconciliation within the receiving school', async () => {
    db.paymentGatewayTransaction.findFirstOrThrow.mockResolvedValue({ id: 'tx-a', gateway: 'UPI', paymentAccountId: accounts.a.id,
      amount: 10000, gatewayOrderId: 'upi_A', createdAt: new Date() });
    await service.manualReconcile({ transactionId: 'tx-a', invoiceId: 'invoice-a', notes: 'Bank statement checked' }, 'accountant');
    expect(fees.recordPayment).toHaveBeenCalledWith(expect.objectContaining({ invoiceId: 'invoice-a', amount: 10000, paymentMethod: 'UPI' }), 'accountant', db);
  });
});
