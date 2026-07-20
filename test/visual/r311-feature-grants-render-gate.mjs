// [test:uuid:96d0d227-2ac0-468b-8bb7-b3d3a0438fc7] R31.1 ProfileEditor.renderFeatureGrants (Impl f345b8ed) — POSITIVE render + FILTER, DET-3x.
// DISTINCT from the R31.2 403 auth gate (assertOwner 335dbf3d, r312): this gates the RENDER logic given a gate response.
// (a) AUTHORIZED: /api/server-manager/whoami route-intercepted → 200 (isolates the render from the auth) → the profile's
//     feature-grants section renders the 'Server Manager' entry (🖥️, href=/server-manager) under a 'Feature access' title.
// (b) FILTER (non-owner): REAL SystemTester (whoami → 403) → renderFeatureGrants filters it out: section host present,
//     NO Server Manager entry, no title (grants empty).
// The AUTH that yields 200/403 is gated separately by r312 (335dbf3d). The true end-to-end owner-VISIBLE (a real owner
// live session) = Tron device-facing. Pollution-safe: route-intercept only (arm a), no owner impersonation, no writes.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function openProfileAndReadGrants(browser, { mockWhoami200 }) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  if (mockWhoami200) {
    // isolate renderFeatureGrants' RENDER path from the auth: pretend the gate authorized this caller
    await page.route('**/api/server-manager/whoami**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"owner":true,"token8":"41ad88c4"}' }));
  }
  await page.goto(`${BASE}/app?editProfile=1`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#pe-feature-grants', { timeout: 20000 }).catch(() => {});
  await sleep(2000); // renderFeatureGrants is async (awaits whoami) → let the fetch resolve + innerHTML settle
  const out = await page.evaluate(() => {
    const host = document.querySelector('#pe-feature-grants');
    const grants = Array.from(document.querySelectorAll('a.profile-grant')).map(a => ({ text: (a.textContent || '').trim(), href: a.getAttribute('href') }));
    const sm = grants.filter(g => /server manager/i.test(g.text));
    return { hostPresent: !!host, title: !!document.querySelector('.profile-grants-title'), grantCount: grants.length, smText: sm[0]?.text || null, smHref: sm[0]?.href || null };
  });
  await ctx.close();
  return out;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    // (a) authorized render (whoami mocked 200)
    const a = await openProfileAndReadGrants(browser, { mockWhoami200: true });
    const positive = a.hostPresent && a.title && !!a.smText && !!a.smHref && a.smHref.startsWith('/server-manager'); // app decorates href with ?token=<player>; entry points at /server-manager

    // (b) filter (real non-owner → whoami 403)
    const b = await openProfileAndReadGrants(browser, { mockWhoami200: false });
    const filtered = b.hostPresent && b.smText === null; // section rendered, Server Manager filtered out

    const pass = positive && filtered;
    results.push(pass);
    console.log(`iter ${i}: (a)owner-render=${positive}(host=${a.hostPresent} title=${a.title} sm="${a.smText}" href=${a.smHref}) | (b)nonowner-filter=${filtered}(host=${b.hostPresent} grants=${b.grantCount} sm=${b.smText}) => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

console.log('\n===== R31.1 feature-grants render+filter (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
