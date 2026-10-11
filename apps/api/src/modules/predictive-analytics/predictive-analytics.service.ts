import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { AnalyticsStudent, buildAnalytics } from './risk-engine';

@Injectable()
export class PredictiveAnalyticsService {
  constructor(private readonly prisma: PrismaService, private readonly tenants: TenantService) {}

  async report() {
    const tenantId = this.tenants.requireTenantContext();
    const now = new Date();
    const historyStart = new Date(now.getTime() - 730 * 86_400_000);
    const attendanceStart = new Date(now.getTime() - 90 * 86_400_000);
    const tenant = await this.prisma.tenant.findFirst({ where: { id: tenantId }, select: { currency: true } });
    const students: AnalyticsStudent[] = [];
    let cursor: string | undefined;
    // Fetch in batches; use explicit tenant predicates even on nested relations.
    while (true) {
      const batch = await this.prisma.student.findMany({
        where: { tenantId, deletedAt: null }, orderBy: { id: 'asc' }, take: 250,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true, firstName: true, lastName: true, admissionNumber: true, status: true,
          currentClassId: true, currentClass: { select: { name: true } },
          attendanceRecords: { where: { tenantId, date: { gte: attendanceStart, lte: now } }, select: { date: true, status: true } },
          grades: { where: { tenantId, createdAt: { gte: historyStart, lte: now }, examination: { tenantId } },
            select: { subjectId: true, score: true, marks: true, totalMarks: true,
              examination: { select: { id: true, startDate: true, endDate: true, createdAt: true,
                subjects: { select: { subjectId: true, passMark: true, totalMarks: true, weight: true } } } } } },
          invoices: { where: { tenantId, createdAt: { lte: now }, status: { notIn: ['CANCELLED', 'DRAFT'] },
            OR: [{ createdAt: { gte: historyStart } }, { balanceAmount: { gt: 0 } }] },
            select: { totalAmount: true, paidAmount: true, balanceAmount: true, status: true, dueDate: true, createdAt: true,
              payments: { where: { tenantId, paymentDate: { lte: now } }, select: { amount: true, paymentDate: true, status: true } } } },
        },
      });
      students.push(...batch);
      if (batch.length < 250) break;
      cursor = batch[batch.length - 1].id;
    }
    return buildAnalytics(students, now, tenant?.currency ?? 'KES');
  }
}
