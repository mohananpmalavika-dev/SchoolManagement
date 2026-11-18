import { ExecutionContext, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { PaymentCallbackGuard } from './payment-callback.guard';
describe('School-specific webhook authentication', () => {
  const secret = 'school-a-webhook-secret';
  const raw = Buffer.from('{\n "event":"payment.captured","payload":{"payment":{"entity":{"order_id":"order_SchoolA"}}}\n}');
  const signature = createHmac('sha256', secret).update(raw).digest('hex');
  const accounts = { webhookSecret: jest.fn() };
  const guard = new PaymentCallbackGuard(accounts as any);
  const context = (changes: any = {}) => ({ switchToHttp: () => ({ getRequest: () => ({
    headers: { 'x-razorpay-signature': signature }, rawBody: raw, ...changes,
  }) }) }) as ExecutionContext;
  beforeEach(() => accounts.webhookSecret.mockReset().mockResolvedValue(secret));
  it('uses exact bytes and the order?s school secret', async () => {
    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(accounts.webhookSecret).toHaveBeenCalledWith('order_SchoolA');
  });
  it('rejects another school?s valid signature', async () => {
    const other = createHmac('sha256', 'school-b').update(raw).digest('hex');
    await expect(guard.canActivate(context({ headers: { 'x-razorpay-signature': other } }))).rejects.toThrow(UnauthorizedException);
  });
  it('rejects tampering', async () => {
    await expect(guard.canActivate(context({ rawBody: Buffer.concat([raw, Buffer.from(' ')]) }))).rejects.toThrow(UnauthorizedException);
  });
  it.each([undefined, 'not-hex', 'a'.repeat(63), 'a'.repeat(64), ['a'.repeat(64)]])('rejects bad signatures %j', async value => {
    await expect(guard.canActivate(context({ headers: { 'x-razorpay-signature': value } }))).rejects.toThrow(UnauthorizedException);
  });
  it('requires captured raw bytes', async () => {
    await expect(guard.canActivate(context({ rawBody: undefined }))).rejects.toThrow(UnauthorizedException);
  });
  it('rejects unknown orders', async () => {
    accounts.webhookSecret.mockResolvedValue(null);
    await expect(guard.canActivate(context())).rejects.toThrow(ServiceUnavailableException);
  });
  it.each(['{', '{"payload":{}}'])('rejects invalid payload %s', async body => {
    await expect(guard.canActivate(context({ rawBody: Buffer.from(body) }))).rejects.toThrow(UnauthorizedException);
    expect(accounts.webhookSecret).not.toHaveBeenCalled();
  });
});
