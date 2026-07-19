// [test:uuid:a3adc5cf-83ac-4b30-b242-8d754211ce91] R30.53 FIX-A initial-render parity (Impl 640f8428 keepChangeMethodsExpanded) — at INITIAL render (no toggle), an UNCHANGED method DOWNSTREAM of a green ADD collapses in ALL 3 panes incl LEFT (no Math.max split-floor leaves it expanded on the left) + 0px downstream row-drift. Measured via the folding MODEL (isCollapsed), engine-independent; DISCRIMINATES RED 1/19 (v0.7.78) → GREEN 0/19 (v0.7.79) = real parity, not a codicon false-negative. Codicon chevron RENDER = Tron real-WebKit (separate).
// [test:uuid:e3e64c49-eaaa-41ae-9524-3c3b8cbfa7e0] R30.53 FIX-B mirror-by-signature (Impl b629c015 syncNativeFold) — after a green ADD, toggling a shared unchanged method mirrors across L/C/R BY SIGNATURE (not raw index) + 0px row-drift. DISCRIMINATES RED 3/19 → GREEN 0/19 with the fix.
// R30.53b — left-pane fold DESYNC after a green add-block (Tron device-QA bug my r3053 MISSED).
// Root cause: _mirrorFold maps methods by RAW method-index (rb-diff-editor.ts:389 ranges[i]); a green ADD-block present in one
// side shifts the LEFT↔center/repo method-index correspondence, so an UNCHANGED method DOWNSTREAM of the add desyncs its fold-state
// left-vs-center/repo → 3-pane misalignment. This gate asserts, at iPhone-12: (1) fold-state PARITY across L/C/R for EVERY unchanged
// method present in all 3 panes (MATCHED BY CONTENT/signature, not index — index-matching is exactly what the bug relies on);
// (2) 0px downstream row-drift (getTopForLineNumber equal across L/C/R for a unique anchor line after an add-block). Measurable in
// chromium (folding MODEL + layout getTopForLineNumber — engine-independent); pure codicon RENDER still → Tron's real WebKit device.
// STATUS: RED v0.7.78 (1/19 init + 3/19 toggle) → GREEN v0.7.79 (19-method scope: FIX-A classify-parity + FIX-B mirror-by-sig).
// ★ RE-RED v0.7.80 (edit-UF6QQZ7E.js): the BUG-2 tail-detection fix (r3053c, 20→104 methods) EXPOSED a PRE-EXISTING FIX-A
// per-pane-clip residual → INITIAL parity RED 1/79, offender `private.complete.panes()` (change-method overlapping a conflict
// in all 3 → must stay EXPANDED, but LEFT collapsed it 86-88 vs C 89-95 / R 85-91 expanded). FIX-B toggle-mirror STAYS GREEN 0/79.
// ★ FLIPPED GREEN v0.7.81 (edit-5RVLY3DA.js, FIX-A2): keepChangeMethodsExpanded now classifies the change-set ONCE by
// signature-UNION across panes → panes() expanded ×3, INITIAL parity 0/79 + toggle 0/79 + 0px drift, DET-3x. INV-A2 verified
// (collapsed-set-by-sig identical L/C/R = 51/51/51). r3053c unregressed 104/104. R30.53 parity DONE; codicon RENDER → Tron device.
import { chromium, devices } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1`;
const OUT = 'test-results/r3053b-parity';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// per pane: every method's {sig(start-line text), start, collapsed}; + a downstream-anchor row-drift probe
const PROBE = `(async () => {
  const e = document.querySelector('rb-diff-editor');
  const methods = async (ed) => {
    const fm = await ed.getContribution('editor.contrib.folding').getFoldingModel();
    const ranges = e['computeMethodRanges'](ed.getModel());
    return ranges.map(r => ({ sig: ed.getModel().getLineContent(r.start).trim(), start: r.start, collapsed: !!fm.getRegionAtLine(r.start)?.isCollapsed }));
  };
  return { L: await methods(e.edLocal), C: await methods(e.edCenter), R: await methods(e.edRemote),
           conflicts: (e.conflicts||[]).map(c => ({ kind: c.kind, aStart: c.aStart, bStart: c.bStart, a: (c.a||[]).length, b: (c.b||[]).length })) };
})()`;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const rows = [];
try {
  for (let it = 1; it <= 3; it++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e && e.edCenter && e.edLocal && e.edRemote; }, { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(async () => { try { const e = document.querySelector('rb-diff-editor'); const fm = await e.edCenter.getContribution('editor.contrib.folding').getFoldingModel(); let c = 0; for (let i = 0; i < fm.regions.length; i++) if (fm.regions.isCollapsed(i)) c++; return c > 0; } catch { return false; } }, { timeout: 20000 }).catch(() => {});
    await sleep(1500);

    const s = await page.evaluate(PROBE);
    // (1) PARITY: for each method signature present in ALL 3 panes, collapse-state must be identical across L/C/R
    const bySig = (arr) => { const m = new Map(); for (const x of arr) if (!m.has(x.sig) && x.sig.length > 3) m.set(x.sig, x); return m; };
    const L = bySig(s.L), C = bySig(s.C), R = bySig(s.R);
    const shared = [...C.keys()].filter(sig => L.has(sig) && R.has(sig));
    const desyncs = shared.filter(sig => { const l = L.get(sig).collapsed, c = C.get(sig).collapsed, r = R.get(sig).collapsed; return !(l === c && c === r); });
    const parityOk = desyncs.length === 0;

    // green ADD-block = a one-sided addition (a==0,b>0) or (b==0,a>0) — find its line, pick a downstream shared collapsed method
    const add = s.conflicts.find(c => (c.a === 0 && c.b > 0) || (c.b === 0 && c.a > 0));
    const addLine = add ? (add.aStart || add.bStart || 0) : 0;

    // (2) downstream row-drift: for a shared method DOWNSTREAM of the add-block, the SAME text line must sit at the SAME Y across L/C/R
    let driftPx = null, driftSig = null;
    const downstream = shared.map(sig => C.get(sig)).filter(x => x.start > addLine + 3).sort((a, b) => a.start - b.start);
    if (downstream.length) {
      driftSig = downstream[Math.min(3, downstream.length - 1)].sig;
      driftPx = await page.evaluate((sig) => {
        const e = document.querySelector('rb-diff-editor');
        const topOf = (ed) => { const m = e['computeMethodRanges'](ed.getModel()).find(r => ed.getModel().getLineContent(r.start).trim() === sig); return m ? ed.getTopForLineNumber(m.start) : null; };
        const l = topOf(e.edLocal), c = topOf(e.edCenter), r = topOf(e.edRemote);
        return (l == null || c == null || r == null) ? -1 : Math.max(Math.abs(l - c), Math.abs(c - r), Math.abs(l - r));
      }, driftSig);
    }
    const driftOk = driftPx !== null && driftPx >= 0 && driftPx <= 1;

    if (it === 1) { await page.screenshot({ path: `${OUT}/parity-iter1.png` }).catch(() => {}); }

    // FIX-B lever: after a manual toggle the raw-index _mirrorFold must NOT add desync → re-measure parity post-toggle
    await page.evaluate(async () => { const e = document.querySelector('rb-diff-editor'); const fm = await e.edCenter.getContribution('editor.contrib.folding').getFoldingModel(); for (let i = 0; i < fm.regions.length; i++) { if (fm.regions.isCollapsed(i)) { const ln = fm.regions.getStartLineNumber(i); e.edCenter.setPosition({ lineNumber: ln, column: 1 }); e.edCenter.getAction('editor.unfold').run(); break; } } });
    await sleep(800);
    const s2 = await page.evaluate(PROBE);
    const L2 = bySig(s2.L), C2 = bySig(s2.C), R2 = bySig(s2.R);
    const shared2 = [...C2.keys()].filter(sig => L2.has(sig) && R2.has(sig));
    const desyncs2 = shared2.filter(sig => { const l = L2.get(sig).collapsed, c = C2.get(sig).collapsed, r = R2.get(sig).collapsed; return !(l === c && c === r); });
    const parityAfterToggleOk = desyncs2.length === 0;

    const pass = parityOk && driftOk && parityAfterToggleOk;                 // FIX-A (initial) + row-drift + FIX-B (toggle)
    rows.push({ pass, parityOk, driftOk, parityAfterToggleOk, shared: shared.length, desyncN: desyncs.length, desyncN2: desyncs2.length, sampleDesync: desyncs.slice(0, 3).map(x => x.slice(0, 32)), addLine, driftPx });
    console.log(`iter ${it}: INITIAL-parity=${parityOk}(${desyncs.length}/${shared.length}) [FIX-A] | downstream-drift=${driftOk}(${driftPx}px) | POST-TOGGLE-parity=${parityAfterToggleOk}(${desyncs2.length}/${shared2.length}) [FIX-B] | desync-ex=${JSON.stringify(desyncs.slice(0, 2).map(x => x.slice(0, 28)))} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.53b left-pane fold PARITY after add-block (@iPhone-12, DET-3x, v0.7.78) =====');
console.log(`  DET-3x: ${rows.map((r, i) => `${i + 1}:${r.pass ? 'G' : 'R'}`).join(' ')}`);
console.log(`  [FIX-A] INITIAL-load parity L/C/R (no interaction): ${rows.every(r => r.parityOk) ? 'GREEN' : 'RED (' + rows[0].desyncN + '/' + rows[0].shared + ' desync — keepChangeMethodsExpanded per-pane clip)'}`);
console.log(`  downstream 0px row-drift:                            ${rows.every(r => r.driftOk) ? 'GREEN' : 'RED (' + rows[0].driftPx + 'px)'}`);
console.log(`  [FIX-B] POST-TOGGLE parity L/C/R (mirror):           ${rows.every(r => r.parityAfterToggleOk) ? 'GREEN' : 'RED (' + rows[0].desyncN2 + ' desync — _mirrorFold raw-index :389)'}`);
console.log('  ⚠ pure codicon RENDER still → Tron real-WebKit (chromium renders 0 fold chevrons).');
const green = rows.length === 3 && rows.every(r => r.pass);
console.log('OVERALL:', green ? 'GREEN DET-3x (initial+toggle parity + downstream 0px)' : 'RED (two-mechanism desync: FIX-A initial-clip + FIX-B mirror-index)');
process.exitCode = green ? 0 : 1;
