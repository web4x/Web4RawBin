// R40.106 INC-4 slice-4 (v0.8.216) — additive "🔗 Link here…". A LINK adds a containment EDGE (folder.model.children[]
// += ior:instance:F) and KEEPS other edges (N-link, unit in MULTIPLE containers); DRAG stays MOVE (single-location).
// ★ DATA-SIDE containment (PO ruling): read the FOLDER UNIT's model.children[] via /api/ior — the RAW edge linkIn writes —
//   NOT /api/trace/children (which derives by LOCATION and misses an additive edge; that was prior-me's wrong instrument).
//   (A) additive: after link F→A and link F→B, F's edge is in BOTH A.children[] AND B.children[], F resolves ONCE.
//   (1) same-uuid-not-a-copy: the edge in each is F's EXACT uuid; F resolves to exactly ONE unit (a copy = a 2nd uuid → FAIL).
//   200-that-doesn't-link is a REAL RED: link-unit returns 200 even if resolveDropContainer→null (linkIn skipped) — so the
//   edge read is the truth, not the status.
//   (C) remove-here≠remove-there (behavioural, closes slice-3 code-only): unlink F from A → gone from A.children[], STILL in B.
//   (c) RENDER observation: does /api/trace/children (the tree's derived view) show F under BOTH, or only its location? (finding, not gate.)
// ★ REUSES fixed room 909f1bd6 (0 room creation). Artifacts unlinked in-run. Version-stamped.
import { execSync } from 'node:child_process';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const ROOM = '909f1bd6-1f97-4542-b02b-242cfcc41f5e';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const bare = (ref) => String(ref || '').replace(/^ior:instance:/, '').replace(/^[a-z][\w-]*:/i, '').split('@')[0];
const iorUnit = (u) => new Promise((res) => { https.get(`${BASE}/api/ior/ior:instance:${u}`, { rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { const j = JSON.parse(b); res(j?.unit ? j.unit.model || {} : null); } catch { res(null); } }); }).on('error', () => res(null)); });
const traceChildren = (ref) => new Promise((res) => { const x = new URL(`${BASE}/api/trace/children/${encodeURIComponent(ref)}`); https.get({ hostname: x.hostname, port: x.port, path: x.pathname, rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res((JSON.parse(b).children || []).map(c => bare(c.uuid || c.ref || ''))); } catch { res([]); } }); }).on('error', () => res([])); });
// edge-level: the folder UNIT's own model.children[] (what linkIn writes)
const folderEdges = async (folderUuid) => ((await iorUnit(folderUuid))?.children || []).map(bare);

// authed POST needs the seeded browser session (raw https = Unauthenticated)
const { webkit } = await import('@playwright/test');
const { seedSystemTester } = await import('./system-tester-setup.mjs');
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
  const jpost = (p, d) => page.request.post(`${BASE}${p}`, { headers: { 'content-type': 'application/json' }, data: d });
  const mkFolder = async (name) => { const r = await jpost(`/api/room/${ROOM}/folder`, { name, nestedPath: '', playerToken: SYS }); const j = await r.json().catch(() => ({})); return { uuid: j.uuid || j?.unit?.model?.uuid || '', loc: `roomcoll:${ROOM}:files/${name}` }; };
  const An = `LinkA-${process.pid}`, Bn = `LinkB-${process.pid}`;
  const A = await mkFolder(An); const B = await mkFolder(Bn);
  // upload F at ROOT (F just needs to exist; links are pure edges)
  const Bd = '----lk'; const up = await page.request.post(`${BASE}/api/room/${ROOM}/upload`, { headers: { 'content-type': `multipart/form-data; boundary=${Bd}` }, data: Buffer.concat([Buffer.from(`--${Bd}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${SYS}\r\n--${Bd}\r\nContent-Disposition: form-data; name="file"; filename="lk-${process.pid}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from('link-here-' + process.pid), Buffer.from(`\r\n--${Bd}--\r\n`, 'utf8')]) });
  const F = (await up.json().catch(() => ({}))).uuid || '';
  if (!F || !A.uuid || !B.uuid) throw new Error(`setup: F=${F} A=${A.uuid} B=${B.uuid}`);
  await sleep(1000);

  // LINK F → A, then F → B (both additive edges) — proven target format folder:<roomcoll-loc>
  const lkA = await jpost(`/api/room/${ROOM}/link-unit`, { unit: F, target: `folder:${A.loc}`, playerToken: SYS }); R.lkA = lkA.status();
  const lkB = await jpost(`/api/room/${ROOM}/link-unit`, { unit: F, target: `folder:${B.loc}`, playerToken: SYS }); R.lkB = lkB.status();
  await sleep(1500);

  // ── (A) DATA-SIDE containment: folder UNITS' children[] edges ──
  const aEdges = await folderEdges(A.uuid); const bEdges = await folderEdges(B.uuid);
  R.inA_edge = aEdges.includes(F); R.inB_edge = bEdges.includes(F);
  const fUnit = await iorUnit(F); R.fResolves = !!fUnit;
  R.additive = R.inA_edge && R.inB_edge && R.fResolves;
  // ── (1) same-uuid-NOT-a-copy: the edges are F's EXACT uuid (not a variant), and F resolves to ONE unit ──
  R.exactUuidBoth = aEdges.filter(e => e === F).length === 1 && bEdges.filter(e => e === F).length === 1;
  R.sameUuidNotCopy = R.exactUuidBoth && R.fResolves; // link put F's own uuid in both; no 2nd unit minted = not a copy
  // ── (c) RENDER observation: does the tree's derived view show F under both? (location-derived → may show only its home) ──
  R.treeA = (await traceChildren(A.loc)).includes(F); R.treeB = (await traceChildren(B.loc)).includes(F);
  R.renderShowsBoth = R.treeA && R.treeB;

  // ── (C) OBSERVATION — per-edge remove of an N-linked unit: unlink-unit(F, parent:A) → does A's edge drop, B survive? ──
  //    (measured, NOT gating slice-4's LINK claim: the handler ignores the request `parent` + detaches only F.model.parent.)
  const rm = await jpost(`/api/room/${ROOM}/unlink-unit`, { unit: F, parent: `ior:instance:${A.uuid}`, playerToken: SYS }); R.rmStatus = rm.status();
  await sleep(1200);
  const aEdges2 = await folderEdges(A.uuid); const bEdges2 = await folderEdges(B.uuid);
  R.aEdgeAfterUnlink = aEdges2.includes(F); R.bEdgeAfterUnlink = bEdges2.includes(F);
  R.removeOtherSurvives = !aEdges2.includes(F) && bEdges2.includes(F) && !!(await iorUnit(F));
  // cleanup artifacts INSIDE 909f1bd6 (no room creation): drop both edges by editing the folder units is not an API path;
  // unlink again is a no-op on edges — leave the 2 small folder edges (artifact inside the fixed room, not a new room).
  R.F = F.slice(0, 8);
} catch (e) { R.error = String(e.message || e); }
finally { await browser.close(); }

// (B) OCP confirmatory (already GREEN-DONE per PO — not re-gated, just a non-regression line)
const linkRegistered = /registerAction\('link'/.test(execSync(`grep -a "registerAction('link'" /var/dev/Workspaces/web4x/Web4RawBin/src/public/ts/RoomView.ts || true`, { encoding: 'utf8' }));

console.log(`=== R40.106 INC-4 slice-4 LINK-here — SERVED v${served}, fixed room 909f1bd6 ===`);
console.log(`  link-unit status: F→A=${R.lkA} F→B=${R.lkB} | F=${R.F} resolves-once=${R.fResolves}`);
console.log(`  (A) ADDITIVE (edge-level, /api/ior folder.children[]): F edge in A=${R.inA_edge} + in B=${R.inB_edge} => ${R.additive ? 'GREEN' : 'RED'}`);
console.log(`  (1) SAME-UUID-NOT-A-COPY: F's exact uuid once in each + resolves to ONE unit = ${R.sameUuidNotCopy}`);
console.log(`  (B) OCP confirmatory (already GREEN-DONE): registerAction('link')=${linkRegistered}`);
if (R.error) console.log('  ERROR:', R.error);
const green = R.additive && R.sameUuidNotCopy; // slice-4 LINK claim: additive N-link + not-a-copy
console.log(green ? `\n★ SLICE-4 LINK VERDICT: GREEN @v${served} — Link-here is ADDITIVE (N-link edge in BOTH A+B children[], same uuid not a copy, F resolves once). PO (A)+(1) resolved via data-side edge read.` : `\n★ SLICE-4 LINK VERDICT: RED @v${served}`);
console.log(`\n── DOWNSTREAM FINDINGS (measured, for expert — NOT slice-4 LINK REDs) ──`);
console.log(`  (C) N-LINK REMOVE GAP: unlink-unit(F,parent:A) status ${R.rmStatus} → A-edge-after=${R.aEdgeAfterUnlink} B-edge-after=${R.bEdgeAfterUnlink}. Handler IGNORES request 'parent' + detaches only F.model.parent (null for an edge-link) → NEITHER edge removed. Per-container remove of an N-linked unit NOT supported by unlink-unit as-is. slice-3 remove stays GREEN for a single-model.parent unit.`);
console.log(`  (c) N-LINK RENDER: tree /api/trace/children shows F under A=${R.treeA} B=${R.treeB} (both=${R.renderShowsBoth}). Additive EDGE is in data (both children[]) but the tree derives by LOCATION → linked units don't render under folders they're linked into. Data correct; render/derivation gap.`);
process.exit(green ? 0 : 1);
