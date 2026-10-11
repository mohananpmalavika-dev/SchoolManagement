import { randomUUID } from 'node:crypto';
import { FeeCategory } from '@krypton/types';
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { GenerateInvoicesDto } from './dto/generate-invoices.dto';
import { formatCurrency } from '@krypton/utils';

@Injectable()
export class FeesService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {}

  // ==================== FEE STRUCTURES ====================

  async createFeeStructure(dto: CreateFeeStructureDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Validate term exists
    const term = await this.prisma.term.findFirst({
      where: { id: dto.termId, tenantId },
    });

    if (!term) {
      throw new NotFoundException('Term not found');
    }

    // Validate class if provided
    if (dto.classId) {
      const classExists = await this.prisma.class.findFirst({
        where: { id: dto.classId, tenantId },
      });

      if (!classExists) {
        throw new NotFoundException('Class not found');
      }
    }

    // Create fee structure with items
    const feeStructure = await this.prisma.feeStructure.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        termId: dto.termId,
        classId: dto.classId,
        isActive: true,
        feeItems: {
          create: dto.feeItems.map((item) => ({
            name: item.name,
            description: item.description,
            amount: item.amount,
            feeCategory: item.feeCategory as FeeCategory,
            isOptional: item.isOptional || false,
            sortOrder: item.sortOrder || 0,
          })),
        },
      },
      include: {
        feeItems: {
          orderBy: { sortOrder: 'asc' },
        },
        term: {
          select: { name: true, termNumber: true },
        },
        class: {
          select: { name: true, level: true },
        },
      },
    });

    return feeStructure;
  }

  async findAllFeeStructures(termId?: string, classId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId };

    if (termId) {
      where.termId = termId;
    }

    if (classId) {
      where.classId = classId;
    }

    const feeStructures = await this.prisma.feeStructure.findMany({
      where,
      include: {
        feeItems: {
          orderBy: { sortOrder: 'asc' },
        },
        term: {
          select: { name: true, termNumber: true },
        },
        class: {
          select: { name: true, level: true },
        },
        _count: {
          select: { invoices: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return feeStructures;
  }

  async findOneFeeStructure(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id, tenantId },
      include: {
        feeItems: {
          orderBy: { sortOrder: 'asc' },
        },
        term: true,
        class: true,
      },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return feeStructure;
  }

  async deactivateFeeStructure(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    await this.findOneFeeStructure(id);

    const updated = await this.prisma.feeStructure.update({
      where: { id },
      data: { isActive: false },
    });

    return updated;
  }

  // ==================== INVOICES ====================

  async createInvoice(dto: CreateInvoiceDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Validate student exists
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Validate term exists
    const term = await this.prisma.term.findFirst({
      where: { id: dto.termId, tenantId },
    });

    if (!term) {
      throw new NotFoundException('Term not found');
    }

    // Check if invoice already exists for this student and term
    const existing = await this.prisma.invoice.findFirst({
      where: {
        tenantId,
        studentId: dto.studentId,
        termId: dto.termId,
        status: { not: 'CANCELLED' },
      },
    });

    if (existing) {
      throw new ConflictException('Invoice already exists for this student and term');
    }

    // Calculate total amount
    const totalAmount = dto.items.reduce((sum, item) => sum + item.amount, 0);

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Create invoice with items
    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        studentId: dto.studentId,
        termId: dto.termId,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        status: 'PENDING',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        invoiceItems: {
          create: dto.items.map((item) => ({
            description: item.description,
            amount: item.amount,
            feeCategory: item.feeCategory as FeeCategory,
          })),
        },
      },
      include: {
        invoiceItems: true,
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        term: {
          select: { name: true, termNumber: true },
        },
      },
    });

    return invoice;
  }

  async generateInvoices(dto: GenerateInvoicesDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Get fee structure
    const feeStructure = await this.findOneFeeStructure(dto.feeStructureId);

    if (!feeStructure.isActive) {
      throw new BadRequestException('Fee structure is not active');
    }

    // Get students to generate invoices for
    const where: any = {
      tenantId,
      status: 'ACTIVE',
      deletedAt: null,
    };

    if (dto.classId) {
      where.currentClassId = dto.classId;
    } else if (feeStructure.classId) {
      where.currentClassId = feeStructure.classId;
    }

    if (dto.streamId) {
      where.currentStreamId = dto.streamId;
    }

    const students = await this.prisma.student.findMany({
      where,
      select: { id: true, admissionNumber: true, firstName: true, lastName: true },
    });

    if (students.length === 0) {
      throw new BadRequestException('No students found matching criteria');
    }

    // Generate invoices
    const results = {
      total: students.length,
      created: 0,
      skipped: 0,
      errors: [] as any[],
    };

    for (const student of students) {
      try {
        // Check if invoice already exists
        const existing = await this.prisma.invoice.findFirst({
          where: {
            tenantId,
            studentId: student.id,
            termId: feeStructure.termId,
            status: { not: 'CANCELLED' },
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Create invoice
        const items = feeStructure.feeItems.map((item) => ({
          description: item.description || item.name,
          amount: item.amount,
          feeCategory: item.feeCategory as FeeCategory,
        }));

        await this.createInvoice({
          studentId: student.id,
          termId: feeStructure.termId,
          items,
          dueDate: dto.dueDate,
        });

        results.created++;
      } catch (error: any) {
        results.errors.push({
          student: `${student.firstName} ${student.lastName} (${student.admissionNumber})`,
          error: error.message,
        });
      }
    }

    return results;
  }

  async findAllInvoices(query: QueryInvoicesDto) {
    const tenantId = this.tenantService.requireTenantContext();
    const { page = 1, pageSize = 20, ...filters } = query;

    const skip = (page - 1) * pageSize;

    const where: any = { tenantId };

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.termId) {
      where.termId = filters.termId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          student: {
            select: {
              id: true,
              admissionNumber: true,
              firstName: true,
              lastName: true,
              currentClass: {
                select: { name: true },
              },
            },
          },
          term: {
            select: { name: true, termNumber: true },
          },
          _count: {
            select: { payments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: invoices,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOneInvoice(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        invoiceItems: true,
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
            middleName: true,
            currentClass: {
              select: { name: true, level: true },
            },
            currentStream: {
              select: { name: true },
            },
          },
        },
        term: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async cancelInvoice(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const invoice = await this.findOneInvoice(id);

    if (invoice.paidAmount > 0) {
      throw new BadRequestException('Cannot cancel invoice with payments');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return updated;
  }

  // ==================== PAYMENTS ====================

  async recordPayment(dto: RecordPaymentDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();
    if (!Number.isSafeInteger(dto.amount) || dto.amount <= 0) throw new BadRequestException('Amount must be positive minor units');
    const existing = await this.prisma.payment.findFirst({where:{tenantId,reference:dto.reference}});
    if(existing){
      if(existing.invoiceId===dto.invoiceId&&existing.amount===dto.amount&&existing.status==='COMPLETED')return existing;
      throw new ConflictException('Payment reference is already in use');
    }
    try {
      return await this.prisma.$transaction(async tx=>{
        // The conditional decrement obtains the invoice row lock and prevents concurrent overpayments.
        const changed=await tx.invoice.updateMany({where:{id:dto.invoiceId,tenantId,status:{in:['PENDING','PARTIALLY_PAID','OVERDUE']},balanceAmount:{gte:dto.amount}},data:{paidAmount:{increment:dto.amount},balanceAmount:{decrement:dto.amount}}});
        if(!changed.count)throw new BadRequestException('Invoice unavailable or payment exceeds the remaining balance');
        const invoice=await tx.invoice.findFirstOrThrow({where:{id:dto.invoiceId,tenantId}});
        await tx.invoice.update({where:{id:invoice.id,tenantId},data:{status:invoice.balanceAmount===0?'PAID':'PARTIALLY_PAID'}});
        return tx.payment.create({data:{tenantId,invoiceId:dto.invoiceId,amount:dto.amount,paymentMethod:dto.paymentMethod,reference:dto.reference,status:'COMPLETED',paymentDate:dto.paymentDate?new Date(dto.paymentDate):new Date(),receiptNumber:'RCT-'+randomUUID().slice(0,12).toUpperCase(),receiptIssued:true,receiptIssuedAt:new Date(),notes:dto.notes,processedBy:userId}});
      });
    }catch(error:any){
      if(error.code==='P2002'){
        const duplicate=await this.prisma.payment.findFirst({where:{tenantId,reference:dto.reference}});
        if(duplicate?.invoiceId===dto.invoiceId&&duplicate.amount===dto.amount&&duplicate.status==='COMPLETED')return duplicate;
        throw new ConflictException('Payment reference is already in use');
      }
      throw error;
    }
  }

  async findAllPayments(invoiceId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId };

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            student: {
              select: {
                admissionNumber: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return payments;
  }

  async findOnePayment(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const payment = await this.prisma.payment.findFirst({
      where: { id, tenantId },
      include: {
        invoice: {
          include: {
            student: {
              select: {
                admissionNumber: true,
                firstName: true,
                lastName: true,
                currentClass: {
                  select: { name: true },
                },
              },
            },
            term: {
              select: { name: true, termNumber: true },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  // ==================== FINANCIAL REPORTS ====================

  async getFinancialSummary(termId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId };

    if (termId) {
      where.termId = termId;
    }

    const [invoices, totalExpected, totalCollected, overdueInvoices] = await Promise.all([
      this.prisma.invoice.count({
        where: { ...where, status: { not: 'CANCELLED' } },
      }),
      this.prisma.invoice.aggregate({
        where: { ...where, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { ...where, status: { not: 'CANCELLED' } },
        _sum: { paidAmount: true },
      }),
      this.prisma.invoice.count({
        where: {
          ...where,
          status: 'OVERDUE',
        },
      }),
    ]);

    const expected = totalExpected._sum.totalAmount || 0;
    const collected = totalCollected._sum.paidAmount || 0;
    const outstanding = expected - collected;
    const collectionRate = expected > 0 ? (collected / expected) * 100 : 0;

    return {
      totalInvoices: invoices,
      totalExpected: expected,
      totalCollected: collected,
      outstanding,
      collectionRate: Math.round(collectionRate * 100) / 100,
      overdueInvoices,
    };
  }

  // ==================== UTILITIES ====================

  private async generateInvoiceNumber(): Promise<string> {
    const tenantId = this.tenantService.requireTenantContext();
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: { tenantId },
    });

    return 'INV-'+year+'-'+randomUUID().slice(0,8).toUpperCase();
  }

  private async generateReceiptNumber(): Promise<string> {
    const tenantId = this.tenantService.requireTenantContext();
    const year = new Date().getFullYear();
    const count = await this.prisma.payment.count({
      where: { tenantId },
    });

    return `RCT-${year}-${String(count + 1).padStart(6, '0')}`;
  }
}
