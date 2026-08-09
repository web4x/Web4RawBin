// [test:uuid:c4f8a1d6-9e23-4b7f-a051-3d8e6f2b90c4] R40.1 RcLinkResolver.resolveRcLink (Impl 45853b02) — fail-closed per-pane RC deep-link: the owner-gated endpoint 403s a non-owner with NO bridgeSessionId/session-URL leak, and the resolver returns {url:null,reason} (NEVER a synthesised session_ URL) while threading the SELECTED pane id. AC-1 visible+fireable + AC-2 server-side pane→agent isolation are owner-page-pending.
// R40.1 — per-pane RC deep-link. SURFACE-LABELLED (PO condition).
//   [REAL·NON-OWNER] AC-4 SECURITY: GET /api/server-manager/rc?pane=X → 403 for a non-owner (behind the R31.2 choke-point),
//     and NO bridgeSessionId / session URL / claude.ai-link leaks in the body — an RC link is a live-session capability, a
//     leak = a token leak. By construction the 403 fires in requireOwnerHttp BEFORE the endpoint's resolveRcLink runs, so
//     no bridge is ever computed → nothing to leak; the probe confirms the body carries only {"error":"forbidden"}.
//   [HARNESS·HEAD source] AC-3 FAIL-CLOSED + AC-2 per-pane threading: RcLinkResolver.resolveRcLink (Impl 45853b02) — a
//     403 / null / no-agent / network response yields {url:null, reason}, NEVER a synthesised session_ URL; and the SELECTED
//     paneId is threaded into ?pane= (per-pane isolation at the client — %1 must not fetch %0). Mock ONLY fetch.
//   [OWNER-PAGE → device/harness-later] AC-1 RC action VISIBLE+FIREABLE on the real pane surface (rb-terminal-detail owner
//     bundle) + AC-2 SERVER-side per-pane resolution (OtmuxBridge, owner-gated) → not reachable as non-owner; mark pending.
// DET-3x. @390 real-WebKit for the harness. stub-must-fail: a synthesised-url regression would flip AC-3 RED.
import https from 'node:https';
import { execSync } from 'node:child_process';
import { webkit, devices } from '@playwright/test';
const HOST = 'prod.wo-da.de', PORT = 4444;
const OWNER = '41ad88c4-4dee-49ac-afcb-8a2026657b2d';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const BUNDLE = `${ROOT}/test-results/r401-harness/rcl.bundle.js`;
const iPhone = devices['iPhone 12'];

const httpGet = (path, headers = {}) => new Promise((resolve) => {
  const req = https.request({ host: HOST, port: PORT, path, method: 'GET', headers, rejectUnauthorized: false }, (res) => {
    let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b }));
  });
  req.on('error', () => resolve({ status: 0, body: 'ERR' })); req.end();
});
const leaks = (s) => /claude\.ai\/code|bridgeSessionId|session_|"url"\s*:\s*"https/i.test(s || '');

execSync(`mkdir -p ${ROOT}/test-results/r401-harness`, { cwd: ROOT });
execSync(`npx esbuild src/public/ts/trace/rc-link-resolver.ts --bundle --format=iife --global-name=RCL --outfile=${BUNDLE}`, { cwd: ROOT, stdio: 'pipe' });

const browser = await webkit.launch({ headless: true });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    // ── AC-4 [REAL·NON-OWNER]: 403 + no leak, across token variants + a path-injection pane ──
    const variants = [['no-token', {}], ['unknown', { 'x-player-token': '00000000-0000-4000-8000-000000000000' }], ['owner-not-live', { 'x-player-token': OWNER }]];
    const probes = [];
    for (const [name, h] of variants) { const r = await httpGet('/api/server-manager/rc?pane=%0', h); probes.push([name, r.status, leaks(r.body), r.body.slice(0, 40)]); }
    const inj = await httpGet('/api/server-manager/rc?pane=' + encodeURIComponent('%0;../../'), {});
    const ac4 = probes.every(p => p[1] === 403 && p[2] === false) && inj.status === 403 && !leaks(inj.body);

    // ── AC-3 + AC-2 [HARNESS]: resolver fail-closed + per-pane threading, mock ONLY fetch ──
    const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await page.goto('about:blank');
    await page.addScriptTag({ path: BUNDLE });
    const h = await page.evaluate(async () => {
      const R = window.RCL.RcLinkResolver;
      const calls = [];
      const orig = window.fetch;
      const mock = (resp) => { window.fetch = async (u) => { calls.push(String(u)); return resp; }; };
      const jsonRes = (obj, ok = true, status = 200) => ({ ok, status, json: async () => obj });

      mock(jsonRes({ url: null, reason: 'no claude agent in this pane' }));        // no-agent bash pane
      const noAgent = await R.resolveRcLink('%2');
      mock(jsonRes({}, false, 403));                                               // owner-gated / denied
      const denied = await R.resolveRcLink('%3');
      window.fetch = async () => { throw new Error('net'); };                       // network failure
      const netfail = await R.resolveRcLink('%4');
      mock(jsonRes({ url: 'https://claude.ai/code/SESSION123', agent: 'robbin-expert' })); // happy
      const happy = await R.resolveRcLink('%1');
      window.fetch = orig;

      const noSynthesis = noAgent.url === null && denied.url === null && netfail.url === null; // NEVER a fabricated URL
      const hasReason = !!noAgent.reason && !!denied.reason && !!netfail.reason;               // stated reason on every fail
      const happyPass = happy.url === 'https://claude.ai/code/SESSION123' && happy.agent === 'robbin-expert';
      const enc = (p) => 'pane=' + encodeURIComponent(p); // real tmux pane ids start with '%' → URL-encoded ('%1'→'%251')
      const perPane = calls.some(c => c.includes(enc('%2'))) && calls.some(c => c.includes(enc('%1'))) && !calls.some(c => c.includes(enc('%0'))); // SELECTED pane threaded+encoded, not a hardcoded default
      return { noSynthesis, hasReason, happyPass, perPane, noAgent, denied, netfail, happy, calls };
    });
    await ctx.close();

    const ac3 = h.noSynthesis && h.hasReason;
    const ac2client = h.perPane && h.happyPass;
    const pass = ac4 && ac3 && ac2client;
    results.push(pass);
    console.log(`iter ${i}: [REAL]AC4-403+noleak=${ac4}(${probes.map(p => p[0] + ':' + p[1] + (p[2] ? '·LEAK' : '')).join(' ')} inj:${inj.status}) [HARNESS]AC3-failclosed=${ac3}(noSynth=${h.noSynthesis} reasons=${h.hasReason}) [HARNESS]AC2-perpane=${h.perPane}+happy=${h.happyPass} => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

console.log('\n===== R40.1 per-pane RC deep-link (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('SURFACE: AC-4 proven on the REAL endpoint (non-owner); AC-3 fail-closed + AC-2 client per-pane threading on the HARNESS (rc-link-resolver HEAD source).');
console.log('OWNER-PAGE PENDING (not gated here): AC-1 RC-button VISIBLE+FIREABLE on the real /server-manager pane surface; AC-2 SERVER-side pane→agent isolation (OtmuxBridge, owner-gated).');
process.exitCode = green ? 0 : 1;
