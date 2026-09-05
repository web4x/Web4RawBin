// NEXT-GATE READINESS for the room-folder RENDER fix (delete the eager Room-type flatten branch; route Files through the
// existing roomcoll lazy branch). Covers THREE of the PO's four (A5a/A5b live in r4022 / r4022b). Dual-mode:
//   ARM_COMMIT=<sha> [ARM_BUILD=1] → spin an isolated SCRATCH build (pre-deploy gate); else BASE=prod (baseline / post-deploy).
// #2 PRECONDITION: the Files node must LAZY-fetch, not render EMPTY (deleting the eager branch must not leave Files blank —
//    worse than flat). Assert: room response Files node has hasChildren:true, AND GET children/roomcoll:<id>:files is non-empty.
// #3 SUNBURST (cross-surface): the sunburst reads childCount+size from the SAME children response we are changing. Render the
//    Files folder detail (rb-detail-view) → assert .dv-sunburst arc-count == direct-child-count, sizes proportional (vary), and
//    a non-zero centre total. A silent size-loss would flatten all arcs to the floor-1 minimum = a regression. Screenshot @390.
// #4 ENVELOPE: nothing OUTSIDE Files changed — the room response keeps {uuid,type,name,hasChildren,children,parent}, and the
//    Members entry is unchanged. Reads room 3231db71 (Tron's real room; present in the committed scratch index too).
import { webkit } from '@playwright/test';
const ROOM = '3231db71-d834-435a-a7f9-a801680ccd62';
const FILES_REF = `folder:roomcoll:${ROOM}:files`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };

const ARM = process.env.ARM_COMMIT || '';
let base = process.env.BASE || 'https://prod.wo-da.de:4444';
let foundation = null;
if (ARM) {
  const { setupFoundation } = await import('./r4031-foundation.mjs');
  foundation = await setupFoundation({ commit: ARM, buildDist: process.env.ARM_BUILD === '1' });
  base = foundation.base;
  console.log(`scratch up: ${base} v${foundation.servedVersion} sha=${foundation.worktreeSha} arm=${ARM}`);
} else {
  console.log(`baseline mode: ${base}`);
}

const results = {};
const browser = await webkit.launch();
try {
  // ── #4 ENVELOPE + #2 PRECONDITION (API-level, read-only GETs) ──
  const roomResp = await (await fetch(`${base}/api/trace/children/${ROOM}`)).json().catch(() => null);
  const envKeys = roomResp ? ['uuid', 'type', 'name', 'hasChildren', 'children', 'parent'].every((k) => k in roomResp) : false;
  const kids = roomResp?.children || [];
  const membersEntry = kids.find((c) => /^Members/.test(String(c.name)));
  const filesEntry = kids.find((c) => /^Files/.test(String(c.name)));
  const membersShapeOk = !!membersEntry && 'hasChildren' in membersEntry && 'childCount' in membersEntry;
  results.envelope = envKeys && !!membersEntry && !!filesEntry && membersShapeOk;
  console.log(`  #4 ENVELOPE: keys=${envKeys} membersEntry=${!!membersEntry}(shapeOk=${membersShapeOk}) filesEntry=${!!filesEntry} => ${results.envelope ? 'GREEN' : 'RED'}`);

  // Files node MUST advertise hasChildren so the client lazy-fetches (not eager-empty after the delete)
  const filesHasChildren = !!filesEntry && filesEntry.hasChildren === true;
  const filesLazy = await (await fetch(`${base}/api/trace/children/roomcoll:${ROOM}:files`)).json().catch(() => null);
  const lazyChildren = filesLazy?.children || [];
  const withSize = lazyChildren.filter((c) => typeof c.size === 'number').length;
  results.precondition = filesHasChildren && lazyChildren.length > 0 && withSize === lazyChildren.length;
  console.log(`  #2 PRECONDITION: Files.hasChildren=${filesHasChildren} | lazy children=${lazyChildren.length} (worse-than-flat if 0) | carry size=${withSize}/${lazyChildren.length} => ${results.precondition ? 'GREEN' : 'RED'}`);

  // ── #3 SUNBURST (rendered artifact) ──
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${base}/app`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-detail-view'), { timeout: 20000 }).catch(() => {});
  await page.evaluate((ref) => {
    let host = document.getElementById('sb-host'); if (host) host.remove();
    host = document.createElement('div'); host.id = 'sb-host';
    host.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0b0f17;overflow:auto;padding:12px';
    const d = document.createElement('rb-detail-view'); d.id = 'sb-detail'; d.setAttribute('ref', ref);
    host.appendChild(d); document.body.appendChild(host);
  }, FILES_REF);
  await sleep(3000);
  const sb = await page.evaluate(() => {
    const d = document.getElementById('sb-detail'); if (!d) return { ok: false, why: 'no detail' };
    const sun = d.querySelector('.dv-sunburst'); if (!sun) return { ok: false, why: 'no .dv-sunburst rendered' };
    const empty = !!sun.querySelector('.dv-sunburst-empty');
    const arcs = [...sun.querySelectorAll('path')];
    const totalText = (sun.querySelector('text')?.textContent || '').trim();
    // proportional: arc <path> 'd' geometries are NOT all identical (varying sweeps ⇒ real byte proportions, not equal slices)
    const ds = arcs.map((p) => p.getAttribute('d') || '');
    const distinct = new Set(ds).size;
    return { ok: !empty && arcs.length > 0 && distinct > 1 && !!totalText && totalText !== '0 B', empty, arcCount: arcs.length, distinctArcs: distinct, totalText };
  });
  // arc-count must equal the direct-child-count from the lazy branch (the acceptance: arc-count == direct children)
  const arcMatchesChildren = sb.arcCount === lazyChildren.length;
  results.sunburst = !!sb.ok && arcMatchesChildren;
  try { await page.screenshot({ path: 'test-results/r4022c-sunburst.png', fullPage: true }); } catch {}
  console.log(`  #3 SUNBURST: rendered=${!sb.empty} arcCount=${sb.arcCount} (==children ${lazyChildren.length}? ${arcMatchesChildren}) distinctArcs=${sb.distinctArcs}(proportional) centreTotal='${sb.totalText}' => ${results.sunburst ? 'GREEN' : 'RED'} | shot test-results/r4022c-sunburst.png`);
  await ctx.close();
} catch (e) { results.error = String(e && e.message).slice(0, 200); console.log('error:', results.error); }
finally {
  await browser.close().catch(() => {});
  if (foundation) { const td = await foundation.teardown(); console.log(`teardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`); }
}

console.log(`\n═══ RENDER-FIX READINESS (${ARM ? 'scratch ' + ARM : 'baseline ' + base}) ═══`);
console.log(`  #2 precondition (Files lazy, not empty)   : ${results.precondition ? 'GREEN' : 'RED'}`);
console.log(`  #3 sunburst (arcs proportional, un-regressed): ${results.sunburst ? 'GREEN' : 'RED'}`);
console.log(`  #4 envelope (Members + shape unchanged)   : ${results.envelope ? 'GREEN' : 'RED'}`);
const green = results.precondition && results.sunburst && results.envelope;
console.log(`OVERALL: ${green ? 'GREEN' : 'RED'} ${results.error ? '(err: ' + results.error + ')' : ''}`);
process.exit(green ? 0 : 1);
