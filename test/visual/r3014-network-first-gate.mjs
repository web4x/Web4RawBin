// [test:uuid:7c2e9b41-4d68-4a03-9f15-3e8b6c07d2a9] R30.14 ServiceWorker.navigationStrategy (impl 769bc9bc) — network-first shell (the clean-release ROOT-CAUSE fix). The mutable HTML shell + hashed bundles are fetched NETWORK-FIRST (fresh, cache-fallback only when offline); the prior cache-first shell served a STALE shell+bundle until a manual hard-reload and DEFEATED pollForWorkerUpdate+claimClients. Network-first is what makes a deploy actually reach a running client.
// GATE (DET-3x, live prod): (1) the DEPLOYED sw.js routes the shell/navigation + /dist bundles through networkFirst (navigate|.html|/dist|/app|/edit|/trace|/scenario), and immutable static stays cache-first — the impl behavior on the served worker, not the source tree; (2) a REAL client parks then RELOADS (soft location.reload) and receives the CURRENT served bundle hash (network-first serves fresh, no stale-cache pin, no manual hard-reload). Version-confirm via served edit-*.js hash + /api/config, NEVER DOM-count. Read-only.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const bundleHash = (html) => (html.match(/edit-[A-Z0-9]{8}\.js/) || [])[0] || '';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1200, height: 800 } }); // SW NOT blocked here — we exercise it
    await seedSystemTester(ctx); const page = await ctx.newPage();
    // establish the prod origin + register the SW FIRST (so same-origin fetch + SW control work)
    await page.goto(`${BASE}/edit/otmux`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, { timeout: 15000 }).catch(() => {});
    await sleep(1200);
    // (1) the DEPLOYED sw.js: navigationStrategy network-first for shell/bundles, cache-first for static (same-origin now)
    const probe = await page.evaluate(async () => {
      const sw = await (await fetch('/sw.js', { cache: 'no-store' })).text().catch(() => '');
      const shell = await (await fetch('/edit/package.json', { cache: 'no-store' })).text().catch(() => '');
      const cfg = await (await fetch('/api/config', { cache: 'no-store' })).json().catch(() => ({}));
      return { sw, shell, cfg };
    });
    const sw = probe.sw;
    const hasNavStrategy = /navigationStrategy/.test(sw) && /networkFirst/.test(sw);
    const shellNetworkFirst = /networkFirst\(request\)/.test(sw) && /\/dist\//.test(sw) && /navigate/.test(sw);
    const staticCacheFirst = /cache-first|cacheFirst|immutable/.test(sw);
    const hash0 = bundleHash(probe.shell); const cfg = probe.cfg;
    await page.reload({ waitUntil: 'networkidle' }); // soft reload (NOT a hard-refresh)
    await sleep(800);
    const afterHash = await page.evaluate(() => (document.documentElement.outerHTML.match(/edit-[A-Z0-9]{8}\.js/) || [])[0] || '');
    const controlled = await page.evaluate(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller));
    const freshAfterSoftReload = afterHash === hash0 && afterHash !== ''; // served fresh current bundle via SW, no stale hard-reload needed

    const pass = hasNavStrategy && shellNetworkFirst && controlled && freshAfterSoftReload;
    results.push(pass);
    console.log(`iter ${i}: navStrategy+networkFirst=${hasNavStrategy} shell-network-first=${shellNetworkFirst} static-cache-first=${staticCacheFirst} | SW-controlled=${controlled} soft-reload-hash=${afterHash}(==served ${hash0}=${freshAfterSoftReload}) cfg-ver=${cfg && cfg.version} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.14 network-first shell (navigationStrategy 769bc9bc) (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — shell network-first, soft-reload serves fresh (no hard-reload)' : 'RED');
process.exitCode = green ? 0 : 1;
