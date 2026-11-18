import { BadRequestException } from '@nestjs/common';

import { GenerateReportDto } from '../dto/compliance.dto';

import { Db, bounds, calendar, countBy, day, fullName, limit, round } from './compliance-core';

export async function buildReport(tx: Db, tenantId: string, dto: GenerateReportDto): Promise<any> {
  const b = bounds(dto),
    period = { startDate: day(b.start), endDate: day(b.end) };
  if (dto.reportType === 'ENROLLMENT_STATISTICS') {
    const years = await tx.academicYear.findMany({
      where: {
        tenantId,
        ...(dto.academicYearId ? { id: dto.academicYearId } : {}),
        startDate: { lt: b.exclusive },
        endDate: { gte: b.start },
      },
    });
    if (!years.length)
      throw new BadRequestException('Choose an academic year overlapping this reporting period');
    const enrollments = limit(
      await tx.enrollment.findMany({
        where: {
          tenantId,
          academicYearId: { in: years.map((y) => y.id) },
          enrollmentDate: { lt: b.exclusive },
          student: { tenantId, deletedAt: null },
        },
        include: {
          student: { include: { guardianLinks: { include: { guardian: true } } } },
          class: true,
        },
        orderBy: [{ enrollmentDate: 'desc' }, { id: 'desc' }],
        take: 50001,
      })
    );
    const unique = [
      ...new Map(
        enrollments
          .slice()
          .reverse()
          .map((e) => [e.studentId, e])
      ).values(),
    ];
    const rows = unique.map((e) => {
      const s = e.student,
        guardians = s.guardianLinks.map((link) => ({
          name: fullName(link.guardian),
          relationship: link.relationship,
        }));
      return {
        id: s.id,
        admissionNumber: s.admissionNumber,
        name: fullName(s),
        dateOfBirth: day(s.dateOfBirth),
        gender: s.gender,
        className: e.class.name,
        academicYearId: e.academicYearId,
        enrolledOn: day(e.enrollmentDate),
        penNumber: s.penNumber || '',
        apaarId: s.apaarId || '',
        aadhaarLast4: s.aadhaarLast4 || '',
        birthCertNumber: s.birthCertNumber || '',
        fatherName: guardians.find((g) => g.relationship === 'FATHER')?.name || '',
        motherName: guardians.find((g) => g.relationship === 'MOTHER')?.name || '',
      };
    });
    return {
      period,
      summary: {
        totalStudents: rows.length,
        maleStudents: rows.filter((s) => s.gender === 'MALE').length,
        femaleStudents: rows.filter((s) => s.gender === 'FEMALE').length,
      },
      byClass: countBy(rows, 'className'),
      byGender: countBy(rows, 'gender'),
      rows,
      source:
        'Saved academic-year enrollment membership up to period end. Demographic fields reflect the profile at generation time.',
      generatedAt: new Date(),
    };
  }
  if (dto.reportType === 'ATTENDANCE_SUMMARY') {
    const cal = await calendar(tx, tenantId, b.start, b.end);
    const records = limit(
      await tx.attendanceRecord.findMany({
        where: { tenantId, date: { gte: b.start, lt: b.exclusive } },
        include: { student: true, class: true },
        orderBy: [{ date: 'asc' }, { id: 'asc' }],
        take: 50001,
      })
    );
    const rows = records.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      admissionNumber: r.student.admissionNumber,
      name: fullName(r.student),
      date: day(r.date),
      period: r.period,
      status: r.status,
      className: r.class?.name || '',
      schoolDay: cal.dates.includes(day(r.date)),
    }));
    const byStatus = countBy(rows, 'status'),
      present = (byStatus.PRESENT || 0) + (byStatus.LATE || 0) + (byStatus.HALF_DAY || 0) * 0.5;
    return {
      period: { ...period, totalDays: cal.dates.length, calendarBasis: cal.basis },
      summary: {
        totalRecords: rows.length,
        presentCount: byStatus.PRESENT || 0,
        absentCount: byStatus.ABSENT || 0,
        lateCount: byStatus.LATE || 0,
        attendanceRate: rows.length ? round((present / rows.length) * 100) : 0,
      },
      byStatus,
      rows,
      generatedAt: new Date(),
    };
  }
  if (dto.reportType === 'TEACHER_DATA_REPORT') {
    const teachers = limit(
      await tx.staff.findMany({
        where: {
          tenantId,
          isTeacher: true,
          hireDate: { lt: b.exclusive },
          OR: [{ terminationDate: null }, { terminationDate: { gte: b.start } }],
        },
        orderBy: { staffNumber: 'asc' },
        take: 50001,
      })
    );
    const codes = await tx.udiseStaffRecord.findMany({
      where: { tenantId, staffId: { in: teachers.map((t) => t.id) } },
    });
    const rows = teachers.map((t) => ({
      id: t.id,
      staffNumber: t.staffNumber,
      name: fullName(t),
      gender: t.gender,
      email: t.email,
      phone: t.phone,
      department: t.department,
      employmentType: t.employmentType,
      hireDate: day(t.hireDate),
      teacherCode: codes.find((c) => c.staffId === t.id)?.teacherCode || '',
    }));
    return {
      period,
      summary: {
        totalTeachers: rows.length,
        registeredWithUdise: rows.filter((t) => t.teacherCode).length,
      },
      rows,
      generatedAt: new Date(),
    };
  }
  if (dto.reportType === 'EXAMINATION_ANALYSIS') {
    const term = await tx.term.findFirst({ where: { tenantId, id: dto.termId } });
    if (!term || term.startDate >= b.exclusive || term.endDate < b.start)
      throw new BadRequestException('Choose a school term overlapping the reporting period');
    const grades = limit(
      await tx.grade.findMany({
        where: { tenantId, examination: { tenantId, termId: term.id } },
        include: { student: true, subject: true, examination: { include: { subjects: true } } },
        orderBy: { id: 'asc' },
        take: 50001,
      })
    );
    const rows = grades.map((g) => {
      const config = g.examination.subjects.find((s) => s.subjectId === g.subjectId),
        possible = config?.totalMarks || g.totalMarks,
        marks = g.marks ?? g.score;
      return {
        id: g.id,
        studentId: g.studentId,
        admissionNumber: g.student.admissionNumber,
        name: fullName(g.student),
        examName: g.examination.name,
        subject: g.subject.name,
        subjectCode: g.subject.code,
        marks,
        totalMarks: possible,
        percentage: possible > 0 ? round((marks / possible) * 100) : 0,
        passed: marks >= (config?.passMark ?? possible * 0.33),
        published: g.examination.isPublished,
      };
    });
    return {
      period,
      term: { id: term.id, name: term.name },
      summary: {
        totalGradesRecorded: rows.length,
        averagePercentage: rows.length
          ? round(rows.reduce((s, r) => s + r.percentage, 0) / rows.length)
          : 0,
        passingRate: rows.length
          ? round((rows.filter((g) => g.passed).length / rows.length) * 100)
          : 0,
      },
      rows,
      generatedAt: new Date(),
    };
  }
  const invoices = limit(
    await tx.invoice.findMany({
      where: {
        tenantId,
        status: { notIn: ['CANCELLED', 'DRAFT'] },
        createdAt: { gte: b.start, lt: b.exclusive },
      },
      orderBy: { id: 'asc' },
      take: 50001,
    })
  );
  const payments = limit(
    await tx.payment.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        paymentDate: { gte: b.start, lt: b.exclusive },
        invoice: { tenantId, status: { not: 'CANCELLED' } },
      },
      orderBy: { id: 'asc' },
      take: 50001,
    })
  );
  const totals = await tx.payment.groupBy({
    by: ['invoiceId'],
    where: {
      tenantId,
      status: 'COMPLETED',
      paymentDate: { lt: b.exclusive },
      invoiceId: { in: invoices.map((i) => i.id) },
    },
    _sum: { amount: true },
  });
  const paid = new Map(totals.map((p) => [p.invoiceId, p._sum.amount || 0]));
  const rows = invoices.map((i) => ({
    id: i.id,
    invoiceNumber: i.invoiceNumber,
    issuedOn: day(i.createdAt),
    totalAmount: i.totalAmount,
    collectedByPeriodEnd: paid.get(i.id) || 0,
    outstandingAtPeriodEnd: Math.max(0, i.totalAmount - (paid.get(i.id) || 0)),
  }));
  return {
    period,
    currencyUnit: 'minor units (paise)',
    basis:
      'Invoices issued in the period; outstanding uses completed payments up to period end. Period receipts include older invoices. Cancelled invoices excluded by current status.',
    summary: {
      totalInvoices: rows.length,
      totalExpectedRevenue: rows.reduce((s, r) => s + r.totalAmount, 0),
      totalCollectedRevenue: payments.reduce((s, p) => s + p.amount, 0),
      totalOutstanding: rows.reduce((s, r) => s + r.outstandingAtPeriodEnd, 0),
    },
    rows,
    payments: payments.map((p) => ({
      id: p.id,
      invoiceId: p.invoiceId,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate,
      reference: p.reference,
    })),
    generatedAt: new Date(),
  };
}
