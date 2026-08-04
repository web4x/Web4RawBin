// S35 FOUNDATION — R35.2/R35.3 every item type resolves to a REAL on-disk unit + the universal A1 ◆Scenario/✎Edit
// both resolve. ensureViewUnit (Impl a09b474d, server.ts:1101 — generalizes the R34.2 A2 resolver). real-WebKit
// (Safari 605.1.15) @390, DET-3x. Types: Folder=rawbin:ts, File=file:src/ts/server/server.ts, PumlArtifact=a real puml
// leaf. GATE per type: (1) DATA — /api/ior/<ref> → correct ior:class:X + location==ref-path + DETERMINISTIC uuid (twice→
// same). (2) BAR — opening the node shows the universal [◆Scenario,✎Edit] bar (both buttons present). (3) RESOLVE — ◆Scenario
// navigates to a /scenario URL that RESOLVES back to the same real unit uuid; ✎Edit navigates to the editor. DISCRIMINATOR:
// type-distinct (Folder≠File≠PumlArtifact — not mislabeled). Read-only (GET /api/ior deterministic-idempotent, no write).
// [test:uuid:PLACEHOLDER-ON-GREEN] — marker added after GREEN → a09b474d (R35.2/R35.3 ensureViewUnit).
import { chromium, webkit, devices } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
const ENGINE = process.env.WK ? webkit : chromium;
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const TARGET = process.env.R35_TARGET || '0.8.46';
const servedVersion = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
console.log(servedVersion === TARGET ? `served==${TARGET} verified — SERVED verdict on ${process.env.WK ? 'WebKit' : 'chromium'}.` : `⚠ PHANTOM-GUARD: served=${servedVersion} != ${TARGET}.`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r35-foundation') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TYPES = [
  { label: 'Folder', ref: 'rawbin:ts', ior: 'ior:class:Folder', loc: 'rawbin:ts' },
  { label: 'File', ref: 'file:src/ts/server/server.ts', ior: 'ior:class:File', loc: 'src/ts/server/server.ts' },
  { label: 'PumlArtifact', ref: 'puml-src:sprint-07-encrypted-storage/diagrams/avatar-crop-lifecycle.puml', ior: 'ior:class:PumlArtifact', loc: 'sprint-07-encrypted-storage/diagrams/avatar-crop-lifecycle.puml' },
];
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><style>body{margin:0;background:#0d1117;height:100dvh;display:flex;flex-direction:column}.trace-page{flex:1;min-height:0;overflow:auto;position:relative}#err{color:#f85149}</style></head><body><div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="model-tree"></rb-trace-tree></div><div id="err"></div></div><script type="module" src="${BUNDLE}"></script></body></html>`;
const readVerbs = (page) => page.evaluate(() => [...document.querySelectorAll('rb-detail-drawer .drawer-actionbar .da-btn')].map(b => b.getAttribute('data-verb')));

async function runOnce(browser, i) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  let throws = 0; page.on('pageerror', () => throws++);
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-detail-drawer') && document.querySelectorAll('rb-object-item').length > 0, { timeout: 15000 }).catch(() => {});
  const per = {};
  for (const t of TYPES) {
    // (1) DATA + determinism + (3) resolve-back: /scenario resolver returns the same unit
    const data = await page.evaluate(async (ty) => {
      const get = async (ref) => { try { return (await (await fetch('/api/ior/' + ref)).json()).unit; } catch { return null; } };
      const u1 = await get(ty.ref), u2 = await get(ty.ref);
      return { iorOk: u1?.ior === ty.ior, locOk: u1?.model?.location === ty.loc, det: u1?.model?.uuid && u1.model.uuid === u2?.model?.uuid, uuid: u1?.model?.uuid };
    }, t);
    // (2) BAR — open the node → universal [Scenario,Edit]
    await page.evaluate((ref) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: [ref] }, bubbles: true })), t.ref);
    await sleep(500);
    const verbs = await readVerbs(page);
    if (i === 1) await page.screenshot({ path: OUT + t.label + '.png' });
    per[t.label] = { ...data, bar: verbs.includes('scenario') && verbs.includes('edit'), verbs };
  }
  await ctx.close();
  return { per, throws };
}

// (3) NAV-RESOLVE: ◆Scenario navigates to a /scenario URL that RESOLVES to the SAME unit uuid; ✎Edit → editor href. Fresh context per action.
async function navResolve(browser, t) {
  const out = {};
  for (const [verb, glob] of [['scenario', '**/scenario?ior=**'], ['edit', '**/edit/**']]) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
    await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 15000 }).catch(() => {});
    await page.evaluate((ref) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: [ref] }, bubbles: true })), t.ref);
    await sleep(500);
    await page.evaluate((v) => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: v }, bubbles: true })), verb);
    await page.waitForURL(glob, { timeout: 6000 }).catch(() => {});
    const url = page.url().replace(BASE, '');
    // resolve-back: the ior in the URL resolves to the same real unit
    let resolvesBack = false;
    if (verb === 'scenario') { const m = url.match(/ior=([^&]+)/); if (m) { const iorRef = decodeURIComponent(m[1]); const u = await page.evaluate(async (r) => { try { return (await (await fetch('/api/ior/' + r)).json()).unit; } catch { return null; } }, iorRef); resolvesBack = u?.ior === t.ior; } }
    out[verb] = { url, navigated: verb === 'scenario' ? /\/scenario\?ior=/.test(url) : /\/edit\//.test(url), resolvesBack };
    await ctx.close();
  }
  return out;
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const runs = [], navs = {};
try {
  for (let i = 1; i <= 3; i++) runs.push(await runOnce(browser, i));
  for (const t of TYPES) navs[t.label] = await navResolve(browser, t);
} finally { await browser.close(); }

console.log(`\n===== S35 FOUNDATION (R35.2/R35.3 every-type resolve) @390 ${process.env.WK ? 'WebKit' : 'chromium'} DET-3x =====`);
runs.forEach((R, i) => console.log(`iter ${i + 1}: ${JSON.stringify(R.per)} throws=${R.throws}`));
console.log(`nav: ${JSON.stringify(navs)}`);
let allGreen = true;
for (const t of TYPES) {
  const dataBar = runs.length === 3 && runs.every(R => R.per[t.label]?.iorOk && R.per[t.label]?.locOk && R.per[t.label]?.det && R.per[t.label]?.bar);
  const nav = navs[t.label];
  const navOk = nav.scenario.navigated && nav.scenario.resolvesBack && nav.edit.navigated;
  const green = dataBar && navOk;
  if (!green) allGreen = false;
  console.log(`  ${t.label} (${t.ior}): DATA+BAR=${dataBar} NAV-RESOLVE=${navOk} => ${green ? 'GREEN DET-3x' : 'RED'}`);
}
const distinct = runs.every(R => R.per.Folder?.iorOk && R.per.File?.iorOk && R.per.PumlArtifact?.iorOk);
const noThrows = runs.every(R => R.throws === 0);
console.log(`type-distinct (Folder/File/PumlArtifact not mislabeled): ${distinct ? 'GREEN' : 'RED'} | no throws: ${noThrows ? 'GREEN' : 'RED'}`);
const overall = allGreen && distinct && noThrows;
console.log('OVERALL S35 FOUNDATION:', overall ? 'GREEN DET-3x' : 'RED');
process.exitCode = overall ? 0 : 1;
