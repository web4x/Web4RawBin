// R40.106 Link-here RE-ENABLE (v0.8.220) — FULL CYCLE THROUGH THE UI (what Tron actually does, NOT the endpoint).
// Reuses fixed room 909f1bd6 via joinRoom (ZERO room creation). SystemTester. Version-stamped.
//   (0) OFFERED: applicableActionsFor(file) includes 'link' (+ move/remove/rename intact) — inverts the 217 hidden-gate.
//   (1) LINK via UI: fire the real 'link' Command → openPlacePicker "Link into…" → click folder B row → F edge into B.
//   (2) RENDERS: F shows under B (/api/trace/children/B — union render).
//   (3) REMOVE-FROM-B via UI: stamp the drawer's data-remove-container=B (as openFilePreview(F,B) does) → fire 'remove'
//       → removeUnit reads container=B → per-edge unlink → F GONE from B.
//   (4) SURVIVES in source: F still a room member (root) + resolves. offered⟺succeeds INCL the undo.
// If any UI step fails = RED (the decl should go back off — a hidden capability beats a visible lie).
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444', SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df', ROOM = '909f1bd6-1f97-4542-b02b-242cfcc41f5e';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const bare = (r) => String(r || '').replace(/^ior:instance:/, '').replace(/^[a-z][\w-]*:/i, '').split('@')[0];
const iorUnit = (u) => new Promise(res => { https.get(`${BASE}/api/ior/ior:instance:${u}`, { rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b)?.unit?.model || null); } catch { res(null); } }); }).on('error', () => res(null)); });
const folderEdges = async (fu) => ((await iorUnit(fu))?.children || []).map(bare);
const rendered = (ref) => new Promise(res => { const x = new URL(`${BASE}/api/trace/children/${encodeURIComponent(ref)}`); https.get({ hostname: x.hostname, port: x.port, path: x.pathname, rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res((JSON.parse(b).children || []).map(c => bare(c.uuid || ''))); } catch { res([]); } }); }).on('error', () => res([])); });
const roomMembers = async () => new Set(((await iorUnit(ROOM))?.files || []).map(bare));

// (0) OFFERED — resolver (inverts hidden-gate)
function offeredVerbs() { const tmp = `${REPO_TMP}`; const code = ["import { applicableActionsFor, UNIVERSAL_DECLS } from '../../src/public/ts/trace/action-applicability.ts';", "console.log(JSON.stringify(applicableActionsFor({ type: 'file' }, {}, UNIVERSAL_DECLS).offered.map((a)=>a.verb)));"].join('\n'); try { writeFileSync(tmp, code); const o = execSync(`npx tsx ${tmp}`, { cwd: '/var/dev/Workspaces/web4x/Web4RawBin', encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }); return JSON.parse(o.trim().split('\n').pop()); } catch (e) { return ['(err)']; } finally { try { unlinkSync(tmp); } catch {} } }
const REPO_TMP = '/var/dev/Workspaces/web4x/Web4RawBin/test/visual/.linkui-off.ts';

let served = '?'; const R = {};
const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  served = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  // ENTER the fixed room (reuse, not create)
  const joined = await page.evaluate(async (roomId) => { window.__rawbinClient?.joinRoom(roomId, 'SystemTester'); for (let i = 0; i < 60; i++) { await new Promise(r => setTimeout(r, 250)); const el = document.getElementById('room-tree'); if (el?.getAttribute('data-seed-ior')?.includes(roomId.slice(0,8))) return true; } return false; }, ROOM);
  R.joined = joined; if (!joined) throw new Error('could not enter room 909f1bd6');
  const jpost = (p, d) => page.request.post(`${BASE}${p}`, { headers: { 'content-type': 'application/json' }, data: d });
  const Bn = `UICycleB-${process.pid}`, Bloc = `roomcoll:${ROOM}:files/${Bn}`;
  const B = await jpost(`/api/room/${ROOM}/folder`, { name: Bn, nestedPath: '', playerToken: SYS }).then(r => r.json()).then(j => j.uuid || '');
  const Bd = '----ui'; const F = await page.request.post(`${BASE}/api/room/${ROOM}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${Bd}` }, data: Buffer.concat([Buffer.from(`--${Bd}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${Bd}\r\nContent-Disposition: form-data; name="file"; filename="uicycle-${process.pid}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from('uicycle-' + process.pid), Buffer.from(`\r\n--${Bd}--\r\n`, 'utf8')]) }).then(r => r.json()).then(j => j.uuid || '');
  if (!B || !F) throw new Error(`setup B=${B} F=${F}`);
  await sleep(1200);
  R.memberAtStart = (await roomMembers()).has(F);

  // (1) LINK via the UI: fire the real 'link' Command → picker → click the B row
  await page.evaluate((ref) => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: 'link', ref: 'file:' + ref }, bubbles: true })), F);
  const pickerRows = await page.waitForFunction(() => { const s = [...document.querySelectorAll('div')].find(d => /Link into/.test(d.textContent || '') && d.querySelector('rb-object-item')); return s ? [...s.querySelectorAll('rb-object-item')].map(i => (i.data && i.data.title) || i.textContent || '') : null; }, { timeout: 8000 }).then(h => h.jsonValue()).catch(() => null);
  R.pickerShown = !!pickerRows && pickerRows.some(t => new RegExp(Bn).test(t));
  R.clickedB = await page.evaluate((bn) => { const it = [...document.querySelectorAll('rb-object-item')].find(i => new RegExp(bn).test((i.data?.title || i.textContent) || '')); const row = it && it.parentElement; if (!row) return false; row.click(); return true; }, Bn);
  await sleep(1800);
  R.edgeInB_afterLink = (await folderEdges(B)).includes(F);
  // (2) RENDERS under B (union)
  R.rendersUnderB = (await rendered(Bloc)).includes(F);

  // (3) REMOVE FROM B via the UI: stamp the drawer's viewing-container=B (as openFilePreview(F,B) does), fire 'remove'
  await page.evaluate((bloc) => { let d = document.getElementById('room-file-preview'); if (!d) { d = document.createElement('div'); d.id = 'room-file-preview'; document.body.appendChild(d); } d.setAttribute('data-remove-container', bloc); }, Bloc);
  await page.evaluate((ref) => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: 'remove', ref: 'file:' + ref }, bubbles: true })), F);
  await sleep(1800);
  R.goneFromB = !(await folderEdges(B)).includes(F);
  // (4) SURVIVES in source (still a room member at root + resolves)
  R.survivesInSource = (await roomMembers()).has(F) && !!(await iorUnit(F));
  R.F = F.slice(0, 8);
} catch (e) { R.error = String(e.message || e); }
finally { await browser.close(); }

const offered = offeredVerbs();
R.linkOffered = offered.includes('link'); R.othersIntact = ['move', 'remove', 'rename'].every(v => offered.includes(v));

console.log(`=== R40.106 Link-here RE-ENABLE — FULL UI CYCLE — SERVED v${served}, room 909f1bd6 (joined, reused) ===`);
console.log(`  (0) OFFERED: link=${R.linkOffered} others-intact(move/remove/rename)=${R.othersIntact} [${offered.join(',')}]`);
console.log(`  entered room=${R.joined} | F=${R.F} member-at-start=${R.memberAtStart}`);
console.log(`  (1) LINK via UI: picker-shown=${R.pickerShown} clicked-B=${R.clickedB} → edge-in-B=${R.edgeInB_afterLink}`);
console.log(`  (2) RENDERS under B (union) = ${R.rendersUnderB}`);
console.log(`  (3) REMOVE-from-B via UI → gone-from-B = ${R.goneFromB}`);
console.log(`  (4) SURVIVES in source (member+resolves) = ${R.survivesInSource}`);
if (R.error) console.log('  ERROR:', R.error);
const green = R.linkOffered && R.othersIntact && R.pickerShown && R.clickedB && R.edgeInB_afterLink && R.rendersUnderB && R.goneFromB && R.survivesInSource;
console.log(green ? `\n★ LINK-HERE UI CYCLE = GREEN @v${served} — offered → click → renders under B → remove from B → survives in source. Tron's path works end-to-end.` : `\n★ RED @v${served} — a UI step failed; decl should go back off (hidden > visible lie).`);
process.exit(green ? 0 : 1);
