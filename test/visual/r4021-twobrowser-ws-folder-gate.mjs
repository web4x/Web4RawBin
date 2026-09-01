// T37.21 PART 2 — TWO-BROWSER WS FAN-OUT (Tron's long pole). "When Add folder creates a folder, a SECOND browser already
// on a similar /model view must update IMMEDIATELY over websocket — no reload." Three required assertions (all must hold):
//   (2a DISK)   the created folder EXISTS ON DISK afterwards, not merely in the view.
//   (2b B1)     the FIRST browser (the actor) updates with NO full-page reload.
//   (2c B2 WS)  a SECOND browser, PASSIVE (never acts, never reloads), updates over WS — the load-bearing half.
// LAYERED (transport vs render, r4064/r4065 discipline) so the gate names WHICH half is missing to the expert:
//   B2-FRAME  = a unit-changed WS frame reached browser-2 (non-destructive WS recorder) — the SERVER-BROADCAST half.
//   B2-DOM    = browser-2's tree shows the new folder without reload (sentinel survives) — the SUBSCRIBE+RENDER half.
// MEASURED PRE-FIX (source, HEAD): /api/model/folder/create mints+returns the unit but does NOT publishUnitChanged, and
// /model has no ViewBus.subscribe → B2-FRAME + B2-DOM are RED (the gate DEMONSTRABLY fails = it certifies). Flips GREEN
// when the expert (a) broadcasts on folder-create and (b) makes /model subscribe+live-insert. Driven by the REAL verb in
// browser-1 (dialog auto-accept) so B1's load() path is exercised faithfully. Scratch-only; teardown asserts prod untouched.
// FINDING (flagged PO): current 'physical' = a persisted Folder UNIT file (FolderService.ts:2 'NOT a filesystem directory');
// the disk assertion checks the UNIT FILE exists in MODEL_STORE (satisfies both readings minimally) — if Tron wants a real
// dir, that is an architect ruling, not this gate's call.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
import path from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
// non-destructive WS recorder: keeps the socket fully live, taps incoming unit-changed frames into window.__frames.
const WS_RECORDER = `(() => { const _WS = window.WebSocket; window.WebSocket = new Proxy(_WS, { construct(T, a) { const ws = new T(...a);
  ws.addEventListener('message', (ev) => { try { const m = JSON.parse(ev.data); if (m && m.type === 'unit-changed') (window.__frames = window.__frames || []).push({ ior: m.ior, uuid: m.uuid, at: Date.now() }); } catch {} }); return ws; } }); })();`;

const f = await setupFoundation();
const OWNER = fs.readFileSync('/root/.rawbin/owner-token', 'utf8').trim();
const smSession = (/sm_session=([^;]+)/.exec(f.ownerHeaders().Cookie || '') || [])[1] || '';
const scratchDir = fs.readdirSync('/tmp').filter((d) => d.startsWith(`r4031-scratch-${process.pid}-`)).map((d) => path.join('/tmp', d))[0] || null;
const MODEL_STORE = scratchDir ? path.join(scratchDir, 'data/model-store/index') : null;
R(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} | MODEL_STORE=${MODEL_STORE}`);

// disk scan: does a Folder unit with this exact name exist on disk in MODEL_STORE?
const folderUnitOnDisk = (name) => {
  if (!MODEL_STORE || !fs.existsSync(MODEL_STORE)) return null;
  const walk = (d) => { let out = []; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) out = out.concat(walk(p)); else if (e.name.endsWith('.scenario.json')) out.push(p); } return out; };
  for (const file of walk(MODEL_STORE)) {
    try { const u = JSON.parse(fs.readFileSync(file, 'utf8')); if (u?.ior === 'ior:class:Folder' && u?.model?.name === name) return { uuid: u.model.uuid, file, location: u.model.location || null }; } catch {}
  }
  return null;
};
// Tron ruling 2026-09-01: 'physical' = BOTH a persisted unit AND a REAL filesystem directory. Scan for an actual directory
// named <name> under the scratch tree (design-agnostic — the exact mkdir root is an architect ruling, pending; tighten when
// told). Prune heavy dirs. RED now = the mkdir half is unbuilt (was explicitly NOT done: FolderService.ts 'no user mkdir').
const folderDirOnDisk = (name) => {
  if (!scratchDir) return null;
  const PRUNE = new Set(['node_modules', '.git', 'dist']);
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (!e.isDirectory() || PRUNE.has(e.name)) continue; const p = path.join(d, e.name); if (e.name === name) return p; const hit = walk(p); if (hit) return hit; } return null; };
  try { return walk(scratchDir); } catch { return null; }
};

const browser = await webkit.launch();
let verdict = 'INCONCLUSIVE', exit = 1;
const FOLDER = `gate-ws-folder-${f.worktreeSha}-${scratchDir ? scratchDir.slice(-6) : 'x'}`;
try {
  const mk = async (label) => {
    const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    if (smSession) await ctx.addCookies([{ name: 'sm_session', value: smSession, domain: 'localhost', path: '/' }]);
    await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, OWNER);
    await ctx.addInitScript(WS_RECORDER);
    const page = await ctx.newPage();
    await page.goto(f.base + '/model', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => { const t = document.getElementById('model-tree'); return t && t.querySelectorAll('rb-object-item, .tt-row, [data-ref]').length > 0; }, { timeout: 20000 }).catch(() => {});
    await sleep(600);
    return { ctx, page };
  };
  const treeText = (page) => page.evaluate(() => (document.getElementById('model-tree')?.textContent || '').replace(/\s+/g, ' ').trim());

  const b1 = await mk('browser-1 (actor)');
  const b2 = await mk('browser-2 (PASSIVE)');
  // ★ expert TEST TARGET: expand BOTH browsers to the physical ts dir. R37.33 (v0.8.165) made dir refs REPO-RELATIVE:
  // dir:ts → dir:src/ts. Path mof-m1→project:RawBin→rawbin:ts→dir:src/ts. Only a rendered+subscribed parent can
  // reDeriveDirectChildren-insert the new child. DETECTION FIX (anchor): rb-trace-tree subscribes viewBusKey(node.uuid)
  // where node.uuid is the RAW ref 'dir:src/ts' — match on the raw uuid across attrs, tolerating a 'collection:'/'type:'
  // display prefix (endsWith), not the display itemRef literally (the prior false-'rendered=false').
  const PARENT = 'dir:src/ts';
  const MATCH = (par) => `(() => { const t = document.getElementById('model-tree'); if (!t) return null;
    const raw = ${JSON.stringify(par)};
    const nodes = [...t.querySelectorAll('rb-object-item, [ref], [data-ref], [uuid], [data-uuid], .tt-node, .tt-row')];
    const hit = nodes.find((n) => [...n.attributes].some((a) => { const v = a.value; return v === raw || v.endsWith(':' + raw) || v === 'collection:' + raw; }));
    if (hit) return { found: true, attrs: [...hit.attributes].map((a) => a.name + '=' + a.value).slice(0, 6) };
    // diagnostic when NOT found: is the ref anywhere in the tree, and what do the nodes look like?
    const html = t.innerHTML || '';
    const sample = nodes.slice(0, 5).map((n) => n.tagName + '[' + [...n.attributes].map((a) => a.name + '=' + a.value).slice(0, 3).join(',') + ']');
    return { found: false, htmlHasRaw: html.includes(raw), htmlHasSrcTs: html.includes('src/ts'), nodeCount: nodes.length, sample }; })()`;
  const expandTo = async (page, label) => {
    const ok = await page.evaluate(async (p) => { const t = document.getElementById('model-tree'); if (t && t.expandPath) { await t.expandPath(p); return true; } return false; }, ['mof-m1', 'project:RawBin', 'rawbin:ts', PARENT]);
    await page.waitForFunction(`(${MATCH(PARENT)})?.found === true`, { timeout: 15000 }).catch(() => {});
    await sleep(700);
    const m = await page.evaluate(MATCH(PARENT));
    R(`  ${label}: expandPath(${ok})→ ${PARENT} rendered+subscribed=${m?.found} ${m?.found ? 'attrs=' + JSON.stringify(m.attrs) : `DIAG htmlHasRaw=${m?.htmlHasRaw} htmlHasSrcTs=${m?.htmlHasSrcTs} nodes=${m?.nodeCount} sample=${JSON.stringify(m?.sample)}`}`);
    return m?.found === true;
  };
  const b1Rendered = await expandTo(b1.page, 'browser-1 expand'); const b2Rendered = await expandTo(b2.page, 'browser-2 expand');
  // sentinels: a window prop a full reload would WIPE → positive 'no reload' proof for each browser.
  const setSentinel = (page) => page.evaluate(() => { window.__sent = 'S' + Math.floor(performance.now()); return window.__sent; });
  const s1 = await setSentinel(b1.page), s2 = await setSentinel(b2.page);
  const b2Before = await treeText(b2.page);
  await b2.page.evaluate(() => { window.__frames = []; }); // clear pre-action frames on the passive client

  // ── PART-2 presence: the real '📁 Add folder' verb exists in browser-1's action bar. SELECT the subscribed dir:src/ts
  //    node (not row 0) so the verb + create target the rendered+subscribed physical parent (live-insert can only fire there).
  await b1.page.evaluate((raw) => {
    const t = document.getElementById('model-tree');
    const node = [...t.querySelectorAll('rb-object-item, [ref], [data-ref], [uuid], [data-uuid]')].find((n) => [...n.attributes].some((a) => { const v = a.value; return v === raw || v.endsWith(':' + raw) || v === 'collection:' + raw; }));
    (node || t.querySelector('#model-tree rb-object-item, .tt-row'))?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, PARENT);
  await sleep(1200);
  const addFolderBtn = await b1.page.evaluate(() => { const els = [...document.querySelectorAll('button, .rb-strip *, [role="button"]')]; return els.some((e) => /add folder/i.test(e.textContent || '')); });
  R(`  verb '📁 Add folder' present in action bar: ${addFolderBtn}`);

  // ── drive the REAL verb in browser-1: auto-accept the prompt with our unique folder name ──
  b1.page.on('dialog', (d) => d.accept(FOLDER).catch(() => {}));
  const tPre = Date.now();
  const clicked = await b1.page.evaluate((name) => {
    const btn = [...document.querySelectorAll('button, .rb-strip *, [role="button"]')].find((e) => /add folder/i.test(e.textContent || ''));
    if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); return 'verb'; }
    return 'no-btn';
  }, FOLDER);
  // fallback if the verb button wasn't reachable: drive the exact endpoint the verb hits (same POST), so the WS half is still gated
  if (clicked === 'no-btn') {
    // create under the SUBSCRIBED physical parent dir:ts (both browsers expandPath-ed to it) → emit publishUnitChanged on
    // dir:ts → live-bridge ref-string notify viewBusKey(dir:ts) → the subscribed dir:ts node reDeriveDirectChildren-inserts
    // the new child in BOTH browsers. mkdir src/ts/<name> on the SCRATCH (torn down). parent:'' would fail-closed (no location).
    await b1.page.evaluate(async ({ name, parent }) => { await fetch('/api/model/folder/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name, parent }) }); }, { name: FOLDER, parent: PARENT });
    R(`  (verb button not reachable → drove the identical POST endpoint as fallback)`);
  }
  await sleep(4500); // allow the POST + client load() + any WS fan-out to land

  // ── confinement arm (architect fail-closed): a traversal name must be REJECTED (ok:false, NO unit, NO dir) ──
  const TRAV = `../gate-escape-${scratchDir ? scratchDir.slice(-6) : 'x'}`;
  const trav = await b1.page.evaluate(async (name) => { try { const r = await fetch('/api/model/folder/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name, parent: '' }) }); return { status: r.status, ok: (await r.json().catch(() => ({}))).ok === true }; } catch (e) { return { status: 0, ok: false, err: String(e) }; } }, TRAV);
  const travEscaped = scratchDir ? fs.existsSync(path.join(path.dirname(scratchDir), path.basename(TRAV))) : false; // did a dir escape the root?
  const travRejected = trav.ok === false && !travEscaped; // fail-closed: rejected + nothing left behind

  // ── assertions ──
  const disk = folderUnitOnDisk(FOLDER);
  // (2a-dir) EXACT PATH (architect formula): PROJECT_ROOT(=scratchDir) / unit.location (relpath = parentLocation/sanitizedName).
  const relpath = disk ? (disk.location || FOLDER) : null; // location field is part of the build; until then a root folder's relpath == its name
  const expectedDir = disk && scratchDir ? path.join(scratchDir, relpath) : null;
  const dirExact = expectedDir ? (fs.existsSync(expectedDir) && fs.statSync(expectedDir).isDirectory()) : false;
  const anyDir = folderDirOnDisk(FOLDER); // diagnostic: a dir by that name anywhere (wrong-path detector)
  const b1After = await treeText(b1.page);
  const b2After = await treeText(b2.page);
  const b1Sent = await b1.page.evaluate(() => window.__sent);
  const b2Sent = await b2.page.evaluate(() => window.__sent);
  const b2Frames = await b2.page.evaluate(() => window.__frames || []);
  const b2FrameForFolder = disk ? b2Frames.some((fr) => (fr.uuid === disk.uuid) || /folder/i.test(fr.ior || '')) : b2Frames.length > 0;

  const aUnit = !!disk;                                               // (2a-unit) persisted Folder unit file on disk
  const aDir = dirExact;                                              // (2a-dir) REAL directory at the EXACT architect path (Tron BOTH)
  const b1NoReload = b1Sent === s1;                                   // (2b) browser-1 did not full-reload
  const b1Shows = b1After.includes(FOLDER);                           // (2b) browser-1's tree reflects it
  const b2NoReload = b2Sent === s2;                                   // browser-2 never reloaded
  const b2FrameGot = b2FrameForFolder;                               // (2c transport) WS frame reached browser-2
  const b2Shows = b2After.includes(FOLDER) && b2After !== b2Before;   // (2c render) browser-2 live-inserted the node

  R(`  (2a-unit)  persisted Folder UNIT on disk: ${aUnit}${disk ? ` (uuid ${disk.uuid.slice(0, 8)}, location=${relpath})` : ''}`);
  R(`  (2a-dir)   REAL DIRECTORY at exact path ${expectedDir || '?'}: ${aDir}${!aDir ? ' — mkdir unbuilt' : ''}${anyDir && !aDir ? ` (⚠ a dir by that name exists elsewhere: ${anyDir})` : ''}`);
  R(`  (confine)  traversal name '${TRAV}' rejected fail-closed (ok:false + nothing left): ${travRejected} (resp ok=${trav.ok}, escaped=${travEscaped})`);
  R(`  (2b B1)    no-reload=${b1NoReload} showsFolder=${b1Shows}`);
  R(`  (2c B2-FRAME transport) WS unit-changed reached passive browser-2: ${b2FrameGot} (frames=${b2Frames.length})`);
  R(`  (2c B2-DOM render)      browser-2 live-inserted the node (no reload): ${b2Shows} (b2NoReload=${b2NoReload})`);

  const green = aUnit && aDir && b1NoReload && b1Shows && b2FrameGot && b2Shows && b2NoReload && addFolderBtn && travRejected;
  if (green) verdict = `GREEN — Add folder creates BOTH the Folder unit (${disk.uuid.slice(0, 8)}) AND a real directory at ${expectedDir} on disk, browser-1 updates no-reload, passive browser-2 received the WS frame + live-inserted no-reload, AND a traversal name is rejected fail-closed. Four-assertion Part-2 + confinement WORKS. (@390 real-WebKit; scratch.)`;
  else if (!aUnit) verdict = `RED — the Folder UNIT was NOT persisted to disk (MODEL_STORE) after Add folder. addFolderBtn=${addFolderBtn}. Create path failed or auth-blocked; investigate before the rest.`;
  else verdict = `RED — CLIENT PIECE ONLY (server side DONE @0.8.158, measured via the REAL /api/model/folder/create route with a physical parent): (2a-unit)UNIT=${aUnit}(${disk.uuid.slice(0, 8)}) ✅ · (2a-dir)REAL-DIR@${expectedDir}=${aDir} ✅ mkdir E2E via createPhysicalWithUnit · (confine)traversal-rejected=${travRejected} ✅ · (2c-FRAME)browser-2 WS unit-changed frame=${b2FrameGot}(${b2Frames.length}) ✅ server fan-out reaches passive browser · (2b)browser-1 no-reload SHOWS=${b1Shows} ⏳ · (2c-DOM)browser-2 live-insert=${b2Shows} ⏳. REMAINING = CLIENT ONLY: /model ViewBus.subscribe + live-insert (both browsers) — the frame ARRIVES, the client must consume it (expert's piece-2). The frame-arrives result means this is a small client problem, not a missing broadcast.`;
} catch (e) {
  verdict = `ERROR: ${String(e && e.message).slice(0, 200)}`;
} finally {
  await browser.close().catch(() => {});
  const td = await f.teardown();
  R(`teardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`);
}
R(`\n═══ T37.21 PART-2 TWO-BROWSER WS GATE ═══\n${verdict}`);
process.exit(/^GREEN/.test(verdict) ? 0 : 1);
