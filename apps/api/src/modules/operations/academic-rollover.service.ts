import { createHash } from 'node:crypto';

import { Prisma } from '@krypton/database';
import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';

import { CompleteRolloverDto, PromotionAction, RolloverPlanDto } from './academic-rollover.dto';
import type { Actor } from './operations.service';

const managers = ['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN'];
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

@Injectable()
export class AcademicRolloverService {
  constructor(private db: PrismaService, private tenants: TenantService) {}

  private authorize(user: Actor) {
    if (!managers.includes(user.role)) throw new ForbiddenException('School management access required');
    return this.tenants.requireTenantContext();
  }

  async options(user: Actor) {
    const tenantId = this.authorize(user);
    const [years, classes, streams, students, history] = await Promise.all([
      this.db.academicYear.findMany({ where: { tenantId }, orderBy: { startDate: 'desc' } }),
      this.db.class.findMany({ where: { tenantId }, select: { id: true, name: true, schoolId: true, sortOrder: true, school: { select: { name: true } } }, orderBy: { sortOrder: 'asc' } }),
      this.db.stream.findMany({ where: { tenantId }, select: { id: true, classId: true, name: true, capacity: true } }),
      this.db.student.findMany({ where: { tenantId, deletedAt: null, status: 'ACTIVE' },
        select: { id: true, firstName: true, lastName: true, admissionNumber: true, currentClassId: true, currentStreamId: true }, orderBy: { id: 'asc' }, take: 5001 }),
      this.db.academicYearRollover.findMany({ where: { tenantId }, orderBy: { completedAt: 'desc' }, take: 20,
        select: { id: true, sourceYearId: true, targetYearId: true, sourceYearName: true, targetYearName: true, summary: true, completedAt: true } }),
    ]);
    if (students.length > 5000) throw new BadRequestException('This workflow supports up to 5,000 active students per rollover');
    return { years, classes, streams, students, history };
  }

  private clean(plan: RolloverPlanDto) {
    if (plan.sourceYearId === plan.targetYearId) throw new BadRequestException('Choose two different academic years');
    if (!Array.isArray(plan.decisions) || !plan.decisions.length || plan.decisions.length > 5000)
      throw new BadRequestException('Review between 1 and 5,000 students');
    if (new Set(plan.decisions.map(row => row.studentId)).size !== plan.decisions.length)
      throw new BadRequestException('Each student must appear exactly once');
    return { sourceYearId: plan.sourceYearId, targetYearId: plan.targetYearId,
      decisions: plan.decisions.map(row => ({ studentId: row.studentId, action: row.action,
        classId: row.classId || null, streamId: row.streamId || null })).sort((a, b) => a.studentId.localeCompare(b.studentId)) };
  }

  private async review(tx: Prisma.TransactionClient, tenantId: string, plan: ReturnType<AcademicRolloverService['clean']>) {
    const [years, students, classes, streams, enrollments, terms] = await Promise.all([
      tx.academicYear.findMany({ where: { tenantId }, orderBy: { id: 'asc' } }),
      tx.student.findMany({ where: { tenantId, deletedAt: null, status: 'ACTIVE' }, orderBy: { id: 'asc' }, take: 5001,
        select: { id: true, firstName: true, lastName: true, admissionNumber: true, currentClassId: true, currentStreamId: true, updatedAt: true, admissionDate: true } }),
      tx.class.findMany({ where: { tenantId }, orderBy: { id: 'asc' } }),
      tx.stream.findMany({ where: { tenantId }, orderBy: { id: 'asc' } }),
      tx.enrollment.findMany({ where: { tenantId, academicYearId: { in: [plan.sourceYearId, plan.targetYearId] } }, orderBy: { id: 'asc' } }),
      tx.term.findMany({ where: { tenantId }, orderBy: { id: 'asc' } }),
    ]);
    const source = years.find(year => year.id === plan.sourceYearId), target = years.find(year => year.id === plan.targetYearId);
    if (!source || !target) throw new BadRequestException('Choose academic years in your school');
    if (!source.isCurrent || years.filter(year => year.isCurrent).length !== 1 || target.isCurrent)
      throw new ConflictException('The source must be the only current academic year');
    if (source.startDate >= source.endDate || target.startDate >= target.endDate || target.startDate <= source.endDate)
      throw new BadRequestException('The target year must start after the source year ends');
    const selectedIds = new Set(plan.decisions.map(row => row.studentId));
    if (students.length > 5000 || students.length !== plan.decisions.length || students.some(student => !selectedIds.has(student.id)))
      throw new ConflictException('Include every active student across all campuses exactly once. Refresh the roster and review again');
    const targetEnrollments = enrollments.filter(entry => entry.academicYearId === target.id);
    if (targetEnrollments.length) throw new ConflictException('The target year already has enrollments. Reconcile them before rollover');
    const byStudent = new Map(students.map(student => [student.id, student]));
    const byClass = new Map(classes.map(cls => [cls.id, cls]));
    const byStream = new Map(streams.map(stream => [stream.id, stream]));
    const streamCounts = new Map<string, number>();
    const summary = { total: students.length, promoted: 0, retained: 0, graduated: 0 };
    const rows = plan.decisions.map(decision => {
      const student = byStudent.get(decision.studentId)!;
      const sourceClass = student.currentClassId ? byClass.get(student.currentClassId) : undefined;
      if (!sourceClass) throw new BadRequestException(`Assign a current class to ${student.admissionNumber} before rollover`);
      if (student.currentStreamId && byStream.get(student.currentStreamId)?.classId !== sourceClass.id)
        throw new BadRequestException(`Correct the current class/stream for ${student.admissionNumber} before rollover`);
      if (student.admissionDate > source.endDate) throw new ConflictException(`${student.admissionNumber} was admitted after the source year. Review the selected year`);
      if (!Object.values(PromotionAction).includes(decision.action)) throw new BadRequestException('Choose promote, retain or graduate for every student');
      const destination = decision.classId ? byClass.get(decision.classId) : undefined;
      const stream = decision.streamId ? byStream.get(decision.streamId) : undefined;
      if (decision.action === PromotionAction.GRADUATE) {
        if (decision.classId || decision.streamId) throw new BadRequestException('Graduating students cannot have a target class or stream');
        summary.graduated++;
      } else {
        if (!destination || destination.schoolId !== sourceClass.schoolId) throw new BadRequestException('Choose a target class in the same campus as the student');
        if (decision.action === PromotionAction.RETAIN && destination.id !== sourceClass.id)
          throw new BadRequestException('Retained students must stay in their current class');
        if (decision.action === PromotionAction.PROMOTE && destination.id === sourceClass.id)
          throw new BadRequestException('Choose a different class for promotion, or mark the student retained');
        if (decision.streamId && (!stream || stream.classId !== destination.id || stream.schoolId !== destination.schoolId))
          throw new BadRequestException('Choose a stream belonging to the target class');
        if (stream) streamCounts.set(stream.id, (streamCounts.get(stream.id) || 0) + 1);
        if (decision.action === PromotionAction.PROMOTE) summary.promoted++; else summary.retained++;
      }
      return { ...decision, name: `${student.firstName} ${student.lastName}`, admissionNumber: student.admissionNumber,
        sourceClassId: sourceClass.id, sourceClassName: sourceClass.name, sourceStreamId: student.currentStreamId,
        targetClassName: destination?.name || null, targetStreamName: stream?.name || null };
    });
    for (const [streamId, count] of streamCounts) if (count > byStream.get(streamId)!.capacity)
      throw new ConflictException(`Target stream ${byStream.get(streamId)!.name} exceeds its capacity`);
    // Bind approval to the complete saved roster and academic setup. A class edit,
    // new admission, enrollment, capacity change or current-year switch invalidates it.
    const previewToken = hash({ plan, years, students, classes, streams, enrollments, terms });
    return { source, target, students, enrollments, rows, summary, previewToken };
  }

  async preview(user: Actor, input: RolloverPlanDto) {
    const tenantId = this.authorize(user), plan = this.clean(input);
    const review = await this.db.$transaction(tx => this.review(tx, tenantId, plan), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 30000 });
    return { sourceYear: review.source, targetYear: review.target, rows: review.rows, summary: review.summary, previewToken: review.previewToken };
  }

  async complete(user: Actor, input: CompleteRolloverDto) {
    const tenantId = this.authorize(user), plan = this.clean(input), requestHash = hash(plan);
    try {
      return await this.db.$transaction(async tx => {
        // Current-year toggles and other rollover requests use the same tenant lock.
        await tx.tenant.update({ where: { id: tenantId }, data: { updatedAt: new Date() } });
        const previous = await tx.academicYearRollover.findFirst({ where: { tenantId, sourceYearId: plan.sourceYearId } });
        if (previous) {
          if (previous.requestHash === requestHash && previous.previewToken === input.previewToken)
            return { id: previous.id, summary: previous.summary, alreadyCompleted: true };
          throw new ConflictException('This academic year has already been rolled over');
        }
        if (await tx.academicYearRollover.findFirst({ where: { tenantId, targetYearId: plan.targetYearId } }))
          throw new ConflictException('The target year has already received a rollover');
        const review = await this.review(tx, tenantId, plan);
        if (review.previewToken !== input.previewToken) throw new ConflictException('The roster or academic setup changed after preview. Review a fresh preview before completing');
        const sourceHistory = new Set(review.enrollments.filter(row => row.academicYearId === plan.sourceYearId)
          .map(row => `${row.studentId}:${row.classId}:${row.streamId || ''}`));
        const allocations: Prisma.EnrollmentCreateManyInput[] = [];
        for (const student of review.students) {
          if (!sourceHistory.has(`${student.id}:${student.currentClassId}:${student.currentStreamId || ''}`)) allocations.push({
            tenantId, studentId: student.id, classId: student.currentClassId!, streamId: student.currentStreamId,
            academicYearId: review.source.id, enrollmentDate: new Date(Math.max(review.source.startDate.getTime(), student.admissionDate.getTime())),
          });
        }
        const groups = new Map<string, { ids: string[]; action: PromotionAction; classId: string | null; streamId: string | null }>();
        for (const row of plan.decisions) {
          const key = `${row.action}:${row.classId}:${row.streamId}`;
          if (!groups.has(key)) groups.set(key, { ids: [], action: row.action, classId: row.classId, streamId: row.streamId });
          groups.get(key)!.ids.push(row.studentId);
          if (row.action !== PromotionAction.GRADUATE) allocations.push({ tenantId, studentId: row.studentId,
            classId: row.classId!, streamId: row.streamId, academicYearId: review.target.id, enrollmentDate: review.target.startDate });
        }
        if (allocations.length) await tx.enrollment.createMany({ data: allocations });
        for (const group of groups.values()) {
          const graduating = group.action === PromotionAction.GRADUATE;
          const changed = await tx.student.updateMany({ where: { tenantId, id: { in: group.ids }, status: 'ACTIVE', deletedAt: null }, data: {
            currentClassId: group.classId, currentStreamId: group.streamId,
            status: graduating ? 'GRADUATED' : 'ACTIVE', graduationDate: graduating ? review.source.endDate : null,
          } });
          if (changed.count !== group.ids.length) throw new ConflictException('The roster changed during rollover. Refresh and review again');
        }
        await tx.academicYear.updateMany({ where: { tenantId }, data: { isCurrent: false } });
        await tx.academicYear.update({ where: { id: review.target.id, tenantId }, data: { isCurrent: true } });
        // Term selection belongs to the new year; never leave a previous-year term current.
        await tx.term.updateMany({ where: { tenantId, isCurrent: true }, data: { isCurrent: false } });
        const saved = await tx.academicYearRollover.create({ data: {
          tenantId, sourceYearId: review.source.id, targetYearId: review.target.id,
          sourceYearName: review.source.name, targetYearName: review.target.name,
          requestHash, previewToken: input.previewToken, decisions: review.rows, summary: review.summary, completedBy: user.userId,
        } });
        await tx.auditLog.create({ data: { tenantId, userId: user.userId, action: 'ACADEMIC_YEAR_ROLLOVER',
          entityType: 'academicYearRollover', entityId: saved.id, changes: { sourceYearId: review.source.id, targetYearId: review.target.id, ...review.summary } } });
        return { id: saved.id, summary: review.summary, alreadyCompleted: false };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60000 });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2034') throw new ConflictException('Another school update overlapped this rollover. Refresh and review again');
      throw error;
    }
  }
}
