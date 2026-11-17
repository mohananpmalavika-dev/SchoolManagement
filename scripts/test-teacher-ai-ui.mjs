import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3102';
const output = new URL('../qa/teacher-ai/', import.meta.url); await mkdir(output, { recursive: true });
const checks = [], errors = [], requests = [];
let configured = true, failSecondBatch = true, saved = null;
const options = () => ({ classes: [{ id: 'class-1', name: 'Grade 5' }], terms: [{ id: 'term-1', name: 'Term 1', isCurrent: true }], status: { configured, provider: 'OpenAI', model: 'test-model', message: configured ? 'AI is configured. Review every draft.' : 'An administrator must configure AI teaching tools.' } });
const students = Array.from({ length: 11 }, (_, i) => ({ id: `student-${i}`, name: `Learner ${i + 1}`, admissionNumber: `A${i + 1}`, average: i ? 68 : 0, attendanceRate: 90, attendanceDays: 30,
  reportCard: { id: `card-${i}`, status: i === 1 ? 'PUBLISHED' : 'DRAFT', updatedAt: '2026-01-20T00:00:00.000Z', comment: null } }));
const paper = { title: 'Fractions practice', instructions: 'Answer all ten questions.', warnings: [], model: 'test-model', generatedAt: '2026-10-11T12:00:00Z',
  questions: Array.from({ length: 10 }, (_, i) => ({ type: 'MCQ', question: `Which fraction is represented in example ${i + 1}?`, options: ['One half', 'One third', 'One fourth', 'One fifth'], answer: 'One half', explanation: 'EXPLANATION-FOR-TEACHERS-ONLY', marks: 1 })) };
const risk = (level = 'LOW') => ({ score: 20, level, basis: 'EARLY_WARNING', evidence: ['Examination trend declined.'], actions: ['Review learning support.'] });
const riskStudents = [0, 1].map(i => ({ studentId: `risk-${i}`, name: `Review learner ${i + 1}`, admissionNumber: `R${i}`, classId: 'class-1', className: 'Grade 5', overall: i ? 'HIGH' : 'LOW', priorityScore: 20,
  academic: risk(i ? 'HIGH' : 'LOW'), dropout: risk(), feeDefault: risk(), metrics: { latestAverage: 65, projectedAverage: 45, attendanceRate: 95, attendanceDays: 30, outstandingBalance: 0, overdueBalance: 0 } }));
const report = { students: riskStudents, summary: { incompleteData: 0 } };

async function contextFor(role) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('accessToken', 'ui-test-token'));
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '/api');
    const body = route.request().postDataJSON(); requests.push({ path, body });
    const ok = data => route.fulfill({ json: { success: true, data } });
    if (path === '/api/auth/me') return ok({ id: 'user-1', firstName: 'School', lastName: 'Teacher', role, tenantId: 'tenant-1', email: 'teacher@example.test' });
    if (path === '/api/teacher-ai/options') return ok(options());
    if (path === '/api/teacher-ai/roster') return ok({ classId: 'class-1', termId: 'term-1', students });
    if (path === '/api/teacher-ai/remarks') {
      if (body.students.length === 1 && failSecondBatch) return route.fulfill({ status: 503, json: { error: { message: 'AI provider is temporarily busy.' } } });
      return ok({ remarks: body.students.map(s => ({ studentId: s.studentId, text: `This learner is building skills through regular practice. Keep practising with guided examples.`, evidence: ['Saved marks and attendance were reviewed.'] })), model: 'test-model', generatedAt: '2026-10-11T12:00:00Z' });
    }
    if (path === '/api/teacher-ai/remarks/save') { saved = body; return ok({ updatedAt: '2026-10-11T12:00:00Z', comment: body.remark }); }
    if (path === '/api/teacher-ai/report-cards') return ok({ total: 11, generated: 0, skipped: 11, errors: [] });
    if (path === '/api/teacher-ai/quiz') return ok(paper);
    if (path === '/api/predictive-analytics'||path==='/api/teacher-ai/at-risk') return ok(report);
    if (path === '/api/teacher-ai/risk-review') return ok({ students: body.studentIds.map(studentId => ({ studentId, priority: 'MODERATE', reasons: ['Two examination results show falling marks.'], supportPlan: ['Arrange a supportive teacher check-in.'] })), model: 'test-model', generatedAt: '2026-10-11T12:00:00Z' });
    if (path === '/api/workspace/overview') return ok({ students: 11, staff: 3, balance: 0, attendanceTotal: 11, attendanceRate: 90, weekly: [], activities: [], events: [] });
    return ok({});
  });
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  return { context, page };
}
try {
  const { context, page } = await contextFor('TEACHER');
  await page.goto(`${base}/teacher/ai-studio`, { timeout: 120000 });
  await page.getByRole('heading', { name: 'AI Teaching & Academic Studio', exact: true }).waitFor();
  assert.equal(await page.getByRole('link',{name:'Ask ERP Copilot',exact:true}).getAttribute('href'),'/teacher/copilot');
  await page.getByRole('button',{name:'1-Click Report Card Remarks',exact:true}).click();
  await page.getByText('1–8 of 11 students').waitFor();
  assert.ok(await page.getByText('Term average: 0%', { exact: false }).count()); checks.push('Teacher workspace loads real zero marks and paginated roster');
  await page.getByLabel('Language',{exact:true}).selectOption('Malayalam');
  await page.getByRole('button',{name:/Growth Mindset/}).click();
  await page.getByLabel('Behaviour observation for Learner 1', { exact: true }).fill('Contributes to group work.');
  await page.getByRole('button', { name: '1-Click Generate Selected Remarks (11)' }).click();
  await page.getByRole('alert').filter({ hasText: 'AI provider is temporarily busy.' }).waitFor();
  assert.ok((await page.getByLabel('Remark for Learner 1', { exact: true }).inputValue()).includes('building skills'));
  const firstRequest = requests.find(r => r.path === '/api/teacher-ai/remarks');
  assert.equal(firstRequest.body.language, 'Malayalam'); assert.equal(firstRequest.body.students[0].behaviourObservation, 'Contributes to group work.');
  assert.equal(firstRequest.body.tone,'GROWTH_MINDSET');
  assert.equal(firstRequest.body.students.length, 10);
  await page.getByRole('button', { name: '1-Click Generate Selected Remarks (1)', exact: true }).waitFor(); checks.push('Bulk remarks use batches of ten and preserve completed drafts on provider failure');
  failSecondBatch = false;
  await page.getByRole('button', { name: '1-Click Generate Selected Remarks (1)', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '1 personalized' }).waitFor();
  assert.equal(requests.filter(r => r.path === '/api/teacher-ai/remarks').length, 3); checks.push('Retry generates only the remaining student');
  await page.getByLabel('Remark for Learner 1', { exact: true }).fill('Reviewed by the teacher: the learner is improving through guided practice.');
  await page.locator('.ai-remark').filter({ has: page.getByLabel('Remark for Learner 1', { exact: true }) }).getByRole('button', { name: 'Approve & Save Remark' }).click();
  await page.getByRole('status').filter({ hasText: "Reviewed remark saved to Learner 1's official report card." }).waitFor();
  assert.equal(saved.remark, 'Reviewed by the teacher: the learner is improving through guided practice.');
  assert.equal(saved.expectedUpdatedAt, '2026-01-20T00:00:00.000Z');
  assert.equal(await page.locator('.ai-remark').filter({ has: page.getByLabel('Remark for Learner 2', { exact: true }) }).getByRole('button', { name: 'Approve & Save Remark' }).isDisabled(), true); checks.push('Edited remarks save with report version; published reports stay locked');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: fileURLToPath(new URL('remarks-desktop.png', output)), fullPage: false });
  const remarksDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export Drafts CSV' }).click();
  const csv = await readFile(await (await remarksDownload).path(), 'utf8'); assert.equal(csv.split('\r\n').length, 12); checks.push('All eleven drafts export across roster pages');
  await page.getByRole('button', { name: 'Prepare Draft Report Cards' }).click();
  await page.getByRole('status').filter({ hasText: '0 draft report cards prepared; 11 preserved; 0 skipped.' }).waitFor(); checks.push('Report preparation displays actual created, preserved and failed counts');
  await page.getByRole('button', { name: 'Quiz & Worksheet Maker (PDF)' }).click();
  await page.getByLabel('Subject', { exact: true }).fill('Mathematics'); await page.getByLabel('Chapter or topic').fill('Fractions');
  await page.getByLabel('Chapter or syllabus content').fill('A fraction represents an equal part of a whole. One half is one of two equal parts. One third is one of three equal parts. One fourth is one of four equal parts.');
  await page.getByRole('button', { name: 'Generate 10 Objective Questions' }).click();
  await page.getByRole('heading', { name: 'Fractions practice' }).waitFor();
  assert.equal(await page.locator('.ai-question').count(), 10);
  await page.getByLabel('Show Teacher Answer Key & Explanations').check(); assert.equal(await page.getByText('EXPLANATION-FOR-TEACHERS-ONLY', { exact: true }).count(), 10); checks.push('Quiz creates ten questions with a reviewable answer key');
  const studentDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download Text' }).click();
  const studentText = await readFile(await (await studentDownload).path(), 'utf8');
  assert.ok(studentText.includes('example 10')); assert.ok(!studentText.includes('EXPLANATION-FOR-TEACHERS-ONLY')); assert.ok(!studentText.includes('TEACHER ANSWER KEY'));
  const keyPopup = page.waitForEvent('popup'); await page.getByRole('button', { name: 'Print / Save PDF Teacher Key' }).click();
  const keyPage=await keyPopup;await keyPage.waitForLoadState();const keyText=await keyPage.locator('body').innerText();assert.ok(keyText.includes('EXPLANATION-FOR-TEACHERS-ONLY'));await keyPage.close();
  await page.emulateMedia({ media: 'print' }); assert.ok(!(await page.locator('body').innerText()).includes('EXPLANATION-FOR-TEACHERS-ONLY')); assert.ok((await page.locator('body').innerText()).includes('example 10')); await page.emulateMedia({ media: 'screen' }); checks.push('Student download and print exclude answers even while the teacher key is visible');
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForFunction(() => document.querySelector('.sidebar').getBoundingClientRect().right <= 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.getByRole('heading', { name: 'Fractions practice' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: fileURLToPath(new URL('quiz-mobile.png', output)), fullPage: false }); checks.push('Mobile quiz layout fits without horizontal page overflow');
  await context.close();

  configured = false;
  const disabled = await contextFor('TEACHER'); await disabled.page.goto(`${base}/teacher/ai-studio`, { timeout: 120000 });
  await disabled.page.getByRole('button',{name:'1-Click Report Card Remarks',exact:true}).click();
  await disabled.page.getByRole('button', { name: '1-Click Generate Selected Remarks (11)' }).waitFor();
  assert.equal(await disabled.page.getByRole('button', { name: '1-Click Generate Selected Remarks (11)' }).isDisabled(), true); checks.push('Unconfigured server disables AI generation with a clear setup message'); await disabled.context.close();
  configured = true;
  const principal = await contextFor('PRINCIPAL'); await principal.page.goto(`${base}/school/dashboard`, { timeout: 120000 });
  await principal.page.getByRole('heading', { name: 'Student support insights', exact: true }).waitFor();
  await principal.page.getByText('2 students flagged for support', { exact: true }).waitFor();
  await principal.page.getByRole('button', { name: 'AI Support Review' }).click();
  await principal.page.getByText('Arrange a supportive teacher check-in.', { exact: true }).first().waitFor();
  assert.deepEqual(requests.find(r => r.path === '/api/teacher-ai/risk-review').body.studentIds, ['risk-0', 'risk-1']); checks.push('Principal dashboard highlights falling-mark signals and generates AI support actions');
  await principal.page.screenshot({ path: fileURLToPath(new URL('principal-desktop.png', output)), fullPage: true }); await principal.context.close();
  assert.deepEqual(errors, []); checks.push('No browser runtime errors');
  await writeFile(new URL('results.json', output), JSON.stringify({ passed: checks, fixture: 'Mock API and provider outputs; no live student data or provider requests', errors }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally { await browser.close(); }
