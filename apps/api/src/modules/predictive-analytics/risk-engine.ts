import { PredictiveAnalyticsReport, RiskAssessment, RiskLevel, StudentRiskProfile } from '@krypton/types';
import { clamp, trainRiskModel, TrainingSample } from './risk-model';

const DAY = 86_400_000;
export interface AnalyticsHomeworkItem {
  id: string;
  assignmentId: string;
  status: string;
  score: number | null;
  submittedAt: Date;
  assignment?: {
    id: string;
    classId?: string;
    subjectId?: string;
    title: string;
    dueDate: Date;
    maxMarks: number;
    subject?: { name: string };
  };
}

export interface AnalyticsClassAssignment {
  id: string;
  classId: string;
  subjectId: string;
  title: string;
  dueDate: Date;
  maxMarks: number;
  subject?: { name: string };
}

export interface AnalyticsStudent {
  id: string; firstName: string; lastName: string; admissionNumber: string; status: string;
  currentClassId: string | null; currentClass: { name: string } | null;
  attendanceRecords: { date: Date; status: string }[];
  grades: {
    subjectId: string; score: number; marks: number | null; totalMarks: number; updatedAt?: Date;
    examination: { id: string; startDate: Date | null; endDate: Date | null; createdAt: Date;
      subjects: { subjectId: string; passMark: number | null; totalMarks: number; weight: number }[] };
  }[];
  invoices: {
    totalAmount: number; paidAmount: number; balanceAmount: number; status: string; dueDate: Date | null; createdAt: Date;
    payments: { amount: number; paymentDate: Date; status: string }[];
  }[];
  submissions?: AnalyticsHomeworkItem[];
  classAssignments?: AnalyticsClassAssignment[];
}
interface ExamPoint { date: Date; availableAt: Date; average: number; margin: number; below: number }
const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
function examHistory(student: AnalyticsStudent, now: Date): ExamPoint[] {
  const exams = new Map<string, AnalyticsStudent['grades']>();
  for (const grade of student.grades) {
    const exam = grade.examination;
    if ((exam.endDate ?? exam.startDate ?? exam.createdAt) > now) continue;
    const group = exams.get(exam.id) ?? [];
    group.push(grade); exams.set(exam.id, group);
  }
  const points: ExamPoint[] = [];
  for (const grades of exams.values()) {
    const exam = grades[0].examination;
    // Partial mark entry must not become a school-failure label.
    if (exam.subjects.some(s => !grades.some(g => g.subjectId === s.subjectId))) continue;
    let weight = 0, average = 0, margin = 0, below = 0, validGrades = 0;
    for (const grade of grades) {
      const config = exam.subjects.find(s => s.subjectId === grade.subjectId);
      const total = grade.totalMarks;
      const score = grade.marks ?? grade.score;
      if (total <= 0 || !Number.isFinite(score) || score < 0 || score > total) continue;
      const percent = score / total * 100;
      const pass = config?.passMark == null ? 40 : config.passMark / config.totalMarks * 100;
      const w = config && config.weight > 0 ? config.weight : 1;
      if (!Number.isFinite(pass) || pass < 0 || pass > 100) continue;
      validGrades++;
      weight += w; average += percent * w; margin += (percent - pass) * w;
      below += (percent < pass ? 1 : 0) * w;
    }
    if (weight && validGrades === grades.length) points.push({ date: exam.endDate ?? exam.startDate ?? exam.createdAt,
      availableAt: new Date(Math.max((exam.endDate ?? exam.startDate ?? exam.createdAt).getTime(), ...grades.map(g => g.updatedAt?.getTime() ?? 0))),
      average: average / weight, margin: margin / weight, below: below / weight });
  }
  return points.sort((a, b) => a.date.getTime() - b.date.getTime());
}
/** Linear regression over the last three completed examinations, projected one examination ahead. */
export function academicFeatures(points: ExamPoint[]) {
  const recent = points.slice(-3);
  const center = (recent.length - 1) / 2;
  const yMean = mean(recent.map(p => p.average));
  const denominator = recent.reduce((sum, _, i) => sum + (i - center) ** 2, 0);
  const slope = denominator ? recent.reduce((sum, p, i) => sum + (i - center) * (p.average - yMean), 0) / denominator : 0;
  const latest = recent[recent.length - 1];
  return { features: [clamp(-latest.margin / 50, -1, 1), clamp(-slope / 50, -1, 1), latest.below],
    slope, projection: clamp(yMean + slope * (recent.length - center), 0, 100) };
}
type Bill = AnalyticsStudent['invoices'][number];
const usableBill = (bill: Bill, now: Date) => !['CANCELLED', 'DRAFT'].includes(bill.status) && bill.createdAt <= now;
const ledgerValid = (bill: Bill, now: Date) => {
  const paid = bill.payments.filter(p => p.status === 'COMPLETED' && p.paymentDate <= now).reduce((sum, p) => sum + p.amount, 0);
  return bill.totalAmount > 0 && paid === bill.paidAmount && bill.balanceAmount === bill.totalAmount - paid && paid <= bill.totalAmount;
};
const balanceAt = (bill: Bill, date: Date) => Math.max(0, bill.totalAmount - bill.payments
  .filter(p => p.status === 'COMPLETED' && p.paymentDate <= date).reduce((sum, p) => sum + p.amount, 0));
function feeFeatures(bill: Bill, bills: Bill[], date: Date) {
  const earlier = bills.filter(b => b !== bill && b.createdAt <= date && b.dueDate && b.dueDate.getTime() + 30 * DAY <= date.getTime());
  const defaults = earlier.filter(b => balanceAt(b, new Date(b.dueDate!.getTime() + 30 * DAY)) > 0).length;
  const arrears = earlier.filter(b => balanceAt(b, date) > 0).length;
  return [balanceAt(bill, date) / bill.totalAmount, earlier.length ? defaults / earlier.length : 0,
    earlier.length ? arrears / earlier.length : 0];
}
const levelFor = (score: number | null): RiskLevel => score === null ? 'INSUFFICIENT_DATA' : score >= 65 ? 'HIGH' : score >= 35 ? 'MODERATE' : 'LOW';
function assessment(score: number | null, evidence: string[], actions: string[], trained = false): RiskAssessment {
  const rounded = score === null ? null : Math.round(clamp(score, 0, 100));
  return { score: rounded, level: levelFor(rounded), basis: trained ? 'SCHOOL_MODEL' : 'EARLY_WARNING', evidence, actions };
}

export function homeworkAnalysis(student: AnalyticsStudent, now: Date) {
  const submissions = student.submissions ?? [];
  const classAssignments = student.classAssignments ?? [];
  const cutoff = new Date(now.getTime() - 90 * DAY);
  const eligible = classAssignments.filter(a => a.dueDate >= cutoff && a.dueDate <= now);
  const totalAssigned = eligible.length;

  if (totalAssigned === 0) {
    return {
      score: null,
      completionRate: null,
      missingCount: 0,
      averageScore: null,
      evidence: ['No assignments recorded in the last 90 days.'],
      actions: ['Set weekly homework tasks to build steady study habits.', 'Monitor completion on the student portal.'],
    };
  }

  const subMap = new Map<string, AnalyticsHomeworkItem>();
  for (const sub of submissions) {
    subMap.set(sub.assignmentId, sub);
  }

  let submittedCount = 0;
  let lateCount = 0;
  let missingCount = 0;
  let gradedCount = 0;
  let totalScorePercent = 0;
  const missingSubjects = new Set<string>();

  for (const assignment of eligible) {
    const sub = subMap.get(assignment.id);
    if (!sub || sub.status === 'NOT_SUBMITTED') {
      missingCount++;
      if (assignment.subject?.name) missingSubjects.add(assignment.subject.name);
    } else {
      submittedCount++;
      if (sub.submittedAt > assignment.dueDate || sub.status === 'LATE') {
        lateCount++;
      }
      if (sub.score !== null && assignment.maxMarks > 0) {
        gradedCount++;
        totalScorePercent += (sub.score / assignment.maxMarks) * 100;
      }
    }
  }

  const completionRate = Math.round((submittedCount / totalAssigned) * 100);
  const averageScore = gradedCount > 0 ? Math.round((totalScorePercent / gradedCount) * 10) / 10 : null;

  let riskScore = (100 - completionRate) * 0.65 + Math.min(missingCount * 10, 30);
  if (averageScore !== null && averageScore < 50) {
    riskScore += (50 - averageScore) * 0.4;
  }
  if (lateCount > 1) {
    riskScore += Math.min(lateCount * 3, 10);
  }
  const score = clamp(Math.round(riskScore), 0, 100);

  const evidence: string[] = [
    `${submittedCount} of ${totalAssigned} assignments submitted (${completionRate}% completion rate).`,
  ];
  if (missingCount > 0) {
    evidence.push(`${missingCount} overdue/unsubmitted assignment(s)${missingSubjects.size > 0 ? ` across: ${[...missingSubjects].slice(0, 3).join(', ')}` : ''}.`);
  }
  if (lateCount > 0) {
    evidence.push(`${lateCount} submitted late.`);
  }
  if (averageScore !== null) {
    evidence.push(`Graded homework average: ${averageScore}%.`);
  }

  const actions = [
    'Assign a homework catch-up plan with clear mini-milestones.',
    'Send an intervention alert to parents to inspect the homework diary at home.',
  ];

  return {
    score,
    completionRate,
    missingCount,
    averageScore,
    evidence,
    actions,
  };
}

function computeRadarMetrics(
  latestAverage: number | null,
  projectedAverage: number | null,
  attendanceRate: number | null,
  hwRate: number | null,
  hwAvg: number | null,
  overdueBalance: number,
  outstandingBalance: number,
  priorityScore: number | null,
) {
  const academicScore = latestAverage !== null
    ? Math.round(clamp(latestAverage, 0, 100))
    : projectedAverage !== null
    ? Math.round(clamp(projectedAverage, 0, 100))
    : 60;

  const attendanceScore = attendanceRate !== null
    ? Math.round(clamp(attendanceRate, 0, 100))
    : 70;

  const homeworkScore = hwRate !== null
    ? Math.round(clamp((hwRate * 0.7) + ((hwAvg ?? hwRate) * 0.3), 0, 100))
    : 75;

  let finPenalty = 0;
  if (overdueBalance > 0) finPenalty += 40;
  if (outstandingBalance > 0) finPenalty += 20;
  const financialScore = Math.max(0, 100 - finPenalty);

  const compositeRiskScore = priorityScore !== null
    ? priorityScore
    : Math.round(clamp(100 - ((academicScore * 0.4) + (attendanceScore * 0.3) + (homeworkScore * 0.3)), 0, 100));

  return {
    academicScore,
    attendanceScore,
    homeworkScore,
    financialScore,
    compositeRiskScore,
  };
}

function buildInterventions(
  student: AnalyticsStudent,
  academicRisk: RiskAssessment,
  dropoutRisk: RiskAssessment,
  homeworkRisk: RiskAssessment,
) {
  const teacherActions: string[] = [];
  const parentGuidance: string[] = [];
  const malayalamTeacher: string[] = [];
  const malayalamParent: string[] = [];

  if (academicRisk.level === 'HIGH') {
    teacherActions.push('Provide targeted 1-on-1 subject remediation in struggling core areas.');
    teacherActions.push('Pair student with a supportive peer-study buddy in class.');
    parentGuidance.push('Dedicate 45 minutes of quiet, distraction-free home study every evening.');
    malayalamTeacher.push('പഠനത്തിൽ പിന്നാക്കം നിൽക്കുന്ന പ്രധാന വിഷയങ്ങളിൽ പ്രത്യേക ശ്രദ്ധയും ട്യൂട്ടോറിംഗും നൽകുക.');
    malayalamParent.push('വൈകുന്നേരങ്ങളിൽ വീട്ടിൽ 45 മിനിറ്റ് ശാന്തമായ പഠന സമയം നിർബന്ധമാക്കുക.');
  } else if (academicRisk.level === 'MODERATE') {
    teacherActions.push('Review recent quiz answers and check understanding of foundational topics.');
    parentGuidance.push('Review weekly class test papers and celebrate incremental progress.');
    malayalamTeacher.push('മുൻ പരീക്ഷകളിലെ പോരായ്മകൾ കണ്ടെത്തി അടിസ്ഥാന വിവരങ്ങൾ വീണ്ടും ഓർമ്മിപ്പിക്കുക.');
    malayalamParent.push('കുട്ടിയുടെ പ്രതിവാര ടെസ്റ്റ് പേപ്പറുകൾ പരിശോധിച്ച് പ്രോത്സാഹിപ്പിക്കുക.');
  }

  if (dropoutRisk.level === 'HIGH') {
    teacherActions.push('Conduct an immediate check-in to investigate underlying causes of recurring absence.');
    parentGuidance.push('Ensure consistent morning routine; contact school promptly if health issues arise.');
    malayalamTeacher.push('തുടർച്ചയായ അവധിയുടെ കാരണം മനസ്സിലാക്കാൻ ക്ലാസ് ടീച്ചർ നേരിട്ട് വിദ്യാർത്ഥിയുമായി സംസാരിക്കുക.');
    malayalamParent.push('സ്കൂളിൽ മുടങ്ങാതെ കൃത്യസമയത്ത് ഹാജരാകാൻ കുട്ടിയെ സഹായിക്കുക.');
  } else if (dropoutRisk.level === 'MODERATE') {
    teacherActions.push('Monitor morning arrival punctuality over the next 14 school days.');
    parentGuidance.push('Avoid non-essential mid-week absences and schedule appointments after hours.');
    malayalamTeacher.push('അടുത്ത രണ്ടാഴ്ചത്തെ പ്രഭാത ഹാജർ നിലയും സമയനിഷ്ഠയും കൃത്യമായി നിരീക്ഷിക്കുക.');
    malayalamParent.push('അത്യാവശ്യകാര്യങ്ങൾക്കല്ലാതെ പഠനദിവസങ്ങളിൽ സ്കൂളിൽ നിന്ന് അവധിയെടുക്കുന്നത് ഒഴിവാക്കുക.');
  }

  if (homeworkRisk.level === 'HIGH') {
    teacherActions.push('Grant a structured homework recovery timeline broken into manageable daily milestones.');
    parentGuidance.push('Check the student school bag, homework diary, and online portal daily at 6 PM.');
    malayalamTeacher.push('പൂർത്തിയാക്കാത്ത ഹോംവർക്കുകൾ ഘട്ടംഘട്ടമായി തീർക്കാൻ പ്രത്യേക റിക്കവറി ടൈംടേബിൾ നൽകുക.');
    malayalamParent.push('ദിവസവും വൈകുന്നേരം കുട്ടിയുടെ സ്കൂൾ ഡയറിയും ഓൺലൈൻ പോർട്ടലും പരിശോധിച്ച് ഹോംവർക്ക് ഉറപ്പുവരുത്തുക.');
  } else if (homeworkRisk.level === 'MODERATE') {
    teacherActions.push('Verify homework submission at start of class and provide instant verbal encouragement.');
    parentGuidance.push('Encourage finishing homework before screen-time or extracurricular play.');
    malayalamTeacher.push('ക്ലാസ് തുടങ്ങുമ്പോൾ തന്നെ ഹോംവർക്ക് പരിശോധിക്കുകയും നല്ല പ്രയത്നങ്ങളെ പ്രശംസിക്കുകയും ചെയ്യുക.');
    malayalamParent.push('കളിക്കാനോ മൊബൈൽ ഉപയോഗിക്കാനോ മുൻപായി ഹോംവർക്ക് പൂർത്തിയാക്കാൻ നിർദ്ദേശിക്കുക.');
  }

  if (!teacherActions.length) {
    teacherActions.push('Maintain current positive reinforcement and encourage advanced enrichment tasks.');
    malayalamTeacher.push('നിലവിലെ മികച്ച പഠന നിലവാരം നിലനിർത്താൻ പ്രോത്സാഹനം നൽകുക.');
  }
  if (!parentGuidance.length) {
    parentGuidance.push('Continue encouraging reading habits and steady school attendance.');
    malayalamParent.push('വായനാശീലവും സ്കൂൾ ഹാജരും ഇതേപോലെ തുടർന്നും പ്രോത്സാഹിപ്പിക്കുക.');
  }

  const isHigh = academicRisk.level === 'HIGH' || dropoutRisk.level === 'HIGH' || homeworkRisk.level === 'HIGH';
  const isMod = academicRisk.level === 'MODERATE' || dropoutRisk.level === 'MODERATE' || homeworkRisk.level === 'MODERATE';
  const riskTitle = isHigh
    ? 'പഠനത്തിൽ അടിയന്തിര ശ്രദ്ധ ആവശ്യമുള്ള വിദ്യാർത്ഥി (High At-Risk)'
    : isMod
    ? 'കൂടുതൽ ശ്രദ്ധയും പിന്തുണയും ആവശ്യമുള്ള വിദ്യാർത്ഥി (Moderate Support)'
    : 'പഠനനില തൃപ്തികരം (On Track)';

  return {
    teacherActions,
    parentGuidance,
    malayalamSummary: {
      riskTitle,
      teacherAdvice: malayalamTeacher,
      parentAdvice: malayalamParent,
    },
  };
}

export function buildAnalytics(students: AnalyticsStudent[], now: Date, currency: string): PredictiveAnalyticsReport {
  const histories = new Map(students.map(s => [s.id, examHistory(s, now)]));
  const academicSamples: TrainingSample[] = [], feeSamples: TrainingSample[] = [];
  for (const student of students) {
    const points = histories.get(student.id)!;
    for (let i = 2; i < points.length; i++) {
      // No same-date or very old-to-new comparisons, and no outcome in input features.
      if (points[i].date <= points[i - 1].date || points[i].date.getTime() - points[i - 1].date.getTime() > 180 * DAY) continue;
      // A retrospectively entered or revised mark cannot become a historical predictor.
      const available = points.slice(0, i).filter(p => p.availableAt < points[i].date);
      if (available.length < 2) continue;
      academicSamples.push({ features: academicFeatures(available).features,
        outcome: points[i].margin < 0 ? 1 : 0, date: points[i].date });
    }
    const bills = student.invoices.filter(b => usableBill(b, now) && ledgerValid(b, now));
    for (const bill of bills) {
      if (!bill.dueDate || bill.dueDate.getTime() + 30 * DAY > now.getTime()) continue;
      const snapshot = new Date(bill.dueDate.getTime() - 7 * DAY);
      if (bill.createdAt > snapshot) continue;
      feeSamples.push({ features: feeFeatures(bill, bills, snapshot),
        outcome: balanceAt(bill, new Date(bill.dueDate.getTime() + 30 * DAY)) > 0 ? 1 : 0,
        date: new Date(bill.dueDate.getTime() + 30 * DAY) });
    }
  }
  const academicModel = trainRiskModel(academicSamples), feeModel = trainRiskModel(feeSamples);
  const profiles: StudentRiskProfile[] = students.filter(s => s.status === 'ACTIVE').map(student => {
    const points = histories.get(student.id)!;
    const latest = points[points.length - 1];
    const recentPoints = points.filter(p => p.date.getTime() >= now.getTime() - 180 * DAY);
    const academic = latest && recentPoints.length >= 2 ? academicFeatures(recentPoints) : null;
    const days = new Map<string, number[]>();
    for (const record of student.attendanceRecords) {
      if (record.date > now || record.date.getTime() < now.getTime() - 90 * DAY) continue;
      // Approved leave, sickness, and official duty do not count as disengagement.
      if (!['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY'].includes(record.status)) continue;
      const day = record.date.toISOString().slice(0, 10), values = days.get(day) ?? [];
      values.push(record.status === 'ABSENT' ? 0 : record.status === 'HALF_DAY' ? 0.5 : 1); days.set(day, values);
    }
    const attendanceDays = days.size;
    const lastRecordedDay = [...days.keys()].sort().at(-1);
    const attendanceKnown = attendanceDays >= 10 && !!lastRecordedDay && now.getTime() - new Date(lastRecordedDay).getTime() <= 21 * DAY;
    const attendanceRate = attendanceDays ? mean([...days.values()].map(mean)) * 100 : null;
    let absenceStreak = 0;
    for (const [, values] of [...days.entries()].sort(([a], [b]) => b.localeCompare(a))) {
      if (mean(values) > 0) break;
      absenceStreak++;
    }
    const academicEvidence = latest ? [`Latest completed exam average: ${latest.average.toFixed(1)}%.`,
      `${Math.round(latest.below * 100)}% of subject weight is below its pass mark.`] : ['No complete examination results.'];
    if (academic) academicEvidence.push(`Next-exam trend estimate: ${academic.projection.toFixed(1)}% (${academic.slope.toFixed(1)} points per exam).`);
    else academicEvidence.push('Two completed exams within 180 days are needed for a trend.');
    const academicScore = academic ? academicModel.predict ? academicModel.predict(academic.features) * 100 :
      clamp(40 - latest.margin * 2 + Math.max(0, -academic.slope) * 2 + latest.below * 20, 0, 100) : null;
    const academicRisk = assessment(academicScore, academicEvidence, ['Review subject-level marks and agree a tutoring plan.', 'Check progress after the next assessment.'], !!academicModel.predict && !!academic);

    const bills = student.invoices.filter(b => usableBill(b, now));
    const outstandingBalance = bills.reduce((sum, b) => sum + Math.max(0, b.balanceAmount), 0);
    const overdue = bills.filter(b => b.balanceAmount > 0 && b.dueDate && b.dueDate < now);
    const overdueBalance = overdue.reduce((sum, b) => sum + Math.max(0, b.balanceAmount), 0);
    const dueSoon = bills.filter(b => b.balanceAmount > 0 && b.dueDate && b.dueDate.getTime() <= now.getTime() + 30 * DAY);
    const oldestDays = overdue.length ? Math.floor(Math.max(...overdue.map(b => (now.getTime() - b.dueDate!.getTime()) / DAY))) : 0;
    let feeScore: number | null = bills.length && !outstandingBalance ? 0 : dueSoon.length ?
      clamp(25 + Math.min(oldestDays, 60) + Math.min(overdue.length, 3) * 10, 0, 100) : null;
    const validBills = bills.filter(b => ledgerValid(b, now));
    let previousDefaultRate = 0;
    if (feeScore !== null && dueSoon.length) {
      previousDefaultRate = Math.max(...dueSoon.filter(b => b.totalAmount > 0).map(b => feeFeatures(b, validBills, now)[1]), 0);
      feeScore = clamp(feeScore + previousDefaultRate * 40, 0, 100);
    }
    // Apply the trained model only at the same seven-days-before-due horizon used in training.
    const modelBills = dueSoon.filter(b => ledgerValid(b, now) && b.dueDate && Math.abs(b.dueDate.getTime() - now.getTime() - 7 * DAY) <= DAY);
    const useFeeModel = !!feeModel.predict && modelBills.length > 0 && overdue.length === 0;
    if (useFeeModel) feeScore = Math.max(...modelBills.map(b => feeModel.predict!(feeFeatures(b, validBills, now)) * 100));
    const feeEvidence = [`${overdue.length} overdue invoice(s); oldest is ${oldestDays} days past due.`];
    if (previousDefaultRate > 0) feeEvidence.push(`${Math.round(previousDefaultRate * 100)}% of earlier matured invoices still had an unpaid balance 30 days after their due date.`);
    if (feeScore === null) feeEvidence.push('No outstanding invoice with a due date in the next 30 days; default risk cannot be assessed.');
    if (bills.some(b => !ledgerValid(b, now))) feeEvidence.push('Some payment ledgers do not reconcile; those invoices are excluded from model training.');
    if (useFeeModel) feeEvidence.push('School model estimates an unpaid balance 30 days after the due date.');
    const feeRisk = assessment(feeScore, feeEvidence, ['Review the payment ledger with the accounts team.', 'Discuss a payment plan or fee support with the guardian.'], useFeeModel);

    const dropoutEvidence = [`${attendanceDays} attendance days recorded in the last 90 days.`];
    if (attendanceRate !== null) dropoutEvidence.push(`Attendance: ${attendanceRate.toFixed(1)}%; ${absenceStreak} most recent recorded days fully absent.`);
    if (!attendanceKnown) dropoutEvidence.push('At least 10 recorded days and an attendance update within 21 days are required.');
    const dropoutScore = attendanceKnown ? clamp((100 - attendanceRate!) * 2 + Math.min(absenceStreak, 5) * 8 +
      (academic && academic.slope < -5 ? 10 : 0), 0, 100) : null;
    const dropoutRisk = assessment(dropoutScore, dropoutEvidence, ['Ask the class teacher to check attendance context.', 'Arrange a supportive student and guardian check-in.']);

    const hw = homeworkAnalysis(student, now);
    const homeworkRisk = assessment(hw.score, hw.evidence, hw.actions);

    const evaluatedRisks = [academicRisk, feeRisk, dropoutRisk];
    if (hw.score !== null) {
      evaluatedRisks.push(homeworkRisk);
    }
    const scores = [academicRisk.score, feeRisk.score, dropoutRisk.score, homeworkRisk.score].filter((s): s is number => s !== null);
    const priorityScore = scores.length ? Math.max(...scores) : null;
    const overall: RiskLevel = evaluatedRisks.some(r => r.level === 'HIGH')
      ? 'HIGH'
      : evaluatedRisks.some(r => r.level === 'MODERATE')
      ? 'MODERATE'
      : evaluatedRisks.some(r => r.level === 'INSUFFICIENT_DATA')
      ? 'INSUFFICIENT_DATA'
      : 'LOW';

    const radarMetrics = computeRadarMetrics(
      latest ? Math.round(latest.average * 10) / 10 : null,
      academic ? Math.round(academic.projection * 10) / 10 : null,
      attendanceKnown ? Math.round(attendanceRate! * 10) / 10 : null,
      hw.completionRate,
      hw.averageScore,
      overdueBalance,
      outstandingBalance,
      priorityScore,
    );

    const interventions = buildInterventions(student, academicRisk, dropoutRisk, homeworkRisk);

    return { studentId: student.id, name: `${student.firstName} ${student.lastName}`, admissionNumber: student.admissionNumber,
      classId: student.currentClassId, className: student.currentClass?.name ?? 'Unassigned', overall, priorityScore,
      academic: academicRisk, feeDefault: feeRisk, dropout: dropoutRisk, homework: homeworkRisk,
      metrics: { latestAverage: latest ? Math.round(latest.average * 10) / 10 : null,
        projectedAverage: academic ? Math.round(academic.projection * 10) / 10 : null,
        attendanceRate: attendanceKnown ? Math.round(attendanceRate! * 10) / 10 : null, attendanceDays, outstandingBalance, overdueBalance,
        homeworkCompletionRate: hw.completionRate, homeworkMissingCount: hw.missingCount, homeworkAverageScore: hw.averageScore },
      radarMetrics, interventions };
  });
  profiles.sort((a, b) => (b.priorityScore ?? -1) - (a.priorityScore ?? -1) || a.name.localeCompare(b.name));
  const classes = new Map<string, string>();
  profiles.forEach(s => { if (s.classId) classes.set(s.classId, s.className); });
  return { generatedAt: now.toISOString(), engineVersion: '1.0.0', currency,
    methodology: 'Risk indices (0–100), not calibrated probabilities or guaranteed outcomes. Academic, fee, attendance, and homework models use school-only historical data with a temporal validation gate. When history or validation is inadequate, explainable early-warning indicators are used. Dropout and homework indicators provide actionable multi-factor early detection. Default pass mark is 40% where no subject pass mark is configured. Human review is required.',
    models: { academic: academicModel.info, feeDefault: feeModel.info },
    summary: { students: profiles.length, atRisk: profiles.filter(s => ['HIGH', 'MODERATE'].includes(s.overall)).length,
      academicHigh: profiles.filter(s => s.academic.level === 'HIGH').length,
      feeDefaultHigh: profiles.filter(s => s.feeDefault.level === 'HIGH').length,
      dropoutHigh: profiles.filter(s => s.dropout.level === 'HIGH').length,
      homeworkHigh: profiles.filter(s => s.homework.level === 'HIGH').length,
      incompleteData: profiles.filter(s => [s.academic, s.feeDefault, s.dropout].some(r => r.score === null)).length,
      overdueBalance: profiles.reduce((sum, s) => sum + s.metrics.overdueBalance, 0) },
    classes: [...classes.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)), students: profiles };
}
