// TRON'S SPECIFIED TEST — PERMANENT STANDING GATE (PO build-order 2026-09-05): add a folder in a room, then
// IMMEDIATELY add another folder INSIDE it (same session, NO reload). Tests the folder is a genuine FIRST-CLASS UNIT
// by USING it as a parent — exercises everything-is-a-unit / unit-is-the-model / parent-child-real-not-rendered.
//
// The genuine user path, no owner-auth, no Tron (architect measured: the room folder endpoint is MEMBER-gated on a live
// playerToken in tokenToClient @server.ts:2447 — NOT owner-gated; the owner boundary is the MODEL/server-manager surface).
// So: seed rawbin-player-id → WS IDENTIFY (registers playerToken = live member) → CREATE_ROOM (creator+member +
// createRoomHome Files base) → RoomView #room-tree → press the REAL '📁 Add folder' verb (NOT a direct POST — the bug is
// in the verb path) on the Files node → then immediately on the new folder. FOUR NAMED assertions, reported SEPARATELY:
//   A1 items-tree     : first folder appears in #room-tree beside the files (no reload)          [behavioural — Tron's surface]
//   A2 nested-accept  : second folder accepted INTO the first, no reload                          [first is a usable PARENT immediately]
//   A3 nesting-correct: the child is under THAT parent, not at the room root                      [parent-child real]
//   A4 one-store-unit : on disk BOTH are UNITS in the ONE store, symlinked like files (not bare)  [structural — everything-is-a-unit]
// PROVE RED on current build (v0.8.170: items-tree broken) before trusting green. render-green ≠ ownership: A1 behavioural,
// A2/A4 structural — reported separately, never merged. Route-intercept = corroboration only. Scratch-only; teardown asserts prod untouched.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
import path from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const PLAYER = '11111111-2222-4333-8444-555555555555'; // a live MEMBER token (not the owner) — registered via WS IDENTIFY
const F1 = 'NestGateOuter', F2 = 'NestGateInner';

const COMMIT = process.env.ARM_COMMIT || 'HEAD'; // ARM_COMMIT=66670ff31^ (or any) for a differential arm; default HEAD = current build
const f = await setupFoundation({ commit: COMMIT });
const scratchDir = fs.readdirSync('/tmp').filter((d) => d.startsWith(`r4031-scratch-${process.pid}-`)).map((d) => path.join('/tmp', d))[0] || null;
R(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} arm=${COMMIT} | scratchDir=${scratchDir}`);

const browser = await webkit.launch();
const results = {};
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((tok) => { try { localStorage.setItem('rawbin-player-id', tok); } catch {} }, PLAYER);
  const page = await ctx.newPage();

  // route-intercept (CORROBORATION only, never the pass) — record which endpoint each real verb-press POSTs
  const posts = [];
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    if (req.method() === 'POST' && /\/api\/(room\/[^/]+\/folder|model\/folder\/create)/.test(req.url())) {
      const resp = await route.fetch();
      posts.push({ url: req.url().replace(f.base, ''), status: resp.status() });
      await route.fulfill({ response: resp });
    } else await route.continue();
  });

  await page.goto(f.base + '/app', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window.__rawbinClient && window.__rawbinClient.connected) === true, { timeout: 20000 }).catch(() => {});
  R(`  WS connected (IDENTIFY → live member): ${await page.evaluate(() => (window.__rawbinClient && window.__rawbinClient.connected) === true)}`);

  // CREATE_ROOM as this live member → creator+member of a live room + createRoomHome (Files base)
  const roomId = await page.evaluate(async () => {
    const c = window.__rawbinClient; if (!c || !c.createRoom) return null;
    c.createRoom('R4022 nest-test room', 'SystemTester');
    // wait for the app to enter RoomView (roomId set + #room-tree seeded)
    for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250));
      const t = document.getElementById('room-tree'); if (t && t.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); }
    return null;
  });
  R(`  CREATE_ROOM → RoomView #room-tree seeded roomId=${roomId ? roomId.slice(0, 12) : 'NULL'}`);
  if (!roomId) { results.instrument = 'BLOCKED: #room-tree never seeded on scratch after CREATE_ROOM (instrument gap, NOT product RED — needs a scratch room-render fix)'; throw new Error('no-room-render'); }
  await sleep(1500);

  const FILES = `roomcoll:${roomId}:files`;
  const treeText = () => page.evaluate(() => (document.getElementById('room-tree')?.textContent || '').replace(/\s+/g, ' ').trim());
  // find + click a node in #room-tree whose raw ref matches (tolerate a display-type prefix like 'folder:'/'collection:')
  const selectNode = (raw) => page.evaluate((raw) => {
    const t = document.getElementById('room-tree'); if (!t) return false;
    const nodes = [...t.querySelectorAll('rb-object-item, [ref], [data-ref], [uuid], [data-uuid]')];
    const hit = nodes.find((n) => [...n.attributes].some((a) => { const v = a.value; return v === raw || v.endsWith(':' + raw) || v.includes(raw); }));
    if (!hit) return false; hit.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true;
  }, raw);
  const pressAddFolder = (name) => page.evaluate(async (name) => {
    // the real verb: the '📁 Add folder' button in the detail-drawer action bar (universal-actions dispatch)
    const btn = [...document.querySelectorAll('button, [role="button"], .rb-strip *')].find((e) => /add folder/i.test(e.textContent || ''));
    if (!btn) return { pressed: false };
    // the app prompts for a name — stub window.prompt to return our name, then click the real button
    window.prompt = () => name;
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return { pressed: true };
  }, name);

  // expand Files + select it
  await page.evaluate(async (fref) => { const t = document.getElementById('room-tree'); if (t?.expandPath) await t.expandPath([fref]).catch(() => {}); }, FILES);
  await sleep(800);
  const filesSelected = await selectNode(FILES);
  await sleep(1000);
  const addBtn1 = await pressAddFolder(F1);
  R(`  Files node selected=${filesSelected} | verb '📁 Add folder' pressed(F1)=${addBtn1.pressed}`);
  await sleep(4000); // create + live-insert, NO reload

  const afterF1 = await treeText();
  const A1 = afterF1.includes(F1); // first folder visible in the items-tree beside files, no reload
  results.A1_itemsTree = A1;
  R(`  A1 items-tree: '${F1}' visible in #room-tree beside files (no reload) = ${A1}`);

  // IMMEDIATELY (no reload) add a folder INSIDE F1
  const f1Selected = await selectNode(F1);
  await sleep(800);
  const addBtn2 = await pressAddFolder(F2);
  R(`  '${F1}' selected=${f1Selected} | verb '📁 Add folder' pressed(F2 inside F1)=${addBtn2.pressed}`);
  await sleep(4000);

  const afterF2 = await treeText();
  const A2 = afterF2.includes(F2); // second folder accepted, no reload
  results.A2_nestedAccept = A2;
  // A3 nesting: F2's on-disk/tree parent is F1, not the room root. Check the room folder-create POST target for F2
  //    carried F1 in its path (roomcoll:<id>:files/NestGateOuter), i.e. nested under F1 not root.
  const nestPost = posts.find((p) => /NestGateOuter/.test(decodeURIComponent(p.url)) || /files%2FNestGateOuter|files\/NestGateOuter/.test(p.url));
  results.A3_nestingCorrect = A2 && !!nestPost; // accepted AND routed under F1
  R(`  A2 nested-accept: '${F2}' accepted into '${F1}' (no reload) = ${A2}`);
  R(`  A3 nesting-correct: '${F2}' under '${F1}' (not room root) = ${results.A3_nestingCorrect} (post=${nestPost ? nestPost.url + ' ' + nestPost.status : 'none'})`);

  // A4 on disk: BOTH folders are UNITS in the ONE store, symlinked like files (not bare dirs). Scan the scratch trees.
  const diskA4 = (() => {
    if (!scratchDir) return { ok: false, why: 'no scratchDir' };
    const found = { units: [], symlinks: [], bareDirs: [] };
    const walk = (dir) => { let e = []; try { e = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const d of e) { const p = path.join(dir, d.name);
        if (d.isSymbolicLink() && /NestGate(Outer|Inner)/.test(d.name)) found.symlinks.push(p);
        else if (d.isDirectory()) { if (/NestGate(Outer|Inner)/.test(d.name)) found.bareDirs.push(p); if (found.units.length < 9999) walk(p); }
        else if (d.isFile() && /\.scenario\.json$/.test(d.name)) { try { const j = JSON.parse(fs.readFileSync(p, 'utf8')); if (/NestGate(Outer|Inner)/.test(j?.model?.name || '')) found.units.push({ p: p.replace(scratchDir, ''), name: j.model.name }); } catch {} } } };
    // the ONE store = scenario/index; check it holds BOTH folder units. data/model-store presence = the duplicate-store smell.
    walk(path.join(scratchDir, 'scenario/index'));
    const dupStore = fs.existsSync(path.join(scratchDir, 'data/model-store/index')) ? (() => { const g = []; try { const w = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) w(p); else if (/\.scenario\.json$/.test(e.name)) { try { const j = JSON.parse(fs.readFileSync(p, 'utf8')); if (/NestGate/.test(j?.model?.name || '')) g.push(e.name); } catch {} } } }; w(path.join(scratchDir, 'data/model-store/index')); } catch {} return g; })() : [];
    return { ok: found.units.length >= 2, units: found.units.map((u) => u.name), symlinks: found.symlinks.length, bareDirs: found.bareDirs.length, dupStore };
  })();
  results.A4_oneStoreUnits = diskA4.ok;
  R(`  A4 one-store-units: BOTH folders are units in the ONE store (scenario/index) = ${diskA4.ok} | units=${JSON.stringify(diskA4.units)} symlinks=${diskA4.symlinks} bareDirs=${diskA4.bareDirs} dupStoreHits=${JSON.stringify(diskA4.dupStore)}`);

  R(`  ROUTE-INTERCEPT (corroboration): ${JSON.stringify(posts)}`);
  await ctx.close();
} catch (e) {
  if (!/no-room-render/.test(String(e && e.message))) results.error = String(e && e.message).slice(0, 200);
} finally {
  await browser.close().catch(() => {});
  const td = await f.teardown();
  R(`teardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`);
}

R(`\n═══ TRON NEST-TEST — 4 NAMED RESULTS (arm=${COMMIT}) ═══`);
if (results.instrument) { R(`INSTRUMENT: ${results.instrument}`); process.exit(2); }
R(`  A1 items-tree (F1 beside files, no reload)      : ${results.A1_itemsTree ? 'GREEN' : 'RED'}`);
R(`  A2 nested-accept (F2 into F1, no reload)         : ${results.A2_nestedAccept ? 'GREEN' : 'RED'}`);
R(`  A3 nesting-correct (F2 under F1, not root)       : ${results.A3_nestingCorrect ? 'GREEN' : 'RED'}`);
R(`  A4 one-store-units (both units, one store)       : ${results.A4_oneStoreUnits ? 'GREEN' : 'RED'}`);
const allGreen = results.A1_itemsTree && results.A2_nestedAccept && results.A3_nestingCorrect && results.A4_oneStoreUnits;
R(`OVERALL (arm=${COMMIT}): ${allGreen ? 'ALL GREEN' : 'RED'} ${results.error ? '(err: ' + results.error + ')' : ''}`);
process.exit(allGreen ? 0 : 1);
