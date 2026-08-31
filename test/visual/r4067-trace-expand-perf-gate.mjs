// /trace TREE EXPAND PERF GATE (P0, Tron regression B) — the perf/lazy AC (req 94c1211c 'eager-lazy Sprints collection',
// ~100ms) had NO gate on the USER's surface: r301 gates /trace STRUCTURE (STALE Sprint-30-era hardcode, PHANTOM — invoked
// by no runner, no fetch-count assert), r332b gates the /MODEL tree perf. So the /trace tree's fan-out regressed silently.
// FAMILY = perf-AC-gated-on-a-different-surface (mirror of the AC-surface law: a gate on a surface the USER never uses = proxy).
//
// ARCHITECT CONTRACT (732558d07): expand(node) === EXACTLY 1 /api/trace/children request (the node's OWN children); badges +
// chevrons derive from childCount+hasChildren IN THAT response; the client MUST NEVER re-fetch /children/<eachChild>. The
// fan-out is prefetchVisibleLayer (rb-trace-tree:644): expanding Sprint-40 fires 1 (sprint) + 63 (one per task) = 64. Per-
// expand (per toggle), NOT cumulative — a manual deep path is O(depth-clicked), fine; the violated invariant is per-expand==1.
//
// STATED==IMPLEMENTED — asserts EXACTLY, BOTH HARD (a level RED if EITHER fails; (B) DONE only when BOTH hold — PO ruling):
//   (1) ★ COUNT: each LAZY expand issues === 1 /children request (the MECHANISM; network-INDEPENDENT = the fan-out defect).
//   (2) ★ LATENCY: expand < 100ms under a throttled ~Tron-Chrome profile (the REQUIREMENT — Tron's AC is '<100ms', NOT '1
//       request'; count-only would false-green while the 28s task-level client-render still makes Tron wait). Count is the
//       MECHANISM, latency is the REQUIREMENT — a level may pass count and FAIL latency, and that is RED (a SECOND bottleneck:
//       measured client-side render, NOT the fan-out — all 3 task-level server calls are 0.4s, yet the client burns ~28s).
// DERIVE-DON'T-HARDCODE (anti-rot, the r301 lesson):
// discover the sprint + walk each level from the LIVE tree at runtime — NO literal sprint number/uuid to go stale.
// STUB-MUST-FAIL / non-vacuous: a POSITIVE control blocks the per-child prefetch (route-abort /children except the target) →
// count===1 → PASS (proves the gate GREENs when bounded = the architect's fixed state), alongside the natural fan-out → RED.
// Read-only (GET /children; no mint, no owner-auth, no writes).
import { chromium } from '@playwright/test';
import fs from 'node:fs';

// ── ASSERTION (b) STRUCTURAL (PO brief BRIEF-server-perf-fix.md, network-INDEPENDENT = "the thing we control"): the
// /api/trace/children server handler must compute per-child counts O(children), NOT full-index-scan idx.list() over
// ~5777 units per request (server.ts:2992 CR-owner map + :3028 reverse-CR append + :3048 parent-scan). The fix = a
// cached CR-owner reverse-index (built once, invalidated on CR write). Assert the STRUCTURE, not a timing. String-
// anchored on the route conditions (anti-rot, the r301 lesson — NEVER a line number). Scans HEAD source = the deployable
// structure; GREEN-verify in GATE_BUILDDIST mode (served==HEAD worktree) so structural + behavioral reflect the same build.
function structuralAssertion() {
  try {
    const src = fs.readFileSync(new URL('../../src/ts/server/server.ts', import.meta.url), 'utf8');
    const start = src.indexOf("filepath.startsWith('/api/trace/children/')");
    const end = src.indexOf("filepath.startsWith('/api/ior/')", start + 1);
    if (start < 0 || end <= start) return { scans: -1, pass: false, note: 'anchors-not-found (route strings changed — update the gate)' };
    const region = src.slice(start, end);
    const scans = (region.match(/idx\.list\(\)/g) || []).length;
    return { scans, pass: scans === 0, note: scans === 0 ? 'O(children)' : `${scans} full-index-scan(s) on the children path — O(total-units) per request` };
  } catch (e) { return { scans: -1, pass: false, note: `read-failed: ${String(e && e.message).slice(0, 80)}` }; }
}

// BASE: prod (read-only, default) OR — GATE_BUILDDIST=1 — a buildDist-from-HEAD scratch (contains the expert's fan-out fix;
// verifies count===1 + isolates task-latency WITHOUT fan-out pressure = the PO's coupling test done with the REAL fix).
let BASE = process.env.GATE_BASE || 'https://prod.wo-da.de:4444';
let foundation = null;
if (process.env.GATE_BUILDDIST) { const { setupFoundation } = await import('./r4031-foundation.mjs'); foundation = await setupFoundation({ buildDist: true }); BASE = foundation.base; console.log(`(buildDist scratch from HEAD ${foundation.worktreeSha}, v${foundation.servedVersion})`); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EXPECT_REQUESTS = 1;     // architect 732558d07: EXACTLY 1 /children per lazy expand (the node's own children).
const LATENCY_BUDGET_MS = 100; // req 94c1211c "~100ms". Measured under the throttled profile.
const NET_RTT_MS = 80;         // realistic desktop RTT (NOT loopback) so the fan-out serialises like Tron sees it.
const childOf = (url) => { const m = /\/api\/trace\/children\/([^?]+)/.exec(url); return m ? decodeURIComponent(m[1]) : null; };

const browser = await chromium.launch({ args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
let posControl = null;
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1400, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  let blockPrefetchExcept = null; // when set, abort /children/<x> for x !== this uuid (simulate the fix: no per-child prefetch)
  let reqs = [];
  await page.route('**/api/trace/children/**', async (route) => {
    const u = childOf(route.request().url());
    if (blockPrefetchExcept && u && u !== blockPrefetchExcept) { route.abort(); return; } // positive-control: kill the prefetch
    reqs.push(u ? u.slice(0, 8) : '?');
    await sleep(NET_RTT_MS); route.continue();
  });

  await page.goto(BASE + '/trace', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('rb-object-item').length > 1, { timeout: 30000 }).catch(() => {});
  await sleep(1500);

  const expand = async (uuid) => {
    reqs = []; const t0 = Date.now();
    const ok = await page.evaluate((u) => {
      const it = [...document.querySelectorAll('rb-object-item')].find((x) => (x.getAttribute('ref') || '').endsWith(':' + u) || (x.getAttribute('ref') || '').includes(u));
      if (!it) return false;
      it.dispatchEvent(new CustomEvent('toggle-children', { bubbles: true, detail: { open: true } }));
      return true;
    }, uuid);
    if (!ok) return { missing: true };
    await page.waitForFunction((u) => { const it = [...document.querySelectorAll('rb-object-item')].find((x) => (x.getAttribute('ref') || '').includes(u)); const n = it && (it.closest('.tt-node') || it.parentElement); const k = n && n.querySelector('.tt-children'); return k && k.querySelectorAll('rb-object-item').length > 0; }, uuid, { timeout: 90000 }).catch(() => {});
    const ms = Date.now() - t0;
    // discover a CHILD of this node that itself has children (to walk the next level), derive-don't-hardcode
    const nextChild = await page.evaluate((u) => {
      const it = [...document.querySelectorAll('rb-object-item')].find((x) => (x.getAttribute('ref') || '').includes(u));
      const n = it && (it.closest('.tt-node') || it.parentElement); const box = n && n.querySelector('.tt-children'); if (!box) return null;
      for (const c of box.querySelectorAll(':scope > .tt-node > .tt-row rb-object-item, :scope rb-object-item')) {
        const ref = c.getAttribute('ref') || ''; const uuid = ref.split(':').pop();
        if ((c.getAttribute('child-count') && c.getAttribute('child-count') !== '0') || c.hasAttribute('has-children')) return { uuid, type: ref.split(':')[0] };
      }
      const first = box.querySelector('rb-object-item'); const r = first && first.getAttribute('ref'); return r ? { uuid: r.split(':').pop(), type: r.split(':')[0] } : null;
    }, uuid);
    return { count: reqs.length, ms, nextChild };
  };

  // open the eager Sprints collection, then DERIVE a sprint that has tasks, and walk down levels from the live tree
  await expand('sprints-collection-30-1'); await sleep(400);
  let target = await page.evaluate(() => {
    const t = document.querySelector('rb-trace-tree'); const box = t?.querySelectorAll(':scope > .tt-node')[1]?.querySelector(':scope > .tt-children');
    for (const c of (box?.querySelectorAll('rb-object-item') || [])) { const ref = c.getAttribute('ref') || ''; if (ref.startsWith('sprint:') && c.getAttribute('child-count') && c.getAttribute('child-count') !== '0') return { uuid: ref.split(':').pop(), type: 'Sprint' }; }
    const any = box?.querySelector('rb-object-item[ref^="sprint:"]'); const r = any?.getAttribute('ref'); return r ? { uuid: r.split(':').pop(), type: 'Sprint' } : null;
  });
  for (let level = 0; level < 5 && target; level++) {
    const r = await expand(target.uuid);
    if (r.missing) { results.push({ type: target.type, missing: true }); break; }
    // the FAN-OUT defect is count > 1 (O(children) per-child prefetch). count 0 = already-cached/leaf (no fetch needed),
    // count 1 = the lazy on-demand fetch — BOTH bounded (no fan-out). A leaf/cached node must NOT false-fail the gate.
    const countPass = r.count <= EXPECT_REQUESTS;
    const clabel = r.count > EXPECT_REQUESTS ? 'FAN-OUT' : r.count === 0 ? 'cached/leaf' : 'OK';
    results.push({ type: target.type, uuid: target.uuid.slice(0, 8), count: r.count, ms: r.ms, countPass, clabel, latencyPass: r.ms < LATENCY_BUDGET_MS });
    console.log(`  ${String(target.type).padEnd(11)} ${target.uuid.slice(0, 8)}: requests=${r.count} (≤${EXPECT_REQUESTS} no-fan-out → ${clabel}) | ${r.ms}ms (budget ${LATENCY_BUDGET_MS} → ${r.ms < LATENCY_BUDGET_MS ? 'OK' : 'SLOW'})`);
    target = r.nextChild; await sleep(400);
  }

  // POSITIVE CONTROL (stub-must-fail / non-vacuous): re-open a fresh sprint with the per-child prefetch BLOCKED → count===1
  const c2 = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1400, height: 900 }, serviceWorkers: 'block' });
  const p2 = await c2.newPage();
  let reqs2 = []; let onlyKeep = null;
  await p2.route('**/api/trace/children/**', async (route) => { const u = childOf(route.request().url()); if (onlyKeep && u && u !== onlyKeep) { route.abort(); return; } reqs2.push(u); await sleep(NET_RTT_MS); route.continue(); });
  await p2.goto(BASE + '/trace', { waitUntil: 'domcontentloaded' });
  await p2.waitForFunction(() => document.querySelectorAll('rb-object-item').length > 1, { timeout: 30000 }).catch(() => {});
  await sleep(1200);
  await p2.evaluate(() => { const t = document.querySelector('rb-trace-tree'); t?.querySelectorAll(':scope > .tt-node')[1]?.querySelector(':scope > .tt-row rb-object-item')?.dispatchEvent(new CustomEvent('toggle-children', { bubbles: true, detail: { open: true } })); });
  await sleep(600);
  const spUuid = results.find((r) => r.type === 'Sprint' && r.uuid)?.uuid;
  if (spUuid) {
    const full = await p2.evaluate((pref) => { const it = [...document.querySelectorAll('rb-object-item')].find((x) => (x.getAttribute('ref') || '').includes(pref)); return it ? (it.getAttribute('ref') || '').split(':').pop() : null; }, spUuid);
    onlyKeep = full; reqs2 = [];
    await p2.evaluate((pref) => { const it = [...document.querySelectorAll('rb-object-item')].find((x) => (x.getAttribute('ref') || '').includes(pref)); it?.dispatchEvent(new CustomEvent('toggle-children', { bubbles: true, detail: { open: true } })); }, spUuid);
    await sleep(2500);
    posControl = { blockedPrefetchCount: reqs2.length, pass: reqs2.length === EXPECT_REQUESTS };
    console.log(`  POSITIVE CONTROL (per-child prefetch BLOCKED, ~the fix): sprint expand requests=${reqs2.length} → count===1 reachable=${posControl.pass}`);
  }
  await c2.close();
  await ctx.close();
} finally { await browser.close().catch(() => {}); if (foundation) { const td = await foundation.teardown(); console.log(`teardown: prod:4444 up=${td.prodUp} leftover=${td.leftover}`); } }

// ── verdict ──
const measured = results.filter((r) => !r.missing);
const fanOut = measured.filter((r) => !r.countPass);
const slow = measured.filter((r) => !r.latencyPass);
const nonVacuous = posControl && posControl.pass; // count===1 is REACHABLE (the gate GREENs when bounded) = not always-RED
const structural = structuralAssertion(); // (b) server O(children), source-structural
console.log(`\n═══ /trace EXPAND PERF GATE ═══`);
console.log(`  (b) STRUCTURAL: idx.list() full-scans in the /api/trace/children handler = ${structural.scans} → ${structural.pass ? 'PASS (O(children))' : 'RED'} [${structural.note}]`);
console.log(`DEFINITION (stated==implemented, architect 732558d07 + PO latency-ruling): TWO HARD assertions, both required — (1) COUNT: each LAZY expand === ${EXPECT_REQUESTS} /children request (mechanism, network-independent); (2) LATENCY: expand < ${LATENCY_BUDGET_MS}ms @ ${NET_RTT_MS}ms-RTT (the AC — count-only false-greens while a 28s client-render still makes Tron wait). A level RED if EITHER fails. Targets DERIVED from the live tree (anti-rot, r301 lesson). FAMILY: perf-AC-gated-on-a-different-surface.`);
for (const r of results) console.log(`  ${String(r.type).padEnd(11)} ${r.missing ? 'NOT-FOUND' : `count=${r.count} (${r.clabel}) latency=${r.ms}ms (${r.latencyPass ? 'OK' : 'SLOW'})`}`);
console.log(`  NON-VACUOUS (positive control: count===1 reachable with prefetch blocked): ${nonVacuous}`);
const green = measured.length >= 1 && fanOut.length === 0 && slow.length === 0 && nonVacuous && structural.pass;
console.log(`\nVERDICT: ${green ? 'GREEN — (a) every lazy expand O(1)-bounded (===1) + (b) server O(children) no full-scan + (c) within budget' : 'RED (baseline — the fix has targets) — (a)FAN-OUT: [' + fanOut.map((r) => r.type + ':' + r.count + 'req').join(', ') + '] (c)SLOW: [' + slow.map((r) => r.type + ':' + r.ms + 'ms').join(', ') + '] (b)STRUCTURAL: ' + (structural.pass ? 'ok' : structural.scans + ' full-index-scan(s) on the children path') + '. (a) client fan-out=prefetchVisibleLayer(rb-trace-tree:644); (b) server O(total) scan=server.ts:2992/3028/3048 → cached CR-owner reverse-index. HOLD until all three assertions GREEN.'}`);
console.log(`NOTE (c): LATENCY budget ${LATENCY_BUDGET_MS}ms @ ${NET_RTT_MS}ms-RTT is the ASPIRATIONAL placeholder — reset to the MEASURED achievable floor (O(children) + 1 RTT) once the fix is measurable in GATE_BUILDDIST mode (PO ruling: a bare 100ms rots like r301).`);
process.exit(green ? 0 : 1);
