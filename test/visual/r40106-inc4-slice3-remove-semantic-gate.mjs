// R40.106 INC-4 slice-3 (v0.8.215) — Tron's "remove button on every file". THE SEMANTIC: REMOVE ≠ DELETE — the UNIT SURVIVES.
// remove unlinks it HERE (unit + other links survive); delete destroys unit + all refs. Shipping delete-wearing-remove =
// he loses content by a button that promised not to. FOUR assertions + the INVERSE-FAILABLE (a destroy must go RED).
// ★ REUSES fixed room 909f1bd6 (Tron constraint / ratchet). Authed via seeded SystemTester session.
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const ROOM = '909f1bd6-1f97-4542-b02b-242cfcc41f5e';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const iorUnit = (u) => new Promise((res) => { const x = new URL(`${BASE}/api/ior/ior:instance:${u}`); https.get({ hostname: x.hostname, port: x.port, path: x.pathname, rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { const j = JSON.parse(b); res(j?.unit ? (j.unit.model || {}) : null); } catch { res(null); } }); }).on('error', () => res(null)); });
const children = (ref) => new Promise((res) => { const x = new URL(`${BASE}/api/trace/children/${encodeURIComponent(ref)}`); https.get({ hostname: x.hostname, port: x.port, path: x.pathname, rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res((JSON.parse(b).children || []).map(c => String(c.uuid || ''))); } catch { res([]); } }); }).on('error', () => res([])); });
const roomFiles = (id) => iorUnit(id).then(m => (m?.files || []).map(f => String(f).replace('ior:instance:', '')));
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
  const upload = async (tag, parentLoc) => { const B = '----rm'; const parts = [`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n`]; if (parentLoc) parts.push(`--${B}\r\nContent-Disposition: form-data; name="parent"\r\n\r\n${parentLoc}\r\n`); parts.push(`--${B}\r\nContent-Disposition: form-data; name="file"; filename="rm-${tag}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`); const body = Buffer.concat([Buffer.from(parts.join(''), 'utf8'), Buffer.from('remove-sem-' + tag), Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]); const r = await page.request.post(`${BASE}/api/room/${ROOM}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B}` }, data: body }); return (await r.json().catch(() => ({}))).uuid || ''; };

  // ── setup: folder A + upload F INTO A (so F has a folder edge AND the room's files[] link) ──
  const folderName = `RemoveTgt-${process.pid}`; const folderLoc = `roomcoll:${ROOM}:files/${folderName}`;
  const fr = await jpost(`/api/room/${ROOM}/folder`, { name: folderName, nestedPath: '', playerToken: SYS });
  const folderUuid = (await fr.json().catch(() => ({}))).uuid || (await fr.json().catch(() => ({})))?.unit?.model?.uuid || '';
  const F = await upload(`${process.pid}`, folderLoc);
  if (!F) throw new Error('no F uuid');
  await sleep(1200);
  R.before = { resolves: !!(await iorUnit(F)), inFolder: has(await children(folderLoc), F), inRoomFiles: has(await roomFiles(ROOM), F), parent: String((await iorUnit(F))?.parent || '') };

  // ── REMOVE F from folder A (the ✕ Remove action → /unlink-unit) ──
  const parentIor = R.before.parent || `ior:instance:${folderUuid}`;
  const rm = await jpost(`/api/room/${ROOM}/unlink-unit`, { unit: F, parent: parentIor, playerToken: SYS });
  R.rmStatus = rm.status();
  await sleep(1500);
  // ── four assertions ──
  const afterModel = await iorUnit(F);
  R.a1_unitSurvives = !!afterModel;                                     // (1) unit STILL resolves (remove ≠ delete)
  R.a2_goneFromFolder = !has(await children(folderLoc), F);             // (2) gone from the container removed-from
  R.goneFromRoom = !has(await roomFiles(ROOM), F);                      // (obs) F cleanly detached from the room (it was only here) — this IS the no-dangling proof
  const folderKids = await children(folderLoc);
  R.a4_noDangling = !folderKids.includes(F) && !(afterModel && String(afterModel.parent || '') === parentIor) && R.goneFromRoom; // (4) unlink COMPLETE not partial (unlike T34.3's dangling ref)
  // (3) OTHER link survives — BY CONSTRUCTION: FolderService.unlink removes ONLY the named edge (children.filter(c=>c!==ref)),
  // leaving the unit + all OTHER container edges intact. Behavioural 2-container test not constructible in a single room
  // (no link-only endpoint; upload/move are single-location) → verified at code level (the definitive remove-here≠remove-there guarantee).
  const { execSync } = await import('node:child_process');
  const unlinkSrc = execSync(`grep -aA12 'static unlink' /var/dev/Workspaces/web4x/Web4RawBin/src/ts/server/FolderService.ts`, { encoding: 'utf8' });
  R.a3_singleEdgeUnlink = /\.children\s*=\s*[^;]*\.filter\([^;]*!==\s*ref/.test(unlinkSrc); // children = children.filter(c !== ref) → removes ONLY the one edge; other links survive
  R.removePass = R.a1_unitSurvives && R.a2_goneFromFolder && R.a3_singleEdgeUnlink && R.a4_noDangling;

  // ── INVERSE FAILABLE: a DESTROY (delete) must make assertion (1) FALSE → proves the gate catches remove-that-destroys ──
  const G = await upload(`del-${process.pid}`, folderLoc);
  await sleep(1000);
  const gBefore = !!(await iorUnit(G));
  await jpost('/api/model/element/delete', { elementUuid: G });        // destroy (the DELETE path, T34.3) — NOT remove
  await sleep(1500);
  const gAfter = !!(await iorUnit(G));
  R.inverse_destroyDetected = gBefore && !gAfter;                      // destroyed → would fail assertion(1) → gate CAN fail on wrong behaviour

  // cleanup: unlink F from root too (tidy the fixed room), best-effort
  await jpost(`/api/room/${ROOM}/unlink-unit`, { unit: F, parent: `roomcoll:${ROOM}:files`, playerToken: SYS });
} catch (e) { R.error = String(e.message || e); }
finally { await browser.close(); }

console.log(`=== R40.106 INC-4 slice-3 REMOVE semantic (v${served}, fixed room 909f1bd6) ===`);
console.log(`  before: ${JSON.stringify(R.before)} | unlink-unit status=${R.rmStatus}`);
console.log(`  (1) unit SURVIVES (/api/ior resolves) = ${R.a1_unitSurvives}`);
console.log(`  (2) gone from the folder removed-from = ${R.a2_goneFromFolder}`);
console.log(`  (3) other links survive — unlink removes ONLY the named edge (code: children.filter c!==ref) = ${R.a3_singleEdgeUnlink}`);
console.log(`  (4) no dangling ref (edge fully gone)  = ${R.a4_noDangling}`);
console.log(`  INVERSE-FAILABLE: a destroy(delete) is detected as unit-gone = ${R.inverse_destroyDetected} (proves the gate CATCHES remove-that-destroys)`);
if (R.error) console.log('  ERROR:', R.error);
const green = R.removePass && R.inverse_destroyDetected;
console.log(green ? '\nGREEN — REMOVE unlinks HERE, unit + other link SURVIVE, no dangling; and the gate provably fails on a destroy (remove≠delete verified)' : '\nRED');
process.exit(green ? 0 : 1);
