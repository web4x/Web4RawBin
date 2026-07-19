// R30.53 native-fold changes-focused folding — LOGIC-PROXY gate @ iPhone-12 (v0.7.78, edit-MMNL6FBX.js).
// ★ ENGINE NOTE (PO/architect gateEnvironmentNote): the RENDER ACs (native codicon chevron + '…' placeholder = AC-native-folding(a),
//   AC-mobile touch-tap) MUST be gated on real-WebKit / Tron's device — Playwright chromium-emulating-iPhone renders 0 fold-decoration
//   codicons (false-negative). WebKit is NOT launchable on this SHARED host (binary installed, but 13 system libs missing → needs
//   `playwright install-deps` = sudo, which I must NOT add unilaterally). SO: RENDER(a)+mobile-touch → Tron's real device (he's testing = truth).
//   The LOGIC ACs gate HERE in chromium via the FOLDING MODEL (engine-independent — the FoldingRangeProvider + collapse-state math run
//   regardless of codicon render; measured: model populates 20-33 regions/pane, 16-21 collapsed). Impls: foldByMethodBoundaries 2de3411f,
//   keepChangeMethodsExpanded 640f8428, syncNativeFold b629c015. DET-3x. Read-only (no writes; fold toggles are in-memory view state).
import { chromium, devices } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1`; // a SHELL file (otmux), multi-method → foldable
const OUT = 'test-results/r3053-fold';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// in-page: read a pane's folding model (region count, collapsed count, collapsed start-lines) + the impl's unchanged-method count
const PROBE = `(async () => {
  const e = document.querySelector('rb-diff-editor');
  const rd = async (ed, side) => {
    const fc = ed.getContribution('editor.contrib.folding'); const fm = await fc.getFoldingModel(); const rg = fm.regions;
    const n = rg.length; let collapsed = 0; const cLines = [];
    for (let i = 0; i < n; i++) { if (rg.isCollapsed(i)) { collapsed++; cLines.push(rg.getStartLineNumber(i)); } }
    let unchanged = -1; try { unchanged = e['keepChangeMethodsExpanded'](e['computeMethodRanges'](ed.getModel()), side).length; } catch {}
    return { n, collapsed, cLines, unchanged };
  };
  return { L: await rd(e.edLocal, 'local'), C: await rd(e.edCenter, 'center'), R: await rd(e.edRemote, 'remote') };
})()`;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const rows = [];
try {
  for (let it = 1; it <= 3; it++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e && e.edCenter && e.edLocal && e.edRemote; }, { timeout: 20000 }).catch(() => {});
    await page.waitForFunction(async () => { const e = document.querySelector('rb-diff-editor'); try { const fm = await e.edCenter.getContribution('editor.contrib.folding').getFoldingModel(); let c = 0; for (let i = 0; i < fm.regions.length; i++) if (fm.regions.isCollapsed(i)) c++; return c > 0; } catch { return false; } }, { timeout: 20000 }).catch(() => {});
    await sleep(1500);

    // ── AC-c: initial auto-collapse of UNCHANGED methods + change methods STAY EXPANDED ──
    const s0 = await page.evaluate(PROBE);
    const autoCollapsed = s0.L.collapsed > 0 && s0.C.collapsed > 0 && s0.R.collapsed > 0;         // unchanged methods collapsed in all 3
    const someExpanded = s0.L.collapsed < s0.L.n && s0.C.collapsed < s0.C.n && s0.R.collapsed < s0.R.n; // change methods stay expanded
    // rigor: collapsed count == the impl's unchanged-method classification (changes-focused: fold ⟺ unchanged)
    const matchesUnchanged = [s0.L, s0.C, s0.R].every(p => p.unchanged >= 0 && Math.abs(p.collapsed - p.unchanged) <= 1);
    const acCollapse = autoCollapsed && someExpanded && matchesUnchanged;
    if (it === 1) await page.screenshot({ path: `${OUT}/fold-initial-iter1.png` }).catch(() => {});

    // ── AC-b: manual toggle in CENTER mirrors the CORRESPONDING method (matched by SIGNATURE TEXT, not raw index) in L+R ──
    // read collapse-state of the method matching a signature in each pane (content-match → robust to per-pane method-count差)
    const MATCH = (sig) => `(async () => {
      const e = document.querySelector('rb-diff-editor');
      const st = async (ed) => { const fm = await ed.getContribution('editor.contrib.folding').getFoldingModel();
        const ranges = e['computeMethodRanges'](ed.getModel());
        const hit = ranges.find(r => ed.getModel().getLineContent(r.start).trim() === ${JSON.stringify(sig)}.trim());
        if (!hit) return { found: false }; const rg = fm.getRegionAtLine(hit.start); return { found: true, line: hit.start, collapsed: !!rg?.isCollapsed }; };
      return { C: await st(e.edCenter), L: await st(e.edLocal), R: await st(e.edRemote) };
    })()`;
    // pick a collapsed CENTER method that ALSO exists (by signature) in both L and R → a genuine shared unchanged method
    const pick = await page.evaluate(`(async () => {
      const e = document.querySelector('rb-diff-editor');
      const fmC = await e.edCenter.getContribution('editor.contrib.folding').getFoldingModel();
      const rangesC = e['computeMethodRanges'](e.edCenter.getModel());
      const sigOf = (ed, ln) => ed.getModel().getLineContent(ln).trim();
      const inPane = (ed, sig) => e['computeMethodRanges'](ed.getModel()).some(r => ed.getModel().getLineContent(r.start).trim() === sig);
      for (const r of rangesC) { const rg = fmC.getRegionAtLine(r.start); if (!rg?.isCollapsed) continue;
        const sig = sigOf(e.edCenter, r.start); if (sig.length > 3 && inPane(e.edLocal, sig) && inPane(e.edRemote, sig)) return { line: r.start, sig }; }
      return null;
    })()`);
    let acSync = false, before = null, afterUnfold = null, afterRefold = null;
    if (pick) {
      before = await page.evaluate(MATCH(pick.sig));
      await page.evaluate((ln) => { const e = document.querySelector('rb-diff-editor'); e.edCenter.setPosition({ lineNumber: ln, column: 1 }); e.edCenter.getAction('editor.unfold').run(); }, pick.line);
      await sleep(900);
      afterUnfold = await page.evaluate(MATCH(pick.sig));
      await page.evaluate((ln) => { const e = document.querySelector('rb-diff-editor'); e.edCenter.setPosition({ lineNumber: ln, column: 1 }); e.edCenter.getAction('editor.fold').run(); }, pick.line);
      await sleep(900);
      afterRefold = await page.evaluate(MATCH(pick.sig));
      // the CORRESPONDING method (by signature) must unfold in all 3, then re-fold in all 3
      const allFound = [before, afterUnfold, afterRefold].every(s => s.C.found && s.L.found && s.R.found);
      const unfoldedAll3 = afterUnfold.C.collapsed === false && afterUnfold.L.collapsed === false && afterUnfold.R.collapsed === false;
      const refoldedAll3 = afterRefold.C.collapsed === true && afterRefold.L.collapsed === true && afterRefold.R.collapsed === true;
      acSync = allFound && unfoldedAll3 && refoldedAll3;
    }

    // ── AC-e: scroll DOWN, toggle a fold → scroll position STAYS ANCHORED (no jump to line 1) ──
    await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); e.edCenter.setScrollTop(e.edCenter.getTopForLineNumber(400)); });
    await sleep(500);
    const topBefore = await page.evaluate(() => document.querySelector('rb-diff-editor').edCenter.getVisibleRanges()[0].startLineNumber);
    const uln2 = s0.C.cLines.find(l => l > 380 && l < 700) || s0.C.cLines[s0.C.cLines.length - 1];
    await page.evaluate((ln) => { const e = document.querySelector('rb-diff-editor'); e.edCenter.setPosition({ lineNumber: ln, column: 1 }); e.edCenter.getAction('editor.unfold').run(); }, uln2);
    await sleep(900);
    const topAfter = await page.evaluate(() => document.querySelector('rb-diff-editor').edCenter.getVisibleRanges()[0].startLineNumber);
    const acScroll = topBefore > 50 && topAfter > 50 && Math.abs(topAfter - topBefore) <= 12; // anchored near where we were, NOT reset to line 1

    const pass = acCollapse && acSync && acScroll;
    rows.push({ pass, acCollapse, acSync, acScroll, s0, topBefore, topAfter });
    if (it === 1 && pick) console.log(`  DIAG mirror(sig="${pick.sig.slice(0, 40)}") before[C${before.C.collapsed} L${before.L.collapsed} R${before.R.collapsed}] →unfold[C${afterUnfold.C.collapsed} L${afterUnfold.L.collapsed} R${afterUnfold.R.collapsed}] →refold[C${afterRefold.C.collapsed} L${afterRefold.L.collapsed} R${afterRefold.R.collapsed}]`);
    console.log(`iter ${it}: auto-collapse=${acCollapse}(L${s0.L.collapsed}/${s0.L.n} C${s0.C.collapsed}/${s0.C.n} R${s0.R.collapsed}/${s0.R.n}, ==unchanged=${matchesUnchanged}) | mirror-sync=${acSync}(pick=${!!pick}) | scroll-anchor=${acScroll}(top ${topBefore}→${topAfter}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.53 native-fold LOGIC (chromium model-proxy @iPhone-12, DET-3x, v0.7.78) =====');
console.log(`  logic DET-3x: ${rows.map((r, i) => `${i + 1}:${r.pass ? 'G' : 'R'}`).join(' ')}`);
console.log(`  AC-c auto-collapse+keep-expanded: ${rows.every(r => r.acCollapse) ? 'GREEN' : 'RED'}`);
console.log(`  AC-b 3-pane mirror-sync:          ${rows.every(r => r.acSync) ? 'GREEN' : 'RED'}`);
console.log(`  AC-e scroll-anchor (no jump-to-1): ${rows.every(r => r.acScroll) ? 'GREEN' : 'RED'}`);
console.log('  ⚠ RENDER(a native codicon chevron + "…") + mobile-touch: NOT gatable here (webkit unlaunchable, no install-deps) → TRON REAL DEVICE / real-WebKit.');
const green = rows.length === 3 && rows.every(r => r.pass);
console.log('OVERALL LOGIC:', green ? 'GREEN DET-3x (b sync + c auto-collapse/keep-expanded + e scroll-anchor)' : 'RED');
process.exitCode = green ? 0 : 1;
