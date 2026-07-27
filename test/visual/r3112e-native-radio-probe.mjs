// R31.12 — TEST THE ASSUMPTION (Tron: 'how do you know it's an iOS problem?'). We never verified iOS-specificity.
// Does a room-settings radio select by a PLAIN NATIVE CLICK in Chromium @390 (v0.7.146), WITHOUT the belt handler?
// If native selection is broken in Chromium too → the 'iOS' theory is WRONG = a plain UNIVERSAL regression.
// Probes: (A) modal radio, belt STRIPPED (cloneNode drops listeners), plain page.click → :checked? = pure native.
// (B) modal radio WITH belt (normal page.click) → :checked? (C) a freshly-injected plain <input type=radio> → click → :checked?
// (D) elementFromPoint at the modal radio — is something intercepting the click? Non-host dnd modal (re-enable radios to click).
import { devices, chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444', DND = '3231db71-d834-435a-a7f9-a801680ccd62';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app?join=${DND}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (document.querySelector('#room-tree')?.getAttribute('data-seed-ior') || '').startsWith('room:'), { timeout: 15000 }).catch(() => {});
  await sleep(1300);
  await page.click('.rb-header-title', { timeout: 5000 }).catch(() => {}); await sleep(700);

  // enable all re-vis radios (non-host modal disables them) + set up (A) belt-stripped clone on the 'private' row, (B) keep 'by-invite' with belt
  const setup = await page.evaluate(() => {
    document.querySelectorAll('input[name="re-vis"]').forEach(r => r.disabled = false);
    // (A) strip belt on the 'private' row by replacing it with a listener-less clone
    const pRow = Array.from(document.querySelectorAll('label.re-option')).find(l => l.querySelector('input[value="private"]'));
    if (pRow) { pRow.replaceWith(pRow.cloneNode(true)); document.querySelector('input[name="re-vis"][value="private"]').checked = false; }
    // (D) elementFromPoint at the 'private' radio center — is the radio itself the hit target?
    const pr = document.querySelector('input[name="re-vis"][value="private"]'); const rc = pr.getBoundingClientRect();
    const top = document.elementFromPoint(rc.x + rc.width / 2, rc.y + rc.height / 2);
    // (C) inject a plain standalone native radio pair at top of the modal
    const box = document.createElement('div'); box.id = 'probe-box'; box.style.cssText = 'position:fixed;top:2px;left:2px;z-index:99999';
    box.innerHTML = '<input type="radio" id="probe-r1" name="probe"><input type="radio" id="probe-r2" name="probe">';
    document.body.appendChild(box);
    return { belt_stripped_private: !document.querySelector('input[name="re-vis"][value="private"]').checked, topAtPrivate: top ? top.tagName + (top.getAttribute('type') ? '[' + top.getAttribute('type') + ']' : '') : null, radioIsHit: pr === top || pr.contains(top) };
  });

  // (A) PURE NATIVE: click the belt-stripped 'private' radio
  await page.click('input[name="re-vis"][value="private"]', { timeout: 4000 }).catch(() => {});
  await sleep(300);
  const A_nativeNoBelt = await page.evaluate(() => document.querySelector('input[name="re-vis"]:checked')?.value === 'private');

  // (B) WITH belt: click the 'by-invite' radio (belt still on its row)
  await page.click('input[name="re-vis"][value="by-invite"]', { timeout: 4000 }).catch(() => {});
  await sleep(300);
  const B_withBelt = await page.evaluate(() => document.querySelector('input[name="re-vis"]:checked')?.value === 'by-invite');

  // (C) plain injected radio
  await page.click('#probe-r1', { timeout: 4000 }).catch(() => {});
  await sleep(200);
  const C_plainRadio = await page.evaluate(() => document.getElementById('probe-r1')?.checked === true);

  await ctx.close();
  console.log('=== R31.12 native-radio probe (Chromium @390, v0.7.146) ===');
  console.log(`(A) modal radio, BELT STRIPPED, plain native click → selected: ${A_nativeNoBelt}`);
  console.log(`(B) modal radio, WITH belt, plain click → selected: ${B_withBelt}`);
  console.log(`(C) plain injected <input type=radio>, click → selected: ${C_plainRadio}`);
  console.log(`(D) elementFromPoint at the modal radio center: ${setup.topAtPrivate} (radio-is-hit-target: ${setup.radioIsHit})`);
  console.log('\nVERDICT:');
  if (!A_nativeNoBelt && !setup.radioIsHit) console.log('  → native radio click is INTERCEPTED in CHROMIUM too (something on top) = UNIVERSAL regression, NOT iOS-only. The belt masks it.');
  else if (!A_nativeNoBelt && setup.radioIsHit && C_plainRadio) console.log('  → the MODAL radio native-click FAILS in Chromium (but a plain radio works) = a modal-specific UNIVERSAL break, NOT iOS-only.');
  else if (A_nativeNoBelt) console.log('  → native radio click WORKS in Chromium (belt-free) = native selection is fine here; the break is NOT reproduced in Chromium → consistent with iOS-specific OR belt-induced. Needs the 2nd-engine/device to localize.');
} finally { await browser.close(); }
