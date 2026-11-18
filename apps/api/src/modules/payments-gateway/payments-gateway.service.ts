import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { PaymentMethod } from '@krypton/types';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { FeesService } from '../fees/fees.service';
import { SchoolPaymentAccountsService } from './school-payment-accounts.service';
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

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private feesService: FeesService,
    private configService: ConfigService,
    private accounts: SchoolPaymentAccountsService,
  ) {
    this.razorpayBaseUrl =
      this.configService.get('RAZORPAY_BASE_URL', '') || 'https://api.razorpay.com/v1';
  }

  // ==================== INITIATE ORDER / UPI INTENT ====================

  async options(invoiceId: string) {
    const account = await this.accounts.forInvoice(invoiceId);
    return { razorpay: account.razorpayEnabled && !!account.razorpayKeyId && !!account.razorpayKeySecret && !!account.razorpayWebhookSecret,
      upi: !!account.upiVpa, merchantName: account.merchantName };
  }

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

    const account = await this.accounts.forInvoice(dto.invoiceId);

    const accountReference =
      dto.accountReference || invoice.invoiceNumber || 'SCHOOL_FEE';
    const transactionDesc = dto.transactionDesc || 'School Fee Payment';

    if (gateway === GatewayChoice.UPI) {
      if (!account.upiVpa) throw new ServiceUnavailableException('School UPI payments are not configured');
      const gatewayOrderId = `upi_${Date.now()}_${randomUUID().slice(0, 8)}`;
      const amountInRupees = (dto.amount / 100).toFixed(2);
      const payeeVpa = account.upiVpa;
      const upiIntentUri =
        `upi://pay?pa=${encodeURIComponent(payeeVpa)}` +
        `&pn=${encodeURIComponent(account.merchantName)}` +
        `&tr=${encodeURIComponent(gatewayOrderId)}` +
        `&tn=${encodeURIComponent(`${accountReference} - ${transactionDesc}`)}` +
        `&am=${amountInRupees}&cu=INR`;

      const tx = await this.prisma.paymentGatewayTransaction.create({
        data: {
          tenantId,
          paymentAccountId: account.id,
          gateway: 'UPI',
          transactionType: 'UPI_INTENT',
          gatewayOrderId,
          amount: dto.amount,
          currency: 'INR',
          phoneNumber: dto.phoneNumber,
          upiVpa: payeeVpa,
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
    if (!account.razorpayEnabled || !account.razorpayWebhookSecret) {
      throw new BadRequestException('Razorpay is not configured. Contact your school office.');
    }

    const credentials = await this.accounts.credentials(account);

    try {
      const auth = Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString('base64');
      const response = await axios.post(
        `${this.razorpayBaseUrl}/orders`,
        {
          amount: dto.amount, // paise
          currency: 'INR',
          receipt: 'fee_' + randomUUID().replace(/-/g, ''),
          notes: {
            tenantId,
            schoolId: account.schoolId,
            invoiceId: dto.invoiceId,
            description: transactionDesc,
          },
        },
        {
          timeout: 15000,
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const gatewayOrderId: string = response.data.id;
      if (typeof gatewayOrderId !== 'string' || !/^order_[a-zA-Z0-9]+$/.test(gatewayOrderId) || response.data.amount !== dto.amount || response.data.currency !== 'INR') {
        throw new Error('Invalid payment provider order response');
      }
      const tx = await this.prisma.paymentGatewayTransaction.create({
        data: {
          tenantId,
          paymentAccountId: account.id,
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
        razorpayKeyId: credentials.keyId,
        invoiceId: dto.invoiceId,
        customerMessage: 'Complete payment via Razorpay Checkout (UPI, Cards, NetBanking).',
      };
    } catch (error: any) {
      this.logger.error('School Razorpay order creation failed');
      if (error.response?.data?.error?.description) {
        throw new BadRequestException(error.response.data.error.description);
      }
      throw new InternalServerErrorException('Failed to initiate Razorpay payment order');
    }
  }

  // ==================== CHECKOUT SIGNATURE VERIFICATION ====================

  async verifyRazorpayCheckout(dto: VerifyPaymentDto): Promise<any> {
    const tenantId = this.tenantService.requireTenantContext();
    const transaction = await this.prisma.paymentGatewayTransaction.findFirst({
      where: { tenantId, gatewayOrderId: dto.razorpayOrderId, gateway: 'RAZORPAY' },
    });
    if (!transaction) throw new NotFoundException('Payment order not found');
    const credentials = await this.accounts.forTransaction(transaction);

    const expectedSig = createHmac('sha256', credentials.keySecret)
      .update(`${transaction.gatewayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    const providedBuf = Buffer.from(dto.razorpaySignature || '', 'utf8');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    if (
      providedBuf.length !== expectedBuf.length ||
      !timingSafeEqual(providedBuf, expectedBuf)
    ) {
      throw new BadRequestException('Invalid Razorpay payment signature');
    }

    // A valid checkout signature can still refer to an authorized payment.
    // Credit fees only after the provider confirms capture and exact order value.
    let captured: any;
    try {
      const response = await axios.get(`${this.razorpayBaseUrl}/payments/${encodeURIComponent(dto.razorpayPaymentId)}`, {
        auth: { username: credentials.keyId, password: credentials.keySecret }, timeout: 15000,
      });
      captured = response.data;
    } catch { throw new ServiceUnavailableException('Payment confirmation is temporarily unavailable. Your school can reconcile the payment after confirmation.'); }
    if (captured?.id !== dto.razorpayPaymentId || captured.order_id !== transaction.gatewayOrderId || captured.status !== 'captured' || captured.amount !== transaction.amount || captured.currency !== transaction.currency) throw new BadRequestException('Payment has not been captured for this order and amount');

    return this.completeTransaction(transaction, {
      gatewayPaymentId: dto.razorpayPaymentId,
      receiptNumber: dto.razorpayPaymentId,
      utrNumber: captured.acquirer_data?.rrn || captured.acquirer_data?.upi_transaction_id,
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
        where: { gatewayOrderId: orderId, gateway: 'RAZORPAY' },
      }),
    );

    if (!transaction) {
      this.logger.error(`Transaction not found for gatewayOrderId: ${orderId}`);
      return { received: true };
    }

    this.tenantService.setTenantId(transaction.tenantId);

    if (transaction.callbackReceived && transaction.status !== 'FAILED') {
      this.logger.warn(`Duplicate webhook dropped for order: ${orderId}`);
      return { received: true };
    }

    const isSuccess = ['payment.captured', 'order.paid'].includes(payload.event) && entity?.status === 'captured';

    if (isSuccess) {
      if (!paymentId || entity?.amount !== transaction.amount) {
        throw new BadRequestException('Payment callback amount does not match original order');
      }
      if (entity?.currency !== transaction.currency) {
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
    try { return await this.prisma.$transaction(async tx => {
      // Settlement and ledger posting commit together. A process failure cannot
      // consume a webhook while leaving the invoice uncredited.
      const changed = await tx.paymentGatewayTransaction.updateMany({ where: { id: transaction.id, tenantId: transaction.tenantId, OR: [{ callbackReceived: false }, { status: 'FAILED' }] }, data: { status: 'COMPLETED', gatewayPaymentId: details.gatewayPaymentId, receiptNumber: details.receiptNumber, utrNumber: details.utrNumber, upiVpa: details.upiVpa || transaction.upiVpa, transactionDate: new Date(), callbackReceived: true, callbackReceivedAt: new Date(), callbackPayload: details.callbackPayload, reconciliationStatus: 'PENDING' } });
      if (!changed.count) return { status: 'ALREADY_PROCESSED', transactionId: transaction.id };
      if (!transaction.invoiceId) {
        await tx.paymentGatewayTransaction.update({ where: { id: transaction.id }, data: { reconciliationStatus: 'UNMATCHED' } });
        return { status: 'UNMATCHED', transactionId: transaction.id };
      }
      const payment = await this.feesService.recordPayment({ invoiceId: transaction.invoiceId, amount: transaction.amount, paymentMethod: details.method, reference: details.gatewayPaymentId || details.receiptNumber, paymentDate: new Date().toISOString(), notes: details.notes }, transaction.initiatedBy || undefined, tx);
      await tx.paymentGatewayTransaction.update({ where: { id: transaction.id }, data: { paymentId: payment.id, isReconciled: true, reconciledAt: new Date(), reconciliationStatus: 'MATCHED' } });
      return { status: 'COMPLETED', transactionId: transaction.id, paymentId: payment.id, receiptNumber: details.receiptNumber };
    }); } catch (error) {
      if (!(error instanceof BadRequestException || error instanceof ConflictException)) throw error;
      await this.prisma.paymentGatewayTransaction.updateMany({ where: { id: transaction.id, tenantId: transaction.tenantId, OR: [{ callbackReceived: false }, { status: 'FAILED' }] }, data: { status: 'COMPLETED', gatewayPaymentId: details.gatewayPaymentId, receiptNumber: details.receiptNumber, transactionDate: new Date(), callbackReceived: true, callbackReceivedAt: new Date(), callbackPayload: details.callbackPayload, reconciliationStatus: 'UNMATCHED', resultDesc: 'Captured payment needs school reconciliation' } });
      return { status: 'UNMATCHED', transactionId: transaction.id };
    }
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
    return this.prisma.$transaction(async client => {
      const changed = await client.paymentGatewayTransaction.updateMany({ where: { id: dto.transactionId, tenantId }, data: { updatedAt: new Date() } });
      if (!changed.count) throw new NotFoundException('Transaction not found');
      const transaction = await client.paymentGatewayTransaction.findFirstOrThrow({ where: { id: dto.transactionId, tenantId } });
      if (transaction.paymentId) throw new ConflictException('Transaction already linked to a payment');
      if (transaction.gateway !== 'UPI' && transaction.status !== 'COMPLETED') throw new BadRequestException('Only captured gateway payments can be reconciled');
      if (transaction.paymentAccountId) {
        const account = await client.schoolPaymentAccount.findFirst({ where: { id: transaction.paymentAccountId, tenantId }, select: { schoolId: true } });
        const target = await client.invoice.findFirst({ where: { id: dto.invoiceId, tenantId }, select: { paymentSchoolId: true } });
        if (!account || !target || target.paymentSchoolId !== account.schoolId) throw new BadRequestException('A payment can only be reconciled to an invoice from the receiving school');
      }
      const reference = transaction.gatewayPaymentId || transaction.receiptNumber || transaction.utrNumber || transaction.gatewayOrderId || transaction.id;
      const payment = await this.feesService.recordPayment({ invoiceId: dto.invoiceId, amount: transaction.amount, paymentMethod: transaction.gateway === 'UPI' ? PaymentMethod.UPI : PaymentMethod.RAZORPAY, reference, paymentDate: (transaction.transactionDate || transaction.createdAt).toISOString(), notes: dto.notes || `Manual bank reconciliation (${reference})` }, userId, client);
      return client.paymentGatewayTransaction.update({ where: { id: transaction.id }, data: { invoiceId: dto.invoiceId, paymentId: payment.id, status: 'COMPLETED', callbackReceived: true, callbackReceivedAt: new Date(), isReconciled: true, reconciledAt: new Date(), reconciliationStatus: 'MATCHED' } });
    });
  }

}

