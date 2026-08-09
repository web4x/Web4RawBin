// PROBE: minimize path — is the leak real (minimize teardown doesn't kill sm_) or my trigger not firing (handle click
// didn't minimize)? Open pane → record sm_ → click .drawer-handle → measure {minimized attr, rb-terminal-detail present,
// drawer height} → poll sm_ 8s.
import { chromium, devices } from '@playwright/test';
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
  await page.evaluate(() => document.querySelector('rb-object-item[ref^="otmuxpane:"]')?.click()); await sleep(2000);
  const mine = sm().filter(s => !before.includes(s));
  const pre = await page.evaluate(() => { const d = document.getElementById('sm-drawer') || document.querySelector('rb-detail-drawer'); return { minimized: d?.hasAttribute('minimized'), term: !!d?.querySelector('rb-terminal-detail'), h: d?.offsetHeight, handle: !!d?.querySelector('.drawer-handle'), handleVisible: (() => { const hh = d?.querySelector('.drawer-handle'); return hh ? getComputedStyle(hh).display !== 'none' && hh.offsetHeight > 0 : false; })() }; });
  console.log(`opened: sm_ spawned=${mine.length} [${mine.join(',')}] | drawer pre-minimize: ${JSON.stringify(pre)}`);
  // REAL minimize teardown path: call el.minimize() directly (exactly what the swipe-down :404 / resize-to-tiny :400
  // invoke). Tests the INV-T1 question — does minimize() tear down the terminal? — without fighting touch simulation.
  const clicked = await page.evaluate(() => { const d = document.getElementById('sm-drawer') || document.querySelector('rb-detail-drawer'); if (typeof d.minimize === 'function') { d.minimize(); return true; } return 'no minimize() method'; }).catch((e) => e.message);
  await sleep(1000);
  const post = await page.evaluate(() => { const d = document.getElementById('sm-drawer') || document.querySelector('rb-detail-drawer'); return { minimized: d?.hasAttribute('minimized'), term: !!d?.querySelector('rb-terminal-detail'), h: d?.offsetHeight }; });
  console.log(`clicked .drawer-handle=${clicked} → drawer post: ${JSON.stringify(post)}`);
  for (let t = 0; t <= 8; t++) { const alive = sm().filter(s => mine.includes(s)); console.log(`  t+${t}s: myAlive=${alive.length}/${mine.length}${alive.length ? '' : ' ✓GONE'}`); if (!alive.length) break; await sleep(1000); }
  const left = sm().filter(s => mine.includes(s));
  console.log(left.length ? `→ minimize LEAKED ${left.join(',')} — minimized=${post.minimized} termStillMounted=${post.term} (if term still mounted → tearDown NOT called on minimize; if minimized=false → my handle-click did NOT minimize = trigger artifact)` : '→ minimize teardown WORKS (sm_ gone)');
  for (const s of left) { try { execSync(`tmux kill-session -t ${s} 2>/dev/null || true`); } catch { /* */ } }
  await ctx.close();
} finally { await browser.close(); }
