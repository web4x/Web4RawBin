// [test:uuid:3c8a5f19-2e74-4d61-b9a3-7f0c6e28d5b4] R30.27/R30.29 3-pane rows align — corresponding lines share ONE visual row across Local/Center/Repository, and drift can't ACCUMULATE past any blank line (R30.29 per-blank resync). R30.23 regression put one-sided spacers at line 0; R30.27 (v0.7.40) fixed the top big-drift but drift still accumulated per-change; R30.29 (Tron's algorithm) resyncs at every blank line — the next full line after each blank re-aligns across all 3 panes.
// LANGUAGE-AGNOSTIC + ASSERTION-GRADE: anchors are unique-common lines (appear exactly once in each pane) — NO method/syntax parsing (method names in the report are just readable reference points). For EVERY such anchor, getTopForLineNumber must be EQUAL (±1px) across edLocal/edCenter/edRemote (AC-5). Checks ALL anchors (not a sample — a 1-row residual hides at one line) with a monotonic false-anchor filter, and separately reports the blank-resync witnesses (first full line after a blank) which must all align. DET-3x. SystemTester-only, read-only.
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
  // LANGUAGE-AGNOSTIC: anchors are unique-common lines (appear exactly once in each pane) — no method/syntax parsing.
  // R30.29 algorithm resyncs at BLANK lines (the next full line after each blank re-aligns), so drift can't accumulate
  // past any blank. Flag postBlank = the line is the first non-blank after a blank in the LOCAL pane — a direct resync
  // witness. The generic "every unique-common line shares a visual row" assertion is a SUPERSET of "post-blank aligned".
  const raw = [];
  for (let i = 1; i < ll.length - 1; i++) { const s = ll[i]; if (!s || s.trim().length < 8) continue;
    const ci = uniqIdx(cl, s), ri = uniqIdx(rl, s), li = uniqIdx(ll, s);
    if (li !== i || ci < 1 || ri < 1) continue;
    // NEIGHBOR-CONTEXT match: require prev+next line identical across all 3 panes → a TRULY corresponding line, not a
    // coincidental same-text dup in a different function (which would be unique-per-pane but map to the wrong region).
    if (ll[i - 1] !== cl[ci - 1] || ll[i - 1] !== rl[ri - 1]) continue;
    if (ll[i + 1] !== cl[ci + 1] || ll[i + 1] !== rl[ri + 1]) continue;
    raw.push({ lL: i + 1, lC: ci + 1, lR: ri + 1, s: s.slice(0, 48), postBlank: ll[i - 1].trim() === '' }); }
  // FALSE-ANCHOR filter: a line can be unique in each pane yet map to DIFFERENT diff regions (→ garbage drift).
  // True corresponding anchors are MONOTONIC — as lL increases, lC and lR only increase, and center/right sit at or
  // below local + the total expansion (center has cl-ll extra lines). Keep the monotonic non-decreasing chain within bounds.
  const expC = cl.length - ll.length, expR = rl.length - ll.length, SLACK = 4;
  const anchors = []; let pLC = 0, pLR = 0;
  for (const a of raw) {
    const dC = a.lC - a.lL, dR = a.lR - a.lL;
    if (a.lC >= pLC && a.lR >= pLR && dC >= -SLACK && dC <= expC + SLACK && dR >= -SLACK && dR <= expR + SLACK) { anchors.push(a); pLC = a.lC; pLR = a.lR; }
  }
  if (anchors.length < 4) return { ok: false, reason: `too few anchors (raw ${raw.length}, mono ${anchors.length})` };
  // check EVERY unique-common anchor (not a sample) — a 1-row residual hides at a single merge-expansion point.
  // mergeExpansion = anchor where the line number differs across panes (center/right carry extra merged lines above).
  const all = anchors.map(a => { const yL = Math.round(L.getTopForLineNumber(a.lL)), yC = Math.round(C.getTopForLineNumber(a.lC)), yR = Math.round(R.getTopForLineNumber(a.lR));
    return { s: a.s, lL: a.lL, lC: a.lC, lR: a.lR, dLC: yL - yC, dLR: yL - yR, yL, yC, yR, expansion: (a.lL !== a.lC || a.lL !== a.lR), postBlank: a.postBlank }; });
  const TOL = 1;
  const misaligned = all.filter(r => Math.abs(r.dLC) > TOL || Math.abs(r.dLR) > TOL);
  const maxDrift = all.reduce((m, r) => Math.max(m, Math.abs(r.dLC), Math.abs(r.dLR)), 0);
  const nExpansion = all.filter(r => r.expansion).length;
  const misExpansion = misaligned.filter(r => r.expansion).length;
  const postBlank = all.filter(r => r.postBlank);
  const postBlankMis = postBlank.filter(r => Math.abs(r.dLC) > TOL || Math.abs(r.dLR) > TOL).length; // R30.29 blank-resync witnesses that still drift
  // report the worst offenders (smallest residuals first are the ones prior sampling missed) + a few expansion-point examples
  const drift = (r) => Math.max(Math.abs(r.dLC), Math.abs(r.dLR));
  const worst = [...misaligned].sort((a, b) => drift(b) - drift(a)).slice(0, 6);
  const firstMis = misaligned[0] || null;
  const top3 = all.slice(0, 3);
  const hist = { d0: all.filter(r => drift(r) === 0).length, d16: all.filter(r => drift(r) === 16).length, d32: all.filter(r => drift(r) === 32).length, dBig: all.filter(r => drift(r) > 32).length };
  return { ok: true, twoWay: e['twoWay'], nConflicts: (e['conflicts'] || []).length, nAnchors: anchors.length, nExpansion, nMisaligned: misaligned.length, misExpansion, maxDrift, worst, firstMis, top3, hist, nPostBlank: postBlank.length, postBlankMis };
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
    const aligned = m.nMisaligned === 0;
    const pass = aligned && m.twoWay === false;
    results.push(pass);
    if (i === 1) { console.log(`  3-way=${!m.twoWay} conflicts=${m.nConflicts} anchors=${m.nAnchors} (${m.nExpansion} expansion) | misaligned=${m.nMisaligned} maxDrift=${m.maxDrift}px | hist 0px:${m.hist.d0} 16px:${m.hist.d16} 32px:${m.hist.d32} >32px:${m.hist.dBig}`);
      console.log(`  R30.29 blank-resync witnesses: ${m.nPostBlank} first-line-after-blank anchors, ${m.postBlankMis} still drift (must be 0 after the fix)`);
      console.log('  top-3 anchors:'); for (const r of m.top3) console.log(`   L${r.lL}/C${r.lC}/R${r.lR} y=(${r.yL},${r.yC},${r.yR}) dLC=${r.dLC} dLR=${r.dLR}  "${r.s}"`);
      if (m.firstMis) console.log(`  FIRST misaligned: L${m.firstMis.lL}/C${m.firstMis.lC}/R${m.firstMis.lR} dLC=${m.firstMis.dLC} dLR=${m.firstMis.dLR}  "${m.firstMis.s}"`);
      console.log('  largest drifts:'); for (const r of m.worst) console.log(`   L${r.lL}/C${r.lC}/R${r.lR} dLC=${r.dLC} dLR=${r.dLR}  "${r.s}"`); }
    console.log(`iter ${i}: 3-way=${!m.twoWay} anchors=${m.nAnchors} misaligned=${m.nMisaligned} maxDrift=${m.maxDrift}px (tol ${TOL}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.27/R30.29 3-pane row alignment — every corresponding line shares a visual row (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — all anchors + blank-resync witnesses aligned' : 'RED (drift accumulates per-change; blank-resync R30.29 not-yet-deployed)');
process.exitCode = green ? 0 : 1;
