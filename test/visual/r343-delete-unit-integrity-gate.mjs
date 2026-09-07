// T34.3 in-room UNIT-delete R40.106-INTEGRITY gate (planner-requested, Done-hit measure).
// A unit delete DOES touch scenario/index → test the room finding's closest analog. On a SystemTester scratch room,
// upload a file F (→ canonical scenario/index unit + F in room.files[]), then DELETE F via the destroy-unit endpoint
// (/api/model/element/delete — the only unit-destroy route the client has), and assert R40.106 integrity:
//   (1) canonical scenario/index unit GONE on disk (served tree == this repo), (2) /api/ior null,
//   (3) 0 room files[] refs, (4) survives restart (canonical file gone → reload can't restore).
// ALSO measure whether an in-room DELETE AFFORDANCE exists for a file (applicableActionsFor) — T34.3 claims one.
// FAILABLE: if the canonical scenario/index unit SURVIVES after delete (in-memory/view-only removal = the room-delete
// pattern reaching this surface) → RED = a measured false-Done on Tron's surface.
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const shard = (u) => `${REPO}/scenario/index/${u[0]}/${u[1]}/${u[2]}/${u[3]}/${u[4]}/${u}.scenario.json`;
const post = (path, body) => new Promise((res) => { const u = new URL(`${BASE}${path}`); const data = Buffer.from(JSON.stringify(body)); const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', rejectUnauthorized: false, headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => { let j = {}; try { j = JSON.parse(d); } catch {} res({ status: r.statusCode, body: j }); }); }); req.on('error', (e) => res({ status: 0, body: { error: String(e.message) } })); req.write(data); req.end(); });
const iorResolves = (u) => new Promise(res => { https.get(`${BASE}/api/ior/ior:instance:${u}`, { rejectUnauthorized: false }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(!!JSON.parse(d)?.unit); } catch { res(false); } }); }).on('error', () => res(false)); });
const roomFiles = (roomId) => new Promise(res => { https.get(`${BASE}/api/ior/ior:instance:${roomId}`, { rejectUnauthorized: false }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res((JSON.parse(d)?.unit?.model?.files || []).map(String)); } catch { res([]); } }); }).on('error', () => res([])); });

// affordance existence: does applicableActionsFor offer a delete verb for a file? (informational)
function fileOffersDelete() {
  const tmp = `${REPO}/test/visual/.r343-aff.ts`;
  const code = ["import { applicableActionsFor, UNIVERSAL_DECLS } from '../../src/public/ts/trace/action-applicability.ts';", "const off = applicableActionsFor({ type: 'file' }, {}, UNIVERSAL_DECLS).offered.map((a:any)=>a.verb);", "console.log(JSON.stringify(off.filter((v:string)=>/delete/i.test(v))));"].join('\n');
  try { execSync(`cat > ${tmp}`, { input: code }); const out = execSync(`npx tsx ${tmp}`, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); execSync(`rm -f ${tmp}`); return JSON.parse(out.trim().split('\n').pop()); } catch (e) { try { execSync(`rm -f ${tmp}`); } catch {} return ['(resolver err)']; }
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
    const roomId = await page.evaluate(async (t) => { const c = window.__rawbinClient; c.createRoom('T343 del ' + t, 'SystemTester'); for (let k = 0; k < 60; k++) { await new Promise((r) => setTimeout(r, 250)); const el = document.getElementById('room-tree'); if (el?.getAttribute('data-seed-ior')) return el.getAttribute('data-seed-ior'); } return null; }, `r${i}`);
    if (!roomId) { runs.push({ tag: `r${i}`, error: 'no room', pass: false }); continue; }
    const Bd = '----t343'; const bytes = Buffer.from('t343-del-' + i + '-' + roomId.slice(0, 6));
    const upBody = Buffer.concat([Buffer.from(`--${Bd}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${Bd}\r\nContent-Disposition: form-data; name="file"; filename="t343-del-${i}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), bytes, Buffer.from(`\r\n--${Bd}--\r\n`, 'utf8')]);
    const up = await page.request.post(`${BASE}/api/room/${roomId}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${Bd}` }, data: upBody });
    const F = (await up.json().catch(() => ({}))).uuid || '';
    if (!F) { runs.push({ tag: `r${i}`, error: 'no file uuid', pass: false }); continue; }
    await sleep(1200);
    const unitExisted = existsSync(shard(F));
    const inFilesBefore = (await roomFiles(roomId)).some(f => f.includes(F));
    // DELETE the unit via the destroy-unit endpoint
    const del = await post('/api/model/element/delete', { elementUuid: F });
    await sleep(1500);
    const unitGone = !existsSync(shard(F));            // ★ canonical scenario/index file removed on disk
    const iorGone = !(await iorResolves(F));
    const refGone = !(await roomFiles(roomId)).some(f => f.includes(F));
    const r = { tag: `r${i}`, served, F: F.slice(0, 8), delStatus: del.status, unitExisted, inFilesBefore, unitGone, iorGone, refGone };
    r.pass = unitExisted && inFilesBefore && unitGone && iorGone && refGone;
    runs.push(r);
    console.log(`run ${i}: F=${r.F} del-status=${r.delStatus} | pre(unit=${unitExisted},inFiles=${inFilesBefore}) → ★unitGone=${unitGone} iorNull=${iorGone} refGone=${refGone} => ${r.pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

const affordance = fileOffersDelete();
console.log(`\n  in-room DELETE affordance for a file (applicableActionsFor): ${JSON.stringify(affordance)} ${affordance.length ? '(present)' : '(NONE — no delete verb offered on a file detail)'}`);
const green = runs.length === 3 && runs.every(r => r.pass);
console.log('=== T34.3 in-room unit-delete R40.106-INTEGRITY (DET-3x) ===');
console.log(green ? 'GREEN — the unit delete durably removes the canonical scenario/index unit + room ref (survives restart). Pattern does NOT reach T34.3.' : 'RED — the unit-delete did NOT durably destroy the canonical scenario/index unit (measured false-Done on the delete-integrity surface). Provenance-question to PO.');
process.exit(green ? 0 : 1);
