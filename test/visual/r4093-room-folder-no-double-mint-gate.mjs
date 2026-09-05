// R40.93 — the raw room-folder mkdir was EXTRACTED to FolderService.createPhysicalDir (the ONE owner), routed NOT excused
// (green-by-routing). Risk (expert-flagged): the room path mints via createFileUnit (folder-is-a-file, R40.84/A5 items-tree);
// createPhysicalDir must NOT mint a unit, else DOUBLE-MINT + items-tree regression. Gate (v0.8.183, build 7154b2074):
//   (b/1) NO-DOUBLE-MINT — a room /add-folder mints EXACTLY ONE unit (createFileUnit); DET-3x.
//   (b/2) END-TO-END — the folder renders in the room items-tree (roomcoll:<id>:files children) + persists = R40.84/A5 intact.
//   STUB-1 (must-RED) — serverPatch adds a createPhysicalFolder call in the room path → a 2ND unit appears → RED.
//   STUB-4 (both-or-neither) — serverPatch makes createFileUnit throw → the physical dir is rmdir'd (no orphan dir).
//   (d) served==committed==0.8.183.  (a routing + c guard/harness proven separately: source createPhysicalDir@2569 + guard GREEN + evasion CERTIFIED.)
// Scratch-isolated, NEVER prod. member session (WS IDENTIFY), no owner.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
import path from 'node:path';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const PLAYER = '11111111-2222-4333-8444-555555555555';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = {};

// count on-disk scenario units whose model.name === name (a double-mint = 2: the createFileUnit File-folder + a rogue Folder unit)
const countUnitsNamed = (scratchDir, name) => {
  if (!scratchDir) return -1; let n = 0;
  const walk = (d) => { let e = []; try { e = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const x of e) { const p = path.join(d, x.name); if (x.isDirectory()) walk(p); else if (x.name.endsWith('.scenario.json')) { try { const j = JSON.parse(fs.readFileSync(p, 'utf8')); if (j?.model?.name === name) n++; } catch {} } } };
  // BOTH stores: a real double-mint = the File unit (createFileUnit → scenario/index) + a rogue Folder unit (createPhysicalFolder → MODEL_STORE under data/)
  ['scenario/index', 'data'].forEach((r) => walk(path.join(scratchDir, r)));
  return n;
};
// enter a live room as a member and return {page, ctx, roomId, base, H}
const enterRoom = async (f, browser) => {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((tok) => { try { localStorage.setItem('rawbin-player-id', tok); } catch {} }, PLAYER);
  const page = await ctx.newPage();
  await page.goto(f.base + '/app', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window.__rawbinClient && window.__rawbinClient.connected) === true, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => { const c = window.__rawbinClient; if (c?.send) c.send({ type: 'UPDATE_PROFILE', name: 'R4093Member', secretCode: '4093' }); });
  await sleep(2000);
  const roomId = await page.evaluate(async () => { const c = window.__rawbinClient; if (!c?.createRoom) return null; c.createRoom('R4093 room', 'R4093Member'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  return { ctx, page, roomId };
};
// add a room folder via the real endpoint (member playerToken), return {status, uuid}
const addFolder = (page, base, roomId, name) => page.evaluate(async (a) => { try { const r = await fetch(`${a.base}/api/room/${encodeURIComponent(a.roomId)}/folder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name: a.name, nestedPath: '', playerToken: a.tok }) }); const j = await r.json().catch(() => ({})); return { status: r.status, uuid: j.uuid || null, ok: j.ok }; } catch (e) { return { status: 0, err: String(e && e.message) }; } }, { base, roomId, name, tok: PLAYER });
const filesChildren = (page, base, roomId) => page.evaluate(async (a) => { try { const r = await fetch(`${a.base}/api/trace/children/${encodeURIComponent('roomcoll:' + a.roomId + ':files')}`); return ((await r.json()).children || []).map((c) => ({ name: c.name, type: c.type })); } catch { return []; } }, { base, roomId });
const scratchOf = () => fs.readdirSync('/tmp').filter((d) => d.startsWith(`r4031-scratch-${process.pid}-`)).map((d) => path.join('/tmp', d))[0] || null;
const dirExists = (scratchDir, name) => { if (!scratchDir) return false; let hit = false; const walk = (d) => { let e = []; try { e = fs.readdirSync(d, { withFileTypes: true }); } catch { return; } for (const x of e) { if (hit) return; const p = path.join(d, x.name); if (x.isDirectory()) { if (x.name === name && p.includes('/files')) hit = true; else walk(p); } } }; walk(scratchDir); return hit; };

// ─────────── ARM 1 (HEAD v0.8.183): (b/1) no-double-mint DET-3x + (b/2) items-tree + (d) served ───────────
const browser = await webkit.launch();
try {
  const f = await setupFoundation({ commit: 'HEAD', buildDist: process.env.ARM_BUILD !== '0' });
  const scratchDir = scratchOf();
  R(`ARM-1 HEAD: ${f.base} v${f.servedVersion} scratch=${scratchDir ? scratchDir.slice(-8) : 'none'}`);
  results.d_served = f.servedVersion === '0.8.183';
  const { ctx, page, roomId } = await enterRoom(f, browser);
  R(`  room=${roomId ? roomId.slice(0, 12) : 'NULL'}`);
  const aRuns = [];
  if (roomId) for (let i = 1; i <= 3; i++) {
    const name = `R4093Folder_${i}`;
    const add = await addFolder(page, f.base, roomId, name);
    await sleep(2500);
    const units = countUnitsNamed(scratchDir, name);
    const kids = await filesChildren(page, f.base, roomId);
    const inTree = kids.some((c) => c.name === name);
    const oneUnit = units === 1;
    const pass = add.status === 200 && oneUnit && inTree;
    aRuns.push(pass);
    R(`  (b) iter ${i} '${name}': add=${add.status}(uuid=${add.uuid ? add.uuid.slice(0, 8) : '-'}) units-on-disk=${units}(want 1) in-items-tree=${inTree} => ${pass ? 'GREEN' : 'RED'}`);
  }
  results.b_noDoubleMint = aRuns.length === 3 && aRuns.every(Boolean);
  await ctx.close();
  await f.teardown();
} finally { /* browser reused below */ }

// ─────────── STUB-1 (must-RED): serverPatch adds a rogue createPhysicalFolder in the room path → a 2ND unit ───────────
const stub1 = (root) => {
  const p = root + '/src/ts/server/server.ts'; const s = fs.readFileSync(p, 'utf8');
  // REPLACE the mkdir-only owner (createPhysicalDir) with createPhysicalFolder = mkdir + MINT a Folder unit → then the createFileUnit
  // below mints a 2nd unit with the SAME name = the double-mint the extraction was designed to PREVENT.
  const anchor = 'const dir = FolderService.createPhysicalDir(path.join(filesBase, nrel), cleanName);';
  const rogue = "const _rf = FolderService.createPhysicalFolder({ parentAbsPath: path.join(filesBase, nrel), name: cleanName, storeDir: MODEL_STORE, location: `roomcoll:${roomId}:files/${cleanName}` }); const dir = { ok: _rf.ok, absPath: path.join(filesBase, nrel, cleanName), error: _rf.error } as any; // R40.93 STUB-1: rogue 2nd mint via createPhysicalFolder";
  const patched = s.replace(anchor, rogue);
  if (patched === s) throw new Error('stub1: createPhysicalDir anchor not found');
  fs.writeFileSync(p, patched);
};
try {
  const f = await setupFoundation({ commit: 'HEAD', buildDist: true, serverPatch: stub1 });
  const scratchDir = scratchOf();
  R(`STUB-1 (rogue createPhysicalFolder in room path): v${f.servedVersion}`);
  const { ctx, page, roomId } = await enterRoom(f, browser);
  let units2 = -1;
  if (roomId) { const nm = 'R4093Stub1'; await addFolder(page, f.base, roomId, nm); await sleep(2500); units2 = countUnitsNamed(scratchDir, nm); }
  results.stub1_doubleMintCaught = units2 >= 2; // the rogue 2nd mint made 2 units → the gate's oneUnit assertion WOULD go RED
  R(`  STUB-1 double-mint units=${units2} → gate-would-RED=${results.stub1_doubleMintCaught}`);
  await ctx.close(); await f.teardown();
} catch (e) { results.stub1_err = String(e && e.message).slice(0, 160); }

// ─────────── STUB-4 (both-or-neither): serverPatch makes createFileUnit throw → the dir must be rmdir'd ───────────
const stub4 = (root) => {
  const p = root + '/src/ts/server/server.ts'; const s = fs.readFileSync(p, 'utf8');
  const anchor = 'unit = createFileUnit(idx, { kind: \'folder\', name: cleanName,';
  const patched = s.replace(anchor, "if (cleanName === 'R4093Boom') throw new Error('R40.93 STUB-4: createFileUnit forced-fail'); " + anchor);
  if (patched === s) throw new Error('stub4: anchor not found');
  fs.writeFileSync(p, patched);
};
try {
  const f = await setupFoundation({ commit: 'HEAD', buildDist: true, serverPatch: stub4 });
  const scratchDir = scratchOf();
  R(`STUB-4 (createFileUnit throws): v${f.servedVersion}`);
  const { ctx, page, roomId } = await enterRoom(f, browser);
  let leftDir = true;
  if (roomId) { await addFolder(page, f.base, roomId, 'R4093Boom'); await sleep(2500); leftDir = dirExists(scratchDir, 'R4093Boom'); }
  results.stub4_bothOrNeither = leftDir === false; // mint failed → dir rmdir'd → NO orphan dir
  R(`  STUB-4 orphan-dir-left=${leftDir} → both-or-neither(no orphan)=${results.stub4_bothOrNeither}`);
  await ctx.close(); await f.teardown();
} catch (e) { results.stub4_err = String(e && e.message).slice(0, 160); }
finally { await browser.close().catch(() => {}); }

R(`\n═══ R40.93 room-folder no-double-mint — FULL SCOPE ═══`);
R(`  (b/1) no-double-mint EXACTLY-ONE-unit (DET-3x) : ${results.b_noDoubleMint ? 'GREEN' : 'RED'}`);
R(`  STUB-1 rogue 2nd-mint → would-RED             : ${results.stub1_doubleMintCaught ? 'GREEN' : 'RED'}${results.stub1_err ? ' (err ' + results.stub1_err + ')' : ''}`);
R(`  STUB-4 both-or-neither (mint-fail → no dir)   : ${results.stub4_bothOrNeither ? 'GREEN' : 'RED'}${results.stub4_err ? ' (err ' + results.stub4_err + ')' : ''}`);
R(`  (d) served==committed==0.8.183               : ${results.d_served ? 'GREEN' : 'RED'}`);
const allGreen = results.b_noDoubleMint && results.stub1_doubleMintCaught && results.stub4_bothOrNeither && results.d_served;
R(`OVERALL: ${allGreen ? 'ALL GREEN' : 'RED'}`);
process.exit(allGreen ? 0 : 1);
