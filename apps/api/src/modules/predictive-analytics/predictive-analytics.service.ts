import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { AnalyticsStudent, buildAnalytics } from './risk-engine';
import { DispatchInterventionDto } from './dto/dispatch-intervention.dto';

@Injectable()
export class PredictiveAnalyticsService {
  constructor(private readonly prisma: PrismaService, private readonly tenants: TenantService) {}

  async report() {
    const tenantId = this.tenants.requireTenantContext();
    const now = new Date();
    const historyStart = new Date(now.getTime() - 730 * 86_400_000);
    const attendanceStart = new Date(now.getTime() - 90 * 86_400_000);
    const assignmentStart = new Date(now.getTime() - 90 * 86_400_000);

    const [tenant, allAssignments] = await Promise.all([
      this.prisma.tenant.findFirst({ where: { id: tenantId }, select: { currency: true } }),
      this.prisma.assignment
        ? this.prisma.assignment.findMany({
            where: { tenantId, dueDate: { gte: assignmentStart, lte: now } },
            select: {
              id: true,
              classId: true,
              subjectId: true,
              title: true,
              dueDate: true,
              maxMarks: true,
              subject: { select: { name: true } },
            },
          })
        : [],
    ]);

    const students: AnalyticsStudent[] = [];
    let cursor: string | undefined;

    while (true) {
      const batch = await this.prisma.student.findMany({
        where: { tenantId, deletedAt: null }, orderBy: { id: 'asc' }, take: 250,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true, firstName: true, lastName: true, admissionNumber: true, status: true,
          currentClassId: true, currentClass: { select: { name: true } },
          attendanceRecords: { where: { tenantId, date: { gte: attendanceStart, lte: now } }, select: { date: true, status: true } },
          grades: { where: { tenantId, createdAt: { gte: historyStart, lte: now }, examination: { tenantId } },
            select: { subjectId: true, score: true, marks: true, totalMarks: true, updatedAt: true,
              examination: { select: { id: true, startDate: true, endDate: true, createdAt: true,
                subjects: { select: { subjectId: true, passMark: true, totalMarks: true, weight: true } } } } } },
          invoices: { where: { tenantId, createdAt: { lte: now }, status: { notIn: ['CANCELLED', 'DRAFT'] },
            OR: [{ createdAt: { gte: historyStart } }, { balanceAmount: { gt: 0 } }] },
            select: { totalAmount: true, paidAmount: true, balanceAmount: true, status: true, dueDate: true, createdAt: true,
              payments: { where: { tenantId, paymentDate: { lte: now } }, select: { amount: true, paymentDate: true, status: true } } } },
          submissions: {
            where: { tenantId },
            select: {
              id: true,
              assignmentId: true,
              status: true,
              score: true,
              submittedAt: true,
              assignment: {
                select: {
                  id: true,
                  classId: true,
                  subjectId: true,
                  title: true,
                  dueDate: true,
                  maxMarks: true,
                  subject: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      const enhancedBatch: AnalyticsStudent[] = batch.map(s => ({
        ...s,
        classAssignments: s.currentClassId
          ? (allAssignments as any[]).filter(a => a.classId === s.currentClassId)
          : [],
      }));

      students.push(...enhancedBatch);
      if (batch.length < 250) break;
      cursor = batch[batch.length - 1].id;
    }

    return buildAnalytics(students, now, tenant?.currency ?? 'INR');
  }

  async dispatchIntervention(user: CurrentUserData, dto: DispatchInterventionDto) {
    const tenantId = this.tenants.requireTenantContext();
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        currentClass: { select: { name: true } },
        guardianLinks: {
          where: { receiveUpdates: true },
          select: {
            isPrimary: true,
            relationship: true,
            guardian: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const primaryLink = student.guardianLinks.find(g => g.isPrimary) ?? student.guardianLinks[0];
    const guardian = primaryLink?.guardian;
    const parentName = guardian ? `${guardian.firstName} ${guardian.lastName}` : 'Guardian';
    const parentPhone = guardian?.phone?.trim() ?? '';
    const studentName = `${student.firstName} ${student.lastName}`;

    const defaultMsgEn = `Dear ${parentName}, this is an early learning progress update for ${studentName} (${student.admissionNumber}). Our academic radar noticed some recent areas needing support in exam marks, attendance, or homework completion. Our class teacher would like to collaborate with you to help ${student.firstName} thrive.`;
    const defaultMsgMl = `പ്രിയ ${parentName}, ${studentName} ന്റെ (${student.admissionNumber}) പഠനനിലവാരത്തെയും ഹാജർനിലയെയും സംബന്ധിച്ചുള്ള പ്രധാന അറിയിപ്പാണിത്. പരീക്ഷാ മാർക്ക്, ഹാജർ, ഹോംവർക്ക് സബ്മിഷൻ എന്നിവയിൽ കൂടുതൽ ശ്രദ്ധ ആവശ്യമാണെന്ന് സ്കൂൾ ഏർലി വാണിംഗ് സിസ്റ്റം കണ്ടെത്തിയിട്ടുണ്ട്. കുട്ടിയുടെ പഠന പുരോഗതിക്കായി അധ്യാപകരുമായി ഉടൻ ബന്ധപ്പെടാൻ അഭ്യർത്ഥിക്കുന്നു.`;

    const isMalayalam = dto.language === 'ml';
    const finalMessage = dto.customMessage?.trim() || (isMalayalam ? defaultMsgMl : defaultMsgEn);

    let whatsappUrl = '';
    if (parentPhone) {
      const cleanPhone = parentPhone.replace(/[^0-9]/g, '');
      whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMessage)}`;
    } else {
      whatsappUrl = `https://wa.me/?text=${encodeURIComponent(finalMessage)}`;
    }

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.userId,
        action: 'AI_EARLY_WARNING_INTERVENTION_DISPATCHED',
        entityType: 'Student',
        entityId: student.id,
        changes: {
          channel: dto.channel,
          studentName,
          guardianName: parentName,
          meetingRequested: !!dto.meetingRequested,
          language: dto.language ?? 'en',
        },
      },
    });

    return {
      success: true,
      studentId: student.id,
      studentName,
      guardianName: parentName,
      guardianPhone: parentPhone || null,
      channel: dto.channel,
      message: finalMessage,
      whatsappUrl,
      meetingRequested: !!dto.meetingRequested,
      dispatchedAt: new Date().toISOString(),
    };
  }
}
