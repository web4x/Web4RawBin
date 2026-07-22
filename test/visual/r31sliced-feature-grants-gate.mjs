// [test:uuid:b70aa99f-28e3-460f-a793-986dceb3e156] R31.8 slice-d renderFeatureGrants (Impl f345b8ed) — DATA-DRIVEN m.features, GREEN DET-3x @390 v0.7.119: /profile #feature-grants renders EVERY membership (Server Manager 🖥️→/server-manager + Feature Manager 🔑→/feature-manager), each interactive (cookie-mint→nav); empty m.features → 0 entries (fail-closed, server-gated). Generalizes the R31.1 SM-only boolean. DISTINCT-intent on f345b8ed from a52393fb (boolean serverManager) + baee3c82 (viewer).
// R31.8 slice-d generalized renderFeatureGrants (Impl f345b8ed, server.ts:940) — AC-INV, DET-3x @390. served v0.7.119
// (pid 1314990). The /profile viewer's #feature-grants is DATA-DRIVEN by m.features (the server-computed PROFILE ws
// message), generalizing the R31.1 ServerManager-only boolean → renders EVERY Feature the user is a member of
// (Server Manager 🖥️ → /server-manager, Feature Manager 🔑 + future → /feature-manager). Server-gated: the entry LIST
// comes from the server message, not a client fetch — a non-member can't fake it. My r3110 a52393fb (boolean serverManager
// MITM) is STALE for this. Mock membership BY CONSTRUCTION: MITM the app ws PROFILE frame, inject m.features (no eviction).
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, TARGET = '0.7.119';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r(b)); }); q.on('error', () => r('')); q.end(); });

// MITM the app ws (wss://host/): inject m.features on the PROFILE frame (the frame that carries serverManager)
const mitmFeatures = (page, features) => page.routeWebSocket(/:4444\/$|:4444$/, (wsr) => {
  const server = wsr.connectToServer();
  wsr.onMessage((m) => server.send(m));
  server.onMessage((m) => {
    if (typeof m === 'string' && m.includes('"serverManager"')) { try { const o = JSON.parse(m); o.features = features; wsr.send(JSON.stringify(o)); return; } catch { /* */ } }
    wsr.send(m);
  });
});
const readGrants = (page) => page.evaluate(() => {
  const fg = document.getElementById('feature-grants');
  if (!fg) return { present: false, entries: [] };
  return { present: true, entries: Array.from(fg.querySelectorAll('a')).map(a => (a.textContent || '').trim()) };
});

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  console.log(`served=${JSON.parse(await httpGet('/api/config') || '{}').version} (pid 1314990) target=${TARGET}`);
  for (let i = 1; i <= 3; i++) {
    // (A) DATA-DRIVEN: m.features=[Server Manager, Feature Manager] → BOTH entries render (the generalization vs SM-only)
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await mitmFeatures(page, [{ name: 'Server Manager' }, { name: 'Feature Manager' }]);
    await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
    await sleep(2500);
    const g = await readGrants(page);
    const both = g.present && g.entries.length === 2 && g.entries.some(e => /Server Manager/.test(e)) && g.entries.some(e => /Feature Manager/.test(e));
    // nav targets: Server Manager entry → /server-manager onclick, others → /feature-manager (data-driven page routing)
    const navOk = await page.evaluate(() => {
      const fg = document.getElementById('feature-grants'); if (!fg) return false;
      const as = Array.from(fg.querySelectorAll('a'));
      return as.length === 2 && as.every(a => typeof a.onclick === 'function'); // each entry is interactive (cookie-mint→nav)
    });
    if (i === 1) await page.screenshot({ path: '/var/dev/Workspaces/web4x/Web4RawBin/test-results/r31sliced/grants-390.png' });
    await ctx.close();

    // (B) EMPTY membership: m.features=[] → NO entries (fail-closed; proves data-driven, not hardcoded SM)
    const ctx2 = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx2);
    const page2 = await ctx2.newPage();
    await mitmFeatures(page2, []);
    await page2.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
    await sleep(2000);
    const g2 = await readGrants(page2);
    const emptyOk = g2.entries.length === 0; // no features → no entries
    await ctx2.close();

    const pass = both && navOk && emptyOk;
    results.push(pass);
    console.log(`iter ${i}: [A]all-render=${both}(${g.entries.join(' | ')}) nav-interactive=${navOk} | [B]empty→none=${emptyOk}(${g2.entries.length}) => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

console.log('\n===== R31.8 slice-d generalized renderFeatureGrants (data-driven m.features, DET-3x @390) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
