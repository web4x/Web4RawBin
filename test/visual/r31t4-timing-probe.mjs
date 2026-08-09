// FOCUSED PROBE (not a gate): disambiguate the teardown "leak" — timing (grouped-session cleanup lag) vs REAL leak.
// Open ONE pane terminal, record MY sm_, click Close, then poll the tmux census every 1s for 14s. If MY sessions
// clear within a few seconds → timing (extend the gate's wait). If they persist → real INV-T1 leak (report the bug).
import { chromium, devices } from '@playwright/test';
import https from 'node:https';
import { execSync } from 'node:child_process';
import { OWNER_LITERAL } from './_owner-literal.mjs'; // no-secrets: owner literal read at runtime, never hardcoded
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, OWNER = OWNER_LITERAL;
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
  const before = sm();
  await page.evaluate(() => document.querySelector('rb-object-item[ref^="otmuxsession:"] .oi-expand')?.click()); await sleep(800);
  await page.evaluate(() => document.querySelector('rb-object-item[ref^="otmuxwindow:"] .oi-expand')?.click()); await sleep(800);
  const paneRef = await page.evaluate(() => document.querySelector('rb-object-item[ref^="otmuxpane:"]')?.getAttribute('ref'));
  await page.evaluate((r) => document.querySelector(`rb-object-item[ref="${r}"]`)?.click(), paneRef); await sleep(2000);
  const mine = sm().filter(s => !before.includes(s));
  const drawer = await page.evaluate(() => { const d = document.getElementById('sm-drawer') || document.querySelector('rb-detail-drawer'); return { hasTerm: !!d?.querySelector('rb-terminal-detail'), hasClose: !!d?.querySelector('.drawer-close') }; });
  console.log(`opened pane ${paneRef} → drawer ${JSON.stringify(drawer)} → MY sm_ (${mine.length}): ${mine.join(', ')}`);
  console.log(`click Close → poll census 14s:`);
  await page.click('#sm-drawer .drawer-close, rb-detail-drawer .drawer-close', { timeout: 5000 }).catch((e) => console.log('  close click err', e.message));
  for (let t = 0; t <= 14; t += 1) {
    const now = sm(); const stillMine = mine.filter(s => now.includes(s));
    console.log(`  t+${t}s: myAlive=${stillMine.length}/${mine.length}${stillMine.length ? ' [' + stillMine.join(',') + ']' : ' ✓ALL GONE'}`);
    if (stillMine.length === 0) break;
    await sleep(1000);
  }
  // cleanup ONLY my exact names if any survived
  const survived = sm().filter(s => mine.includes(s));
  for (const s of survived) { try { execSync(`tmux kill-session -t ${s} 2>/dev/null || true`); } catch { /* noop */ } }
  console.log(survived.length ? `PERSISTED (real leak candidate): ${survived.join(', ')} — cleaned my exact names` : 'RESOLVED on its own = TIMING');
  await ctx.close();
} finally { await browser.close(); }
