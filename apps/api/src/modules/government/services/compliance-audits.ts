import { BadRequestException } from '@nestjs/common';
import { DataAuditType } from '@prisma/client';

import { Db, Issue, calendar, day, limit, parseDate, round } from './compliance-core';

export async function auditData(db: Db, tenantId: string, auditType: DataAuditType) {
  const issues: Issue[] = [],
    metrics = { completeness: [0, 0], accuracy: [0, 0], consistency: [0, 0] };
  const check = (
    kind: keyof typeof metrics,
    valid: boolean,
    entityType: string,
    row: any,
    field: string,
    message: string
  ) => {
    metrics[kind][1]++;
    if (valid) metrics[kind][0]++;
    else issues.push({ severity: 'ERROR', entityType, entityId: row.id, field, message });
  };
  const types =
    auditType === 'FULL_AUDIT'
      ? ['STUDENT_DATA', 'STAFF_DATA', 'SCHOOL_PROFILE', 'ATTENDANCE_DATA', 'EXAMINATION_DATA']
      : [auditType];
  if (types.includes('STUDENT_DATA')) {
    const rows = limit(
      await db.student.findMany({
        where: { tenantId, deletedAt: null, status: 'ACTIVE' },
        take: 50001,
      })
    );
    for (const s of rows) {
      check(
        'completeness',
        !!s.firstName.trim() && !!s.lastName.trim(),
        'STUDENT_RECORD',
        s,
        'name',
        'Enter the student name'
      );
      check(
        'accuracy',
        s.dateOfBirth <= new Date(),
        'STUDENT_RECORD',
        s,
        'dateOfBirth',
        'Birth date cannot be in the future'
      );
      check(
        'consistency',
        s.dateOfBirth < s.admissionDate,
        'STUDENT_RECORD',
        s,
        'dateOfBirth',
        'Birth date must precede admission'
      );
      check(
        'completeness',
        !!s.currentClassId,
        'STUDENT_RECORD',
        s,
        'currentClassId',
        'Assign a school class'
      );
      check(
        'accuracy',
        !s.apaarId || /^\d{12}$/.test(s.apaarId),
        'STUDENT_RECORD',
        s,
        'apaarId',
        'APAAR must contain 12 digits'
      );
      check(
        'accuracy',
        !s.aadhaarLast4 || /^\d{4}$/.test(s.aadhaarLast4),
        'STUDENT_RECORD',
        s,
        'aadhaarLast4',
        'Store only four Aadhaar digits'
      );
      check(
        'completeness',
        !!(s.penNumber || s.apaarId || s.birthCertNumber),
        'STUDENT_RECORD',
        s,
        'identification',
        'Add a verified PEN, APAAR or birth certificate reference'
      );
    }
  }
  if (types.includes('STAFF_DATA')) {
    const rows = limit(
      await db.staff.findMany({ where: { tenantId, status: 'ACTIVE' }, take: 50001 })
    );
    const codes = await db.udiseStaffRecord.findMany({ where: { tenantId } });
    for (const s of rows) {
      check(
        'completeness',
        !!s.firstName.trim() && !!s.lastName.trim(),
        'STAFF',
        s,
        'name',
        'Enter the staff name'
      );
      check(
        'accuracy',
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email),
        'STAFF',
        s,
        'email',
        'Enter a valid staff email'
      );
      check(
        'consistency',
        !s.terminationDate || s.terminationDate >= s.hireDate,
        'STAFF',
        s,
        'hireDate',
        'Termination cannot precede hiring'
      );
      if (s.isTeacher)
        check(
          'completeness',
          codes.some((c) => c.staffId === s.id && !!c.teacherCode),
          'STAFF',
          s,
          'teacherCode',
          'Verify and save a national teacher code'
        );
    }
  }
  if (types.includes('SCHOOL_PROFILE')) {
    const rows = await db.school.findMany({ where: { tenantId } });
    for (const s of rows) {
      check('completeness', !!s.name.trim(), 'SCHOOL', s, 'name', 'Enter a school name');
      check('completeness', !!s.address, 'SCHOOL', s, 'address', 'Add the school address');
      check(
        'completeness',
        !!s.affiliationNumber,
        'SCHOOL',
        s,
        'affiliationNumber',
        'Add the school board affiliation reference'
      );
    }
  }
  if (types.includes('ATTENDANCE_DATA')) {
    const end = parseDate(day(new Date())),
      start = new Date(end.getTime() - 29 * 86400000);
    const records = limit(
      await db.attendanceRecord.findMany({
        where: { tenantId, date: { gte: start, lte: end } },
        take: 50001,
      })
    );
    for (const r of records)
      check(
        'accuracy',
        r.date <= new Date(),
        'ATTENDANCE',
        r,
        'date',
        'Attendance cannot be in the future'
      );
    try {
      const cal = await calendar(db, tenantId, start, end),
        saved = new Set(records.map((r) => day(r.date)));
      for (const date of cal.dates.filter((d) => d < day(end)))
        check(
          'completeness',
          saved.has(date),
          'ATTENDANCE',
          { id: date },
          'date',
          `No attendance recorded on school day ${date}`
        );
    } catch (error) {
      if (!(error instanceof BadRequestException)) throw error;
      check(
        'completeness',
        false,
        'SCHOOL',
        { id: tenantId },
        'terms',
        'Configure terms to assess attendance coverage'
      );
    }
  }
  if (types.includes('EXAMINATION_DATA')) {
    const grades = limit(await db.grade.findMany({ where: { tenantId }, take: 50001 }));
    for (const g of grades) {
      const score = g.marks ?? g.score;
      check(
        'accuracy',
        Number.isFinite(score) && score >= 0 && score <= g.totalMarks,
        'GRADE',
        g,
        'score',
        'Marks must be within the subject maximum'
      );
      check(
        'consistency',
        g.totalMarks > 0 && Math.abs(g.percentage - (score / g.totalMarks) * 100) < 0.02,
        'GRADE',
        g,
        'percentage',
        'Grade percentage differs from its saved marks'
      );
    }
  }
  const checks = Object.values(metrics).reduce((n, m) => n + m[1], 0),
    passed = Object.values(metrics).reduce((n, m) => n + m[0], 0);
  const score = (kind: keyof typeof metrics) =>
    metrics[kind][1] ? round((metrics[kind][0] / metrics[kind][1]) * 100) : 0;
  if (!checks)
    issues.push({
      severity: 'WARNING',
      field: 'records',
      message: 'No source records available to assess',
    });
  return {
    completeness: score('completeness'),
    accuracy: score('accuracy'),
    consistency: score('consistency'),
    overallScore: checks ? round((passed / checks) * 100) : 0,
    checks,
    passed,
    metrics,
    issues,
    method:
      'Measured record checks passed. A category with no checks scores zero; this is not an official certification.',
  };
}
