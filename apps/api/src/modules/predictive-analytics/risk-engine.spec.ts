import { AnalyticsStudent, buildAnalytics } from './risk-engine';
import { trainRiskModel, TrainingSample } from './risk-model';

const now = new Date('2026-10-11T12:00:00Z');
function student(overrides: Partial<AnalyticsStudent> = {}): AnalyticsStudent {
  return { id: 'student-1', firstName: 'Ananya', lastName: 'Nair', admissionNumber: 'A001', status: 'ACTIVE',
    currentClassId: 'class-1', currentClass: { name: 'Class 5' }, grades: [], invoices: [], attendanceRecords: [], ...overrides };
}
function exams(scores: number[]): AnalyticsStudent['grades'] {
  return scores.map((score, i) => ({ subjectId: 'math', score, marks: null, totalMarks: 100,
    examination: { id: `exam-${i}`, createdAt: new Date(Date.UTC(2026, 7 + i, 1)),
      startDate: new Date(Date.UTC(2026, 7 + i, 1)), endDate: null,
      subjects: [{ subjectId: 'math', totalMarks: 100, passMark: 40, weight: 1 }] } }));
}
const attendance = (status: string, days = 10) => Array.from({ length: days }, (_, i) => ({ date: new Date(Date.UTC(2026, 9, i + 1)), status }));
const bill = (paid = 0): AnalyticsStudent['invoices'][number] => ({ totalAmount: 10000, paidAmount: paid,
  balanceAmount: 10000 - paid, status: paid === 10000 ? 'PAID' : 'PENDING', dueDate: new Date('2026-08-01'),
  createdAt: new Date('2026-07-01'), payments: paid ? [{ amount: paid, paymentDate: new Date('2026-07-15'), status: 'COMPLETED' }] : [] });
const profile = (s: AnalyticsStudent) => buildAnalytics([s], now, 'INR').students[0];

describe('predictive early-warning engine', () => {
  it('flags falling marks, repeated absence and overdue fees with explainable evidence', () => {
    const result = profile(student({ grades: exams([70, 50, 25]), attendanceRecords: attendance('ABSENT'), invoices: [bill()] }));
    expect([result.academic.level, result.feeDefault.level, result.dropout.level]).toEqual(['HIGH', 'HIGH', 'HIGH']);
    expect(result.metrics.projectedAverage).toBe(3.3);
    expect(result.academic.basis).toBe('EARLY_WARNING');
    expect(result.academic.evidence.join(' ')).toContain('Next-exam trend estimate');
    expect(result.metrics.overdueBalance).toBe(10000);
  });
  it('does not turn absent data into zero risk or an all-clear', () => {
    const result = profile(student());
    expect(result.overall).toBe('INSUFFICIENT_DATA');
    expect([result.academic.score, result.feeDefault.score, result.dropout.score]).toEqual([null, null, null]);
  });
  it('shows low risk with improving marks, regular attendance and settled bills', () => {
    const result = profile(student({ grades: exams([70, 80, 90]), attendanceRecords: attendance('PRESENT'), invoices: [bill(10000)] }));
    expect(result.overall).toBe('LOW');
    expect(result.feeDefault.score).toBe(0);
    expect(result.metrics.attendanceRate).toBe(100);
  });
  it('requires two recent completed exams and ignores future exams', () => {
    const one = exams([10]);
    expect(profile(student({ grades: one })).academic.score).toBeNull();
    const future = exams([10, 5]); future[1].examination.endDate = new Date('2027-01-01');
    expect(profile(student({ grades: future })).academic.score).toBeNull();
  });
  it('ignores incomplete examination mark entry', () => {
    const history = exams([20, 10]); history[1].examination.subjects.push({ subjectId: 'science', totalMarks: 100, passMark: 40, weight: 1 });
    expect(profile(student({ grades: history })).academic.score).toBeNull();
  });
  it('uses configured subject pass marks rather than a universal threshold', () => {
    const history = exams([50, 50]); history.forEach(g => { g.examination.subjects[0].passMark = 60; });
    expect(profile(student({ grades: history })).academic.level).toBe('HIGH');
    history.forEach(g => { g.examination.subjects[0].passMark = 20; });
    expect(profile(student({ grades: history })).academic.level).toBe('LOW');
  });
  it('counts recorded days rather than multiple attendance periods as independent days', () => {
    const records = attendance('ABSENT', 5).flatMap(record => [record, record, record]);
    const result = profile(student({ attendanceRecords: records }));
    expect(result.metrics.attendanceDays).toBe(5);
    expect(result.dropout.score).toBeNull();
  });
  it('does not penalise approved leave, illness or official duty', () => {
    const records = [...attendance('PRESENT'), ...['SICK', 'SICK_LEAVE', 'ON_LEAVE', 'OFFICIAL_DUTY', 'EXCUSED'].map(status => ({ status, date: new Date('2026-10-11') }))];
    expect(profile(student({ attendanceRecords: records })).dropout.score).toBe(0);
  });
  it('does not infer current dropout risk from stale attendance', () => {
    const records = attendance('ABSENT').map(r => ({ ...r, date: new Date(r.date.getTime() - 40 * 86400000) }));
    expect(profile(student({ attendanceRecords: records })).dropout.score).toBeNull();
  });
  it('ignores cancelled invoices and refuses default scores without due dates', () => {
    expect(profile(student({ invoices: [{ ...bill(), status: 'CANCELLED' }] })).feeDefault.score).toBeNull();
    expect(profile(student({ invoices: [{ ...bill(), dueDate: null }] })).feeDefault.score).toBeNull();
  });
  it('preserves zero marks and legacy marks', () => {
    const history = exams([90, 90]); history.forEach(g => { g.marks = 0; });
    expect(profile(student({ grades: history })).metrics.latestAverage).toBe(0);
    expect(profile(student({ grades: exams([0, 0]) })).academic.level).toBe('HIGH');
  });
  it('excludes inactive students from current watchlists and summary counts', () => {
    const report = buildAnalytics([student(), student({ id: 'withdrawn', status: 'WITHDRAWN' })], now, 'USD');
    expect(report.summary.students).toBe(1); expect(report.currency).toBe('USD');
  });
  it('warns about unreconciled ledgers and excludes them from training', () => {
    const report = buildAnalytics([student({ invoices: [{ ...bill(), paidAmount: 5000, balanceAmount: 5000 }] })], now, 'INR');
    expect(report.models.feeDefault.samples).toBe(0);
    expect(report.students[0].feeDefault.evidence.join(' ')).toContain('do not reconcile');
  });
  it('does not train on marks retrospectively entered or revised after the target exam', () => {
    const history = exams([60, 50, 30]); history[0].updatedAt = new Date('2026-10-10');
    expect(buildAnalytics([student({ grades: history })], now, 'INR').models.academic.samples).toBe(0);
  });
  it('does not turn invalid marks into completed examination evidence', () => {
    const history = exams([60, 50]); history[0].totalMarks = 0;
    expect(profile(student({ grades: history })).academic.score).toBeNull();
  });
  it('flags upcoming fees when reconciled history shows repeated late settlement', () => {
    const old = bill(10000); old.payments[0].paymentDate = new Date('2026-09-15');
    const upcoming = { ...bill(), dueDate: new Date('2026-10-18'), createdAt: new Date('2026-10-01') };
    expect(profile(student({ invoices: [old, upcoming] })).feeDefault.level).toBe('HIGH');
  });
  it('flags missing homework assignments, calculates radar metrics and provides tailored teacher/parent interventions', () => {
    const classAssignments = [
      { id: 'hw-1', classId: 'class-1', subjectId: 'math', title: 'Algebra Equations', dueDate: new Date('2026-09-20'), maxMarks: 50, subject: { name: 'Mathematics' } },
      { id: 'hw-2', classId: 'class-1', subjectId: 'eng', title: 'Essay Writing', dueDate: new Date('2026-09-25'), maxMarks: 100, subject: { name: 'English' } },
      { id: 'hw-3', classId: 'class-1', subjectId: 'sci', title: 'Biology Cells', dueDate: new Date('2026-10-02'), maxMarks: 40, subject: { name: 'Science' } },
    ];
    // Student only submitted 1 out of 3, and scored poorly
    const submissions = [
      { id: 'sub-1', assignmentId: 'hw-1', status: 'GRADED', score: 15, submittedAt: new Date('2026-09-21'), assignment: classAssignments[0] },
    ];
    const result = profile(student({
      grades: exams([45, 40]),
      attendanceRecords: attendance('PRESENT', 12),
      invoices: [bill(10000)],
      classAssignments,
      submissions,
    }));
    expect(result.homework.level).toBe('HIGH');
    expect(result.metrics.homeworkCompletionRate).toBe(33);
    expect(result.metrics.homeworkMissingCount).toBe(2);
    expect(result.metrics.homeworkAverageScore).toBe(30);
    expect(result.homework.evidence.join(' ')).toContain('1 of 3 assignments submitted');
    expect(result.homework.evidence.join(' ')).toContain('2 overdue/unsubmitted');

    // Verify Early Warning Radar metrics
    expect(result.radarMetrics).toBeDefined();
    expect(result.radarMetrics.homeworkScore).toBeLessThan(50);
    expect(result.radarMetrics.attendanceScore).toBe(100);
    expect(result.radarMetrics.compositeRiskScore).toBeGreaterThanOrEqual(65);

    // Verify Teacher & Parent Interventions in English and Malayalam
    expect(result.interventions.teacherActions.length).toBeGreaterThan(0);
    expect(result.interventions.parentGuidance.length).toBeGreaterThan(0);
    expect(result.interventions.malayalamSummary).toBeDefined();
    expect(result.interventions.malayalamSummary.riskTitle).toContain('ശ്രദ്ധ');
    expect(result.interventions.malayalamSummary.teacherAdvice.length).toBeGreaterThan(0);
    expect(result.interventions.malayalamSummary.parentAdvice.length).toBeGreaterThan(0);
  });
  it('rewards consistent homework completion with low risk and high radar score', () => {
    const classAssignments = [
      { id: 'hw-1', classId: 'class-1', subjectId: 'math', title: 'Geometry', dueDate: new Date('2026-09-20'), maxMarks: 50, subject: { name: 'Mathematics' } },
      { id: 'hw-2', classId: 'class-1', subjectId: 'eng', title: 'Grammar', dueDate: new Date('2026-09-25'), maxMarks: 50, subject: { name: 'English' } },
    ];
    const submissions = [
      { id: 'sub-1', assignmentId: 'hw-1', status: 'GRADED', score: 48, submittedAt: new Date('2026-09-19'), assignment: classAssignments[0] },
      { id: 'sub-2', assignmentId: 'hw-2', status: 'GRADED', score: 45, submittedAt: new Date('2026-09-24'), assignment: classAssignments[1] },
    ];
    const result = profile(student({
      grades: exams([80, 85, 90]),
      attendanceRecords: attendance('PRESENT', 15),
      invoices: [bill(10000)],
      classAssignments,
      submissions,
    }));
    expect(result.homework.level).toBe('LOW');
    expect(result.metrics.homeworkCompletionRate).toBe(100);
    expect(result.metrics.homeworkMissingCount).toBe(0);
    expect(result.radarMetrics.homeworkScore).toBeGreaterThanOrEqual(90);
    expect(result.overall).toBe('LOW');
  });
});

describe('school-trained logistic model validation gate', () => {
  const samples = (): TrainingSample[] => Array.from({ length: 120 }, (_, i) => ({
    features: [i % 2 ? 1 : -1, 0], outcome: (i % 2) as 0 | 1, date: new Date(Date.UTC(2025, 0, i + 1)) }));
  it('activates only with enough examples and successful later-date validation', () => {
    const model = trainRiskModel(samples());
    expect(model.info.status).toBe('ACTIVE'); expect(model.info.validationSamples).toBe(30);
    expect(model.predict!([1, 0])).toBeGreaterThan(0.65); expect(model.predict!([-1, 0])).toBeLessThan(0.35);
  });
  it('rejects a model that fails to generalise to later outcomes', () => {
    const rows = samples(); rows.slice(90).forEach(s => { s.outcome = s.outcome ? 0 : 1; });
    const model = trainRiskModel(rows);
    expect(model.info.status).toBe('VALIDATION_FAILED'); expect(model.predict).toBeNull();
  });
  it('requires both outcome classes, not just a large sample count', () => {
    const rows = samples(); rows.forEach(s => { s.outcome = 0; });
    expect(trainRiskModel(rows).info.status).toBe('INSUFFICIENT_HISTORY');
  });
  it('does not split the same exam date across training and validation', () => {
    const rows = samples(); rows.forEach(s => { s.date = now; });
    expect(trainRiskModel(rows).predict).toBeNull();
  });
});
