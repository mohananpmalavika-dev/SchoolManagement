import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { PaymentMethod } from '@krypton/types';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { FeesService } from '../fees/fees.service';
import {
  GatewayChoice,
  InitiatePaymentDto,
  ManualReconciliationDto,
  PaymentOrderResponseDto,
  PaymentWebhookDto,
  QueryGatewayStatusDto,
  QueryUnmatchedTransactionsDto,
  VerifyPaymentDto,
} from './dto/gateway-payment.dto';

@Injectable()
export class PaymentsGatewayService {
  private readonly logger = new Logger(PaymentsGatewayService.name);
  private readonly razorpayBaseUrl: string;
  private readonly razorpayKeyId: string;
  private readonly razorpayKeySecret: string;
  private readonly webhookSecret: string;
  private readonly defaultUpiVpa: string;
  private readonly schoolMerchantName: string;

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private feesService: FeesService,
    private configService: ConfigService,
  ) {
    this.razorpayBaseUrl =
      this.configService.get('RAZORPAY_BASE_URL', '') || 'https://api.razorpay.com/v1';
    this.razorpayKeyId = this.configService.get('RAZORPAY_KEY_ID', '');
    this.razorpayKeySecret = this.configService.get('RAZORPAY_KEY_SECRET', '');
    this.webhookSecret =
      this.configService.get('RAZORPAY_WEBHOOK_SECRET', '') ||
      this.configService.get('PAYMENT_WEBHOOK_SECRET', '');
    this.defaultUpiVpa =
      this.configService.get('SCHOOL_UPI_VPA', '') || 'kryptonschool@okhdfcbank';
    this.schoolMerchantName =
      this.configService.get('SCHOOL_MERCHANT_NAME', '') || 'Krypton Public School';
  }

  // ==================== INITIATE ORDER / UPI INTENT ====================

  async initiatePayment(
    dto: InitiatePaymentDto,
    userId?: string,
  ): Promise<PaymentOrderResponseDto> {
    const tenantId = this.tenantService.requireTenantContext();
    const gateway = dto.gateway || GatewayChoice.RAZORPAY;

    const invoice = await this.feesService.findOneInvoice(dto.invoiceId);
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot pay for cancelled invoice');
    }
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already fully paid');
    }
    if (dto.amount > invoice.balanceAmount) {
      throw new BadRequestException(
        `Payment amount exceeds invoice balance (${invoice.balanceAmount} paise)`,
      );
    }
    if (dto.amount < 100) {
      throw new BadRequestException('Minimum payment amount is INR 1.00');
    }

    const accountReference =
      dto.accountReference || invoice.invoiceNumber || 'SCHOOL_FEE';
    const transactionDesc = dto.transactionDesc || 'School Fee Payment';

    if (gateway === GatewayChoice.UPI) {
      const gatewayOrderId = `upi_${Date.now()}_${randomUUID().slice(0, 8)}`;
      const amountInRupees = (dto.amount / 100).toFixed(2);
      const payeeVpa = this.defaultUpiVpa;
      const upiIntentUri =
        `upi://pay?pa=${encodeURIComponent(payeeVpa)}` +
        `&pn=${encodeURIComponent(this.schoolMerchantName)}` +
        `&tr=${encodeURIComponent(gatewayOrderId)}` +
        `&tn=${encodeURIComponent(`${accountReference} - ${transactionDesc}`)}` +
        `&am=${amountInRupees}&cu=INR`;

      const tx = await this.prisma.paymentGatewayTransaction.create({
        data: {
          tenantId,
          gateway: 'UPI',
          transactionType: 'UPI_INTENT',
          gatewayOrderId,
          amount: dto.amount,
          currency: 'INR',
          phoneNumber: dto.phoneNumber,
          upiVpa: dto.upiVpa || payeeVpa,
          accountReference,
          transactionDesc,
          invoiceId: dto.invoiceId,
          status: 'PENDING',
          initiatedBy: userId,
          responseCode: '200',
          responseDescription: 'UPI payment intent generated',
        },
      });

      this.logger.log(`UPI payment intent generated: ${gatewayOrderId} for invoice ${dto.invoiceId}`);
      return {
        transactionId: tx.id,
        gatewayOrderId,
        gateway: 'UPI',
        amount: dto.amount,
        currency: 'INR',
        upiIntentUri,
        invoiceId: dto.invoiceId,
        customerMessage: 'Scan the UPI QR or approve the payment in your UPI app (GPay, PhonePe, Paytm, BHIM).',
      };
    }

    // Razorpay Order creation
    if (!this.razorpayKeyId || !this.razorpayKeySecret) {
      throw new BadRequestException('Razorpay is not configured. Contact your school office.');
    }

    try {
      const auth = Buffer.from(`${this.razorpayKeyId}:${this.razorpayKeySecret}`).toString('base64');
      const response = await axios.post(
        `${this.razorpayBaseUrl}/orders`,
        {
          amount: dto.amount, // paise
          currency: 'INR',
          receipt: accountReference,
          notes: {
            tenantId,
            invoiceId: dto.invoiceId,
            description: transactionDesc,
          },
        },
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const gatewayOrderId: string = response.data.id;
      const tx = await this.prisma.paymentGatewayTransaction.create({
        data: {
          tenantId,
          gateway: 'RAZORPAY',
          transactionType: 'RAZORPAY_ORDER',
          gatewayOrderId,
          amount: dto.amount,
          currency: 'INR',
          phoneNumber: dto.phoneNumber,
          upiVpa: dto.upiVpa,
          accountReference,
          transactionDesc,
          invoiceId: dto.invoiceId,
          status: 'PENDING',
          initiatedBy: userId,
          responseCode: '201',
          responseDescription: 'Razorpay order created',
          requestPayload: response.data,
        },
      });

      this.logger.log(`Razorpay order created: ${gatewayOrderId} for invoice ${dto.invoiceId}`);
      return {
        transactionId: tx.id,
        gatewayOrderId,
        gateway: 'RAZORPAY',
        amount: dto.amount,
        currency: 'INR',
        razorpayKeyId: this.razorpayKeyId,
        invoiceId: dto.invoiceId,
        customerMessage: 'Complete payment via Razorpay Checkout (UPI, Cards, NetBanking).',
      };
    } catch (error: any) {
      this.logger.error('Razorpay order creation failed', error);
      if (error.response?.data?.error?.description) {
        throw new BadRequestException(error.response.data.error.description);
      }
      throw new InternalServerErrorException('Failed to initiate Razorpay payment order');
    }
  }

  // ==================== CHECKOUT SIGNATURE VERIFICATION ====================

  async verifyRazorpayCheckout(dto: VerifyPaymentDto): Promise<any> {
    const tenantId = this.tenantService.requireTenantContext();
    if (!this.razorpayKeySecret) {
      throw new BadRequestException('Razorpay secret not configured');
    }

    const expectedSig = createHmac('sha256', this.razorpayKeySecret)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    const providedBuf = Buffer.from(dto.razorpaySignature || '', 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    if (
      providedBuf.length !== expectedBuf.length ||
      !timingSafeEqual(providedBuf, expectedBuf)
    ) {
      throw new BadRequestException('Invalid Razorpay payment signature');
    }

    const transaction = await this.prisma.paymentGatewayTransaction.findFirst({
      where: { tenantId, gatewayOrderId: dto.razorpayOrderId },
    });
    if (!transaction) {
      throw new NotFoundException('Payment order not found');
    }

    return this.completeTransaction(transaction, {
      gatewayPaymentId: dto.razorpayPaymentId,
      receiptNumber: dto.utrNumber || dto.razorpayPaymentId,
      utrNumber: dto.utrNumber,
      method: PaymentMethod.RAZORPAY,
      notes: `Razorpay payment ${dto.razorpayPaymentId}`,
    });
  }

  // ==================== WEBHOOK / CALLBACK ====================

  async handleWebhook(payload: PaymentWebhookDto): Promise<{ received: boolean }> {
    const entity = payload.payload?.payment?.entity;
    const orderId = entity?.order_id;
    const paymentId = entity?.id;

    if (!orderId) {
      this.logger.warn(`Webhook ignored (missing order_id) for event: ${payload.event}`);
      return { received: true };
    }

    const transaction = await this.prisma.executeWithoutTenantFilter(() =>
      this.prisma.paymentGatewayTransaction.findFirst({
        where: { gatewayOrderId: orderId },
      }),
    );

    if (!transaction) {
      this.logger.error(`Transaction not found for gatewayOrderId: ${orderId}`);
      return { received: true };
    }

    this.tenantService.setTenantId(transaction.tenantId);

    if (transaction.callbackReceived) {
      this.logger.warn(`Duplicate webhook dropped for order: ${orderId}`);
      return { received: true };
    }

    const isSuccess =
      payload.event === 'payment.captured' ||
      payload.event === 'order.paid' ||
      entity?.status === 'captured';

    if (isSuccess) {
      if (typeof entity?.amount === 'number' && entity.amount !== transaction.amount) {
        throw new BadRequestException('Payment callback amount does not match original order');
      }
      if (entity?.currency && entity.currency !== transaction.currency) {
        throw new BadRequestException('Payment callback currency mismatch');
      }

      const utrNumber = entity?.acquirer_data?.rrn || entity?.acquirer_data?.upi_transaction_id;
      const method =
        entity?.method === 'upi'
          ? PaymentMethod.UPI
          : entity?.method === 'netbanking'
            ? PaymentMethod.NET_BANKING
            : entity?.method === 'card'
              ? PaymentMethod.CARD
              : PaymentMethod.RAZORPAY;

      await this.completeTransaction(transaction, {
        gatewayPaymentId: paymentId,
        receiptNumber: utrNumber || paymentId || `RCPT-${Date.now()}`,
        utrNumber,
        upiVpa: entity?.vpa,
        method,
        callbackPayload: payload as any,
        notes: `${method} payment (${paymentId || orderId})`,
      });
    } else if (payload.event === 'payment.failed' || entity?.status === 'failed') {
      await this.prisma.paymentGatewayTransaction.updateMany({
        where: { id: transaction.id, callbackReceived: false },
        data: {
          status: 'FAILED',
          gatewayPaymentId: paymentId,
          resultDesc: entity?.error_description || 'Payment failed',
          callbackReceived: true,
          callbackReceivedAt: new Date(),
          callbackPayload: payload as any,
          reconciliationStatus: 'FAILED',
        },
      });
    }

    return { received: true };
  }

  private async completeTransaction(
    transaction: any,
    details: {
      gatewayPaymentId?: string;
      receiptNumber: string;
      utrNumber?: string;
      upiVpa?: string;
      method: PaymentMethod;
      callbackPayload?: any;
      notes: string;
    },
  ) {
    // Atomic CAS: ensure callback/verification only processes once
    const updateResult = await this.prisma.paymentGatewayTransaction.updateMany({
      where: { id: transaction.id, callbackReceived: false },
      data: {
        status: 'COMPLETED',
        gatewayPaymentId: details.gatewayPaymentId,
        receiptNumber: details.receiptNumber,
        utrNumber: details.utrNumber,
        upiVpa: details.upiVpa || transaction.upiVpa,
        transactionDate: new Date(),
        callbackReceived: true,
        callbackReceivedAt: new Date(),
        callbackPayload: details.callbackPayload,
        reconciliationStatus: 'PENDING',
      },
    });

    if (updateResult.count === 0) {
      this.logger.warn(`Concurrent duplicate settlement safely dropped for tx: ${transaction.id}`);
      return { status: 'ALREADY_PROCESSED', transactionId: transaction.id };
    }

    if (transaction.invoiceId && !transaction.paymentId) {
      try {
        const payment = await this.feesService.recordPayment(
          {
            invoiceId: transaction.invoiceId,
            amount: transaction.amount,
            paymentMethod: details.method,
            reference: details.receiptNumber,
            paymentDate: new Date().toISOString(),
            notes: details.notes,
          },
          transaction.initiatedBy || undefined,
        );

        await this.prisma.paymentGatewayTransaction.update({
          where: { id: transaction.id },
          data: {
            paymentId: payment!.id,
            isReconciled: true,
            reconciledAt: new Date(),
            reconciliationStatus: 'MATCHED',
          },
        });

        this.logger.log(
          `Payment auto-allocated: ${details.receiptNumber} -> Invoice ${transaction.invoiceId}`,
        );
        return {
          status: 'COMPLETED',
          transactionId: transaction.id,
          paymentId: payment!.id,
          receiptNumber: details.receiptNumber,
        };
      } catch (error: any) {
        this.logger.error('Failed to auto-allocate payment to invoice', error);
        await this.prisma.paymentGatewayTransaction.update({
          where: { id: transaction.id },
          data: { reconciliationStatus: 'UNMATCHED' },
        });
      }
    }

    return {
      status: 'COMPLETED',
      transactionId: transaction.id,
      receiptNumber: details.receiptNumber,
    };
  }

  // ==================== STATUS & RECONCILIATION ====================

  async queryStatus(dto: QueryGatewayStatusDto) {
    const tenantId = this.tenantService.requireTenantContext();
    const tx = await this.prisma.paymentGatewayTransaction.findFirst({
      where: { tenantId, gatewayOrderId: dto.gatewayOrderId },
      include: {
        invoice: { select: { invoiceNumber: true, status: true, balanceAmount: true } },
      },
    });
    if (!tx) {
      throw new NotFoundException('Transaction not found');
    }
    return tx;
  }

  async getTransactions(query: QueryUnmatchedTransactionsDto) {
    const tenantId = this.tenantService.requireTenantContext();
    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (typeof query.isReconciled === 'boolean') where.isReconciled = query.isReconciled;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    return this.prisma.paymentGatewayTransaction.findMany({
      where,
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            student: { select: { admissionNumber: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async manualReconcile(dto: ManualReconciliationDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();
    const tx = await this.prisma.paymentGatewayTransaction.findFirst({
      where: { id: dto.transactionId, tenantId },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.paymentId) throw new ConflictException('Transaction already linked to a payment');

    const reference = tx.receiptNumber || tx.utrNumber || tx.gatewayPaymentId || tx.gatewayOrderId || tx.id;
    const payment = await this.feesService.recordPayment(
      {
        invoiceId: dto.invoiceId,
        amount: tx.amount,
        paymentMethod: tx.gateway === 'UPI' ? PaymentMethod.UPI : PaymentMethod.RAZORPAY,
        reference,
        paymentDate: (tx.transactionDate || tx.createdAt).toISOString(),
        notes: dto.notes || `Manual reconciliation (${reference})`,
      },
      userId,
    );

    return this.prisma.paymentGatewayTransaction.update({
      where: { id: tx.id },
      data: {
        invoiceId: dto.invoiceId,
        paymentId: payment!.id,
        isReconciled: true,
        reconciledAt: new Date(),
        reconciliationStatus: 'MATCHED',
      },
    });
  }
}
