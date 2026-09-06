// R40.90 UPLOAD-PARSER REPRODUCER — binary × field-order × BOUNDARY-FORM. Reproduces Tron's 'Upload failed' on OUR machine, NO
// iOS needed (stale-SW cause REFUTED: fresh worker v0.8.188, still fails). Parser RE-INDICTED (architect 45f8ad5b1). TWO suspect
// sites in server.ts: (BODY) 2645 `body.toString('binary').split('--'+boundary)` + per-part string-slice; (HEADER) 2643
// `content-type.split('boundary=')[1]` — a QUOTED boundary ("----X") or a boundary that isn't the last param keeps the quotes /
// trailing param → the delimiter never matches → 0 parts → size 0 FROM THE HEADER (identical symptom, body was fine).
//
// ★ REAL SERIALIZATION — the upload is a NODE-NATIVE https raw multipart POST (a Buffer I build byte-for-byte), NOT Playwright
//   FormData (the instrument that falsely serialized 0 bytes and un-indicted the parser last time). Room+token set up via the
//   page WS (token registered in tokenToClient); the upload itself never touches Playwright.
// ★ DISCRIMINATOR (architect): assert the server log '[upload] received Nb content-length=M' (received==content-length ⇒ body
//   ARRIVED, not stripped) PLUS the parsed size + token-extracted — so a header-fault (received==CL, parsed 0) is told apart
//   from a transport-fault (received<CL). Log at /tmp/r4031-server-<pid>.log (foundation pipes server stdout there).
// MATRIX (RED-baseline current HEAD): V0 text control · V1 unquoted file-first BINARY · V2 unquoted token-first BINARY ·
//   V3 QUOTED boundary · V4 boundary+;charset param. Expect V0/V1/V2 PASS (body parser is binary-safe for a clean header) and
//   V3/V4 FAIL (header-side boundary extraction) = Tron's bug reproduced. Post-fix (buffer-native + robust boundary) → all GREEN.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import https from 'node:https';
import fs from 'node:fs';
import crypto from 'node:crypto';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PLAYER = '11111111-2222-4333-8444-555555555555';
const SERVER_LOG = `/tmp/r4031-server-${process.pid}.log`;

// REAL binary PNG, 473521 bytes (Tron's IMG_5399 size). PNG signature contains 0x0D0x0A; random bulk guarantees 0x00/0xFF runs
// + stray CRLF / CRLF-CRLF / CRLF-dash-dash sequences (the exact bytes a string .split/.replace parser trips on).
const PNG = crypto.randomBytes(473521);
PNG.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
for (let i = 1000; i < PNG.length - 8; i += 50000) { PNG.set([0x0d, 0x0a, 0x0d, 0x0a], i); PNG.set([0x0d, 0x0a, 0x2d, 0x2d], i + 20000); }
const TXT = Buffer.from('hello-tron-upload-control', 'utf8');
const B = '----WebKitFormBoundaryTRON7f3aR4090';

const filePart = (buf, name, mime) => Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: ${mime}\r\n\r\n`, 'utf8'), buf, Buffer.from('\r\n', 'utf8')]);
const tokenPart = () => Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${PLAYER}\r\n`, 'utf8');
const closing = () => Buffer.from(`--${B}--\r\n`, 'utf8');
const body = (order, buf, name, mime) => order === 'file' ? Buffer.concat([filePart(buf, name, mime), tokenPart(), closing()]) : Buffer.concat([tokenPart(), filePart(buf, name, mime), closing()]);

const shaOf = (b) => crypto.createHash('sha256').update(b).digest('hex');
// NODE-NATIVE raw multipart POST — the exact Content-Type header string is under our control (that is the header-side variant).
const rawPost = (base, roomId, contentType, bodyBuf) => new Promise((resolve) => {
  const u = new URL(`${base}/api/room/${roomId}/upload`);
  const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', rejectUnauthorized: false, headers: { 'Content-Type': contentType, 'Content-Length': bodyBuf.length } }, (res) => { let d = ''; res.on('data', (c) => (d += c)); res.on('end', () => { let j = {}; try { j = JSON.parse(d); } catch {} resolve({ status: res.statusCode, body: j }); }); });
  req.on('error', (e) => resolve({ status: 0, body: { error: String(e.message) } }));
  req.write(bodyBuf); req.end();
});
// CONTENT-INTEGRITY (PO): fetch the STORED bytes back and sha-compare to source — GREEN means the file is byte-correct, not just
// a matching size number (EXISTS ⊂ CORRECT). A parser that recovers the right LENGTH but shifted/mangled bytes still fails here.
const getContent = (base, uuid) => new Promise((resolve) => {
  const u = new URL(`${base}/api/room/file/${encodeURIComponent(uuid)}/content?token=${encodeURIComponent(PLAYER)}`);
  const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'GET', rejectUnauthorized: false }, (res) => { const chunks = []; res.on('data', (c) => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode, buf: Buffer.concat(chunks) })); });
  req.on('error', () => resolve({ status: 0, buf: Buffer.alloc(0) }));
  req.end();
});

const f = await setupFoundation({ commit: process.env.ARM_COMMIT || 'HEAD' });
R(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} | pngBytes=${PNG.length} serverLog=${SERVER_LOG}`);
const browser = await webkit.launch();
const results = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, PLAYER);
  const page = await ctx.newPage();
  await page.goto(f.base + '/app', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'D', secretCode: '4090' }));
  await sleep(2000);
  const roomId = await page.evaluate(async () => { const c = window.__rawbinClient; if (!c?.createRoom) return null; c.createRoom('D', 'D'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  R(`  room=${roomId ? roomId.slice(0, 12) : 'NULL'} (token registered in tokenToClient via page WS)`);
  if (!roomId) throw new Error('no-room-render (instrument)');

  const variants = [
    { id: 'V0 text·token-first·unquoted ', ct: `multipart/form-data; boundary=${B}`, order: 'token', buf: TXT, fn: 'V0.txt', mime: 'text/plain', expect: 'PASS' },
    { id: 'V1 BIN ·file-first ·unquoted ', ct: `multipart/form-data; boundary=${B}`, order: 'file', buf: PNG, fn: 'V1.png', mime: 'image/png', expect: 'PASS?' },
    { id: 'V2 BIN ·token-first·unquoted ', ct: `multipart/form-data; boundary=${B}`, order: 'token', buf: PNG, fn: 'V2.png', mime: 'image/png', expect: 'PASS?' },
    { id: 'V3 BIN ·file-first ·QUOTED   ', ct: `multipart/form-data; boundary="${B}"`, order: 'file', buf: PNG, fn: 'V3.png', mime: 'image/png', expect: 'FAIL?' },
    { id: 'V4 BIN ·file-first ·;charset ', ct: `multipart/form-data; boundary=${B}; charset=utf-8`, order: 'file', buf: PNG, fn: 'V4.png', mime: 'image/png', expect: 'FAIL?' },
  ];
  for (const v of variants) {
    const bodyBuf = body(v.order, v.buf, v.fn, v.mime);
    const srcSha = shaOf(v.buf);
    const up = await rawPost(f.base, roomId, v.ct, bodyBuf);
    const parsedSize = Number(up.body.size);
    const tokenExtracted = up.status !== 401;
    const sizeOk = up.status === 200 && parsedSize === v.buf.length && tokenExtracted;
    // CONTENT-INTEGRITY: round-trip the stored bytes and sha-compare (only meaningful once the upload was accepted)
    let integrityOk = false, servedSha = '-';
    if (up.status === 200 && up.body.uuid) { const g = await getContent(f.base, up.body.uuid); servedSha = g.buf.length ? shaOf(g.buf).slice(0, 12) : '-'; integrityOk = g.status === 200 && shaOf(g.buf) === srcSha; }
    const pass = sizeOk && integrityOk;
    results.push({ ...v, status: up.status, parsedSize, sent: bodyBuf.length, srcSize: v.buf.length, tokenExtracted, integrityOk, err: up.body.error, pass });
    R(`  ${v.id}: status=${up.status} sent=${bodyBuf.length}b parsed=${Number.isFinite(parsedSize) ? parsedSize : 'n/a'}b (src=${v.buf.length}) token=${tokenExtracted ? 'extracted' : 'MISSING→401'} byteSha=${integrityOk ? 'MATCH' : servedSha} err=${up.body.error || '-'} ⇒ ${pass ? 'PASS' : 'FAIL'} [expect ${v.expect}]`);
    await sleep(300);
  }
  await ctx.close();
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 200)}`); }
finally { await browser.close().catch(() => {}); }

const td = await f.teardown(); // kills the scratch server → its buffered stdout flushes to the log fd
R(`teardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`);
await sleep(800);
// ── DISCRIMINATOR (hygiene, PO): the server's own [upload] log — received==content-length ⇒ header/parser fault, not transport.
// The verdict rests on the response matrix (stronger); this channel is kept working so future diagnoses have it (blind twice today).
R(`\n─── server [upload] log (received vs content-length + parsed size + token) ───`);
try { const log = fs.readFileSync(SERVER_LOG, 'utf8'); const lines = log.split('\n').filter((l) => l.includes('[upload]')); if (!lines.length) R(`  (no [upload] lines captured — server stdout may be unflushed)`); for (const line of lines) R(`  ${line.replace(/^.*?\[upload\]/, '[upload]').slice(0, 160)}`); } catch (e) { R(`  (log unreadable: ${e.message})`); }
R(`\n═══ R40.90 UPLOAD PARSER (binary × order × boundary-form) MATRIX ═══`);
for (const r of results) R(`  ${r.id}: ${r.pass ? 'GREEN' : 'RED '} (status ${r.status}, parsed ${r.parsedSize}/${r.srcSize}b, token ${r.tokenExtracted ? 'ok' : 'MISSING'}) [expect ${r.expect}]`);
const control = results.find((r) => r.id.startsWith('V0'));
const failing = results.filter((r) => !r.pass).map((r) => r.id.trim().split(' ')[0]);
R(`OVERALL: ${results.length && results.every((r) => r.pass) ? 'ALL GREEN — parser binary-safe + order- AND boundary-form-independent' : 'RED'}`);
R(`  control V0 (text) = ${control?.pass ? 'PASS → transport+auth proven; any FAIL below is the PARSER/HEADER, not transport' : 'FAIL (instrument — control must pass)'}`);
R(`  FAILING variants = ${failing.length ? failing.join(', ') : 'none'} ${failing.length ? '= Tron bug reproduced on our machine (no iOS)' : ''}`);
process.exit(results.length && results.every((r) => r.pass) ? 0 : 1);
