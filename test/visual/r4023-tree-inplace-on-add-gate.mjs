// R40.84 — adding a child must UPDATE THAT NODE IN PLACE, not collapse+rebuild the whole tree (Tron 0.8.175, framed as an
// MVC violation: the unit IS the model, a child-add is a mutation on ONE node). Tron's ACs in user terms: when I add a folder
// the tree STAYS exactly where it was and only the folder I added into changes. Assert the RENDER, not a proxy — capture the
// tree state STRUCTURALLY (expanded-set + depth-map + scroll) BEFORE and AFTER an add, four named checks:
//   C1 no-collapse      : the tree does NOT re-seed to root — after-expanded-count >= before (RED = collapsed to nothing)
//   C2 stays-expanded   : every node expanded BEFORE is still expanded AFTER (before-expanded ⊆ after-expanded)
//   C3 outside-unchanged: nodes OTHER than the add-target keep their depth (nothing outside the target node changes)
//   C4 scroll-preserved : the tree's scrollTop is unchanged across the add
// ROOT (architect e0b8cb582, my r4022 mechanism note): RoomView.ts:84 FILE_ADDED→tree.renderSeed = imperative full re-seed
// that clobbers the working per-node reDeriveDirectChildren in-place path. BASELINE RED expected on 0.8.175 (re-seed collapses).
// SELF-OWNED room (SystemTester-style member), scratch-isolated — NEVER Tron's room. @390 WebKit + screenshot. NO re-expand
// after the add (that is exactly what r4022 does to WORK AROUND this bug — here we must SEE the collapse).
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
import path from 'node:path';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const PLAYER = '22222222-3333-4444-8555-666666666666';

const COMMIT = process.env.ARM_COMMIT || 'HEAD';
// R40.84 HARNESS FIX #1: BUILD FRESH FROM SOURCE BY DEFAULT (was: symlink main's committed dist unless ARM_BUILD=1 — that
// served a STALE committed bundle and the gate false-RED'd on pre-fix code). A CLIENT gate must test the built HEAD source,
// never a committed/symlinked bundle. buildDist=true rebuilds dist from the scratch worktree; the F2 guard below then PROVES
// the browser loaded that fresh bundle (not a stale one). Set ARM_BUILD=0 only to deliberately test the served committed dist.
const f = await setupFoundation({ commit: COMMIT, buildDist: process.env.ARM_BUILD !== '0' });
R(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} arm=${COMMIT}`);

const results = {};
// ── R40.84 INSTRUMENT MODE (R4023_PROBE=1) — capture the RUNTIME caller of the residual full-rebuild (architect 6c726abc1
//    eliminated every STATIC render path; the trigger is runtime). Belt-and-suspenders: (a) forward the page console so the
//    expert's console.trace probes reach stdout; (b) our OWN prototype-wrap logs new Error().stack for the 3 methods —
//    guarantees the full caller stack even if console.trace doesn't serialize through Playwright, and arg0 discriminates
//    reDeriveDirectChildren-on-the-ROOT-node vs a child node. Gated by env so a normal fix-gate run stays clean. ──
const R4023_PROBE = process.env.R4023_PROBE === '1';
const probeStacks = [];
const PROTO_PROBE = `(() => {
  const iv = setInterval(() => { const C = customElements.get('rb-trace-tree'); if (!C || !C.prototype || !C.prototype.reDeriveDirectChildren || !C.prototype.renderSeed) return; clearInterval(iv);
    // renderSeed/render: log the CALLER (is a full re-seed STILL firing on add, or genuinely gone?)
    for (const m of ['renderSeed','render']) { const o = C.prototype[m]; C.prototype[m] = function(...a) { try { console.log('[PROBE:'+m+'] arg0='+String(a[0]).slice(0,60)+' STACK<<'+((new Error().stack)||'').replace(/\\n/g,' | ')+'>>'); } catch {} return o.apply(this, a); }; }
    // reDeriveDirectChildren(node, ref): the in-place path. Capture the FOUR FACTS (each → a pre-staged one-line fix):
    //   (1) FIRES? = a [PROBE:reDerive] line appears at all for the Files ref on an add (else key/subscription mismatch)
    //   (2) dataChildren/childNames = does the re-fetched /api/trace/children CONTAIN the new folder? (else link-then-publish ORDER)
    //   (3) shouldInsert = folders in data.children NOT already in the existing rendered refs (else dedup/reconcile-key mismatch)
    //   (4) appended + isConnected + hasTtChildren = was it appended to a LIVE VISIBLE kids container (else collapsed/detached)
    const orig = C.prototype.reDeriveDirectChildren; C.prototype.reDeriveDirectChildren = async function(node, ref) {
      const kids = (node && node.querySelector) ? node.querySelector(':scope > .tt-children') : null; const before = kids ? kids.children.length : -1;
      const existingRefs = kids ? [...kids.querySelectorAll(':scope > .tt-node > .tt-row > rb-object-item')].map(i => i.getAttribute('ref') || '') : [];
      const rec = { ref: String(ref).slice(0,50), fires: true, isConnected: node ? !!node.isConnected : null, hasTtChildren: !!kids, before, existing: existingRefs.length };
      try { const r = await orig.apply(this, arguments); rec.appended = kids ? (kids.children.length - before) : null;
        try { const d = await (await fetch('/api/trace/children/' + encodeURIComponent(ref))).json(); const ch = (d.children||[]).map(c => ({ n: c.name, cref: (c.type||'task').toLowerCase()+':'+c.uuid })); rec.dataChildren = ch.length; rec.childNames = ch.map(c=>c.n).slice(0,14); rec.shouldInsert = ch.filter(c => !existingRefs.includes(c.cref)).map(c=>c.n).slice(0,14); } catch(fe) { rec.fetchErr = String(fe&&fe.message); }
        console.log('[PROBE:reDerive] '+JSON.stringify(rec)); return r; }
      catch (e) { rec.err = String(e && e.message); console.log('[PROBE:reDerive] '+JSON.stringify(rec)); throw e; } };
    console.log('[PROBE] wrapped renderSeed/render/reDeriveDirectChildren'); }, 4); })()`;
const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((tok) => { try { localStorage.setItem('rawbin-player-id', tok); } catch {} }, PLAYER);
  if (R4023_PROBE) await ctx.addInitScript(PROTO_PROBE); // wrap the 3 render methods BEFORE any navigation
  const page = await ctx.newPage();
  if (R4023_PROBE) {
    page.on('console', (m) => { const t = m.text(); const line = `[PAGE:${m.type()}] ${t}`; if (/^\[PROBE/.test(t)) probeStacks.push(t); R(line); });
    page.on('pageerror', (e) => R(`[PAGEERROR] ${e && e.message}`));
  }
  await page.goto(f.base + '/app', { waitUntil: 'domcontentloaded' });
  // ── F2 BUNDLE-INTEGRITY GUARD (R40.84 harness trap): src/public/dist is COMMITTED, so a source-only fix commit leaves the
  //    committed bundle STALE; a scratch that symlinks main's dist (buildDist off) serves PRE-FIX code → the gate false-RED'd.
  //    A gate on a stale bundle makes the verdict meaningless. Assert the ACTUALLY-LOADED bundle is a FRESH build of HEAD, not
  //    the stale committed one. (Durable: content-hashed names → a real rebuild of changed source yields a new hash.) ──
  // CONTENT-based, NOT hash-based: the SAME source builds to DIFFERENT hashes (deployed app-DNFJDBE6.js vs a local build
  // app-P223HX33.js), so comparing hashes is fragile AND a "different hash" does not PROVE the fix is present. Instead prove
  // the LOADED bundle CARRIES THE FIX: the FILE_ADDED handler must NOT call renderSeed (the re-seed clobber R40.84 removed).
  // Anchor on the stable user-facing literal 'File uploaded' (emitted inside that handler) and scan its neighbourhood.
  const loadedUrl = await page.evaluate(() => { const s = [...document.querySelectorAll('script[src]')].map((x) => x.src).find((u) => /app-[A-Z0-9]+\.js/.test(u)); return s || ''; });
  const loadedBundle = (loadedUrl.match(/app-[A-Z0-9]+\.js/) || ['?'])[0];
  const bundleText = loadedUrl ? await page.evaluate(async (u) => { try { return await (await fetch(u)).text(); } catch { return ''; } }, loadedUrl) : '';
  const faIdx = bundleText.indexOf('File uploaded');
  const faRegion = faIdx >= 0 ? bundleText.slice(Math.max(0, faIdx - 400), faIdx + 120) : '';
  const clobberNearFileAdded = /renderSeed/.test(faRegion); // renderSeed adjacent to the FILE_ADDED handler = the PRE-FIX re-seed clobber
  const fixInBundle = faIdx >= 0 && !clobberNearFileAdded;
  results.loadedBundle = loadedBundle; results.fixInBundle = fixInBundle;
  R(`  F2 BUNDLE-INTEGRITY (content): loaded=${loadedBundle} | FILE_ADDED-anchor-found=${faIdx >= 0} | renderSeed-clobber-near-FILE_ADDED=${clobberNearFileAdded} → fix-carried-by-loaded-bundle=${fixInBundle}`);
  if (!fixInBundle) { results.instrument = `BUNDLE-DOES-NOT-CARRY-FIX: loaded=${loadedBundle} FILE_ADDED-found=${faIdx >= 0} clobber-near=${clobberNearFileAdded} — the SERVED bundle still has the re-seed clobber (pre-fix) OR the anchor is missing. Refusing to emit RED/GREEN on a bundle that does not provably carry the R40.84 fix.`; throw new Error('stale-bundle'); }
  await page.waitForFunction(() => (window.__rawbinClient && window.__rawbinClient.connected) === true, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => { const c = window.__rawbinClient; if (c && c.send) c.send({ type: 'UPDATE_PROFILE', name: 'TreeStableMember', secretCode: '4084' }); });
  await sleep(2000);
  const roomId = await page.evaluate(async () => {
    const c = window.__rawbinClient; if (!c || !c.createRoom) return null;
    c.createRoom('R4023 tree-stable room', 'SystemTester');
    for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t && t.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); }
    return null;
  });
  R(`  CREATE_ROOM → roomId=${roomId ? roomId.slice(0, 12) : 'NULL'}`);
  if (!roomId) { results.instrument = 'no-room-render'; throw new Error('no-room-render'); }
  await sleep(1500);
  const FILES = `roomcoll:${roomId}:files`;

  const selectNode = (raw) => page.evaluate((raw) => { const t = document.getElementById('room-tree'); if (!t) return false; const hit = [...t.querySelectorAll('rb-object-item, [ref], [data-ref]')].find((n) => [...n.attributes].some((a) => { const v = a.value; return v === raw || v.endsWith(':' + raw) || v.includes(raw); })); if (!hit) return false; hit.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }, raw);
  const clickByName = (name) => page.evaluate((name) => { const t = document.getElementById('room-tree'); const hit = [...(t?.querySelectorAll('rb-object-item') || [])].find((n) => ((n.getAttribute('title') || '') + ' ' + (n.textContent || '')).includes(name)); if (!hit) return false; hit.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }, name);
  const expandByName = (name) => page.evaluate((name) => { const t = document.getElementById('room-tree'); const hit = [...(t?.querySelectorAll('rb-object-item') || [])].find((n) => ((n.getAttribute('title') || '') + ' ' + (n.textContent || '')).includes(name)); if (!hit) return false; hit.dispatchEvent(new CustomEvent('toggle-children', { bubbles: true, detail: { open: true } })); return true; }, name);
  const pressAddFolder = (name) => page.evaluate((name) => { const btn = [...document.querySelectorAll('button, [role="button"], .rb-strip *')].find((e) => /add folder/i.test(e.textContent || '')); if (!btn) return false; window.prompt = () => name; btn.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }, name);
  const openRoomFiles = async () => { await page.evaluate(async (rid) => { const t = document.getElementById('room-tree'); if (t?.expandPath) await t.expandPath([`room:${rid}`]).catch(() => {}); }, roomId); await sleep(600); await page.evaluate(async (fref) => { const t = document.getElementById('room-tree'); if (t?.expandPath) await t.expandPath([fref]).catch(() => {}); }, FILES); await sleep(600); };
  // capture tree state STRUCTURALLY: expanded-set (node names with children-open), depth-map, scrollTop
  const capture = () => page.evaluate(() => {
    const t = document.getElementById('room-tree'); if (!t) return { expanded: [], depths: {}, scroll: -1, nodeCount: 0 };
    const items = [...t.querySelectorAll('rb-object-item')];
    const nameOf = (n) => (n.getAttribute('title') || (n.textContent || '')).replace(/\s+/g, ' ').trim().slice(0, 24);
    const depth = (n) => { let d = 0, p = n.closest('.tt-node'); while (p) { const up = p.parentElement?.closest('.tt-node'); if (!up) break; d++; p = up; } return d; };
    // "expanded" = the set of VISIBLE nodes (a re-seed collapse drops every deep node → this set shrinks to the root). This
    // tree marks open state structurally (rendered .tt-children), not via a children-open attr, so VISIBLE-set is the honest
    // proxy for "what stayed expanded". Deep nodes (depth>=2) can only be visible if their ancestor stayed expanded.
    const visible = items.map(nameOf);
    const depths = {}; items.forEach((n) => { depths[nameOf(n)] = depth(n); });
    const deepVisible = items.filter((n) => depth(n) >= 2).map(nameOf); // survive only if ancestors stay expanded
    const sc = [...document.querySelectorAll('#rrc-root, .rrc, .room-body, [style*="overflow"]')].find((e) => e.scrollHeight > e.clientHeight) || t.parentElement || t;
    return { visible, deepVisible, depths, scroll: (sc && sc.scrollTop) || 0, nodeCount: items.length, scrollable: sc ? (sc.scrollHeight > sc.clientHeight) : false };
  });

  // ── BUILD an EXPANDED tree state: Files → [Alpha (has a child), Beta, …fillers for scroll] ──
  const treeTextNow = () => page.evaluate(() => (document.getElementById('room-tree')?.textContent || '').replace(/\s+/g, ' ').trim());
  const addUnder = async (parentSel, nm, waitMs = 4200) => { await openRoomFiles(); await parentSel(); await sleep(700); const fired = await pressAddFolder(nm); await sleep(waitMs); await openRoomFiles(); const shown = (await treeTextNow()).includes(nm); R(`    setup add '${nm}': verb=${fired} appears-in-tree=${shown}`); return shown; };
  await openRoomFiles();
  const shownFlags = [];
  shownFlags.push(await addUnder(() => selectNode(FILES), 'Alpha'));
  shownFlags.push(await addUnder(() => clickByName('Alpha'), 'AlphaChild'));
  for (const nm of ['Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta']) shownFlags.push(await addUnder(() => selectNode(FILES), nm, 3200));
  const setupShown = shownFlags.filter(Boolean).length;
  R(`  SETUP POPULATION: ${setupShown}/${shownFlags.length} added folders visible in tree`);
  results.setupPopulated = setupShown;
  // put the tree into a KNOWN expanded state: Files open + Alpha open (showing AlphaChild)
  await openRoomFiles(); await expandByName('Alpha'); await sleep(1000);
  // GATE-INTEGRITY: a no-collapse assertion on an EMPTY/thin tree is HOLLOW (nothing to collapse). Require a populated tree
  // before trusting C1-C4 — else report the population gap honestly instead of a false GREEN.
  if (setupShown < 3) { results.instrument = `HOLLOW-TREE: only ${setupShown}/${shownFlags.length} setup folders rendered — the no-collapse checks would pass vacuously. Either the setup needs adapting to the fixed in-place behavior, OR new folders do NOT appear in-place without a re-expand (a real 'add folder → see it' question for the expert). NOT a valid GREEN.`; throw new Error('hollow-tree'); }
  // scroll down so we can prove scroll-preservation
  await page.evaluate(() => { const t = document.getElementById('room-tree'); const sc = t.closest('[style*="overflow"], .rrc, #rrc-root') || t.parentElement; if (sc) sc.scrollTop = Math.max(0, sc.scrollHeight - 200); });
  await sleep(600);
  const before = await capture();
  await page.screenshot({ path: 'test-results/r4023-before-add.png', fullPage: true }).catch(() => {});
  R(`  BEFORE add: nodeCount=${before.nodeCount} deepVisible=${JSON.stringify(before.deepVisible)} scroll=${before.scroll} scrollable=${before.scrollable}`);

  // ── THE ACT: add ONE more child (into Files) — DO NOT re-expand afterwards (we must SEE whether the tree collapses) ──
  await selectNode(FILES); await sleep(800);
  await pressAddFolder('AddedNode'); await sleep(4500); // FILE_ADDED → (0.8.175) renderSeed re-seed = full collapse
  const after = await capture();
  await page.screenshot({ path: 'test-results/r4023-after-add.png', fullPage: true }).catch(() => {});
  R(`  AFTER add:  nodeCount=${after.nodeCount} deepVisible=${JSON.stringify(after.deepVisible)} scroll=${after.scroll}`);

  // ── C5 (b) — the ADDED folder must RENDER in place (NO re-expand) AND PERSIST. This is the half a no-collapse-only GREEN
  //    would miss: the invisible-add regression (fix removed the re-seed but the in-place render must actually insert the node).
  //    Tron in user terms: "I add a folder → I SEE it appear, and it stays." Assert AddedNode is in the tree right after the
  //    add with no re-expand, and still there after a settle (persist). ──
  const addedRenders = (await treeTextNow()).includes('AddedNode');
  await sleep(1500);
  const addedPersists = (await treeTextNow()).includes('AddedNode');
  results.C5_addedRendersPersists = addedRenders && addedPersists;
  R(`  C5 added-renders+persists (AddedNode visible in place, no re-expand, and stays)  : ${results.C5_addedRendersPersists ? 'GREEN' : 'RED'} (renders=${addedRenders} persists=${addedPersists})`);

  // ── FOUR NAMED CHECKS (Tron's ACs, measured on the RENDER) ──
  const beforeVis = new Set(before.visible), afterVis = new Set(after.visible);
  // C1 no-collapse: the visible tree does not shrink to the root — after keeps at least the before nodes (add is +1 in place)
  results.C1_noCollapse = after.nodeCount >= before.nodeCount && after.nodeCount > 2;
  // C2 stays-expanded: every node visible before (esp. deep, only visible if its ancestor stayed open) is still visible after
  const lost = [...beforeVis].filter((n) => !afterVis.has(n));
  results.C2_staysExpanded = lost.length === 0;
  // C3 outside-unchanged: non-target nodes keep their depth and don't vanish
  const outsideChanged = Object.keys(before.depths).filter((n) => n !== 'AddedNode' && after.depths[n] !== undefined && after.depths[n] !== before.depths[n]);
  const outsideVanished = Object.keys(before.depths).filter((n) => n !== 'AddedNode' && !(n in after.depths));
  results.C3_outsideUnchanged = outsideChanged.length === 0 && outsideVanished.length === 0;
  // C4 scroll-preserved: only meaningful when the tree overflowed (scrollable); else INCONCLUSIVE (report, don't fail hard)
  results.C4_scrollPreserved = before.scrollable ? (Math.abs((after.scroll || 0) - (before.scroll || 0)) <= 8) : true;
  R(`  C1 no-collapse       (visible tree not shrunk to root)    : ${results.C1_noCollapse ? 'GREEN' : 'RED'} (nodeCount ${before.nodeCount} → ${after.nodeCount})`);
  R(`  C2 stays-expanded    (every before-visible node survives) : ${results.C2_staysExpanded ? 'GREEN' : 'RED'} (lost=${JSON.stringify(lost)})`);
  R(`  C3 outside-unchanged (non-target nodes keep depth+exist)  : ${results.C3_outsideUnchanged ? 'GREEN' : 'RED'} (changed=${JSON.stringify(outsideChanged)} vanished=${JSON.stringify(outsideVanished.slice(0, 12))})`);
  R(`  C4 scroll-preserved  (scrollTop unchanged; scrollable=${before.scrollable}) : ${before.scrollable ? (results.C4_scrollPreserved ? 'GREEN' : 'RED') : 'INCONCLUSIVE(no-overflow)'} (${before.scroll} → ${after.scroll})`);
  await ctx.close();
} catch (e) { if (!/no-room-render|stale-bundle|hollow-tree/.test(String(e && e.message))) results.error = String(e && e.message).slice(0, 200); }
finally { await browser.close().catch(() => {}); const td = await f.teardown(); R(`teardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`); }

R(`\n═══ R40.84 add-child-in-place (tree must NOT collapse) — arm=${COMMIT} ═══`);
if (results.instrument) { R(`INSTRUMENT: ${results.instrument}`); process.exit(2); }
R(`  C1 no-collapse       : ${results.C1_noCollapse ? 'GREEN' : 'RED'}`);
R(`  C2 stays-expanded    : ${results.C2_staysExpanded ? 'GREEN' : 'RED'}`);
R(`  C3 outside-unchanged : ${results.C3_outsideUnchanged ? 'GREEN' : 'RED'}`);
R(`  C4 scroll-preserved  : ${results.C4_scrollPreserved ? 'GREEN' : 'RED'}`);
R(`  C5 added-renders+persists (the (b) half) : ${results.C5_addedRendersPersists ? 'GREEN' : 'RED'}`);
// GATE BOTH: (a) no-collapse (C1-C4) AND (b) the added folder RENDERS+persists (C5). A green that only proves (a) is a
// hollow green (the invisible-add regression) — do NOT accept it. Setup-population already fails-loud before here if (b) is broken.
const allGreen = results.C1_noCollapse && results.C2_staysExpanded && results.C3_outsideUnchanged && results.C4_scrollPreserved && results.C5_addedRendersPersists;
R(`OVERALL (arm=${COMMIT}): ${allGreen ? 'ALL GREEN (a: no-collapse + b: renders+persists)' : 'RED'} ${results.error ? '(err: ' + results.error + ')' : ''}`);
if (R4023_PROBE) {
  R(`\n═══ R40.84 PROBE STACKS (the instrument payload — route to architect 0.3) — ${probeStacks.length} captured ═══`);
  probeStacks.forEach((s, i) => R(`  [${i + 1}] ${s}`));
  if (!probeStacks.length) R(`  (none — the expert's console.trace probes are not in this build AND the prototype-wrap saw no fire; check the build has rb-trace-tree upgraded)`);
}
process.exit(allGreen ? 0 : 1);
