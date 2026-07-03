// R27.8 FULL-LIFECYCLE gate (Tron directive). Every transition, DET-3x on prod. Catches the 2 Tron
// bugs: (a) grab-bar double-tap REMOVES the drawer, (b) selection doesn't REOPEN after close.
// HARD INVARIANT: EACH select opens the drawer from ANY prior state (never leaves it closed).
// NEW spec (this review): select→MINIMIZED(peek) / grab-bar peek→EXPANDED / grab-bar expanded→PEEK
// (not removed) / X→MINIMIZE (not close) / ESC→CLOSE / after close select→REOPENS(peek).
// SystemTester, dnd room, existing WebItems (no drop), SW-cache bypassed. READ-ONLY.

import { chromium } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const A = 'c8dc9d0d-ad6d-4d1e-a3af-7967cccdb37d';   // file A (WebItem)
const B = 'b57d2f42-0cc4-4fa4-84c6-acaebe40a48a';   // file B (Volker.ics) — for the "select shows new selection" invariant
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });

// SELECT = the real openFilePreview path (setAttribute ref+open) — NO removeAttribute, so the
// same-file-after-close case faithfully reproduces the reopen bug if present.
const select = (page, uuid) => page.evaluate((u) => { const d = document.getElementById('room-file-preview'); if (!d) return; d.setAttribute('ref', `file:${u}`); d.setAttribute('open', ''); }, uuid);
const st = (page) => page.evaluate(() => { const d = document.getElementById('room-file-preview'); return d ? { present: true, open: d.hasAttribute('open'), min: d.hasAttribute('minimized'), ref: (d.getAttribute('ref') || '').slice(5, 13) } : { present: false }; });
const grab = (page) => page.evaluate(() => document.querySelector('#room-file-preview .drawer-handle')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const clickX = (page) => page.evaluate(() => document.querySelector('#room-file-preview .drawer-close')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));

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
    await page.evaluate(() => { const d = document.getElementById('room-file-preview'); const t = document.querySelector('rb-trace-tree'); if (d && t?.graph) d.graph = t.graph; d?.removeAttribute('ref'); d?.removeAttribute('open'); d?.removeAttribute('minimized'); });

    // T1 select → open + minimized (peek)
    await select(page, A); await sleep(700); const s1 = await st(page);
    const t1 = s1.open && s1.min;
    // T2 grab-bar peek → expanded
    await grab(page); await sleep(400); const s2 = await st(page);
    const t2 = s2.open && !s2.min && s2.present;
    // T3 grab-bar expanded → peek (present, NOT removed) — bug(a) part 1
    await grab(page); await sleep(400); const s3 = await st(page);
    const t3 = s3.open && s3.min && s3.present;
    // T4 grab-bar RAPID double-tap → still present (bug(a): removes)
    await grab(page); await grab(page); await sleep(400); const s4 = await st(page);
    const bugA_ok = s4.present && s4.open;   // drawer NOT removed by double-tap
    // T5 X → MINIMIZE (new spec), NOT close
    await select(page, A); await sleep(400); await clickX(page); await sleep(400); const s5 = await st(page);
    const t5_xMinimizes = s5.present && s5.open && s5.min;   // new spec: X minimizes
    const x_currentlyCloses = s5.present && !s5.open;         // measured: current behavior
    // T6 ESC → close
    await select(page, A); await sleep(300); await page.keyboard.press('Escape'); await sleep(400); const s6 = await st(page);
    const t6_escCloses = !s6.open;
    // T7 after close, select SAME file → REOPENS (peek) — bug(b) + invariant
    await select(page, A); await sleep(500); const s7 = await st(page);
    const bugB_ok = s7.open;   // reopened after close
    // T8 invariant: select DIFFERENT file → shows new selection (open, ref=B)
    await select(page, B); await sleep(500); const s8 = await st(page);
    const t8_invariant = s8.open && s8.ref.startsWith(B.slice(0, 8));

    // GREEN per NEW spec = all transitions incl X→minimize + both bugs fixed
    const pass = t1 && t2 && t3 && bugA_ok && t5_xMinimizes && t6_escCloses && bugB_ok && t8_invariant;
    results.push(pass);
    console.log(`iter ${i}: T1 sel→peek=${t1} T2 gb→exp=${t2} T3 gb→peek=${t3} bug(a)no-remove=${bugA_ok} T5 X→MIN=${t5_xMinimizes}(x-closes-now=${x_currentlyCloses}) T6 ESC→close=${t6_escCloses} bug(b)reopen=${bugB_ok} T8 invariant=${t8_invariant} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n=== VERDICT R27.8 full lifecycle (DET-3x, NEW spec) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED (measures current prod vs the NEW lifecycle spec)');
process.exit(green ? 0 : 1);
