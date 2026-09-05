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
const f = await setupFoundation({ commit: COMMIT, buildDist: process.env.ARM_BUILD === '1' });
R(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} arm=${COMMIT}`);

const results = {};
const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await ctx.addInitScript((tok) => { try { localStorage.setItem('rawbin-player-id', tok); } catch {} }, PLAYER);
  const page = await ctx.newPage();
  await page.goto(f.base + '/app', { waitUntil: 'domcontentloaded' });
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
  await openRoomFiles();
  await selectNode(FILES); await sleep(800);
  await pressAddFolder('Alpha'); await sleep(4200); await openRoomFiles();
  await clickByName('Alpha'); await sleep(1200);
  await pressAddFolder('AlphaChild'); await sleep(4200); await openRoomFiles(); // Alpha now has a child → expandable
  // a few filler folders so the tree can overflow @390 (meaningful scroll test)
  for (const nm of ['Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta']) { await openRoomFiles(); await selectNode(FILES); await sleep(500); await pressAddFolder(nm); await sleep(3200); }
  // put the tree into a KNOWN expanded state: Files open + Alpha open (showing AlphaChild)
  await openRoomFiles(); await expandByName('Alpha'); await sleep(1000);
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
} catch (e) { if (!/no-room-render/.test(String(e && e.message))) results.error = String(e && e.message).slice(0, 200); }
finally { await browser.close().catch(() => {}); const td = await f.teardown(); R(`teardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`); }

R(`\n═══ R40.84 add-child-in-place (tree must NOT collapse) — arm=${COMMIT} ═══`);
if (results.instrument) { R(`INSTRUMENT: ${results.instrument}`); process.exit(2); }
R(`  C1 no-collapse       : ${results.C1_noCollapse ? 'GREEN' : 'RED'}`);
R(`  C2 stays-expanded    : ${results.C2_staysExpanded ? 'GREEN' : 'RED'}`);
R(`  C3 outside-unchanged : ${results.C3_outsideUnchanged ? 'GREEN' : 'RED'}`);
R(`  C4 scroll-preserved  : ${results.C4_scrollPreserved ? 'GREEN' : 'RED'}`);
const allGreen = results.C1_noCollapse && results.C2_staysExpanded && results.C3_outsideUnchanged && results.C4_scrollPreserved;
R(`OVERALL (arm=${COMMIT}): ${allGreen ? 'ALL GREEN' : 'RED (baseline: the re-seed collapses the tree on child-add)'} ${results.error ? '(err: ' + results.error + ')' : ''}`);
process.exit(allGreen ? 0 : 1);
