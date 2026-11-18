import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { SchoolPaymentAccountsService } from '../../modules/payments-gateway/school-payment-accounts.service';
import { createHmac, timingSafeEqual } from 'node:crypto';

@Injectable()
export class PaymentCallbackGuard implements CanActivate {
  constructor(private accounts: SchoolPaymentAccountsService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const signature = req.headers['x-razorpay-signature'];
    if (
      typeof signature !== 'string' || !/^[a-fA-F0-9]{64}$/.test(signature) ||
      !Buffer.isBuffer(req.rawBody)
    ) {
      throw new UnauthorizedException('A signed payment webhook is required');
    }
    let orderId: unknown;
    try { orderId = JSON.parse(req.rawBody.toString('utf8'))?.payload?.payment?.entity?.order_id; }
    catch { throw new UnauthorizedException('Invalid payment webhook'); }
    if (typeof orderId !== 'string' || !/^order_[a-zA-Z0-9]{1,100}$/.test(orderId)) throw new UnauthorizedException('Payment order is required');
    const secret = await this.accounts.webhookSecret(orderId);
    if (!secret) throw new ServiceUnavailableException('Payment order webhook is not configured');
    // Verify the exact received bytes. Parsing and reserializing JSON changes signatures.
    const expected = createHmac('sha256', secret).update(req.rawBody).digest();
    if (!timingSafeEqual(Buffer.from(signature, 'hex'), expected)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    return true;
  }
}
