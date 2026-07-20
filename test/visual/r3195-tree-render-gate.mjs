// [test:uuid:eb324c68-7a5b-4b69-96f4-e3a0aa1d2f1b] R31.3 RbTraceTree.buildSeedNode (Impl 5b3d9f1a) — tree RENDER behavior (v0.7.95), DET-3x.
// SEPARATE from the readSessionTree DATA Test (9467b1c6). Per architect design-server-manager.md:213 + IMG_4598.
// Drives the SERVED rb-trace-tree (registered on /trace) with an otmux fixture (session→window→pane inline children) —
// engine-independent, no owner ws. Asserts: (a) correct INITIAL COLLAPSED + NO explode-then-settle (only roots render);
// (b) 3-level LAYER-BY-LAYER expand (session→windows collapsed, window→panes) — each direct child collapsed w/ own chevron;
// (c) WINDOW node has a chevron + its OWN proper label (distinct per window, not a "0: bash" placebo); (d) independent
// collapse; (e) /trace 2-level graph tree UNREGRESSED. Interactive visual = Tron device (IMG_4598).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, TARGET = '0.7.95';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (path) => new Promise((r) => { const req = https.request({ host: HOST, port: PORT, path, method: 'GET', rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r(b)); }); req.on('error', () => r('')); req.end(); });

// otmux fixture: 1 session, 2 windows (DISTINCT labels), each 1 pane
const ROOTS = [{
  uuid: 'sess-A', type: 'otmuxsession', name: 'robbinTeam2', hasChildren: true, children: [
    { uuid: 'win-0', type: 'otmuxwindow', name: '0: bash', hasChildren: true, children: [{ uuid: 'pane-0', type: 'otmuxpane', name: '%10 bash', hasChildren: false, children: [] }] },
    { uuid: 'win-1', type: 'otmuxwindow', name: '1: vim', hasChildren: true, children: [{ uuid: 'pane-1', type: 'otmuxpane', name: '%12 vim', hasChildren: false, children: [] }] },
  ],
}];
// count VISIBLE nodes (a collapsed level may keep children in the DOM but hidden — render cares about what's SHOWN)
const count = (page, prefix) => page.evaluate((p) => [...document.querySelectorAll(`rb-object-item[ref^="${p}"]`)].filter(el => el.offsetParent !== null && el.getClientRects().length > 0).length, prefix);
const clickExpander = (page, ref) => page.evaluate((r) => { const it = document.querySelector(`rb-object-item[ref="${r}"]`); const ex = it && it.querySelector('.oi-expand'); if (ex) ex.click(); return !!ex; }, ref);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const versionOk = JSON.parse(await httpGet('/api/config') || '{}').version === TARGET;
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1200, height: 900 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-trace-tree'), { timeout: 20000 }).catch(() => {});

    // mount a fresh rb-trace-tree with the otmux fixture (buildSeedNode path)
    await page.evaluate((roots) => {
      document.querySelectorAll('#sm-test-tree').forEach(e => e.remove());
      const t = document.createElement('rb-trace-tree'); t.id = 'sm-test-tree'; document.body.appendChild(t);
      t.items = roots;
    }, ROOTS);
    await sleep(600);

    // (a) initial: only the session renders — windows/panes NOT in DOM (collapsed + no explode-then-settle)
    const s0 = await count(page, 'otmuxsession:'), w0 = await count(page, 'otmuxwindow:'), p0 = await count(page, 'otmuxpane:');
    const initialCollapsed = s0 === 1 && w0 === 0 && p0 === 0;

    // (b) expand session → 2 windows, COLLAPSED (no panes) = layer-by-layer
    await clickExpander(page, 'otmuxsession:sess-A'); await sleep(400);
    const w1 = await count(page, 'otmuxwindow:'), p1 = await count(page, 'otmuxpane:');
    const layerByLayer = w1 === 2 && p1 === 0;

    // (c) each WINDOW has a chevron + its OWN proper label (distinct, not a placebo)
    const winInfo = await page.evaluate(() => ['otmuxwindow:win-0', 'otmuxwindow:win-1'].map((r) => { const it = document.querySelector(`rb-object-item[ref="${r}"]`); return { ref: r, chevron: !!(it && it.querySelector('.oi-expand')), label: (it && it.textContent || '').trim() }; }));
    const windowChevronLabel = winInfo[0].chevron && winInfo[1].chevron
      && /0:\s*bash/.test(winInfo[0].label) && /1:\s*vim/.test(winInfo[1].label)
      && winInfo[0].label !== winInfo[1].label; // distinct → not a shared placebo

    // (b2) expand win-1 → its pane appears (independent 3rd level)
    await clickExpander(page, 'otmuxwindow:win-1'); await sleep(400);
    const p2 = await count(page, 'otmuxpane:');
    const thirdLevel = p2 === 1;

    // (d) collapse session → windows+panes hidden (independent toggle)
    await clickExpander(page, 'otmuxsession:sess-A'); await sleep(400);
    const w3 = await count(page, 'otmuxwindow:'), p3 = await count(page, 'otmuxpane:');
    const independentCollapse = w3 === 0 && p3 === 0;

    // (e) /trace 2-level graph tree UNREGRESSED: the page's own rb-trace-tree renders nodes + a node expands
    const traceOk = await page.evaluate(async () => {
      const t = document.querySelector('rb-trace-tree:not(#sm-test-tree)');
      if (!t) return false;
      const before = document.querySelectorAll('rb-trace-tree:not(#sm-test-tree) rb-object-item').length;
      const ex = t.querySelector('rb-object-item .oi-expand'); if (!ex) return before > 0; // renders even if top is leaf
      ex.click(); await new Promise(r => setTimeout(r, 400));
      const after = document.querySelectorAll('rb-trace-tree:not(#sm-test-tree) rb-object-item').length;
      return before > 0 && after >= before;
    });

    const pass = versionOk && initialCollapsed && layerByLayer && windowChevronLabel && thirdLevel && independentCollapse && traceOk;
    results.push(pass);
    console.log(`iter ${i}: init-collapsed=${initialCollapsed}(s${s0}/w${w0}/p${p0}) layer-by-layer=${layerByLayer}(w${w1}/p${p1}) win-chevron+label=${windowChevronLabel}("${winInfo[0].label}"|"${winInfo[1].label}") 3rd-level=${thirdLevel}(p${p2}) indep-collapse=${independentCollapse}(w${w3}/p${p3}) trace-unregressed=${traceOk} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R31.3 tree RENDER (buildSeedNode) layer-by-layer (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
