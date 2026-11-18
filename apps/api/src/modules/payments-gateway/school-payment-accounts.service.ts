import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { EncryptionUtil } from '../../common/utils/encryption.util';
import { SchoolPaymentAccountDto } from './dto/school-payment-account.dto';

@Injectable()
export class SchoolPaymentAccountsService {
  constructor(private db: PrismaService, private tenants: TenantService, private encryption: EncryptionUtil, private config: ConfigService) {}

  private summary(account: any) {
    return account ? { id: account.id, merchantName: account.merchantName, razorpayEnabled: account.razorpayEnabled,
      razorpayKeyId: account.razorpayKeyId, hasKeySecret: !!account.razorpayKeySecret,
      hasWebhookSecret: !!account.razorpayWebhookSecret, upiVpa: account.upiVpa || '',
      mode: account.razorpayKeyId?.startsWith('rzp_live_') ? 'LIVE' : 'TEST', createdAt: account.createdAt } : null;
  }

  async list() {
    const tenantId = this.tenants.requireTenantContext();
    const schools = await this.db.school.findMany({ where: { tenantId }, select: {
      id: true, name: true, isActive: true, paymentAccounts: { where: { tenantId, isCurrent: true }, take: 1 },
    }, orderBy: { name: 'asc' } });
    return schools.map(school => ({ id: school.id, name: school.name, isActive: school.isActive, account: this.summary(school.paymentAccounts[0]) }));
  }

  async save(schoolId: string, dto: SchoolPaymentAccountDto, userId: string) {
    const tenantId = this.tenants.requireTenantContext();
    // An ephemeral salt would make saved merchant credentials unreadable after restart.
    if ((dto.razorpayKeySecret || dto.razorpayWebhookSecret) &&
      (!this.config.get<string>('ENCRYPTION_MASTER_KEY') || !/^[a-fA-F0-9]{64}$/.test(this.config.get<string>('ENCRYPTION_SALT') || ''))) {
      throw new ServiceUnavailableException('Persistent credential encryption must be configured before saving Razorpay secrets');
    }
    return this.db.$transaction(async tx => {
      // This row lock also orders concurrent saves; the version check prevents lost edits.
      const locked = await tx.school.updateMany({ where: { id: schoolId, tenantId }, data: { updatedAt: new Date() } });
      if (!locked.count) throw new NotFoundException('School not found');
      const previous = await tx.schoolPaymentAccount.findFirst({ where: { tenantId, schoolId, isCurrent: true } });
      if ((previous?.id || '') !== dto.expectedAccountId) throw new ConflictException('Payment settings changed. Reload before saving.');
      const keyId = dto.razorpayKeyId === undefined ? previous?.razorpayKeyId : dto.razorpayKeyId || null;
      const keyChanged = keyId !== (previous?.razorpayKeyId || null);
      const keySecret = dto.razorpayKeySecret ? await this.encryption.encrypt(dto.razorpayKeySecret) : keyChanged ? null : previous?.razorpayKeySecret;
      const webhookSecret = dto.razorpayWebhookSecret ? await this.encryption.encrypt(dto.razorpayWebhookSecret) : keyChanged ? null : previous?.razorpayWebhookSecret;
      if (dto.razorpayEnabled && (!keyId || !keySecret || !webhookSecret)) throw new BadRequestException('Enabling Razorpay requires the school key ID, key secret and webhook secret');
      if (keyChanged && keyId && (!dto.razorpayKeySecret || !dto.razorpayWebhookSecret)) throw new BadRequestException('A new Razorpay key ID requires both secrets');
      await tx.schoolPaymentAccount.updateMany({ where: { tenantId, schoolId, isCurrent: true }, data: { isCurrent: false } });
      const account = await tx.schoolPaymentAccount.create({ data: { tenantId, schoolId,
        merchantName: dto.merchantName.trim(), razorpayEnabled: dto.razorpayEnabled, razorpayKeyId: keyId,
        razorpayKeySecret: keySecret, razorpayWebhookSecret: webhookSecret, upiVpa: dto.upiVpa || null, configuredBy: userId } });
      return this.summary(account);
    });
  }

  async forInvoice(invoiceId: string) {
    const tenantId = this.tenants.requireTenantContext();
    const invoice = await this.db.invoice.findFirst({ where: { id: invoiceId, tenantId }, select: { paymentSchoolId: true } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (!invoice.paymentSchoolId) throw new BadRequestException('Your school must assign this invoice to a school before online payment');
    const account = await this.db.schoolPaymentAccount.findFirst({ where: { tenantId, schoolId: invoice.paymentSchoolId, isCurrent: true,
      school: { tenantId, isActive: true } } });
    if (!account) throw new ServiceUnavailableException('Online payments are not configured for this school');
    return account;
  }

  async assignInvoice(schoolId: string, invoiceNumber: string) {
    const tenantId = this.tenants.requireTenantContext();
    return this.db.$transaction(async tx => {
      const school = await tx.school.findFirst({ where: { id: schoolId, tenantId, isActive: true }, select: { id: true } });
      if (!school) throw new NotFoundException('School not found');
      const invoice = await tx.invoice.findFirst({ where: { tenantId, invoiceNumber }, select: { id: true, paymentSchoolId: true } });
      if (!invoice) throw new NotFoundException('Invoice not found');
      // updateMany is an atomic claim. An invoice with a school can never be rerouted here.
      const result = await tx.invoice.updateMany({ where: { id: invoice.id, tenantId, paymentSchoolId: null,
        paymentGatewayTransactions: { none: {} } }, data: { paymentSchoolId: schoolId } });
      if (!result.count) throw new ConflictException('Only unassigned invoices without gateway orders can be assigned');
      return { assigned: true, invoiceNumber, schoolId };
    });
  }

  async credentials(account: { razorpayKeyId: string | null; razorpayKeySecret: string | null }) {
    if (!account.razorpayKeyId || !account.razorpayKeySecret) throw new ServiceUnavailableException('School Razorpay credentials are unavailable');
    return { keyId: account.razorpayKeyId, keySecret: await this.encryption.decrypt(account.razorpayKeySecret) };
  }

  async forTransaction(transaction: { paymentAccountId?: string | null; tenantId: string }) {
    if (!transaction.paymentAccountId) {
      // Compatibility only for orders created before school-specific routing was deployed.
      const keyId = this.config.get<string>('RAZORPAY_KEY_ID') || '';
      const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET') || '';
      if (!keyId || !keySecret) throw new ServiceUnavailableException('Legacy payment credentials are unavailable');
      return { keyId, keySecret };
    }
    const account = await this.db.schoolPaymentAccount.findFirst({ where: { id: transaction.paymentAccountId, tenantId: transaction.tenantId } });
    if (!account) throw new ServiceUnavailableException('Payment account history is unavailable');
    return this.credentials(account);
  }

  async webhookSecret(orderId: string) {
    // The untrusted order ID only selects a candidate secret. No mutation or tenant switch precedes HMAC authentication.
    return this.tenants.run(async () => {
      const transaction = await this.db.paymentGatewayTransaction.findFirst({ where: { gatewayOrderId: orderId, gateway: 'RAZORPAY' },
        select: { tenantId: true, paymentAccountId: true } });
      if (!transaction) return null;
      if (!transaction.paymentAccountId) return this.config.get<string>('RAZORPAY_WEBHOOK_SECRET') || this.config.get<string>('PAYMENT_WEBHOOK_SECRET') || null;
      const account = await this.db.schoolPaymentAccount.findFirst({ where: { id: transaction.paymentAccountId, tenantId: transaction.tenantId } });
      return account?.razorpayWebhookSecret ? this.encryption.decrypt(account.razorpayWebhookSecret) : null;
    });
  }
}
