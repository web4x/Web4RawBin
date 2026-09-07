// T37.20 INC-3 / R40.104 — the '✎ Rename…' affordance. A unit rename sets model.displayName (WINS), keeps the
// uuid/ior STABLE, and PRESERVES originalName (the pre-rename name). Live 0.8.209+, SystemTester, via the SAME
// /api/room/<id>/rename-unit route the affordance calls (UnitController.apply seam). DET-3x.
// (a) displayName === the new name · (b) uuid + ior UNCHANGED · (c) originalName preserved (= pre-rename name).
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const post = (path, body) => new Promise((res) => { const u = new URL(`${BASE}${path}`); const data = Buffer.from(JSON.stringify(body)); const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', rejectUnauthorized: false, headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { let j = {}; try { j = JSON.parse(d); } catch {} res({ status: r.statusCode, body: j }); }); }); req.on('error', (e) => res({ status: 0, body: { error: String(e.message) } })); req.write(data); req.end(); });
const iorUnit = (uuid) => new Promise((res) => { const u = new URL(`${BASE}/api/ior/ior:instance:${uuid}`); https.get({ hostname: u.hostname, port: u.port, path: u.pathname, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { const j = JSON.parse(d); res({ ior: j?.unit?.ior, model: j?.unit?.model || {} }); } catch { res({ ior: null, model: {} }); } }); }).on('error', () => res({ ior: null, model: {} })); });

async function renameOnce(page, roomId, tag) {
  const B = '----inc3'; const bytes = Buffer.from('inc3-rename-' + tag + '-' + roomId.slice(0, 6));
  const upBody = Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="inc3-orig-${tag}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), bytes, Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]);
  const up = await page.request.post(`${BASE}/api/room/${roomId}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B}` }, data: upBody });
  const fUuid = (await up.json().catch(() => ({}))).uuid || '';
  if (!fUuid) return { tag, error: 'no file uuid', pass: false };
  await sleep(1000);
  const pre = await iorUnit(fUuid);
  const preName = String(pre.model.displayName || pre.model.name || '');
  const newName = `INC3 Renamed ${tag} ${roomId.slice(0, 4)}`;
  const r = await post(`/api/room/${roomId}/rename-unit`, { unit: fUuid, displayName: newName, playerToken: SYS });
  await sleep(1200);
  const postU = await iorUnit(fUuid);
  const dn = String(postU.model.displayName || '');
  const orig = String(postU.model.originalName ?? '');
  const out = {
    tag, fUuid: fUuid.slice(0, 8), status: r.status, preName, newName, displayName: dn, originalName: orig,
    uuidStable: postU.model.uuid === fUuid,
    iorStable: pre.ior === postU.ior && !!postU.ior,
    displayNameSet: dn === newName,
    originalPreserved: orig === preName && !!preName, // originalName = the pre-rename name
  };
  out.pass = out.displayNameSet && out.uuidStable && out.iorStable && out.originalPreserved;
  return out;
}

const browser = await webkit.launch();
const runs = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  const served = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  for (let i = 1; i <= 3; i++) {
    const roomId = await page.evaluate(async (t) => { const c = window.__rawbinClient; c.createRoom('INC3 rename ' + t, 'SystemTester'); for (let k = 0; k < 60; k++) { await new Promise((r) => setTimeout(r, 250)); const el = document.getElementById('room-tree'); if (el?.getAttribute('data-seed-ior')) return el.getAttribute('data-seed-ior'); } return null; }, `r${i}`);
    if (!roomId) { runs.push({ tag: `r${i}`, error: 'no room', pass: false }); continue; }
    const r = await renameOnce(page, roomId, `r${i}`);
    r.served = served;
    runs.push(r);
    console.log(`run ${i}: served=${r.served} f=${r.fUuid} status=${r.status} '${r.preName}'→displayName='${r.displayName}' originalName='${r.originalName}' uuidStable=${r.uuidStable} iorStable=${r.iorStable} => ${r.pass ? 'GREEN' : 'RED'}${r.error ? ' err=' + r.error : ''}`);
  }
} finally { await browser.close(); }

const green = runs.length === 3 && runs.every(r => r.pass);
console.log('\n=== INC-3 / R40.104 Rename (DET-3x) ===');
console.log(green ? "GREEN — displayName WINS, uuid+ior STABLE, originalName PRESERVED" : 'RED');
process.exit(green ? 0 : 1);
