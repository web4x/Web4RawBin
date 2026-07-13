// [test:uuid:4bc24d24-ffcb-4adc-a3bb-27819ae63b7d] R30.4 RoomBrowser.applyProfileName — lobby resolves saved profile name on initial load (DET-3x GREEN)
// R30.4 gate — lobby resolves the saved profile name on initial load (RoomBrowser.applyProfileName,
// impl 9b9732be, prod v0.7.12). Fix: subscribe BOTH MSG.PROFILE (initial) + MSG.PROFILE_UPDATED ->
// applyProfileName; was PROFILE_UPDATED-only so a reload left the random "User NNN" construction
// fallback stuck. SystemTester (ce981242) ONLY, READ-ONLY (loads lobby, mutates nothing server-side),
// serviceWorkers:'block' = hard-refresh past the SW manifest-cache. DET-3x.
//
// Faithful + NON-POLLUTING: seed the token but NO rawbin-name. The app's IDENTIFY sends
// name=localStorage['rawbin-name']||'' and the server does `if(msg.name) profile.name=msg.name`
// — so seeding ANY name would OVERWRITE the real server profile (learned the hard way: a stale
// 'User 000' seed clobbered SystemTester's name). With no seed, IDENTIFY sends '' → the server
// profile is untouched, construction shows the random 'User NNN' fallback, and the fix (initial
// MSG.PROFILE → applyProfileName) resolves it to the real 'SystemTester'. Assert that resolution.

import { chromium } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const PROFILE_NAME = 'SystemTester';   // ce981242's committed server profile name
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 900, height: 1000 } });
    await ctx.addInitScript((st) => {
      localStorage.setItem('rawbin-player-id', st);
      // NO rawbin-name — so IDENTIFY sends '' and never overwrites the server profile
      ['privateKey', 'publicKey', 'signature'].forEach(k => localStorage.setItem('rawbin-device-' + k, 'e2e'));
    }, ST);
    const page = await ctx.newPage();

    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#member-name', { timeout: 20000 }).catch(() => {});
    // wait for the initial MSG.PROFILE to resolve the name (poll until it becomes the real profile name)
    let nameVal = '', avatarName = '';
    for (let t = 0; t < 20; t++) {
      const r = await page.evaluate(() => ({
        name: (document.getElementById('member-name')?.value) || '',
        avatar: document.querySelector('rb-avatar')?.getAttribute('name') || '',
      }));
      nameVal = r.name; avatarName = r.avatar;
      if (nameVal === PROFILE_NAME) break;
      await sleep(400);
    }

    // GREEN = the saved profile name resolved on initial load; NOT a random User NNN
    const resolvedProfile = nameVal === PROFILE_NAME;
    const notUserNNN = !/^User\s*\d+\s*$/.test(nameVal);
    const pass = resolvedProfile && notUserNNN;
    results.push(pass);
    console.log(`iter ${i}: member-name="${nameVal}" avatar="${avatarName}" | resolvedProfile=${resolvedProfile} notUserNNN=${notUserNNN} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }

  console.log('\n=== VERDICT R30.4 lobby profile-name on initial load (DET-3x) ===');
  results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
  const green = results.length === 3 && results.every(Boolean);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
  process.exitCode = green ? 0 : 1;
} finally { await browser.close(); }
