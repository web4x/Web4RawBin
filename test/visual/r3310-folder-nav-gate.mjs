// R33.10 — 123-ts folder-nav (sourceDirTree Impl cfb6acef) @390 WebKit gate, DET-3x. INV-T1: rawbin:ts expands to LEAF
// [test:uuid:5d4b2fb5-11ef-47ca-8486-b171308643b6] R33.10 server.sourceDirTree (Impl cfb6acef) @390 WebKit — 123-ts folder-nav tree completeness (INV-T1-4); GREEN DET-3x. Independent tester credit.
// .ts files (NOT {} — v0.8.36 fixed the PROJECT_ROOT ReferenceError). Two halves: (server, read-only, ungated) drill
// /api/trace/children/rawbin:ts → reach a real .ts leaf within a few levels; (WebKit @390 render) serve /model shell →
// real model bundle → expandPath(['mof-m1','project:RawBin','rawbin:ts']) → the ts subtree renders nodes VISIBLE.
// Planted-defect: a bogus ref → empty (not a false-positive leaf). Engine-switch WK=1 → real Safari @390. Read-only.
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
import { chromium, webkit, devices } from '@playwright/test';
const ENGINE = process.env.WK ? webkit : chromium; // WK=1 → real Safari @390
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444', TARGET = process.env.R3310_TARGET || '0.8.37';
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r3310-folder-nav') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  + `<link rel="stylesheet" href="/app.css"><style>body{margin:0;background:#0d1117;color:#e6edf3;height:100dvh;display:flex;flex-direction:column}.trace-page{flex:1;min-height:0;overflow:auto}#err{color:#f85149}</style></head><body>`
  + `<div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="model-tree"></rb-trace-tree></div><div id="err"></div></div>`
  + `<script type="module" src="${BUNDLE}"></script></body></html>`;
const served = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
if (served !== TARGET) { console.log(`⚠ PHANTOM-GUARD: served=${served} != ${TARGET} — ABORT.`); process.exit(1); }
console.log(`served==${TARGET} verified. engine=${process.env.WK ? 'webkit' : 'chromium'}`);

async function runOnce(browser, i) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-trace-tree') && document.querySelectorAll('rb-object-item').length > 0, { timeout: 15000 }).catch(() => {});

  // (server INV-T1, ungated) drill rawbin:ts → reach a real .ts LEAF within 4 levels; bogus ref → empty
  const R = await page.evaluate(async () => {
    const kids = async (ref) => { try { return (await (await fetch('/api/trace/children/' + ref, { credentials: 'same-origin' })).json()).children || []; } catch { return []; } };
    const top = await kids('rawbin:ts');
    let leafFound = false, frontier = top.slice(), depth = 0;
    while (frontier.length && depth < 4 && !leafFound) {
      const next = [];
      for (const n of frontier) {
        if (/\.ts$/.test(n.name || '') && n.hasChildren === false) { leafFound = true; break; }
        if (n.hasChildren) next.push(...(await kids(n.uuid)));
      }
      frontier = next; depth++;
    }
    const bogus = await kids('rawbin:bogusxyz');
    return { topCount: top.length, leafFound, bogusEmpty: bogus.length === 0 };
  });
  R.invT1 = R.topCount > 0 && R.leafFound; // rawbin:ts non-empty AND reaches a .ts leaf (not {})

  // (WebKit @390 render) expandPath rawbin:ts → the ts subtree renders VISIBLE nodes
  await page.evaluate(() => document.getElementById('model-tree')?.expandPath(['mof-m1', 'project:RawBin', 'rawbin:ts']));
  await sleep(3200);
  R.renderVisible = await page.evaluate(() => {
    const items = [...document.querySelectorAll('rb-object-item')];
    const ts = items.find(el => (el.textContent || '').includes('public') || (el.textContent || '').includes('.ts'));
    const r = ts && ts.getBoundingClientRect();
    return { nodes: items.length, tsNodeVisible: !!(r && r.width > 0 && r.height > 0) };
  });
  if (i === 1) await page.screenshot({ path: OUT + 'ts-tree.png' });
  await ctx.close();
  return { ...R };
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const runs = [];
try { for (let i = 1; i <= 3; i++) runs.push(await runOnce(browser, i)); } finally { await browser.close(); }

console.log('\n===== R33.10 folder-nav @390 (DET-3x) =====');
runs.forEach((R, i) => console.log(`iter ${i + 1}: ${JSON.stringify(R)}`));
const invT1 = runs.length === 3 && runs.every(R => R.invT1 === true && R.bogusEmpty === true);
const render = runs.every(R => R.renderVisible && R.renderVisible.tsNodeVisible === true);
const green = invT1 && render;
console.log(`\nINV-T1 rawbin:ts → .ts leaf (not {}), bogus empty: ${invT1 ? 'GREEN' : 'RED'}`);
console.log(`WebKit @390 render (ts subtree nodes visible): ${render ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.10:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
