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
    if (typeof signature === 'string') {
      const body = req.rawBody ? req.rawBody : JSON.stringify(req.body ?? {});
      const expected = createHmac('sha256', secret).update(body).digest('hex');
      if (
        Buffer.byteLength(signature) === Buffer.byteLength(expected) &&
        timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      ) {
        return true;
      }
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const token = req.query.token;
    if (
      typeof token !== 'string' ||
      Buffer.byteLength(token) !== Buffer.byteLength(secret) ||
      !timingSafeEqual(Buffer.from(token), Buffer.from(secret))
    ) {
      throw new UnauthorizedException('Invalid callback credential');
    }
    return true;
  }
}
