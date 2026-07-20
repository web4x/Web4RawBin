// R31.4 terminal drawer-mount gate (served==0.7.94), DET-3x. Client-only fix: the terminal mounts in the SHARED
// rb-detail-drawer (RbDetailDrawer.showElement) — LEFT-aligned — instead of the bespoke centered .sm-term-overlay,
// and minimize KEEPS the ws (onClose NOT fired) while FULL close fires onClose→teardown→ws.close (kills pty+session).
// I gate the drawer LOGIC on the SERVED rb-detail-drawer (driven via /trace which registers it) — engine-independent,
// no owner ws needed. RW keystrokes + fit + iOS visual = Tron device (real node-pty, owner cookie).
// CLIENT-ONLY → spot-check r312's core reject STILL 403s non-owner (server unchanged).
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const TARGET = '0.7.94';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (path, headers = {}) => new Promise((r) => { const req = https.request({ host: HOST, port: PORT, path, method: 'GET', headers, rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r({ status: res.statusCode, body: b })); }); req.on('error', () => r({ status: 0, body: '' })); req.end(); });
const smSrc = fs.readFileSync(`${REPO}/src/public/ts/server-manager/server-manager.ts`, 'utf8');

// (SOURCE) openTerminal wires the drawer correctly + retires the overlay — served==committed at v0.7.94
const srcOk = /drawer\.showElement\(/.test(smSrc)
  && /text-align:left/.test(smSrc)
  && /onClose:\s*teardown/.test(smSrc)
  && /ws\.close\(\)/.test(smSrc)
  && !/sm-term-overlay/.test(smSrc); // bespoke overlay retired (no reference left)

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    // version phantom-guard
    const cfg = JSON.parse((await httpGet('/api/config')).body || '{}');
    const versionOk = cfg.version === TARGET;
    // (SPOT-CHECK) client-only fix → server reject unchanged
    const reject = (await httpGet('/api/server-manager/whoami', {})).status === 403 && (await httpGet('/api/server-manager/tree', {})).status === 403;

    // (BEHAVIORAL) drive the SERVED rb-detail-drawer exactly like openTerminal does
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1200, height: 900 } });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});

    // mount a left-aligned container in the shared #sm-drawer via showElement (openTerminal's exact call), onClose spy
    const mounted = await page.evaluate(() => {
      let d = document.getElementById('sm-drawer');
      if (!d) { d = document.createElement('rb-detail-drawer'); d.id = 'sm-drawer'; document.body.appendChild(d); }
      const container = document.createElement('div');
      container.id = 'sm-term-container';
      container.style.cssText = 'text-align:left;height:100%;width:100%;display:flex;flex-direction:column;min-height:0';
      window.__onClose = 0;
      d.showElement(container, { title: 'Terminal — pane %1', onClose: () => { window.__onClose++; } });
      const inDrawer = d.contains(container);
      const noOverlay = !document.querySelector('.sm-term-overlay');
      const leftAligned = getComputedStyle(container).textAlign === 'left';
      return { inDrawer, noOverlay, leftAligned, open: d.hasAttribute('open') || d.offsetHeight > 0 };
    });

    // X (.drawer-close) → minimize-peek: KEEPS ws (onClose NOT fired)
    await page.click('#sm-drawer .drawer-close', { timeout: 5000 }).catch(() => {});
    await sleep(400);
    const afterX = await page.evaluate(() => ({ minimized: document.getElementById('sm-drawer')?.hasAttribute('minimized'), onClose: window.__onClose }));

    // ESC → FULL close(): fires onClose → teardown → ws.close (kills pty)
    await page.keyboard.press('Escape');
    await sleep(400);
    const afterEsc = await page.evaluate(() => ({ open: document.getElementById('sm-drawer')?.hasAttribute('open'), onClose: window.__onClose }));
    await ctx.close();

    const mountOk = mounted.inDrawer && mounted.noOverlay && mounted.leftAligned;
    const minimizeKeeps = afterX.minimized === true && afterX.onClose === 0;   // minimize → ws KEPT
    const fullCloseKills = afterEsc.onClose === 1 && afterEsc.open === false;   // full close → onClose(teardown→ws.close) fired ONCE
    const pass = versionOk && srcOk && reject && mountOk && minimizeKeeps && fullCloseKills;
    results.push(pass);
    console.log(`iter ${i}: version=${versionOk} src=${srcOk} reject403=${reject} | mount-in-drawer=${mounted.inDrawer} no-overlay=${mounted.noOverlay} left=${mounted.leftAligned} | X→minimize-keeps=${minimizeKeeps}(min=${afterX.minimized} oc=${afterX.onClose}) | ESC→full-close-kills=${fullCloseKills}(oc=${afterEsc.onClose} open=${afterEsc.open}) => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

console.log('\n===== R31.4 terminal drawer-mount (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: RW keystrokes + fit-on-expand + iOS visual = Tron device (real node-pty, owner cookie) — not gated here.');
process.exitCode = green ? 0 : 1;
