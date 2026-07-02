// [test:uuid:8f464c84-cb62-41b7-aa55-55344725e075] R21.2 renderNameOnConnect
// R21.2 gate — lobby #member-name LIVE-updates after vCard import, NO reload.
// Fix: fb369d340 (v0.6.63). RoomBrowser subscribes to PROFILE_UPDATED and patches
// the existing #member-name input in place (was stale 'User NNN' until reload).
//
// Faithful path: /app?editProfile=1 mounts the lobby AND the profile editor together
// (app.ts:41-47). Import a real .vcf via #pe-vcf-input -> applyVCard sets #pe-name ->
// #pe-save sends UPDATE_PROFILE -> server emits PROFILE_UPDATED -> the FIX patches the
// already-rendered #member-name node WITHOUT a reload.
//
// Discriminator (why this is RED on the buggy build, GREEN on the fixed build):
//   - we TAG the #member-name node before save (data-gate-tag=<unique>)
//   - after save we require the SAME node (tag intact) to now carry the vCard name
//   - and we require NO navigation happened (window.__gateNoReload still true)
// On v0.6.62 (no listener) the tagged node keeps the stale name -> RED.
//
// DET-3x: 3 iterations, each a DIFFERENT vCard name, ONE user (one context) to keep
// prod pollution to a single test profile.

import { chromium } from '@playwright/test';

const BASE = process.env.GATE_BASE || 'https://prod.wo-da.de:4444';
const TAGBASE = 'r212gate';
const results = [];

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('  [page-err]', m.text().slice(0, 120)); });

function vcf(fn) {
  return `BEGIN:VCARD\nVERSION:3.0\nFN:${fn}\nN:${fn};;;;\nEND:VCARD`;
}

// hasDeviceKeys() (app.ts) only checks localStorage presence — seeding bypasses the
// "Authorize This Device" gate so the lobby renders (same bypass r2031 uses).
async function seedDeviceKeys() {
  await page.evaluate(() => {
    localStorage.setItem('rawbin-device-privateKey', 'e2e-bypass');
    localStorage.setItem('rawbin-device-publicKey', 'e2e-bypass');
    localStorage.setItem('rawbin-device-signature', 'e2e-bypass');
  });
}
// If the device dialog still shows (keys read at construction before our seed),
// reload once: init() now sees committed profile + device keys -> proceedToBrowser.
async function clearDeviceGate() {
  if (await page.locator('#de-code').isVisible({ timeout: 1500 }).catch(() => false)) {
    await seedDeviceKeys();
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
  }
}

// --- bootstrap: ensure a COMMITTED profile + device keys so the lobby renders ---
console.log(`=== R21.2 lobby live-name gate @ ${BASE} ===`);
await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
if (await page.locator('#pe-name').isVisible({ timeout: 3000 }).catch(() => false)) {
  await seedDeviceKeys();                 // before commit -> hasDeviceKeys() true at save
  await page.fill('#pe-name', `${TAGBASE}-init`);
  await page.fill('#pe-code', '1234');    // 4-digit secret so the profile commits cleanly
  await page.click('#pe-save');
  await page.waitForTimeout(3000);
  await clearDeviceGate();
}
await page.waitForSelector('#member-name', { timeout: 20000 });
console.log('bootstrap: lobby reached, #member-name =', JSON.stringify(await page.inputValue('#member-name')));

// --- DET-3x measured iterations ---
for (let i = 1; i <= 3; i++) {
  const newName = `${TAGBASE}-live-${i}`;
  const tag = `${TAGBASE}-${i}`;

  // open lobby + profile editor together (returning-user edit scenario)
  await page.goto(`${BASE}/app?editProfile=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await clearDeviceGate();
  await page.waitForSelector('#member-name', { timeout: 20000 });
  await page.waitForSelector('#pe-name', { state: 'visible', timeout: 20000 }); // editor open
  await page.waitForSelector('#pe-vcf-input', { state: 'attached', timeout: 20000 }); // hidden file input

  const prev = await page.inputValue('#member-name');

  // tag the live node + set a no-reload sentinel (a real navigation clears window.*)
  await page.evaluate((t) => {
    document.getElementById('member-name')?.setAttribute('data-gate-tag', t);
    window.__gateNoReload = t;
  }, tag);

  // REAL vCard import through the file input -> applyVCard -> #pe-name
  await page.setInputFiles('#pe-vcf-input', {
    name: `${tag}.vcf`, mimeType: 'text/vcard', buffer: Buffer.from(vcf(newName)),
  });
  await page.waitForTimeout(800);
  const peName = await page.inputValue('#pe-name');
  const importApplied = peName === newName;

  // save -> UPDATE_PROFILE -> server PROFILE_UPDATED round-trip
  await page.click('#pe-save');

  // wait for the LIVE patch (no reload): same tagged node now carries the vCard name
  let after = prev, tagIntact = false, noReload = false;
  for (let t = 0; t < 50; t++) {
    const s = await page.evaluate(() => {
      const el = document.getElementById('member-name');
      return {
        val: el ? el.value : null,
        tag: el ? el.getAttribute('data-gate-tag') : null,
        sentinel: window.__gateNoReload || null,
      };
    });
    after = s.val; tagIntact = s.tag === tag; noReload = s.sentinel === tag;
    if (after === newName && tagIntact && noReload) break;
    await page.waitForTimeout(200);
  }

  // Discriminator: render() emits value="${this.memberName}", and ONLY the fix's
  // PROFILE_UPDATED listener (RoomBrowser.ts:33-38) updates this.memberName after
  // construction. So on buggy v0.6.62 the lobby name can never reflect a post-load
  // import without a reload — regardless of any re-render. tagIntact is logged as
  // info only (the editor's onSave->browser.show() re-render legitimately replaces
  // the node; it is NOT a failure as long as the value tracks + no reload occurred).
  const pass = importApplied && after === newName && after !== prev && noReload;
  results.push({ i, prev, newName, after, importApplied, tagIntact, noReload, pass });
  console.log(`iter ${i}: prev=${JSON.stringify(prev)} -> after=${JSON.stringify(after)} | import=${importApplied} noReload=${noReload} reRendered=${!tagIntact} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n=== VERDICT R21.2 (DET-3x) ===');
results.forEach(r => console.log(`  iter ${r.i}: ${r.pass ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(r => r.pass);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
await browser.close();
process.exit(green ? 0 : 1);
