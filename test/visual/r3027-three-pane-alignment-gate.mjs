// [test:uuid:3c8a5f19-2e74-4d61-b9a3-7f0c6e28d5b4] R30.27 (674bae73) 3-pane rows align — corresponding lines share ONE visual row across Local/Center/Repository. R30.23 REGRESSION: computeOneSidedHunks hardcoded the non-changed side's start=0, so alignPaneRows piled one-sided spacer rows at line 0 (top) instead of the aligned change position → cumulative drift = "random" rows. FIX (impl-edit to computeMergedCenter a0b30550, marker STAYS): thread per-buffer line counters la/lb, pass aligned aStart/bStart into computeOneSidedHunks (drop the 0 fallbacks).
// ASSERTION-GRADE (AC-5): for each stable/anchor line, getTopForLineNumber is EQUAL (±0) across edLocal/edCenter/edRemote. Anchors = line-strings that appear EXACTLY once in each of the 3 panes (structure-independent), sampled early→late. RED baseline on current prod (Local drifts ~5632px, spacers at line 0) → GREEN when R30.27 deploys. DET-3x. SystemTester-only, read-only (measures getTopForLineNumber; no writes).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const TOL = 1; // px — Monaco line height ~16px; a real misalignment is ≥1 line. ±1 absorbs sub-pixel rounding only.
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const measure = (page) => page.evaluate(() => {
  const e = document.querySelector('rb-diff-editor');
  const L = e['edLocal'], C = e['edCenter'], R = e['edRemote'];
  if (!L || !C || !R) return { ok: false, reason: 'editors missing' };
  const lines = (ed) => ed.getValue().split('\n');
  const ll = lines(L), cl = lines(C), rl = lines(R);
  const uniqIdx = (arr, s) => { let n = 0, at = -1; for (let i = 0; i < arr.length; i++) if (arr[i] === s) { n++; at = i; } return n === 1 ? at : -1; };
  const anchors = [];
  for (let i = 0; i < ll.length; i++) { const s = ll[i]; if (!s || s.trim().length < 8) continue;
    const ci = uniqIdx(cl, s), ri = uniqIdx(rl, s), li = uniqIdx(ll, s);
    if (li === i && ci >= 0 && ri >= 0) anchors.push({ lL: i + 1, lC: ci + 1, lR: ri + 1, s: s.slice(0, 32) }); }
  if (anchors.length < 4) return { ok: false, reason: `too few anchors (${anchors.length})` };
  const N = 12, pick = anchors.length <= N ? anchors : Array.from({ length: N }, (_, k) => anchors[Math.floor(k * (anchors.length - 1) / (N - 1))]);
  const rows = pick.map(a => { const yL = Math.round(L.getTopForLineNumber(a.lL)), yC = Math.round(C.getTopForLineNumber(a.lC)), yR = Math.round(R.getTopForLineNumber(a.lR));
    return { s: a.s, lL: a.lL, dLC: yL - yC, dLR: yL - yR, yL, yC, yR }; });
  const maxDrift = Math.max(...rows.map(r => Math.max(Math.abs(r.dLC), Math.abs(r.dLR))));
  return { ok: true, twoWay: e['twoWay'], nConflicts: (e['conflicts'] || []).length, nAnchors: anchors.length, rows, maxDrift };
});

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 1000 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e?.left?.content?.length > 0 && e?.right?.content?.length > 0; }, { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e && e['edLocal'] && e['edCenter'] && e['edRemote']; }, { timeout: 20000 }).catch(() => {});
    await sleep(2500); // merge + alignPaneRows view-zones settle
    const m = await measure(page);
    if (!m.ok) { results.push(false); console.log(`iter ${i}: SETUP-FAIL — ${m.reason} => RED`); await ctx.close(); continue; }
    const aligned = m.rows.every(r => Math.abs(r.dLC) <= TOL && Math.abs(r.dLR) <= TOL);
    // top-of-file smoking gun: the first sampled anchor must not carry a big line-0 spacer offset in any pane
    const pass = aligned && m.twoWay === false;
    results.push(pass);
    if (i === 1) { console.log(`  3-way=${!m.twoWay} conflicts=${m.nConflicts} anchors=${m.nAnchors} maxDrift=${m.maxDrift}px`);
      for (const r of m.rows) console.log(`   L${r.lL} y=(${r.yL},${r.yC},${r.yR}) dLC=${r.dLC} dLR=${r.dLR}${(Math.abs(r.dLC) > TOL || Math.abs(r.dLR) > TOL) ? ' <<<MISALIGNED' : ''}  "${r.s}"`); }
    console.log(`iter ${i}: 3-way=${!m.twoWay} maxDrift=${m.maxDrift}px (tol ${TOL}) all-anchors-aligned=${aligned} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.27 3-pane row alignment — corresponding lines share a visual row (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — 3 panes aligned' : 'RED (spacers at line 0 → Local drifts; R30.27 not-yet-fixed)');
process.exitCode = green ? 0 : 1;
