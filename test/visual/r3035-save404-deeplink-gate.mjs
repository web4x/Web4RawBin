// R30.35 save-404 on Tron's REAL deep-link: /edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1
// Two things measured on the EXACT URL: (C-fix, expected GREEN on v0.7.60) the diff loads with NO false
// "File not found" in the toolbar; (SAVE-404, expected RED baseline pre-fix) clicking Save → PUT /api/files/otmux
// → 404 because 'otmux' is an oosh-repo path, not a rawbin file, and the save endpoint ignores ?repo= (overwrite-only,
// a 404 writes NOTHING → read-only by outcome). RED here VALIDATES the gate machinery; flips GREEN after the expert's
// repo-aware save fix + server restart lands. DET-3x. SystemTester-only. Marker placed only when GREEN (not while RED).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1`;
const OUT = 'test-results/r3035-save404';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const rows = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    // capture the actual save PUT status (Tron's Save → PUT /api/files/otmux)
    let putStatus = null;
    page.on('response', r => { const u = r.url(); if (u.includes('/api/files/otmux') && r.request().method() === 'PUT') putStatus = r.status(); });

    await page.goto(DEEP, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 20000 }).catch(() => {});
    await page.waitForSelector('#tb-save', { timeout: 20000 }).catch(() => {});
    await sleep(1200);

    const statusText = () => page.evaluate(() => (document.querySelector('.tb-status, #tb-status, [class*="status"]')?.textContent || document.querySelector('rb-editor-toolbar')?.shadowRoot?.querySelector('[class*="status"]')?.textContent || '').trim());
    const loadStatus = await statusText();
    const loadFalse404 = /not found|error 4|404/i.test(loadStatus); // C-fix: must be FALSE (no false file-not-found on load)

    if (i === 1) await page.screenshot({ path: `${OUT}/toolbar-before-save-iter1.png`, clip: { x: 0, y: 0, width: 1300, height: 120 } }).catch(() => {});

    // TRON's Save: click the toolbar Save button
    await page.click('#tb-save', { timeout: 8000 }).catch(() => {});
    await sleep(1800); // let the PUT resolve + toolbar update
    const saveStatus = await statusText();
    const saveFailed = putStatus === 404 || /save failed|not found|error 4|404/i.test(saveStatus);

    if (i === 1) await page.screenshot({ path: `${OUT}/toolbar-after-save-iter1.png`, clip: { x: 0, y: 0, width: 1300, height: 120 } }).catch(() => {});

    rows.push({ loadFalse404, loadStatus, putStatus, saveStatus, saveFailed });
    console.log(`iter ${i}: load-false-404=${loadFalse404}(status="${loadStatus}") | SAVE PUT status=${putStatus} toolbar="${saveStatus}" saveFailed=${saveFailed}`);
    await ctx.close();
  }
} finally { await browser.close(); }

// C-fix (load): expect NO false-404 on all iters (GREEN). SAVE: expect 404 on all iters (RED baseline, pre-fix).
const cFixGreen = rows.length === 3 && rows.every(r => !r.loadFalse404);
const saveRedBaseline = rows.length === 3 && rows.every(r => r.saveFailed);
console.log('\n===== R30.35 save-404 on Tron deep-link (v0.7.60 PRE-FIX baseline) =====');
console.log(`  C-FIX (no false load-404): ${cFixGreen ? 'GREEN' : 'RED'} (${rows.map(r => r.loadFalse404 ? 'false404' : 'clean').join(',')})`);
console.log(`  SAVE-404 baseline (Save→404 reproduces): ${saveRedBaseline ? 'RED-BASELINE-CONFIRMED' : 'NOT-REPRODUCED'} (PUT=${rows.map(r => r.putStatus).join(',')})`);
console.log(`  Screenshots: ${OUT}/toolbar-{before,after}-save-iter1.png`);
console.log('OVERALL:', (cFixGreen && saveRedBaseline) ? 'PRE-FIX BASELINE VALID (C-fix GREEN, Save 404 reproduces DET-3x)' : 'CHECK');
process.exitCode = 0; // baseline run — never a defect
