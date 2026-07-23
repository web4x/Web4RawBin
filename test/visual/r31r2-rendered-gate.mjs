// R31.8c ROUND-2 RENDERED-surface gate (Tron IMG_4616) — DET-3x @390 iPhone-12, verify-by-PID. served v0.7.123 pid 3371161.
// Gate the RENDERED DOM (round-1 stubbed the surface): (1) drawer detail = FULL <rb-profile-view> (masked fields), NOT a
// name+phone stub; (2) Revoke button directly UNDER the grab-bar, viewer BELOW it; (3) granted-user child SUBTITLE ==
// OPAQUE userId sha256[:16] (d5e3…), NOT masked-phone / NOT raw token; (4) COLLAPSED feature badge = real granted-user
// count (not 0); (5) revoke → auto-refresh tree (fm-tree-refresh). INV-F7: NO token / NO secretCode in any render/payload.
// Chain: RbProfileView.render 4e1c8a92 + allowedUsersChildren ad622052 (description=uid) + RbProfileDetail.mount 3f61d7d8
// + featureRoots childCount. Mock-owner (whoami→200, no eviction); real (non-intercepted) endpoint probe for INV-F7 auth.
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin', TARGET = '0.7.123';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r({ status: res.statusCode, body: b })); }); q.on('error', () => r({ status: 0, body: '' })); q.end(); });
const fmBundle = fs.readdirSync(`${REPO}/src/public/dist`).find(f => /^feature-manager-.*\.js$/.test(f));

const FEAT_SM = '16604eee-d844-4efb-bd4d-881433ca82a6', FEAT_FM = '2980b7d9-a166-44ca-bf73-5dd1a4ba7b16';
const UID1 = 'd5e3bb07a1f4c9e2', UID2 = 'a1b2c3d4e5f6a7b8', RAW_TOKEN = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const ROOTS = [{ uuid: FEAT_SM, type: 'feature', name: 'Server Manager', icon: '🖥️', hasChildren: true, childCount: 2 },
  { uuid: FEAT_FM, type: 'feature', name: 'Feature Manager', icon: '🔑', hasChildren: true, childCount: 1 }];
const CHILDREN = [{ uuid: `${FEAT_SM}:${UID1}`, type: 'profile', name: 'SystemTester', description: UID1, hasChildren: false },
  { uuid: `${FEAT_SM}:${UID2}`, type: 'profile', name: 'Cerulean', description: UID2, hasChildren: false }];
// masked grantedUserProfile (INV-F7: NO token, NO secretCode, opaque avatar only)
const GRANTED = { name: 'SystemTester', identifiers: ['+49•••••723'], deviceCount: 2, devices: [{ platform: 'ios' }, { platform: 'web' }], grantedFeatureCount: 1, bugReportCount: 0 };
const SM_STYLE = `body{margin:0;background:#0d1117;color:#e6edf3;display:flex;flex-direction:column;height:100dvh;overflow:hidden;font-family:system-ui}header{padding:12px 16px;background:#161b22;display:flex;gap:12px}h1{font-size:1rem;margin:0;flex:1}.trace-page{height:auto;flex:1;min-height:0}#err{color:#f85149}`;
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><style>${SM_STYLE}</style></head><body><header><h1>Feature Manager</h1><button id="refresh">Refresh</button></header><div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="fm-tree"></rb-trace-tree><div id="err"></div></div></div><script type="module" src="/dist/${fmBundle}"></script></body></html>`;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const sv = JSON.parse((await httpGet('/api/config')).body || '{}').version;
  if (sv !== TARGET) { console.log(`ABORT phantom-guard: served=${sv} != ${TARGET}`); process.exitCode = 1; }
  else {
  console.log(`served=${sv} verified (pid 3371161 fresh)`);
  const nonOwner = await httpGet(`/api/feature-manager/granted-user?feature=${FEAT_SM}&id=${UID1}`); // INV-F7 auth: real endpoint, non-owner → 403 no-leak
  const authOk = (nonOwner.status === 403 || nonOwner.status === 401) && !/ce981242|secretCode/i.test(nonOwner.body);

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
    await page.route('**/api/trace/children/**', (r) => { const uuid = decodeURIComponent(new URL(r.request().url()).pathname.split('/api/trace/children/')[1] || '').split('?')[0]; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, children: uuid === FEAT_SM ? CHILDREN : [] }) }); });
    await page.route('**/api/feature-manager/granted-user**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(GRANTED) }));

    await page.goto(`${BASE}/feature-manager`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('rb-object-item[ref^="feature:"]').length > 0, { timeout: 20000 }).catch(() => {});
    await sleep(500);

    // (4) COLLAPSED feature badge = real childCount (2), NOT 0 — read BEFORE expand
    const collapsedBadge = await page.evaluate((f) => { const it = document.querySelector(`rb-object-item[ref="feature:${f}"]`); const b = it && it.querySelector('.oi-badge'); return b ? b.textContent.trim() : null; }, FEAT_SM);
    const badgeOk = collapsedBadge === '2';

    // expand → (3) child SUBTITLE = opaque uid (not phone/token)
    await page.evaluate((f) => { const ex = document.querySelector(`rb-object-item[ref="feature:${f}"]`)?.querySelector('.oi-expand'); if (ex) ex.click(); }, FEAT_SM);
    await sleep(700);
    const child = await page.evaluate(() => { const c = document.querySelector('rb-object-item[ref^="profile:"]'); return c ? { ref: c.getAttribute('ref'), name: c.querySelector('.oi-name')?.textContent?.trim() || '', desc: c.querySelector('.oi-desc')?.textContent?.trim() || '' } : null; });
    const subtitleOk = !!child && child.desc === UID1 && !/\+49|723/.test(child.desc) && !child.desc.includes(RAW_TOKEN);

    // tap child → drawer mounts rb-profile-detail → rb-profile-view; (1) FULL viewer, (2) Revoke UNDER grab-bar, viewer BELOW
    await page.evaluate(() => { document.querySelector('rb-object-item[ref^="profile:"]')?.click(); });
    await sleep(1100);
    const drawer = await page.evaluate(() => {
      const d = document.getElementById('fm-drawer') || document.querySelector('rb-detail-drawer');
      const pv = d?.querySelector('rb-profile-view'); const btns = Array.from(d?.querySelectorAll('button') || []);
      const revoke = btns.find(b => /revoke/i.test(b.textContent || ''));
      const handle = d?.querySelector('.drawer-handle');
      const rowsText = pv ? (pv.textContent || '') : '';
      const rects = { revoke: revoke?.getBoundingClientRect().top ?? -1, view: pv?.getBoundingClientRect().top ?? -1, handle: handle?.getBoundingClientRect().bottom ?? -1 };
      return { hasView: !!pv, fullProfile: /Identifiers/.test(rowsText) && /Devices/.test(rowsText) && (/Feature grants/.test(rowsText) || /Bug reports/.test(rowsText)), hasRevoke: !!revoke, rects, domText: (d?.textContent || '') };
    });
    const fullProfileOk = drawer.hasView && drawer.fullProfile;                               // (1) full rb-profile-view, not stub
    const layoutOk = drawer.hasRevoke && drawer.rects.revoke > 0 && drawer.rects.view > drawer.rects.revoke && (drawer.rects.handle < 0 || drawer.rects.revoke >= drawer.rects.handle - 4); // (2) revoke under grab-bar, viewer below
    const invF7Ok = authOk && !new RegExp(RAW_TOKEN).test(drawer.domText) && !/secretCode|secret code/i.test(drawer.domText); // INV-F7: no raw token / secret in the rendered drawer

    // (5) revoke → POST + fm-tree-refresh auto-updates the tree
    let refreshed = false;
    await page.evaluate(() => { document.addEventListener('fm-tree-refresh', () => { window.__fmRefresh = true; }); });
    await page.evaluate(() => { const d = document.getElementById('fm-drawer') || document.querySelector('rb-detail-drawer'); const b = Array.from(d?.querySelectorAll('button') || []).find(x => /revoke/i.test(x.textContent || '')); if (b) b.click(); });
    await sleep(700);
    refreshed = await page.evaluate(() => !!window.__fmRefresh);
    const revokePost = posts.find(p => p.action === 'revoke');
    const autoUpdateOk = !!revokePost && revokePost.feature === FEAT_SM && refreshed;

    if (i === 1) await page.screenshot({ path: `${REPO}/test-results/r31r2/rendered-390.png` });
    await ctx.close();
    const pass = badgeOk && subtitleOk && fullProfileOk && layoutOk && invF7Ok && autoUpdateOk;
    results.push(pass);
    console.log(`iter ${i}: (4)badge=${badgeOk}(${collapsedBadge}) (3)subtitle=${subtitleOk}(${child?.desc}) (1)fullView=${fullProfileOk}(view=${drawer.hasView}) (2)revoke-under-bar=${layoutOk}(rev=${drawer.rects.revoke|0}<view=${drawer.rects.view|0}) INV-F7=${invF7Ok}(auth${nonOwner.status}) (5)autoUpdate=${autoUpdateOk}(post=${!!revokePost} refresh=${refreshed}) => ${pass ? 'GREEN' : 'RED'}`);
  }
  }
} finally { await browser.close(); }

console.log('\n===== R31.8c ROUND-2 RENDERED surface (DET-3x @390) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
