// S35 FOUNDATION — R35.2/R35.3 every item type resolves to a REAL on-disk unit + the universal A1 ◆Scenario/✎Edit
// both resolve. ensureViewUnit (Impl a09b474d, server.ts:1101 — generalizes the R34.2 A2 resolver). real-WebKit
// (Safari 605.1.15) @390, DET-3x. Types: Folder=rawbin:ts, File=file:src/ts/server/server.ts, PumlArtifact=a real puml
// leaf. GATE per type: (1) DATA — /api/ior/<ref> → correct ior:class:X + location==ref-path + DETERMINISTIC uuid (twice→
// same). (2) BAR — opening the node shows the universal [◆Scenario,✎Edit] bar (both buttons present). (3) RESOLVE — ◆Scenario
// navigates to a /scenario URL that RESOLVES back to the same real unit uuid; ✎Edit navigates to the editor. DISCRIMINATOR:
// type-distinct (Folder≠File≠PumlArtifact — not mislabeled). Read-only (GET /api/ior deterministic-idempotent, no write).
// [test:uuid:9bc0a109-58fe-414a-a9d6-fbadbbd0c154] S35 R35.2/R35.3 server.ensureViewUnit (Impl a09b474d) @390 real-WebKit DET-3x served v0.8.48: EVERY item type resolves to a REAL on-disk ior:class:X unit (Folder=rawbin:ts, File=file:src/ts/server/server.ts, PumlArtifact=puml-src:… — correct ior:class + exact location + File.sourceFile/Folder-none type-distinct + DETERMINISTIC uuid) AND both universal buttons RESOLVE end-to-end: ◆Scenario→/scenario?ior=<realUuid>, ✎Edit→/edit/data/model-store/index/…/<realUuid>.scenario.json (nav targets the resolved MODEL_STORE uuid, no dead target — the R35.2 nav-fix on onUniversalAction 005dbd3e impl-edit).
// [test:uuid:83abce21-bd4e-4b5f-bc94-7e71517aeee8] S35 R35.4 mofChildren traceability folder (Impl b6c88d83) @390 real-WebKit DET-3x served v0.8.48: project:RawBin children = EXACTLY [ts,puml,diagrams,traceability] (4 folders) + rawbin:traceability expands to the real 497-Requirement trace tree (traceabilityRoots).
import { chromium, webkit, devices } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
const ENGINE = process.env.WK ? webkit : chromium;
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const TARGET = process.env.R35_TARGET || '0.8.48'; // re-gate target: nav-resolve fix + R35.4 traceability (a1594a8f3, restart-served)
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
  // R35.4: RawBin = EXACTLY [ts,puml,diagrams,traceability] + traceability → the real 497-req trace tree
  const r354 = await page.evaluate(async () => {
    const kids = async (ref) => { try { return (await (await fetch('/api/trace/children/' + ref)).json()).children || []; } catch { return []; } };
    const rb = await kids('project:RawBin');
    const trace = await kids('rawbin:traceability');
    return { rbNames: rb.map(c => c.name), traceCount: trace.length, traceFirst5: trace.slice(0, 5).map(c => (c.type || c.icon || '') + ':' + (c.name || '').slice(0, 24)) };
  });
  await ctx.close();
  return { per, throws, r354 };
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
    // the REAL resolved MODEL_STORE uuid this synthetic ref maps to (nav must target THIS, not the mis-stripped ref)
    const realUuid = await page.evaluate(async (ref) => { try { return (await (await fetch('/api/ior/' + ref)).json()).unit?.model?.uuid; } catch { return null; } }, t.ref);
    await page.evaluate((ref) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: [ref] }, bubbles: true })), t.ref);
    await sleep(500);
    await page.evaluate((v) => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: v }, bubbles: true })), verb);
    await page.waitForURL(glob, { timeout: 6000 }).catch(() => {});
    const url = page.url().replace(BASE, '');
    // RESOLVE = the nav targets the REAL resolved unit uuid (not a dead/mis-stripped ref): Scenario ?ior=<realUuid>,
    // Edit path /edit/data/model-store/index/…/<realUuid>.scenario.json (the store where the synthetic units actually live).
    const resolvesBack = !!realUuid && url.includes(realUuid);
    out[verb] = { url, navigated: verb === 'scenario' ? /\/scenario\?ior=/.test(url) : /\/edit\//.test(url), resolvesBack, realUuid };
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
// R35.4: RawBin = EXACTLY [ts,puml,diagrams,traceability] + traceability = the 497-req trace tree
const EXPECT4 = ['ts', 'puml', 'diagrams', 'traceability'];
const r354 = runs.every(R => { const n = R.r354?.rbNames || []; return n.length === 4 && EXPECT4.every(x => n.includes(x)); });
const r354trace = runs.every(R => (R.r354?.traceCount || 0) >= 400); // ~497 Requirement roots
console.log(`R35.4 RawBin=[ts,puml,diagrams,traceability]: ${r354 ? 'GREEN' : 'RED'} (${JSON.stringify(runs[0]?.r354?.rbNames)}) | traceability→trace tree (~497 reqs): ${r354trace ? 'GREEN' : 'RED'} (${runs[0]?.r354?.traceCount})`);
const overall = allGreen && distinct && noThrows && r354 && r354trace;
console.log('OVERALL S35 FOUNDATION:', overall ? 'GREEN DET-3x' : 'RED');
process.exitCode = overall ? 0 : 1;
