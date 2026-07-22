// [test:uuid:fb804b87-b381-487f-b220-fdf972c8db87] R31.5.1 RbCompartment.applyPresentation (Impl 4d7e2a91) — AC-INV-PRESENTATION: expanded↔bar flip branches ONLY presentation (attr + bar strip); the .rbc-content children are NEVER reparented (same node identity across flips, isConnected) + the bar item PROXIES the source element's behavior (click→source.click). GREEN DET-3x @390.
// [test:uuid:14df64cd-a8af-4c40-aaf8-f742ab91ea5f] R31.5.2 RbStrip.renderDescriptors (Impl 8f1b6c3d) — ordered row from descriptors, DIFF/PATCH: reuse a segment by id (node identity preserved on re-order-in-place a,b,c→c,a,b), rebuild ONLY on kind-change, drop removed. GREEN DET-3x @390.
// [test:uuid:f4419019-11a6-401b-bd12-af9344d47d13] R31.5.4 RbStrip.applyViewportMode (Impl 2a9c5e17) — data-mode branch landscape↔portrait (app.css flex-all-visible vs scroll-snap) + focus-restore: on a real flip (prev set + activeId) scrollIntoView the ACTIVE compartment. GREEN DET-3x @390.
// R31.5 FOUNDATION — RbCompartment.applyPresentation (5.1 Impl 4d7e2a91) + RbStrip.renderDescriptors (5.2 Impl 8f1b6c3d)
// + RbStrip.applyViewportMode (5.4 Impl 2a9c5e17). Net-new UNIMPORTED components → gated STANDALONE: esbuild-bundle
// injected into a page (app.css for the CSS-mode branches), driven at @390 iPhone-12 (Tron viewport). DET-3x.
// AC-INV-PRESENTATION: the SAME instance, ALL presentation/viewport combos, keeps the SAME functional content (node
// identity preserved — never reparented/rebuilt except on kind-change; behavior proxied; order diff-patched).
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`;
const BUNDLE = fs.readFileSync('/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/r315-bundle.js', 'utf8');
const SHELL = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body><div id="host"></div><script type="module">${BUNDLE}</script></body></html>`;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.route((u) => u.pathname === '/r315', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
    await page.goto(`${BASE}/r315`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!(customElements.get('rb-strip') && customElements.get('rb-compartment')), { timeout: 20000 }).catch(() => {});

    // 5.1 applyPresentation — content children NEVER reparented across expanded↔bar flips; bar proxies source behavior
    const c1 = await page.evaluate(() => {
      const host = document.getElementById('host'); host.innerHTML = '';
      const c = document.createElement('rb-compartment');
      c.innerHTML = '<button data-verb="save" class="src">Save</button><span class="txt">hello</span>';
      host.appendChild(c); // connectedCallback → wrap into .rbc-content ONCE
      const wrapped = !!c.querySelector(':scope > .rbc-content');
      const srcBefore = c.querySelector('.rbc-content .src');
      c.applyPresentation('bar');
      const presBar = c.getAttribute('presentation') === 'bar';
      const bar = c.querySelector('.rbc-bar');
      const barItems = bar ? bar.querySelectorAll('.rbc-bar-item').length : 0;
      let srcClicked = 0; srcBefore.addEventListener('click', () => srcClicked++);
      bar?.querySelector('.rbc-bar-item')?.click();          // proxy → source.click()
      c.applyPresentation('expanded');
      const presExp = c.getAttribute('presentation') === 'expanded';
      const srcAfter = c.querySelector('.rbc-content .src');
      return { wrapped, presBar, barItems, proxy: srcClicked === 1, presExp, barHidden: !!bar?.hidden,
        identity: srcBefore === srcAfter && srcBefore.isConnected, contentKept: c.querySelector('.rbc-content .txt')?.textContent === 'hello' };
    });
    const p51 = c1.wrapped && c1.presBar && c1.barItems >= 1 && c1.proxy && c1.presExp && c1.barHidden && c1.identity && c1.contentKept;

    // 5.2 renderDescriptors — ordered row; diff/patch (reuse by id, rebuild only on kind-change, drop removed, re-order in place)
    const c2 = await page.evaluate(() => {
      const host = document.getElementById('host'); host.innerHTML = '';
      const s = document.createElement('rb-strip'); host.appendChild(s);
      const ids = () => [...s.querySelectorAll(':scope > .rb-seg')].map(n => n.dataset.id).join(',');
      s.items = [{ id: 'a', kind: 'compartment', content: 'A' }, { id: 'b', kind: 'bar', content: 'B' }, { id: 'c', kind: 'compartment', content: 'C' }];
      const order1 = ids(); const aRef = s.querySelector('.rb-seg[data-id="a"]'), cRef = s.querySelector('.rb-seg[data-id="c"]');
      s.items = [{ id: 'c', kind: 'compartment' }, { id: 'a', kind: 'compartment' }, { id: 'b', kind: 'bar' }];
      const order2 = ids(); const identity = s.querySelector('.rb-seg[data-id="a"]') === aRef && s.querySelector('.rb-seg[data-id="c"]') === cRef;
      s.items = [{ id: 'c', kind: 'compartment' }, { id: 'a', kind: 'compartment' }];
      const dropped = !s.querySelector('.rb-seg[data-id="b"]') && [...s.querySelectorAll(':scope > .rb-seg')].length === 2;
      s.items = [{ id: 'c', kind: 'compartment' }, { id: 'a', kind: 'bar' }];
      const aNode = s.querySelector('.rb-seg[data-id="a"]');
      return { order1, order2, identity, dropped, rebuiltOnKindChange: aNode !== aRef && aNode.dataset.kind === 'bar' };
    });
    const p52 = c2.order1 === 'a,b,c' && c2.order2 === 'c,a,b' && c2.identity && c2.dropped && c2.rebuiltOnKindChange;

    // 5.4 applyViewportMode — data-mode branch + focus-restore to the ACTIVE compartment on a real flip
    const c4 = await page.evaluate(() => {
      const host = document.getElementById('host'); host.innerHTML = '';
      const s = document.createElement('rb-strip'); host.appendChild(s);
      s.items = [{ id: 'x', kind: 'compartment', content: 'X' }, { id: 'y', kind: 'compartment', content: 'Y' }];
      let scrolled = 0; const orig = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function () { scrolled++; };
      s.applyViewportMode('landscape'); const land = s.getAttribute('data-mode');
      s.setActive('y');
      s.applyViewportMode('portrait'); const port = s.getAttribute('data-mode'); // real flip + activeId → scrollIntoView(active) on rAF
      return new Promise((resolve) => requestAnimationFrame(() => { Element.prototype.scrollIntoView = orig; resolve({ land, port, focusRestored: scrolled >= 1 }); }));
    });
    const p54 = c4.land === 'landscape' && c4.port === 'portrait' && c4.focusRestored;

    await ctx.close();
    const pass = p51 && p52 && p54;
    results.push(pass);
    console.log(`iter ${i}: 5.1 applyPresentation=${p51}(identity=${c1.identity} proxy=${c1.proxy} barItems=${c1.barItems}) | 5.2 renderDescriptors=${p52}(${c2.order1}→${c2.order2} identity=${c2.identity} drop=${c2.dropped} rebuild=${c2.rebuiltOnKindChange}) | 5.4 applyViewportMode=${p54}(${c4.land}→${c4.port} focus=${c4.focusRestored}) => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

console.log('\n===== R31.5 FOUNDATION (RbCompartment/RbStrip standalone, DET-3x @390) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
