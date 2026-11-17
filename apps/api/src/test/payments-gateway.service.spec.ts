import axios from 'axios';
import { createHmac } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '@krypton/types';
import { PaymentsGatewayService } from '../modules/payments-gateway/payments-gateway.service';
import { GatewayChoice } from '../modules/payments-gateway/dto/gateway-payment.dto';
import { PrismaService } from '../database/prisma.service';
import { TenantService } from '../database/tenant.service';
import { FeesService } from '../modules/fees/fees.service';

describe('Indian Payments Gateway Service & Idempotency Suite', () => {
  let service: PaymentsGatewayService;
  let prisma: any;
  let feesService: any;
  let tenantService: any;
  let configService: any;

  const mockPendingTransaction = {
    id: 'tx_rzp_001',
    gateway: 'RAZORPAY',
    gatewayOrderId: 'order_KPS20260001',
    amount: 1500000, // INR 15,000 in paise
    currency: 'INR',
    phoneNumber: '+919847012345',
    upiVpa: 'parent@okhdfcbank',
    status: 'PENDING',
    callbackReceived: false,
    invoiceId: 'inv_school_001',
    tenantId: 'school_1',
    initiatedBy: 'user_parent_01',
  };

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.spyOn(axios, 'get').mockResolvedValue({ data: { id: 'pay_RZP999888', order_id: mockPendingTransaction.gatewayOrderId, status: 'captured', amount: mockPendingTransaction.amount, currency: 'INR' } });
    prisma = {
      executeWithoutTenantFilter: jest.fn((fn: () => any) => fn()),
      paymentGatewayTransaction: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };

    prisma.$transaction = jest.fn((work: any) => work(prisma));

    feesService = {
      findOneInvoice: jest.fn(),
      recordPayment: jest.fn(),
    };

    tenantService = {
      requireTenantContext: jest.fn().mockReturnValue('school_1'),
      getTenantId: jest.fn().mockReturnValue('school_1'),
      setTenantId: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string, defaultVal?: string) => {
        if (key === 'SCHOOL_UPI_VPA') return 'testschool@okhdfcbank';
        if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_12345';
        if (key === 'RAZORPAY_KEY_SECRET') return 'rzp_test_secret_abc';
        return defaultVal || '';
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsGatewayService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenantService },
        { provide: FeesService, useValue: feesService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<PaymentsGatewayService>(PaymentsGatewayService);
  });

  describe('initiatePayment (UPI)', () => {
    it('should generate an NPCI UPI intent URI in INR', async () => {
      feesService.findOneInvoice.mockResolvedValue({
        id: 'inv_school_001',
        invoiceNumber: 'INV-2026-001',
        status: 'PENDING',
        balanceAmount: 1500000,
      });
      prisma.paymentGatewayTransaction.create.mockResolvedValue({ id: 'tx_upi_001' });

      const result = await service.initiatePayment(
        {
          invoiceId: 'inv_school_001',
          gateway: GatewayChoice.UPI,
          amount: 1500000,
          phoneNumber: '+919847012345',
          upiVpa: 'parent@okhdfcbank',
        },
        'user_parent_01',
      );

      expect(result.gateway).toBe('UPI');
      expect(result.currency).toBe('INR');
      expect(result.upiIntentUri).toContain('upi://pay?');
      expect(result.upiIntentUri).toContain('cu=INR');
      expect(result.upiIntentUri).toContain('am=15000.00');
    });
  });

  describe('verifyRazorpayCheckout', () => {
    it('should verify HMAC-SHA256 signature and allocate fee payment atomically', async () => {
      const paymentId = 'pay_RZP999888';
      const sig = createHmac('sha256', 'rzp_test_secret_abc')
        .update(`${mockPendingTransaction.gatewayOrderId}|${paymentId}`)
        .digest('hex');

      prisma.paymentGatewayTransaction.findFirst.mockResolvedValue(mockPendingTransaction);
      prisma.paymentGatewayTransaction.updateMany.mockResolvedValue({ count: 1 });
      feesService.recordPayment.mockResolvedValue({ id: 'pmt_fee_allocated_01' });
      prisma.paymentGatewayTransaction.update.mockResolvedValue({
        ...mockPendingTransaction,
        status: 'COMPLETED',
        paymentId: 'pmt_fee_allocated_01',
      });

      const res = await service.verifyRazorpayCheckout({
        razorpayOrderId: mockPendingTransaction.gatewayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: sig,
      });

      expect(res.status).toBe('COMPLETED');
      expect(feesService.recordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId: 'inv_school_001',
          amount: 1500000,
          paymentMethod: PaymentMethod.RAZORPAY,
          reference: paymentId,
        }),
        'user_parent_01',
        prisma,
      );
    });

    it('should reject invalid Razorpay checkout signature', async () => {
      await expect(
        service.verifyRazorpayCheckout({
          razorpayOrderId: mockPendingTransaction.gatewayOrderId,
          razorpayPaymentId: 'pay_RZP999888',
          razorpaySignature: 'invalid_signature',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it.each([
      { status: 'authorized' }, { amount: 1 }, { currency: 'USD' }, { order_id: 'another-order' },
    ])('does not credit a signed checkout with mismatched provider state %p', async mismatch => {
      prisma.paymentGatewayTransaction.findFirst.mockResolvedValue(mockPendingTransaction);
      const paymentId = 'pay_RZP999888';
      jest.mocked(axios.get).mockResolvedValueOnce({ data: { id: paymentId, order_id: mockPendingTransaction.gatewayOrderId, status: 'captured', amount: mockPendingTransaction.amount, currency: 'INR', ...mismatch } });
      const signature = createHmac('sha256', 'rzp_test_secret_abc').update(mockPendingTransaction.gatewayOrderId + '|' + paymentId).digest('hex');
      await expect(service.verifyRazorpayCheckout({ razorpayOrderId: mockPendingTransaction.gatewayOrderId, razorpayPaymentId: paymentId, razorpaySignature: signature })).rejects.toThrow(BadRequestException);
      expect(feesService.recordPayment).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    const validWebhook = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_RZP123456',
            order_id: 'order_KPS20260001',
            amount: 1500000,
            currency: 'INR',
            status: 'captured',
            method: 'upi',
            vpa: 'parent@okhdfcbank',
            acquirer_data: {
              rrn: '428391045612',
            },
          },
        },
      },
    };

    it('should complete transaction and auto-allocate UPI fee payment atomically', async () => {
      prisma.paymentGatewayTransaction.findFirst.mockResolvedValue(mockPendingTransaction);
      prisma.paymentGatewayTransaction.updateMany.mockResolvedValue({ count: 1 });
      feesService.recordPayment.mockResolvedValue({ id: 'pmt_fee_allocated_01' });
      prisma.paymentGatewayTransaction.update.mockResolvedValue({
        ...mockPendingTransaction,
        status: 'COMPLETED',
        paymentId: 'pmt_fee_allocated_01',
      });

      await service.handleWebhook(validWebhook);

      expect(prisma.paymentGatewayTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: mockPendingTransaction.id }),
          data: expect.objectContaining({
            status: 'COMPLETED',
            utrNumber: '428391045612',
            receiptNumber: '428391045612',
            callbackReceived: true,
          }),
        }),
      );

      expect(feesService.recordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId: 'inv_school_001',
          amount: 1500000,
          paymentMethod: PaymentMethod.UPI,
          reference: validWebhook.payload.payment.entity.id,
        }),
        'user_parent_01',
        prisma,
      );
    });

    it('should safely drop concurrent duplicate webhook without double-allocating payment', async () => {
      prisma.paymentGatewayTransaction.findFirst.mockResolvedValue(mockPendingTransaction);
      prisma.paymentGatewayTransaction.updateMany.mockResolvedValue({ count: 0 });

      await service.handleWebhook(validWebhook);

      expect(prisma.paymentGatewayTransaction.updateMany).toHaveBeenCalledTimes(1);
      expect(feesService.recordPayment).not.toHaveBeenCalled();
      expect(prisma.paymentGatewayTransaction.update).not.toHaveBeenCalled();
    });

    it('should reject webhook if amount does not match original order', async () => {
      const tampered = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              ...validWebhook.payload.payment.entity,
              amount: 50000,
            },
          },
        },
      };

      prisma.paymentGatewayTransaction.findFirst.mockResolvedValue(mockPendingTransaction);

      await expect(service.handleWebhook(tampered)).rejects.toThrow(BadRequestException);
      expect(prisma.paymentGatewayTransaction.updateMany).not.toHaveBeenCalled();
      expect(feesService.recordPayment).not.toHaveBeenCalled();
    });

    it('should handle failed payment webhook gracefully', async () => {
      const failed = {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_RZPFAIL',
              order_id: 'order_KPS20260001',
              status: 'failed',
              error_description: 'Payment cancelled by customer',
            },
          },
        },
      };

      prisma.paymentGatewayTransaction.findFirst.mockResolvedValue(mockPendingTransaction);
      prisma.paymentGatewayTransaction.updateMany.mockResolvedValue({ count: 1 });

      await service.handleWebhook(failed);

      expect(prisma.paymentGatewayTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: mockPendingTransaction.id }),
          data: expect.objectContaining({
            status: 'FAILED',
            reconciliationStatus: 'FAILED',
          }),
        }),
      );
      expect(feesService.recordPayment).not.toHaveBeenCalled();
    });
  });
});

