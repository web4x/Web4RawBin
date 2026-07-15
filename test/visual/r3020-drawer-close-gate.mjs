// [test:uuid:ea1e97b8-1fbf-4687-a6cd-c181580873b5] R30.20 RbDetailDrawer.closeOrReturn (Impl 65f43714) — mode-aware ✕: (1) TRACE+detail (no chat panel) → ✕ MINIMIZES; (2) IN-ROOM+detail (chat panel exists) → ✕ returns to CHAT (setMode chat, room preserved, not minimized); (3) IN-ROOM+chat → ✕ MINIMIZES; (4) ESC → fully CLOSES (separate handler, removes 'open'). in-room = this.chatPanel non-null.
// R30.20 (v0.7.29, app-XL7BPWFG.js). Behavior-first (real page.click ✕ / real Escape → assert drawer STATE), DET-3x. SystemTester.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1200, height: 900 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
    // mount a drawer, open it (renders the shell incl .drawer-close + .drawer-panel-*)
    await page.evaluate(() => {
      let d = document.querySelector('rb-detail-drawer');
      if (!d) { d = document.createElement('rb-detail-drawer'); document.body.appendChild(d); }
      d.setAttribute('open', '');
      window.__d = d;
    });
    await sleep(600);
    const hasShell = await page.evaluate(() => !!document.querySelector('rb-detail-drawer .drawer-close'));

    // helper: set case state (chatPanel truthy/null + mode) + ensure open, expanded (not minimized)
    const setup = (chat, mode) => page.evaluate(({ chat, mode }) => {
      const d = window.__d; d.chatPanel = chat ? {} : null; // in-room = truthy chatPanel
      d.setAttribute('open', ''); d.removeAttribute('minimized');
      const body = d.querySelector('.drawer-body'); if (body) body.style.display = 'flex';
      d.setMode(mode);
    }, { chat, mode });
    const state = () => page.evaluate(() => { const d = window.__d; return { open: d.hasAttribute('open'), minimized: d.hasAttribute('minimized'), mode: d._mode }; });
    const clickX = () => page.click('rb-detail-drawer .drawer-close', { timeout: 5000 }).then(() => true).catch(() => false);

    // (1) TRACE + detail (no chatPanel) → ✕ MINIMIZES
    await setup(false, 'detail'); await sleep(150); const x1 = await clickX(); await sleep(300); const s1 = await state();
    const case1 = x1 && s1.minimized === true && s1.open === true && s1.mode === 'detail'; // minimized, not switched to chat

    // (2) IN-ROOM + detail (chatPanel) → ✕ returns to CHAT (not minimized, room preserved)
    await setup(true, 'detail'); await sleep(150); const x2 = await clickX(); await sleep(300); const s2 = await state();
    const case2 = x2 && s2.mode === 'chat' && s2.minimized === false && s2.open === true;

    // (3) IN-ROOM + chat → ✕ MINIMIZES
    await setup(true, 'chat'); await sleep(150); const x3 = await clickX(); await sleep(300); const s3 = await state();
    const case3 = x3 && s3.minimized === true;

    // (4) ESC → fully CLOSES (removes 'open')
    await setup(true, 'detail'); await sleep(150); await page.keyboard.press('Escape'); await sleep(300); const s4 = await state();
    const case4 = s4.open === false; // fully closed

    const pass = hasShell && case1 && case2 && case3 && case4;
    results.push(pass);
    console.log(`iter ${i}: shell=${hasShell} | (1)TRACE+detail→min=${case1}(${JSON.stringify(s1)}) | (2)room+detail→chat=${case2}(${JSON.stringify(s2)}) | (3)room+chat→min=${case3}(${JSON.stringify(s3)}) | (4)ESC→close=${case4}(${JSON.stringify(s4)}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.20 drawer mode-aware close (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
