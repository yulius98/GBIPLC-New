import { test, before, after } from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function request(pathname, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

async function loginAsAdmin() {
  const { status, body } = await request('/api/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  assert.strictEqual(status, 200, 'login admin harus 200');
  assert.ok(body.access_token, 'login harus mengembalikan access_token');
  return body.access_token;
}

test('GET /health -> ok', async () => {
  const { status, body } = await request('/health');
  assert.strictEqual(status, 200);
  assert.strictEqual(body.status, 'ok');
});

test('POST /api/login dengan password salah -> gagal', async () => {
  const { status } = await request('/api/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: 'salah-pass' },
  });
  assert.notStrictEqual(status, 200);
});

test('POST /api/login admin -> access_token + format Laravel', async () => {
  const { status, body } = await request('/api/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  assert.strictEqual(status, 200);
  assert.ok(body.access_token);
  assert.strictEqual(body.token_type, 'bearer');
  assert.ok(body.expires_in > 0);
});

test('GET /api/user tanpa token -> 401', async () => {
  const { status } = await request('/api/user');
  assert.strictEqual(status, 401);
});

test('GET /api/user dengan token -> { success: true, user }', async () => {
  const token = await loginAsAdmin();
  const { status, body } = await request('/api/user', { token });
  assert.strictEqual(status, 200);
  assert.strictEqual(body.success, true);
  assert.ok(body.user);
  assert.strictEqual(body.user.id, 1);
  assert.strictEqual(body.user.role, 'pengurus');
});

test('GET /api/carousel -> data hasil migrasi', async () => {
  const { status, body } = await request('/api/carousel');
  assert.strictEqual(status, 200);
  assert.strictEqual(body.status, true);
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length > 0);
});

test('GET /api/event -> data hasil migrasi', async () => {
  const { status, body } = await request('/api/event');
  assert.strictEqual(status, 200);
  assert.strictEqual(body.status, true);
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length > 0);
});

test('GET /api/reading/today -> format { date, morning, evening, progress } (publik)', async () => {
  const { status, body } = await request('/api/reading/today');
  assert.strictEqual(status, 200);
  assert.ok(body.date);
  assert.ok(body.morning || body.evening || body.progress !== undefined);
});

test('POST /api/reading/start-date tanpa start_date -> validasi 422', async () => {
  const token = await loginAsAdmin();
  const { status, body } = await request('/api/reading/start-date', {
    method: 'POST',
    token,
    body: {},
  });
  assert.strictEqual(status, 422);
  assert.ok(body.errors && body.errors.start_date);
});

test('GET /api/materi-komsel/getlink tanpa params -> 422', async () => {
  const { status } = await request('/api/materi-komsel/getlink');
  assert.strictEqual(status, 422);
});

test('GET /api/chunk-upload tanpa token -> 401', async () => {
  const { status } = await request('/api/chunk-upload?resumableIdentifier=x&resumableChunkNumber=1');
  assert.strictEqual(status, 401);
});
