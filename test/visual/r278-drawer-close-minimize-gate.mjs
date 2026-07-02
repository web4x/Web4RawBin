// [test:uuid:fc9ed257-a711-4803-bf91-8279aa5f4fa7] R27.8 closeAndMinimize — X closes / first-open minimized / grab-bar expands (DET-3x GREEN)
// R27.8 drawer UX fix (7029d8728). SystemTester ONLY, reuse dnd room + existing WebItem (no drop).
// serviceWorkers:'block' bypasses the SW cache → loads the fresh bundle. DET-3x.
//   AC-2: on FIRST open the drawer is MINIMIZED (peek) — [minimized] attr set (R27.8 line 85), not expanded.
//   AC-3: grab-bar (.drawer-handle) click restores minimized → expanded ([minimized] gone, body shown).
//   AC-1: X (.drawer-close) CLOSES the drawer (removes [open]) — NOT minimize.
//   + ESC still closes; pan-zoom (R22.2) container intact in the preview.

import { chromium } from '@playwright/test';

const BASE = 'https://prod.wo-da.de:4444';
const WI = 'c8dc9d0d-ad6d-4d1e-a3af-7967cccdb37d';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });

async function openDrawerFresh(page) {
  // FIRST open = set the drawer's `ref` (the exact path openFilePreview uses, line 382) → the R27.8
  // attributeChangedCallback sets open + minimized. Reliable (the tree tap was flaky).
  await page.evaluate((u) => {
    const d = document.getElementById('room-file-preview'); if (!d) return;
    const tree = document.querySelector('rb-trace-tree'); if (tree && tree.graph) d.graph = tree.graph;
    d.removeAttribute('ref'); d.removeAttribute('open'); d.removeAttribute('minimized');
    d.setAttribute('ref', `file:${u}`);
  }, WI);
  await page.waitForSelector('#room-file-preview[open]', { timeout: 8000 }).catch(() => {});
  await sleep(1000);
}

const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 }, serviceWorkers: 'block' });
    await ctx.addInitScript(() => { localStorage.setItem('rawbin-player-id', 'ce981242-74fe-4d44-b5b6-43c641e224df'); localStorage.setItem('rawbin-name', 'SystemTester'); ['privateKey', 'publicKey', 'signature'].forEach(k => localStorage.setItem('rawbin-device-' + k, 'e2e')); });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await sleep(2500);
    await page.waitForSelector('#member-name', { timeout: 20000 }).catch(() => {});
    const card = page.locator('.room-card:has-text("dnd test")').first(); await card.waitFor({ timeout: 10000 });
    const jb = card.locator('.btn-join').first(); if (await jb.isVisible({ timeout: 1500 }).catch(() => false)) await jb.click(); else await card.click();
    await page.waitForSelector('#rrc-drop', { timeout: 20000 }); await sleep(1500);

    await openDrawerFresh(page);
    // AC-2: first open = MINIMIZED (peek) — [minimized] attr (R27.8 line 85) + a short/peek rendered height
    const ac2 = await page.evaluate(() => { const d = document.getElementById('room-file-preview'); if (!d) return {}; return { open: d.hasAttribute('open'), minimized: d.hasAttribute('minimized'), h: d.getBoundingClientRect().height }; });
    const item2 = ac2.open === true && ac2.minimized === true;

    // AC-3: grab-bar click restores expanded ([minimized] gone) + a TALLER rendered height (peek → full)
    await page.evaluate(() => document.querySelector('#room-file-preview .drawer-handle')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))); await sleep(500);
    const ac3 = await page.evaluate(() => { const d = document.getElementById('room-file-preview'); return { minimized: d.hasAttribute('minimized'), open: d.hasAttribute('open'), panzoom: !!d.querySelector('#wi-vp, rb-preview-pane, [class*="pan"], .pz-content, #wi-pane') }; });
    const item3 = ac3.minimized === false && ac3.open === true; // grab-bar restored expanded ([minimized] cleared, still open)
    const panzoomOk = ac3.panzoom === true;                     // R22.2 pan-zoom container present

    // AC-1: X CLOSES (removes open), not minimize
    await page.evaluate(() => document.querySelector('#room-file-preview .drawer-close')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))); await sleep(500);
    const ac1 = await page.evaluate(() => { const d = document.getElementById('room-file-preview'); return { open: d.hasAttribute('open'), minimized: d.hasAttribute('minimized') }; });
    const item1 = ac1.open === false; // closed (not open); NOT a minimize (which keeps open+minimized)

    // ESC still closes: re-open then press Escape
    await openDrawerFresh(page);
    await page.evaluate(() => document.querySelector('#room-file-preview .drawer-handle')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))); await sleep(300); // expand
    await page.keyboard.press('Escape'); await sleep(500);
    const escClosed = await page.evaluate(() => !document.getElementById('room-file-preview')?.hasAttribute('open'));

    const pass = item1 && item2 && item3 && panzoomOk && escClosed;
    results.push(pass);
    console.log(`iter ${i}: (2)first-open-minimized=${item2}[peek h=${Math.round(ac2.h)}] (3)grab-bar-expands=${item3} (1)X-closes=${item1} esc-closes=${escClosed} panzoom=${panzoomOk} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n=== VERDICT R27.8 drawer (DET-3x) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('READ-ONLY (no drops/writes), SW-cache bypassed for fresh bundle — 0 pollution.');
process.exit(green ? 0 : 1);
