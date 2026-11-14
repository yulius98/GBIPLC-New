import { test, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { uploadController, uploadChunk } from '../src/modules/upload/upload.controller.js';
import { UPLOAD_DIR } from '../src/middlewares/upload.js';
import errorHandler from '../src/middlewares/errorHandler.js';

/**
 * Menguji alur chunk upload (tanpa auth & DB): rute dipasang di app mini.
 * Ukuran file uji bisa diubah, mis. CHUNK_TEST_MB=115 node --test test/chunk-upload.test.js
 */

const CHUNK = 5 * 1024 * 1024;
const SIZE_MB = Number(process.env.CHUNK_TEST_MB || 12);

let server;
let baseUrl;
const createdFiles = [];

before(async () => {
  const app = express();
  app.use(express.json());
  app.get('/api/chunk-upload', uploadController.checkChunk);
  app.post('/api/chunk-upload', uploadChunk, uploadController.upload);
  app.post('/api/chunk-cleanup', uploadController.cleanup);
  app.use(errorHandler);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  for (const f of createdFiles) fs.rmSync(path.join(UPLOAD_DIR, f), { force: true });
  await new Promise((resolve) => server.close(resolve));
});

function fakePdf(sizeBytes) {
  const buf = crypto.randomBytes(sizeBytes);
  buf.write('%PDF-1.7\n', 0, 'latin1');
  return buf;
}

async function sendChunk({ id, name, number, total, totalSize, data }) {
  const form = new FormData();
  form.append('resumableChunkNumber', String(number));
  form.append('resumableTotalChunks', String(total));
  form.append('resumableTotalSize', String(totalSize));
  form.append('resumableIdentifier', id);
  form.append('resumableFilename', name);
  form.append('file', new Blob([data]), name);
  const res = await fetch(`${baseUrl}/api/chunk-upload`, { method: 'POST', body: form });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

test(`upload ${SIZE_MB}MB per chunk 5MB: digabung utuh & isinya identik`, async () => {
  const file = fakePdf(SIZE_MB * 1024 * 1024);
  const total = Math.ceil(file.length / CHUNK);
  const id = `test-${Date.now()}-ok`;
  let last;

  for (let n = 1; n <= total; n += 1) {
    const data = file.subarray((n - 1) * CHUNK, Math.min(n * CHUNK, file.length));
    last = await sendChunk({ id, name: 'materi.pdf', number: n, total, totalSize: file.length, data });
    assert.strictEqual(last.status, 200);
    assert.strictEqual(last.body.status, n < total ? 'chunk_uploaded' : 'success');
  }

  assert.match(last.body.filename, /^materi-kotbah\/[a-f0-9]{40}\.pdf$/);
  createdFiles.push(last.body.filename);
  const merged = fs.readFileSync(path.join(UPLOAD_DIR, last.body.filename));
  assert.strictEqual(merged.length, file.length);
  assert.strictEqual(
    crypto.createHash('sha256').update(merged).digest('hex'),
    crypto.createHash('sha256').update(file).digest('hex'),
  );
});

test('resume: GET chunk-upload 200 jika chunk ada, 204 jika belum', async () => {
  const id = `test-${Date.now()}-resume`;
  const data = fakePdf(1024);
  const sent = await sendChunk({ id, name: 'a.pdf', number: 1, total: 2, totalSize: 2048, data });
  assert.strictEqual(sent.body.status, 'chunk_uploaded');

  const q = (n) =>
    fetch(`${baseUrl}/api/chunk-upload?resumableIdentifier=${id}&resumableChunkNumber=${n}`);
  assert.strictEqual((await q(1)).status, 200);
  assert.strictEqual((await q(2)).status, 204);

  await fetch(`${baseUrl}/api/chunk-cleanup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: id }),
  });
  assert.strictEqual((await q(1)).status, 204);
});

test('isi bukan PDF/PowerPoint ditolak dan file hasil merge dihapus', async () => {
  const id = `test-${Date.now()}-bad`;
  const dir = path.join(UPLOAD_DIR, 'materi-kotbah');
  const list = () => (fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []);
  const filesBefore = list();

  const data = Buffer.from('ini cuma teks biasa, bukan pdf'.repeat(10));
  const res = await sendChunk({ id, name: 'palsu.pdf', number: 1, total: 1, totalSize: data.length, data });

  assert.strictEqual(res.status, 400);
  assert.deepStrictEqual(list(), filesBefore); // tidak ada file tersisa
});

test('ekstensi selain pdf/ppt/pptx ditolak', async () => {
  const res = await sendChunk({
    id: `test-${Date.now()}-ext`,
    name: 'virus.exe',
    number: 1,
    total: 1,
    totalSize: 10,
    data: Buffer.from('MZ'),
  });
  assert.strictEqual(res.status, 400);
});

test('ukuran total di atas batas ditolak 413', async () => {
  const res = await sendChunk({
    id: `test-${Date.now()}-big`,
    name: 'besar.pdf',
    number: 1,
    total: 100,
    totalSize: 400 * 1024 * 1024,
    data: fakePdf(1024),
  });
  assert.strictEqual(res.status, 413);
});

test('identifier tanpa karakter valid ditolak (tidak menyentuh folder akar chunk)', async () => {
  const res = await sendChunk({
    id: '../..',
    name: 'a.pdf',
    number: 1,
    total: 1,
    totalSize: 10,
    data: fakePdf(1024),
  });
  assert.strictEqual(res.status, 400);
});
