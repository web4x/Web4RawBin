// R40.89 STALE-SW SELF-HEAL UPLOAD GATE — the closest honest proxy to Tron's stranded iOS device we can build (R40.89: no
// real iOS → prove it BY CONSTRUCTION). Tron's device is stranded on a PRE-fix service worker (2fef34dc9^) that intercepts
// non-GET and DROPS the streamed multipart body → 'Upload failed' on a file that arrived correctly. A stranded device can NOT
// be rescued by shipping more fixes (the incumbent worker keeps control), so the fix is a CLIENT self-heal: detect stale
// control → registration.update() → still stale → unregister() + ONE guarded reload. This gate proves that end-to-end.
//
// FAITHFUL MODEL (deterministic, no reliance on the WebKit in-page-FormData 0-byte artifact):
//   Phase 1 STRAND : route /sw.js → the REAL old body-dropping worker (git 2fef34dc9^). Load /app. Assert it ACTIVATES +
//                    CONTROLS the page (a 'WHO'→'STRANDED-OLD' round-trip = the stranded state established).
//   Phase 2 HEAL   : route /sw.js → the CURRENT fixed worker WITH skipWaiting()+clients.claim() STRIPPED — this models the
//                    iOS reality that a freshly-shipped worker can NOT evict the incumbent on its own (it installs but WAITS).
//                    So the ONLY escape is the explicit self-heal. Reload (= Tron reopening the app) and measure.
//   FOUR NAMED ASSERTIONS, reported SEPARATELY:
//     A1 strand-established : the old body-dropping worker controls the page (WHO=STRANDED-OLD)         [precondition, must be true]
//     A2 self-heals         : after reopen the page is NO LONGER controlled by the stranded worker      [the fix — RED now]
//     A3 no-reload-loop     : the heal reloads at most once and then settles (load count bounded+stable) [the guard — no infinite loop]
//     A4 upload-succeeds    : a REAL native-multipart upload → 200, server size == source, token present [the user outcome]
//   PASS = A1 && A2 && A3 && A4. RED-BASELINE on the current build (NO self-heal yet → A2 stays STRANDED-OLD). When the expert
//   ships the self-heal, GREEN means the stranded-device case is GENUINELY fixed, not asserted.
import { webkit } from '@playwright/test';
import { setupFoundation } from './r4031-foundation.mjs';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PLAYER = '11111111-2222-4333-8444-555555555555';
const SRC = crypto.randomBytes(4096);

const f = await setupFoundation({ commit: process.env.ARM_COMMIT || 'HEAD' });
R(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha} | srcBytes=${SRC.length}`);

// The REAL body-dropping worker from git (pre non-GET-passthrough fix) + a 'WHO' responder so the page can prove which worker
// controls it. Body-drop cause = its fetch handler respondWith()s a non-GET (2fef34dc9^ sw.js:67, no `method!=='GET' return`).
const OLD_SW = execSync('git show 2fef34dc9^:src/public/sw.js', { cwd: path.resolve('.'), encoding: 'utf8' })
  + `\nself.addEventListener('message', (e) => { try { e.source.postMessage({ who: 'STRANDED-OLD', cache: (typeof CACHE_NAME!=='undefined'?CACHE_NAME:'?') }); } catch {} });\n`;
// The FIXED current worker with skipWaiting()+clients.claim() STRIPPED (models "a new worker that can't evict the incumbent")
// + its own 'WHO' responder. Its fetch handler passes non-GET straight through (no body-drop) — so once IT controls, uploads work.
const CUR_SW_SRC = fs.readFileSync(path.resolve('src/public/sw.js'), 'utf8');
const FIXED_SW = CUR_SW_SRC.replace(/self\.skipWaiting\(\);?/g, '/*stripped*/').replace(/self\.clients\.claim\(\);?/g, '/*stripped*/').replace(/await\s+clients\.claim\(\);?/g, '/*stripped*/')
  + `\nself.addEventListener('message', (e) => { try { e.source.postMessage({ who: 'FIXED-NEW' }); } catch {} });\n`;

const askWho = (page) => page.evaluate(() => new Promise((resolve) => {
  const c = navigator.serviceWorker && navigator.serviceWorker.controller;
  if (!c) return resolve({ who: 'NONE' });
  const to = setTimeout(() => resolve({ who: 'NO-REPLY' }), 1500);
  navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.who) { clearTimeout(to); resolve(e.data); } }, { once: true });
  c.postMessage('WHO');
}));

const browser = await webkit.launch();
const results = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true, serviceWorkers: 'allow' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); sessionStorage.setItem('r4089loads', String(Number(sessionStorage.getItem('r4089loads') || '0') + 1)); } catch {} }, PLAYER);

  // ── PHASE 1: STRAND on the old body-dropping worker ──
  let serveOld = true;
  await ctx.route('**/sw.js', (route) => route.fulfill({ status: 200, contentType: 'application/javascript', headers: { 'Cache-Control': 'no-cache' }, body: serveOld ? OLD_SW : FIXED_SW }));
  const page = await ctx.newPage();
  await page.goto(f.base + '/app', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller), { timeout: 20000 }).catch(() => {});
  await sleep(1500);
  const who1 = await askWho(page);
  results.A1_strand = who1.who === 'STRANDED-OLD';
  R(`  A1 strand-established: page controlled by the old body-dropping worker = ${results.A1_strand} (who=${JSON.stringify(who1)})`);

  // ── PHASE 2: reopen the app — the server now serves the FIXED worker (but it can't evict the incumbent on its own) ──
  serveOld = false;
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(2500);
  // let any (future) self-heal run: update() → unregister() → one guarded reload
  const who2 = await askWho(page);
  results.A2_selfHeal = who2.who !== 'STRANDED-OLD'; // escaped the stranded worker (FIXED-NEW or NONE)
  R(`  A2 self-heals: NO longer controlled by the stranded worker = ${results.A2_selfHeal} (who=${JSON.stringify(who2)})`);

  // A3 no-reload-loop: load count must be bounded AND stable (a self-heal loop keeps re-incrementing)
  const loads1 = await page.evaluate(() => Number(sessionStorage.getItem('r4089loads') || '0'));
  await sleep(3000);
  const loads2 = await page.evaluate(() => Number(sessionStorage.getItem('r4089loads') || '0'));
  results.A3_noLoop = loads2 <= 4 && loads1 === loads2; // bounded (initial + reopen + at most one guarded heal-reload) AND settled
  R(`  A3 no-reload-loop: loads bounded+stable = ${results.A3_noLoop} (loads ${loads1} → ${loads2})`);

  // A4 upload-succeeds: a REAL native-multipart upload → 200 + server size == source + token present (the user outcome once healed)
  await page.waitForFunction(() => window.__rawbinClient?.connected === true, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => window.__rawbinClient?.send({ type: 'UPDATE_PROFILE', name: 'D', secretCode: '4089' }));
  await sleep(2000);
  const roomId = await page.evaluate(async () => { const c = window.__rawbinClient; if (!c?.createRoom) return null; c.createRoom('D', 'D'); for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 250)); const t = document.getElementById('room-tree'); if (t?.getAttribute('data-seed-ior')) return t.getAttribute('data-seed-ior'); } return null; });
  if (!roomId) { results.A4_upload = false; R(`  A4 upload-succeeds: BLOCKED — no room render (instrument)`); }
  else {
    const up = await page.request.post(`${f.base}/api/room/${roomId}/upload`, { multipart: { playerToken: PLAYER, file: { name: 'R4089.bin', mimeType: 'application/octet-stream', buffer: SRC } } });
    let body = {}; try { body = JSON.parse(await up.text()); } catch {}
    results.A4_upload = up.status() === 200 && Number(body.size) === SRC.length && !!body.uuid;
    R(`  A4 upload-succeeds: status=${up.status()} size=${body.size} (src=${SRC.length}) uuid=${String(body.uuid || '').slice(0, 12)} tokenAccepted=${up.status() !== 401} = ${results.A4_upload}`);
  }
  await ctx.close();
} catch (e) { results.error = String(e && e.message).slice(0, 200); }
finally { await browser.close().catch(() => {}); const td = await f.teardown(); R(`teardown: prod:4444 up=${td.prodUp} leftoverScratch=${td.leftover}`); }

R(`\n═══ R40.89 STALE-SW SELF-HEAL UPLOAD — 4 NAMED RESULTS ═══`);
R(`  A1 strand-established (old body-dropping worker controls) : ${results.A1_strand ? 'GREEN' : 'RED'}`);
R(`  A2 self-heals         (escapes the stranded worker)       : ${results.A2_selfHeal ? 'GREEN' : 'RED'}`);
R(`  A3 no-reload-loop     (heal reloads once then settles)    : ${results.A3_noLoop ? 'GREEN' : 'RED'}`);
R(`  A4 upload-succeeds    (native multipart, size==source)    : ${results.A4_upload ? 'GREEN' : 'RED'}`);
const green = results.A1_strand && results.A2_selfHeal && results.A3_noLoop && results.A4_upload;
R(`OVERALL: ${green ? 'ALL GREEN — stranded-device genuinely self-heals + uploads' : 'RED'} ${results.error ? '(err: ' + results.error + ')' : ''}`);
R(`  (RED-baseline expectation on the current build: A1 GREEN + A2 RED = stranded, no self-heal yet.)`);
process.exit(green ? 0 : 1);
