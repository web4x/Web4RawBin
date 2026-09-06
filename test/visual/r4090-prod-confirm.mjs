// R40.90 PROD CONFIRMATION — verify Tron's upload fix ON HIS REAL SURFACE (prod.wo-da.de:4444, served v0.8.190), not a
// worktree build (served!=source burned us once today). SystemTester (the ONE canonical peer, token ce981242) + ONE room; the
// exact request SHAPES that 401'd for a week — QUOTED boundary + ;charset param — in BOTH field orders, with a real binary PNG.
// Assert: HTTP 200 + server-parsed size == source + BYTE ROUND-TRIP sha == source (content-integrity, not just a size number).
// Clean up: delete the room after. NO new identities, NO extra rooms. Uses node-native raw multipart (the instrument that
// locked the diagnosis; Playwright FormData falsely serialized 0 bytes).
import { webkit } from '@playwright/test';
import https from 'node:https';
import crypto from 'node:crypto';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';
const SYSTEST = 'ce981242-74fe-4d44-b5b6-43c641e224df'; // the ONE fixed SystemTester peer — never mint a fresh identity
const shaOf = (b) => crypto.createHash('sha256').update(b).digest('hex');
const B = '----WebKitFormBoundaryTRONprodR4090';

const filePart = (buf, name, mime) => Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: ${mime}\r\n\r\n`, 'utf8'), buf, Buffer.from('\r\n', 'utf8')]);
const tokenPart = () => Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYSTEST}\r\n`, 'utf8');
const closing = () => Buffer.from(`--${B}--\r\n`, 'utf8');
const body = (order, buf, name, mime) => order === 'file' ? Buffer.concat([filePart(buf, name, mime), tokenPart(), closing()]) : Buffer.concat([tokenPart(), filePart(buf, name, mime), closing()]);
const rawPost = (roomId, contentType, bodyBuf) => new Promise((resolve) => {
  const u = new URL(`${BASE}/api/room/${roomId}/upload`);
  const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', rejectUnauthorized: false, headers: { 'Content-Type': contentType, 'Content-Length': bodyBuf.length } }, (res) => { let d = ''; res.on('data', (c) => (d += c)); res.on('end', () => { let j = {}; try { j = JSON.parse(d); } catch {} resolve({ status: res.statusCode, body: j }); }); });
  req.on('error', (e) => resolve({ status: 0, body: { error: String(e.message) } })); req.write(bodyBuf); req.end();
});
const getContent = (uuid) => new Promise((resolve) => {
  const u = new URL(`${BASE}/api/room/file/${encodeURIComponent(uuid)}/content?token=${encodeURIComponent(SYSTEST)}`);
  const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'GET', rejectUnauthorized: false }, (res) => { const c = []; res.on('data', (x) => c.push(x)); res.on('end', () => resolve({ status: res.statusCode, buf: Buffer.concat(c) })); });
  req.on('error', () => resolve({ status: 0, buf: Buffer.alloc(0) })); req.end();
});

R(`prod confirm: ${BASE} (SystemTester ${SYSTEST.slice(0, 8)})`);
const browser = await webkit.launch();
const results = [];
let roomId = null;
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, SYSTEST); // seed ONLY the id — NEVER rawbin-name (that WRITE overwrote SystemTester once)
  const page = await ctx.newPage();
  await page.goto(BASE + '/app', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  // SystemTester is already profile-committed on prod → createRoom directly. If it needs a commit, set name:'SystemTester' (its
  // OWN name — no pollution), never a 'User NNN'. ONE room, deleted at the end.
  roomId = await page.evaluate(async () => { const c = window.__rawbinClient; if (!c?.createRoom) return null; c.createRoom('R4090 prod confirm', 'SystemTester'); for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  if (!roomId) { await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' })); await sleep(2000); roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('R4090 prod confirm', 'SystemTester'); for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; }); }
  R(`  room=${roomId ? roomId.slice(0, 12) : 'NULL'}`);
  if (!roomId) throw new Error('no-room on prod (SystemTester createRoom failed)');

  // Tron's exact failing shapes on his surface. Unique bytes per upload (defeat content-hash dedup) so each is verified distinct.
  const shapes = [
    { id: 'P1 quoted ·file-first ', ct: `multipart/form-data; boundary="${B}"`, order: 'file' },
    { id: 'P2 quoted ·token-first', ct: `multipart/form-data; boundary="${B}"`, order: 'token' },
    { id: 'P3 ;charset·file-first ', ct: `multipart/form-data; boundary=${B}; charset=utf-8`, order: 'file' },
  ];
  for (const s of shapes) {
    const png = crypto.randomBytes(473008); png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
    for (let i = 1000; i < png.length - 8; i += 50000) { png.set([0x0d, 0x0a, 0x0d, 0x0a], i); }
    const srcSha = shaOf(png);
    const up = await rawPost(roomId, s.ct, body(s.order, png, 'IMG_5399.png', 'image/png'));
    let integrityOk = false, served = '-';
    if (up.status === 200 && up.body.uuid) { const g = await getContent(up.body.uuid); served = g.buf.length; integrityOk = shaOf(g.buf) === srcSha; }
    const pass = up.status === 200 && Number(up.body.size) === png.length && integrityOk;
    results.push({ ...s, status: up.status, size: up.body.size, src: png.length, integrityOk, uuid: up.body.uuid, pass });
    R(`  ${s.id}: status=${up.status} parsed=${up.body.size}/${png.length}b byteSha=${integrityOk ? 'MATCH' : 'MISMATCH(' + served + ')'} err=${up.body.error || '-'} ⇒ ${pass ? 'PASS' : 'FAIL'}`);
    await sleep(400);
  }

  // CLEANUP: delete the ONE room we created (SystemTester owns it). Report residual honestly.
  await page.evaluate((rid) => window.__rawbinClient?.deleteRoom?.(rid), roomId);
  await sleep(1500);
  R(`  cleanup: deleteRoom(${roomId.slice(0, 8)}) sent (uploaded file units may persist until a server restart — flagged)`);
  await ctx.close();
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 200)}`); }
finally { await browser.close().catch(() => {}); }

R(`\n═══ R40.90 PROD CONFIRMATION (Tron's surface, v0.8.190) ═══`);
for (const r of results) R(`  ${r.id}: ${r.pass ? 'GREEN' : 'RED'} (status ${r.status}, parsed ${r.size}/${r.src}b, byte-integrity ${r.integrityOk ? 'MATCH' : 'NO'})`);
const green = results.length === 3 && results.every((r) => r.pass);
R(`OVERALL: ${green ? 'GREEN — his failing shapes now SUCCEED on prod with byte-correct content' : 'RED / INCOMPLETE'}`);
process.exit(green ? 0 : 1);
