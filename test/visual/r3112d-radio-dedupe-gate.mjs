// R31.12 v0.7.146 radio DE-DUPE — WIRING gate only. ⛔ CREDIT HELD: this validates the de-dupe STRUCTURE in Chromium;
// it does NOT and CANNOT prove the radio STICKS on real iOS-WebKit (Chromium can't reproduce the iOS state-revert — that
// is the DEVICE oracle, Tron). Root of the v0.7.145 flicker-revert = DOUBLE-activation (belt on click+pointerup AND for=+wrap
// label = 2 selections/tap → net revert). Fix (RoomView:159-161): belt pointerup-ONLY + e.preventDefault() + set()-once;
// labels have NO for=/id (wrap = sole assoc). Engine-independent WIRING checks: (1) click no longer sets the radio (click
// handler GONE), only pointerup does; (2) no for= on .re-option + no id on radios; (3) single pointerup = ONE change (set-once)
// + :checked holds IN CHROMIUM; (4) Save reads :checked, host-only. Pollution-safe: dnd 3231db71, no new rooms, no write.
import { devices, chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';

const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`;
const DND = '3231db71-d834-435a-a7f9-a801680ccd62';
const CLIENT_VER = 'rawbin-v0.7.146';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p) => new Promise((res) => { const r = https.request({ host: HOST, port: PORT, path: p, rejectUnauthorized: false }, (x) => { let b = ''; x.on('data', c => b += c); x.on('end', () => res(b)); }); r.on('error', () => res('')); r.end(); });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
const sw = await httpGet('/sw.js'); const cn = (sw.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/) || [])[1];
const appBundle = ((await httpGet('/app')).match(/app-[A-Z0-9]+\.js/) || [])[0];
console.log(`client sw=${cn} servedBundle=${appBundle}`);
try {
  if (cn !== CLIENT_VER) { console.log(`ABORT phantom-guard: sw ${cn} != ${CLIENT_VER}`); process.exitCode = 1; }
  else {
    for (let i = 1; i <= 3; i++) {
      const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
      await seedSystemTester(ctx);
      const page = await ctx.newPage();
      await page.goto(`${BASE}/app?join=${DND}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => (document.querySelector('#room-tree')?.getAttribute('data-seed-ior') || '').startsWith('room:'), { timeout: 15000 }).catch(() => {});
      await sleep(1300);
      await page.click('.rb-header-title', { timeout: 5000 }).catch(() => {}); await sleep(700); // read-only modal (non-host)

      const r = await page.evaluate(() => {
        const opts = Array.from(document.querySelectorAll('label.re-option'));
        const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
        const vis = radios.filter(x => x.name === 're-vis'), mode = radios.filter(x => x.name === 're-mode');
        // (2) no for= on labels + no id on radios (wrap = sole assoc; was for=+wrap = double)
        const noFor = opts.length > 0 && opts.every(l => !l.getAttribute('for'));
        const noId = radios.length > 0 && radios.every(x => !x.id);
        const padded = opts.length > 0 && opts.every(l => { const s = getComputedStyle(l); return s.display === 'block' && parseInt(s.paddingTop) > 0; });
        // re-enable a target radio (dnd non-host modal = disabled) to exercise the belt wiring
        const trow = opts.find(l => l.querySelector('input[value="by-invite"]'));
        const tr = trow?.querySelector('input[type="radio"]'); if (tr) tr.disabled = false;
        // (1) CLICK no longer sets the radio (the click handler was REMOVED in the de-dupe)
        if (tr) tr.checked = false;
        trow?.dispatchEvent(new Event('click', { bubbles: true }));
        const clickIsNoOp = !!tr && tr.checked === false;
        // pointerup DOES set + exactly ONE change (set-once)
        let changes = 0; tr?.addEventListener('change', () => changes++);
        trow?.dispatchEvent(new Event('pointerup', { bubbles: true }));
        const pointerupSets = !!tr && tr.checked === true;
        const singleChangePerTap = changes === 1;
        // :checked holds in chromium (re-read) + Save-read wiring value
        const holdsInChromium = document.querySelector('input[name=re-vis]:checked')?.value === 'by-invite';
        const saveHostOnly = !document.querySelector('#re-save'); // non-host read-only → no Save
        return { visN: vis.length, modeN: mode.length, allNative: radios.length === 5 && radios.every(x => x.type === 'radio'), noFor, noId, padded, clickIsNoOp, pointerupSets, singleChangePerTap, holdsInChromium, saveHostOnly };
      });
      await ctx.close();

      const structOk = r.visN === 3 && r.modeN === 2 && r.allNative && r.noFor && r.noId && r.padded;
      const dedupeOk = r.clickIsNoOp && r.pointerupSets && r.singleChangePerTap; // pointerup-ONLY, single-activation
      const pass = structOk && dedupeOk && r.holdsInChromium && r.saveHostOnly;
      results.push(pass);
      console.log(`iter ${i}: struct=${structOk}(vis${r.visN}/mode${r.modeN} native=${r.allNative} noFor=${r.noFor} noId=${r.noId} padded=${r.padded}) | de-dupe: click-noop=${r.clickIsNoOp} pointerup-sets=${r.pointerupSets} single-change=${r.singleChangePerTap} | :checked-holds-CHROMIUM=${r.holdsInChromium} | Save-host-only=${r.saveHostOnly} => ${pass ? 'WIRING-GREEN' : 'RED'}`);
    }
  }
} finally { await browser.close(); }

console.log('\n===== R31.12 v0.7.146 radio de-dupe — WIRING (engine-independent, DET-3x, no-new-rooms) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'WIRING-GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('WIRING VERDICT:', green ? 'GREEN DET-3x (de-dupe structure present: pointerup-only, no double-handler, no for=, single-activation, :checked holds in Chromium)' : 'RED');
console.log('⛔ DEVICE-STICKS-ON-iOS: UNKNOWN — pending Tron device re-confirm. Chromium CANNOT reproduce the iOS revert; this gate does NOT credit the feature done. Chain-credit HELD.');
if (process.exitCode !== 1) process.exitCode = green ? 0 : 1;
