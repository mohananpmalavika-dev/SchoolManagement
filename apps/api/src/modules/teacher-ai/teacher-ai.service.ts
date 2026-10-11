import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AIRemarkResult, AIRiskReview, TeacherAIOptions, TeacherAIRoster } from '@krypton/types';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ExaminationsService } from '../examinations/examinations.service';
import { PredictiveAnalyticsService } from '../predictive-analytics/predictive-analytics.service';
import { AIProviderService } from './ai-provider.service';
import { aiList, aiText, keyedItems, objectSchema, questionPaper, stringListSchema, stringSchema } from './ai-output';
import { ClassTermDto, GenerateQuizDto, GenerateRemarksDto, RiskReviewDto, SaveRemarkDto } from './dto/teacher-ai.dto';

const leaders = ['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN'];
const teacherRoles = ['TEACHER', 'CLASS_TEACHER', 'EXAM_OFFICER'];
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

@Injectable()
export class TeacherAIService {
  constructor(private readonly prisma: PrismaService, private readonly tenants: TenantService,
    private readonly ai: AIProviderService, private readonly exams: ExaminationsService,
    private readonly analytics: PredictiveAnalyticsService) {}

  private tenant(user: CurrentUserData) {
    const id = this.tenants.requireTenantContext();
    if (user.tenantId !== id || ![...leaders, ...teacherRoles].includes(user.role)) throw new ForbiddenException('Teaching workspace access required');
    return id;
  }
  private async assignedClasses(user: CurrentUserData): Promise<string[] | null> {
    const tenantId = this.tenant(user);
    if (leaders.includes(user.role)) return null;
    const staff = await this.prisma.staff.findFirst({ where: { tenantId, userId: user.userId, status: 'ACTIVE' }, select: { id: true } });
    if (!staff) return [];
    const entries = await this.prisma.timetableEntry.findMany({ where: { tenantId, teacherId: staff.id }, select: { classId: true } });
    return [...new Set(entries.map(e => e.classId))];
  }
  private async authorizeClass(user: CurrentUserData, id: string) {
    const allowed = await this.assignedClasses(user);
    if (allowed && !allowed.includes(id)) throw new ForbiddenException('This class is not assigned to you');
    const cls = await this.prisma.class.findFirst({ where: { id, tenantId: this.tenant(user) }, select: { id: true, name: true, level: true } });
    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  async options(user: CurrentUserData): Promise<TeacherAIOptions> {
    const tenantId = this.tenant(user), assigned = await this.assignedClasses(user);
    const [classes, terms] = await Promise.all([
      this.prisma.class.findMany({ where: { tenantId, ...(assigned ? { id: { in: assigned } } : {}) }, select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.term.findMany({ where: { tenantId }, select: { id: true, name: true, isCurrent: true }, orderBy: { startDate: 'desc' }, take: 20 }),
    ]);
    return { classes, terms, status: this.ai.status() };
  }

  private async context(user: CurrentUserData, dto: ClassTermDto, selected?: string[]) {
    const cls = await this.authorizeClass(user, dto.classId), tenantId = this.tenant(user);
    const term = await this.prisma.term.findFirst({ where: { tenantId, id: dto.termId }, select: { id: true, name: true, startDate: true, endDate: true } });
    if (!term) throw new NotFoundException('Term not found');
    const now = new Date(), end = term.endDate < now ? term.endDate : now;
    const students = await this.prisma.student.findMany({
      where: { tenantId, currentClassId: dto.classId, deletedAt: null, status: 'ACTIVE', ...(selected ? { id: { in: selected } } : {}) },
      select: {
        id: true, firstName: true, lastName: true, admissionNumber: true,
        grades: { where: { tenantId, createdAt: { lte: now }, examination: { tenantId, termId: dto.termId } },
          select: { score: true, marks: true, totalMarks: true, subject: { select: { name: true } }, examination: { select: { name: true, startDate: true, endDate: true, createdAt: true } } } },
        attendanceRecords: { where: { tenantId, date: { gte: term.startDate, lte: end } }, select: { date: true, status: true } },
        reportCards: { where: { tenantId, termId: dto.termId, OR: [{ classId: dto.classId }, { classId: null }] },
          select: { id: true, status: true, updatedAt: true, classTeacherComments: true, teacherComment: true } },
      }, orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }], take: 501,
    });
    if (students.length > 500) throw new BadRequestException('This class is too large for the teaching studio. Split it into smaller classes.');
    if (selected && students.length !== selected.length) throw new NotFoundException('One or more selected students are unavailable in this class');
    return { cls, term, students: students.map(student => {
      const valid = student.grades.filter(g => g.totalMarks > 0 && (g.marks ?? g.score) >= 0 && (g.marks ?? g.score) <= g.totalMarks &&
        (g.examination.endDate ?? g.examination.startDate ?? g.examination.createdAt) <= now);
      const subjectResults = new Map<string, number[]>(), examResults = new Map<string, { date: Date; percentages: number[] }>();
      valid.forEach(g => {
        const percent = (g.marks ?? g.score) / g.totalMarks * 100;
        const subject = subjectResults.get(g.subject.name) ?? []; subject.push(percent); subjectResults.set(g.subject.name, subject);
        const date = g.examination.endDate ?? g.examination.startDate ?? g.examination.createdAt;
        const examKey = `${g.examination.name}:${date.toISOString()}`;
        const exam = examResults.get(examKey) ?? { date, percentages: [] }; exam.percentages.push(percent); examResults.set(examKey, exam);
      });
      const days = new Map<string, number[]>();
      student.attendanceRecords.forEach(record => {
        if (!['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY'].includes(record.status)) return;
        const key = record.date.toISOString().slice(0, 10), values = days.get(key) ?? [];
        values.push(record.status === 'ABSENT' ? 0 : record.status === 'HALF_DAY' ? 0.5 : 1); days.set(key, values);
      });
      const report = student.reportCards[0];
      const average = valid.length ? Math.round(mean(valid.map(g => (g.marks ?? g.score) / g.totalMarks * 100)) * 10) / 10 : null;
      const attendanceRate = days.size ? Math.round(mean([...days.values()].map(mean)) * 1000) / 10 : null;
      return { id: student.id, name: `${student.firstName} ${student.lastName}`, admissionNumber: student.admissionNumber, average, attendanceRate, attendanceDays: days.size,
        reportCard: report ? { id: report.id, status: report.status, updatedAt: report.updatedAt.toISOString(), comment: report.classTeacherComments ?? report.teacherComment } : null,
        source: { average, subjectPerformance: [...subjectResults].map(([subject, values]) => ({ subject, percentage: Math.round(mean(values) * 10) / 10, assessments: values.length })),
          examTrend: [...examResults.values()].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(-3).map(exam => ({ date: exam.date.toISOString().slice(0, 10), average: Math.round(mean(exam.percentages) * 10) / 10 })),
          attendanceRate, recordedAttendanceDays: days.size, attendanceNote: 'Rates use distinct recorded days; missing days are unknown. Approved leave and sickness are excluded.' } };
    }) };
  }

  async roster(user: CurrentUserData, dto: ClassTermDto): Promise<TeacherAIRoster> {
    const data = await this.context(user, dto);
    return { classId: dto.classId, termId: dto.termId, students: data.students.map(({ source, ...student }) => student) };
  }

  async remarks(user: CurrentUserData, dto: GenerateRemarksDto): Promise<AIRemarkResult> {
    const data = await this.context(user, dto, dto.students.map(s => s.studentId));
    const keys = data.students.map((_, i) => `S${i + 1}`);
    const response = await this.ai.generate('student_remarks',
      'You are a professional class teacher. Write a distinct, positive, balanced 45–75 word report-card remark for EVERY supplied student, in the requested language. ' +
      'Describe evidenced strengths, one constructive area to improve, and a practical next step. Use neutral student references, not names or IDs. Do not invent grades, attendance, personality or behaviour. ' +
      'Behaviour can only come from the teacher-provided classroom observation. If data is missing, say what needs further observation without labelling the learner. ' +
      'Attendance with fewer than 10 recorded days is limited evidence. Never imply disability, diagnose, shame, or predict guaranteed failure. Evidence should be short factual source references.',
      { language: dto.language, classLevel: data.cls.level, term: data.term.name,
        students: data.students.map((s, i) => ({ key: keys[i], ...s.source, behaviourObservation: dto.students.find(o => o.studentId === s.id)?.behaviourObservation?.trim() || null })) },
      objectSchema({ remarks: { type: 'array', items: objectSchema({ key: stringSchema, text: stringSchema, evidence: stringListSchema }) } }));
    const remarks = keyedItems(response, 'remarks', keys).map(item => ({ studentId: data.students[keys.indexOf(String(item.key))].id,
      text: aiText(item.text), evidence: aiList(item.evidence) }));
    return { remarks, model: this.ai.status().model, generatedAt: new Date().toISOString() };
  }

  async prepareReports(user: CurrentUserData, dto: ClassTermDto) {
    await this.context(user, dto);
    return this.exams.bulkGenerateReportCards(dto, user.userId);
  }

  async saveRemark(user: CurrentUserData, dto: SaveRemarkDto) {
    await this.context(user, dto, [dto.studentId]);
    const tenantId = this.tenant(user), updatedAt = new Date(), remark = dto.remark.trim();
    if (remark.length < 10) throw new BadRequestException('Please review and enter a complete remark');
    return this.prisma.$transaction(async tx => {
      const updated = await tx.reportCard.updateMany({ where: { id: dto.reportCardId, tenantId, studentId: dto.studentId, termId: dto.termId,
        OR: [{ classId: dto.classId }, { classId: null }], student: { tenantId, currentClassId: dto.classId, status: 'ACTIVE', deletedAt: null },
        status: 'DRAFT', updatedAt: new Date(dto.expectedUpdatedAt) },
        data: { classTeacherComments: remark, teacherComment: remark, updatedAt } });
      if (updated.count !== 1) throw new ConflictException('The report card changed or is no longer a draft. Reload the roster before saving.');
      await tx.auditLog.create({ data: { tenantId, userId: user.userId, action: 'AI_ASSISTED_REMARK_REVIEWED', entityType: 'ReportCard', entityId: dto.reportCardId,
        changes: { fields: ['classTeacherComments', 'teacherComment'], reviewedByTeacher: true } } });
      return { reportCardId: dto.reportCardId, updatedAt: updatedAt.toISOString(), comment: remark };
    });
  }

  async quiz(user: CurrentUserData, dto: GenerateQuizDto) {
    const cls = await this.authorizeClass(user, dto.classId);
    if (dto.sourceText.trim().length < 80) throw new BadRequestException('Provide at least 80 characters of chapter or syllabus content');
    const response = await this.ai.generate('question_paper',
      'You are an expert teacher. Create exactly 10 distinct, age-appropriate questions based ONLY on the supplied chapter/syllabus source. ' +
      'Follow the requested format, difficulty, question type and language. Include clear student instructions and a separate answer and explanation for each question. ' +
      'MCQ questions must have four distinct options and the answer must exactly match one option. SHORT_ANSWER questions have no options. MIXED must include both types. ' +
      'Assign 1–10 marks per question. Do not use outside facts. If the source cannot support ten meaningful questions, return an empty questions array and a warning instead of fabricating content.',
      { ...dto, classId: undefined, classLevel: cls.level },
      objectSchema({ title: stringSchema, instructions: stringSchema, warnings: stringListSchema,
        questions: { type: 'array', items: objectSchema({ type: { type: 'string', enum: ['MCQ', 'SHORT_ANSWER'] }, question: stringSchema,
          options: stringListSchema, answer: stringSchema, explanation: stringSchema, marks: { type: 'integer' } }) } }));
    if (response && typeof response === 'object' && 'questions' in response && Array.isArray(response.questions) && response.questions.length === 0) {
      throw new BadRequestException('The supplied content cannot support ten meaningful questions. Add more chapter or syllabus content and try again.');
    }
    return { ...questionPaper(response, dto.questionType), model: this.ai.status().model, generatedAt: new Date().toISOString() };
  }

  async riskReview(user: CurrentUserData, dto: RiskReviewDto): Promise<AIRiskReview> {
    this.tenant(user);
    if (!leaders.includes(user.role)) throw new ForbiddenException('School leadership access required');
    const report = await this.analytics.report();
    const students = dto.studentIds.map(id => report.students.find(s => s.studentId === id));
    if (students.some(s => !s)) throw new NotFoundException('One or more students are unavailable');
    const selected = students.filter((s): s is NonNullable<typeof s> => !!s), keys = selected.map((_, i) => `S${i + 1}`);
    const response = await this.ai.generate('early_warning_review',
      'You are a principal preparing an early student-support review. Use ONLY academic and attendance evidence to assess the support priority of every supplied student. ' +
      'Detect falling examination trends and attendance disengagement. Give 1–3 factual reasons and 2–3 positive, concrete actions for staff. ' +
      'HIGH means prompt human review; MODERATE means monitor/support; LOW means evidence is currently reassuring; INSUFFICIENT_DATA means the data cannot support a conclusion. ' +
      'No guaranteed predictions, diagnoses, character judgements, financial assumptions or punitive recommendations. Risk indices are not probabilities. Do not treat missing observations as failure or absence.',
      { language: dto.language, students: selected.map((s, i) => ({ key: keys[i], academic: s.academic, attendance: s.dropout,
        latestAverage: s.metrics.latestAverage, trendProjection: s.metrics.projectedAverage, attendanceRate: s.metrics.attendanceRate, attendanceDays: s.metrics.attendanceDays })) },
      objectSchema({ students: { type: 'array', items: objectSchema({ key: stringSchema,
        priority: { type: 'string', enum: ['HIGH', 'MODERATE', 'LOW', 'INSUFFICIENT_DATA'] }, reasons: stringListSchema, supportPlan: stringListSchema }) } }));
    const reviews = keyedItems(response, 'students', keys).map(item => {
      const student = selected[keys.indexOf(String(item.key))], priority = aiText(item.priority, 30);
      if (!['HIGH', 'MODERATE', 'LOW', 'INSUFFICIENT_DATA'].includes(priority)) throw new BadRequestException('AI returned an invalid priority');
      const reasons = aiList(item.reasons, 3), supportPlan = aiList(item.supportPlan, 3);
      if (!reasons.length || !supportPlan.length) throw new BadRequestException('AI returned an incomplete support review');
      return { studentId: student.studentId, priority: (student.academic.score === null && student.dropout.score === null ? 'INSUFFICIENT_DATA' : priority) as AIRiskReview['students'][number]['priority'], reasons, supportPlan };
    });
    return { students: reviews, model: this.ai.status().model, generatedAt: new Date().toISOString() };
  }
}
