// [test:uuid:8cce5ae7-6f99-4e86-b84a-764601ab85ba] R30.22 RbDetailDrawer.onSelectionChanged/openExpanded (Impl e927ecfe) — content VISIBLE on first select: selecting a detail node opens the drawer EXPANDED (minimized=false, body display:flex, visible height — NOT peek), content visible IMMEDIATELY with no grab-bar click. Was (R30.22 bug): first-select opened to peek/minimized (body display:none) → rendered content clipped. X→minimize, grab-bar→toggle, ESC→close all UNCHANGED (R30.20).
// R30.22 (v0.7.32, app-5Y3QK3GS.js). Behavior-first (real ref-select + real ✕/grab-bar/Escape → assert drawer VISIBLE state), DET-3x.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const TASK = 'task:9937a1f1-5674-48fb-92fe-6dc4a38089b0';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1200, height: 900 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
    await sleep(600);
    const state = () => page.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); const body = d?.querySelector('.drawer-body'); return { open: d?.hasAttribute('open'), minimized: d?.hasAttribute('minimized'), bodyDisplay: body ? getComputedStyle(body).display : '?', h: d?.offsetHeight || 0, detailLen: (d?.querySelector('.drawer-panel-detail')?.innerHTML || '').length }; });

    // (1) SELECT on a FRESH (closed) drawer → opens EXPANDED + VISIBLE immediately (no grab-bar), content present
    await page.evaluate((ref) => { let d = document.querySelector('rb-detail-drawer'); if (d) d.remove(); d = document.createElement('rb-detail-drawer'); document.body.appendChild(d); d.setAttribute('ref', ref); }, TASK);
    await sleep(1400);
    const s1 = await state();
    const case1 = s1.open === true && s1.minimized === false && s1.bodyDisplay === 'flex' && s1.h > 150 && s1.detailLen > 300; // visible immediately

    // (2) X → MINIMIZES to peek (closeOrReturn unchanged)
    const x2 = await page.click('rb-detail-drawer .drawer-close', { timeout: 5000 }).then(() => true).catch(() => false);
    await sleep(300); const s2 = await state();
    const case2 = x2 && s2.minimized === true;

    // (3) grab-bar → toggles peek↔expand (from minimized → expands)
    const g3 = await page.click('rb-detail-drawer .drawer-handle', { timeout: 5000 }).then(() => true).catch(() => false);
    await sleep(300); const s3 = await state();
    const case3 = g3 && s3.minimized === false; // toggled back to expanded

    // (4) ESC → fully CLOSES
    await page.keyboard.press('Escape'); await sleep(300); const s4 = await state();
    const case4 = s4.open === false;

    const pass = case1 && case2 && case3 && case4;
    results.push(pass);
    console.log(`iter ${i}: (1)SELECT→visible=${case1}(${JSON.stringify(s1)}) | (2)X→min=${case2} | (3)grab→toggle=${case3} | (4)ESC→close=${case4} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.22 content-visible-on-first-select (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
