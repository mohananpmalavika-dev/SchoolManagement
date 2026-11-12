import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TeacherAIController } from './teacher-ai.controller';
import { TeacherAIService } from './teacher-ai.service';
import { GenerateRemarksDto, GenerateQuizDto } from './dto/teacher-ai.dto';
import { questionPaper } from './ai-output';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const user = { userId: id(1), tenantId: id(2), email: 'teacher@example.test', role: 'TEACHER' };
const classTerm = { classId: id(3), termId: id(4) };
const learner = () => ({ id: id(5), firstName: 'Ananya', lastName: 'Nair', admissionNumber: 'A01', grades: [
  { score: 0, marks: null, totalMarks: 100, subject: { name: 'Mathematics' }, examination: { name: 'Midterm', startDate: new Date('2026-06-15'), endDate: null, createdAt: new Date('2026-06-15') } },
], attendanceRecords: [{ date: new Date('2026-06-15'), status: 'PRESENT' }, { date: new Date('2026-06-15'), status: 'PRESENT' }],
  reportCards: [{ id: id(6), status: 'DRAFT', updatedAt: new Date('2026-06-20'), classTeacherComments: null, teacherComment: null }] });
function setup() {
  const tx = { reportCard: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) }, auditLog: { create: jest.fn().mockResolvedValue({}) } };
  const prisma = {
    staff: { findFirst: jest.fn().mockResolvedValue({ id: id(7) }) }, timetableEntry: { findMany: jest.fn().mockResolvedValue([{ classId: id(3) }]) },
    class: { findFirst: jest.fn().mockResolvedValue({ id: id(3), name: 'Class 5', level: 'Class 5' }), findMany: jest.fn().mockResolvedValue([]) },
    term: { findFirst: jest.fn().mockResolvedValue({ id: id(4), name: 'Term 1', startDate: new Date('2026-04-01'), endDate: new Date('2026-09-30') }), findMany: jest.fn().mockResolvedValue([]) },
    student: { findMany: jest.fn().mockResolvedValue([learner()]) }, $transaction: jest.fn().mockImplementation(async operation => operation(tx)),
    chatChannel: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: id(10), name: 'Class 5 Channel' }) },
    chatChannelMember: { create: jest.fn().mockResolvedValue({}) },
    chatMessage: { create: jest.fn().mockResolvedValue({ id: id(11), createdAt: new Date('2026-01-20T10:00:00.000Z') }) },
  };
  const ai = { status: () => ({ configured: true, provider: 'OpenAI', model: 'test-model', message: 'Configured' }), generate: jest.fn().mockResolvedValue({ remarks: [{ key: 'S1', text: 'The learner can build confidence through regular guided mathematics practice.', evidence: ['Mathematics: 0%.'] }] }) };
  const exams = { bulkGenerateReportCards: jest.fn().mockResolvedValue({ generated: 1, skipped: 0, errors: [] }) };
  const analytics = { report: jest.fn().mockResolvedValue({ students: [] }) };
  const service = new TeacherAIService(prisma as any, { requireTenantContext: () => id(2) } as any, ai as any, exams as any, analytics as any);
  return { service, prisma, ai, exams, analytics, tx };
}

describe('AI teaching scope, evidence and reviewed saves', () => {
  it('denies a teacher whose timetable does not include the requested class before invoking AI', async () => {
    const { service, prisma, ai } = setup(); prisma.timetableEntry.findMany.mockResolvedValue([]);
    await expect(service.remarks(user, { ...classTerm, language: 'English', students: [{ studentId: id(5) }] })).rejects.toThrow('not assigned');
    expect(ai.generate).not.toHaveBeenCalled(); expect(prisma.student.findMany).not.toHaveBeenCalled();
  });
  it('denies mismatched tenant context before querying student evidence', async () => {
    const { service, prisma } = setup();
    await expect(service.options({ ...user, tenantId: id(99) })).rejects.toThrow('workspace access');
    expect(prisma.student.findMany).not.toHaveBeenCalled();
  });
  it('rejects unavailable students before external AI transmission', async () => {
    const { service, prisma, ai } = setup(); prisma.student.findMany.mockResolvedValue([]);
    await expect(service.remarks(user, { ...classTerm, language: 'English', students: [{ studentId: id(99) }] })).rejects.toThrow('unavailable');
    expect(ai.generate).not.toHaveBeenCalled();
  });
  it('uses real zero marks, distinct attendance days and explicit behaviour observations, with pseudonymous identifiers', async () => {
    const { service, prisma, ai } = setup();
    const result = await service.remarks(user, { ...classTerm, language: 'Malayalam', students: [{ studentId: id(5), behaviourObservation: 'Helps classmates with group work.' }] });
    const input = ai.generate.mock.calls[0][2] as any;
    expect(input.students[0].average).toBe(0); expect(input.students[0].recordedAttendanceDays).toBe(1);
    expect(input.students[0].behaviourObservation).toBe('Helps classmates with group work.');
    expect(JSON.stringify(input)).not.toContain('Amina'); expect(JSON.stringify(input)).not.toContain(id(5)); expect(JSON.stringify(input)).not.toContain('A01');
    expect(result.remarks[0].studentId).toBe(id(5));
    const query = prisma.student.findMany.mock.calls[0][0] as any;
    expect(query.where.tenantId).toBe(id(2)); expect(query.select.grades.where.tenantId).toBe(id(2));
    expect(query.select.attendanceRecords.where.tenantId).toBe(id(2)); expect(query.select.reportCards.where.tenantId).toBe(id(2));
    expect(query.select.medicalConditions).toBeUndefined(); expect(query.select.notes).toBeUndefined();
  });
  it('does not infer behaviour when no teacher observation was supplied', async () => {
    const { service, ai } = setup();
    await service.remarks(user, { ...classTerm, language: 'English', students: [{ studentId: id(5) }] });
    expect((ai.generate.mock.calls[0][2] as any).students[0].behaviourObservation).toBeNull();
  });
  it('rejects a response that substitutes another student key', async () => {
    const { service, ai } = setup(); ai.generate.mockResolvedValue({ remarks: [{ key: 'S9', text: 'A fabricated remark', evidence: [] }] });
    await expect(service.remarks(user, { ...classTerm, language: 'English', students: [{ studentId: id(5) }] })).rejects.toThrow('invalid teaching draft');
  });
  it('saves only a reviewed draft using tenant, student, class, status and version predicates and an atomic audit log', async () => {
    const { service, tx } = setup();
    await service.saveRemark(user, { ...classTerm, studentId: id(5), reportCardId: id(6), expectedUpdatedAt: '2026-01-20T00:00:00.000Z', remark: 'The learner is making steady progress with guided practice.' });
    const query = tx.reportCard.updateMany.mock.calls[0][0] as any;
    expect(query.where).toMatchObject({ tenantId: id(2), studentId: id(5), termId: id(4), status: 'DRAFT', updatedAt: new Date('2026-01-20') });
    expect(query.where.student).toMatchObject({ tenantId: id(2), currentClassId: id(3), status: 'ACTIVE', deletedAt: null });
    expect(query.data.classTeacherComments).toEqual(query.data.teacherComment);
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: id(1), action: 'AI_ASSISTED_REMARK_REVIEWED' }) }));
  });
  it('rejects stale or published reports without writing an audit event', async () => {
    const { service, tx } = setup(); tx.reportCard.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.saveRemark(user, { ...classTerm, studentId: id(5), reportCardId: id(6), expectedUpdatedAt: '2026-01-20T00:00:00.000Z', remark: 'The learner is making steady progress.' })).rejects.toThrow('no longer a draft');
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });
  it('uses the existing report-card engine after class and term authorization', async () => {
    const { service, exams } = setup(); await service.prepareReports(user, classTerm);
    expect(exams.bulkGenerateReportCards).toHaveBeenCalledWith(classTerm, id(1));
  });
  it('asks for more source material when AI cannot produce ten grounded questions', async () => {
    const { service, ai } = setup(); ai.generate.mockResolvedValue({ questions: [], warnings: ['Source is too limited.'] } as any);
    await expect(service.quiz(user, { classId: id(3), subject: 'Maths', chapter: 'Fractions', sourceText: 'A fraction represents an equal part of a whole. One half means one of two equal parts.', language: 'English', format: 'QUIZ', questionType: 'MCQ', difficulty: 'STANDARD' })).rejects.toThrow('Add more chapter');
  });
  it('restricts whole-school support reviews to leadership and rejects cross-school student IDs', async () => {
    const { service, ai } = setup();
    await expect(service.riskReview(user, { studentIds: [id(5)], language: 'English' })).rejects.toThrow('leadership');
    await expect(service.riskReview({ ...user, role: 'PRINCIPAL' }, { studentIds: [id(99)], language: 'English' })).rejects.toThrow('unavailable');
    expect(ai.generate).not.toHaveBeenCalled();
  });
  it('keeps missing risk evidence unscored and excludes fee and identity data from the AI support review', async () => {
    const { service, analytics, ai } = setup();
    analytics.report.mockResolvedValue({ students: [{ studentId: id(5), name: 'Amina', feeDefault: { score: 100 }, academic: { score: null }, dropout: { score: null }, metrics: { latestAverage: null, projectedAverage: null, attendanceRate: null, attendanceDays: 0, outstandingBalance: 10000 } }] } as any);
    ai.generate.mockResolvedValue({ students: [{ key: 'S1', priority: 'HIGH', reasons: ['More records are needed.'], supportPlan: ['Check the attendance register.'] }] } as any);
    const result = await service.riskReview({ ...user, role: 'PRINCIPAL' }, { studentIds: [id(5)], language: 'English' });
    expect(result.students[0].priority).toBe('INSUFFICIENT_DATA');
    expect(JSON.stringify(ai.generate.mock.calls[0][2])).not.toMatch(/Amina|feeDefault|outstandingBalance/);
  });
  it('generates a full scheme of work for authorized teacher', async () => {
    const { service, ai } = setup();
    ai.generate.mockResolvedValue({
      title: 'Class 5 Science Scheme of Work', gradeLevel: 'Class 5', subject: 'Science',
      strand: 'Living Things', term: 'Term 1', academicYear: '2026-27', curriculum: 'CBSE',
      generalOutcomes: ['Understand living things.'], coreCompetencies: ['Critical Thinking'],
      values: ['Respect'], pcis: ['Environmental Conservation'], weeks: [], assessmentRubrics: [],
    } as any);
    const res = await service.schemeOfWork(user, { classId: id(3), subject: 'Science', strand: 'Living Things' });
    expect(res.curriculum).toBe('CBSE');
    expect(ai.generate).toHaveBeenCalledWith('scheme_of_work', expect.any(String), expect.objectContaining({ subject: 'Integrated Science', strand: 'Living Things' }), expect.any(Object));
  });
  it('shares lesson plan to class chat channel creating channel if not existing', async () => {
    const { service, prisma } = setup();
    const result = await service.shareToChat(user, {
      classId: id(3),
      title: 'Photosynthesis Lesson',
      content: 'Here are the key inquiry questions.',
      type: 'LESSON_PLAN',
    });
    expect(result.success).toBe(true);
    expect(result.messageId).toBe(id(11));
    expect(prisma.chatChannel.create).toHaveBeenCalled();
    expect(prisma.chatMessage.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        senderId: id(1),
        content: 'Here are the key inquiry questions.',
      }),
    }));
  });
});

describe('teaching request and question-paper validation', () => {
  it('rejects duplicate students and batches larger than ten', async () => {
    const request = { ...classTerm, language: 'English', students: [{ studentId: id(5) }, { studentId: id(5) }] };
    expect((await validate(plainToInstance(GenerateRemarksDto, request))).length).toBeGreaterThan(0);
    request.students = Array.from({ length: 11 }, (_, i) => ({ studentId: id(i + 20) }));
    expect((await validate(plainToInstance(GenerateRemarksDto, request))).length).toBeGreaterThan(0);
  });
  it('rejects missing or oversized chapter content', async () => {
    const request = { classId: id(3), subject: 'Maths', chapter: 'Fractions', sourceText: 'short', language: 'English', format: 'QUIZ', questionType: 'MCQ', difficulty: 'STANDARD' };
    expect((await validate(plainToInstance(GenerateQuizDto, request))).length).toBeGreaterThan(0);
    request.sourceText = 'x'.repeat(20001);
    expect((await validate(plainToInstance(GenerateQuizDto, request))).length).toBeGreaterThan(0);
  });
  const paper = () => ({ title: 'Fractions quiz', instructions: 'Answer all questions.', warnings: [], questions: Array.from({ length: 10 }, (_, i) => ({ type: 'MCQ', question: `Question ${i + 1}?`, options: ['One', 'Two', 'Three', 'Four'], answer: 'One', explanation: 'The supplied chapter supports this answer.', marks: 1 })) });
  it('accepts exactly ten valid questions and a separately usable answer key', () => expect(questionPaper(paper(), 'MCQ').questions).toHaveLength(10));
  it('rejects wrong counts, duplicate questions, missing options and invalid answer keys', () => {
    const p = paper(); p.questions.pop(); expect(() => questionPaper(p, 'MCQ')).toThrow();
    const duplicate = paper(); duplicate.questions[1].question = duplicate.questions[0].question; expect(() => questionPaper(duplicate, 'MCQ')).toThrow();
    const wrong = paper(); wrong.questions[0].answer = 'Not an option'; expect(() => questionPaper(wrong, 'MCQ')).toThrow();
    const incomplete = paper(); incomplete.questions[0].options.pop(); expect(() => questionPaper(incomplete, 'MCQ')).toThrow();
  });
  it('enforces the selected question type and mixed-paper diversity', () => {
    expect(() => questionPaper(paper(), 'SHORT_ANSWER')).toThrow(); expect(() => questionPaper(paper(), 'MIXED')).toThrow();
  });
  it.each(['PARENT', 'STUDENT', 'ACCOUNTANT', 'LIBRARIAN', 'SUPER_ADMIN'])('denies AI teaching access to %s', role => {
    const ctx = { getHandler: () => TeacherAIController.prototype.remarks, getClass: () => TeacherAIController, switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) } as unknown as ExecutionContext;
    expect(() => new RolesGuard(new Reflector()).canActivate(ctx)).toThrow('Insufficient permissions');
  });
});
