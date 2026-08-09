// [test:uuid:c7a2d5e8-4f19-4b63-8e07-2d9f6a1c3b58] R40.11 carve-out RbDetailView fail-loud — synthetic depref: ref → "⚠ unresolved: <ior>" not eternal spinner; isSynthetic guard does NOT over-fire on real units. req mints Impl→the failLoud carve-out.
// R40.11 carve-out — FAIL-LOUD 'unresolved: <ior>' for a SYNTHETIC depref: deployment-ref, no more eternal spinner
// (fix 2cf8f9866, rb-detail-view.ts !obj branch + isSynthetic guard). Real-WebKit @390 iPhone-12, DET-3x.
// (A) tap a deploymentRef (Tron's ssh-host-identity node, uuid depref:ssh-host-identity) → drawer shows an EXPLICIT
//     '⚠ unresolved: <ior>' and is NOT stuck on the perpetual 'Loading…' spinner.
// (B) ANTI-OVER-FIRE (a guard that fires too broadly = regression dressed as fix): tap a REAL unit (the Heartspaces
//     mp3 file 63462717) → it RESOLVES normally (real name shown) and NEVER shows '⚠ unresolved'.
import { webkit, devices } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const SYNTH = 'depref:ssh-host-identity';                 // OtmuxBridge: uuid = 'depref:'+role → isSynthetic
const REAL = '63462717-1771-4775-aeda-d9947d7bcbd2';      // real File unit (Ed Sheeran mp3) → must resolve, must NOT fail-loud
const iPhone = devices['iPhone 12'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const mountView = (page, ref) => page.evaluate((r) => {
  document.querySelectorAll('rb-detail-view#__g').forEach(e => e.remove());
  const el = document.createElement('rb-detail-view'); el.id = '__g';
  el.style.cssText = 'display:block;position:fixed;inset:0;z-index:99999;background:#111;color:#fff;overflow:auto;padding:16px';
  el.setAttribute('ref', r); document.body.appendChild(el);
}, ref);
const readView = (page) => page.evaluate(() => {
  const h = document.querySelector('rb-detail-view#__g');
  const t = h?.textContent || '';
  return { type: h?.querySelector('.dv-type')?.textContent || '', title: h?.querySelector('.dv-title')?.textContent || '',
           unresolved: /⚠ unresolved:/.test(t), stuckLoading: /Loading\.\.\./.test(h?.querySelector('.dv-title')?.textContent || '') };
});

const browser = await webkit.launch();
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-detail-view'), { timeout: 20000 }).catch(() => {});

    // (A) synthetic deployment-ref → explicit ⚠ unresolved, not an eternal spinner
    await mountView(page, SYNTH); await sleep(2500);
    const a = await readView(page);
    const caseA = a.unresolved && a.type === 'unresolved' && /ssh-host-identity/.test(a.title) && !a.stuckLoading;
    if (i === 1) await page.locator('rb-detail-view#__g').screenshot({ path: 'test-results/r4011-carveout/synthetic-unresolved-iter1.png' }).catch(() => {});

    // (B) real unit → resolves normally, guard does NOT over-fire
    await mountView(page, REAL); await sleep(2500);
    const b = await readView(page);
    const resolvedName = /Ed Sheeran|\.mp3/i.test(b.title) || (b.title.length > 3 && !/Loading/.test(b.title));
    const caseB = !b.unresolved && b.type !== 'unresolved' && resolvedName; // NOT fail-loud + shows real content
    if (i === 1) await page.locator('rb-detail-view#__g').screenshot({ path: 'test-results/r4011-carveout/real-resolves-iter1.png' }).catch(() => {});

    const pass = caseA && caseB;
    results.push(pass);
    console.log(`iter ${i}: (A)synthetic→unresolved=${caseA}(type='${a.type}' title='${a.title.slice(0, 40)}' stuck=${a.stuckLoading}) | (B)real→resolves=${caseB}(unresolved=${b.unresolved} title='${b.title.slice(0, 40)}') => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R40.11 carve-out @390 real-WebKit (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
