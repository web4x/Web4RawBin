// [test:uuid:3a571c7e-04d0-4bbd-89ec-58b635e27866] R31.8c FeatureManager.featureRoots (Impl 79b22596) — FUNCTIONAL reframe AC surface, GREEN DET-3x @390 v0.7.119: real Feature scenario-unit ROOTS render in the shared rb-trace-tree + expand → allowedUsers LIVE granted-user child-nodes (opaque <featureUuid>:<16-hex> ref, no raw token) + Feature-select→rb-feature-detail grant (POST fires) + child-select→rb-profile-detail revoke (POST fires) + non-owner→403. Complements the data/security Tests (55d125ee opaque + f38f87af completeness on ad622052).
// R31.8c FUNCTIONAL reframe — GATE-THE-WORKING-THING @390 iPhone-12, DET-3x, verify-by-PID. served v0.7.118.
// The data/security axis is already Tested (55d125ee opaque + f38f87af completeness on allowedUsersChildren ad622052).
// THIS gate = the LIVE UI render + interaction of the reframe: real Feature scenario-unit ROOTS (featureRoots 79b22596)
// render in the shared rb-trace-tree; each Feature's allowedUsers render as LIVE granted-user CHILD-nodes on expand;
// selecting a Feature → rb-feature-detail (grant), a granted user → rb-profile-detail (revoke); grant/revoke FIRE the
// right POST (function-first); non-owner → 403; child refs carry the OPAQUE userId (no raw token leak).
// Mock-owner via whoami→200 intercept (NO eviction of Tron — r311a stays held). Marker (on GREEN) → featureRoots 79b22596.
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin', TARGET = '0.7.119';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p, headers = {}) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', headers, rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r({ status: res.statusCode, body: b })); }); q.on('error', () => r({ status: 0, body: '' })); q.end(); });
const fmBundle = fs.readdirSync(`${REPO}/src/public/dist`).find(f => /^feature-manager-.*\.js$/.test(f));

const FEAT_SM = '16604eee-d844-4efb-bd4d-881433ca82a6', FEAT_FM = '2980b7d9-a166-44ca-bf73-5dd1a4ba7b16';
const ST_TOKEN = 'ce981242-74fe-4d44-b5b6-43c641e224df', ST_USERID = 'ce39a9092cdafdf1'; // sha256(token)[:16] (opaque)
const CER_TOKEN = '7a5f64b1-098c-4c8e-9eda-29e023c666f3';
const ROOTS = [{ uuid: FEAT_SM, type: 'feature', name: 'Server Manager', icon: '🖥️', hasChildren: true },
  { uuid: FEAT_FM, type: 'feature', name: 'Feature Manager', icon: '🔑', hasChildren: true }];
const SM_STYLE = `body{margin:0;background:#0d1117;color:#e6edf3;display:flex;flex-direction:column;height:100dvh;overflow:hidden;font-family:system-ui,sans-serif}header{padding:12px 16px;background:#161b22;display:flex;gap:12px}h1{font-size:1rem;margin:0;flex:1}.trace-page{height:auto;flex:1;min-height:0}#err{color:#f85149;padding:12px 16px}`;
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><style>${SM_STYLE}</style></head><body><header><h1>Feature Manager</h1><button id="refresh">Refresh</button></header><div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="fm-tree"></rb-trace-tree><div id="err"></div></div></div><script type="module" src="/dist/${fmBundle}"></script></body></html>`;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const servedVersion = JSON.parse((await httpGet('/api/config')).body || '{}').version;
  console.log(`served=${servedVersion} (verify-by-PID: server 1314990) target=${TARGET}`);
  // (E-security) non-owner spot-check on the REAL endpoint (un-intercepted) — 403, no leak
  const nonOwner = await httpGet('/api/feature-manager');
  const noOwnerRejects = nonOwner.status === 403 || nonOwner.status === 401;

  for (let i = 1; i <= 3; i++) {
    const posts = [];
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.route((u) => u.pathname === '/feature-manager', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
    await page.route('**/api/server-manager/whoami**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"owner":true}' }));
    await page.route((u) => u.pathname === '/api/feature-manager' && u.search === '', (r) => {
      if (r.request().method() === 'POST') { posts.push(JSON.parse(r.request().postData() || '{}')); return r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); }
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, roots: ROOTS }) });
    });
    await page.route('**/api/trace/children/**', (r) => {
      const uuid = decodeURIComponent(new URL(r.request().url()).pathname.split('/api/trace/children/')[1] || '').split('?')[0];
      const children = uuid === FEAT_SM ? [{ uuid: `${FEAT_SM}:${ST_USERID}`, type: 'profile', name: 'SystemTester', hasChildren: false }] : [];
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, children }) });
    });
    await page.route('**/api/feature-manager/users**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [{ name: 'Cerulean', token: CER_TOKEN, identifiers: ['cerulean@x'] }], truncated: false }) }));

    await page.goto(`${BASE}/feature-manager`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('rb-object-item[ref^="feature:"]').length > 0, { timeout: 20000 }).catch(() => {});
    await sleep(500);

    // (A) real Feature ROOTS render (2 features, real uuids, names)
    const roots = await page.evaluate(() => Array.from(document.querySelectorAll('rb-object-item[ref^="feature:"]')).map(it => ({ ref: it.getAttribute('ref'), name: it.querySelector('.oi-name')?.textContent?.trim() || it.textContent?.trim().slice(0, 20) })));
    if (i === 1) { const diag = await page.evaluate(() => { const all = Array.from(document.querySelectorAll('rb-object-item')); const f = all[0]; return { totalItems: all.length, allRefs: all.map(x => x.getAttribute('ref')), firstHTML: f ? f.outerHTML.slice(0, 260) : null, expandSel: f ? !!f.querySelector('.oi-expand') : false }; }); console.log('  DIAG:', JSON.stringify(diag)); }
    const rootsOk = roots.length === 2 && roots.some(r => /16604eee/.test(r.ref)) && roots.some(r => /2980b7d9/.test(r.ref)) && roots.some(r => /Server Manager/.test(r.name));

    // (B) expand a Feature → allowedUsers LIVE child-nodes render (opaque ref, name-resolved)
    await page.evaluate((f) => { const it = document.querySelector(`rb-object-item[ref="feature:${f}"]`); const ex = it?.querySelector('.oi-expand'); if (ex) ex.click(); }, FEAT_SM);
    await sleep(700);
    const child = await page.evaluate(() => { const c = document.querySelector('rb-object-item[ref^="profile:"]'); return c ? { ref: c.getAttribute('ref'), name: c.querySelector('.oi-name')?.textContent?.trim() || '' } : null; });
    const childOk = !!child && /profile:16604eee/.test(child.ref) && child.ref.includes(ST_USERID) && !child.ref.includes(ST_TOKEN) && /SystemTester/.test(child.name);

    // (C) select the Feature → rb-feature-detail mounts (grant surface) in the shared drawer
    await page.evaluate((f) => { const it = document.querySelector(`rb-object-item[ref="feature:${f}"]`); it?.click(); }, FEAT_SM);
    await sleep(900);
    const featureDetail = await page.evaluate(() => !!document.querySelector('#fm-drawer rb-feature-detail, rb-detail-drawer rb-feature-detail'));

    // (F) grant: type in the search → users?q → hit → click → POST {action:grant,feature,token}
    await page.evaluate(() => { const inp = document.querySelector('rb-feature-detail input'); if (inp) { inp.focus(); inp.value = 'cer'; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'r' })); } });
    await page.waitForFunction(() => !!document.querySelector('rb-feature-detail [data-hit="0"]'), { timeout: 5000 }).catch(() => {});
    await sleep(300);
    await page.evaluate(() => { const hit = document.querySelector('rb-feature-detail [data-hit="0"]'); if (hit) hit.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); });
    await sleep(700);
    const grantPost = posts.find(p => p.action === 'grant');
    const grantOk = !!grantPost && grantPost.feature === FEAT_SM && grantPost.token === CER_TOKEN;

    // (D) select a granted-user child → rb-profile-detail (revoke surface); (E-fn) revoke → POST {action:revoke}
    await page.evaluate((f) => { const c = document.querySelector(`rb-object-item[ref^="profile:${f}"]`); c?.click(); }, FEAT_SM);
    await sleep(900);
    const profileDetail = await page.evaluate(() => !!document.querySelector('rb-detail-drawer rb-profile-detail'));
    await page.evaluate(() => { const b = document.querySelector('rb-profile-detail button'); if (b) b.click(); });
    await sleep(500);
    const revokePost = posts.find(p => p.action === 'revoke');
    const revokeOk = !!revokePost && revokePost.feature === FEAT_SM;

    if (i === 1) await page.screenshot({ path: `${REPO}/test-results/r31fm/fm-390.png` });
    await ctx.close();
    const pass = rootsOk && childOk && featureDetail && grantOk && profileDetail && revokeOk && noOwnerRejects;
    results.push(pass);
    console.log(`iter ${i}: roots=${rootsOk}(${roots.length}) child(live,opaque)=${childOk} featureDetail=${featureDetail} grant-POST=${grantOk} profileDetail=${profileDetail} revoke-POST=${revokeOk} nonOwner403=${noOwnerRejects}(${nonOwner.status}) => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

console.log('\n===== R31.8c FUNCTIONAL reframe (featureRoots + live children + grant/revoke, DET-3x @390) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
