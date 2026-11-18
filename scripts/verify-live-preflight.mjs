import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Read-only diagnostics. Never send messages, create orders, upload files or invoke restore.
const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const { parse } = require('dotenv');
const root = new URL('../', import.meta.url);
let local = {}, config = { ...process.env };
try { local = parse(await readFile(new URL('apps/api/.env', root))); } catch {}
const configFile = process.env.LIVE_VERIFICATION_ENV_FILE || '.env.live-verification.local';
try { config = { ...parse(await readFile(new URL(configFile.replace(/\\/g, '/'), root))), ...config }; }
catch (error) { if (error.code !== 'ENOENT') throw new Error('Cannot read the live verification configuration file'); }
const report = { timestamp: new Date().toISOString(), scope: 'read-only preflight; not an end-to-end live sign-off',
  productionVerified: false, deviceTests: 'DEFERRED_BY_USER', checks: [], localConnectivity: [] };
function record(id, status, detail) { report.checks.push({ id, status, detail }); }
function liveUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      /^(localhost|127\..*|0\.0\.0\.0|\[?::1\]?)$/i.test(url.hostname) || /(^|\.)example\.(com|org|net)$/i.test(url.hostname)) return null;
    return url;
  } catch { return null; }
}
async function request(url, token) {
  const response = await fetch(url, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(8000),
    headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), Accept: 'application/json' } });
  let data;
  if (response.headers.get('content-type')?.includes('application/json')) {
    try { const body = await response.json(); data = body?.success === true ? body.data : body; } catch {}
  } else await response.body?.cancel();
  return { status: response.status, data, html: response.headers.get('content-type')?.includes('text/html') };
}
async function check(id, url, validate, token) {
  try {
    const response = await request(url, token);
    record(id, validate(response) ? 'PASS' : 'FAIL', 'HTTP ' + response.status);
    return response;
  } catch { record(id, 'BLOCKED', 'No verifiable response: connection, TLS, timeout or redirect error'); return null; }
}
function endpoint(base, path) { return base.href.replace(/\/$/, '') + path; }
async function tcp(host, port) {
  return new Promise(resolve => {
    const socket = createConnection({ host, port });
    let done = false;
    const finish = reachable => { if (done) return; done = true; socket.destroy(); resolve(reachable); };
    socket.setTimeout(700); socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false)); socket.once('error', () => finish(false));
  });
}
const localTargets = [['QA PostgreSQL', 'DATABASE_URL', 5432], ['Redis', 'REDIS_URL', 6379], ['Object storage', 'S3_ENDPOINT', 9000]];
report.localConnectivity = await Promise.all(localTargets.map(async ([service, key, defaultPort]) => {
  try {
    const url = new URL(local[key]);
    if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname)) return { service, status: 'NOT_PROBED', reason: 'Local inventory contains a non-loopback host' };
    return { service, port: Number(url.port || defaultPort), status: await tcp(url.hostname, Number(url.port || defaultPort)) ? 'REACHABLE' : 'UNAVAILABLE' };
  } catch { return { service, status: 'NOT_CONFIGURED' }; }
}));

const web = liveUrl(config.LIVE_WEB_URL), api = liveUrl(config.LIVE_API_BASE_URL);
await Promise.all([
  (async () => {
    if (!web) return record('live-web', 'BLOCKED', 'Set LIVE_WEB_URL to the deployed HTTPS origin');
    await check('live-web', new URL('/login', web), response => response.status === 200 && response.html);
  })(),
  (async () => {
    if (!api) return record('live-api', 'BLOCKED', 'Set LIVE_API_BASE_URL to the deployed HTTPS API base, including /api/v1');
    await Promise.all([
      check('api-liveness', endpoint(api, '/health/live'), response => response.status === 200 && response.data?.status === 'ok'),
      check('api-readiness', endpoint(api, '/health/ready'), response => response.status === 200 && response.data?.checks?.database === 'healthy' && response.data?.checks?.redis === 'healthy'),
      check('anonymous-payment-settings-denied', endpoint(api, '/payments-gateway/school-accounts'), response => [401, 403].includes(response.status)),
    ]);
    if (config.LIVE_QA_TOKEN) {
      await check('school-payment-settings-readable', endpoint(api, '/payments-gateway/school-accounts'), response =>
        response.status === 200 && Array.isArray(response.data) && response.data.every(school =>
          !school.account || (!('razorpayKeySecret' in school.account) && !('razorpayWebhookSecret' in school.account))), config.LIVE_QA_TOKEN);
    } else record('school-payment-settings-readable', 'BLOCKED', 'Set a school finance QA bearer token in the local verification environment');
  })(),
  (async () => {
    const gateway = liveUrl(config.LIVE_CCTV_GATEWAY_URL || config.CCTV_GATEWAY_URL);
    if (!gateway) return record('cctv-gateway', 'BLOCKED', 'No deployed HTTPS CCTV gateway configured');
    await check('cctv-gateway-health', endpoint(gateway, '/health'), response => response.status === 200 && response.data?.status === 'ok' && response.data?.mediamtx === 'reachable' && response.data?.httpsEnforced === true);
    await check('anonymous-camera-registry-denied', endpoint(gateway, '/api/cameras'), response => [401, 403].includes(response.status));
  })(),
]);

// A pre-existing QA object is required. Download only one byte; never retain object bytes or signed URLs.
if (api && config.LIVE_QA_TOKEN && config.LIVE_FOREIGN_QA_TOKEN && /^[a-zA-Z0-9_-]{1,100}$/.test(config.LIVE_MEDIA_ID || '')) {
  const media = endpoint(api, '/media/' + encodeURIComponent(config.LIVE_MEDIA_ID) + '/presigned-url');
  await check('cross-tenant-media-denied', media, response => [403, 404].includes(response.status), config.LIVE_FOREIGN_QA_TOKEN);
  const signed = await check('authorised-media-url', media + '?expiresIn=60', response => response.status === 200 && typeof response.data?.url === 'string', config.LIVE_QA_TOKEN);
  if (signed?.status === 200 && typeof signed.data?.url === 'string') {
    try {
      const url = new URL(signed.data.url);
      if (url.protocol !== 'https:' || url.username || url.password || !url.search) throw new Error('Invalid signed URL');
      const download = await fetch(url, { headers: { Range: 'bytes=0-0' }, redirect: 'error', signal: AbortSignal.timeout(8000) });
      const readable = [200, 206].includes(download.status); await download.body?.cancel();
      record('signed-private-object-readable', readable ? 'PASS' : 'FAIL', 'HTTP ' + download.status);
      url.search = '';
      const anonymous = await fetch(url, { headers: { Range: 'bytes=0-0' }, redirect: 'error', signal: AbortSignal.timeout(8000) });
      await anonymous.body?.cancel();
      record('unsigned-private-object-denied', readable && [401, 403, 404].includes(anonymous.status) ? 'PASS' : 'FAIL', 'HTTP ' + anonymous.status);
    } catch { record('private-storage-access', 'BLOCKED', 'Unable to verify signed/unsigned QA object requests'); }
  }
} else record('private-storage-access', 'BLOCKED', 'Requires LIVE_QA_TOKEN, LIVE_FOREIGN_QA_TOKEN and an existing non-sensitive LIVE_MEDIA_ID on the live API');

for (const [id, detail] of [
  ['real-cctv-mobile', 'Deferred: actual Android/iPhone playback, feed identity, expiry and access revocation'],
  ['phone-gps', 'Deferred: physical phone accuracy, server updates, network switching and sleep/resume'],
  ['cross-network-calls', 'Deferred: two independent networks, bidirectional media and selected TURN relay evidence'],
]) record(id, 'DEFERRED', detail);
for (const [id, detail] of [
  ['payment-provider-end-to-end', 'Requires an identified school QA invoice, provider transaction/webhook, receipt and settlement evidence'],
  ['messaging-provider-delivery', 'Requires approved QA recipients and provider delivery plus device/inbox confirmation'],
  ['storage-link-expiry', 'Requires expired original URL rejection; signed URL generation does not establish expiry enforcement'],
  ['production-backup-recovery', 'Requires production archive downloaded from offsite, isolated empty restore target, matching data checks and measured RPO/RTO'],
]) record(id, 'PENDING', detail);
report.summary = Object.fromEntries(['PASS', 'FAIL', 'BLOCKED', 'DEFERRED', 'PENDING'].map(status => [status, report.checks.filter(check => check.status === status).length]));
const output = new URL('qa/live-verification/', root); await mkdir(output, { recursive: true });
await writeFile(new URL('preflight.json', output), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log('Evidence: ' + fileURLToPath(new URL('preflight.json', output)));
// Pending/deferred end-to-end cases deliberately prevent a green live verification exit.
process.exitCode = report.checks.some(check => check.status !== 'PASS') ? 2 : 0;
