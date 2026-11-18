import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3102';
const out = new URL('../qa/preschool/', import.meta.url);
await mkdir(out, { recursive: true });
const checks = [],
  errors = [],
  writes = [];
const childId = '00000000-0000-4000-8000-000000000001',
  classId = '00000000-0000-4000-8000-000000000002',
  guardianId = '00000000-0000-4000-8000-000000000003';
let day = null,
  pickupPass = null,
  content = [],
  observations = [],
  consent = false;
const plan = {
  id: 'content-1',
  classId,
  kind: 'STORY',
  theme: 'Colours',
  title: 'Our colourful discovery',
  language: 'Malayalam',
  ageMinMonths: 36,
  ageMaxMonths: 60,
  durationMinutes: 15,
  body: 'കൂട്ടുകാർ ഒരുമിച്ച് ചിത്രം വരച്ചു. എല്ലാവർക്കും പങ്കെടുക്കാൻ അവസരം നൽകി. <script>window.hacked=true</script>',
  materials: 'Large cards; chunky crayons',
  learningGoals: 'Choose a colour and take turns',
  scheduledOn: '2026-11-17',
  status: 'DRAFT',
  version: 1,
};
async function session(role, width = 1440) {
  const context = await browser.newContext({ viewport: { width, height: 1000 } });
  await context.addInitScript(() => {
    localStorage.setItem('accessToken', 'qa-access');
    localStorage.setItem('refreshToken', 'qa-refresh');
  });
  await context.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, '/api'),
      method = route.request().method();
    const ok = (data) => route.fulfill({ json: { success: true, data } });
    if (method !== 'GET')
      writes.push({
        role,
        path,
        method,
        body: route.request().headers()['content-type']?.includes('application/json')
          ? route.request().postDataJSON()
          : null,
      });
    if (path === '/api/auth/me')
      return ok({
        id: role,
        firstName: 'Anu',
        lastName: 'Menon',
        role,
        email: 'qa@example.test',
        tenantId: 'tenant-a',
      });
    if (path === '/api/preschool/navigation') return ok({ programme: 'PRESCHOOL' });
    if (path === '/api/preschool/copilot') {
      const body = route.request().postDataJSON();
      return ok(
        body?.history?.length
          ? {
              answer: 'Offer a calm sensory basket for younger children while peers take turns.',
              suggestedActivities: ['Calm sensory basket'],
              source: 'Classroom guidance library',
            }
          : {
              answer: 'Model a short supported turn and offer a quiet alternative.',
              suggestedActivities: ['Picture circle'],
              source: 'Classroom guidance library',
            }
      );
    }
    if (path === '/api/preschool/options')
      return ok({
        today: '2026-11-17',
        timezone: 'Asia/Kolkata',
        schools: [{ id: 'school', name: 'Little Garden', programme: 'PRESCHOOL' }],
        classes: [
          {
            id: classId,
            name: 'Nursery',
            schoolId: 'school',
            educationLevel: 'PRE_PRIMARY',
            preschoolStage: 'NURSERY',
            school: { programme: 'PRESCHOOL' },
          },
        ],
        staff: [{ id: 'staff', firstName: 'Teacher', lastName: 'Anu' }],
        assignments: [],
        students:
          role === 'PARENT'
            ? [{ id: childId, firstName: 'Maya', lastName: 'M', currentClassId: classId }]
            : [],
      });
    if (path.endsWith('/roster'))
      return ok({
        students: [
          {
            id: childId,
            firstName: 'Maya',
            lastName: 'M',
            dateOfBirth: '2023-03-01',
            guardianLinks: [
              { guardianId, relationship: 'MOTHER', guardian: { firstName: 'Anu', lastName: 'M' } },
            ],
            day,
          },
        ],
        total: 1,
        offset: 0,
      });
    if (path.endsWith('/check-in')) {
      day = {
        id: 'day',
        date: '2026-11-17',
        checkInAt: '2026-11-17T03:30:00Z',
        checkOutAt: null,
        version: 1,
        sharedAt: null,
      };
      return ok(day);
    }
    if (path.endsWith('/care')) {
      const body = route.request().postDataJSON();
      day = {
        ...day,
        ...body,
        version: day.version + 1,
        sharedAt: body.shareWithParents ? '2026-11-17T04:00:00Z' : null,
      };
      return ok(day);
    }
    if (path.endsWith('/pickup-pass/revoke')) {
      pickupPass = null;
      return ok({ revoked: 1 });
    }
    if (path.endsWith('/pickup-pass') && method === 'POST') {
      pickupPass = {
        id: 'pass-1',
        guardianId,
        guardianName: 'Anu M',
        relationship: 'MOTHER',
        issuedByRole: role,
        deliveryChannels: ['PORTAL'],
        expiresAt: new Date(Date.now() + 1800000).toISOString(),
        otp: '482915',
        qrPayload: 'KRYPTON-PICKUP-1:qa-fixture-token-00000001',
      };
      return ok(
        role === 'PARENT'
          ? pickupPass
          : {
              id: pickupPass.id,
              guardianId: pickupPass.guardianId,
              guardianName: pickupPass.guardianName,
              relationship: pickupPass.relationship,
              issuedByRole: pickupPass.issuedByRole,
              deliveryChannels: pickupPass.deliveryChannels,
              expiresAt: pickupPass.expiresAt,
            }
      );
    }
    if (path.endsWith('/pickup-pass')) {
      return ok({
        today: '2026-11-17',
        pickupVerification: 'OPTIONAL',
        checkedIn: !!day?.checkInAt,
        checkedOut: !!day?.checkOutAt,
        checkInAt: day?.checkInAt || null,
        checkOutAt: day?.checkOutAt || null,
        pickupVerificationMethod: day?.pickupVerificationMethod || null,
        collectedBy: day?.checkOutAt ? 'Anu M' : null,
        activePass: pickupPass
          ? role === 'PARENT'
            ? pickupPass
            : {
                id: pickupPass.id,
                guardianId: pickupPass.guardianId,
                guardianName: pickupPass.guardianName,
                issuedByRole: pickupPass.issuedByRole,
                deliveryChannels: pickupPass.deliveryChannels,
                expiresAt: pickupPass.expiresAt,
              }
          : null,
        selfGuardianId: guardianId,
        authorizedGuardians: [
          { guardianId, name: 'Anu M', relationship: 'MOTHER', isSelf: true },
        ],
      });
    }
    if (path.endsWith('/check-out')) {
      const body = route.request().postDataJSON();
      day = {
        ...day,
        checkOutAt: '2026-11-17T06:30:00Z',
        pickupVerificationMethod: body?.pickupQrToken
          ? 'QR'
          : body?.pickupOtp
            ? 'OTP'
            : 'MANUAL',
        version: day.version + 1,
      };
      pickupPass = null;
      return ok(day);
    }
    if (path === '/api/preschool/students/' + childId)
      return ok({
        student: { id: childId, firstName: 'Maya', lastName: 'M', className: 'Nursery' },
        days: day ? [day] : [],
        observations,
        activities: [
          {
            id: 'event',
            title: 'Bus approaching your stop',
            description: 'Check the latest driver location.',
            createdAt: '2026-11-17T03:00:00Z',
          },
        ],
        content: content.filter((c) => c.status === 'PUBLISHED'),
      });
    if (path === '/api/preschool/content/generate')
      return ok({ ...plan, source: 'Editable template library', reviewRequired: true });
    if (path === '/api/preschool/content' && method === 'POST') {
      const created = {
        ...plan,
        id: 'content-' + (content.length + 1),
        status: 'DRAFT',
        version: 1,
        ...route.request().postDataJSON(),
      };
      content = [created, ...content];
      return ok(created);
    }
    if (path === '/api/preschool/content') return ok({ items: content, hasMore: false });
    if (path.endsWith('/publish')) {
      content[0] = { ...content[0], status: 'PUBLISHED', version: 2 };
      return ok({ id: 'content-1' });
    }
    if (path === '/api/preschool/observations') {
      observations.push({ id: 'obs', ...route.request().postDataJSON() });
      return ok(observations.at(-1));
    }
    if (path === '/api/preschool/reports')
      return ok({
        admissionsInRange: 1,
        students: [
          {
            id: childId,
            firstName: 'Maya',
            lastName: 'M',
            checkIns: 1,
            checkOuts: 1,
            careUpdates: 1,
            status: 'ACTIVE',
            observations: [{ _count: { _all: 1 } }],
            attendance: [],
            outstandingBalance: 250000,
          },
        ],
      });
    if (path.endsWith('/photos') && method === 'POST') return ok({ id: 'photo' });
    if (path.endsWith('/photos')) return ok({ items: [], hasMore: false });
    if (path.endsWith('/camera-consent')) {
      consent = route.request().postDataJSON().consent;
      return ok({ consent });
    }
    if (path.endsWith('/cameras'))
      return ok({
        gatewayConfigured: true,
        consent,
        cameras: [
          {
            id: 'camera',
            label: 'Nursery room',
            classId,
            externalCameraRef: 'nursery_1',
            weekdays: [1, 2, 3, 4, 5],
            startMinute: 540,
            endMinute: 720,
            enabled: true,
            parentAccess: true,
            available: true,
          },
        ],
      });
    if (path.endsWith('/session'))
      return ok({
        label: 'Nursery room',
        url: 'https://viewer.example.test/session/short-lived',
        expiresAt: new Date(Date.now() + 120000).toISOString(),
      });
    return ok([]);
  });
  await context.route('https://viewer.example.test/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<html><body>Secure classroom viewer fixture</body></html>',
    })
  );
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  return { page, context };
}
try {
  const { page, context } = await session('SCHOOL_ADMIN');
  await page.goto(base + '/school/preschool', { timeout: 120000 });
  await page.getByRole('heading', { name: 'Today’s attendance' }).waitFor();
  await page.getByRole('button', { name: 'Check in Maya', exact: true }).click();
  await page.getByRole('heading', { name: 'Authorized pickup', exact: true }).waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Confirm checkout', exact: true }).isEnabled(),
    false
  );
  await page.getByLabel('Meals / snacks', { exact: true }).fill('Ate lunch');
  await page.getByLabel('Rest / sleep (minutes)', { exact: true }).fill('30');
  await page.getByLabel('Classroom notes', { exact: true }).fill('Enjoyed shared drawing.');
  await page.getByLabel('Share these care notes with the linked parents').check();
  await page.getByRole('button', { name: 'Save daily care', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Saved successfully' }).waitFor();
  await page.getByLabel('Collecting guardian').selectOption(guardianId);
  assert.equal(
    await page.getByRole('button', { name: 'Confirm checkout', exact: true }).isEnabled(),
    false
  );
  await page.getByRole('button', { name: 'Send pickup OTP to parent', exact: true }).click();
  await page.getByText('Pickup OTP & QR pass sent', { exact: false }).waitFor();
  await page.getByLabel('Parent pickup OTP (optional)').fill('482915');
  await page.getByLabel('I verified this person’s identity and pickup authorization').check();
  await page.getByRole('button', { name: 'Confirm checkout', exact: true }).click();
  await page
    .getByRole('heading', { name: 'Authorized pickup', exact: true })
    .waitFor({ state: 'hidden' });
  checks.push('Check-in, reviewed care sharing and OTP/identity-confirmed authorized pickup');
  await page.screenshot({
    path: new URL('staff-desktop.png', out).pathname.replace(/^\/(.:)/, '$1'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Activities & plans', exact: true }).click();
  await page.getByLabel('Theme / topic').fill('Colours');
  await page.getByLabel('Content language').selectOption('Malayalam');
  await page.getByRole('button', { name: 'Prepare teaching draft', exact: true }).click();
  await page.getByText('Source: Editable template library.', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await page.getByRole('heading', { name: plan.title, exact: true }).waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Publish to families', exact: true }).isEnabled(),
    false
  );
  await page.getByLabel('I have reviewed the content I am publishing', { exact: false }).check();
  await page.getByRole('button', { name: 'Publish to families', exact: true }).click();
  await page.getByText('published', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Printable sheet', exact: true }).click();
  await page.getByRole('button', { name: 'Print / Save PDF', exact: true }).waitFor();
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.preschool-print-sheet').isVisible(), true);
  await page.emulateMedia({ media: 'screen' });
  await page.getByRole('button', { name: 'Close printable sheet', exact: true }).click();
  checks.push('Malayalam draft generation, review-gated publishing and printable content');
  await page.getByRole('button', { name: 'INKY assistant', exact: true }).click();
  await page
    .getByLabel('Describe the classroom situation')
    .fill('How can I help children take turns?');
  await page.getByRole('button', { name: 'Ask INKY', exact: true }).click();
  await page
    .getByText('Model a short supported turn and offer a quiet alternative.', { exact: true })
    .waitFor();
  await page
    .getByLabel('Ask a follow-up question')
    .fill('How can I adapt this for younger toddlers?');
  await page.getByRole('button', { name: 'Ask follow-up', exact: true }).click();
  await page
    .getByText('Offer a calm sensory basket for younger children while peers take turns.', {
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page
      .getByText('Model a short supported turn and offer a quiet alternative.', { exact: true })
      .isVisible(),
    true
  );
  await page.getByRole('button', { name: 'Draft in Activities & plans', exact: true }).first().click();
  await page.getByRole('heading', { name: 'Edit teaching content', exact: true }).waitFor();
  await page.getByRole('heading', { name: 'Picture circle', exact: true }).waitFor();
  await page.getByRole('button', { name: 'INKY assistant', exact: true }).click();
  assert.equal(
    await page
      .getByText('Model a short supported turn and offer a quiet alternative.', { exact: true })
      .isVisible(),
    true
  );
  await page.getByRole('button', { name: 'Open draft', exact: true }).waitFor();
  checks.push(
    'INKY multi-turn chat history, persistent session thread and one-click conversion into Activities & plans drafts'
  );
  await page.getByRole('button', { name: 'Child development', exact: true }).click();
  await page.getByLabel('Skill observed').fill('Takes a supported turn');
  await page
    .getByLabel('What happened?', { exact: false })
    .fill('Waited for a friend with one adult reminder.');
  await page.getByLabel('Share this observation with parents', { exact: true }).check();
  await page.getByRole('button', { name: 'Save observation', exact: true }).click();
  await page.getByRole('heading', { name: 'Takes a supported turn', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Reports', exact: true }).click();
  await page.getByRole('button', { name: 'Download report CSV', exact: true }).waitFor();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download report CSV', exact: true }).click();
  assert.ok((await downloadPromise).suggestedFilename().endsWith('.csv'));
  checks.push('Development observation sharing and CSV reporting');
  await page.getByRole('button', { name: 'School setup', exact: true }).click();
  await page.getByRole('heading', { name: 'Preschool teaching staff', exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({
    path: new URL('staff-mobile.png', out).pathname.replace(/^\/(.:)/, '$1'),
    fullPage: true,
  });
  await context.close();
  const teaching = await session('TEACHER');
  await teaching.page.goto(base + '/teacher/preschool');
  await teaching.page.getByRole('heading', { name: 'Today’s attendance', exact: true }).waitFor();
  assert.equal(
    await teaching.page.getByRole('button', { name: 'School setup', exact: true }).count(),
    0
  );
  await teaching.context.close();
  checks.push('Teacher workspace without school-configuration controls');
  const family = await session('PARENT', 390);
  await family.page.goto(base + '/dashboard/preschool');
  await family.page.getByRole('heading', { name: 'Safe pickup recorded', exact: true }).waitFor();
  await family.page.getByRole('heading', { name: 'Maya’s school updates', exact: true }).waitFor();
  await family.page.getByText('Enjoyed shared drawing.', { exact: true }).waitFor();
  assert.equal(
    await family.page.getByRole('button', { name: 'School setup', exact: true }).count(),
    0
  );
  await family.page.getByRole('button', { name: 'Activities & plans', exact: true }).click();
  await family.page.getByRole('heading', { name: plan.title, exact: true }).waitFor();
  assert.equal(await family.page.evaluate(() => !!window.hacked), false);
  assert.equal(
    await family.page.getByRole('button', { name: 'Save draft', exact: true }).count(),
    0
  );
  await family.page.getByRole('button', { name: 'Classroom cameras', exact: true }).click();
  assert.equal(
    await family.page.getByRole('button', { name: 'View classroom', exact: true }).isEnabled(),
    false
  );
  await family.page
    .getByLabel('I agree to the classroom viewing conditions', { exact: true })
    .check();
  await family.page.getByRole('button', { name: 'View classroom', exact: true }).click();
  await family.page.locator('iframe').waitFor();
  assert.equal(await family.page.locator('iframe').getAttribute('referrerpolicy'), 'no-referrer');
  await family.page
    .getByLabel('I agree to the classroom viewing conditions', { exact: true })
    .uncheck();
  await family.page.locator('iframe').waitFor({ state: 'hidden' });
  assert.equal(
    await family.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true
  );
  await family.page.screenshot({
    path: new URL('parent-mobile.png', out).pathname.replace(/^\/(.:)/, '$1'),
    fullPage: true,
  });
  checks.push(
    'Mobile family updates, text-safe content rendering, consent-gated camera access and immediate viewer closure on consent withdrawal'
  );
  await family.context.close();
  assert.deepEqual(errors, []);
  assert.ok(
    writes.some(
      (w) =>
        w.path.endsWith('/check-out') &&
        w.body?.identityVerified === true &&
        w.body?.pickupOtp === '482915'
    )
  );
  assert.ok(writes.some((w) => w.path.endsWith('/care') && w.body?.shareWithParents === true));
  assert.ok(
    writes.some(
      (w) =>
        w.path === '/api/preschool/copilot' &&
        Array.isArray(w.body?.history) &&
        w.body.history.length >= 2
    )
  );
  assert.ok(
    writes.some(
      (w) =>
        w.path === '/api/preschool/content' &&
        w.method === 'POST' &&
        w.body?.title === 'Picture circle' &&
        w.body?.kind === 'ACTIVITY'
    )
  );
  await writeFile(
    new URL('results.json', out),
    JSON.stringify({ checks, errors, writes }, null, 2)
  );
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally {
  await browser.close();
}

