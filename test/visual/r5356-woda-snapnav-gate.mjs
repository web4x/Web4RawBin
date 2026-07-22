// [test:uuid:432beb1a-a6fe-44d2-8e68-c76b36617566] R31.5.5 RbEditorLayout.editorStripDescriptor (Impl 3b8e6c24) — GREEN DET-3x @390 v0.7.119: pure descriptor [C:Left, bar:leftCB, C:Center, bar:rightCB, C:Right] (nav Left/Center/Right) drives an rb-strip INSTANCE → 3 compartments + 2 bars (one-model-two-instances alongside WODA 5.6). AC-INV-PRESENTATION.
// [test:uuid:d826997d-dd96-4b52-95fe-d3e269cc8edf] R31.5.6 RbWoda.wodaStripDescriptor (Impl 5f9d2a7c) — GREEN DET-3x @390 v0.7.119: pure descriptor [bar:What, C:Overview, C:Details, bar:Actions] (exact shape) drives an rb-strip INSTANCE → 2 compartments + 2 bars (one-model-two-instances). AC-INV-PRESENTATION.
// [test:uuid:99ab8d5e-5def-4763-9efa-889bfb45c34d] R31.5.3 RbSnapNav.render (Impl 7c1f9a3e) — GREEN DET-3x @390 v0.7.119: one .rb-snap-btn per COMPARTMENT of the bound strip (Alpha|Gamma), BARS NOT buttons (Bar1 excluded), labels from descriptor, click → native scrollIntoView snap fires. AC-INV-PRESENTATION.
// R31.5.6 RbWoda.wodaStripDescriptor (Impl 5f9d2a7c) + R31.5.3 RbSnapNav.render (Impl 7c1f9a3e) — AC-INV-PRESENTATION,
// DET-3x @390 iPhone-12. served v0.7.119 (pid 1314990). Net-new UNIMPORTED components → esbuild-bundled standalone
// (rb-compartment/rb-strip/rb-woda/rb-snap-nav) injected into a page (app.css). One-model-two-instances (WODA is an
// rb-strip instance); snap-nav = one button per COMPARTMENT (bars are NOT buttons), click → native scrollIntoView snap.
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`;
const SCRATCH = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad';
const BUNDLE = fs.readFileSync(`${SCRATCH}/r5356-bundle.js`, 'utf8');
const SHELL = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body><div id="host"></div><script type="module">${BUNDLE}</script></body></html>`;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.route((u) => u.pathname === '/r5356', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
    await page.goto(`${BASE}/r5356`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!(customElements.get('rb-woda') && customElements.get('rb-snap-nav') && customElements.get('rb-strip')), { timeout: 20000 }).catch(() => {});

    // 5.6 wodaStripDescriptor — pure descriptor [bar:What, C:Overview, C:Details, bar:Actions] + drives an rb-strip INSTANCE
    const c56 = await page.evaluate(() => {
      const host = document.getElementById('host'); host.innerHTML = '';
      const woda = document.createElement('rb-woda');
      const desc = woda.wodaStripDescriptor();
      const strip = document.createElement('rb-strip'); host.appendChild(strip); strip.items = desc;
      const comps = Array.from(strip.querySelectorAll(':scope > .rb-seg-compartment'));
      const bars = Array.from(strip.querySelectorAll(':scope > .rb-bar'));
      return { desc, compLabels: comps.map(c => (c.textContent || '').trim()).filter(Boolean), compCount: comps.length, barCount: bars.length };
    });
    const descShapeOk = JSON.stringify(c56.desc) === JSON.stringify([
      { id: 'what', kind: 'bar', label: 'What' }, { id: 'overview', kind: 'compartment', label: 'Overview' },
      { id: 'details', kind: 'compartment', label: 'Details' }, { id: 'actions', kind: 'bar', label: 'Actions' }]);
    const wodaInstanceOk = c56.compCount === 2 && c56.barCount === 2; // 2 compartments (O,D) + 2 bars (What,Actions)

    // 5.3 RbSnapNav.render — one .rb-snap-btn per COMPARTMENT (bars excluded), labels from descriptor, click → scrollIntoView
    const c53 = await page.evaluate(() => {
      const snapped = []; const orig = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function () { snapped.push((this.getAttribute && this.getAttribute('data-seg-id')) || (this.textContent || '').trim().slice(0, 12)); return orig ? orig.apply(this, arguments) : undefined; };
      const host = document.getElementById('host'); host.innerHTML = '';
      const strip = document.createElement('rb-strip'); host.appendChild(strip);
      strip.items = [{ id: 'alpha', kind: 'compartment', label: 'Alpha' }, { id: 'bar1', kind: 'bar', label: 'Bar1' }, { id: 'gamma', kind: 'compartment', label: 'Gamma' }];
      const nav = document.createElement('rb-snap-nav'); host.appendChild(nav); nav.strip = strip;
      const btns = Array.from(nav.querySelectorAll('.rb-snap-btn'));
      const labels = btns.map(b => (b.textContent || '').trim());
      btns[0] && btns[0].click();
      Element.prototype.scrollIntoView = orig;
      return { btnCount: btns.length, labels, snapped, compartments: strip.querySelectorAll(':scope > .rb-seg-compartment').length };
    });
    const snapNavOk = c53.btnCount === 2 && c53.compartments === 2 && /Alpha/.test(c53.labels.join(',')) && /Gamma/.test(c53.labels.join(',')) && !/Bar1/.test(c53.labels.join(',')) && c53.snapped.length >= 1;

    // 5.5 editorStripDescriptor — [C:Left, bar:leftCB, C:Center, bar:rightCB, C:Right] (nav {Left,Center,Right}) → rb-strip INSTANCE
    const c55 = await page.evaluate(() => {
      const host = document.getElementById('host'); host.innerHTML = '';
      const ed = document.createElement('rb-editor-layout'); // detached — call the PURE descriptor without connectedCallback
      const desc = ed.editorStripDescriptor();
      const strip = document.createElement('rb-strip'); host.appendChild(strip); strip.items = desc;
      return { desc, compCount: strip.querySelectorAll(':scope > .rb-seg-compartment').length, barCount: strip.querySelectorAll(':scope > .rb-bar').length };
    });
    const editorDescOk = JSON.stringify(c55.desc) === JSON.stringify([
      { id: 'left', kind: 'compartment', label: 'Left' }, { id: 'leftCB', kind: 'bar' }, { id: 'center', kind: 'compartment', label: 'Center' },
      { id: 'rightCB', kind: 'bar' }, { id: 'right', kind: 'compartment', label: 'Right' }]);
    const editorInstanceOk = c55.compCount === 3 && c55.barCount === 2; // 3 editor panes (L/C/R) + 2 change-bars

    await ctx.close();
    const pass = descShapeOk && wodaInstanceOk && snapNavOk && editorDescOk && editorInstanceOk;
    results.push(pass);
    console.log(`iter ${i}: [5.6]desc=${descShapeOk} inst=${wodaInstanceOk}(${c56.compCount}C+${c56.barCount}b) | [5.3]snapNav=${snapNavOk}(btns=${c53.btnCount} ${c53.labels.join('|')} noBar=${!/Bar1/.test(c53.labels.join(','))}) | [5.5]editorDesc=${editorDescOk} inst=${editorInstanceOk}(${c55.compCount}C+${c55.barCount}b) => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

console.log('\n===== R31.5.6 wodaStripDescriptor + R31.5.3 RbSnapNav.render (DET-3x @390) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
