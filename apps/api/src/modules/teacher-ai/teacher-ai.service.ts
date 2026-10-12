import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AIRemarkResult, AIRiskReview, CBCSchemeOfWorkResponse, ERPCopilotFilterBadge, ERPCopilotQueryResponse, ERPCopilotStudentMatch, LessonPlanResponse, ShareLessonToChatResponse, TeacherAIOptions, TeacherAIRoster } from '@krypton/types';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { ExaminationsService } from '../examinations/examinations.service';
import { PredictiveAnalyticsService } from '../predictive-analytics/predictive-analytics.service';
import { AIProviderService } from './ai-provider.service';
import { aiList, aiText, keyedItems, objectSchema, questionPaper, stringListSchema, stringSchema } from './ai-output';
import { ClassTermDto, CopilotQueryDto, GenerateLessonPlanDto, GenerateQuizDto, GenerateRemarksDto, GenerateSchemeOfWorkDto, RiskReviewDto, SaveRemarkDto, ShareLessonToChatDto } from './dto/teacher-ai.dto';

const leaders = ['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN', 'SUPER_ADMIN'];
const teacherRoles = ['TEACHER', 'CLASS_TEACHER', 'EXAM_OFFICER'];
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

@Injectable()
export class TeacherAIService {
  constructor(private readonly prisma: PrismaService, private readonly tenants: TenantService,
    private readonly ai: AIProviderService, private readonly exams: ExaminationsService,
    private readonly analytics: PredictiveAnalyticsService) {}

  private tenant(user: CurrentUserData) {
    let id: string;
    try {
      id = this.tenants.requireTenantContext();
    } catch {
      id = user.tenantId;
      if (id && typeof this.tenants.setTenantId === 'function') {
        this.tenants.setTenantId(id);
      }
    }
    if (user.role !== 'SUPER_ADMIN' && user.tenantId !== id) throw new ForbiddenException('Teaching workspace access required');
    if (![...leaders, ...teacherRoles].includes(user.role)) throw new ForbiddenException('Teaching workspace access required');
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

  async lessonPlan(user: CurrentUserData, dto: GenerateLessonPlanDto): Promise<LessonPlanResponse> {
    const cls = await this.authorizeClass(user, dto.classId);
    const response = await this.ai.generate('lesson_plan',
      'You are a master curriculum planner. Create a thorough 5E lesson plan for this class and topic aligned with CBC / KICD standards.',
      { ...dto, classLevel: cls.level },
      objectSchema({
        title: stringSchema, gradeLevel: stringSchema, subject: stringSchema, topic: stringSchema,
        strand: stringSchema, subStrand: stringSchema,
        durationMinutes: { type: 'integer' }, curriculum: stringSchema,
        learningObjectives: stringListSchema, coreCompetencies: stringListSchema,
        values: stringListSchema, pcis: stringListSchema,
        keyInquiryQuestions: stringListSchema, materials: stringListSchema,
        steps: { type: 'array', items: objectSchema({ phase: stringSchema, title: stringSchema, durationMinutes: { type: 'integer' }, teacherActivity: stringSchema, studentActivity: stringSchema, resourcesNeeded: stringListSchema }) },
        differentiatedInstruction: objectSchema({ supportForStruggling: stringListSchema, extensionForAdvanced: stringListSchema }),
        assessmentRubrics: { type: 'array', items: objectSchema({ criterion: stringSchema, levels: { type: 'array', items: objectSchema({ level: stringSchema, descriptor: stringSchema, scoreRange: stringSchema }) } }) },
        homeworkAssignment: stringSchema,
        reflectionPrompt: stringSchema,
      }));
    return { ...(response as any), model: this.ai.status().model, generatedAt: new Date().toISOString() };
  }

  async schemeOfWork(user: CurrentUserData, dto: GenerateSchemeOfWorkDto): Promise<CBCSchemeOfWorkResponse> {
    const cls = await this.authorizeClass(user, dto.classId);
    const response = await this.ai.generate('scheme_of_work',
      'You are a master Kenyan CBC / KICD curriculum developer. Generate a comprehensive, professional termly Scheme of Work matrix.',
      { ...dto, classLevel: cls.level },
      objectSchema({
        title: stringSchema, gradeLevel: stringSchema, subject: stringSchema, strand: stringSchema,
        term: stringSchema, academicYear: stringSchema, curriculum: stringSchema,
        generalOutcomes: stringListSchema, coreCompetencies: stringListSchema,
        values: stringListSchema, pcis: stringListSchema,
        weeks: {
          type: 'array',
          items: objectSchema({
            week: { type: 'integer' },
            lessonNumber: { type: 'integer' },
            strand: stringSchema,
            subStrand: stringSchema,
            specificLearningOutcomes: stringListSchema,
            keyInquiryQuestions: stringListSchema,
            learningExperiences: stringListSchema,
            learningResources: stringListSchema,
            assessmentMethods: stringListSchema,
            reflection: stringSchema,
          }),
        },
        assessmentRubrics: {
          type: 'array',
          items: objectSchema({
            criterion: stringSchema,
            levels: {
              type: 'array',
              items: objectSchema({
                level: stringSchema,
                descriptor: stringSchema,
                scoreRange: stringSchema,
              }),
            },
          }),
        },
      }));
    return { ...(response as any), model: this.ai.status().model, generatedAt: new Date().toISOString() };
  }

  async shareToChat(user: CurrentUserData, dto: ShareLessonToChatDto): Promise<ShareLessonToChatResponse> {
    const tenantId = this.tenant(user);
    const cls = await this.authorizeClass(user, dto.classId);

    // Look for existing class channel
    let channel = dto.channelId ? await this.prisma.chatChannel.findFirst({
      where: { id: dto.channelId, tenantId, isArchived: false },
    }) : null;

    if (!channel) {
      channel = await this.prisma.chatChannel.findFirst({
        where: { tenantId, classId: dto.classId, isArchived: false },
      });
    }

    if (!channel) {
      channel = await this.prisma.chatChannel.findFirst({
        where: { tenantId, name: { contains: cls.name }, isArchived: false },
      });
    }

    if (!channel) {
      channel = await this.prisma.chatChannel.create({
        data: {
          tenantId,
          name: `📚 ${cls.name} Class Channel`,
          description: `Interactive learning, curriculum updates and class inquiries for ${cls.name}`,
          type: 'CLASS',
          classId: dto.classId,
          createdById: user.userId,
        },
      });

      await this.prisma.chatChannelMember.create({
        data: {
          channelId: channel.id,
          userId: user.userId,
          role: 'ADMIN',
        },
      });
    }

    const createdMessage = await this.prisma.chatMessage.create({
      data: {
        channelId: channel.id,
        senderId: user.userId,
        content: dto.content.trim(),
        attachments: [
          {
            name: `${dto.title}.pdf`,
            type: dto.type || 'LESSON_PLAN',
            title: dto.title,
            classId: dto.classId,
            className: cls.name,
            sharedAt: new Date().toISOString(),
          },
        ],
      },
    });

    return {
      success: true,
      messageId: createdMessage.id,
      channelId: channel.id,
      channelName: channel.name,
      sentAt: createdMessage.createdAt.toISOString(),
    };
  }

  async classAtRisk(user: CurrentUserData) {
    this.tenant(user);
    const report = await this.analytics.report();
    const allowed = await this.assignedClasses(user);
    if (!allowed) return report;
    const filteredStudents = report.students.filter(s => s.classId && allowed.includes(s.classId));
    return {
      ...report,
      summary: {
        ...report.summary,
        students: filteredStudents.length,
        atRisk: filteredStudents.filter(s => s.overall === 'HIGH' || s.overall === 'MODERATE').length,
        academicHigh: filteredStudents.filter(s => s.academic.level === 'HIGH').length,
        feeDefaultHigh: filteredStudents.filter(s => s.feeDefault.level === 'HIGH').length,
        dropoutHigh: filteredStudents.filter(s => s.dropout.level === 'HIGH').length,
      },
      students: filteredStudents,
    };
  }

  async copilotQuery(user: CurrentUserData, dto: CopilotQueryDto): Promise<ERPCopilotQueryResponse> {
    const tenantId = this.tenant(user);
    const tenant = await this.prisma.tenant.findFirst({ where: { id: tenantId }, select: { currency: true, name: true } });
    const currency = tenant?.currency ?? 'KES';
    const query = dto.query.trim();

    const parsedFilters: ERPCopilotFilterBadge[] = [];
    const queryLower = query.toLowerCase();

    // Grade / Class matching: e.g. "grade 9", "form 4", "class 7"
    let classFilter: string | null = null;
    const gradeMatch = queryLower.match(/\b(grade|form|class|std|standard)\s*(\d+|[a-z]+)\b/i);
    if (gradeMatch) {
      classFilter = gradeMatch[2].trim();
      parsedFilters.push({
        label: 'Class Filter',
        value: `${gradeMatch[1].toUpperCase()} ${classFilter}`,
        badgeType: 'class',
      });
    }

    // Attendance condition: e.g. "attendance < 80%", "attendance below 75%", "under 80% attendance"
    let attendanceOperator: '<' | '<=' | '>' | '>=' | '=' | null = null;
    let attendanceThreshold: number | null = null;
    const attMatch = queryLower.match(/attendance\s*(<|<=|>|>=|=|below|under|less than|greater than|above|over)?\s*(\d+)%?/i) ||
                     queryLower.match(/(below|under|less than|greater than|above|over)\s*(\d+)%?\s*attendance/i);
    if (attMatch) {
      const opRaw = (attMatch[1] || '').trim().toLowerCase();
      const numRaw = parseInt(attMatch[2], 10);
      if (!isNaN(numRaw)) {
        attendanceThreshold = numRaw;
        if (['<', 'below', 'under', 'less than'].includes(opRaw)) attendanceOperator = '<';
        else if (opRaw === '<=') attendanceOperator = '<=';
        else if (['>', 'above', 'over', 'greater than'].includes(opRaw)) attendanceOperator = '>';
        else if (opRaw === '>=') attendanceOperator = '>=';
        else attendanceOperator = '<';
        parsedFilters.push({
          label: 'Attendance',
          value: `${attendanceOperator} ${attendanceThreshold}%`,
          badgeType: 'attendance',
        });
      }
    }

    // Fee condition: e.g. "unpaid fee", "fee balance > 5000", "overdue fee", "fee arrears"
    let requireUnpaidFee = false;
    let feeMinThreshold: number | null = null;
    if (/\b(unpaid|fee balance|arrears|overdue|pending fee|fee debt|unpaid fee balance)\b/i.test(queryLower)) {
      requireUnpaidFee = true;
      const feeNumMatch = queryLower.match(/(?:>|above|over|more than|greater than|exceeding)\s*(?:kes|inr|\$)?\s*(\d+)/i);
      if (feeNumMatch) {
        feeMinThreshold = parseInt(feeNumMatch[1], 10);
        parsedFilters.push({
          label: 'Fee Arrears',
          value: `> ${currency} ${feeMinThreshold.toLocaleString()}`,
          badgeType: 'fee',
        });
      } else {
        parsedFilters.push({
          label: 'Fee Status',
          value: 'Unpaid / Overdue Balance',
          badgeType: 'fee',
        });
      }
    }

    // Academic / Grade condition: e.g. "marks < 40", "average below 50%", "failing"
    let academicOperator: '<' | '>' | null = null;
    let academicThreshold: number | null = null;
    const acadMatch = queryLower.match(/(?:marks?|grades?|score|average)\s*(<|<=|>|>=|below|under|above|over)?\s*(\d+)%?/i);
    if (acadMatch) {
      const opRaw = (acadMatch[1] || '').trim().toLowerCase();
      const numRaw = parseInt(acadMatch[2], 10);
      if (!isNaN(numRaw)) {
        academicThreshold = numRaw;
        academicOperator = ['>', '>=', 'above', 'over'].includes(opRaw) ? '>' : '<';
        parsedFilters.push({
          label: 'Academic Average',
          value: `${academicOperator} ${academicThreshold}%`,
          badgeType: 'grades',
        });
      }
    } else if (/\b(failing|poor marks|struggling|low performance)\b/i.test(queryLower)) {
      academicOperator = '<';
      academicThreshold = 40;
      parsedFilters.push({
        label: 'Academic Performance',
        value: '< 40% (At-Risk / Failing)',
        badgeType: 'grades',
      });
    }

    let filterRisk = false;
    if (/\b(at[- ]?risk|dropout|warning|flagged)\b/i.test(queryLower)) {
      filterRisk = true;
      parsedFilters.push({
        label: 'Risk Priority',
        value: 'High & Moderate Support Signals',
        badgeType: 'risk',
      });
    }

    // Fetch classes
    const assigned = await this.assignedClasses(user);
    const classes = await this.prisma.class.findMany({
      where: {
        tenantId,
        ...(assigned ? { id: { in: assigned } } : {}),
      },
      select: { id: true, name: true, level: true },
    });

    let targetClassIds: string[] = classes.map(c => c.id);
    if (classFilter) {
      const matched = classes.filter(c =>
        c.name.toLowerCase().includes(classFilter!.toLowerCase()) ||
        String(c.level).toLowerCase() === classFilter!.toLowerCase()
      );
      if (matched.length > 0) {
        targetClassIds = matched.map(m => m.id);
      }
    }

    const now = new Date();
    const attendanceStart = new Date(now.getTime() - 90 * 86_400_000);

    const students = await this.prisma.student.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: 'ACTIVE',
        ...(targetClassIds.length ? { currentClassId: { in: targetClassIds } } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNumber: true,
        currentClassId: true,
        currentClass: { select: { id: true, name: true } },
        guardianLinks: {
          select: {
            guardian: {
              select: { firstName: true, lastName: true, phone: true, email: true },
            },
          },
        },
        attendanceRecords: {
          where: { tenantId, date: { gte: attendanceStart, lte: now } },
          select: { date: true, status: true },
        },
        grades: {
          where: { tenantId, createdAt: { lte: now } },
          select: { score: true, marks: true, totalMarks: true },
        },
        invoices: {
          where: { tenantId, status: { notIn: ['CANCELLED', 'DRAFT'] } },
          select: { totalAmount: true, paidAmount: true, balanceAmount: true, dueDate: true, status: true },
        },
      },
      take: 300,
    });

    const matches: ERPCopilotStudentMatch[] = [];

    for (const student of students) {
      // Calculate attendance rate
      const dayStatus = new Map<string, number>();
      for (const rec of student.attendanceRecords) {
        if (!['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY'].includes(rec.status)) continue;
        const d = rec.date.toISOString().slice(0, 10);
        const val = rec.status === 'ABSENT' ? 0 : rec.status === 'HALF_DAY' ? 0.5 : 1;
        dayStatus.set(d, val);
      }
      const attendanceDays = dayStatus.size;
      const attendanceRate = attendanceDays > 0
        ? Math.round(([...dayStatus.values()].reduce((a, b) => a + b, 0) / attendanceDays) * 1000) / 10
        : null;

      // Calculate academic average
      const validGrades = student.grades.filter(g => g.totalMarks > 0 && (g.marks ?? g.score) >= 0);
      const latestAverage = validGrades.length > 0
        ? Math.round((validGrades.reduce((sum, g) => sum + ((g.marks ?? g.score) / g.totalMarks * 100), 0) / validGrades.length) * 10) / 10
        : null;

      // Calculate outstanding & overdue fees
      let outstandingBalance = 0;
      let overdueBalance = 0;
      for (const inv of student.invoices) {
        if (inv.balanceAmount > 0) {
          outstandingBalance += inv.balanceAmount;
          if (inv.dueDate && inv.dueDate < now) {
            overdueBalance += inv.balanceAmount;
          }
        }
      }

      const reasons: string[] = [];
      let riskLevel: 'HIGH' | 'MODERATE' | 'LOW' | 'NORMAL' = 'NORMAL';

      if (attendanceRate !== null && attendanceRate < 75) {
        riskLevel = 'HIGH';
        reasons.push(`Attendance critically low at ${attendanceRate}% (${attendanceDays} recorded days).`);
      } else if (attendanceRate !== null && attendanceRate < 82) {
        riskLevel = 'MODERATE';
        reasons.push(`Attendance dropping below 82% (${attendanceRate}%).`);
      }

      if (latestAverage !== null && latestAverage < 40) {
        riskLevel = 'HIGH';
        reasons.push(`Academic average critically low at ${latestAverage}%.`);
      } else if (latestAverage !== null && latestAverage < 50) {
        if ((riskLevel as string) !== 'HIGH') riskLevel = 'MODERATE';
        reasons.push(`Academic average needs improvement (${latestAverage}%).`);
      }

      if (outstandingBalance > 0) {
        if (overdueBalance > 0 && attendanceRate !== null && attendanceRate < 80) {
          riskLevel = 'HIGH';
        } else if (riskLevel === 'NORMAL') {
          riskLevel = 'MODERATE';
        }
        reasons.push(`Pending fee arrears of ${currency} ${(outstandingBalance / 100).toLocaleString()}${overdueBalance > 0 ? ' (past due date)' : ''}.`);
      }

      let passes = true;

      if (attendanceOperator && attendanceThreshold !== null) {
        if (attendanceRate === null) passes = false;
        else if (attendanceOperator === '<' && attendanceRate >= attendanceThreshold) passes = false;
        else if (attendanceOperator === '<=' && attendanceRate > attendanceThreshold) passes = false;
        else if (attendanceOperator === '>' && attendanceRate <= attendanceThreshold) passes = false;
        else if (attendanceOperator === '>=' && attendanceRate < attendanceThreshold) passes = false;
      }

      if (requireUnpaidFee) {
        if (outstandingBalance <= 0) passes = false;
        if (feeMinThreshold !== null && (outstandingBalance / 100) < feeMinThreshold) passes = false;
      }

      if (academicOperator && academicThreshold !== null) {
        if (latestAverage === null) passes = false;
        else if (academicOperator === '<' && latestAverage >= academicThreshold) passes = false;
        else if (academicOperator === '>' && latestAverage <= academicThreshold) passes = false;
      }

      if (filterRisk && riskLevel !== 'HIGH' && riskLevel !== 'MODERATE') {
        passes = false;
      }

      if (!gradeMatch && !attMatch && !requireUnpaidFee && !acadMatch && !filterRisk) {
        const text = `${student.firstName} ${student.lastName} ${student.admissionNumber} ${student.currentClass?.name ?? ''}`.toLowerCase();
        passes = queryLower.split(/\s+/).some(term => term.length > 2 && text.includes(term));
      }

      if (passes) {
        const primaryGuardian = student.guardianLinks[0]?.guardian;
        matches.push({
          studentId: student.id,
          name: `${student.firstName} ${student.lastName}`,
          admissionNumber: student.admissionNumber,
          className: student.currentClass?.name ?? 'Unassigned',
          classId: student.currentClassId ?? '',
          attendanceRate,
          attendanceDays,
          latestAverage,
          outstandingBalance,
          overdueBalance,
          riskLevel,
          parentName: primaryGuardian ? `${primaryGuardian.firstName} ${primaryGuardian.lastName}` : undefined,
          parentPhone: primaryGuardian?.phone || undefined,
          parentEmail: primaryGuardian?.email || undefined,
          reasons: reasons.length ? reasons : ['Matches current search parameters.'],
        });
      }
    }

    matches.sort((a, b) => {
      const pMap = { HIGH: 3, MODERATE: 2, LOW: 1, NORMAL: 0 };
      if (pMap[b.riskLevel] !== pMap[a.riskLevel]) return pMap[b.riskLevel] - pMap[a.riskLevel];
      return b.outstandingBalance - a.outstandingBalance;
    });

    const totalOutstanding = matches.reduce((sum, m) => sum + m.outstandingBalance, 0);
    const validAtt = matches.filter(m => m.attendanceRate !== null);
    const averageAttendance = validAtt.length > 0
      ? Math.round(validAtt.reduce((sum, m) => sum + (m.attendanceRate || 0), 0) / validAtt.length * 10) / 10
      : 0;
    const validScores = matches.filter(m => m.latestAverage !== null);
    const averageScore = validScores.length > 0
      ? Math.round(validScores.reduce((sum, m) => sum + (m.latestAverage || 0), 0) / validScores.length * 10) / 10
      : 0;
    const highRiskCount = matches.filter(m => m.riskLevel === 'HIGH').length;

    const interpretedIntent = parsedFilters.length > 0
      ? `Filtered ${matches.length} students matching: ${parsedFilters.map(f => `${f.label} (${f.value})`).join(', ')}`
      : `Searched students for "${query}" across active records`;

    const naturalLanguageSummary = matches.length > 0
      ? `Found ${matches.length} students meeting your criteria. Across this cohort, total outstanding fee arrears amount to ${currency} ${(totalOutstanding / 100).toLocaleString()}, with an average attendance rate of ${averageAttendance}% and average exam score of ${averageScore}%. ${highRiskCount} students are currently flagged as High Priority for staff intervention.`
      : `No students in the active roster matched the combination of "${query}". Try adjusting the attendance threshold or class parameters.`;

    const suggestedActions = [
      'Send instant WhatsApp attendance & fee notices to parents',
      'Schedule proactive Virtual PTM conferences with Class Teachers',
      'Export cohort audit list for the School Leadership & Finance Committee',
      'Assign academic mentors to high-risk students',
    ];

    return {
      originalQuery: query,
      interpretedIntent,
      parsedFilters,
      matches,
      totalCount: matches.length,
      currency,
      summary: {
        totalOutstanding,
        averageAttendance,
        averageScore,
        highRiskCount,
      },
      suggestedActions,
      naturalLanguageSummary,
      generatedAt: new Date().toISOString(),
    };
  }
}
