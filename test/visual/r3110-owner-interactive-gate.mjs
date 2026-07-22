// [test:uuid:0c0a69ad-d113-40f3-ae83-db9fc7fa9844] R31.4 RbTerminalDetail interactive-RW (Impl 79a1ce7c) — end-to-end owner cookie→ws→xterm attach→keystroke→ECHO roundtrip (distinct from c6791c06 mount): READY banner rendered, 5 keystrokes reach the ws, 'lsCMD' echo renders in .xterm-rows. Mocked-pty by construction (routeWebSocket echo); node-pty REALNESS = architect, keystroke VISUAL = Tron device.
// (R31.1 owner-entry Test a52393fb was RETIRED here — superseded by slice-d b70aa99f (m.features render, r31sliced-feature-grants-gate.mjs); the serverManager-boolean assertion this file carried is dropped so the gate stays honest.)
// R31.4 interactive RW — BY-CONSTRUCTION owner-session gate (DET-3x @390 iPhone-12).
// Mocks the owner WITHOUT touching Tron's real session (won't evict him): route-intercept whoami→200 + a test
// sm_session cookie + a MOCKED terminal ws that ECHOES like a pty. Gates the FULL client flow end-to-end
// (owner cookie → drawer mount → ws connect → xterm attach → keystroke → RW echo roundtrip). node-pty REALNESS
// is proven separately by the architect; this closes the parked 'device-only' logic ACs. Tron's device = FINAL visual.
// (1) mock-owner → click pane → rb-terminal-detail mounts in the /trace drawer → xterm renders → type → echo seen (RW).
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin', TARGET = '0.7.119';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r(b)); }); q.on('error', () => r('')); q.end(); });
const smBundle = fs.readdirSync(`${REPO}/src/public/dist`).find(f => /^server-manager-.*\.js$/.test(f));

const ROOTS = [{ uuid: 'sess:robbinTeam2', type: 'otmuxSession', name: 'robbinTeam2', hasChildren: true, children: [
  { uuid: 'win:robbinTeam2:0', type: 'otmuxWindow', name: 'window 0', hasChildren: true, children: [
    { uuid: '%10', type: 'otmuxPane', name: 'robbinTeam2:0.0  —  bash', hasChildren: false } ] } ] }];
const SM_STYLE = `body{margin:0;background:#0d1117;color:#e6edf3;display:flex;flex-direction:column;height:100dvh;overflow:hidden;font-family:system-ui}`
  + `header{padding:12px 16px;background:#161b22;border-bottom:1px solid #30363d}.trace-page{height:auto;flex:1;min-height:0}#err{color:#f85149}`;
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  + `<link rel="stylesheet" href="/app.css"><style>${SM_STYLE}</style></head><body>`
  + `<header><h1>Server Manager</h1></header>`
  + `<div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="sm-tree"></rb-trace-tree><div id="err"></div></div></div>`
  + `<script type="module" src="/dist/${smBundle}"></script></body></html>`;
const clickExpand = (page, prefix, n = 0) => page.evaluate(([p, i]) => { const it = document.querySelectorAll(`rb-object-item[ref^="${p}"]`)[i]; const ex = it && it.querySelector('.oi-expand'); if (ex) ex.click(); return !!ex; }, [prefix, n]);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const servedVersion = JSON.parse(await httpGet('/api/config') || '{}').version;
  if (servedVersion !== TARGET) { console.log(`ABORT (phantom-guard): served=${servedVersion} != ${TARGET}`); process.exitCode = 1; }
  else {
  console.log(`served version verified == ${TARGET}`);
  fs.mkdirSync(`${REPO}/test-results/r3110`, { recursive: true });

  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    await ctx.addCookies([{ name: 'sm_session', value: 'test-owner-session', domain: HOST, path: '/' }]); // by-construction owner session
    const page = await ctx.newPage();

    // MOCK the pty ws: echo whatever the client sends (binary keystrokes) + an initial banner — no real server, no owner needed
    let received = 0, wsConnected = false;
    await page.routeWebSocket(/\/api\/server-manager\/terminal/, (ws) => {
      wsConnected = true;
      ws.send(Buffer.from('READY$ '));                       // pty banner (server→client half)
      ws.onMessage((m) => { if (typeof m !== 'string') { received++; ws.send(m); } }); // echo keystroke bytes back (pty echo)
    });
    // mock owner HTTP surface
    await page.route((u) => u.pathname === '/server-manager', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
    await page.route('**/api/server-manager/whoami**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"owner":true,"token8":"41ad88c4"}' }));
    await page.route('**/api/server-manager/tree**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, roots: ROOTS }) }));

    await page.goto(`${BASE}/server-manager`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('rb-object-item[ref^="otmuxsession:"]').length > 0, { timeout: 20000 }).catch(() => {});
    await clickExpand(page, 'otmuxsession:'); await sleep(300);
    await clickExpand(page, 'otmuxwindow:', 0); await sleep(300);

    // (1) click a pane → rb-terminal-detail mounts + ws connects + xterm renders
    await page.evaluate(() => { const p = document.querySelector('rb-object-item[ref^="otmuxpane:"]'); if (p) p.click(); });
    await page.waitForFunction(() => !!document.querySelector('#sm-drawer rb-terminal-detail .xterm'), { timeout: 10000 }).catch(() => {});
    await sleep(900);
    const mounted = await page.evaluate(() => { const td = document.querySelector('#sm-drawer rb-terminal-detail'); const x = td?.querySelector('.xterm'); const rows = td?.querySelector('.xterm-rows'); return { hasDetail: !!td, hasXterm: !!x, xtermSized: !!(x && x.getBoundingClientRect().height > 20), banner: (rows?.textContent || '').includes('READY') }; });

    // type into the terminal → onData → ws.send → mock echoes → term.write (RW roundtrip)
    await page.evaluate(() => { const t = document.querySelector('#sm-drawer rb-terminal-detail .xterm-helper-textarea, #sm-drawer rb-terminal-detail textarea'); if (t) t.focus(); });
    await page.keyboard.type('lsCMD', { delay: 60 });
    await sleep(700);
    const echoed = await page.evaluate(() => (document.querySelector('#sm-drawer rb-terminal-detail .xterm-rows')?.textContent || ''));
    if (i === 1) await page.screenshot({ path: `${REPO}/test-results/r3110/owner-terminal-390.png` });
    const rwRoundtrip = wsConnected && received >= 4 && /lsCMD/.test(echoed) && mounted.hasXterm;
    const interactiveOk = mounted.hasDetail && mounted.hasXterm && mounted.xtermSized && mounted.banner && rwRoundtrip;

    await ctx.close();

    // (2) R31.1 owner-entry (a52393fb, serverManager-boolean MITM) was RETIRED — the render moved to m.features
    // (server.ts:940) so injecting serverManager=true no longer produces an entry (would false-RED). Superseded by
    // slice-d (b70aa99f, r31sliced-feature-grants-gate.mjs) which gates the generalized m.features render. Removed here
    // to keep this standing gate honest. This gate = R31.4 interactive-RW ONLY (Test 0c0a69ad).

    const pass = interactiveOk;
    results.push(pass);
    console.log(`iter ${i}: [R31.4 RW] mount=${mounted.hasDetail} xterm=${mounted.hasXterm}(sized=${mounted.xtermSized}) banner=${mounted.banner} ws=${wsConnected} recv=${received} echo(lsCMD)=${/lsCMD/.test(echoed)} => ${pass ? 'GREEN' : 'RED'}`);
  }
  }
} finally { await browser.close(); }

console.log('\n===== R31.4 interactive RW + R31.1 owner-entry (mock owner, DET-3x @390) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: pty ECHO is mocked (by-construction owner ws); node-pty REALNESS = architect; Tron device = final visual.');
process.exitCode = green ? 0 : 1;
