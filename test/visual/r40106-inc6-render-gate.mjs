// R40.106 INC-6 (edge-aware tree render + per-edge remove) — PRE-BUILT gate, ready to flip GREEN the moment INC-6 deploys.
// Uses the link-unit ENDPOINT directly (the "Link here" affordance is hidden on 0.8.217, but the data path works).
// Reuses fixed room 909f1bd6, ZERO room creation. Each assertion FAILABLE BOTH WAYS. Version-stamped.
//   (1) RENDER-SHOWS  — a linked file appears under the folder it was linked into (derivation honors the children[] edge).
//                       failable: a file NOT linked into that folder must NOT appear there.
//   (2) REMOVE-HERE≠THERE — unlink F from A leaves F present in B (per-edge remove). failable: removed from A, survives in B.
//   (3) NO-DOUBLE-RENDER — a unit reachable by BOTH location AND an edge into the SAME container renders EXACTLY ONCE.
//                       ★ COUNT not presence (a duplicate would pass a presence check). failable: count==1 GREEN, >=2 or 0 RED.
//   (4) DRAG-STILL-MOVES — covered by r40106-inc4-move-rewire-gate (hardened, GREEN); referenced, not duplicated here.
// PRE-INC-6 EXPECTATION: (1)+(2) RED-BASELINE (render location-only + unlink ignores per-edge); (3) passes trivially
// (location-only render = 1) and GUARDS the later union backfill. Flips all-GREEN when INC-6 lands.
import { webkit } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444', SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df', ROOM = '909f1bd6-1f97-4542-b02b-242cfcc41f5e';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const bare = (r) => String(r || '').replace(/^ior:instance:/, '').replace(/^[a-z][\w-]*:/i, '').split('@')[0];
const iorUnit = (u) => new Promise(res => { https.get(`${BASE}/api/ior/ior:instance:${u}`, { rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b)?.unit?.model || null); } catch { res(null); } }); }).on('error', () => res(null)); });
// rendered derivation (what the tree shows) — keep DUPLICATES so (3) can COUNT, not just detect presence
const rendered = (ref) => new Promise(res => { const x = new URL(`${BASE}/api/trace/children/${encodeURIComponent(ref)}`); https.get({ hostname: x.hostname, port: x.port, path: x.pathname, rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res((JSON.parse(b).children || []).map(c => bare(c.uuid || ''))); } catch { res([]); } }); }).on('error', () => res([])); });
const folderEdges = async (fu) => ((await iorUnit(fu))?.children || []).map(bare);
const countIn = (list, F) => list.filter(u => u === F).length;

const browser = await webkit.launch();
const R = {}; let served = '?';
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx); const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  served = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }));
  await sleep(1500);
  const jpost = (p, d) => page.request.post(`${BASE}${p}`, { headers: { 'content-type': 'application/json' }, data: d });
  const mkFolder = async (n) => { const r = await jpost(`/api/room/${ROOM}/folder`, { name: n, nestedPath: '', playerToken: SYS }); const j = await r.json().catch(() => ({})); return { uuid: j.uuid || j?.unit?.model?.uuid || '', loc: `roomcoll:${ROOM}:files/${n}` }; };
  const upload = async (tag, parentLoc) => { const B = '----i6'; const parts = [`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n`]; if (parentLoc) parts.push(`--${B}\r\nContent-Disposition: form-data; name="parent"\r\n\r\n${parentLoc}\r\n`); parts.push(`--${B}\r\nContent-Disposition: form-data; name="file"; filename="i6-${tag}-${process.pid}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`); const r = await page.request.post(`${BASE}/api/room/${ROOM}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${B}` }, data: Buffer.concat([Buffer.from(parts.join(''), 'utf8'), Buffer.from('i6-' + tag + '-' + process.pid), Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]) }); return (await r.json().catch(() => ({}))).uuid || ''; };
  const link = (F, floc) => jpost(`/api/room/${ROOM}/link-unit`, { unit: F, target: `folder:${floc}`, playerToken: SYS });
  const pollRendered = async (loc, F, want) => { for (let i = 0; i < 12; i++) { if (((await rendered(loc)).includes(F)) === want) break; await sleep(500); } return rendered(loc); };

  const A = await mkFolder(`I6A-${process.pid}`), B = await mkFolder(`I6B-${process.pid}`), C = await mkFolder(`I6C-${process.pid}`);
  const F = await upload('F', null);          // F at root
  const Gother = await upload('G', null);     // control: never linked into B
  await sleep(1000);

  // ── (1) RENDER-SHOWS: link F→B (edge), the derivation should show F under B; control G must NOT appear under B ──
  await link(F, B.loc); await sleep(1500);
  R.edgeInB = (await folderEdges(B.uuid)).includes(F);                 // data: the edge exists
  const bRender = await pollRendered(B.loc, F, true);
  R.renderShows = bRender.includes(F);                                // INC-6 deliverable: derivation honors the edge
  R.renderShows_control = !bRender.includes(Gother);                  // failable: an unlinked file does NOT appear
  R.a1 = R.renderShows && R.renderShows_control;

  // ── (2) REMOVE-HERE≠THERE: link F→A too, then unlink from A → gone from A edge, STILL in B edge ──
  await link(F, A.loc); await sleep(1200);
  await jpost(`/api/room/${ROOM}/unlink-unit`, { unit: F, parent: `ior:instance:${A.uuid}`, playerToken: SYS }); await sleep(1200);
  const aEdges = await folderEdges(A.uuid), bEdges = await folderEdges(B.uuid);
  R.removedFromA = !aEdges.includes(F); R.survivesInB = bEdges.includes(F); R.fResolves = !!(await iorUnit(F));
  R.a2 = R.removedFromA && R.survivesInB && R.fResolves;              // failable both ways: removed here (A) AND survives there (B)

  // ── (3) NO-DOUBLE-RENDER (COUNT): a unit in C by BOTH location AND an edge into C must render EXACTLY ONCE ──
  const D = await upload('D', C.loc);         // D.location = C (physical)
  await sleep(800); await link(D, C.loc); await sleep(1500);          // + an edge into the SAME container C (union case)
  const cRender = await pollRendered(C.loc, D, true);
  R.dCount = countIn(cRender, D);
  R.a3 = R.dCount === 1;                                              // exactly once — count, not presence (dup→2 RED, missing→0 RED)

  R.F = F.slice(0, 8);
} catch (e) { R.error = String(e.message || e); }
finally { await browser.close(); }

console.log(`=== R40.106 INC-6 PRE-BUILT gate — SERVED v${served}, fixed room 909f1bd6 ===`);
console.log(`  (1) RENDER-SHOWS: edgeInB=${R.edgeInB} render-shows-F=${R.renderShows} control(unlinked-not-shown)=${R.renderShows_control} => ${R.a1 ? 'GREEN' : 'RED (baseline pre-INC-6 — location-only render)'}`);
console.log(`  (2) REMOVE-HERE≠THERE: removed-from-A=${R.removedFromA} survives-in-B=${R.survivesInB} resolves=${R.fResolves} => ${R.a2 ? 'GREEN' : 'RED (baseline pre-INC-6 — unlink ignores per-edge parent)'}`);
console.log(`  (3) NO-DOUBLE-RENDER: D reachable by location+edge into C renders count=${R.dCount} (want exactly 1) => ${R.a3 ? 'GREEN' : 'RED'}  [COUNT not presence — guards the union backfill]`);
console.log(`  (4) DRAG-STILL-MOVES: see r40106-inc4-move-rewire-gate (hardened GREEN @v0.8.217).`);
if (R.error) console.log('  ERROR:', R.error);
const green = R.a1 && R.a2 && R.a3;
console.log(green ? `\n★ INC-6 VERDICT: GREEN @v${served} — render-shows, remove-here≠there, no-double-render all hold.` : `\n★ INC-6 PRE-BUILD @v${served}: (1)=${R.a1?'G':'R'} (2)=${R.a2?'G':'R'} (3)=${R.a3?'G':'R'} — (1)+(2) are the expected RED-BASELINE until INC-6 deploys; (3) guards the union branch now. Re-run on INC-6 deploy → expect all GREEN.`);
process.exit(green ? 0 : 1);
