import { BadRequestException } from '@nestjs/common';

import { Cell } from '../utils/workbook';

import { Issue, TEMPLATES, day } from './compliance-core';

export function exportRows(report: any, templateId: string) {
  if (!TEMPLATES.includes(templateId))
    throw new BadRequestException('Unknown preparation template');
  const requiredType =
    templateId === 'TEACHER_MANDATORY_DISCLOSURE'
      ? 'TEACHER_DATA_REPORT'
      : templateId === 'EXAM_BOARD_REGISTER'
        ? 'EXAMINATION_ANALYSIS'
        : 'ENROLLMENT_STATISTICS';
  if (templateId !== 'SCHOOL_REPORT' && report.reportType !== requiredType)
    throw new BadRequestException(
      `Choose a ${requiredType.replace(/_/g, ' ').toLowerCase()} report for this template`
    );
  const rows: any[] = report.reportData?.rows || [],
    issues: Issue[] = [];
  const add = (row: any, field: string, message: string, severity: 'ERROR' | 'WARNING' = 'ERROR') =>
    issues.push({ severity, entityId: row.id, field, message });
  if (!rows.length)
    issues.push({
      severity: templateId === 'SCHOOL_REPORT' ? 'WARNING' : 'ERROR',
      field: 'rows',
      message:
        'No records in this snapshot. Verify whether a zero return is intended before submission.',
    });
  for (const row of rows) {
    if (row.name !== undefined && !row.name?.trim()) add(row, 'name', 'Name is required');
    if (
      row.dateOfBirth &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(row.dateOfBirth) || row.dateOfBirth > day(new Date()))
    )
      add(row, 'dateOfBirth', 'Enter a valid past birth date');
    if (row.apaarId && !/^\d{12}$/.test(row.apaarId))
      add(row, 'apaarId', 'APAAR identifier must contain 12 digits');
    if (row.aadhaarLast4 && !/^\d{4}$/.test(row.aadhaarLast4))
      add(row, 'aadhaarLast4', 'Only the final four Aadhaar digits may be exported');
    if (['UDISE_PLUS_SDMIS', 'APAAR_PEN_REGISTRY'].includes(templateId)) {
      if (!row.penNumber) add(row, 'penNumber', 'PEN mapping is missing');
      if (templateId === 'APAAR_PEN_REGISTRY' && !row.apaarId)
        add(row, 'apaarId', 'APAAR mapping is missing');
    }
    if (['CBSE_OASIS_LOC', 'ICSE_COUNCIL_RETURN'].includes(templateId)) {
      if (!row.fatherName || !row.motherName)
        add(row, 'guardianLinks', 'Save father and mother relationships in school records');
      add(
        row,
        'subjectCodes',
        'Complete candidate subjects and remaining fields against the current official portal template',
        'WARNING'
      );
    }
    if (templateId === 'TEACHER_MANDATORY_DISCLOSURE' && !row.teacherCode)
      add(row, 'teacherCode', 'National teacher code is missing');
    if (templateId === 'EXAM_BOARD_REGISTER' && (!row.subjectCode || !row.published))
      add(row, 'subjectCode', 'Use published examinations with saved subject codes');
  }
  const fields: Record<string, string[]> = {
    CBSE_OASIS_LOC: [
      'admissionNumber',
      'name',
      'fatherName',
      'motherName',
      'dateOfBirth',
      'gender',
      'className',
      'aadhaarLast4',
    ],
    ICSE_COUNCIL_RETURN: [
      'admissionNumber',
      'name',
      'dateOfBirth',
      'gender',
      'fatherName',
      'motherName',
      'className',
    ],
    STATE_BOARD_ANNUAL_RETURN: [
      'admissionNumber',
      'name',
      'dateOfBirth',
      'gender',
      'className',
      'penNumber',
    ],
    UDISE_PLUS_SDMIS: [
      'penNumber',
      'admissionNumber',
      'name',
      'dateOfBirth',
      'gender',
      'className',
      'apaarId',
      'aadhaarLast4',
    ],
    APAAR_PEN_REGISTRY: [
      'penNumber',
      'apaarId',
      'admissionNumber',
      'name',
      'dateOfBirth',
      'gender',
    ],
    TEACHER_MANDATORY_DISCLOSURE: [
      'staffNumber',
      'teacherCode',
      'name',
      'gender',
      'email',
      'phone',
      'department',
      'employmentType',
      'hireDate',
    ],
    EXAM_BOARD_REGISTER: [
      'admissionNumber',
      'name',
      'examName',
      'subjectCode',
      'subject',
      'marks',
      'totalMarks',
      'percentage',
      'passed',
    ],
  };
  const columns = fields[templateId] || [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const table: Cell[][] = [
    columns,
    ...rows.map((row) =>
      columns.map((k) =>
        typeof row[k] === 'object' && row[k] !== null ? JSON.stringify(row[k]) : row[k]
      )
    ),
  ];
  // Financial receipts and summary figures must not disappear in spreadsheet exports.
  if (templateId === 'SCHOOL_REPORT') {
    table.push(
      [],
      ['Report reference', report.id],
      ['Reporting period', report.reportPeriod],
      ['First day', report.reportData.period?.startDate || ''],
      ['Last day', report.reportData.period?.endDate || ''],
      ['Money unit', report.reportData.currencyUnit || 'Not applicable'],
      [
        'Calculation basis',
        report.reportData.basis ||
          report.reportData.source ||
          report.reportData.period?.calendarBasis ||
          'Saved school records',
      ]
    );
    table.push(
      [],
      ['Summary key', 'Value'],
      ...Object.entries(report.reportData.summary || {}).map(([key, value]) => [key, String(value)])
    );
    if (report.reportData.payments?.length) {
      const paymentKeys = Object.keys(report.reportData.payments[0]);
      table.push(
        [],
        ['Completed receipts'],
        paymentKeys,
        ...report.reportData.payments.map((p: any) => paymentKeys.map((k) => p[k]))
      );
    }
  }
  const errors = issues.filter((i) => i.severity === 'ERROR').length;
  return {
    table,
    validation: {
      issues,
      errors,
      warnings: issues.filter((i) => i.severity === 'WARNING').length,
      recordCount: rows.length,
      ready: !errors,
      complianceVerified: false,
      notice:
        'School preparation file. Compare and map columns to the current official portal template before upload. Missing full Aadhaar, subject allocations and other unsupported fields are never invented.',
    },
  };
}
