import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3123';
const output = new URL('../qa/academic-rollover/', import.meta.url);
await mkdir(output, { recursive: true });
const [source, target, campus, classA, classB, classC, streamB, studentA, studentB, studentC] = Array.from({length: 10}, randomUUID);
const students = [
  {id: studentA, firstName: 'Anu', lastName: 'Nair', admissionNumber: 'ADM-001', currentClassId: classA, currentStreamId: null},
  {id: studentB, firstName: 'Manu', lastName: 'Das', admissionNumber: 'ADM-002', currentClassId: classA, currentStreamId: null},
  {id: studentC, firstName: 'Riya', lastName: 'John', admissionNumber: 'ADM-003', currentClassId: classC, currentStreamId: null},
];
const options = {
  years: [
    {id: source, name: '2025-26', isCurrent: true, startDate: '2025-04-01', endDate: '2026-03-31'},
    {id: target, name: '2026-27', isCurrent: false, startDate: '2026-04-01', endDate: '2027-03-31'},
  ],
  classes: [{id: classA, name: 'Class 1'}, {id: classB, name: 'Class 2'}, {id: classC, name: 'Class 12'}].map(cls => ({...cls, schoolId: campus, school: {name: 'Main campus'}})),
  streams: [{id: streamB, classId: classB, name: 'B', capacity: 2}], students, history: [],
};
const summary = {total: 3, promoted: 1, retained: 1, graduated: 1};
const browser = await chromium.launch({headless: true});
const context = await browser.newContext({viewport: {width: 1440, height: 1000}, serviceWorkers: 'block'});
const errors = [], checks = [], previews = [], completions = [];
let completed = false;
await context.addInitScript(() => localStorage.setItem('accessToken', 'rollover-ui-fixture'));
await context.route('**/api/**', async route => {
  const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '');
  const ok = data => route.fulfill({json: {success: true, data}});
  if (path === '/auth/me') return ok({id: 'principal', tenantId: 'school', role: 'PRINCIPAL', firstName: 'School', lastName: 'Principal'});
  if (path === '/preschool/navigation') return ok({programme: 'STANDARD'});
  if (path === '/academic-rollover/options') return ok(completed ? {
    ...options, years: options.years.map(year => ({...year, isCurrent: year.id === target})),
    students: students.slice(0, 2).map((student, index) => ({...student, currentClassId: index === 0 ? classB : classA})),
    history: [{id: 'completed', sourceYearName: '2025-26', targetYearName: '2026-27', completedAt: '2026-04-01', summary}],
  } : options);
  if (path === '/academic-rollover/preview') {
    const plan = route.request().postDataJSON();previews.push(plan);
    assert.equal(plan.sourceYearId, source);assert.equal(plan.targetYearId, target);
    assert.deepEqual(plan.decisions, [
      {studentId: studentA, action: 'PROMOTE', classId: classB, streamId: streamB},
      {studentId: studentB, action: 'RETAIN', classId: classA},
      {studentId: studentC, action: 'GRADUATE'},
    ]);
    return ok({sourceYear: options.years[0], targetYear: options.years[1], summary, previewToken: String(previews.length).repeat(64),
      rows: plan.decisions.map(decision => {
        const student = students.find(item => item.id === decision.studentId);
        return {...decision, name: student.firstName + ' ' + student.lastName, admissionNumber: student.admissionNumber,
          sourceClassName: options.classes.find(cls => cls.id === student.currentClassId).name,
          targetClassName: options.classes.find(cls => cls.id === decision.classId)?.name || null, targetStreamName: decision.streamId ? 'B' : null};
      })});
  }
  if (path === '/academic-rollover/complete') {
    const request = route.request().postDataJSON();completions.push(request);
    if (completions.length === 1) return route.fulfill({status: 409, json: {message: 'The roster changed after preview. Review a fresh preview before completing.'}});
    assert.equal(request.previewToken, String(previews.length).repeat(64));
    completed = true;return ok({id: 'completed', summary, alreadyCompleted: false});
  }
  return ok([]);
});
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(base + '/school/academics/promotion', {timeout: 120000});
  await page.getByLabel('Target academic year', {exact: true}).selectOption(target);
  await page.locator('#mapping-' + classA + '-class').selectOption(classB);
  await page.locator('#mapping-' + classA + '-stream').selectOption(streamB);
  await page.locator('#mapping-' + classC + '-action').selectOption('GRADUATE');
  await page.getByRole('checkbox', {name: 'Individual exception for ADM-002'}).check();
  await page.locator('#student-' + studentB + '-action').selectOption('RETAIN');
  await page.getByRole('button', {name: 'Preview promotion plan'}).click();
  await page.getByRole('heading', {name: '4. Confirm the reviewed rollover'}).waitFor();
  assert.equal(await page.getByRole('button', {name: 'Complete academic-year rollover'}).isDisabled(), true);
  checks.push('Class mappings include individual retention and graduation decisions in an explicit preview');
  await page.getByRole('heading', {name: '4. Confirm the reviewed rollover'}).scrollIntoViewIfNeeded();
  await page.screenshot({path: new URL('promotion-preview-desktop.png', output).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true});
  await page.setViewportSize({width: 390, height: 844});
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({path: new URL('promotion-preview-mobile.png', output).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true});
  checks.push('Desktop and mobile preview layouts render without horizontal page overflow');
  await page.setViewportSize({width: 1440, height: 1000});
  await page.locator('#mapping-' + classA + '-stream').selectOption('');
  assert.equal(await page.getByRole('heading', {name: '4. Confirm the reviewed rollover'}).count(), 0);
  assert.equal(completions.length, 0);
  await page.locator('#mapping-' + classA + '-stream').selectOption(streamB);
  await page.getByLabel('Search students', {exact: true}).fill('ADM-001');
  await page.getByRole('button', {name: 'Preview promotion plan'}).click();
  await page.getByRole('heading', {name: '4. Confirm the reviewed rollover'}).waitFor();
  checks.push('Changing a mapping invalidates the preview; search never removes students from the rollover');
  await page.getByRole('checkbox', {name: /I reviewed every promotion/}).check();
  await page.getByRole('button', {name: 'Complete academic-year rollover'}).click();
  await page.getByRole('alert').filter({hasText: 'roster changed after preview'}).waitFor();
  assert.equal(await page.getByRole('checkbox', {name: /I reviewed every promotion/}).isChecked(), false);
  assert.equal(completed, false);
  checks.push('A stale preview response keeps the plan reviewable and requires renewed confirmation');
  await page.getByRole('button', {name: 'Preview promotion plan'}).click();
  await page.getByRole('heading', {name: '4. Confirm the reviewed rollover'}).waitFor();
  await page.getByRole('checkbox', {name: /I reviewed every promotion/}).check();
  await page.getByRole('button', {name: 'Complete academic-year rollover'}).click();
  await page.getByRole('status').filter({hasText: 'Academic-year rollover completed.'}).waitFor();
  await page.getByRole('heading', {name: '2025-26 to 2026-27', exact: true}).waitFor();
  assert.equal(await page.getByLabel('Source academic year', {exact: true}).inputValue(), target);
  assert.equal(completions.length, 2);assert.deepEqual(errors, []);
  checks.push('Completion reloads the new current-year roster and displays the completed rollover history');
  await writeFile(new URL('results.json', output), JSON.stringify({passed: checks.length, checks, errors,
    fixture: 'Mock API responses; actual Next.js page and browser interactions. Database behavior is tested separately.'}, null, 2));
  console.log(JSON.stringify({passed: checks.length, checks}, null, 2));
} finally { await browser.close(); }
