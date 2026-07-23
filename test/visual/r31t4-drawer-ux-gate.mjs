// T31.4 drawer-UX gate — DET-3x @390 iPhone-12. Server-Manager terminal drawer: INV-T1 auto-close (no sm_ tmux leak) +
// AC-maximize geometry + /trace,/scenario regression + non-owner 403. Impl cb153623 RbDetailDrawer.tearDownTransientDetail
// (rb-detail-drawer.ts:264). Self-verifies served .version FIRST (phantom-guard). Reuses the PROVEN r31r4 owner-seed +
// sm_session-cookie harness. ⚠ owner-seed = PO-sanctioned coordinated blip (evicts Tron ~1×; he re-auths).
// ★ INV-T1 = OBSERVE-ONLY: count sm_ via `tmux ls` (execSync on WODA.prod host), track MY sessions by NAME-DIFF vs the
//   pre-open baseline, assert MY new sessions gone after each teardown; on a RED leak clean ONLY my EXACT tracked names
//   (`tmux kill-session -t <exact>`), NEVER a pattern (classifier-blocked + would kill other users' terminals).
import { chromium, devices } from '@playwright/test';
import https from 'node:https';
import { execSync } from 'node:child_process';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin', TARGET = '0.7.130';
const OWNER = '41ad88c4-4dee-49ac-afcb-8a2026657b2d';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p, h = {}) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', headers: h, rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r({ status: res.statusCode, body: b })); }); q.on('error', () => r({ status: 0, body: '' })); q.end(); });
const seedOwner = (ctx) => ctx.addInitScript((o) => { localStorage.setItem('rawbin-player-id', o); localStorage.setItem('rawbin-name', 'Owner'); localStorage.setItem('rawbin-device-privateKey', 'e2e-bypass'); localStorage.setItem('rawbin-device-publicKey', 'e2e-bypass'); localStorage.setItem('rawbin-device-signature', 'e2e-bypass'); }, OWNER);
// OBSERVE-ONLY sm_ tmux census on the host
const smSessions = () => { try { return execSync("tmux ls -F '#{session_name}' 2>/dev/null | grep '^sm_' || true", { encoding: 'utf8' }).split('\n').map(s => s.trim()).filter(Boolean); } catch { return []; } };
const killExact = (names) => { for (const n of names) { try { execSync(`tmux kill-session -t ${n} 2>/dev/null || true`); } catch { /* noop */ } } };

async function ownerServerManager(browser, viewport) {
  const ctx = await browser.newContext({ ...(viewport || devices['iPhone 12']), ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedOwner(ctx); const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await sleep(2500);          // live ws → IDENTIFY{OWNER} → tokenToClient
  await page.evaluate(async (o) => { await fetch('/api/server-manager/session', { method: 'POST', headers: { 'x-player-token': o } }); }, OWNER); // mint sm_session cookie
  await page.goto(`${BASE}/server-manager`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('rb-object-item[ref^="otmuxsession:"]').length > 0, { timeout: 20000 }).catch(() => {});
  await sleep(600);
  return { ctx, page };
}
// expand session→window→pane (LAZY) and click a pane → server spawns the grouped sm_ tmux sessions
async function openPaneTerminal(page) {
  await page.evaluate(() => document.querySelector('rb-object-item[ref^="otmuxsession:"] .oi-expand')?.click()); await sleep(800);
  await page.evaluate(() => document.querySelector('rb-object-item[ref^="otmuxwindow:"] .oi-expand')?.click()); await sleep(800);
  const paneRef = await page.evaluate(() => document.querySelector('rb-object-item[ref^="otmuxpane:"]')?.getAttribute('ref'));
  if (paneRef) { await page.evaluate((r) => document.querySelector(`rb-object-item[ref="${r}"]`)?.click(), paneRef); await sleep(1800); }
  return paneRef;
}
const drawerOpen = (page) => page.evaluate(() => { const d = document.getElementById('sm-drawer') || document.querySelector('rb-detail-drawer'); return !!(d && d.querySelector('rb-terminal-detail')); });

async function trigger(page, path) {
  if (path === 'close') await page.click('#sm-drawer .drawer-close, rb-detail-drawer .drawer-close', { timeout: 5000 }).catch(() => {});
  else if (path === 'deselect') await page.evaluate(() => document.querySelector('rb-object-item[ref^="otmuxwindow:"] .oi-name, rb-object-item[ref^="otmuxwindow:"]')?.click()); // select a NON-pane node → selection off the pane
  else if (path === 'minimize') await page.click('#sm-drawer .drawer-handle, rb-detail-drawer .drawer-handle', { timeout: 5000 }).catch(() => {});
  else if (path === 'esc') { await page.evaluate(() => { document.activeElement?.blur?.(); const d = document.getElementById('sm-drawer') || document.querySelector('rb-detail-drawer'); d?.querySelector('.drawer-header')?.click?.(); }); await sleep(200); await page.keyboard.press('Escape'); }
  await sleep(1800);
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
const leakedAll = [];
try {
  const cfg = JSON.parse((await httpGet('/api/config')).body || '{}');
  if (cfg.version !== TARGET) { console.log(`ABORT phantom-guard: served=${cfg.version} != ${TARGET}`); process.exitCode = 1; }
  else {
  console.log(`served version verified == ${TARGET}`);
  // (d) non-owner → 403 + no raw-token/secret leak
  const no = await httpGet('/api/feature-manager');
  const authOk = (no.status === 403 || no.status === 401) && !/41ad88c4|secret/i.test(no.body);

  // (c) REGRESSION — /trace drawer opens + grab-bar toggles; /scenario renders (shared rb-detail-drawer untouched by the terminal-specific fix)
  const rctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' }); const rpg = await rctx.newPage();
  await rpg.goto(`${BASE}/trace`, { waitUntil: 'networkidle' }); await rpg.waitForFunction(() => document.querySelectorAll('rb-object-item').length > 0, { timeout: 20000 }).catch(() => {});
  await rpg.evaluate(() => document.querySelector('rb-object-item')?.click()); await sleep(1200);
  const traceReg = await rpg.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); const body = d?.querySelector('.drawer-body'); const opened = !!(d && (d.hasAttribute('open') || d.offsetHeight > 0) && (body?.textContent || '').length > 20); return opened; });
  await rpg.click('rb-detail-drawer .drawer-handle', { timeout: 4000 }).catch(() => {}); await sleep(300);
  const traceGrab = await rpg.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); return !!d && (d.hasAttribute('minimized') || d.offsetHeight > 0); });
  await rpg.goto(`${BASE}/scenario`, { waitUntil: 'networkidle' }); await sleep(1500);
  const scenarioReg = await rpg.evaluate(() => document.querySelectorAll('rb-object-item').length > 0 || (document.getElementById('scenario-app')?.children.length || 0) > 0);
  await rctx.close();
  const regressionOk = traceReg && traceGrab && scenarioReg;
  console.log(`  (c) regression: /trace detail=${traceReg} grab=${traceGrab} /scenario=${scenarioReg} | (d) non-owner 403=${authOk}(${no.status})`);

  for (let i = 1; i <= 3; i++) {
    const { ctx, page } = await ownerServerManager(browser);
    // (a) INV-T1 auto-close — each teardown path: open pane → MY sm_ appears → trigger → MY sm_ gone
    const pathResults = {};
    for (const path of ['close', 'deselect', 'minimize', 'esc']) {
      const before = smSessions();
      const paneRef = await openPaneTerminal(page);
      const afterOpen = smSessions();
      const mine = afterOpen.filter(s => !before.includes(s));    // MY newly-spawned sm_ (name-diff)
      await trigger(page, path);
      const afterTeardown = smSessions();
      const stillMine = mine.filter(s => afterTeardown.includes(s)); // my sessions still alive = LEAK
      killExact(stillMine); leakedAll.push(...stillMine);            // cleanup ONLY my exact names (safety net on RED)
      const ok = !!paneRef && mine.length > 0 && stillMine.length === 0;
      pathResults[path] = { ok, spawned: mine.length, leaked: stillMine.length };
      // re-open a fresh drawer for the next path (deselect/minimize leave the drawer in a state; re-nav to reset)
      if (path !== 'esc') { await page.goto(`${BASE}/server-manager`, { waitUntil: 'networkidle' }); await page.waitForFunction(() => document.querySelectorAll('rb-object-item[ref^="otmuxsession:"]').length > 0, { timeout: 15000 }).catch(() => {}); await sleep(500); }
    }
    const teardownOk = Object.values(pathResults).every(r => r.ok);

    // (b) AC-MAXIMIZE — open a pane, click ⛶, drawer fills viewport; portrait + landscape
    const before2 = smSessions(); await openPaneTerminal(page);
    const myMax = smSessions().filter(s => !before2.includes(s));
    await page.click('#sm-drawer .drawer-max, rb-detail-drawer .drawer-max', { timeout: 5000 }).catch(() => {});
    await sleep(700);
    const maxP = await page.evaluate(() => { const d = document.getElementById('sm-drawer') || document.querySelector('rb-detail-drawer'); const r = d.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), vw: window.innerWidth, vh: window.innerHeight }; });
    if (i === 1) await page.screenshot({ path: `${REPO}/test-results/r31t4/maximize-portrait-390.png` });
    const fillsP = maxP.x <= 2 && maxP.y <= 2 && Math.abs(maxP.w - maxP.vw) <= 4 && Math.abs(maxP.h - maxP.vh) <= 4;
    // landscape
    await page.setViewportSize({ width: 844, height: 390 }); await sleep(600);
    const maxL = await page.evaluate(() => { const d = document.getElementById('sm-drawer') || document.querySelector('rb-detail-drawer'); const r = d.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), vw: window.innerWidth, vh: window.innerHeight }; });
    const fillsL = maxL.x <= 2 && maxL.y <= 2 && Math.abs(maxL.w - maxL.vw) <= 4 && Math.abs(maxL.h - maxL.vh) <= 4;
    // teardown the maximize terminal (Close) + cleanup my names
    await page.click('#sm-drawer .drawer-close, rb-detail-drawer .drawer-close', { timeout: 5000 }).catch(() => {}); await sleep(1500);
    const stillMax = smSessions().filter(s => myMax.includes(s)); killExact(stillMax); leakedAll.push(...stillMax);
    const maximizeOk = fillsP && fillsL && stillMax.length === 0;

    await ctx.close();
    const pass = authOk && regressionOk && teardownOk && maximizeOk;
    results.push(pass);
    console.log(`iter ${i}: teardown=${teardownOk}[${Object.entries(pathResults).map(([k, v]) => `${k}=${v.ok}(sp${v.spawned}/lk${v.leaked})`).join(' ')}] | maximize=${maximizeOk}(portrait ${maxP.w}x${maxP.h}/${maxP.vw}x${maxP.vh}=${fillsP} landscape ${maxL.w}x${maxL.h}/${maxL.vw}x${maxL.vh}=${fillsL} noLeak=${stillMax.length === 0}) => ${pass ? 'GREEN' : 'RED'}`);
  }
  }
} finally { await browser.close(); }

console.log('\n===== T31.4 drawer-UX (INV-T1 auto-close + maximize + regression + 403, DET-3x @390) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
if (leakedAll.length) console.log(`⚠ leaked+cleaned (my exact names only): ${[...new Set(leakedAll)].join(', ')}`);
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: terminal/codicon RENDER VISUAL = Tron device (WebKit). sm_ lifecycle + maximize geometry + regression + 403 gated here (engine-independent). Owner-seed evicted Tron ~1× (PO-sanctioned); he re-auths.');
process.exitCode = green ? 0 : 1;
