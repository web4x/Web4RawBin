// R40.106 INC-4 slice-4 (v0.8.216) — additive "🔗 Link here…". A LINK adds a containment edge and KEEPS the source
// edge (N-link, unit in MULTIPLE containers); the DRAG stays MOVE (single-location). Gate: (A) link is ADDITIVE
// (F ends in BOTH containers, source kept), (B) OCP (registerAction, kind-generic), (C) BONUS — this now makes the
// remove-(3) behavioural constructible: link F into A+B, REMOVE from A → F still in B (other link survives), the
// behavioural I could only code-verify at slice-3. ★ REUSES fixed room 909f1bd6 (0 room creation).
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { execSync } from 'node:child_process';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const ROOM = '909f1bd6-1f97-4542-b02b-242cfcc41f5e';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const iorUnit = (u) => new Promise((res) => { const x = new URL(`${BASE}/api/ior/ior:instance:${u}`); https.get({ hostname: x.hostname, port: x.port, path: x.pathname, rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { const j = JSON.parse(b); res(j?.unit ? (j.unit.model || {}) : null); } catch { res(null); } }); }).on('error', () => res(null)); });
const children = (ref) => new Promise((res) => { const x = new URL(`${BASE}/api/trace/children/${encodeURIComponent(ref)}`); https.get({ hostname: x.hostname, port: x.port, path: x.pathname, rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res((JSON.parse(b).children || []).map(c => String(c.uuid || ''))); } catch { res([]); } }); }).on('error', () => res([])); });
const has = (list, F) => list.some(u => u === F || u.startsWith(F.slice(0, 8)));

const browser = await webkit.launch();
const R = {}; let served = '?';
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  served = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  const jpost = (path, data) => page.request.post(`${BASE}${path}`, { headers: { 'content-type': 'application/json' }, data });
  const mkFolder = async (name) => { const r = await jpost(`/api/room/${ROOM}/folder`, { name, nestedPath: '', playerToken: SYS }); const j = await r.json().catch(() => ({})); return j.uuid || j?.unit?.model?.uuid || ''; };
  const A = `LinkA-${process.pid}`, Bn = `LinkB-${process.pid}`; const aLoc = `roomcoll:${ROOM}:files/${A}`, bLoc = `roomcoll:${ROOM}:files/${Bn}`;
  const aU = await mkFolder(A); const bU = await mkFolder(Bn);
  // upload F into folder A
  const Bd = '----lk'; const up = await page.request.post(`${BASE}/api/room/${ROOM}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${Bd}` }, data: Buffer.concat([Buffer.from(`--${Bd}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${Bd}\r\nContent-Disposition: form-data; name="parent"\r\n\r\n${aLoc}\r\n--${Bd}\r\nContent-Disposition: form-data; name="file"; filename="lk-${process.pid}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from('link-here-' + process.pid), Buffer.from(`\r\n--${Bd}--\r\n`, 'utf8')]) });
  const F = (await up.json().catch(() => ({}))).uuid || '';
  if (!F) throw new Error('no F uuid');
  await sleep(1200);
  R.setup = { inA: has(await children(aLoc), F), inB0: has(await children(bLoc), F), resolves: !!(await iorUnit(F)) };
  // (A) LINK F into B (additive) — source edge A KEPT
  const lk = await jpost(`/api/room/${ROOM}/link-unit`, { unit: F, target: `folder:${bLoc}`, playerToken: SYS });
  R.linkStatus = lk.status();
  await sleep(1500);
  const inA_afterLink = has(await children(aLoc), F); const inB_afterLink = has(await children(bLoc), F);
  R.additive = inA_afterLink && inB_afterLink && !!(await iorUnit(F)); // in BOTH A and B (source kept) + survives = additive N-link, not a move
  // (C) BONUS remove-(3) behavioural: now REMOVE F from A → still in B (other link survives)
  const rm = await jpost(`/api/room/${ROOM}/unlink-unit`, { unit: F, parent: `ior:instance:${aU}`, playerToken: SYS });
  R.rmStatus = rm.status();
  await sleep(1500);
  const inA_afterRm = has(await children(aLoc), F); const inB_afterRm = has(await children(bLoc), F); const survivesAfterRm = !!(await iorUnit(F));
  R.removeOtherSurvives = !inA_afterRm && inB_afterRm && survivesAfterRm; // gone from A, STILL in B, unit survives = remove-here≠remove-there (behavioural)
  // cleanup: unlink from B too
  await jpost(`/api/room/${ROOM}/unlink-unit`, { unit: F, parent: `ior:instance:${bU}`, playerToken: SYS });
} catch (e) { R.error = String(e.message || e); }
finally { await browser.close(); }

// (B) OCP: 'link' registered kind-generically (registry) + INC-1 verb-dispatch lint stays 0
const linkRegistered = /registerAction\('link'/.test(execSync(`grep -a "registerAction('link'" /var/dev/Workspaces/web4x/Web4RawBin/src/public/ts/RoomView.ts || true`, { encoding: 'utf8' }));
let inc1 = false; try { execSync(`node /var/dev/Workspaces/web4x/Web4RawBin/test/visual/r3720-inc1-verb-dispatch-lint.mjs`, { encoding: 'utf8' }); inc1 = true; } catch { inc1 = false; }
R.ocp = linkRegistered && inc1;

console.log(`=== R40.106 INC-4 slice-4 LINK-here (v${served}, fixed room 909f1bd6) ===`);
console.log(`  setup: F in A=${R.setup?.inA} (B empty=${R.setup?.inB0 === false}) resolves=${R.setup?.resolves} | link-unit=${R.linkStatus} unlink=${R.rmStatus}`);
console.log(`  (A) ADDITIVE link — F in BOTH A and B after link (source kept), survives = ${R.additive}`);
console.log(`  (B) OCP — link=registerAction (kind-generic) + INC-1 verb-dispatch lint 0 = ${R.ocp}`);
console.log(`  (C) remove-(3) BEHAVIOURAL now constructible — remove F from A → gone from A, STILL in B, survives = ${R.removeOtherSurvives}`);
if (R.error) console.log('  ERROR:', R.error);
const green = R.additive && R.ocp && R.removeOtherSurvives;
console.log(green ? '\nGREEN — Link-here is ADDITIVE (N-link, source kept, drag stays MOVE); OCP holds; and remove-here≠remove-there proven BEHAVIOURALLY (closes the slice-3 code-only (3))' : '\nRED');
process.exit(green ? 0 : 1);
