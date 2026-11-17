import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3106';
const browser = await chromium.launch({ headless: true });
const checks = [],
  errors = [],
  requests = [];
let unavailable = true,
  failSend = true,
  failUpload = false,
  failReaction = false;
let channels = [],
  messages = [];
const channel = (id) => ({
  id,
  name: id === 'channel-1' ? 'Saved class chat' : 'New staff group',
  rawName: 'Saved class chat',
  type: 'GROUP',
  memberCount: 2,
  isMember: true,
  myRole: 'ADMIN',
  updatedAt: new Date().toISOString(),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  serviceWorkers: 'block',
});
await context.addInitScript(() => {
  localStorage.setItem('accessToken', 'chat-fixture');
  window.captureCancelled = true;
  window.stoppedCaptures = 0;
  Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
    configurable: true,
    value: async () => {
      if (window.captureCancelled)
        throw new DOMException('Screen permission cancelled', 'NotAllowedError');
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'green';
      ctx.fillRect(0, 0, 640, 360);
      const stream = canvas.captureStream(1);
      const track = stream.getVideoTracks()[0],
        stop = track.stop.bind(track);
      track.stop = () => {
        window.stoppedCaptures++;
        stop();
      };
      return stream;
    },
  });
});
await context.route('**/api/**', async (route) => {
  const req = route.request(),
    path = new URL(req.url()).pathname.replace(/^\/api\/v1/, '');
  const body = req.headers()['content-type']?.includes('application/json')
    ? req.postDataJSON()
    : null;
  requests.push({ path, method: req.method(), body });
  const ok = (data) => route.fulfill({ json: { success: true, data } });
  if (path === '/auth/me')
    return ok({
      id: 'teacher-user',
      tenantId: 'school-1',
      role: 'TEACHER',
      firstName: 'Saved',
      lastName: 'Teacher',
      email: 'teacher@example.test',
    });
  if (path === '/preschool/navigation') return ok({ programme: 'STANDARD' });
  if (path === '/chat/channels' && req.method() === 'GET')
    return unavailable
      ? route.fulfill({ status: 503, json: { message: 'Chat is temporarily unavailable' } })
      : ok(channels);
  if (path === '/chat/channels' && req.method() === 'POST') {
    channels.push(channel('channel-2'));
    return ok({ id: 'channel-2' });
  }
  if (path === '/chat/contacts')
    return ok([
      {
        id: 'contact-1',
        name: 'School colleague',
        role: 'TEACHER',
        email: 'colleague@example.test',
      },
    ]);
  if (path.endsWith('/attachments'))
    return failUpload
      ? route.fulfill({ status: 503, json: { message: 'File storage unavailable' } })
      : ok({
          name: 'Saved notes.pdf',
          type: 'application/pdf',
          size: 30,
          storageKey: 'school-1/documents/2026/11/chat-channel-1-file.pdf',
          url: '',
        });
  if (path.endsWith('/reactions'))
    return failReaction
      ? route.fulfill({ status: 503, json: { message: 'Reaction was not saved' } })
      : ok({});
  if (path.endsWith('/messages') && req.method() === 'GET') return ok(messages.filter(message=>message.channelId===path.split('/')[3]));
  if (path.endsWith('/messages') && req.method() === 'POST') {
    if (failSend) return route.fulfill({ status: 503, json: { message: 'Message was not saved' } });
    const message = {
      id: 'message-' + (messages.length + 1),
      channelId: path.split('/')[3],
      content: body.content,
      createdAt: new Date().toISOString(),
      sender: { id: 'teacher-user', name: 'Saved Teacher', role: 'TEACHER', isMe: true },
      attachments:
        body.attachments?.map((a) => ({
          ...a,
          url: 'https://private.example.test/notes?temporary=1',
        })) || null,
    };
    messages.push(message);
    return ok(message);
  }
  return ok([]);
});
const page = await context.newPage();
page.on('pageerror', (err) => errors.push(err.message));
try {
  await mkdir('qa/chat', { recursive: true });
  await page.goto(base + '/teacher/chat');
  await page.getByRole('alert').filter({ hasText: 'Chat is temporarily unavailable' }).waitFor();
  assert.equal(await page.getByText('Official Announcements', { exact: true }).count(), 0);
  unavailable = false;
  await page.getByRole('button', { name: 'Retry chat' }).click();
  await page.getByText('Select a channel or direct message to begin.', { exact: true }).waitFor();
  checks.push('API failure shows retry; empty channels remain empty without sample records');
  channels = [channel('channel-1')];
  await page.reload();
  const input = page.getByPlaceholder('Type your message... (Enter to send)');
  await input.fill('Preserve this draft');
  await input.press('Enter');
  await page.getByRole('alert').filter({ hasText: 'Message was not saved' }).waitFor();
  assert.equal(await input.inputValue(), 'Preserve this draft');
  assert.equal(await page.getByText('Preserve this draft', { exact: true }).count(), 0);
  failSend = false;
  await input.press('Enter');
  await page.getByText('Preserve this draft', { exact: true }).waitFor();
  assert.equal(await input.inputValue(), '');
  checks.push('Failed sends retain the draft; messages appear only after the API saves them');
  failReaction = true;
  await page.getByTitle('Reply').hover();
  const reaction = page.locator('button').filter({ hasText: '👍' }).first();
  await reaction.click();
  await page.getByRole('alert').filter({ hasText: 'Reaction was not saved' }).waitFor();
  checks.push('Failed reactions show an error instead of inventing a saved reaction');
  await page
    .getByLabel('Upload chat attachment')
    .setInputFiles({
      name: 'notes.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 notes'),
    });
  await page.getByText('Saved notes.pdf', { exact: true }).waitFor();
  await input.fill('Actual file attachment');
  await input.press('Enter');
  await page.getByRole('link', { name: 'Saved notes.pdf' }).waitFor();
  const attachmentRequest = requests.find(
    (r) => r.path.endsWith('/messages') && r.body?.content === 'Actual file attachment'
  );
  assert(attachmentRequest.body.attachments[0].storageKey);
  assert.equal(attachmentRequest.body.attachments[0].url, '');
  checks.push('Attachment picker uploads the selected file and sends its private storage key');
  await page.getByTitle('Collaborative Classroom Board for Teacher & Children').click();
  await page.getByText('Personal board', { exact: true }).waitFor();
  assert.equal(await page.getByText('Live Co-Drawing Active', { exact: true }).count(), 0);
  failUpload = true;
  await page.getByTitle('Post Board Snapshot to Chat').click();
  await page.getByRole('alert').filter({ hasText: 'snapshot could not be saved' }).waitFor();
  assert.equal(await page.getByTitle('Download PNG').count(), 1);
  failUpload = false;
  await page.getByTitle('Post Board Snapshot to Chat').click();
  await page.getByTitle('Close Board').waitFor({ state: 'hidden' });
  checks.push('Board retains work on upload failure and posts only after upload and message save');
  await page.getByTitle('Live Screen Sharing & Lesson Presentation').click();
  await page.getByRole('button', { name: 'Choose screen' }).click();
  await page.getByRole('alert').filter({ hasText: 'Screen permission cancelled' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Snapshot to Chat' }).isDisabled(), true);
  assert.equal(await page.getByText('LIVE ON AIR', { exact: true }).count(), 0);
  await page.evaluate(() => {
    window.captureCancelled = false;
  });
  await page.getByRole('button', { name: 'Choose screen' }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('video')?.srcObject && document.querySelector('video').videoWidth > 0
  );
  await page.getByRole('button', { name: 'Close screen preview' }).click();
  assert.equal(await page.evaluate(() => window.stoppedCaptures), 1);
  checks.push(
    'Cancelled screen permission stays inactive; actual capture attaches to video and stops on close'
  );
  await page.getByTitle('HD Video Call').click();
  await page.getByLabel('School meeting link', { exact: true }).fill('javascript:alert(1)');
  assert.equal(await page.getByRole('link', { name: 'Open meeting', exact: true }).count(), 0);
  await page
    .getByLabel('School meeting link', { exact: true })
    .fill('https://meeting.example.test/room');
  await page.getByRole('link', { name: 'Open meeting', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Close meeting', exact: true }).click();
  checks.push('Meeting action uses a real HTTPS provider link without simulated participants');
  await page.getByTitle('Start New Chat or Channel').click();
  await page.getByPlaceholder('Channel name (e.g. Grade 5 Mathematics)').fill('New staff group');
  await page.getByPlaceholder('Description (optional)').fill('Saved group description');
  await page.getByLabel('Channel members', { exact: true }).selectOption('contact-1');
  await page.getByRole('button', { name: 'Create Channel', exact: true }).click();
  await page.getByRole('heading', { name: 'New staff group', exact: true, level: 2 }).waitFor();
  await page.getByText('Preserve this draft',{exact:true}).waitFor({state:'hidden'});
  assert.deepEqual(requests.find((r) => r.path === '/chat/channels' && r.method === 'POST').body, {
    name: 'New staff group',
    description: 'Saved group description',
    type: 'GROUP',
    memberUserIds: ['contact-1'],
  });
  checks.push(
    'New group creation saves the name, description and selected members through the channel API'
  );
  await page.screenshot({ path: 'qa/chat/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
    'Chat must fit a phone viewport'
  );
  await page.screenshot({ path: 'qa/chat/mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(
    'qa/chat/results.json',
    JSON.stringify(
      {
        passed: checks.length,
        checks,
        errors,
        fixture: 'API and capture fixtures; no live records or provider calls',
      },
      null,
      2
    )
  );
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally {
  await browser.close();
}
