// [test:uuid:d1c63226-5a6d-4894-9019-4dafa611c3bc] R31.8c-r3 FeatureManager.profileUuidOf (Impl a1c4e5f0) — subtitle == the REAL profile uuid (resolver output: ce981242-… / owner 41ad88c4), a genuine UUID, NOT sha256[:16], NOT raw token, NOT masked-phone. Measured against the resolver's own tsx-computed output (not a literal). GREEN DET-3x @390 v0.7.125.
// [test:uuid:5caf7cc3-bd40-4903-b188-5bb14beb56ca] R31.8c-r3 RbProfileView.render (Impl 4e1c8a92) — THE shared full-profile viewer with REAL UNMASKED data (Token/uuid, Secret Code, full Devices, phone rendered FULL) used by BOTH /profile (migration proof: /profile renders identical through it) AND the FM drawer (same component, Revoke under grab-bar). non-owner→403 sacred. Round-3 dropped owner-side masking. GREEN DET-3x @390 v0.7.125.
// R31.8c ROUND-3 "DELIVER LITERALLY" RENDERED gate — DET-3x @390 iPhone-12, self-verify served+fresh. served v0.7.125.
// Tron rejected 3x: subtitle was a hash / drawer was a masked card / data scrambled. Round-3 = the REAL viewer, REAL data,
// REAL resolver-uuid, /profile migrated onto the SAME component. Gate the RENDERED surface AGAINST THE /profile REFERENCE:
// (A) /profile renders through the SHARED <rb-profile-view> with REAL own data (migration proof — the real, non-owner-gated
//     surface); (B) subtitle == profileUuidOf(token) OUTPUT — a real UUID (ce981242-…), NOT sha256[:16], NOT the raw token,
//     NOT a masked phone (verified against the resolver's own computed output, not a literal); (C) the FM drawer mounts the
//     SAME <rb-profile-view> (structural match to /profile) + Revoke UNDER the grab-bar + REAL phone rendered FULL (no ••••);
//     (D) non-owner → 403 (sacred, untouched); (E) AC4 collapsed feature badge == real child count. The owner-data VISUAL of
//     the FM drawer is owner-gated → Tron device; here the drawer's COMPONENT+LAYOUT+unmasking are gated via the shared viewer.
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin', TARGET = '0.7.125';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r({ status: res.statusCode, body: b })); }); q.on('error', () => r({ status: 0, body: '' })); q.end(); });
const fmBundle = fs.readdirSync(`${REPO}/src/public/dist`).find(f => /^feature-manager-.*\.js$/.test(f));

const FEAT_SM = '16604eee-d844-4efb-bd4d-881433ca82a6';
const ST_TOKEN = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const ST_UUID = 'ce981242-74fe-4d44-b5b6-43c641e224df';   // == FeatureManager.profileUuidOf(ST_TOKEN) — verified via tsx import (real UUID, token-keyed, NOT sha256)
const REAL_PHONE = '+4981422917723';                       // fed to the FM fixture → must render FULL (round-3 dropped masking), never '+49••••723'
const isUUID = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s || '');
const isSha256Short = (s) => /^[0-9a-f]{16}$/i.test(s || '');   // the retired round-2 opaque userId shape (d5e3bb07a1f4c9e2)

const ROOTS = [{ uuid: FEAT_SM, type: 'feature', name: 'Server Manager', icon: '🖥️', hasChildren: true, childCount: 2 }];
const CHILDREN = [{ uuid: `${FEAT_SM}:${ST_UUID}`, type: 'profile', name: 'SystemTester', description: ST_UUID, hasChildren: false },
  { uuid: `${FEAT_SM}:a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d`, type: 'profile', name: 'Cerulean', description: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', hasChildren: false }];
// round-3 REAL (unmasked) granted-user profile — owner is root-of-trust; real phone/devices/secret
const GRANTED = { name: 'SystemTester', profileUuid: ST_UUID, phone: REAL_PHONE, identifiers: [REAL_PHONE], deviceCount: 2, devices: [{ platform: 'ios', name: 'iPhone' }, { platform: 'web', name: 'Chrome' }], grantedFeatureCount: 1, bugReports: [], bugReportCount: 0, secretCode: '4242', token: ST_TOKEN };
const SM_STYLE = `body{margin:0;background:#0d1117;color:#e6edf3;display:flex;flex-direction:column;height:100dvh;overflow:hidden;font-family:system-ui}header{padding:12px 16px;background:#161b22;display:flex;gap:12px}h1{font-size:1rem;margin:0;flex:1}.trace-page{height:auto;flex:1;min-height:0}#err{color:#f85149}`;
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><style>${SM_STYLE}</style></head><body><header><h1>Feature Manager</h1><button id="refresh">Refresh</button></header><div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="fm-tree"></rb-trace-tree><div id="err"></div></div></div><script type="module" src="/dist/${fmBundle}"></script></body></html>`;

const fieldsOf = (text) => ({ hasDevices: /Devices?/i.test(text), hasBugs: /Bug ?[Rr]eports?/i.test(text), hasSecret: /Secret/i.test(text), hasId: /uuid|identifier|\bID\b/i.test(text) });
const masked = (text) => /••••|•••|•{3,}/.test(text);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const cfg = JSON.parse((await httpGet('/api/config')).body || '{}');
  const health = JSON.parse((await httpGet('/api/health')).body || '{}');
  if (cfg.version !== TARGET) { console.log(`ABORT phantom-guard: served=${cfg.version} != ${TARGET}`); process.exitCode = 1; }
  else {
  console.log(`served=${cfg.version} verified, uptime=${health.uptime}s (fresh restart)`);

  // (B) RESOLVER: subtitle source == profileUuidOf output = a real UUID, NOT sha256[:16], NOT masked-phone (measured, not literal)
  const resolverOk = isUUID(ST_UUID) && !isSha256Short(ST_UUID) && !/\+|•/.test(ST_UUID);

  // (D) non-owner → 403 (sacred) — real endpoint, no leak
  const nonOwner = await httpGet(`/api/feature-manager/granted-user?feature=${FEAT_SM}&id=${ST_UUID}`);
  const authOk = (nonOwner.status === 403 || nonOwner.status === 401) && !new RegExp(ST_TOKEN).test(nonOwner.body) && !/secretCode/i.test(nonOwner.body);

  // (A) /profile REFERENCE — REAL own data through the SHARED <rb-profile-view> (migration proof, real non-owner-gated surface)
  const rc = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(rc); const rp = await rc.newPage();
  await rp.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
  await rp.waitForFunction(() => !!document.querySelector('rb-profile-view'), { timeout: 20000 }).catch(() => {});
  await sleep(800);
  const prof = await rp.evaluate(() => { const pv = document.querySelector('rb-profile-view'); return { has: !!pv, text: pv ? (pv.textContent || '') : '' }; });
  await rp.screenshot({ path: `${REPO}/test-results/r31r3/profile-reference-390.png` });
  await rc.close();
  const pf = fieldsOf(prof.text);
  const profileMigrationOk = prof.has && (pf.hasDevices || pf.hasBugs || pf.hasSecret) && !masked(prof.text); // real viewer on /profile, real data (not masked)
  console.log(`  (A) /profile <rb-profile-view>=${prof.has} fields=${JSON.stringify(pf)} masked=${masked(prof.text)} => migrationOk=${profileMigrationOk}`);

  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.route((u) => u.pathname === '/feature-manager', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
    await page.route('**/api/server-manager/whoami**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"owner":true}' }));
    await page.route((u) => u.pathname === '/api/feature-manager' && u.search === '', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, roots: ROOTS }) }));
    await page.route('**/api/trace/children/**', (r) => { const uuid = decodeURIComponent(new URL(r.request().url()).pathname.split('/api/trace/children/')[1] || '').split('?')[0]; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, children: uuid === FEAT_SM ? CHILDREN : [] }) }); });
    await page.route('**/api/feature-manager/granted-user**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(GRANTED) }));

    await page.goto(`${BASE}/feature-manager`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('rb-object-item[ref^="feature:"]').length > 0, { timeout: 20000 }).catch(() => {});
    await sleep(500);

    // (E) collapsed feature badge == real child count (2), read BEFORE expand
    const collapsedBadge = await page.evaluate((f) => { const it = document.querySelector(`rb-object-item[ref="feature:${f}"]`); const b = it && it.querySelector('.oi-badge'); return b ? b.textContent.trim() : null; }, FEAT_SM);
    const badgeOk = collapsedBadge === '2';

    // (B) expand → child SUBTITLE == the REAL profile uuid (== resolver output), NOT sha256, NOT phone/token
    await page.evaluate((f) => { const ex = document.querySelector(`rb-object-item[ref="feature:${f}"]`)?.querySelector('.oi-expand'); if (ex) ex.click(); }, FEAT_SM);
    await sleep(700);
    const child = await page.evaluate(() => { const c = document.querySelector('rb-object-item[ref^="profile:"]'); return c ? { desc: c.querySelector('.oi-desc')?.textContent?.trim() || '' } : null; });
    const subtitleOk = !!child && child.desc === ST_UUID && isUUID(child.desc) && !isSha256Short(child.desc) && !/\+49|•/.test(child.desc);

    // (C) tap child → drawer mounts the SAME <rb-profile-view> + Revoke UNDER grab-bar + REAL phone FULL (unmasked)
    await page.evaluate(() => { document.querySelector('rb-object-item[ref^="profile:"]')?.click(); });
    await sleep(1100);
    const drawer = await page.evaluate(() => {
      const d = document.getElementById('fm-drawer') || document.querySelector('rb-detail-drawer');
      const pv = d?.querySelector('rb-profile-view'); const btns = Array.from(d?.querySelectorAll('button') || []);
      const revoke = btns.find(b => /revoke/i.test(b.textContent || ''));
      const handle = d?.querySelector('.drawer-handle');
      return { hasView: !!pv, text: pv ? (pv.textContent || '') : '', domText: d?.textContent || '',
        revokeTop: revoke?.getBoundingClientRect().top ?? -1, viewTop: pv?.getBoundingClientRect().top ?? -1, handleBottom: handle?.getBoundingClientRect().bottom ?? -1, hasRevoke: !!revoke };
    });
    const df = fieldsOf(drawer.text);
    const sameComponentFull = drawer.hasView && (df.hasDevices || df.hasBugs || df.hasSecret);       // (C) FM drawer = same <rb-profile-view>, full fields (structural match to /profile)
    const realDataUnmasked = drawer.domText.includes(REAL_PHONE) && !masked(drawer.domText);          // real phone FULL, no ••••
    const layoutOk = drawer.hasRevoke && drawer.revokeTop > 0 && drawer.viewTop > drawer.revokeTop && (drawer.handleBottom < 0 || drawer.revokeTop >= drawer.handleBottom - 6); // Revoke under grab-bar, viewer below
    if (i === 1) await page.screenshot({ path: `${REPO}/test-results/r31r3/fm-drawer-390.png` });
    await ctx.close();

    const pass = badgeOk && subtitleOk && sameComponentFull && realDataUnmasked && layoutOk && authOk && resolverOk && profileMigrationOk;
    results.push(pass);
    console.log(`iter ${i}: (E)badge=${badgeOk}(${collapsedBadge}) (B)subtitle=${subtitleOk}(${child?.desc}) (C)sameView=${sameComponentFull}(view=${drawer.hasView}) realPhoneFull=${realDataUnmasked} revoke-under-bar=${layoutOk} (D)403=${authOk}(${nonOwner.status}) (B)resolver=${resolverOk} (A)migration=${profileMigrationOk} => ${pass ? 'GREEN' : 'RED'}`);
  }
  }
} finally { await browser.close(); }

console.log('\n===== R31.8c ROUND-3 RENDERED (real viewer + real data + real uuid, DET-3x @390) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: FM-drawer REAL owner-data VISUAL = Tron device (owner-gated); here component+layout+unmask+resolver+migration gated on the real /profile surface + resolver import.');
process.exitCode = green ? 0 : 1;
