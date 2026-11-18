// Read-only service probes with a fake database; no network or stored-record writes.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const filename = path.join(root, 'apps/api/src/modules/government/services/compliance.service.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
}).outputText;
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
loaded._compile(compiled, filename);
const { ComplianceService } = loaded.exports;
const observed = {};
const db = {
  student: { findMany: async args => { observed.studentQuery = args; return []; } },
  invoice: { findMany: async args => { observed.invoiceQuery = args; return [{ totalAmount: 1000, paidAmount: 0, balanceAmount: 1000, status: 'CANCELLED', payments: [] }]; } },
  attendanceRecord: { findMany: async args => { observed.attendanceQuery = args; return []; } },
  complianceReport: {
    create: async ({data}) => ({id: 'probe', ...data}),
    update: async args => { observed.approval = args; return args.data; },
  },
};
(async () => {
  const service = new ComplianceService(db);
  const enrollment = await service.generateEnrollmentReport('school-a', '2020', 2020);
  assert.deepEqual(observed.studentQuery.where, {tenantId: 'school-a'});
  const financial = await service.generateFinancialReport('school-a', 'January 2020', 2020, 1);
  assert.deepEqual(observed.invoiceQuery.where, {tenantId: 'school-a'});
  assert.equal(financial.reportData.summary.totalOutstanding, 1000);
  const reversed = await service.generateAttendanceReport('school-a', 'reversed', 2026, new Date('2026-11-18'), new Date('2026-11-01'));
  assert.ok(reversed.reportData.period.totalDays < 0);
  const emptyAudit = await service.auditStudentData('school-a');
  assert.equal(emptyAudit.accuracy, 95);
  assert.equal(emptyAudit.consistency, 90);
  assert.ok(emptyAudit.overallScore > 0);
  await service.approveReport('probe', 'reviewer');
  assert.equal(observed.approval.data.status, 'APPROVED');
  await assert.rejects(service.submitReport('probe', 'reviewer'), error => error.status === 501);
  console.log(JSON.stringify({
    scope: 'Isolated ComplianceService probes with fake database; not live HTTP/E2E',
    confirmed: [
      'Enrollment query ignores requested reporting year/quarter',
      'Financial query ignores requested year/month',
      'Cancelled invoice contributes to financial outstanding',
      'Reversed attendance date range is accepted and produces negative school days',
      'Empty student audit reports fixed accuracy=95 and consistency=90',
      'Approval updates without checking previous status',
      'Direct submission returns HTTP 501',
    ],
    sample: {enrollmentYear: enrollment.reportYear, financialOutstanding: financial.reportData.summary.totalOutstanding, reversedSchoolDays: reversed.reportData.period.totalDays, emptyAuditScore: emptyAudit.overallScore},
  }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
