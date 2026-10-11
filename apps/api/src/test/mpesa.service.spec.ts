import { Test, TestingModule } from '@nestjs/testing';
import { MpesaService } from '../modules/mpesa/mpesa.service';
import { PrismaService } from '../database/prisma.service';
import { TenantService } from '../database/tenant.service';
import { FeesService } from '../modules/fees/fees.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { PaymentMethod } from '@krypton/types';

describe('M-Pesa Service & Idempotency Suite', () => {
  let mpesaService: MpesaService;
  let prisma: any;
  let feesService: any;
  let tenantService: any;
  let configService: any;

  const mockPendingTransaction = {
    id: 'tx_mpesa_001',
    merchantRequestId: 'merchant_req_1',
    checkoutRequestId: 'ws_CO_01012025_12345678',
    amount: 1500000, // 15,000 KES in cents
    phoneNumber: '254712345678',
    status: 'PENDING',
    callbackReceived: false,
    invoiceId: 'inv_school_001',
    tenantId: 'school_1',
    initiatedBy: 'user_parent_01',
  };

  beforeEach(async () => {
    prisma = {
      mpesaTransaction: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };

    feesService = {
      recordPayment: jest.fn(),
    };

    tenantService = {
      getTenantId: jest.fn().mockReturnValue('school_1'),
      setTenantId: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key, defaultVal) => defaultVal || ''),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MpesaService,
        { provide: PrismaService, useValue: prisma },
        { provide: TenantService, useValue: tenantService },
        { provide: FeesService, useValue: feesService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    mpesaService = module.get<MpesaService>(MpesaService);
  });

  describe('handleSTKCallback', () => {
    const validCallbackDto = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'merchant_req_1',
          CheckoutRequestID: 'ws_CO_01012025_12345678',
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 15000 },
              { Name: 'MpesaReceiptNumber', Value: 'QGH123XYZ' },
              { Name: 'TransactionDate', Value: 20261011120000 },
              { Name: 'PhoneNumber', Value: 254712345678 },
            ],
          },
        },
      },
    };

    it('should successfully complete transaction and auto-allocate fee payment atomically', async () => {
      prisma.mpesaTransaction.findFirst.mockResolvedValue(mockPendingTransaction);
      // Atomic CAS succeeds
      prisma.mpesaTransaction.updateMany.mockResolvedValue({ count: 1 });
      feesService.recordPayment.mockResolvedValue({ id: 'pmt_fee_allocated_01' });
      prisma.mpesaTransaction.update.mockResolvedValue({
        ...mockPendingTransaction,
        status: 'COMPLETED',
        paymentId: 'pmt_fee_allocated_01',
      });

      await mpesaService.handleSTKCallback(validCallbackDto);

      // Verify atomic CAS check was performed
      expect(prisma.mpesaTransaction.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPendingTransaction.id, callbackReceived: false },
          data: expect.objectContaining({
            status: 'COMPLETED',
            resultCode: 0,
            mpesaReceiptNumber: 'QGH123XYZ',
            callbackReceived: true,
          }),
        }),
      );

      // Verify payment was allocated to invoice
      expect(feesService.recordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId: 'inv_school_001',
          amount: 1500000,
          paymentMethod: PaymentMethod.MPESA,
          reference: 'QGH123XYZ',
        }),
        'user_parent_01',
      );

      // Verify payment link was saved
      expect(prisma.mpesaTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPendingTransaction.id },
          data: expect.objectContaining({
            paymentId: 'pmt_fee_allocated_01',
            reconciliationStatus: 'MATCHED',
          }),
        }),
      );
    });

    it('should safely drop concurrent duplicate callback without double-allocating fee payment', async () => {
      prisma.mpesaTransaction.findFirst.mockResolvedValue(mockPendingTransaction);
      // Atomic CAS returns count: 0 (another concurrent worker already processed it)
      prisma.mpesaTransaction.updateMany.mockResolvedValue({ count: 0 });

      await mpesaService.handleSTKCallback(validCallbackDto);

      expect(prisma.mpesaTransaction.updateMany).toHaveBeenCalledTimes(1);
      // FeesService MUST NOT be called a second time
      expect(feesService.recordPayment).not.toHaveBeenCalled();
      expect(prisma.mpesaTransaction.update).not.toHaveBeenCalled();
    });

    it('should reject callback if amount does not match original transaction', async () => {
      const tamperedDto = {
        Body: {
          stkCallback: {
            ...validCallbackDto.Body.stkCallback,
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 500 }, // Underpaid or tampered
                { Name: 'MpesaReceiptNumber', Value: 'QGH123XYZ' },
                { Name: 'TransactionDate', Value: 20261011120000 },
                { Name: 'PhoneNumber', Value: 254712345678 },
              ],
            },
          },
        },
      };

      prisma.mpesaTransaction.findFirst.mockResolvedValue(mockPendingTransaction);

      await expect(mpesaService.handleSTKCallback(tamperedDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.mpesaTransaction.updateMany).not.toHaveBeenCalled();
      expect(feesService.recordPayment).not.toHaveBeenCalled();
    });

    it('should handle failed STK Push transaction gracefully', async () => {
      const failedCallbackDto = {
        Body: {
          stkCallback: {
            MerchantRequestID: 'merchant_req_1',
            CheckoutRequestID: 'ws_CO_01012025_12345678',
            ResultCode: 1032,
            ResultDesc: 'Request cancelled by user.',
          },
        },
      };

      prisma.mpesaTransaction.findFirst.mockResolvedValue(mockPendingTransaction);
      prisma.mpesaTransaction.update.mockResolvedValue({
        ...mockPendingTransaction,
        status: 'FAILED',
      });

      await mpesaService.handleSTKCallback(failedCallbackDto);

      expect(prisma.mpesaTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockPendingTransaction.id },
          data: expect.objectContaining({
            status: 'FAILED',
            resultCode: 1032,
            resultDesc: 'Request cancelled by user.',
            reconciliationStatus: 'FAILED',
          }),
        }),
      );
      expect(feesService.recordPayment).not.toHaveBeenCalled();
    });
  });
});
