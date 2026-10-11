import { AnalyticsGroup, AnalyticsInsight, AnalyticsMetrics, ExecutiveAnalyticsReport } from '@krypton/types';

export const DAY = 86_400_000;
export const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const round = (n: number) => Math.round(n * 10) / 10;
const average = (values: number[]) => values.length ? round(values.reduce((a, b) => a + b, 0) / values.length) : null;
export interface AnalyticsFacts {
  students: { id: string; currentClassId: string | null }[];
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  grades: { studentId: string; subjectId: string; score: number; marks: number | null; totalMarks: number;
    examination: { startDate: Date | null; endDate: Date | null; createdAt: Date; subjects: { subjectId: string; passMark: number | null; totalMarks: number }[] } }[];
  attendance: { studentId: string; date: Date; status: string }[];
  invoices: { studentId: string; totalAmount: number; paidAmount: number; balanceAmount: number; dueDate: Date | null; createdAt: Date; status: string }[];
  payments: { amount: number; paymentDate: Date; status: string; invoice: { studentId: string } }[];
}
type GradeFact = { studentId: string; subjectId: string; date: Date; percentage: number; passed: boolean };
type AttendanceFact = { studentId: string; date: Date; presence: number };
const within = (date: Date, from: Date, until: Date) => date >= from && date < until;
export function prepareFacts(data: AnalyticsFacts, now: Date) {
  const ids = new Set(data.students.map(s => s.id));
  const grades: GradeFact[] = [];
  for (const g of data.grades) {
    const date = g.examination.endDate ?? g.examination.startDate ?? g.examination.createdAt;
    const marks = g.marks ?? g.score;
    if (!ids.has(g.studentId) || !Number.isFinite(marks) || !Number.isFinite(g.totalMarks) || g.totalMarks <= 0 || marks < 0 || marks > g.totalMarks || date > now) continue;
    const config = g.examination.subjects.find(s => s.subjectId === g.subjectId);
    const threshold = config && config.passMark !== null && config.totalMarks > 0 && config.passMark >= 0 && config.passMark <= config.totalMarks ? config.passMark / config.totalMarks * 100 : 40;
    const percentage = marks / g.totalMarks * 100;
    grades.push({ studentId: g.studentId, subjectId: g.subjectId, date, percentage, passed: percentage >= threshold });
  }
  const days = new Map<string, { studentId: string; date: Date; values: number[] }>();
  for (const a of data.attendance) {
    if (!ids.has(a.studentId) || a.date > now || !['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT'].includes(a.status)) continue;
    const key = `${a.studentId}:${isoDay(a.date)}`, day = days.get(key) ?? { studentId: a.studentId, date: new Date(isoDay(a.date)), values: [] };
    day.values.push(a.status === 'ABSENT' ? 0 : a.status === 'HALF_DAY' ? 0.5 : 1); days.set(key, day);
  }
  const attendance: AttendanceFact[] = [...days.values()].map(a => ({ studentId: a.studentId, date: a.date, presence: a.values.reduce((sum, n) => sum + n, 0) / a.values.length }));
  const invoices = data.invoices.filter(i => ids.has(i.studentId) && !['DRAFT', 'CANCELLED'].includes(i.status) && i.createdAt <= now);
  const payments = data.payments.filter(p => ids.has(p.invoice.studentId) && p.status === 'COMPLETED' && p.paymentDate <= now && p.amount >= 0);
  return { ...data, grades, attendance, invoices, payments };
}
type Prepared = ReturnType<typeof prepareFacts>;
export function metrics(data: Prepared, from: Date, until: Date, now: Date): AnalyticsMetrics {
  const grades = data.grades.filter(g => within(g.date, from, until)), attendance = data.attendance.filter(a => within(a.date, from, until));
  const cohortInvoices = data.invoices.filter(i => within(i.createdAt, from, until));
  const billed = cohortInvoices.reduce((sum, i) => sum + Math.max(0, i.totalAmount), 0);
  const settled = cohortInvoices.reduce((sum, i) => sum + Math.max(0, Math.min(i.totalAmount, i.paidAmount)), 0);
  return { students: data.students.length, assessedStudents: new Set(grades.map(g => g.studentId)).size, assessmentCount: grades.length,
    averageScore: average(grades.map(g => g.percentage)), passRate: average(grades.map(g => g.passed ? 100 : 0)),
    attendanceRate: average(attendance.map(a => a.presence * 100)), attendanceDays: attendance.length, attendanceStudents: new Set(attendance.map(a => a.studentId)).size,
    billed, receipts: data.payments.filter(p => within(p.paymentDate, from, until)).reduce((sum, p) => sum + p.amount, 0),
    invoiceSettlementRate: billed ? round(settled / billed * 100) : null,
    outstanding: data.invoices.reduce((sum, i) => sum + Math.max(0, i.balanceAmount), 0),
    overdue: data.invoices.filter(i => i.dueDate && i.dueDate < now).reduce((sum, i) => sum + Math.max(0, i.balanceAmount), 0) };
}
function classData(data: Prepared, classId: string | null): Prepared {
  const students = data.students.filter(s => s.currentClassId === classId), ids = new Set(students.map(s => s.id));
  return { ...data, students, grades: data.grades.filter(g => ids.has(g.studentId)), attendance: data.attendance.filter(a => ids.has(a.studentId)),
    invoices: data.invoices.filter(i => ids.has(i.studentId)), payments: data.payments.filter(p => ids.has(p.invoice.studentId)) };
}
export function buildExecutiveReport(facts: AnalyticsFacts, from: Date, until: Date, now: Date, currency: string, schoolName: string,
  filters: { classId: string | null; subjectId: string | null }): ExecutiveAnalyticsReport {
  const data = prepareFacts(facts, now), previousFrom = new Date(from.getTime() - (until.getTime() - from.getTime()));
  const current = metrics(data, from, until, now), previous = metrics(data, previousFrom, from, now);
  const groups = [...data.classes, ...(data.students.some(s => !s.currentClassId) ? [{ id: 'unassigned', name: 'Unassigned' }] : [])];
  const classes: AnalyticsGroup[] = groups.map(c => ({ id: c.id, name: c.name, ...metrics(classData(data, c.id === 'unassigned' ? null : c.id), from, until, now) }));
  const subjects: AnalyticsGroup[] = data.subjects.map(s => ({ id: s.id, name: s.name, ...metrics({ ...data, grades: data.grades.filter(g => g.subjectId === s.id), attendance: [], invoices: [], payments: [] }, from, until, now) }));
  const daily = new Map<string, { gradeSum: number; assessmentCount: number; presenceSum: number; attendanceDays: number; receipts: number }>();
  for (let time = from.getTime(); time < until.getTime(); time += DAY) {
    daily.set(isoDay(new Date(time)), { gradeSum: 0, assessmentCount: 0, presenceSum: 0, attendanceDays: 0, receipts: 0 });
  }
  data.grades.forEach(g => { const day = daily.get(isoDay(g.date)); if (day) { day.gradeSum += g.percentage; day.assessmentCount++; } });
  data.attendance.forEach(a => { const day = daily.get(isoDay(a.date)); if (day) { day.presenceSum += a.presence; day.attendanceDays++; } });
  data.payments.forEach(p => { const day = daily.get(isoDay(p.paymentDate)); if (day) day.receipts += p.amount; });
  const trend = [...daily].map(([date, d]) => ({ date, averageScore: d.assessmentCount ? round(d.gradeSum / d.assessmentCount) : null,
    assessmentCount: d.assessmentCount, attendanceRate: d.attendanceDays ? round(d.presenceSum / d.attendanceDays * 100) : null, attendanceDays: d.attendanceDays, receipts: d.receipts }));
  const insights: AnalyticsInsight[] = [];
  if (current.averageScore !== null && previous.averageScore !== null) {
    const delta = round(current.averageScore - previous.averageScore);
    insights.push({ kind: delta < -5 ? 'attention' : delta > 5 ? 'positive' : 'information', title: delta < 0 ? 'Assessment scores declined' : 'Assessment score comparison',
      detail: `Mean assessment score changed by ${delta > 0 ? '+' : ''}${delta} percentage points (${previous.assessmentCount} previous / ${current.assessmentCount} current results). Review assessment difficulty and cohort context.`, href: '/school/grades' });
  }
  if (current.attendanceRate !== null && current.attendanceRate < 85) insights.push({ kind: 'attention', title: 'Attendance needs a review', detail: `Recorded attendance is ${current.attendanceRate}% across ${current.attendanceDays} student-days. Review register coverage and absence context.`, href: '/school/attendance' });
  if (current.attendanceRate !== null && previous.attendanceRate !== null && previous.attendanceRate - current.attendanceRate >= 5) insights.push({ kind: 'attention', title: 'Attendance trend fell', detail: `Recorded attendance fell ${round(previous.attendanceRate - current.attendanceRate)} percentage points against the previous period.`, href: '/school/attendance' });
  if (current.students && current.assessedStudents / current.students < 0.8) insights.push({ kind: 'information', title: 'Incomplete learning evidence', detail: `${current.assessedStudents} of ${current.students} current active students have assessment results in this period. Missing marks are not treated as zero.`, href: '/school/grades' });
  if (current.students && current.attendanceStudents / current.students < 0.8) insights.push({ kind: 'information', title: 'Register coverage is limited', detail: `${current.attendanceStudents} of ${current.students} current active students have usable attendance records. Unrecorded days are unknown.`, href: '/school/attendance' });
  const lowSubject = subjects.filter(s => s.assessmentCount >= 5 && s.averageScore !== null).sort((a, b) => a.averageScore! - b.averageScore!)[0];
  if (lowSubject && lowSubject.averageScore! < 50) insights.push({ kind: 'attention', title: `${lowSubject.name}: plan learning support`, detail: `Mean score is ${lowSubject.averageScore}% from ${lowSubject.assessmentCount} results. Review the assessed topics before planning support.`, href: '/school/grades' });
  if (current.overdue > 0) insights.push({ kind: 'attention', title: 'Overdue fees need follow-up', detail: 'The current cohort has overdue invoice balances. Review the fee ledger and arrange appropriate follow-up.', href: '/school/fees' });
  if (!insights.length) insights.push({ kind: 'information', title: 'Use the evidence in context', detail: 'Compare classes, subjects and record coverage before drawing conclusions. Different assessment difficulty can affect comparisons.', href: '/school/predictive-analytics' });
  return { generatedAt: now.toISOString(), currency, schoolName,
    period: { from: isoDay(from), to: isoDay(new Date(until.getTime() - DAY)), previousFrom: isoDay(previousFrom), previousTo: isoDay(new Date(from.getTime() - DAY)) },
    filters, current, previous, classes, subjects, trend, insights,
    methodology: [
      'Cohort: current active, non-deleted students, grouped by their current class. Both periods use this same cohort; this is not historical enrollment.',
      'Mean score and pass rate count valid subject assessment results. Percentages are recalculated from marks / total marks, including zero; missing and invalid results are excluded. Pass thresholds use examination subject settings, defaulting to 40%.',
      'Assessment dates use exam end, start, then creation date. Attendance averages periods within each recorded student-day; present/late count as 1, half-day as 0.5, absent as 0. Leave/sickness and unrecorded days are excluded.',
      'Receipts are completed payments dated in the period; refunded payments are excluded. Billed uses non-draft, non-cancelled invoices created in the period. Invoice settlement uses their paid balances as of now, not historical payment timing.',
      'Outstanding and overdue balances are current snapshots across all invoices for the cohort, regardless of selected dates. Subject filters apply only to assessment metrics. Financial figures are stored in currency minor units.',
      'The previous period has the same number of calendar days. Comparisons describe observed records, not causal effects or school quality rankings.' ] };
}
