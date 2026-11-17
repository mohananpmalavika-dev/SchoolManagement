import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

@Injectable()
export class PaymentCallbackGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const secret =
      this.config.get<string>('RAZORPAY_WEBHOOK_SECRET') ||
      this.config.get<string>('PAYMENT_WEBHOOK_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException('Payment callbacks are not configured');
    }

    const req = context.switchToHttp().getRequest();
    const signature = req.headers['x-razorpay-signature'];
    if (
      typeof signature !== 'string' || !/^[a-fA-F0-9]{64}$/.test(signature) ||
      !Buffer.isBuffer(req.rawBody)
    ) {
      throw new UnauthorizedException('A signed payment webhook is required');
    }
    // Verify the exact received bytes. Parsing and reserializing JSON changes signatures.
    const expected = createHmac('sha256', secret).update(req.rawBody).digest();
    if (!timingSafeEqual(Buffer.from(signature, 'hex'), expected)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
    return true;
  }
}
