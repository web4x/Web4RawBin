// [test:uuid:1dfe3d0f-6193-4525-b6f1-b63cebfd1812] R30.53 BUG-2 fold-affordance (Impl 2de3411f foldByMethodBoundaries) — every method-def at ALL scroll positions (incl the all-unchanged tail below the last change) has a foldable range: computeMethodRanges (its FoldingRangeProvider helper) must NOT desync the brace-parser on the CENTER both-versions duplication. Measured via the folding MODEL (engine-independent): detection reaches the tail, gap(methods−foldRanges)≤50 all panes. RED v0.7.79 (CENTER 20/104, gap 2528) → GREEN v0.7.81 (104/104, gap 0, signature/indent boundaries). Codicon chevron RENDER → Tron real-WebKit device.
// R30.53 BUG-2 — fold affordance MISSING for methods below a boundary (Tron device-QA v0.7.79).
// Root (measured DET): computeMethodRanges' NAIVE brace-depth parser desyncs on the CENTER both-versions render
// (a changed method shows its signature-open line TWICE = two '{' but one '}', e.g. L1326/1328 currentSession) → depth
// never returns to 0 → no top-level method detected below → 55 method-defs get NO fold range/chevron. PRE-EXISTING in
// computeMethodRanges (FIX-A never touched it), newly visible now alignment lets scrolling into the all-unchanged tail.
// GATE: every REAL method-def line must have a fold range — i.e. detection must REACH the last method-def (fold boundary
// must not stop early). Measured via the folding MODEL @iPhone-12 (engine-independent; the codicon RENDER is Tron's device).
// STATUS: RED v0.7.79 (CENTER 20/104, folds stop L1308) → GREEN v0.7.80 (edit-UF6QQZ7E.js): computeMethodRanges by
// SIGNATURE/INDENT (not brace-depth) → CENTER 104/104, gap 0 all panes. DET-3x. (NOTE: the fix EXPOSED a pre-existing
// FIX-A residual parity desync in r3053b — a change-method 'private.complete.panes()' collapsed-in-LEFT below the old boundary.)
import { chromium, devices } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const PROBE = `(async () => {
  const e = document.querySelector('rb-diff-editor');
  const rd = async (ed) => {
    const m = ed.getModel(), N = m.getLineCount();
    const re = /^[A-Za-z_$][\\w.$]*\\s*\\([^)]*\\)\\s*\\{/;                 // a method/function def line (name(...) {)
    let rawDefs = 0, rawMax = 0; for (let i = 1; i <= N; i++) { if (re.test(m.getLineContent(i).trim())) { rawDefs++; rawMax = i; } }
    const detected = e['computeMethodRanges'](m).map(x => x.start);
    const maxDetected = Math.max(0, ...detected);
    return { N, rawDefs, rawMax, detected: detected.length, maxDetected, tailGap: rawMax - maxDetected };
  };
  return { C: await rd(e.edCenter), L: await rd(e.edLocal), R: await rd(e.edRemote) };
})()`;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const rows = [];
try {
  for (let it = 1; it <= 3; it++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e && e.edCenter && e.edLocal && e.edRemote; }, { timeout: 20000 }).catch(() => {});
    await sleep(3000);
    const s = await page.evaluate(PROBE);
    // GREEN: for EVERY pane, method detection reaches the last real method-def (fold affordance to the tail) — tailGap ≤ 50 lines
    const paneOk = (p) => p.tailGap <= 50;
    const pass = paneOk(s.C) && paneOk(s.L) && paneOk(s.R);
    rows.push({ pass, s });
    console.log(`iter ${it}: C[det ${s.C.detected}/${s.C.rawDefs} maxFold=${s.C.maxDetected} lastDef=${s.C.rawMax} gap=${s.C.tailGap}] L[gap=${s.L.tailGap} ${s.L.maxDetected}/${s.L.rawMax}] R[gap=${s.R.tailGap} ${s.R.maxDetected}/${s.R.rawMax}] (N=${s.C.N}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.53 BUG-2 fold-affordance-per-method (@iPhone-12, DET-3x, v0.7.79) =====');
console.log(`  DET-3x: ${rows.map((r, i) => `${i + 1}:${r.pass ? 'G' : 'R'}`).join(' ')}`);
console.log(`  fold detection reaches the tail (gap≤50 all panes): ${rows.every(r => r.pass) ? 'GREEN' : 'RED — CENTER stops at L' + rows[0].s.C.maxDetected + ' of ' + rows[0].s.C.N + ' (last method-def L' + rows[0].s.C.rawMax + ', gap ' + rows[0].s.C.tailGap + ')'}`);
console.log('  ⚠ codicon chevron RENDER still → Tron real-WebKit device (chromium renders 0 fold chevrons).');
const green = rows.length === 3 && rows.every(r => r.pass);
console.log('OVERALL:', green ? 'GREEN DET-3x (every method foldable to the tail)' : 'RED (fold affordance missing below the brace-desync boundary)');
process.exitCode = green ? 0 : 1;
