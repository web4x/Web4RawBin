// PROBE: pin WHY 2 sm_ still spawn on v0.7.131. (a) which server-manager bundle does the served page reference
// (U45YYYE7 = fixed / SN3PT4WW = stale)? (b) how many <rb-terminal-detail> elements exist after one pane open
// (1 = single-element double-mount [fix should apply] / 2 = drawer double-render [element self-teardown can't help])?
import { chromium, devices } from '@playwright/test';
import https from 'node:https';
import { execSync } from 'node:child_process';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, OWNER = '41ad88c4-4dee-49ac-afcb-8a2026657b2d';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const sm = () => { try { return execSync("tmux ls -F '#{session_name}' 2>/dev/null | grep '^sm_' || true", { encoding: 'utf8' }).split('\n').map(s => s.trim()).filter(Boolean); } catch { return []; } };
const seedOwner = (ctx) => ctx.addInitScript((o) => { localStorage.setItem('rawbin-player-id', o); localStorage.setItem('rawbin-name', 'Owner'); localStorage.setItem('rawbin-device-privateKey', 'e2e-bypass'); localStorage.setItem('rawbin-device-publicKey', 'e2e-bypass'); localStorage.setItem('rawbin-device-signature', 'e2e-bypass'); }, OWNER);
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
try {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedOwner(ctx); const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' }); await sleep(2500);
  await page.evaluate(async (o) => { await fetch('/api/server-manager/session', { method: 'POST', headers: { 'x-player-token': o } }); }, OWNER);
  await page.goto(`${BASE}/server-manager`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('rb-object-item[ref^="otmuxsession:"]').length > 0, { timeout: 20000 }).catch(() => {});
  await sleep(600);
  const bundleSrc = await page.evaluate(() => Array.from(document.scripts).map(s => s.src).find(s => /server-manager-/.test(s)) || '(none)');
  const before = sm();
  await page.evaluate(() => document.querySelector('rb-object-item[ref^="otmuxsession:"] .oi-expand')?.click()); await sleep(800);
  await page.evaluate(() => document.querySelector('rb-object-item[ref^="otmuxwindow:"] .oi-expand')?.click()); await sleep(800);
  const paneRef = await page.evaluate(() => document.querySelector('rb-object-item[ref^="otmuxpane:"]')?.getAttribute('ref'));
  await page.evaluate((r) => document.querySelector(`rb-object-item[ref="${r}"]`)?.click(), paneRef); await sleep(2200);
  const dom = await page.evaluate(() => ({ termEls: document.querySelectorAll('rb-terminal-detail').length, drawerTermEls: (document.getElementById('sm-drawer') || document.querySelector('rb-detail-drawer'))?.querySelectorAll('rb-terminal-detail').length, drawers: document.querySelectorAll('rb-detail-drawer').length }));
  const mine = sm().filter(s => !before.includes(s));
  console.log(`served SM bundle = ${bundleSrc.split('/').pop()}`);
  console.log(`after ONE pane open (${paneRef}): <rb-terminal-detail> elements TOTAL=${dom.termEls} (in-drawer=${dom.drawerTermEls}) | <rb-detail-drawer> count=${dom.drawers} | sm_ spawned=${mine.length} [${mine.join(', ')}]`);
  console.log(dom.termEls >= 2 ? '→ DIAGNOSIS: 2 rb-terminal-detail ELEMENTS (drawer double-render) — element-level mount self-teardown CANNOT consolidate 2 separate elements' : (mine.length >= 2 ? '→ DIAGNOSIS: 1 element but 2 sm_ (2 ws from ONE element — mount ran 2× and self-teardown did NOT close the 1st, OR 2 drawers)' : '→ 1 element / 1 sm_'));
  // cleanup my exact names
  for (const s of sm().filter(x => mine.includes(x))) { try { execSync(`tmux kill-session -t ${s} 2>/dev/null || true`); } catch { /* */ } }
  await ctx.close();
} finally { await browser.close(); }
