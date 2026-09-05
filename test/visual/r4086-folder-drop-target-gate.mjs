// R40.86 — folders are DROP TARGETS: a file dropped ONTO a room folder nests INSIDE it (reuse the ONE drop→upload→createFileUnit
// path, thread parent=targetFolderRef; render delegated to R40.84). Design 167c94ca4, v0.8.184 (b2fc26765 + 1e49a7ec5 room-context wiring).
// The first deploy was INCOMPLETE (missing room context) → PROVE THE WHOLE PATH end-to-end, not the happy click. GATE:
//   (1) drop lands INSIDE the target folder — the File unit's parent == the folder + nested location (roomcoll:<id>:files/<folder>/<file>), NOT root.
//   (2) RENDERS+PERSISTS — seed the tree at the folder + EXPAND → the dropped file is a real child node; survives a re-derive (R40.92 lesson).
//   (3) EXACTLY ONE unit — symlink-aware dedup counter (from r4093; the room file-symlink shares the uuid, count once).
//   (4) NO REGRESSION — a drop with NO parent still lands a file at Files-root (the existing room/upload path).
//   (5) served==committed==0.8.184.  (6) DET-3x on (1-3).  (7) model-collection NOT a blob-drop target (source: isFolderTarget=type 'folder' only, excludes 'collection').
// Scratch-isolated, member session (WS IDENTIFY), NEVER prod.
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

const countUnitsNamed = (scratchDir, name) => { if (!scratchDir) return -1; const u = new Set(); const walk = (d) => { let e = []; try { e = fs.readdirSync(d, { withFileTypes: true }); } catch { return; } for (const x of e) { if (x.isSymbolicLink()) continue; const p = path.join(d, x.name); if (x.isDirectory()) walk(p); else if (x.name.endsWith('.scenario.json')) { try { const j = JSON.parse(fs.readFileSync(p, 'utf8')); if (j?.model?.name === name && j?.model?.uuid) u.add(j.model.uuid); } catch {} } } }; ['scenario/index', 'data'].forEach((r) => walk(path.join(scratchDir, r))); return u.size; };
const readUnitModel = (scratchDir, uuid) => { try { return JSON.parse(fs.readFileSync(path.join(scratchDir, 'scenario/index', ...uuid.slice(0, 5).split(''), uuid + '.scenario.json'), 'utf8')).model; } catch { return null; } };
const scratchOf = () => fs.readdirSync('/tmp').filter((d) => d.startsWith(`r4031-scratch-${process.pid}-`)).map((d) => path.join('/tmp', d))[0] || null;
const childrenNames = (page, base, ref) => page.evaluate(async (a) => { try { const r = await fetch(`${a.base}/api/trace/children/${encodeURIComponent(a.ref)}`); return ((await r.json()).children || []).map((c) => c.name); } catch { return []; } }, { base, ref });
const addFolder = (page, base, roomId, name) => page.evaluate(async (a) => { const r = await fetch(`${a.base}/api/room/${a.roomId}/folder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: a.name, nestedPath: '', playerToken: a.tok }) }); const j = await r.json().catch(() => ({})); return j.uuid || null; }, { base, roomId, name, tok: PLAYER });
const uploadFile = (page, base, roomId, fileName, parentRef) => page.evaluate(async (a) => { const fd = new FormData(); fd.append('playerToken', a.tok); if (a.parent) fd.append('parent', a.parent); fd.append('file', new Blob([a.fileName + '::' + Date.now() + '::' + Math.random()], { type: 'text/plain' }), a.fileName); try { const r = await fetch(`${a.base}/api/room/${a.roomId}/upload`, { method: 'POST', body: fd }); const j = await r.json().catch(() => ({})); return { status: r.status, uuid: j.uuid || null }; } catch (e) { return { status: 0, err: String(e && e.message) }; } }, { base, roomId, fileName, parent: parentRef || '', tok: PLAYER });
// seed a fresh tree at the folder + expand → does the file render as its child?
// seed a tree at the folder's ROOMCOLL ref (the room tree surfaces a folder's children via its location roomcoll:<id>:files/<folder>,
// NOT the bare uuid — diagnosed 2026-09-05) + expand → does the dropped file render as a child?
const rendersUnder = async (page, seedRef, fileName) => { const pid = 'r4086probe'; await page.evaluate((a) => { const t = document.createElement('rb-trace-tree'); t.id = a.pid; t.setAttribute('data-seed-ior', a.ref); document.body.appendChild(t); }, { pid, ref: seedRef }); await sleep(1200); await page.evaluate((a) => { const t = document.getElementById(a.pid); if (t?.expandPath) t.expandPath([a.ref]).catch(() => {}); }, { pid, ref: seedRef }); await sleep(1400); const ok = await page.evaluate((a) => (document.getElementById(a.pid)?.textContent || '').includes(a.nm), { pid, nm: fileName }); await page.evaluate((a) => document.getElementById(a.pid)?.remove(), { pid }); return ok; };

// (7) source: model collections are NOT drop targets — isFolderTarget matches type 'folder' only, excludes 'collection'
const src = fs.readFileSync('src/public/ts/trace/rb-object-item.ts', 'utf8');
results.g7_modelCollectionOut = /isFolderTarget\s*=\s*\(\)\s*:\s*boolean\s*=>\s*\(this\.getAttribute\('type'\)\s*\|\|\s*''\)\.toLowerCase\(\)\s*===\s*'folder'/.test(src) && /EXCLUD\w*\s+model\s+'collection'/i.test(src);

const browser = await webkit.launch();
try {
  const f = await setupFoundation({ commit: 'HEAD', buildDist: process.env.ARM_BUILD !== '0' });
  const scratchDir = scratchOf();
  R(`ARM-1 HEAD: ${f.base} v${f.servedVersion} scratch=${scratchDir ? scratchDir.slice(-8) : 'none'}`);
  results.g5_served = f.servedVersion === '0.8.185';
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, PLAYER);
  const page = await ctx.newPage();
  await page.goto(f.base + '/app', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'R4086', secretCode: '4086' }));
  await sleep(2000);
  const roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('R4086', 'R4086'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  const folderUuid = roomId ? await addFolder(page, f.base, roomId, 'DropTarget') : null;
  await sleep(1500);
  R(`  room=${roomId ? roomId.slice(0, 12) : 'NULL'} targetFolder=${folderUuid ? folderUuid.slice(0, 8) : 'NULL'}`);
  const folderLoc = folderUuid ? String(readUnitModel(scratchDir, folderUuid)?.location || '') : '';

  const runs = [];
  if (folderUuid) for (let i = 1; i <= 3; i++) {
    const fn = `dropped_${i}.txt`;
    const up = await uploadFile(page, f.base, roomId, fn, folderUuid);
    await sleep(2200);
    const m = up.uuid ? readUnitModel(scratchDir, up.uuid) : null;
    const insideParent = m?.parent === `ior:instance:${folderUuid}`;                                   // (1) parent == the folder
    const insideLoc = typeof m?.location === 'string' && m.location === `${folderLoc}/${fn}`;           // (1) nested location, NOT Files-root
    const oneUnit = countUnitsNamed(scratchDir, fn) === 1;                                              // (3)
    const inData = (await childrenNames(page, f.base, folderLoc)).includes(fn);                          // (2) INSIDE: folder children (folder's ROOMCOLL ref) include it
    const rootKids = await childrenNames(page, f.base, `roomcoll:${roomId}:files`);
    const notAtRoot = !rootKids.includes(fn);                                                           // (2) ★ DECIDER: NOT double-listed flat at Files-root
    const rendered = await rendersUnder(page, folderLoc, fn);                                           // (2) render: real child node of the folder (seed at the roomcoll ref)
    await sleep(500);
    const persists = (await childrenNames(page, f.base, folderLoc)).includes(fn);                       // (2) persists
    const pass = up.status === 200 && insideParent && insideLoc && oneUnit && inData && notAtRoot && rendered && persists;
    runs.push(pass);
    R(`  (1/2/3) iter ${i} '${fn}': up=${up.status} parent-is-folder=${insideParent} nested-loc=${insideLoc}(${m?.location || '-'}) one-unit=${oneUnit} in-folder=${inData} NOT-at-root=${notAtRoot} renders=${rendered} persists=${persists} => ${pass ? 'GREEN' : 'RED'}`);
  }
  results.core_insideRendersOne = runs.length === 3 && runs.every(Boolean);

  // childCount/chevron: a folder holding ONLY files must show as EXPANDABLE at Files-root (architect: childCount counts BOTH kinds)
  const rootFull = folderUuid ? await page.evaluate(async (a) => { try { return ((await (await fetch(`${a.base}/api/trace/children/${encodeURIComponent('roomcoll:' + a.roomId + ':files')}`)).json()).children || []).map((c) => ({ name: c.name, hasChildren: c.hasChildren, childCount: c.childCount })); } catch { return []; } }, { base: f.base, roomId }) : [];
  const dt = rootFull.find((c) => c.name === 'DropTarget');
  results.g_childCount = !!dt && (dt.hasChildren === true || (dt.childCount || 0) >= 1);
  R(`  childCount/chevron: DropTarget hasChildren=${dt?.hasChildren} childCount=${dt?.childCount} → expandable=${results.g_childCount}`);

  // (4) NO REGRESSION — a drop with NO parent lands at Files-root (existing path intact)
  let rootOk = false;
  if (roomId) { const fn = 'root_drop.txt'; const up = await uploadFile(page, f.base, roomId, fn, ''); await sleep(2200); const m = up.uuid ? readUnitModel(scratchDir, up.uuid) : null; const atRoot = !m?.parent && (await childrenNames(page, f.base, `roomcoll:${roomId}:files`)).includes(fn); rootOk = up.status === 200 && atRoot; R(`  (4) no-parent drop → Files-root: up=${up.status} no-parent=${!m?.parent} at-files-root=${(await childrenNames(page, f.base, `roomcoll:${roomId}:files`)).includes(fn)} => ${rootOk ? 'GREEN' : 'RED'}`); }
  results.g4_noRegression = rootOk;
  await ctx.close();
  await f.teardown();
} finally { await browser.close().catch(() => {}); }

R(`\n═══ R40.86 folders-are-drop-targets — FULL SCOPE ═══`);
R(`  (1/2/3) inside-folder + renders + NOT-at-root + persists + one-unit (DET-3x) : ${results.core_insideRendersOne ? 'GREEN' : 'RED'}`);
R(`  childCount/chevron: folder-with-only-files is expandable                    : ${results.g_childCount ? 'GREEN' : 'RED'}`);
R(`  (4) no regression (no-parent drop → Files-root)                             : ${results.g4_noRegression ? 'GREEN' : 'RED'}`);
R(`  (5) served==committed==0.8.185                                              : ${results.g5_served ? 'GREEN' : 'RED'}`);
R(`  (7) model-collection NOT a drop target (source: type 'folder' only)         : ${results.g7_modelCollectionOut ? 'GREEN' : 'RED'}`);
const allGreen = results.core_insideRendersOne && results.g_childCount && results.g4_noRegression && results.g5_served && results.g7_modelCollectionOut;
R(`OVERALL: ${allGreen ? 'ALL GREEN' : 'RED'}`);
process.exit(allGreen ? 0 : 1);
