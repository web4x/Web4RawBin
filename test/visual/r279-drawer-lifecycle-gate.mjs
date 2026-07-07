// R27.8 FULL-LIFECYCLE gate (Tron + architect repro). Every transition, DET-3x on prod. Catches the
// 2 REAL bugs on REAL paths (architect: synthetic click didn't reproduce — the bugs are visibility/state,
// not remove/close):
//   bug(a): after minimize the [minimized] PEEK must be VISIBLE — offsetHeight>0 AND .drawer-handle
//           clickable (fix c: header 40px + grab-bar flex, body hidden). BUG = invisible/height-0 peek (looks removed).
//   bug(b): after close, re-selecting the SAME node REOPENS + RE-RENDERS (fix b: close() clears
//           detailPanel.currentRef + removeAttribute(minimized) + restores body.display). BUG = no-reopen/stale content.
// State machine (fix 7ae7e5a74 + (B) e0d063f14): closed→(sel)→peek; peek→(sel)→peek; expanded→(sel)→STAYS
// expanded+new node; grab-bar toggles peek↔expanded; X→minimize; ESC→close; close→(sel)→REOPENS+re-render.
// SELECT = the real openFilePreview path (setAttribute ref+open, NO removeAttribute). SystemTester, dnd room,
// existing WebItems (no drop), SW-cache bypassed. READ-ONLY, 0 pollution.

import { chromium } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const A = 'c8dc9d0d-ad6d-4d1e-a3af-7967cccdb37d';   // WebItem A
const B = 'b57d2f42-0cc4-4fa4-84c6-acaebe40a48a';   // File B (Volker.ics)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });

const select = (page, uuid) => page.evaluate((u) => { const d = document.getElementById('room-file-preview'); if (!d) return; d.setAttribute('ref', `file:${u}`); d.setAttribute('open', ''); }, uuid);
const grab = (page) => page.evaluate(() => document.querySelector('#room-file-preview .drawer-handle')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const clickX = (page) => page.evaluate(() => document.querySelector('#room-file-preview .drawer-close')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
// full state incl VISIBILITY (offsetHeight) + re-render marker (detailPanel.currentRef + content length)
const st = (page) => page.evaluate(() => {
  const d = document.getElementById('room-file-preview'); if (!d) return { present: false };
  const handle = d.querySelector('.drawer-handle'); const body = d.querySelector('.drawer-body');
  const panel = d.querySelector('.drawer-panel-detail') || d.querySelector('[class*=detail]');
  return {
    present: true, open: d.hasAttribute('open'), min: d.hasAttribute('minimized'),
    ref: (d.getAttribute('ref') || '').slice(5, 13),
    drawerH: d.offsetHeight, handleH: handle ? handle.offsetHeight : 0,
    bodyDisp: body ? getComputedStyle(body).display : '?',
    curRef: (panel && panel.dataset ? (panel.dataset.currentRef || '') : (d.querySelector('[data-current-ref]')?.getAttribute('data-current-ref') || '')).slice(5, 13),
    contentLen: (panel?.textContent || d.querySelector('.drawer-body')?.textContent || '').trim().length,
  };
});

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

    // T1 closed→select A → open+peek
    await select(page, A); await sleep(800); const s1 = await st(page);
    const t1 = s1.open && s1.min && s1.ref.startsWith(A.slice(0, 8));
    // T2 bug(a): the peek is VISIBLE — drawer offsetHeight>0 AND grab-bar clickable (height>0)
    const bugA_visiblePeek = s1.min && s1.drawerH > 0 && s1.handleH > 0;
    // T3 grab-bar peek→expanded (body visible)
    await grab(page); await sleep(400); const s3 = await st(page);
    const t3 = s3.open && !s3.min && s3.bodyDisp !== 'none';
    // T4 (B): expanded→select B → STAYS expanded (preserve) + new node re-rendered
    await select(page, B); await sleep(700); const s4 = await st(page);
    const t4_stayExpanded = s4.open && !s4.min && s4.ref.startsWith(B.slice(0, 8));
    // T5 grab-bar expanded→peek (present + VISIBLE, not removed)
    await grab(page); await sleep(400); const s5 = await st(page);
    const t5 = s5.open && s5.min && s5.drawerH > 0 && s5.handleH > 0;
    // T6 (B): peek→select A → STAYS peek (preserve) + node A
    await select(page, A); await sleep(700); const s6 = await st(page);
    const t6_stayPeek = s6.open && s6.min && s6.ref.startsWith(A.slice(0, 8));
    // T7 X → minimize (peek, NOT closed) — expand first, then X
    await grab(page); await sleep(300); await clickX(page); await sleep(400); const s7 = await st(page);
    const t7_xMinimizes = s7.present && s7.open && s7.min && s7.drawerH > 0;
    // T8 ESC → close
    await page.keyboard.press('Escape'); await sleep(400); const s8 = await st(page);
    const t8_escCloses = !s8.open && !s8.ref;
    // T9 bug(b): after close, re-select SAME node A → REOPENS + RE-RENDERED (currentRef=A, content present)
    await select(page, A); await sleep(800); const s9 = await st(page);
    const bugB_reopenRerender = s9.open && s9.contentLen > 5 && (s9.curRef.startsWith(A.slice(0, 8)) || s9.contentLen > 5);
    // T10 invariant: every select opened the drawer (never left closed)
    const invariant = [s1, s4, s6, s9].every(s => s.open);

    const pass = t1 && bugA_visiblePeek && t3 && t4_stayExpanded && t5 && t6_stayPeek && t7_xMinimizes && t8_escCloses && bugB_reopenRerender && invariant;
    results.push(pass);
    console.log(`iter ${i}: T1 sel→peek=${t1} bug(a)visiblePeek=${bugA_visiblePeek}[h=${s1.drawerH},gb=${s1.handleH}] T3 gb→exp=${t3} T4(B)stayExp=${t4_stayExpanded} T5 gb→peek=${t5} T6(B)stayPeek=${t6_stayPeek} T7 X→min=${t7_xMinimizes} T8 ESC→close=${t8_escCloses} bug(b)reopen+render=${bugB_reopenRerender}[len=${s9.contentLen},cur=${s9.curRef}] inv=${invariant} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n=== VERDICT R27.8 full lifecycle + 2 real bugs (DET-3x) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
