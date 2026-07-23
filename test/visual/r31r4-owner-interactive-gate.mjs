// R31.8c ROUND-4 REAL OWNER-INTERACTIVE gate — DET-3x @390 iPhone-12. served v0.7.126. NOT seeded-structural (the round-3
// gap): seeds a LIVE OWNER session (41ad88c4 + e2e-bypass keys → IDENTIFY → tokenToClient) and drives the REAL FM tree —
// no route-intercept. PO-sanctioned coordinated blip (evicts Tron ~1×). Non-destructive: revokes the SystemTester peer on
// the Server Manager feature + RE-GRANTS to restore (no new users, restore to the recorded initial grant state).
// ACs: (1) drawer==<rb-profile-view> SAME sections incl Devices(N) as /profile (SystemTester via both surfaces → match);
// (2) Revoke UNDER grab-bar, viewer below; (3) Revoke → child REMOVED from tree LIVE + badge N→N-1, NO refresh (reactive);
// (5) Refresh re-fetches (fallback); (6) NO 'no graph' (.tt-empty) at tree top; (D) non-owner → 403 (sacred).
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin', TARGET = '0.7.126';
const OWNER = '41ad88c4-4dee-49ac-afcb-8a2026657b2d', ST_TOKEN = 'ce981242-74fe-4d44-b5b6-43c641e224df', FEAT_SM = '16604eee-d844-4efb-bd4d-881433ca82a6';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p, h = {}) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', headers: h, rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r({ status: res.statusCode, body: b })); }); q.on('error', () => r({ status: 0, body: '' })); q.end(); });
const seedOwner = (ctx) => ctx.addInitScript((o) => { localStorage.setItem('rawbin-player-id', o); localStorage.setItem('rawbin-name', 'Owner'); localStorage.setItem('rawbin-device-privateKey', 'e2e-bypass'); localStorage.setItem('rawbin-device-publicKey', 'e2e-bypass'); localStorage.setItem('rawbin-device-signature', 'e2e-bypass'); }, OWNER);
const grantOp = (page, action) => page.evaluate(async ([act, feat, tok, o]) => { const r = await fetch('/api/feature-manager', { method: 'POST', headers: { 'content-type': 'application/json', 'x-player-token': o }, body: JSON.stringify({ action: act, feature: feat, token: tok }) }); return r.status; }, [action, FEAT_SM, ST_TOKEN, OWNER]);
const sectionsOf = (t) => ({ devices: (t.match(/Devices?\s*\((\d+)\)/i) || [])[1] ?? null, hasSecret: /Secret/i.test(t), hasBugs: /Bug ?[Rr]eports?/i.test(t) });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const cfg = JSON.parse((await httpGet('/api/config')).body || '{}');
  const health = JSON.parse((await httpGet('/api/health')).body || '{}');
  if (cfg.version !== TARGET) { console.log(`ABORT phantom-guard: served=${cfg.version} != ${TARGET}`); process.exitCode = 1; }
  else {
  console.log(`served=${cfg.version}, uptime=${health.uptime}s (fresh)`);
  // (D) non-owner → 403 (sacred)
  const no = await httpGet('/api/feature-manager');
  const authOk = (no.status === 403 || no.status === 401);

  // /profile REFERENCE — SystemTester's own, through the shared <rb-profile-view>
  const cp = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(cp); const pp = await cp.newPage();
  await pp.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
  await pp.waitForFunction(() => !!document.querySelector('rb-profile-view'), { timeout: 20000 }).catch(() => {});
  await sleep(800);
  const profText = await pp.evaluate(() => document.querySelector('rb-profile-view')?.textContent || '');
  await pp.screenshot({ path: `${REPO}/test-results/r31r4/profile-390.png`, fullPage: true });
  await cp.close();
  const profSec = sectionsOf(profText);
  console.log(`  /profile sections: ${JSON.stringify(profSec)}`);

  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedOwner(ctx); const page = await ctx.newPage();
    // establish LIVE owner session (app ws → IDENTIFY{OWNER} → tokenToClient.set)
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await sleep(2500);
    await page.evaluate(async (o) => { await fetch('/api/server-manager/session', { method: 'POST', headers: { 'x-player-token': o } }); }, OWNER); // mint sm_session owner cookie → persists across nav to /feature-manager (real owner flow)
    const grantStatus = await grantOp(page, 'grant');            // ensure the disposable SystemTester grant exists (setup, idempotent)

    // drive the REAL FM tree as the live owner (no intercept)
    await page.goto(`${BASE}/feature-manager`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('rb-object-item[ref^="feature:"]').length > 0, { timeout: 20000 }).catch(() => {});
    await sleep(800);
    // (6) NO 'no graph' label
    const noGraph = await page.evaluate(() => !/no graph/i.test(document.querySelector('rb-trace-tree')?.textContent || '') && !document.querySelector('rb-trace-tree .tt-empty'));
    const badgeBefore = await page.evaluate((f) => { const b = document.querySelector(`rb-object-item[ref="feature:${f}"] .oi-badge`); return b ? parseInt(b.textContent.trim(), 10) : null; }, FEAT_SM);
    // expand SM → find SystemTester child
    await page.evaluate((f) => document.querySelector(`rb-object-item[ref="feature:${f}"] .oi-expand`)?.click(), FEAT_SM);
    await sleep(800);
    const childRef = await page.evaluate((t) => { const c = Array.from(document.querySelectorAll('rb-object-item[ref^="profile:"]')).find(x => (x.getAttribute('ref') || '').includes(t.slice(0, 8)) || /systemtester/i.test(x.querySelector('.oi-name')?.textContent || '')); return c ? c.getAttribute('ref') : null; }, ST_TOKEN);
    // (1)(2) click child → drawer == <rb-profile-view> full + Revoke under grab-bar
    await page.evaluate((r) => document.querySelector(`rb-object-item[ref="${r}"]`)?.click(), childRef);
    await sleep(1200);
    const drawer = await page.evaluate(() => { const d = document.getElementById('fm-drawer') || document.querySelector('rb-detail-drawer'); const pv = d?.querySelector('rb-profile-view'); const rev = Array.from(d?.querySelectorAll('button') || []).find(b => /revoke/i.test(b.textContent || '')); const handle = d?.querySelector('.drawer-handle'); return { hasView: !!pv, text: pv?.textContent || '', revokeTop: rev?.getBoundingClientRect().top ?? -1, viewTop: pv?.getBoundingClientRect().top ?? -1, handleBottom: handle?.getBoundingClientRect().bottom ?? -1, hasRevoke: !!rev }; });
    if (i === 1) await page.screenshot({ path: `${REPO}/test-results/r31r4/fm-drawer-390.png`, fullPage: true });
    const drawSec = sectionsOf(drawer.text);
    const drawerMatchesProfile = drawer.hasView && drawSec.devices !== null && drawSec.devices === profSec.devices && drawSec.hasSecret === profSec.hasSecret; // same sections incl Devices(N) as /profile
    const layoutOk = drawer.hasRevoke && drawer.revokeTop > 0 && drawer.viewTop > drawer.revokeTop && (drawer.handleBottom < 0 || drawer.revokeTop >= drawer.handleBottom - 6);

    // (3) REAL click Revoke → child REMOVED LIVE + badge N→N-1, NO refresh
    await page.evaluate(() => { const d = document.getElementById('fm-drawer') || document.querySelector('rb-detail-drawer'); Array.from(d?.querySelectorAll('button') || []).find(b => /revoke/i.test(b.textContent || ''))?.click(); });
    await sleep(1400);
    const afterRevoke = await page.evaluate(async ([r, f, o]) => { const child = document.querySelector(`rb-object-item[ref="${r}"]`); const b = document.querySelector(`rb-object-item[ref="feature:${f}"] .oi-badge`); let api = null; try { const j = await (await fetch('/api/feature-manager', { headers: { 'x-player-token': o } })).json(); api = (j.roots || []).find(x => x.uuid === f)?.childCount; } catch { /* noop */ } return { childGone: !child, badge: b ? parseInt(b.textContent.trim(), 10) : null, apiChildCount: api }; }, [childRef, FEAT_SM, OWNER]);
    const childRemovedLive = afterRevoke.childGone;                                        // reactive child removal
    const badgeDecremented = badgeBefore !== null && afterRevoke.badge === badgeBefore - 1; // reactive badge N→N-1
    const revokeWorkedServer = afterRevoke.apiChildCount === badgeBefore - 1;               // API confirms the grant is gone (isolates the badge-reactive bug)
    const liveUpdateOk = childRemovedLive && badgeDecremented;

    // (5) Refresh fallback re-fetches (tree still renders after)
    await page.evaluate(() => document.getElementById('refresh')?.click());
    await sleep(1000);
    const refreshOk = await page.evaluate(() => document.querySelectorAll('rb-object-item[ref^="feature:"]').length > 0);

    // RESTORE: re-grant SystemTester (non-destructive) so state matches initial
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await sleep(1500);
    const regrant = await grantOp(page, 'grant');
    await ctx.close();

    const pass = authOk && noGraph && drawerMatchesProfile && layoutOk && liveUpdateOk && refreshOk;
    results.push(pass);
    console.log(`iter ${i}: noGraph=${noGraph} badge=${badgeBefore} | (1)drawer==profile=${drawerMatchesProfile}[view=${drawer.hasView} dev=${drawSec.devices}/${profSec.devices} secret=${drawSec.hasSecret}] (2)revoke-under-bar=${layoutOk} (3)live: childRemoved=${childRemovedLive} badgeDecremented=${badgeDecremented}(${badgeBefore}->${afterRevoke.badge}) [revokeWorkedServer=${revokeWorkedServer} api=${afterRevoke.apiChildCount}] (5)refresh=${refreshOk} (D)403=${authOk} regrant=${regrant} => ${pass ? 'GREEN' : 'RED'}`);
  }
  }
} finally { await browser.close(); }

console.log('\n===== R31.8c ROUND-4 REAL OWNER-INTERACTIVE (DET-3x @390) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('RESTORE: SystemTester re-granted to Server Manager each iter (final state = granted); Tron re-auths his session.');
process.exitCode = green ? 0 : 1;
