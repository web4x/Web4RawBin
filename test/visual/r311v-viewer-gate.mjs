// [test:uuid:baee3c82-02b3-4aa4-a49e-56eb2b6184ae] R31.1 renderFeatureGrants (Impl f345b8ed) — VIEWER surface (v0.7.86), DET-3x.
// ★ CORRECT surface: the 'Server Manager' feature-grant renders at the BOTTOM of the read-only /profile VIEWER
// (#feature-grants), owner-only. Supersedes r311 (96d0d227) which gated the profile EDITOR overlay = the moved-from
// bug placement. renderFeatureGrants MOVED to the server (server.ts:874) → emits an inline script into #feature-grants
// on GET /profile that fetches whoami and appends the entry ONLY on 200.
// (a) AUTHORIZED (whoami route-intercepted 200, isolates RENDER from auth) → entry appended under 'Feature access'.
// (b) real NON-OWNER (whoami 403) → ABSENT (filtered); markup FORCED → whoami still 403 (server-gated, not UI-hidden).
// The auth (assertOwner 335dbf3d) is gated separately by r312. owner-VISIBLE end-to-end = Tron device-facing.
// Pollution-safe: route-intercept only (arm a), no owner impersonation, no writes.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function loadProfileGrants(browser, { mock200 }) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  if (mock200) await page.route('**/api/server-manager/whoami**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"owner":true,"token8":"41ad88c4"}' }));
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#feature-grants', { timeout: 20000 }).catch(() => {});
  await sleep(2500); // the server-emitted inline script fetches whoami then appends into #feature-grants
  const out = await page.evaluate(() => {
    const host = document.querySelector('#feature-grants');
    const links = Array.from(host?.querySelectorAll('a') || []);
    const sm = links.filter(a => /server manager/i.test(a.textContent || ''));
    return { hostPresent: !!host, title: /feature access/i.test(host?.textContent || ''), smText: sm[0]?.textContent?.trim() || null, smHref: sm[0]?.getAttribute('href') || null };
  });
  await ctx.close();
  return out;
}

async function markupForcedStillDenied(browser) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
  await sleep(1500);
  const status = await page.evaluate(async () => {
    const host = document.getElementById('feature-grants') || document.body;
    const a = document.createElement('a'); a.href = '/server-manager'; a.textContent = '🖥️ Server Manager'; host.appendChild(a); // FORCE the markup
    return (await fetch('/api/server-manager/whoami', { headers: { 'x-player-token': localStorage.getItem('rawbin-player-id') || '' } })).status;
  });
  await ctx.close();
  return status;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const a = await loadProfileGrants(browser, { mock200: true });
    const positive = a.hostPresent && a.title && !!a.smText && !!a.smHref && a.smHref.startsWith('/server-manager');
    const b = await loadProfileGrants(browser, { mock200: false });
    const filtered = b.hostPresent && b.smText === null;
    const forced = await markupForcedStillDenied(browser);
    const forcedDenied = forced === 403;

    const pass = positive && filtered && forcedDenied;
    results.push(pass);
    console.log(`iter ${i}: (a)VIEWER-owner-render=${positive}(host=${a.hostPresent} title=${a.title} sm="${a.smText}" href=${a.smHref}) | (b)nonowner-filter=${filtered}(host=${b.hostPresent} sm=${b.smText}) | markup-forced-403=${forcedDenied}(${forced}) => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

console.log('\n===== R31.1 feature-grants /profile VIEWER render+filter (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
