import { ExecutionContext, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { PaymentCallbackGuard } from './payment-callback.guard';

describe('Payment webhook authentication', () => {
  const secret = 'isolated-webhook-test-secret';
  const raw = Buffer.from('{\n  "event": "payment.captured", "payload": {}\n}');
  const signature = createHmac('sha256', secret).update(raw).digest('hex');
  const guard = new PaymentCallbackGuard(new ConfigService({ RAZORPAY_WEBHOOK_SECRET: secret }));
  const context = (request: any) => ({ switchToHttp: () => ({ getRequest: () => request }) }) as ExecutionContext;
  const request = (changes: Record<string, unknown> = {}) => ({
    headers: { 'x-razorpay-signature': signature }, rawBody: raw,
    body: JSON.parse(raw.toString()), query: {}, ...changes,
  });

  it('accepts a signed body without normalizing whitespace or property order', () => {
    expect(guard.canActivate(context(request()))).toBe(true);
  });
  it('rejects body tampering even when the parsed event is unchanged', () => {
    expect(() => guard.canActivate(context(request({ rawBody: Buffer.concat([raw, Buffer.from(' ')]) })))).toThrow(UnauthorizedException);
  });
  it('rejects the old query-string shared token', () => {
    expect(() => guard.canActivate(context(request({ headers: {}, query: { token: secret } })))).toThrow(UnauthorizedException);
  });
  it.each(['not-hex', 'a'.repeat(63), 'a'.repeat(64), ['a'.repeat(64)]])('rejects malformed or incorrect signatures (%j)', (value) => {
    expect(() => guard.canActivate(context(request({ headers: { 'x-razorpay-signature': value } })))).toThrow(UnauthorizedException);
  });
  it('refuses to authenticate reconstructed JSON when raw body capture is absent', () => {
    expect(() => guard.canActivate(context(request({ rawBody: undefined })))).toThrow(UnauthorizedException);
  });
  it('fails closed when no webhook secret is configured', () => {
    const disabled = new PaymentCallbackGuard(new ConfigService({}));
    expect(() => disabled.canActivate(context(request()))).toThrow(ServiceUnavailableException);
  });
});
