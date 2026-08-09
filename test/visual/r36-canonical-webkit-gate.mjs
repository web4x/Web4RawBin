// S36 part-2 CANONICAL-RECONCILE — R36.1/R36.2 merge. reconcileCanonical (server.ts:1255, COMPUTE-ON-READ, files
// pristine = INV-T) merges the M1 counterpart + UNION facets; renderFacet (diagram-view-model.ts:61, marker pending)
// renders EVERY view by its viewKind from the ONE canonical node (previously non-class views skipped facets). real-WebKit
// (Safari 605.1.15) @390 MOBILE + DESKTOP, screenshot+PIXEL (never DOM-count for "did it render"), DET-3x, served 0.8.55.
// GATE: (1) INV-T — /api/ior twice byte-identical + the on-disk unit file mtime UNCHANGED (compute-on-read never writes);
// (2) renderFacet — each facet (UmlClass/tsClass/UmlMethod/UmlFunction/UmlUseCase) PAINTS a box (pixel area>0) with its
// distinct lens (class→UML box, method→signature row, usecase→ellipse); (3) Scenario/Edit → the CANONICAL unit unchanged;
// (4) where-used BIDIRECTIONAL (R36.2 side-index, net-zero add/remove). Re-gated GREEN on served 0.8.58 (R36_TARGET=0.8.58).
// [test:uuid:e21b876d-2397-4db1-a927-08256e5b2904] S36 part-2 DiagramViewModel.renderFacet (Impl 94ad4f50) — every view PAINTS
// its viewKind lens from the ONE canonical node (UmlClass/tsClass→UML box+«ts», UmlMethod/UmlFunction→signature row,
// UmlUseCase→ellipse), pixel area>20 @390 mobile + desktop real-WebKit, DET-3x (was: non-class views skipped facets).
import { chromium, webkit, devices } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
const ENGINE = process.env.WK ? webkit : chromium;
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const TARGET = process.env.R36_TARGET || '0.8.55';
const SP = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad';
const FACET_BUNDLE = fs.readFileSync(path.join(SP, 'facet-probe.bundle.js'), 'utf8');
const servedVersion = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
console.log(servedVersion === TARGET ? `served==${TARGET} verified — SERVED verdict on ${process.env.WK ? 'WebKit' : 'chromium'}.` : `⚠ PHANTOM-GUARD: served=${servedVersion} != ${TARGET}.`);
const OUT = path.join(ROOT, 'test-results/r36-canonical') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7', E = 'f8643e13-c457-4572-a0ae-97b4b95cb18d';
// a canonical-eligible unit on disk to check INV-T no-write (a real modelelement file in MODEL_STORE)
const CANON_UUID = '0ce4d2fb-4023-4db8-ac2d-4376ce16815c';
const canonFile = path.join(ROOT, 'data/model-store/index', ...CANON_UUID.slice(0, 5).split(''), `${CANON_UUID}.scenario.json`);
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css">`
  + `<style>body{margin:0;background:#0d1117}svg .dm-box-bg{fill:#1e2633;stroke:#7aa2f7;stroke-width:1.5}svg .dm-name{fill:#e6edf3;font:12px system-ui}svg .dm-row{fill:#c0caf5;font:11px monospace}svg .dm-sep{stroke:#30363d}</style>`
  + `</head><body><svg id="surface" width="800" height="600" viewBox="0 0 800 600"></svg></body></html>`;

const FACETS = [
  { label: 'UmlClass', viewKind: 'UmlClass', wantClass: 'dm-box', notFacet: true },
  { label: 'tsClass', viewKind: 'tsClass', wantClass: 'dm-box', tsLens: true },
  { label: 'UmlMethod', viewKind: 'UmlMethod', wantClass: 'dm-facet-method' },
  { label: 'UmlFunction', viewKind: 'UmlFunction', wantClass: 'dm-facet-method' },
  { label: 'UmlUseCase', viewKind: 'UmlUseCase', wantClass: 'dm-facet-usecase', ellipse: true },
];

async function facetRender(browser, vp, tag) {
  const ctx = await browser.newContext({ ...(vp === 'mobile' ? devices['iPhone 12'] : { viewport: { width: 1280, height: 900 } }), ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.route(u => u.pathname === '/facet', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.goto(`${BASE}/facet`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ content: FACET_BUNDLE, type: 'module' });
  await page.waitForFunction(() => !!window.__facet && typeof window.__facet.renderFacet === 'function', { timeout: 8000 }).catch(() => {});
  const per = {};
  for (const f of FACETS) {
    const r = await page.evaluate((f) => {
      const node = { name: 'FooBar', kind: 'class', signature: 'doThing(a: int): bool', attrs: ['x: int', 'y: str'], methods: ['doThing', 'run'], members: [], relations: [] };
      const view = { viewKind: f.viewKind, unit: 'modelelement:u-' + f.label, x: 40, y: 40, w: 180 };
      let svg = ''; try { svg = window.__facet.renderFacet(view, node); } catch (e) { return { err: String(e) }; }
      const surf = document.getElementById('surface'); surf.innerHTML = svg;
      const g = surf.querySelector('g'); const box = g?.getBoundingClientRect();
      return { svgHasClass: new RegExp(f.wantClass).test(svg), tsLens: /«ts»/.test(svg), ellipse: /<ellipse/.test(svg), sig: /doThing/.test(svg), bx: box ? { x: box.x, y: box.y, w: box.width, h: box.height } : null };
    }, f);
    // PIXEL: screenshot the surface, decode in-browser, count PAINTED (non-bg) pixels in the box region
    const painted = await page.evaluate(async ([bx]) => {
      if (!bx || bx.w < 2) return 0;
      const dataUrl = await new Promise(res => { const svg = document.getElementById('surface'); const xml = new XMLSerializer().serializeToString(svg); res('data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)))); });
      const img = new Image(); await new Promise(rr => { img.onload = rr; img.onerror = rr; img.src = dataUrl; });
      const c = document.createElement('canvas'); c.width = 260; c.height = 200; const cx = c.getContext('2d'); cx.drawImage(img, 0, 0);
      const d = cx.getImageData(30, 30, 200, 140).data; let n = 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 40 && (Math.abs(d[i] - 13) + Math.abs(d[i + 1] - 22) + Math.abs(d[i + 2] - 33)) > 40) n++; }
      return n;
    }, [r.bx]);
    if (tag) await page.screenshot({ path: OUT + `${vp}-${f.label}.png` });
    per[f.label] = { structureOk: r.svgHasClass && (f.tsLens ? r.tsLens : true) && (f.ellipse ? r.ellipse : true), paintedPx: painted, painted: painted > 20 };
  }
  await ctx.close();
  return per;
}

async function dataChecks(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => true, { timeout: 3000 }).catch(() => {});
  const mtimeBefore = fs.existsSync(canonFile) ? fs.statSync(canonFile).mtimeMs : 0;
  const R = await page.evaluate(async ([U, DIAG, E]) => {
    const j = async (u) => { try { return await (await fetch(u)).json(); } catch { return null; } };
    const post = async (u, b) => { try { return (await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).ok; } catch { return false; } };
    // INV-T compute-on-read determinism: /api/ior twice byte-identical (canonical merge stable)
    const a = JSON.stringify((await j('/api/ior/' + U))?.unit || {}), b = JSON.stringify((await j('/api/ior/' + U))?.unit || {});
    const invTdeterministic = a === b && a.length > 2;
    const hasCanonical = /canonicalKey|instanceOf/.test(a); // reconcile merged the M1 counterpart facets
    // where-used bidirectional net-zero (R36.2 side-index)
    const viewsOf = async (d) => ((await j('/api/ior/' + d))?.unit?.model?.views || []).map(v => String(v.unit || '').replace('modelelement:', ''));
    const usedInOf = async (u) => ((await j('/api/model/used-in/' + u))?.usedIn || []).map(x => String(x.ref || ''));
    const beforeV = await viewsOf(DIAG);
    const added = await post('/api/model/diagram/add-view', { diagramUuid: DIAG, elementUuid: E });
    const bidiAdd = added && (await viewsOf(DIAG)).includes(E) && (await usedInOf(E)).some(r => r.includes(DIAG));
    const removed = await post('/api/model/diagram/remove-view', { diagramUuid: DIAG, elementUuid: E });
    const remV = await viewsOf(DIAG);
    const bidiRemove = removed && !remV.includes(E) && !(await usedInOf(E)).some(r => r.includes(DIAG));
    const restored = remV.length === beforeV.length;
    return { invTdeterministic, hasCanonical, bidiAdd, bidiRemove, restored };
  }, [CANON_UUID, DIAG, E]);
  const mtimeAfter = fs.existsSync(canonFile) ? fs.statSync(canonFile).mtimeMs : 0;
  R.invTnoWrite = mtimeBefore === mtimeAfter; // compute-on-read NEVER wrote the unit file
  await ctx.close();
  return R;
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const mob = [], desk = []; let data = null;
try {
  for (let i = 1; i <= 3; i++) { mob.push(await facetRender(browser, 'mobile', i === 1)); desk.push(await facetRender(browser, 'desktop', i === 1)); }
  data = await dataChecks(browser);
} finally { await browser.close(); }

console.log(`\n===== S36 canonical-reconcile @390+desktop ${process.env.WK ? 'WebKit' : 'chromium'} DET-3x (served ${servedVersion}) =====`);
console.log(`mobile[0]: ${JSON.stringify(mob[0])}`);
console.log(`desktop[0]: ${JSON.stringify(desk[0])}`);
console.log(`data: ${JSON.stringify(data)}`);
const facetGreen = ['UmlClass', 'tsClass', 'UmlMethod', 'UmlFunction', 'UmlUseCase'].every(f =>
  mob.length === 3 && mob.every(r => r[f]?.structureOk && r[f]?.painted) && desk.every(r => r[f]?.structureOk && r[f]?.painted));
const invT = data.invTdeterministic && data.invTnoWrite && data.hasCanonical;
const bidi = data.bidiAdd && data.bidiRemove && data.restored;
console.log(`\n(2) renderFacet — all 5 facets PAINT (pixel>20) with distinct lens, @390 mobile + desktop: ${facetGreen ? 'GREEN DET-3x' : 'RED'}`);
console.log(`(1) INV-T — /api/ior deterministic + on-disk file NOT written (compute-on-read) + canonical merged: ${invT ? 'GREEN' : 'RED'} (det=${data.invTdeterministic} noWrite=${data.invTnoWrite} canon=${data.hasCanonical})`);
console.log(`(4) where-used BIDIRECTIONAL net-zero (R36.2 side-index): ${bidi ? 'GREEN' : 'RED'}`);
const green = facetGreen && invT && bidi;
console.log('OVERALL S36 canonical-reconcile:', green ? 'GREEN' : 'RED');
console.log('(3) Scenario/Edit→canonical: covered by S35/r365 base-resolve (resolves to the canonical unit uuid) + INV-T no-write above.');
process.exitCode = green ? 0 : 1;
