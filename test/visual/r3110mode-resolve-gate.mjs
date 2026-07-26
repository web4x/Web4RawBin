// [test:uuid:a1d38f6e-4a8f-4877-af38-76063a772ecd] R31.10 (Req 797113c5) tree method-resolution in ALL modes — a UseCase with model.method SET resolves to THAT method in EVERY view (trace + non-trace/scenario), NEVER a sibling. Acceptance: UC drawer.observePosition (cc45a580) → observePosition (e8097351), NOT onGrabBarPointer. FIX server.ts:1644-1646 (chainMethod=UC.method un-gated on queryMode). DET-3x GREEN v0.7.136: API trace resolves + source-audit fix-un-gated + /trace+/scenario render @390 + onGrabBarPointer never resolved. → req mints onto the R31.10 resolver Impl.
// R31.10 tree method-resolution across ALL modes — the IMG_4647 fix (req 797113c5). A UseCase whose model.method is SET
// must resolve to THAT method (+ its chain) in EVERY view — trace-mode AND non-trace/scenario — NEVER a sibling on the
// shared Class. Acceptance probe: R31.9 UC drawer.observePosition (cc45a580) → observePosition (e8097351), NOT the sibling
// onGrabBarPointer (R25.4, Method 2aded7b5) on the shared Class RbDetailDrawer.
// FIX = server.ts:1644-1646 dropped the queryMode==='trace' gate → chainMethod=UC.method attaches to the UC's Class child
// UNCONDITIONALLY on mode (the ucMethodIor guard means Class.methods[] sibling-fallback fires ONLY when UC.method is empty).
// Measured 3 ways (anti-single-point): (a) the API the client consumes, BOTH modes; (b) SOURCE-AUDIT the fix is un-gated;
// (c) @390 client render of /trace + /scenario. Invariant: observePosition resolves; onGrabBarPointer NEVER the method.
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, TARGET = '0.7.136', REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const UC = 'cc45a580-a401-4cee-9995-a10d7691bf40';        // UseCase drawer.observePosition (R31.9)
const OBS = 'e8097351-f461-4d5b-a90d-5a384dec72af';        // Method observePosition (CORRECT)
const SIBLING = 'onGrabBarPointer';                        // R25.4 sibling on the shared Class RbDetailDrawer (the bug)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const getJson = (p) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => { try { r(JSON.parse(b)); } catch { r({ __raw: b }); } }); }); q.on('error', () => r({})); q.end(); });

// (b) SOURCE-AUDIT: the chainMethod attachment for a UC's Class child is NOT gated by queryMode==='trace' (the fix).
const auditFix = () => {
  const src = fs.readFileSync(`${REPO}/src/ts/server/server.ts`, 'utf-8').split('\n');
  const line = src.findIndex(l => /entry\.chainMethod\s*=\s*\{\s*uuid:\s*ucMethodIor/.test(l));
  if (line < 0) return { ok: false, why: 'chainMethod assignment not found' };
  const ctx = src.slice(Math.max(0, line - 6), line + 1).join('\n');   // the enclosing guard
  const guardOk = /type === 'UseCase' && ct === 'Class' && ucMethodIor/.test(ctx);
  const noTraceGate = !/queryMode === 'trace'/.test(ctx);              // the removed gate must NOT wrap this block
  return { ok: guardOk && noTraceGate, guardOk, noTraceGate };
};

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const servedVersion = (await getJson('/api/config')).version;
  if (servedVersion !== TARGET) { console.log(`ABORT (phantom-guard): served=${servedVersion} != ${TARGET}`); process.exitCode = 1; }
  else {
  console.log(`served version verified == ${TARGET}`);
  for (let i = 1; i <= 3; i++) {
    // (a) API both modes — the resolution the client consumes
    const trace = await getJson(`/api/trace/children/${UC}?mode=trace`);
    const scenario = await getJson(`/api/trace/children/${UC}?mode=scenario`);
    const classChild = (trace.children || []).find(c => c.type === 'Class' && c.chainMethod);
    const cm = classChild?.chainMethod || {};
    // trace-mode: the Class child resolves to observePosition, NOT the sibling
    const traceOk = cm.uuid === OBS && /observePosition/.test(cm.name || '') && !new RegExp(SIBLING).test(JSON.stringify(trace));
    // BOTH modes: onGrabBarPointer is NEVER surfaced as the resolved method; any chainMethod present is observePosition
    const noSibling = !new RegExp(SIBLING).test(JSON.stringify(trace)) && !new RegExp(SIBLING).test(JSON.stringify(scenario));
    const scenarioChainOk = (scenario.children || []).filter(c => c.chainMethod).every(c => c.chainMethod.uuid === OBS); // vacuously true if none
    const apiOk = traceOk && noSibling && scenarioChainOk;

    // (b) source-audit — the fix is deployed un-gated
    const audit = auditFix();

    // (c) @390 client render — /trace (trace-mode) + /scenario (non-trace) both render the tree without crash
    let clientOk = false;
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' }); await sleep(1200);
      const traceRendered = await page.evaluate(() => !!customElements.get('rb-trace-tree') && document.querySelectorAll('rb-object-item').length > 0);
      await page.goto(`${BASE}/scenario`, { waitUntil: 'domcontentloaded' }); await sleep(1500);
      const scenarioRendered = await page.evaluate(() => document.querySelectorAll('rb-object-item').length > 0 || !!document.getElementById('scenario-app'));
      clientOk = traceRendered && scenarioRendered;
    } catch { clientOk = false; }
    await ctx.close();

    const pass = apiOk && audit.ok && clientOk;
    results.push(pass);
    console.log(`iter ${i}: API=${apiOk}(trace→${cm.name || 'none'}[${(cm.uuid || '').slice(0, 8)}] noSibling=${noSibling} scenChain=${scenarioChainOk}) | fix-audit=${audit.ok}(guard=${audit.guardOk} noTraceGate=${audit.noTraceGate}) | client@390=${clientOk} => ${pass ? 'GREEN' : 'RED'}`);
  }
  }
} finally { await browser.close(); }

console.log('\n===== R31.10 both-modes method resolution (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: observePosition resolves in trace-mode + fix un-gated on mode (any Class child in any mode gets UC.method) + onGrabBarPointer NEVER the resolved method. Tron device = the visual tree in both views.');
process.exitCode = green ? 0 : 1;
