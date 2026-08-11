// [test:uuid:6e1a9d47-5c82-43b0-9f16-2a7e0c4b8d35] R40.3 keybar FAIL-VISIBLE (BUG-KEYBAR-READPATH family, closes 34b0b233) — RbTerminalDetail.mount (Impl 79a1ce7c). When /api/ior resolves 0 keys (keymap missing/unreadable), the keyboard bar region must NOT be a silently-empty area: it renders a role=status notice `.rb-keybar-unavailable` with the visible cause text "⚠ keyboard bar unavailable — 0 keys resolved from /api/ior". This gate FORCES the empty case (fetch-override → unit.model.keys=[]) and asserts the notice appears with its cause text and NO keybar buttons — the piece the 8-keys happy path (r403a) could not prove. STUB-MUST-FAIL: a bundle with the notice class stripped MUST make the suite RED (proves the assertion isn't vacuous). webkit @390 iPhone-12, esbuild-from-HEAD component, SW neutralised (block+unregister+cache-clear), served==committed asserted dynamically (no hardcoded version literal). DET-3x.
import { webkit, devices } from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { seedSystemTester } from './system-tester-setup.mjs';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const BASE = 'https://prod.wo-da.de:4444';
const DIR = `${ROOT}/test-results/r403b-keybar`;
const REAL = `${DIR}/term.real.js`;
const STUB = `${DIR}/term.stub.js`;
const IOR = 'c16abc17-21cc-477f-b2ce-481bef773da1'; // the keymap ior the component fetches (hardcoded in mount)
const iPhone = devices['iPhone 12'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

execSync(`mkdir -p ${DIR}`, { cwd: ROOT });
execSync(`npx esbuild src/public/ts/trace/rb-terminal-detail.ts --bundle --format=iife --loader:.css=text --outfile=${REAL}`, { cwd: ROOT, stdio: 'pipe' });
// STUB = the notice STRIPPED (class renamed) → the fail-visible notice can no longer be found → suite must go RED on it
fs.writeFileSync(STUB, fs.readFileSync(REAL, 'utf8').split('rb-keybar-unavailable').join('rb-keybar-STRIPPED-STUB'));

// committed version (HEAD) — read dynamically, NO hardcoded literal
const committedVersion = JSON.parse(execSync('git show HEAD:package.json', { cwd: ROOT, encoding: 'utf8' })).version;

// force 0 keys from /api/ior (keymap fetch-override) + neutralise the SW + mock the owner-gated terminal ws
const FORCE_EMPTY = `(() => { const rf = window.fetch.bind(window); window.fetch = (u, o) => String(u).includes('/api/ior/${IOR}')
  ? Promise.resolve(new Response(JSON.stringify({ ior:'ior:instance:${IOR}', type:'terminal', unit:{ ior:'ior:class:Terminal', model:{ uuid:'${IOR}', keys:[] } }, html:'', md:'' }), { status:200, headers:{'Content-Type':'application/json'} }))
  : rf(u, o); })()`;
const SW_KILL = `(async () => { try { if (navigator.serviceWorker) { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } } catch(e){}
  try { if (window.caches) { for (const k of await caches.keys()) await caches.delete(k); } } catch(e){} })()`;
const WS_MOCK = `(() => { const R = window.WebSocket; function H(u,p){ if(String(u).includes('/api/server-manager/terminal')){ const f={url:u,readyState:1,binaryType:'arraybuffer',onopen:null,onmessage:null,onclose:null,send(){},close(){this.readyState=3;}}; setTimeout(()=>{try{f.onopen&&f.onopen();}catch(e){}},0); return f;} return p!==undefined?new R(u,p):new R(u);} H.CONNECTING=0;H.OPEN=1;H.CLOSING=2;H.CLOSED=3; window.WebSocket=H; })()`;

const mountAndRead = async (bundlePath) => {
  const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  await seedSystemTester(ctx);
  await ctx.addInitScript(SW_KILL); await ctx.addInitScript(FORCE_EMPTY); await ctx.addInitScript(WS_MOCK);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  const served = await page.evaluate(() => fetch('/api/config').then((r) => r.json()).then((c) => c.version).catch(() => null));
  await page.addScriptTag({ path: bundlePath }).catch(() => {});
  await page.evaluate((ior) => { const h = document.createElement('div'); h.style.cssText = 'width:390px;height:600px'; document.body.appendChild(h); const el = document.createElement('rb-terminal-detail'); el.setAttribute('uuid', ior); h.appendChild(el); }, IOR);
  await sleep(1400); // xterm open + forced-empty keymap fetch + notice render
  const m = await page.evaluate(() => {
    const td = document.querySelector('rb-terminal-detail');
    const notice = td && td.querySelector('.rb-keybar-unavailable');
    const bar = td && td.querySelector('.rb-keybar');
    return { served: null, notice: !!notice, role: notice ? notice.getAttribute('role') : null, text: notice ? (notice.textContent || '').trim() : '', barButtons: bar ? bar.querySelectorAll('button').length : 0 };
  });
  m.served = served;
  await ctx.close();
  return m;
};
const noticeOK = (m) => m.notice && m.role === 'status' && /⚠ keyboard bar unavailable/.test(m.text) && /0 keys resolved from \/api\/ior/.test(m.text) && m.barButtons === 0;

const browser = await webkit.launch({ headless: true });
const results = [];
let stubMustFail = false, servedEqCommitted = false, servedSeen = null;
try {
  for (let i = 1; i <= 3; i++) {
    const m = await mountAndRead(REAL);
    servedSeen = m.served; servedEqCommitted = m.served === committedVersion;
    const ok = noticeOK(m) && servedEqCommitted;
    results.push(ok);
    if (i === 1) await (await browser.newContext()).close(); // noop keep-alive
    console.log(`iter ${i}: notice=${m.notice} role=${m.role} cause-text=${/⚠ keyboard bar unavailable/.test(m.text)} no-buttons=${m.barButtons === 0} served==committed=${servedEqCommitted}(${m.served}==${committedVersion}) => ${ok ? 'GREEN' : 'RED'}`);
  }
  // STUB-MUST-FAIL: with the notice class stripped, the notice must be UNDETECTABLE → the gate would catch a regression
  const s = await mountAndRead(STUB);
  stubMustFail = !noticeOK(s);
  console.log(`stub-must-fail: notice-detected-in-stripped-bundle=${noticeOK(s)} → gate-can-fail=${stubMustFail}`);
} finally { await browser.close(); }

console.log('\n===== R40.3 keybar FAIL-VISIBLE @390 real-WebKit (served ' + servedSeen + ', BUG-KEYBAR-READPATH) DET-3x =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean) && stubMustFail && servedEqCommitted;
console.log('OVERALL:', green ? 'GREEN DET-3x — 0-keys renders the visible role=status notice + stub-must-fail proven' : 'RED');
process.exitCode = green ? 0 : 1;
