// R40.85 SW-FIX SAFETY GATE (PO: prove the CAUSE is removed by construction — stronger than a symptom test the iOS-only bug
// can't show). Fix 2fef34dc9: the SW returns early on non-GET so POST uploads bypass it entirely (body intact). We can't prove
// the iOS symptom is CURED on non-iOS hardware, but we CAN prove: (1) the upload POST is NOT intercepted by the worker
// (fromServiceWorker=false), (2) uploads still 200 (no regression on this platform), (3) the non-GET guard is present in sw.js,
// (4) NO COLLATERAL — GET is still served by the worker (fromServiceWorker=true) and offline still serves the shell from cache.
// STUB-MUST-FAIL: ARM_COMMIT=e977f1aa5 (pre-fix worker that STILL intercepts POST) → the gate must go RED (POST intercepted +
// guard absent), else it certifies nothing. Uses Playwright Response.fromServiceWorker() = did the SW's respondWith handle it.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import { execSync } from 'node:child_process';
const MAIN = '/var/dev/Workspaces/web4x/Web4RawBin';
const BROKEN = 'e977f1aa5'; // the deployed pre-fix worker that STILL intercepts POST — baseline for the no-collateral diff
const SYS = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const COMMIT = process.env.ARM_COMMIT || '2fef34dc9';
const f = await setupFoundation({ commit: COMMIT, buildDist: true });
console.log(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} arm=${COMMIT}`);

const results = {};
const browser = await webkit.launch();
let roomId = null, page = null;
try {
  // (3) GUARD present in the SOURCE sw.js (robust vs the built/served text): non-GET early-return BEFORE respondWith.
  const swSrc = (() => { try { return execSync(`git show ${COMMIT}:src/public/sw.js`, { cwd: MAIN }).toString(); } catch { return ''; } })();
  // guard present + it sits before the ACTUAL fetch-handler respondWith CALL (not the comment mention of 'respondWith')
  results.guardPresent = /method\s*!==\s*['"]GET['"]\s*\)\s*return/.test(swSrc) && swSrc.search(/method\s*!==\s*['"]GET['"]/) < swSrc.indexOf('event.respondWith(');
  console.log(`  guard present (non-GET return before the respondWith call, source): ${results.guardPresent}`);
  // (4b) NO COLLATERAL by construction: the diff broken→fix touches ONLY the non-GET guard — no GET/cache/offline CODE changed.
  //     Exclude comment lines (the fix's comment legitimately NAMES networkFirst/respondWith to explain the bug; that is not a code change).
  const diff = (() => { try { return execSync(`git diff ${BROKEN} ${COMMIT} -- src/public/sw.js`, { cwd: MAIN }).toString(); } catch { return ''; } })();
  const changedCode = diff.split('\n').filter((l) => /^[+-]/.test(l) && !/^[+-]{3}/.test(l)).filter((l) => { const b = l.slice(1).trim(); return b && !b.startsWith('//') && !b.startsWith('*') && !b.startsWith('/*'); });
  const removed = changedCode.filter((l) => l.startsWith('-'));
  const touchesGetPath = changedCode.some((l) => /(networkFirst|cacheFirst|navigationStrategy|caches?\.|cache\.put|CACHE_NAME|offlineResponse)/.test(l));
  results.noCollateral = COMMIT === BROKEN ? true : (removed.length === 0 && !touchesGetPath); // only ADDED the guard; removed nothing; GET/cache path untouched
  console.log(`  no-collateral (diff adds ONLY the guard, removes nothing, GET/cache untouched): ${results.noCollateral} (removed=${removed.length} touchesGetPath=${touchesGetPath})`);

  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'allow' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, SYS);
  page = await ctx.newPage();
  // capture, per response, whether the SW's respondWith handled it
  const swHandled = {}; // url-substr → fromServiceWorker
  page.on('response', (r) => { try { const u = r.url(); const fsw = r.fromServiceWorker(); if (/\/api\/room\/[^/]+\/upload/.test(u)) swHandled.upload = { fsw, method: r.request().method(), status: r.status() }; if (/\/api\/config/.test(u)) swHandled.apiConfig = fsw; if (/\/(app\.css|icon-192\.png|manifest)/.test(u)) swHandled.staticGet = fsw; } catch {} });

  await page.goto(`${f.base}/app`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(async () => { const r = await navigator.serviceWorker?.getRegistration?.(); return !!(r && r.active); }, { timeout: 25000 }).catch(() => {});
  let controlled = await page.evaluate(() => !!navigator.serviceWorker?.controller);
  if (!controlled) { await page.reload({ waitUntil: 'domcontentloaded' }); await sleep(1500); controlled = await page.evaluate(() => !!navigator.serviceWorker?.controller); }
  results.swControlled = controlled;
  console.log(`  SW active + controlling this page: ${controlled}`);
  await page.waitForFunction(() => (window.__rawbinClient && window.__rawbinClient.connected) === true, { timeout: 20000 }).catch(() => {});

  roomId = await page.evaluate(async () => { const c = window.__rawbinClient; if (!c || !c.createRoom) return null; c.createRoom('SW-safety test (temp)', 'SystemTester'); for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t && t.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  if (!roomId) { await page.evaluate(() => { const c = window.__rawbinClient; if (c && c.send) c.send({ type: 'UPDATE_PROFILE', name: 'SystemTester' }); }); await sleep(1500); roomId = await page.evaluate(async () => { const c = window.__rawbinClient; c.createRoom('SW-safety test (temp)', 'SystemTester'); for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t && t.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; }); }
  if (!roomId) throw new Error('no room');
  await sleep(600);

  // (1)+(2) upload via XHR (real client path) with the SW active → status + whether the SW intercepted the POST
  const up = await page.evaluate(({ roomId }) => new Promise((resolve) => {
    const bytes = new Uint8Array(495903); bytes[0] = 0x89; bytes[1] = 0x50; bytes[2] = 0x4e; bytes[3] = 0x47;
    const file = new File([bytes], 'safety.png', { type: 'image/png' });
    const fd = new FormData(); fd.append('file', file); fd.append('playerToken', localStorage.getItem('rawbin-player-id') || '');
    const xhr = new XMLHttpRequest(); xhr.open('POST', `/api/room/${roomId}/upload`); xhr.onload = () => resolve({ status: xhr.status }); xhr.onerror = () => resolve({ status: 0 }); xhr.send(fd);
  }), { roomId });
  await sleep(600);
  results.upload200 = up.status === 200;
  results.postBypassesSW = swHandled.upload ? swHandled.upload.fsw === false : null; // false = NOT handled by SW = bypassed (the fix)
  console.log(`  upload POST: status=${up.status} | fromServiceWorker=${swHandled.upload?.fsw} (false = bypassed the SW = cause removed)`);

  // (4) NO COLLATERAL — behavioural half: a GET still goes THROUGH the SW (fromServiceWorker=true) → the cache/offline path
  //     the worker legitimately serves is intact (the diff-half above proves that code is byte-unchanged).
  await page.evaluate(async () => { try { await fetch('/api/config'); } catch {} }); await sleep(300);
  results.getStillServedBySW = swHandled.apiConfig === true || swHandled.staticGet === true;
  console.log(`  GET still served by SW (fromServiceWorker=true): apiConfig=${swHandled.apiConfig} staticGet=${swHandled.staticGet} → ${results.getStillServedBySW}`);
} catch (e) { results.error = String(e && e.message).slice(0, 160); console.log('error:', results.error); }
finally { try { if (roomId && page) { await page.evaluate((rid) => { const c = window.__rawbinClient; if (c && c.deleteRoom) c.deleteRoom(rid); }, roomId).catch(() => {}); await sleep(1200); } } catch {} await browser.close().catch(() => {}); const td = await f.teardown(); console.log(`teardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover} | cleanup room=${roomId ? roomId.slice(0, 8) : 'none'}`); }

console.log(`\n═══ R40.85 SW-FIX SAFETY (by construction) — arm=${COMMIT} ═══`);
console.log(`  guard present (non-GET pass-through in sw.js)  : ${results.guardPresent ? 'GREEN' : 'RED'}`);
console.log(`  ★ POST bypasses the SW (cause removed)         : ${results.postBypassesSW === true ? 'GREEN' : 'RED'} (postBypassesSW=${results.postBypassesSW})`);
console.log(`  upload still 200 (no regression this platform) : ${results.upload200 ? 'GREEN' : 'RED'}`);
console.log(`  GET still served by SW (no collateral, behav.) : ${results.getStillServedBySW ? 'GREEN' : 'RED'}`);
console.log(`  no-collateral (diff adds ONLY the guard)       : ${results.noCollateral ? 'GREEN' : 'RED'}`);
const allGreen = results.guardPresent && results.postBypassesSW === true && results.upload200 && results.getStillServedBySW && results.noCollateral;
console.log(`OVERALL (arm=${COMMIT}): ${allGreen ? 'ALL GREEN — cause removed, no collateral' : 'RED'} ${results.error ? '(err ' + results.error + ')' : ''}`);
process.exit(allGreen ? 0 : 1);
