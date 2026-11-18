import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3136';
const output = 'qa/compliance';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [],
  errors = [],
  writes = [],
  reports = [],
  checklists = [],
  alerts = [],
  audits = [],
  boardRecords = [],
  ledger = [];
let actor = 'maker',
  role = 'SCHOOL_ADMIN',
  serial = 0;
const options = {
  reportTypes: [
    'ENROLLMENT_STATISTICS',
    'ATTENDANCE_SUMMARY',
    'TEACHER_DATA_REPORT',
    'EXAMINATION_ANALYSIS',
    'FINANCIAL_SUMMARY',
  ],
  templates: ['SCHOOL_REPORT', 'UDISE_PLUS_SDMIS', 'TEACHER_MANDATORY_DISCLOSURE'],
  years: [{ id: 'year', name: '2026' }],
  terms: [{ id: 'term', name: 'Term 1' }],
  students: [{ id: 'student-1', firstName: 'Anu', lastName: 'Nair', admissionNumber: 'ADM-1' }],
  formatNotice: 'Preparation files require review against the official portal template.',
};
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  serviceWorkers: 'block',
});
await context.addInitScript(() => localStorage.setItem('accessToken', 'fixture-only'));
await context.route('**/api/**', async (route) => {
  const req = route.request(),
    path = new URL(req.url()).pathname.replace(/^\/api\/v1/, ''),
    method = req.method();
  const ok = (data) => route.fulfill({ json: { success: true, data } });
  if (path === '/auth/me')
    return ok({
      id: actor,
      userId: actor,
      role,
      tenantId: 'school-a',
      firstName: 'Test',
      lastName: actor,
    });
  if (path === '/preschool/navigation') return ok({ programme: 'STANDARD' });
  if (path === '/push/config') return ok({ enabled: false });
  if (!path.startsWith('/government/compliance')) return ok([]);
  const sub = path.slice('/government/compliance'.length),
    body = method === 'POST' ? req.postDataJSON() : null;
  if (body) writes.push({ path: sub, body, actor });
  if (sub === '/options') return ok(options);
  if (sub === '/dashboard')
    return ok({
      reports: { total: reports.length },
      alerts: { ACTIVE: alerts.filter((a) => a.status === 'ACTIVE').length },
    });
  if (sub === '/reports' && method === 'GET') return ok(reports);
  if (sub === '/checklists' && method === 'GET') return ok(checklists);
  if (sub === '/alerts' && method === 'GET') return ok(alerts);
  if (sub === '/audits' && method === 'GET') return ok(audits);
  if (sub === '/audit-trail' && method === 'GET') return ok(ledger);
  if (sub === '/board-records' && method === 'GET') return ok(boardRecords);
  if (sub === '/board-records' && method === 'POST') {
    const row = { id: 'board-' + ++serial, payload: body, createdAt: new Date().toISOString() };
    boardRecords.push(row);
    return ok(row);
  }
  if (sub === '/reports/generate') {
    const row = {
      id: 'report-' + ++serial,
      ...body,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      reportData: {
        summary: { totalStudents: 1 },
        rows: [{ id: 'student-1', name: 'Anu Nair', penNumber: 'PEN-1' }],
      },
      metadata: { request: body },
      exports: [],
      history: [],
    };
    reports.unshift(row);
    return ok(row);
  }
  const report = reports.find((r) => r.id === body?.reportId);
  if (sub === '/reports/action') {
    report.status = {
      REQUEST_REVIEW: 'PENDING_APPROVAL',
      APPROVE: 'APPROVED',
      REJECT: 'REJECTED',
      REOPEN: 'DRAFT',
    }[body.action];
    if (body.action === 'REQUEST_REVIEW') report.metadata.reviewRequestedBy = actor;
    if (body.action === 'APPROVE') report.approvedAt = new Date(Date.now() - 1000).toISOString();
    return ok(report);
  }
  if (sub.endsWith('/validation'))
    return ok({
      ready: true,
      errors: 0,
      warnings: 1,
      recordCount: 1,
      notice: options.formatNotice,
      issues: [{ severity: 'WARNING', message: 'Review the current official portal template' }],
    });
  if (sub === '/portal-export') {
    const file = {
      id: 'export-' + ++serial,
      filename: 'reviewed-school-report.' + body.format,
      format: body.format,
      templateId: body.templateId,
      contentHash: 'a'.repeat(64),
      createdAt: new Date().toISOString(),
      validation: {
        ready: true,
        errors: 0,
        warnings: 0,
        recordCount: 1,
        notice: options.formatNotice,
        issues: [],
      },
    };
    report.exports.unshift(file);
    return ok(file);
  }
  if (sub.startsWith('/downloads/'))
    return route.fulfill({ body: 'name,penNumber\nAnu Nair,PEN-1', contentType: 'text/csv' });
  if (sub === '/reports/manual-submission') {
    report.status = 'SUBMITTED';
    report.metadata.manualSubmission = { ...body, contentHash: 'a'.repeat(64) };
    return ok(report);
  }
  if (sub === '/reports/outcome') {
    report.status = body.status;
    return ok(report);
  }
  if (sub === '/checklists' && method === 'POST') {
    const row = { id: 'check-' + ++serial, ...body, status: 'PENDING' };
    checklists.push(row);
    return ok(row);
  }
  if (sub === '/checklists/complete') {
    const row = checklists.find((c) => c.id === body.checklistId);
    row.status = 'COMPLETED';
    return ok(row);
  }
  if (sub === '/audits/run') {
    const row = {
      id: 'audit-' + ++serial,
      auditType: body.auditType,
      status: 'REQUIRES_ACTION',
      overallScore: 80,
      issuesFound: 1,
      createdAt: new Date().toISOString(),
      issues: {
        method: 'Measured checks',
        issues: [{ message: 'Add a verified teacher code', entityId: 'staff-1' }],
      },
    };
    audits.push(row);
    return ok(row);
  }
  if (sub.includes('/recheck')) return ok({ remainingIssues: 0 });
  if (sub === '/deadlines/check') {
    if (!alerts.length)
      alerts.push({
        id: 'alert-1',
        title: 'Annual return due',
        status: 'ACTIVE',
        message: 'Review the return before the deadline.',
      });
    return ok({ created: 1 });
  }
  if (sub === '/alerts/acknowledge') {
    alerts[0].status = 'ACKNOWLEDGED';
    return ok(alerts[0]);
  }
  if (sub === '/alerts/resolve') {
    alerts[0].status = 'RESOLVED';
    alerts[0].resolutionNotes = body.resolutionNotes;
    return ok(alerts[0]);
  }
  if (sub === '/audit-trail/verify')
    return ok({ isValid: true, totalBlocksVerified: 7, scope: 'Persisted application evidence' });
  if (sub === '/audit-trail/override') return ok({ auditId: 'correction-1' });
  if (sub.startsWith('/reports/')) return ok(reports.find((r) => r.id === sub.split('/')[2]));
  return route.fulfill({ status: 404, json: { message: 'Unexpected fixture request ' + path } });
});
const page = await context.newPage();
page.on('pageerror', (err) => errors.push(err.message));
try {
  await page.goto(base + '/school/compliance', { timeout: 120000 });
  await page.getByRole('heading', { name: 'Government reporting', exact: true }).waitFor();
  await page.getByLabel('Reporting period', { exact: true }).fill('Annual 2026');
  await page.getByLabel('First day', { exact: true }).fill('2026-01-01');
  await page.getByLabel('Last day', { exact: true }).fill('2026-11-18');
  await page.getByRole('button', { name: 'Generate saved report' }).click();
  await page.getByRole('heading', { name: 'Review: Annual 2026' }).waitFor();
  assert.equal(writes[0].body.reportYear, 2026);
  checks.push('Management route generates a saved report with explicit period boundaries');
  await page.getByRole('button', { name: 'Request review', exact: true }).click();
  await page.getByText('A different school manager must approve the report.').waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Approve report', exact: true }).isDisabled(),
    true
  );
  actor = 'reviewer';
  role = 'PRINCIPAL';
  await page.reload();
  await page.getByRole('button', { name: 'Review Annual 2026', exact: true }).click();
  await page.getByRole('button', { name: 'Approve report', exact: true }).click();
  await page.getByRole('heading', { name: 'Record a manual portal submission' }).waitFor();
  checks.push('Review requires another manager and exposes submission only after approval');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  const downloaded = await downloadEvent;
  assert.ok(downloaded.suggestedFilename().endsWith('.csv'));
  await page.getByRole('button', { name: 'Validate records', exact: true }).click();
  await page.getByText('0 errors · 1 warnings · 1 records').waitFor();
  await page.getByLabel('Government portal', { exact: true }).fill('UDISE portal');
  await page.getByLabel('Portal receipt reference').fill('PORTAL-2026-1');
  await page.getByLabel('Submission time', { exact: true }).fill('2026-11-18T10:00');
  await page
    .getByLabel('I reviewed the current official portal format and uploaded this approved export.')
    .check();
  await page.getByRole('button', { name: 'Record portal receipt', exact: true }).click();
  await page.getByLabel('Portal outcome', { exact: true }).waitFor();
  checks.push('Browser downloads a saved export and records the manual portal receipt');
  await page
    .getByLabel('Review or portal response notes')
    .fill('Portal requested corrected identifiers');
  await page.getByLabel('Portal outcome', { exact: true }).selectOption('REJECTED');
  await page.getByRole('button', { name: 'Record portal outcome', exact: true }).click();
  await page.getByRole('button', { name: 'Prepare corrected replacement', exact: true }).click();
  await page.getByRole('button', { name: 'Generate saved report', exact: true }).click();
  await page.getByRole('heading', { name: 'Review: Annual 2026 corrected' }).waitFor();
  assert.equal(reports.find((r) => r.id === 'report-1').status, 'REJECTED');
  assert.equal(reports[0].replacesReportId, 'report-1');
  checks.push('Rejected submissions preserve evidence and create a linked replacement');
  await page.getByRole('button', { name: 'Board records', exact: true }).click();
  await page.getByLabel('School student', { exact: true }).selectOption('student-1');
  await page.getByLabel('Official candidate number').fill('000123');
  await page.getByLabel('Official document or portal reference').fill('LOC-123');
  await page.getByLabel('Document verification notes').fill('Verified portal receipt');
  await page.getByRole('button', { name: 'Save official document record', exact: true }).click();
  await page.getByRole('button', { name: 'Correct this entry', exact: true }).waitFor();
  assert.equal(boardRecords[0].payload.candidateNumber, '000123');
  checks.push(
    'Manual board registration documents preserve official identifiers without pretending to sync'
  );
  await page.getByRole('button', { name: 'Checklists', exact: true }).click();
  await page.getByLabel('Checklist title').fill('Annual board return');
  await page.getByLabel('Required by', { exact: true }).fill('School board');
  await page.getByLabel('Due date', { exact: true }).fill('2026-11-20');
  await page.getByRole('button', { name: 'Save checklist item', exact: true }).click();
  await page.getByLabel('Completion notes').fill('Reviewed and filed');
  await page.getByLabel('Evidence reference').fill('DOC-123');
  await page.getByRole('button', { name: 'Complete checklist item', exact: true }).click();
  await page.getByText('completed', { exact: true }).waitFor();
  checks.push('Checklist creation and evidenced completion work');
  await page.getByRole('button', { name: 'Audits', exact: true }).click();
  await page.getByRole('button', { name: 'Run data audit', exact: true }).click();
  await page.getByText('Inspect audit findings', { exact: true }).click();
  await page.getByText('Add a verified teacher code · staff-1', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Recheck corrected records', exact: true }).click();
  checks.push('Audits expose saved findings and support rechecking corrected records');
  await page.getByRole('button', { name: /^Alerts/ }).click();
  await page.getByRole('button', { name: 'Check deadlines now', exact: true }).click();
  await page.getByRole('button', { name: 'Acknowledge alert', exact: true }).click();
  await page.getByLabel('Resolution notes').fill('Return completed');
  await page.getByRole('button', { name: 'Resolve alert', exact: true }).click();
  await page.getByText('resolved', { exact: true }).waitFor();
  checks.push('Deadline alerts remain visible through acknowledgment and resolution');
  await page.getByRole('button', { name: 'Evidence', exact: true }).click();
  await page.getByRole('button', { name: 'Verify saved evidence', exact: true }).click();
  await page.getByText('Evidence chain verified · 7 records').waitFor();
  await page.getByLabel('Source record ID').fill('student-1');
  await page.getByLabel('Corrected value').fill('PEN-UPDATED');
  await page.getByLabel('Reason for correction').fill('Verified original document');
  await page.getByRole('button', { name: 'Save justified correction', exact: true }).click();
  await page
    .getByText('Correction saved with evidence. Generate a new report to use it.', { exact: true })
    .waitFor();
  assert.ok(writes.some((w) => w.path === '/audit-trail/override' && w.body.reason));
  checks.push('Evidence verification and justified corrections are accessible');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: output + '/mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Reports', exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: output + '/reports-mobile.png', fullPage: true });
  checks.push('Reporting and correction forms fit a mobile viewport');
  actor = 'parent';
  role = 'PARENT';
  const before = writes.length;
  await page.reload();
  await page.waitForURL('**/dashboard');
  assert.equal(writes.length, before);
  assert.equal(
    await page.getByRole('button', { name: 'Generate saved report', exact: true }).count(),
    0
  );
  checks.push('Parents cannot open the management reporting workspace');
  assert.deepEqual(errors, []);
  await writeFile(
    output + '/ui-results.json',
    JSON.stringify(
      { scope: 'Browser workflow with isolated API fixtures', checks, errors },
      null,
      2
    )
  );
  console.log(`${checks.length} compliance browser checks passed`);
} finally {
  await browser.close();
}
