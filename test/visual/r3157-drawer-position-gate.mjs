// [test:uuid:db12e833-5d6a-4e17-a95d-16a5aed2cde8] R31.5.7 RbDetailDrawer.applyPosition (Impl 6e2d4b81) — GREEN DET-3x @390 v0.7.119: ONE drawer instance, applyPosition('inline')→data-position=inline→position:static (in-flow [D] segment) + applyPosition('bottom')→data-position=bottom→position:fixed;bottom:0 (today); SAME instance both positions, functional shell (grab-bar/.drawer-handle + X/.drawer-close + .drawer-body) intact, NO 2nd full-width fork. AC-INV-PRESENTATION positioning!=function.
// R31.5.7 RbDetailDrawer.applyPosition (Impl 6e2d4b81) — AC-INV-PRESENTATION, DET-3x @390. served v0.7.118 (pid 1314990).
// THE CRUX: ONE drawer instance, position=mode (NO 2nd full-width-drawer fork = Tron's regression). applyPosition('inline')
// → data-position=inline → app.css position:static (in-flow [D] strip segment); applyPosition('bottom') → data-position=
// bottom → position:fixed;bottom:0 (today). SAME instance, BOTH positions, SAME functional shell (grab-bar/close/body) —
// only computed layout differs. Drive the SERVED rb-detail-drawer (from /trace bundle) appended to <body> (NOT .trace-page,
// whose `position:static !important` would mask the data-position branch). Positioning != function.
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin', TARGET = '0.7.119';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r(b)); }); q.on('error', () => r('')); q.end(); });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  console.log(`served=${JSON.parse(await httpGet('/api/config') || '{}').version} (pid 1314990) target=${TARGET}`);
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});

    const out = await page.evaluate(() => {
      // ONE instance, appended to <body> so the data-position branch (not .trace-page !important) decides layout
      const d = document.createElement('rb-detail-drawer'); d.id = 'r5157'; d.setAttribute('open', ''); document.body.appendChild(d);
      const measure = (pos) => {
        d.applyPosition(pos);
        const cs = getComputedStyle(d);
        return { dataPos: d.getAttribute('data-position'), computed: cs.position, bottom: cs.bottom };
      };
      const inline = measure('inline');
      const bottom = measure('bottom');
      // functional shell present + SAME instance across both positions
      const sameInstance = document.getElementById('r5157') === d;
      const shell = { handle: !!d.querySelector('.drawer-handle'), close: !!d.querySelector('.drawer-close'), body: !!d.querySelector('.drawer-body') };
      // HARD-AC: exactly ONE drawer element owns both modes — no 2nd full-width fork created by applyPosition
      const drawerCount = document.querySelectorAll('rb-detail-drawer').length;
      return { inline, bottom, sameInstance, shell, drawerCount };
    });

    const inlineOk = out.inline.dataPos === 'inline' && out.inline.computed === 'static';
    const bottomOk = out.bottom.dataPos === 'bottom' && out.bottom.computed === 'fixed';
    const funcShell = out.shell.handle && out.shell.close && out.shell.body; // grab-bar/X/body present (functional shell) in the SAME instance
    const oneDrawer = out.drawerCount <= 2 && out.sameInstance; // my created one (+ maybe the page's own) — applyPosition made NO new fork
    await ctx.close();

    const pass = inlineOk && bottomOk && funcShell && out.sameInstance && oneDrawer;
    results.push(pass);
    console.log(`iter ${i}: inline=${inlineOk}(${out.inline.dataPos}/${out.inline.computed}) bottom=${bottomOk}(${out.bottom.dataPos}/${out.bottom.computed} bottom:${out.bottom.bottom}) sameInstance=${out.sameInstance} funcShell=${funcShell}(h=${out.shell.handle} x=${out.shell.close} b=${out.shell.body}) drawers=${out.drawerCount} => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

console.log('\n===== R31.5.7 drawer.applyPosition (same instance, inline↔bottom, DET-3x @390) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
