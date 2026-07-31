// R33.5 item1 REVEAL — INDEPENDENT headless gate (PO-directed; measured differently than the expert's own-oracle 816ecad4f).
// The reveal (addDiagram → tree shows the new diagram) is driven by rb-trace-tree.expandPath, which the expert fixed to
// walk by UUID (was raw-uuid vs the tree's type:uuid open-keys — the mismatch this tester MEASURED). expandPath lazy-loads
// via the UNGATED /api/trace/children (no owner-cookie needed for the reveal half). So: serve the /model shell (route.fulfill,
// no owner session — data APIs are public) → load the REAL model bundle → call expandPath(['mof-m1','project:RawBin',
// 'rawbin:diagram']) → assert the 2 REAL diagram itemviews APPEAR under an opened diagrams/ (0→2), from the LIVE server (NOT
// the expert's oracle, NOT mocked children). PLANTED-DEFECT: expandPath a NON-diagram path (rawbin:ts) → 0 diagram nodes (bite).
// The CREATE-POST half stays owner-gated (Tron device / logic-Test a5882399). @390 iPhone-12. DET-3x. NO prod seeding, read-only.
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const TARGET = process.env.R335C_TARGET || '0.8.20'; // PO: gate the SERVED bumped bundle (phantom-guard). Override for a dry-run.
const servedVersion = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
if (servedVersion !== TARGET) console.log(`⚠ PHANTOM-GUARD: served=${servedVersion} != TARGET=${TARGET} — this is a DRY-RUN (validates the gate on the committed bundle); the SERVED verdict rides v${TARGET}. Set R335C_TARGET=${servedVersion} to credit the current served bundle.`);
else console.log(`served==${TARGET} verified — SERVED verdict.`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r335c-reveal') + '/'; fs.mkdirSync(OUT, { recursive: true });
const DIAGS = ['d4e3d709', 'faa4acad']; // the 2 real diagrams under rawbin:diagram (measured, ungated)
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  + `<link rel="stylesheet" href="/app.css"><style>body{margin:0;background:#0d1117;color:#e6edf3;height:100dvh;display:flex;flex-direction:column;font-family:system-ui}.trace-page{flex:1;min-height:0;overflow:auto}#err{color:#f85149}</style></head><body>`
  + `<div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="model-tree"></rb-trace-tree></div><div id="err"></div></div>`
  + `<script type="module" src="${BUNDLE}"></script></body></html>`;

// count VISIBLE diagram itemviews (real diagrams show name "Model diagram…") + which known uuids are present
const countDiagrams = (page) => page.evaluate((known) => {
  const items = [...document.querySelectorAll('rb-object-item')];
  const byName = items.filter(el => /Model diagram/.test(el.textContent || '')).length;
  const uuidsShown = known.filter(u => items.some(el => (el.getAttribute('ref') || '').includes(u) || (el.outerHTML || '').includes(u)));
  return { byName, uuidsShown };
}, DIAGS);

async function runOnce(browser, i, revealPath) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  // NO intercept of /api/model/tree or /api/trace/children → REAL ungated live-server data (independent measurement).
  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.getElementById('model-tree') && document.querySelectorAll('rb-object-item').length > 0, { timeout: 15000 }).catch(() => {});
  await sleep(800);
  const before = await countDiagrams(page);
  const called = await page.evaluate((p) => { const t = document.getElementById('model-tree'); if (t && typeof t.expandPath === 'function') { t.expandPath(p); return true; } return false; }, revealPath);
  await sleep(3200); // real lazy-load of mof-m1 → project:RawBin → rawbin:diagram via ungated /api/trace/children
  const after = await countDiagrams(page);
  if (i === 1) await page.screenshot({ path: OUT + (revealPath.includes('rawbin:diagram') ? 'reveal' : 'planted') + '.png' });
  await ctx.close();
  return { called, beforeByName: before.byName, afterByName: after.byName, afterUuids: after.uuidsShown.length };
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const reveal = [], planted = [];
try {
  for (let i = 1; i <= 3; i++) reveal.push(await runOnce(browser, i, ['mof-m1', 'project:RawBin', 'rawbin:diagram']));
  planted.push(await runOnce(browser, 1, ['mof-m1', 'project:RawBin', 'rawbin:ts'])); // non-diagram path → no diagram nodes
} finally { await browser.close(); }

console.log('\n===== R33.5 item1 REVEAL @390 (independent, ungated /api/trace/children, DET-3x) =====');
reveal.forEach((R, i) => console.log(`reveal iter ${i + 1}: ${JSON.stringify(R)}`));
console.log(`planted (rawbin:ts): ${JSON.stringify(planted[0])}`);
const revealGreen = reveal.length === 3 && reveal.every(R => R.called && R.beforeByName === 0 && R.afterByName >= 2 && R.afterUuids >= 2); // 0→2 real diagrams appear
const bite = planted[0] && planted[0].afterByName === 0; // non-diagram path → NO diagram nodes appear
const green = revealGreen && bite;
console.log(`\nREVEAL (expandPath → 2 real diagrams appear 0→2): ${revealGreen ? 'GREEN DET-3x' : 'RED'}`);
console.log(`PLANTED-DEFECT bite (non-diagram path → 0 diagrams): ${bite ? 'GREEN' : 'RED'}`);
console.log('OVERALL item1 REVEAL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: CREATE-POST half stays owner-gated (logic-Test a5882399 / Tron device). This gates the REVEAL half only.');
process.exitCode = green ? 0 : 1;
