import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.env.UI_BASE_URL || 'http://localhost:3147';
const output = new URL('../qa/master-setup/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
const errors = [], writes = [], checks = [];
let programme = 'STANDARD', failSave = false, failOptions = false;
const records = { schools: [], years: [], terms: [], classes: [], streams: [], subjects: [] };
await context.addInitScript(() => localStorage.setItem('accessToken', 'master-setup-fixture'));
await context.route('**/api/**', async route => {
  const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '');
  const method = route.request().method();
  const ok = data => route.fulfill({ json: { success: true, data } });
  if (path === '/auth/me') return ok({ id: 'principal', tenantId: 'tenant-a', role: 'PRINCIPAL', firstName: 'School', lastName: 'Leader' });
  if (path === '/preschool/navigation') return ok({ programme });
  if (path === '/preschool/options') return ok({ today: '2026-11-20', timezone: 'Asia/Kolkata', schools: records.schools, classes: records.classes.map(row => ({ ...row, school: records.schools.find(school => school.id === row.schoolId) })), staff: [], students: [], assignments: [] });
  const match = path.match(/^\/workspace\/(schools|years|terms|classes|streams|subjects)(?:\/([^/]+))?(?:\/(current))?$/);
  if (match) {
    const [, resource, id, action] = match;
    if (method === 'GET') {
      if (failOptions && resource === 'schools') return route.fulfill({ status: 503, json: { message: 'Choices temporarily unavailable' } });
      return ok(records[resource]);
    }
    const data = route.request().postDataJSON()?.data;
    writes.push({ resource, id, action, data });
    if (failSave) return route.fulfill({ status: 409, json: { message: 'A record with this reference already exists' } });
    if (action) { records[resource].forEach(row => { row.isCurrent = row.id === id; }); return ok({}); }
    const saved = id ? records[resource].find(row => row.id === id) : { id: resource + '-' + (records[resource].length + 1) };
    Object.assign(saved, data);
    if (resource === 'schools') Object.assign(saved, { programme, isActive: true });
    if (!id) records[resource].push(saved);
    return ok({ id: saved.id });
  }
  return ok([]);
});
const page = await context.newPage();
page.setDefaultTimeout(60000);
page.setDefaultNavigationTimeout(120000);
page.on('pageerror', error => errors.push(error.message));
async function open(section, title) {
  await page.goto(base + '/school/academics?section=' + section);
  await page.getByRole('heading', { name: title, exact: true }).waitFor();
}
const modal = page.getByRole('dialog');
const field = label => modal.getByLabel(label, { exact: false });
async function save(label = 'Create record') {
  await modal.getByRole('button', { name: label, exact: true }).click();
  await modal.waitFor({ state: 'hidden' });
}
try {
  await open('classes', 'Classes');
  await page.getByRole('button', { name: 'Add class', exact: true }).click();
  await modal.getByText('Complete these prerequisites before saving:').waitFor();
  assert(await modal.getByRole('button', { name: 'Create record' }).isDisabled());
  await modal.getByRole('link', { name: 'Add a campus' }).click();
  await page.getByRole('heading', { name: 'Campuses', exact: true }).waitFor();
  checks.push('Empty master prerequisites provide a working link and prevent unusable saves');
  await page.getByRole('button', { name: 'Add record', exact: true }).click();
  for (const [label, value] of [['Name', 'Main Campus'], ['Email', 'campus@example.test'], ['Phone', '9876543210'], ['Address', 'School Road'], ['City', 'Kochi'], ['State', 'Kerala']]) await field(label).fill(value);
  await field('School type').selectOption('PRIVATE');
  await save();
  await page.reload();
  await page.getByRole('button', { name: 'Edit Main Campus', exact: true }).click();
  await field('City').fill('Thrissur'); await save('Save changes');
  assert.equal(records.schools[0].city, 'Thrissur');
  checks.push('Campus master creates, reloads and edits');

  await open('years', 'Academic years');
  await page.getByRole('button', { name: 'Add school year' }).click();
  await field('Name').fill('2026–27'); await field('Start date').fill('2026-06-01'); await field('End date').fill('2027-03-31'); await save();
  await page.getByRole('button', { name: 'Set current', exact: true }).click();
  await page.getByText('Current', { exact: true }).last().waitFor();
  await open('terms', 'Terms');
  await page.getByRole('button', { name: 'Add term' }).click();
  await field('Academic year').selectOption('years-1');
  await field('Name').fill('Term 1'); await field('Term number').fill('1'); await field('Start date').fill('2026-06-01'); await field('End date').fill('2026-08-31');
  assert.equal(await field('End date').getAttribute('max'), '2027-03-31');
  await save();
  checks.push('School-year and term masters save with selected-year date limits and current action');

  await open('classes', 'Classes');
  await page.getByRole('button', { name: 'Add class', exact: true }).click();
  await field('Education level').waitFor();
  await field('Class name').fill('Class 1'); await field(/^Level/).fill('1'); await field('Education level').selectOption('PRIMARY'); await save();
  records.schools.push({ id: 'schools-2', name: 'Second Campus', programme, isActive: true });
  records.classes.push({ id: 'classes-2', name: 'Other Class', schoolId: 'schools-2', educationLevel: 'PRIMARY', level: '2' });
  await open('streams', 'Class sections');
  await page.getByRole('button', { name: 'Add section' }).click();
  assert(await field('Class').isDisabled());
  await field('Campus').selectOption('schools-1');
  assert.deepEqual(await field('Class').locator('option').evaluateAll(options => options.map(option => option.value)), ['', 'classes-1']);
  await field('Class').selectOption('classes-1');
  await field('Campus').selectOption('schools-2'); assert.equal(await field('Class').inputValue(), '');
  await field('Campus').selectOption('schools-1'); await field('Class').selectOption('classes-1');
  await field('Name').fill('A'); await field('Capacity').fill('30'); await save();
  checks.push('Class/section masters save; campus changes filter classes and clear stale selections');

  await open('subjects', 'Subjects');
  await page.getByRole('button', { name: 'Add record' }).click();
  await field('Name').fill('English'); await field('Code').fill('ENG'); await field('Education level').selectOption('PRIMARY');
  failSave = true;
  await modal.getByRole('button', { name: 'Create record' }).click();
  await modal.getByRole('alert').filter({ hasText: 'already exists' }).waitFor();
  assert.equal(await field('Name').inputValue(), 'English');
  failSave = false; await save();
  checks.push('Subject master saves and failed saves retain entered values for retry');

  failOptions = true;
  await open('classes', 'Classes'); await page.getByRole('button', { name: 'Add class', exact: true }).click();
  await modal.getByRole('alert').filter({ hasText: 'Choices temporarily unavailable' }).waitFor();
  assert(await modal.getByRole('button', { name: 'Create record' }).isDisabled());
  failOptions = false; await modal.getByRole('button', { name: 'Reload choices' }).click(); await field('Campus').selectOption('schools-1');
  await field('Education level').waitFor(); await modal.getByRole('button', { name: 'Cancel' }).click();
  checks.push('Option-load failures recover through Reload choices');

  programme = 'PRESCHOOL'; records.schools.forEach(school => { school.programme = programme; }); records.classes.length = 0;
  await page.goto(base + '/school/preschool?section=copilot');
  await page.getByText('Create your preschool classes', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Manage classes', exact: true }).click();
  await page.getByRole('heading', { name: 'Preschool classes', exact: true }).waitFor();
  checks.push('Preschool empty state identifies missing classes and opens their master directly');
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow at ' + width);
  }
  await page.screenshot({ path: fileURLToPath(new URL('preschool-master-mobile.png', output)), fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(new URL('results.json', output), JSON.stringify({ checks, writes: writes.length, errors, fixture: 'Intercepted APIs; no live school records changed' }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally { await browser.close(); }
