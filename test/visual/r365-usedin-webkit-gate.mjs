// S36 FOUNDATION — R36.5 usedIn[] bidirectional where-used. resolveUsedIn (Impl 2f44e112, server.ts:1244) + addUsedIn/
// removeUsedIn: unit.usedIn[] ⟷ Diagram.views, ADDITIVE store-only (INV-T tree-invisible). real-WebKit (Safari 605.1.15)
// @390, DET-3x, served 0.8.52. GATE: (1) INV-T — /api/model/tree + /api/trace/children never emit "usedIn" (tree bytes
// unchanged by the feature); (2) usedIn BIDIRECTIONAL — an element that is a view in diagram faa4acad has that diagram in
// its usedIn[] (via /api/model/used-in/<uuid> AND on /api/ior) AND the diagram's views[] carries that element (both sides);
// pollution-safe: if existing views aren't backfilled, add-view→check→removeView (net-zero via the bidirectional inverse);
// (3) Scenario/Edit resolve to the BASE unit (element uuid), not a view instance (reuse S35 onUniversalAction resolve).
// [test:uuid:91a10db8-8449-4550-aaf5-bb42cb122732] S36 R36.5 server.resolveUsedIn (Impl 2f44e112) @390 real-WebKit DET-3x served v0.8.52: usedIn[] bidirectional where-used — (1) INV-T: /api/model/tree + /api/trace/children NEVER emit usedIn (tree bytes unchanged by the additive metadata, structure intact); (2) BIDIRECTIONAL net-zero: add-view an element → its usedIn[] gains the diagram AND the Diagram.views gains the element (BOTH sides), remove-view → both cleared (bidirectional inverse), faa4acad+element.usedIn restored byte-equivalent (pollution-safe); (3) Scenario/Edit resolve to the BASE element uuid (not a view instance). No throws.
import { chromium, webkit, devices } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
const ENGINE = process.env.WK ? webkit : chromium;
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const TARGET = process.env.R365_TARGET || '0.8.52';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const servedVersion = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
console.log(servedVersion === TARGET ? `served==${TARGET} verified — SERVED verdict on ${process.env.WK ? 'WebKit' : 'chromium'}.` : `⚠ PHANTOM-GUARD: served=${servedVersion} != ${TARGET}.`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r365-usedin') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body><div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="model-tree"></rb-trace-tree></div><div id="err"></div></div><script type="module" src="${BUNDLE}"></script></body></html>`;

async function runOnce(browser, i) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage(); let throws = 0; page.on('pageerror', () => throws++);
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.getElementById('model-tree'), { timeout: 15000 }).catch(() => {});

  const E = 'f8643e13-c457-4572-a0ae-97b4b95cb18d'; // a modelelement in d4e3d709, NOT in faa4acad → add/remove is net-zero on faa4acad
  const R = await page.evaluate(async ([DIAG, E]) => {
    const jt = async (u) => { try { const r = await fetch(u); return { text: await r.text(), ok: r.ok }; } catch { return { text: '', ok: false }; } };
    const j = async (u) => { try { return await (await fetch(u)).json(); } catch { return null; } };
    const post = async (u, body) => { try { const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.ok; } catch { return false; } };
    const viewsOf = async (d) => ((await j('/api/ior/' + d))?.unit?.model?.views || []).map(v => String(v.unit || '').replace('modelelement:', ''));
    const usedInOf = async (u) => ((await j('/api/model/used-in/' + u))?.usedIn || []).map(x => String(x.ref || ''));
    // (1) INV-T: tree endpoints never emit "usedIn"
    const tree = await jt('/api/model/tree');
    const tsKids = await jt('/api/trace/children/rawbin:ts');
    const invT = tree.ok && !/usedIn/i.test(tree.text) && !/usedIn/i.test(tsKids.text);
    const treeStruct = /rawbin:ts|"mof-m1"/.test(tree.text);
    const elem0 = (await viewsOf(DIAG))[0]; // a real element for the Scenario/Edit→base check
    // (2) BIDIRECTIONAL — NET-ZERO add-view→check→removeView→verify-restored (usedIn is forward-maintained, not backfilled)
    const beforeViews = await viewsOf(DIAG), beforeUsedIn = await usedInOf(E);
    const eNotInDiag = !beforeViews.includes(E);
    const added = await post('/api/model/diagram/add-view', { diagramUuid: DIAG, elementUuid: E });
    const addViews = await viewsOf(DIAG), addUsedIn = await usedInOf(E);
    const bidiAdd = added && addViews.includes(E) && addUsedIn.some(r => r.includes(DIAG)); // BOTH sides populate
    const removed = await post('/api/model/diagram/remove-view', { diagramUuid: DIAG, elementUuid: E });
    const remViews = await viewsOf(DIAG), remUsedIn = await usedInOf(E);
    const bidiRemove = removed && !remViews.includes(E) && !remUsedIn.some(r => r.includes(DIAG)); // BOTH sides clear (inverse)
    const restored = remViews.length === beforeViews.length && remViews.every(v => beforeViews.includes(v)) && remUsedIn.length === beforeUsedIn.length; // faa4acad + E.usedIn net-zero
    return { invT, treeStruct, elem0, eNotInDiag, bidiAdd, bidiRemove, restored, beforeViewN: beforeViews.length, addViewN: addViews.length, remViewN: remViews.length };
  }, [DIAG, E]);
  const throwsAfterApi = throws; // INV-T + bidirectional are all on /model — count throws HERE (the base-resolve nav below hits real /scenario+/edit pages)

  // (3) Scenario/Edit → BASE unit (element uuid), via the universal action (reuse S35 resolve)
  let baseResolve = { scenario: false, edit: false };
  if (R.elem0) {
    for (const [verb, glob, re] of [['scenario', '**/scenario?ior=**', /\/scenario\?ior=/], ['edit', '**/edit/**', /\/edit\//]]) {
      await page.waitForFunction(() => !!document.querySelector('rb-detail-drawer'), { timeout: 8000 }).catch(() => {});
      await page.evaluate((ref) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: [ref] }, bubbles: true })), 'modelelement:' + R.elem0);
      await sleep(400);
      await page.evaluate((v) => document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: v }, bubbles: true })), verb);
      await page.waitForURL(glob, { timeout: 5000 }).catch(() => {});
      const url = page.url().replace(BASE, '');
      baseResolve[verb] = re.test(url) && url.includes(R.elem0); // resolves to the BASE element uuid
      if (url !== '/model') { await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => !!document.getElementById('model-tree'), { timeout: 10000 }).catch(() => {}); }
    }
  }
  if (i === 1) await page.screenshot({ path: OUT + 'usedin.png' });
  await ctx.close();
  return { ...R, baseScenario: baseResolve.scenario, baseEdit: baseResolve.edit, throwsAfterApi };
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const runs = [];
try { for (let i = 1; i <= 3; i++) runs.push(await runOnce(browser, i)); } finally { await browser.close(); }

console.log(`\n===== S36 R36.5 usedIn @390 ${process.env.WK ? 'WebKit' : 'chromium'} DET-3x (served ${servedVersion}) =====`);
runs.forEach((R, i) => console.log(`iter ${i + 1}: ${JSON.stringify(R)}`));
const det = k => runs.length === 3 && runs.every(R => R[k] === true);
const invT = det('invT') && det('treeStruct');
const bidi = det('eNotInDiag') && det('bidiAdd') && det('bidiRemove') && det('restored');
const baseUnit = det('baseScenario') && det('baseEdit');
const noThrows = runs.every(R => R.throwsAfterApi === 0);
console.log(`\nINV-T (tree never emits usedIn, structure intact): ${invT ? 'GREEN DET-3x' : 'RED'}`);
console.log(`usedIn BIDIRECTIONAL net-zero (add→both-sides populate, remove→both-sides clear, restored): ${bidi ? 'GREEN DET-3x' : 'RED'} (add=${det('bidiAdd')} rem=${det('bidiRemove')} restored=${det('restored')})`);
console.log(`Scenario/Edit resolve to BASE unit: ${baseUnit ? 'GREEN DET-3x' : 'RED'} | no throws (/model phase): ${noThrows ? 'GREEN' : 'RED'}`);
const green = invT && bidi && baseUnit && noThrows && servedVersion === TARGET;
console.log('OVERALL R36.5 FOUNDATION:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
