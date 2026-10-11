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
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { FeesService } from '../fees/fees.service';
import {
  InitiateSTKPushDto,
  STKPushResponseDto,
  STKPushCallbackDto,
  QuerySTKStatusDto,
} from './dto/stk-push.dto';
import {
  C2BCallbackDto,
  C2BValidationDto,
  C2BValidationResponseDto,
  C2BConfirmationResponseDto,
} from './dto/c2b-callback.dto';
import {
  ReconcileTransactionDto,
  QueryUnmatchedTransactionsDto,
  ManualReconciliationDto,
  ReconciliationStatus,
  ReconciliationAction,
} from './dto/reconciliation.dto';
import axios from 'axios';

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly baseUrl: string;
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly shortCode: string;
  private readonly passkey: string;
  private readonly callbackUrl: string;
  private readonly validationUrl: string;
  private readonly confirmationUrl: string;
  private accessTokenCache: { token: string; expiresAt: number } | null = null;

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private feesService: FeesService,
    private configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get('MPESA_BASE_URL', '') ||
      'https://sandbox.safaricom.co.ke';
    this.consumerKey = this.configService.get('MPESA_CONSUMER_KEY', '');
    this.consumerSecret = this.configService.get('MPESA_CONSUMER_SECRET', '');
    this.shortCode =
      this.configService.get('MPESA_SHORT_CODE', '') ||
      this.configService.get('MPESA_SHORTCODE', '');
    this.passkey = this.configService.get('MPESA_PASSKEY', '');
    const callbackBase = this.configService.get('MPESA_CALLBACK_URL', '');
    const callbackToken = this.configService.get('MPESA_CALLBACK_TOKEN', '');
    this.callbackUrl = callbackBase && callbackToken ? callbackBase + (callbackBase.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(callbackToken) : ''; 
    this.validationUrl = this.configService.get('MPESA_VALIDATION_URL', '');
    this.confirmationUrl = this.configService.get('MPESA_CONFIRMATION_URL', '');
  }

  private parseProviderDate(value:unknown):Date {
    const text=String(value);
    if(!/^\d{14}$/.test(text))throw new BadRequestException('Invalid payment date');
    const date=new Date(text.slice(0,4)+'-'+text.slice(4,6)+'-'+text.slice(6,8)+'T'+text.slice(8,10)+':'+text.slice(10,12)+':'+text.slice(12,14)+'+03:00');
    if(!Number.isFinite(date.getTime()))throw new BadRequestException('Invalid payment date');
    return date;
  }
  // ==================== AUTHENTICATION ====================

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (
      this.accessTokenCache &&
      this.accessTokenCache.expiresAt > Date.now()
    ) {
      return this.accessTokenCache.token;
    }

    try {
      const auth = Buffer.from(
        `${this.consumerKey}:${this.consumerSecret}`,
      ).toString('base64');

      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        },
      );

      const { access_token, expires_in } = response.data;

      // Cache token (expire 1 minute early for safety)
      this.accessTokenCache = {
        token: access_token,
        expiresAt: Date.now() + (parseInt(expires_in) - 60) * 1000,
      };

      return access_token;
    } catch (error: any) {
      this.logger.error('Failed to get M-Pesa access token', error);
      throw new InternalServerErrorException(
        'Failed to authenticate with M-Pesa',
      );
    }
  }

  // ==================== STK PUSH ====================

  async initiateSTKPush(
    dto: InitiateSTKPushDto,
    userId?: string,
  ): Promise<STKPushResponseDto> {
    const tenantId = this.tenantService.requireTenantContext();
    if (!this.consumerKey || !this.consumerSecret || !this.passkey || !this.callbackUrl) throw new BadRequestException('M-Pesa is not configured. Contact your school office.');

    // Validate invoice exists and get details
    const invoice = await this.feesService.findOneInvoice(dto.invoiceId);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot pay for cancelled invoice');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already fully paid');
    }

    // Validate payment amount
    if (dto.amount > invoice.balanceAmount) {
      throw new BadRequestException(
        `Payment amount exceeds invoice balance (${invoice.balanceAmount} cents)`,
      );
    }

    if (dto.amount < 100) {
      throw new BadRequestException('Minimum payment amount is KES 1.00');
    }

    // Generate timestamp and password
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);
    const password = Buffer.from(
      `${this.shortCode}${this.passkey}${timestamp}`,
    ).toString('base64');

    // Convert amount from cents to shillings
    if (dto.amount % 100 !== 0) throw new BadRequestException('M-Pesa payments must use whole shilling amounts');
    const amountInShillings = dto.amount / 100;

    const accountReference =
      dto.accountReference || invoice.invoiceNumber || 'SCHOOL_FEE';
    const transactionDesc = dto.transactionDesc || 'School Fee Payment';

    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: this.shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amountInShillings,
          PartyA: dto.phoneNumber,
          PartyB: this.shortCode,
          PhoneNumber: dto.phoneNumber,
          CallBackURL: this.callbackUrl,
          AccountReference: accountReference,
          TransactionDesc: transactionDesc,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const {
        CheckoutRequestID,
        MerchantRequestID,
        ResponseCode,
        ResponseDescription,
        CustomerMessage,
      } = response.data;

      // Record transaction in database
      await this.prisma.mpesaTransaction.create({
        data: {
          tenantId,
          transactionType: 'STK_PUSH',
          merchantRequestId: MerchantRequestID,
          checkoutRequestId: CheckoutRequestID,
          phoneNumber: dto.phoneNumber,
          amount: dto.amount,
          accountReference: accountReference,
          transactionDesc: transactionDesc,
          invoiceId: dto.invoiceId,
          status: 'PENDING',
          initiatedBy: userId,
          responseCode: ResponseCode,
          responseDescription: ResponseDescription,
        },
      });

      this.logger.log(
        `STK Push initiated: ${CheckoutRequestID} for invoice ${dto.invoiceId}`,
      );

      return {
        checkoutRequestId: CheckoutRequestID,
        merchantRequestId: MerchantRequestID,
        responseCode: ResponseCode,
        responseDescription: ResponseDescription,
        customerMessage: CustomerMessage,
        invoiceId: dto.invoiceId,
        amount: dto.amount,
      };
    } catch (error: any) {
      this.logger.error('STK Push failed', error);

      if (error.response?.data) {
        throw new BadRequestException(
          error.response.data.errorMessage ||
            'Failed to initiate M-Pesa payment',
        );
      }

      throw new InternalServerErrorException('Failed to initiate M-Pesa payment');
    }
  }

  async handleSTKCallback(callback: STKPushCallbackDto): Promise<void> {
    const { stkCallback } = callback.Body;
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    this.logger.log(`STK Callback received: ${CheckoutRequestID}`);

    // Find transaction
    const transaction = await this.prisma.mpesaTransaction.findFirst({
      where: {
        checkoutRequestId: CheckoutRequestID,
        merchantRequestId: MerchantRequestID,
      },
    });

    if (!transaction) {
      this.logger.error(`Transaction not found: ${CheckoutRequestID}`);
      return;
    }

    this.tenantService.setTenantId(transaction.tenantId);

    // Check if already processed
    if (transaction.callbackReceived) {
      this.logger.warn(
        `Duplicate callback received for: ${CheckoutRequestID}`,
      );
      return;
    }

    // Success
    if (ResultCode === 0 && CallbackMetadata) {
      const metadata = CallbackMetadata.Item.reduce((acc, item) => {
        acc[item.Name] = item.Value;
        return acc;
      }, {} as any);

      if (Math.round(Number(metadata.Amount) * 100) !== transaction.amount || String(metadata.PhoneNumber) !== transaction.phoneNumber) throw new BadRequestException('Payment callback does not match the original request');
      const mpesaReceiptNumber = metadata.MpesaReceiptNumber;
      const transactionDate = this.parseProviderDate(metadata.TransactionDate);
      const phoneNumber = metadata.PhoneNumber?.toString();

      // Atomic idempotency check: only update if callbackReceived is false
      const updateResult = await this.prisma.mpesaTransaction.updateMany({
        where: { id: transaction.id, callbackReceived: false },
        data: {
          status: 'COMPLETED',
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          mpesaReceiptNumber,
          transactionDate,
          phoneNumber: phoneNumber || transaction.phoneNumber,
          callbackReceived: true,
          callbackReceivedAt: new Date(),
          reconciliationStatus: 'PENDING',
        },
      });

      if (updateResult.count === 0) {
        this.logger.warn(
          `Concurrent duplicate callback safely dropped for transaction: ${transaction.id}`,
        );
        return;
      }

      // Auto-allocate payment to invoice if not already done
      if (transaction.invoiceId && !transaction.paymentId) {
        try {
          const payment = await this.feesService.recordPayment(
            {
              invoiceId: transaction.invoiceId,
              amount: transaction.amount,
              paymentMethod: PaymentMethod.MPESA,
              reference: mpesaReceiptNumber,
              paymentDate: transactionDate.toISOString(),
              notes: `M-Pesa payment from ${phoneNumber}`,
            },
            transaction.initiatedBy || undefined,
          );

          // Link payment to transaction
          await this.prisma.mpesaTransaction.update({
            where: { id: transaction.id },
            data: {
              paymentId: payment!.id,
              reconciliationStatus: 'MATCHED',
            },
          });

          this.logger.log(
            `Payment auto-allocated: ${mpesaReceiptNumber} → Invoice ${transaction.invoiceId}`,
          );
        } catch (error: any) {
          this.logger.error('Failed to auto-allocate payment', error);
          // Mark as unmatched for manual reconciliation
          await this.prisma.mpesaTransaction.update({
            where: { id: transaction.id },
            data: { reconciliationStatus: 'UNMATCHED' },
          });
        }
      }
    } else {
      // Failed transaction
      await this.prisma.mpesaTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          callbackReceived: true,
          callbackReceivedAt: new Date(),
          reconciliationStatus: 'FAILED',
        },
      });

      this.logger.warn(
        `STK Push failed: ${CheckoutRequestID} - ${ResultDesc}`,
      );
    }
  }

  async querySTKStatus(dto: QuerySTKStatusDto): Promise<any> {
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);
    const password = Buffer.from(
      `${this.shortCode}${this.passkey}${timestamp}`,
    ).toString('base64');

    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: this.shortCode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: dto.checkoutRequestId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.logger.error('STK status query failed', error);
      throw new BadRequestException('Failed to query transaction status');
    }
  }

  // ==================== C2B CALLBACKS ====================

  async validateC2BPayment(
    dto: C2BValidationDto,
  ): Promise<C2BValidationResponseDto> {
    this.logger.log(`C2B Validation: ${dto.TransID}`);

    // Basic validation - accept all valid transactions
    // You can add custom validation logic here (e.g., check invoice exists)

    if (dto.TransAmount < 1) {
      return {
        ResultCode: 1,
        ResultDesc: 'Invalid transaction amount',
      };
    }

    return {
      ResultCode: 0,
      ResultDesc: 'Accepted',
    };
  }

  async confirmC2BPayment(
    dto: C2BCallbackDto,
  ): Promise<C2BConfirmationResponseDto> {
    this.logger.log(`C2B Confirmation: ${dto.TransID}`);

    const invoices = await this.prisma.executeWithoutTenantFilter(() => this.prisma.invoice.findMany({ where: { invoiceNumber: dto.BillRefNumber }, take: 2 }));
    const tenantId = invoices.length === 1 ? invoices[0].tenantId : null;
    if (tenantId) this.tenantService.setTenantId(tenantId);

    if (!tenantId) {
      this.logger.error('No tenant context for C2B callback');
      return {
        ResultCode: 1,
        ResultDesc: 'No tenant context',
      };
    }

    try {
      // Check for duplicate
      const existing = await this.prisma.mpesaTransaction.findFirst({
        where: {
          tenantId,
          mpesaReceiptNumber: dto.TransID,
        },
      });

      if (existing) {
        this.logger.warn(`Duplicate C2B transaction: ${dto.TransID}`);
        return {
          ResultCode: 0,
          ResultDesc: 'Duplicate transaction',
        };
      }

      // Parse transaction date
      const transactionDate = this.parseTransactionTime(dto.TransTime);

      // Convert amount from shillings to cents
      const amountInCents = Math.floor(dto.TransAmount * 100);

      // Create transaction record
      const transaction = await this.prisma.mpesaTransaction.create({
        data: {
          tenantId,
          transactionType: 'C2B',
          mpesaReceiptNumber: dto.TransID,
          phoneNumber: dto.MSISDN,
          amount: amountInCents,
          accountReference: dto.BillRefNumber,
          transactionDate,
          status: 'COMPLETED',
          resultCode: 0,
          resultDesc: 'Success',
          callbackReceived: true,
          callbackReceivedAt: new Date(),
          reconciliationStatus: 'PENDING',
          metadata: {
            TransactionType: dto.TransactionType,
            FirstName: dto.FirstName,
            MiddleName: dto.MiddleName,
            LastName: dto.LastName,
            InvoiceNumber: dto.InvoiceNumber,
            OrgAccountBalance: dto.OrgAccountBalance,
          },
        },
      });

      // Try to auto-match with invoice
      await this.autoReconcileC2B(transaction.id, dto.BillRefNumber);

      return {
        ResultCode: 0,
        ResultDesc: 'Accepted',
      };
    } catch (error: any) {
      this.logger.error('Failed to process C2B confirmation', error);
      return {
        ResultCode: 1,
        ResultDesc: 'Failed to process payment',
      };
    }
  }

  private async autoReconcileC2B(
    transactionId: string,
    billReference: string,
  ): Promise<void> {
    try {
      // Try to find invoice by invoice number or admission number
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          OR: [
            { invoiceNumber: billReference },
            {
              student: {
                admissionNumber: billReference,
              },
            },
          ],
          status: {
            not: 'CANCELLED',
          },
        },
      });

      if (!invoice) {
        this.logger.warn(
          `No invoice found for bill reference: ${billReference}`,
        );
        await this.prisma.mpesaTransaction.update({
          where: { id: transactionId },
          data: { reconciliationStatus: 'UNMATCHED' },
        });
        return;
      }

      const transaction = await this.prisma.mpesaTransaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) return;

      // Check if amount matches or is less than balance
      if (transaction.amount > invoice.balanceAmount) {
        this.logger.warn(
          `Payment amount exceeds invoice balance for ${billReference}`,
        );
        await this.prisma.mpesaTransaction.update({
          where: { id: transactionId },
          data: { reconciliationStatus: 'UNMATCHED' },
        });
        return;
      }

      // Record payment
      const payment = await this.feesService.recordPayment({
        invoiceId: invoice.id,
        amount: transaction.amount,
        paymentMethod: PaymentMethod.MPESA,
        reference: transaction.mpesaReceiptNumber || (() => { throw new BadRequestException("Missing M-Pesa receipt"); })(),
        paymentDate: transaction.transactionDate?.toISOString(),
        notes: `C2B payment from ${transaction.phoneNumber}`,
      });

      // Update transaction
      await this.prisma.mpesaTransaction.update({
        where: { id: transactionId },
        data: {
          invoiceId: invoice.id,
          paymentId: payment!.id,
          reconciliationStatus: 'MATCHED',
        },
      });

      this.logger.log(
        `C2B payment auto-reconciled: ${transaction.mpesaReceiptNumber} → Invoice ${invoice.invoiceNumber}`,
      );
    } catch (error: any) {
      this.logger.error('Auto-reconciliation failed', error);
      await this.prisma.mpesaTransaction.update({
        where: { id: transactionId },
        data: { reconciliationStatus: 'UNMATCHED' },
      });
    }
  }

  // ==================== RECONCILIATION ====================

  async queryUnmatchedTransactions(query: QueryUnmatchedTransactionsDto) {
    const tenantId = this.tenantService.requireTenantContext();
    const { page = 1, pageSize = 20, status, startDate, endDate } = query;

    const skip = (page - 1) * pageSize;

    const where: any = {
      tenantId,
      reconciliationStatus: status || 'UNMATCHED',
    };

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.transactionDate.lte = new Date(endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      this.prisma.mpesaTransaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { transactionDate: 'desc' },
      }),
      this.prisma.mpesaTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: page < Math.ceil(total / pageSize),
        hasPreviousPage: page > 1,
      },
    };
  }

  async reconcileTransaction(dto: ReconcileTransactionDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const transaction = await this.prisma.mpesaTransaction.findFirst({
      where: { id: dto.transactionId, tenantId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    switch (dto.action) {
      case ReconciliationAction.MATCH:
        if (!dto.invoiceId) {
          throw new BadRequestException('Invoice ID required for matching');
        }

        // Record payment
        const payment = await this.feesService.recordPayment({
          invoiceId: dto.invoiceId,
          amount: transaction.amount,
          paymentMethod: PaymentMethod.MPESA,
          reference: transaction.mpesaReceiptNumber || (() => { throw new BadRequestException("Missing M-Pesa receipt"); })(),
          paymentDate: transaction.transactionDate?.toISOString(),
          notes: dto.notes || `Manual reconciliation by user ${userId}`,
        });

        await this.prisma.mpesaTransaction.update({
          where: { id: dto.transactionId },
          data: {
            invoiceId: dto.invoiceId,
            paymentId: payment!.id,
            reconciliationStatus: 'MATCHED',
          },
        });

        return { success: true, message: 'Transaction matched successfully' };

      case ReconciliationAction.UNMATCH:
        await this.prisma.mpesaTransaction.update({
          where: { id: dto.transactionId },
          data: {
            reconciliationStatus: 'UNMATCHED',
          },
        });

        return { success: true, message: 'Transaction unmatched' };

      case ReconciliationAction.MARK_DUPLICATE:
        await this.prisma.mpesaTransaction.update({
          where: { id: dto.transactionId },
          data: {
            reconciliationStatus: 'DUPLICATE',
          },
        });

        return { success: true, message: 'Transaction marked as duplicate' };

      default:
        throw new BadRequestException('Invalid reconciliation action');
    }
  }

  async manualReconciliation(dto: ManualReconciliationDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Check if transaction exists
    const existing = await this.prisma.mpesaTransaction.findFirst({
      where: {
        tenantId,
        mpesaReceiptNumber: dto.mpesaReference,
      },
    });

    let transaction;

    if (existing) {
      transaction = existing;
    } else {
      // Create manual transaction record
      transaction = await this.prisma.mpesaTransaction.create({
        data: {
          tenantId,
          transactionType: 'MANUAL',
          accountReference: dto.invoiceId,
          mpesaReceiptNumber: dto.mpesaReference,
          phoneNumber: dto.customerPhone || '',
          amount: dto.amount,
          invoiceId: dto.invoiceId,
          transactionDate: dto.transactionDate
            ? new Date(dto.transactionDate)
            : new Date(),
          status: 'COMPLETED',
          resultCode: 0,
          resultDesc: 'Manual entry',
          callbackReceived: true,
          callbackReceivedAt: new Date(),
          reconciliationStatus: 'PENDING',
          initiatedBy: userId,
        },
      });
    }

    // Record payment
    const payment = await this.feesService.recordPayment({
      invoiceId: dto.invoiceId,
      amount: dto.amount,
      paymentMethod: PaymentMethod.MPESA,
      reference: dto.mpesaReference,
      paymentDate: dto.transactionDate,
      notes: dto.notes || 'Manual reconciliation',
    });

    // Update transaction
    await this.prisma.mpesaTransaction.update({
      where: { id: transaction.id },
      data: {
        invoiceId: dto.invoiceId,
        paymentId: payment!.id,
        reconciliationStatus: 'MATCHED',
      },
    });

    return {
      success: true,
      message: 'Payment manually reconciled',
      paymentId: payment!.id,
    };
  }

  // ==================== UTILITIES ====================

  private parseTransactionTime(transTime: string): Date {
    // Format: YYYYMMDDHHmmss
    const year = parseInt(transTime.substring(0, 4));
    const month = parseInt(transTime.substring(4, 6)) - 1;
    const day = parseInt(transTime.substring(6, 8));
    const hour = parseInt(transTime.substring(8, 10));
    const minute = parseInt(transTime.substring(10, 12));
    const second = parseInt(transTime.substring(12, 14));

    return new Date(year, month, day, hour, minute, second);
  }

  async getTransactionById(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const transaction = await this.prisma.mpesaTransaction.findFirst({
      where: { id, tenantId },
      include: {
        invoice: {
          include: {
            student: {
              select: {
                admissionNumber: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async getTransactionStats() {
    const tenantId = this.tenantService.requireTenantContext();

    const [total, completed, pending, failed, unmatched] = await Promise.all([
      this.prisma.mpesaTransaction.count({ where: { tenantId } }),
      this.prisma.mpesaTransaction.count({
        where: { tenantId, status: 'COMPLETED' },
      }),
      this.prisma.mpesaTransaction.count({
        where: { tenantId, status: 'PENDING' },
      }),
      this.prisma.mpesaTransaction.count({
        where: { tenantId, status: 'FAILED' },
      }),
      this.prisma.mpesaTransaction.count({
        where: { tenantId, reconciliationStatus: 'UNMATCHED' },
      }),
    ]);

    const totalAmount = await this.prisma.mpesaTransaction.aggregate({
      where: { tenantId, status: 'COMPLETED' },
      _sum: { amount: true },
    });

    return {
      total,
      completed,
      pending,
      failed,
      unmatched,
      totalAmount: totalAmount._sum.amount || 0,
    };
  }
}
