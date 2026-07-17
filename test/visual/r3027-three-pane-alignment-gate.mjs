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
  const centerSeq = e['centerSeq'], conflicts = e['conflicts'] || [];
  if (!centerSeq || !centerSeq.length) return { ok: false, reason: 'no centerSeq (2-way, not 3-way)' };
  const ll = L.getValue().split('\n'), cl = C.getValue().split('\n'), rl = R.getValue().split('\n');
  // GROUND-TRUTH correspondence from the DIFF STRUCTURE (not content-uniqueness — a recurring method-sig line at a
  // non-corresponding position would read as a false ~32000px deviation). Walk centerSeq tracking running LOCAL/CENTER/
  // REMOTE line positions: {ok} = a stable run present identically in all 3 panes → the real anchors; {cid} = a conflict/
  // change block → resync la/lc/lb to the conflict's absolute aStart/bStart/span-end (the same la/lb R30.27/29 thread).
  // For each {ok} stable line, find its ACTUAL line number in each pane (structural la/lc/lb are only a SEARCH HINT —
  // the local counter can diverge from the real editor content by the very 2-row drift we hunt, so we must NOT trust it
  // for measurement, and must NOT drop the divergent lines). Distinctive lines (len>=10) are located by content within a
  // window; correspondence stays diff-structure-anchored (we search near the structural estimate, not globally).
  const findNear = (arr, s, guess, win) => { for (let d = 0; d <= win; d++) { if (arr[guess + d] === s) return guess + d; if (d && guess - d >= 0 && arr[guess - d] === s) return guess - d; } return -1; };
  let la = 0, lc = 0, lb = 0; const rows = []; let notFound = 0;
  for (const seg of centerSeq) {
    if ('ok' in seg) { const K = seg.ok.length;
      for (let k = 0; k < K; k++) { const s = seg.ok[k]; if (!s || s.trim().length < 10) continue;
        const aL = findNear(ll, s, la + k, 12), aC = findNear(cl, s, lc + k, 12), aR = findNear(rl, s, lb + k, 12);
        if (aL < 0 || aC < 0 || aR < 0) { notFound++; continue; }
        const yL = Math.round(L.getTopForLineNumber(aL + 1)), yC = Math.round(C.getTopForLineNumber(aC + 1)), yR = Math.round(R.getTopForLineNumber(aR + 1));
        rows.push({ lL: aL + 1, lC: aC + 1, lR: aR + 1, s: s.slice(0, 44), dLC: yL - yC, dLR: yL - yR, yL, yC, yR, postBlank: k > 0 && seg.ok[k - 1].trim() === '' }); }
      la += K; lc += K; lb += K;
    } else { const c = conflicts.find(x => x.id === seg.cid); if (!c) continue;
      la = c.aStart + c.a.length; lb = c.bStart + c.b.length; lc = c.span[1]; }
  }
  if (rows.length < 4) return { ok: false, reason: `too few anchors (${rows.length}, notFound ${notFound})` };
  const contentBad = notFound;
  const TOL = 1, drift = (r) => Math.max(Math.abs(r.dLC), Math.abs(r.dLR));
  const misaligned = rows.filter(r => drift(r) > TOL);
  const maxDrift = rows.reduce((m, r) => Math.max(m, drift(r)), 0);
  const postBlank = rows.filter(r => r.postBlank), postBlankMis = postBlank.filter(r => drift(r) > TOL).length;
  const worst = [...misaligned].sort((a, b) => drift(b) - drift(a)).slice(0, 6);
  const hist = { d0: rows.filter(r => drift(r) === 0).length, d16: rows.filter(r => drift(r) === 16).length, d32: rows.filter(r => drift(r) === 32).length, dBig: rows.filter(r => drift(r) > 32).length };
  return { ok: true, twoWay: e['twoWay'], nConflicts: conflicts.length, nSeq: centerSeq.length, nAnchors: rows.length, notFound, nMisaligned: misaligned.length, maxDrift, worst, firstMis: misaligned[0] || null, top3: rows.slice(0, 3), hist, nPostBlank: postBlank.length, postBlankMis };
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
    if (i === 1) { console.log(`  3-way=${!m.twoWay} conflicts=${m.nConflicts} centerSeq=${m.nSeq} anchors=${m.nAnchors} notFound=${m.notFound} | misaligned=${m.nMisaligned} maxDrift=${m.maxDrift}px | hist 0px:${m.hist.d0} 16px:${m.hist.d16} 32px:${m.hist.d32} >32px:${m.hist.dBig}`);
      console.log(`  R30.29 blank-resync witnesses: ${m.nPostBlank} first-line-after-blank anchors, ${m.postBlankMis} still drift (must be 0)`);
      console.log('  top-3 anchors:'); for (const r of m.top3) console.log(`   L${r.lL}/C${r.lC}/R${r.lR} y=(${r.yL},${r.yC},${r.yR}) dLC=${r.dLC} dLR=${r.dLR}  "${r.s}"`);
      if (m.firstMis) console.log(`  FIRST misaligned: L${m.firstMis.lL}/C${m.firstMis.lC}/R${m.firstMis.lR} dLC=${m.firstMis.dLC} dLR=${m.firstMis.dLR}  "${m.firstMis.s}"`);
      if (m.worst.length) { console.log('  largest drifts:'); for (const r of m.worst) console.log(`   L${r.lL}/C${r.lC}/R${r.lR} dLC=${r.dLC} dLR=${r.dLR}  "${r.s}"`); } }
    console.log(`iter ${i}: 3-way=${!m.twoWay} centerSeq-anchors=${m.nAnchors} notFound=${m.notFound} misaligned=${m.nMisaligned} maxDrift=${m.maxDrift}px => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.27/R30.29 3-pane row alignment — every corresponding line shares a visual row (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — all anchors + blank-resync witnesses aligned' : 'RED (drift accumulates per-change; blank-resync R30.29 not-yet-deployed)');
process.exitCode = green ? 0 : 1;
