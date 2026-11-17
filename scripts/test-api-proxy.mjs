import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';

// Run against a production web build using its default local API_URL. A local
// HTTP fixture checks routing and bytes; no browser interception hides rewrites.
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:3106';
const checks = [];
const backend = createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/v1/') || url.pathname.startsWith('/api/v1/v1/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Incorrect backend API prefix', path: req.url }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(
    JSON.stringify({
      path: url.pathname,
      query: url.search,
      method: req.method,
      authorization: req.headers.authorization,
      tenant: req.headers['x-tenant-id'],
      contentType: req.headers['content-type'],
      body: Buffer.concat(chunks).toString(),
    })
  );
});
backend.listen(3001, '127.0.0.1');
await once(backend, 'listening');
try {
  for (const path of ['/api/v1/health', '/api/health']) {
    const response = await fetch(base + path + '?check=school%20flow');
    const data = await response.json();
    assert.equal(response.status, 200, JSON.stringify(data));
    assert.equal(data.path, '/api/v1/health');
    assert.equal(data.query, '?check=school%20flow');
  }
  checks.push(
    'Versioned and legacy API URLs reach one backend version prefix and preserve queries'
  );
  const body = JSON.stringify({ email: 'fixture@example.test', password: 'fixture-only-value' });
  const login = await fetch(base + '/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer fixture-access',
      'x-tenant-id': 'fixture-school',
    },
    body,
  });
  const data = await login.json();
  assert.equal(login.status, 200, JSON.stringify(data));
  assert.equal(data.path, '/api/v1/auth/login');
  assert.equal(data.method, 'POST');
  assert.equal(data.body, body);
  assert.equal(data.authorization, 'Bearer fixture-access');
  assert.equal(data.tenant, 'fixture-school');
  checks.push('Real HTTP sign-in routing preserves request JSON and authorization headers');
  const legacy = await fetch(base + '/api/admissions/fixture-id/stage?mode=review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer fixture-access' },
    body: '{"stage":"ACCEPTED"}',
  });
  const saved = await legacy.json();
  assert.equal(legacy.status, 200, JSON.stringify(saved));
  assert.equal(saved.path, '/api/v1/admissions/fixture-id/stage');
  assert.equal(saved.authorization, 'Bearer fixture-access');
  assert.equal(saved.body, '{"stage":"ACCEPTED"}');
  assert.equal(saved.query, '?mode=review');
  checks.push('Existing server API route handlers forward legacy paths, bodies and credentials');
  await mkdir('qa/proxy', { recursive: true });
  await writeFile(
    'qa/proxy/results.json',
    JSON.stringify(
      { passed: checks.length, checks, fixture: 'Local HTTP backend fixture; no live API records' },
      null,
      2
    )
  );
  console.log(JSON.stringify({ passed: checks.length, checks }, null, 2));
} finally {
  backend.closeAllConnections();
  await new Promise((resolve) => backend.close(resolve));
}
