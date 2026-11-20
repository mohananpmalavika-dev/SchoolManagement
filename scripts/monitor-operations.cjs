const fs = require('node:fs');

// Poll from the monitoring host. Never print tokens, response bodies or provider errors.
async function monitor(env = process.env, request = fetch) {
  const url = new URL(env.OPS_HEALTH_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      !url.pathname.endsWith('/api/v1/ops/health')) throw new Error('Configure the HTTPS operator health URL');
  const token = fs.readFileSync(env.OPS_TOKEN_FILE, 'utf8').trim();
  if (!/^[A-Za-z0-9_.-]+$/.test(token)) throw new Error('Invalid operator token file');
  const response = await request(url, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
    redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  if (response.status !== 200) throw new Error('Operator health unavailable');
  const body = await response.json();
  const report = body?.success === true ? body.data : body;
  const age = Date.now() - Date.parse(report?.timestamp);
  const keys = ['core', 'storage', 'smtp', 'administrator', 'backupStorage', 'backupFreshness', 'offsiteBackup', 'restoreRehearsal'];
  if (report?.status !== 'ready' || report.scope !== 'operator-go-live-checks' || !Number.isFinite(age) || age < 0 || age > 60000 ||
      keys.some(key => report.checks?.[key] !== 'healthy')) throw new Error('Operator checks degraded, stale or incomplete');
  return { status: 'ready', timestamp: report.timestamp };
}

module.exports = { monitor };
if (require.main === module) monitor().then(result => console.log(JSON.stringify(result))).catch(() => {
  console.error('Operator health check failed; inspect protected diagnostics and token expiry.');
  process.exitCode = 1;
});
