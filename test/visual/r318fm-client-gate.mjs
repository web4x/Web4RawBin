// [test:uuid:68cf0aa6-ee7e-449c-ac00-4786d711d341] R31.8 RbFeatureDetail.mount (Impl 965e810c, Method 29130d6e, Class a085d2d1) — feature detail-view RENDERS @390: feature info (icon+name) + grant input + dropdown container, not stuck on Loading…. DET-3x GREEN v0.7.135.
// [test:uuid:a708a9e3-263c-4890-ac5c-b358642cdef9] R31.8 RbFeatureDetail.userComplete (Impl 9b54bc91, Method ca286163, Class a085d2d1) — type → debounced /api/feature-manager/users?q= → dropdown POPULATES [data-hit] ranked/masked hits, visible. DET-3x GREEN @390.
// [test:uuid:86930eae-e0ba-4e67-8819-8e9d4954d05c] R31.8 RbFeatureDetail.applyGrant (Impl cfde8f48, Method ee4143df, Class a085d2d1) — mousedown a hit → POST /api/feature-manager {action:'grant',feature,token} → fm-tree-refresh FLIP. DET-3x GREEN @390.
// R31.8 RbFeatureDetail client FUNCTIONAL gate @390 iPhone-12 — REAL interaction on the owner-only grant surface.
// The feature-manager endpoints are owner-gated; route-intercept them (fulfill 200) to isolate the CLIENT impls under test
// (mount render, userComplete dropdown, applyGrant grant-flip) — the owner AUTH is the server gate's job (r312/r318*), the
// server search/resolve logic is r318fm-server-gate. 3 of the 6 R31.8 impls. DET-3x. rb-feature-detail is defined by the
// /trace bundle; mount it directly with a Feature uuid (the standard tagMap selection path).
//   mount 965e810c        — feature info (name/icon) + grant input + dropdown RENDER (not stuck on Loading…).
//   userComplete 9b54bc91 — type → debounced /users?q= → dropdown populates [data-hit] ranked/masked hits.
//   applyGrant cfde8f48    — mousedown a hit → POST /api/feature-manager {action:'grant',feature,token} → fm-tree-refresh.
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, TARGET = '0.7.135', REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const FEATURE = '16604eee-d844-4efb-bd4d-881433ca82a6';
const fmBundle = fs.readdirSync(`${REPO}/src/public/dist`).find(f => /^feature-manager-.*\.js$/.test(f)); // defines rb-feature-detail
// minimal shell that loads the feature-manager bundle (owner-gated page → intercepted) so rb-feature-detail is defined
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body><div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="fm-tree"></rb-trace-tree></div></div><script type="module" src="/dist/${fmBundle}"></script></body></html>`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r(b)); }); q.on('error', () => r('')); q.end(); });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const servedVersion = JSON.parse(await httpGet('/api/config') || '{}').version;
  if (servedVersion !== TARGET) { console.log(`ABORT (phantom-guard): served=${servedVersion} != ${TARGET}`); process.exitCode = 1; }
  else {
  console.log(`served version verified == ${TARGET}`);
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    const postBodies = [];
    // intercept the 3 owner-gated endpoints so the CLIENT impls run without the owner session
    await page.route('**/api/ior/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unit: { model: { name: 'Server Manager', icon: '🖥️', description: 'The server terminal feature' } } }) }));
    await page.route('**/api/feature-manager/users**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [{ token: 'tok-zephyr-aaaa', name: 'Zephyrqx', identifiers: ['tok-…aa'] }, { token: 'tok-zephyr-bbbb', name: 'Zephyrqxadmin', identifiers: ['tok-…bb'] }], truncated: false }) }));
    await page.route((u) => u.pathname === '/api/feature-manager', (route) => { if (route.request().method() === 'POST') { postBodies.push(route.request().postData() || ''); return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); } return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, roots: [] }) }); });
    await page.route((u) => u.pathname === '/feature-manager', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));

    await page.goto(`${BASE}/feature-manager`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-feature-detail'), { timeout: 20000 }).catch(() => {});
    // mount rb-feature-detail with the Feature uuid (standard selection path)
    await page.evaluate((f) => { const el = document.createElement('rb-feature-detail'); el.id = 'fm-gate'; el.setAttribute('uuid', f); document.body.appendChild(el); }, FEATURE);
    await sleep(1200);

    // (1) mount — feature info + grant input rendered, not stuck on Loading…
    const mount = await page.evaluate(() => { const el = document.getElementById('fm-gate'); const h3 = el?.querySelector('h3'); const inp = el?.querySelector('input'); const drop = inp?.nextElementSibling; return { h3: h3?.textContent || '', hasInput: !!inp, hasDrop: !!drop, loading: (el?.innerHTML || '').includes('Loading…') }; });
    const mountOk = /Server Manager/.test(mount.h3) && mount.hasInput && mount.hasDrop && !mount.loading;

    // (2) userComplete — type → debounced search → dropdown populates [data-hit]
    await page.evaluate(() => { const inp = document.getElementById('fm-gate').querySelector('input'); inp.value = 'zephyr'; inp.dispatchEvent(new Event('input', { bubbles: true })); });
    await sleep(700); // > 220ms debounce + fetch
    const uc = await page.evaluate(() => { const el = document.getElementById('fm-gate'); const hits = el.querySelectorAll('[data-hit]'); const drop = el.querySelector('input')?.nextElementSibling; return { count: hits.length, names: Array.from(hits).map(h => h.querySelector('b')?.textContent || ''), visible: drop ? getComputedStyle(drop).display !== 'none' : false }; });
    const userCompleteOk = uc.count === 2 && uc.visible && uc.names.includes('Zephyrqx') && uc.names.includes('Zephyrqxadmin');

    // (3) applyGrant — mousedown a hit → grant POST + fm-tree-refresh flip
    await page.evaluate(() => { window.__fmRefresh = false; document.addEventListener('fm-tree-refresh', () => { window.__fmRefresh = true; }, { once: true }); });
    await page.evaluate(() => { const hit = document.getElementById('fm-gate').querySelector('[data-hit="0"]'); hit.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); });
    await sleep(700);
    const refreshed = await page.evaluate(() => window.__fmRefresh === true);
    const post = postBodies.map(b => { try { return JSON.parse(b); } catch { return {}; } })[0] || {};
    const applyGrantOk = postBodies.length >= 1 && post.action === 'grant' && post.feature === FEATURE && post.token === 'tok-zephyr-aaaa' && refreshed;

    const pass = mountOk && userCompleteOk && applyGrantOk;
    results.push(pass);
    console.log(`iter ${i}: mount=${mountOk}(h3='${mount.h3.trim()}' inp=${mount.hasInput} drop=${mount.hasDrop} loading=${mount.loading}) | userComplete=${userCompleteOk}(hits=${uc.count} visible=${uc.visible} ${JSON.stringify(uc.names)}) | applyGrant=${applyGrantOk}(POSTs=${postBodies.length} action=${post.action} token=${post.token} refresh=${refreshed}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
  }
} finally { await browser.close(); }

console.log('\n===== R31.8 RbFeatureDetail client impls @390 (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: owner AUTH on the endpoints = server gate (r312/r318*); this isolates the CLIENT render/interaction. Tron device-visual = the live owner grant.');
process.exitCode = green ? 0 : 1;
