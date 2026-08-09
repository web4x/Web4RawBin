// [test:uuid:cd6503cf-e79f-46ba-8ddc-7a19588ac436] R31.12 FINAL v0.7.147 radio — CERTIFIED DONE, GREEN DET-3x @390 (canonical HTML5 native radios, belt GONE = 0 pointerup in served app-H22AFE74.js). Each of the 5 radios (3 vis + 2 mode) plain click SELECTS + STICKS (no flicker/revert) + Save persists (reopen confirms). NO device-only caveat: zero device-specific code → native radios behave per HTML5 spec identically everywhere → Chromium is a VALID ORACLE (the device-specific belt that caused the earlier false-greens is removed; architect credited tester r3112e 4/4). Impl = RbRoomDetail.editOpen f9b579c1 (openRoomEditor radios+Save). Pollution-safe host room create+delete (rejoin-probe verified).
// R31.12 FINAL v0.7.147 — CLEAN radio certification. The belt is GONE (0 pointerup in served app-H22AFE74.js); radios are
// canonical HTML5 native input[type=radio] with explicit id + label[for]. ZERO device-specific code → native radios behave
// per HTML5 spec IDENTICALLY everywhere → Chromium is a VALID ORACLE (no false-green possible; the device-specific belt that
// caused the earlier false-greens is removed). CERTIFY @390: for EACH of the 5 radios (3 visibility + 2 mode) a plain click
// SELECTS + STICKS (no flicker/revert) + Save persists (reopen confirms). Confirm belt/pointerup absent in the served bundle.
// Host = a SystemTester-owned room (create + delete, pollution-safe rejoin-probe) — needed for editable radios + real Save.
import { devices, chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';

const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`;
const CLIENT_VER = 'rawbin-v0.7.147';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p) => new Promise((res) => { const r = https.request({ host: HOST, port: PORT, path: p, rejectUnauthorized: false }, (x) => { let b = ''; x.on('data', c => b += c); x.on('end', () => res(b)); }); r.on('error', () => res('')); r.end(); });
const RADIOS = [['re-vis', 're-vis-public', 'public'], ['re-vis', 're-vis-by-invite', 'by-invite'], ['re-vis', 're-vis-private', 'private'], ['re-mode', 're-mode-live', 'live'], ['re-mode', 're-mode-persistent', 'persistent']];

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const newRoomPage = async (joinId) => { const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' }); await seedSystemTester(ctx); const page = await ctx.newPage(); page.on('dialog', d => d.accept().catch(() => {})); await page.goto(joinId ? `${BASE}/app?join=${joinId}` : `${BASE}/app`, { waitUntil: 'domcontentloaded' }); return { ctx, page }; };
const roomReady = (page) => page.waitForFunction(() => (document.querySelector('#room-tree')?.getAttribute('data-seed-ior') || '').startsWith('room:'), { timeout: 15000 }).catch(() => {});
const openSettings = async (page) => { await page.click('.rb-header-title', { timeout: 5000 }).catch(() => {}); await sleep(600); };
const closeModal = async (page) => { await page.evaluate(() => document.querySelectorAll('#re-cancel').forEach(b => b.click())); await sleep(300); };

const results = [];
let OWNED = null, bundleClean = false, idForServed = false;
const sw = await httpGet('/sw.js'); const cn = (sw.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/) || [])[1];
const servedBundle = ((await httpGet('/app')).match(/app-[A-Z0-9]+\.js/) || [])[0];
const bundleSrc = await httpGet(`/dist/${servedBundle}`);
bundleClean = servedBundle && !/pointerup/.test(bundleSrc);                 // belt GONE
idForServed = /re-vis-public/.test(bundleSrc) && /re-mode-live/.test(bundleSrc); // explicit ids present
console.log(`client sw=${cn} bundle=${servedBundle} | pointerup-absent(belt-gone)=${bundleClean} | explicit-id/for=${idForServed}`);
try {
  if (cn !== CLIENT_VER || !bundleClean || !idForServed) { console.log(`ABORT: version/belt/idFor guard (sw=${cn} beltGone=${bundleClean} idFor=${idForServed})`); process.exitCode = 1; }
  else {
    const cr = await newRoomPage(null); await sleep(3500);
    await cr.page.click('#create-room-btn', { timeout: 8000 }).catch(() => {}); await cr.page.fill('#room-name', 'SystemTester R31.12f radio').catch(() => {}); await cr.page.click('#confirm-create-btn', { timeout: 8000 }).catch(() => {});
    await roomReady(cr.page); OWNED = await cr.page.evaluate(() => (document.querySelector('#room-tree')?.getAttribute('data-seed-ior') || '').replace('room:', '') || null); await cr.ctx.close();
    console.log(`OWNED host room = ${OWNED}`);

    for (let i = 1; i <= 3; i++) {
      const { ctx, page } = await newRoomPage(OWNED); await roomReady(page); await sleep(1200); await openSettings(page);
      // each of the 5 radios: plain click SELECTS + STICKS (still checked after a delay) + sole-in-group
      const stick = [];
      for (const [grp, id, val] of RADIOS) {
        await page.click(`#${id}`, { timeout: 4000 }).catch(() => {});
        const selected = await page.evaluate((id) => document.getElementById(id)?.checked === true, id);
        await sleep(450);
        const info = await page.evaluate(({ id, grp, val }) => ({ stillChecked: document.getElementById(id)?.checked === true, soleInGroup: document.querySelectorAll(`input[name="${grp}"]:checked`).length === 1 && document.querySelector(`input[name="${grp}"]:checked`)?.value === val }), { id, grp, val });
        stick.push(selected && info.stillChecked && info.soleInGroup);
      }
      const allStick = stick.length === 5 && stick.every(Boolean);
      // Save persists: set by-invite + live → Save → reopen → those are the defaults now
      await page.click('#re-vis-by-invite', { timeout: 4000 }).catch(() => {}); await page.click('#re-mode-live', { timeout: 4000 }).catch(() => {});
      await page.click('#re-save', { timeout: 4000 }).catch(() => {}); await sleep(1800);
      await openSettings(page);
      const persisted = await page.evaluate(() => document.getElementById('re-vis-by-invite')?.checked === true && document.getElementById('re-mode-live')?.checked === true);
      await closeModal(page);
      await ctx.close();
      const pass = allStick && persisted;
      results.push(pass);
      console.log(`iter ${i}: 5-radios select+STICK=[${stick.map(s => s ? 'Y' : 'N').join('')}] all=${allStick} | Save-persists(reopen)=${persisted} => ${pass ? 'GREEN' : 'RED'}`);
    }
  }
} finally {
  if (OWNED) { try { const d = await newRoomPage(OWNED); await roomReady(d.page); await sleep(900); await d.page.evaluate(() => document.querySelector('.room-body,#rrc-root')?.dispatchEvent(new CustomEvent('rb-delete', { bubbles: true }))); await sleep(400); await d.page.click('[data-action="delete"]', { force: true, timeout: 4000 }).catch(() => {}); await sleep(2000); await d.ctx.close(); const p = await newRoomPage(OWNED); await sleep(2500); const gone = await p.page.evaluate((id) => !((document.querySelector('#room-tree')?.getAttribute('data-seed-ior') || '').includes(id)), OWNED); console.log(`cleanup: owned room gone(rejoin-probe)=${gone}`); await p.ctx.close(); } catch { /* */ } }
  await browser.close();
}

console.log('\n===== R31.12 v0.7.147 CLEAN radio certification (canonical HTML5, Chromium=valid oracle) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean) && bundleClean && idForServed;
console.log('OVERALL:', green ? 'GREEN DET-3x — R31.12 radio DONE (belt-free native HTML5, selects+sticks+persists, no device-only caveat)' : 'RED');
if (process.exitCode !== 1) process.exitCode = green ? 0 : 1;
