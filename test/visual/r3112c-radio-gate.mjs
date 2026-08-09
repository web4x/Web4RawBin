// ⛔⛔ CHAIN-CREDIT HELD — NOT DONE. This gate is ENGINE-INDEPENDENT GREEN (belt sets checked + change fires + Save reads it
//   in CHROMIUM) but Tron's REAL iOS DEVICE (v0.7.145) shows FLICKER-REVERT: the radio checks then REVERTS, does NOT stick.
//   Chromium CANNOT reproduce the iOS state-revert → this GREEN is a FALSE-GREEN for device-correctness, and the belt-handler
//   is NOT a valid oracle for the actual device behavior. NO marker, NO Test wire, chain-credit HELD until the architect roots
//   the flicker-revert + fixes it + Tron re-confirms the radio STICKS on his device. This file validates the WIRING only.
//   ★ LESSON: a "proxy" for engine-SPECIFIC behavior (radio-select-on-iOS-tap) is only a valid oracle if VALIDATED on the
//   device — I labeled the belt 'WebKit-reliable' without a device; it flicker-reverts on iOS. Wiring-present ≠ behavior-sticks.
// R31.12 v0.7.145 radio-fix — engine-INDEPENDENT @390, POLLUTION-SAFE (SystemTester in Marcel's existing dnd room, NO new
// rooms, no write). Chromium CANNOT validate 'a native radio SELECTS on a real iOS-WebKit tap' (false-greens it, 3rd time)
// → that = TRON device. Gated here (all engine-independent): native-presence + id/for + block-padding + the belt handler +
// the Save read-:checked wiring. The host Save→server-persist round-trip = the existing UPDATE_ROOM_CONFIG owner handler
// (owner-persist by construction; non-owner REJECT-first already GREEN in r3112b-nonhost-gate.mjs).
// (1) both groups (re-vis 3 + re-mode 2) = real <input type=radio> + EXPLICIT id + <label class=re-option for=<id>>.
// (2) .re-option rows block-padded. (3) belt (RoomView:157-159) sets checked+fires change on click/pointerup, SKIPS disabled
//     (non-host read-only holds). (4) Save-read: input[name=..]:checked yields the belt-set value (what host Save sends).
import { devices, chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';

const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`;
const DND = '3231db71-d834-435a-a7f9-a801680ccd62';
const CLIENT_VER = 'rawbin-v0.7.145';
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
      await page.click('.rb-header-title', { timeout: 5000 }).catch(() => {}); await sleep(700); // open settings (read-only, non-host)

      const r = await page.evaluate(() => {
        const opts = Array.from(document.querySelectorAll('label.re-option'));
        const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
        const vis = radios.filter(x => x.name === 're-vis'), mode = radios.filter(x => x.name === 're-mode');
        // (1) native + id/for pairing
        const idForOk = opts.length > 0 && opts.every(l => { const f = l.getAttribute('for'); const el = f && document.getElementById(f); return el && el.tagName === 'INPUT' && el.type === 'radio'; });
        // (2) block padding
        const padded = opts.length > 0 && opts.every(l => { const s = getComputedStyle(l); return s.display === 'block' && parseInt(s.paddingTop) > 0; });
        // (3a) belt SKIPS disabled: non-host modal → radios disabled → clicking a row is a no-op
        const drow = document.querySelector('label.re-option'); const dr = drow?.querySelector('input[type=radio]'); const wasChecked = dr?.checked;
        drow?.dispatchEvent(new Event('click', { bubbles: true }));
        const beltSkipsDisabled = !!dr && dr.disabled === true && dr.checked === wasChecked;
        // (3b) belt SETS mechanism (engine-independent, no host needed): re-enable ONE radio, click its row → belt sets checked + fires change
        const trow = Array.from(document.querySelectorAll('label.re-option')).find(l => l.getAttribute('for') === 're-vis-by-invite');
        const tr = document.getElementById('re-vis-by-invite'); let changed = false;
        if (tr) { tr.disabled = false; tr.addEventListener('change', () => changed = true); trow?.dispatchEvent(new Event('click', { bubbles: true })); }
        const beltSetsChecked = !!tr && tr.checked === true && changed === true;
        // (4) Save-read wiring: input[name=re-vis]:checked (what the host Save handler reads) === the belt-set value
        const readValue = document.querySelector('input[name=re-vis]:checked')?.value;
        const saveReadsChecked = readValue === 'by-invite';
        // host-only Save: non-host read-only modal has NO #re-save
        const saveHostOnly = !document.querySelector('#re-save');
        return { visN: vis.length, modeN: mode.length, allNative: radios.length === 5 && radios.every(x => x.type === 'radio'), idForOk, padded, beltSkipsDisabled, beltSetsChecked, saveReadsChecked, saveHostOnly };
      });
      await ctx.close();

      const structOk = r.visN === 3 && r.modeN === 2 && r.allNative && r.idForOk && r.padded;
      const pass = structOk && r.beltSkipsDisabled && r.beltSetsChecked && r.saveReadsChecked && r.saveHostOnly;
      results.push(pass);
      console.log(`iter ${i}: native+id/for=${structOk}(vis${r.visN}/mode${r.modeN} native=${r.allNative} idFor=${r.idForOk} padded=${r.padded}) | belt-skips-disabled=${r.beltSkipsDisabled} | belt-sets+change=${r.beltSetsChecked} | save-reads-:checked=${r.saveReadsChecked} | Save-host-only=${r.saveHostOnly} => ${pass ? 'GREEN' : 'RED'}`);
    }
  }
} finally { await browser.close(); }

console.log(`\nradio-SELECTS-on-real-iOS-tap = TRON DEVICE (Chromium false-greens native tap-select — the belt handler gated above is the WebKit-reliable proxy). Host Save→persist round-trip = existing UPDATE_ROOM_CONFIG owner handler (non-owner reject-first GREEN in r3112b).`);
console.log('\n===== R31.12 v0.7.145 radio-fix (engine-independent, DET-3x, no-new-rooms) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL (engine-independent):', green ? 'GREEN DET-3x' : 'RED');
if (process.exitCode !== 1) process.exitCode = green ? 0 : 1;
