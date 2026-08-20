// R40.53 make-current LIVE-MVC gate (the BROWSER/live half of the make-current fix) — the CORE property:
// the LIVE-broadcast-updated DOM must be BYTE-EQUIVALENT to the RELOAD-rendered DOM for the same state, over the
// enumerated current-views (drawer detail + CurrentSprint icon/tree). One assertion catches Tron's 4 v0.8.121 defects:
// (2) duplicated detail sections, (3) stale icon view, (1) "only after refresh", (4) wrong banner.
// ACCEPTANCE (PO 2026-08-20): this gate MUST go RED on v0.8.121 (c3e8b22f5 — the build TRON HIMSELF device-QA'd and
// saw the duplicated drawer + stale icon). GREEN on v0.8.121 = the GATE is wrong (STOP + report). Ship-1 (idempotent
// upsertSection across all 9 *-detail + canonical viewBusKey subscribe + lint + banner) flips it GREEN; Tron device = final.
// Plus 2 synthetic stub-must-fails (clientPatch) for future failability when v0.8.121 is long gone.
// Scratch + SYSTEM literal only (R40.31 foundation) — NEVER prod:4444 / Tron's credential. @390 REAL-WebKit.
//
// ITERATION 2 = the real measurement: open the drawer on the target, drive a REAL make-current broadcast from node
// (server → ws → browser transport), capture LIVE vs RELOAD DOM for both views + section counts. Records the exact
// failing assertions (which sections duplicated, which view stayed stale) = the PO's RED-baseline evidence.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const V0_8_121 = 'c3e8b22f5';                 // deploy(R40.49) v0.8.121 — the human-verified known-bad build
const COMMIT = process.env.MC_COMMIT || V0_8_121;
const TARGET = process.env.MC_TASK || '97e8a6ad-46db-440f-a9be-cfb97ca64df4'; // a REAL Sprint-37 QA-Review task (resolvable in the sprint set)
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const f = await setupFoundation({ commit: COMMIT, buildDist: true, attachEvidenceTo: TARGET });
console.log(`scratch up: base=${f.base} servedVersion=${f.servedVersion} worktreeSha=${f.worktreeSha} target=${TARGET.slice(0,8)} owner=${f.ownerIsServerManager} session=${f.sessionMinted}`);
const browser = await webkit.launch({ headless: true });
try {
  const ctx = await browser.newContext(IOS);
  // seed the owner/system player token so the page can drive make-current (scratch system literal, not Tron cred)
  const oh = f.ownerHeaders();
  const token = oh['x-player-token'];
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, token);
  const page = await ctx.newPage();
  page.on('console', m => { const s = m.text(); if (/error|fail|exception/i.test(s)) console.log('  [page]', s.slice(0,160)); });

  // helpers: capture the two current-views' DOM + structural section counts
  const openDrawerAndCapture = () => page.evaluate((ref) => {
    const d = document.querySelector('rb-detail-drawer');
    if (d) { d.setAttribute('open', ''); d.setAttribute('ref', ref); }
    return null;
  }, `task:${TARGET}`);
  const capture = () => page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer');
    const panel = d?.querySelector('.drawer-panel-detail') || d;
    const html = (panel?.innerHTML || '');
    // section-label duplication probe: count section headers by their visible label text
    const secText = (panel?.innerText || '');
    const countLabel = (l) => (secText.match(new RegExp(`(^|\\n)\\s*${l}\\b`, 'g')) || []).length;
    const tree = document.querySelector('rb-trace-tree');
    return {
      drawerHtmlLen: html.length,
      drawerHtml: html,
      parentCount: countLabel('Parent'), statusCount: countLabel('Status'),
      pinText: (tree?.querySelector('*')?.innerText || tree?.innerText || ''),
      pinCurrent: ((tree?.innerText||'').match(/📌 Current[^\n]*/)||[''])[0],
      // defect #4: banner must NOT claim "no stored pin" once a designation IS stored
      bannerStale: /no stored pin|no current pin|not pinned/i.test(document.body.innerText || ''),
    };
  });
  const norm = (h) => h.replace(/\s+/g, ' ').replace(/data-[a-z-]+="[^"]*"/g, '').replace(/id="[^"]*"/g, '').trim(); // modulo volatile

  await page.goto(`${f.base}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => console.log('goto /trace:', String(e.message||e).slice(0,120)));
  await page.waitForFunction(() => (document.querySelector('rb-trace-tree')?.innerText || '').includes('Current'), { timeout: 20000 }).catch(() => {});
  await sleep(800);

  // (1) open the drawer on TARGET + mark the tab so we can prove NO reload happened during the live update
  await openDrawerAndCapture(); await sleep(1200);
  await page.evaluate(() => { window.__noReload = 'alive'; });
  const before = await capture();
  console.log(`BEFORE make-current: drawer[Parent×${before.parentCount} Status×${before.statusCount} len=${before.drawerHtmlLen}] pin="${before.pinCurrent.slice(0,80)}"`);

  // (2) drive a REAL make-current broadcast from NODE (server → ws → browser) — the real transport, owner system-literal
  const mc = await fetch(`${f.base}/api/task/${TARGET}/make-current`, { method: 'POST', headers: f.ownerHeaders() });
  console.log(`make-current POST → ${mc.status}`);
  await sleep(2500); // let the ws broadcast land + the subscribed views re-render LIVE

  // (3) capture the LIVE state (no reload) of both views
  const live = await capture();
  const noReload = await page.evaluate(() => window.__noReload === 'alive');
  console.log(`LIVE (post-broadcast, noReload=${noReload}): drawer[Parent×${live.parentCount} Status×${live.statusCount} len=${live.drawerHtmlLen}] pin="${live.pinCurrent.slice(0,80)}"`);

  // (4) RELOAD at the same server state → the ground-truth clean render
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => (document.querySelector('rb-trace-tree')?.innerText || '').includes('Current'), { timeout: 20000 }).catch(() => {});
  await openDrawerAndCapture(); await sleep(1200);
  const reload = await capture();
  console.log(`RELOAD (fresh, same state): drawer[Parent×${reload.parentCount} Status×${reload.statusCount} len=${reload.drawerHtmlLen}] pin="${reload.pinCurrent.slice(0,80)}"`);

  // ── CORE ASSERTIONS (record the exact failing ones) ──
  const drawerByteEquiv = norm(live.drawerHtml) === norm(reload.drawerHtml);
  const pinByteEquiv = (live.pinCurrent.trim()) === (reload.pinCurrent.trim());
  const noDup = live.parentCount <= 1 && live.statusCount <= 1;
  const pinLiveMatchesReload = pinByteEquiv; // the icon/tree re-derived on the same event (not stale)
  console.log('\n── ASSERTIONS (v' + f.servedVersion + ') ──');
  console.log(`  A. drawer LIVE==RELOAD byte-equiv : ${drawerByteEquiv ? 'PASS' : 'FAIL'} (liveLen=${live.drawerHtmlLen} reloadLen=${reload.drawerHtmlLen})`);
  console.log(`  A'. no section duplication (≤1 ea) : ${noDup ? 'PASS' : 'FAIL'} (LIVE Parent×${live.parentCount} Status×${live.statusCount})`);
  console.log(`  B. pin LIVE==RELOAD (icon re-derived): ${pinLiveMatchesReload ? 'PASS' : 'FAIL'}`);
  console.log(`     pin LIVE  ="${live.pinCurrent.trim().slice(0,90)}"`);
  console.log(`     pin RELOAD="${reload.pinCurrent.trim().slice(0,90)}"`);
  console.log(`  C. no-reload during live update   : ${noReload ? 'PASS' : 'FAIL'}`);
  const bannerHonest = !live.bannerStale; // defect #4: 'no stored pin' banner is now FALSE
  console.log(`  D. banner honest (not 'no stored pin'): ${bannerHonest ? 'PASS' : 'FAIL'} (bannerStale=${live.bannerStale})`);
  const red = !(drawerByteEquiv && noDup && pinLiveMatchesReload && bannerHonest);
  console.log(`\nVERDICT v${f.servedVersion}: ${red ? 'RED (bug reproduces — EXPECTED on v0.8.121)' : 'GREEN'}`);
} finally {
  await browser.close();
  const td = await f.teardown();
  console.log(`teardown: prodUp=${td.prodUp} leftoverWorktrees=${td.leftover}`);
}
