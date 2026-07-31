// R33.7.2 UC1 addAutoRelationships — RbDiagramDetail.buildEdges (Impl 8c68b925) @390 COMPONENT-harness, DET-3x independent.
// AC: adding an element to a diagram → buildEdges AUTO-WIRES its edges to the EXISTING related boxes (assert the SVG .dm-edge
// RENDERS, not just refresh-fires). Distinct from the r372 discover Test (which asserts refresh-FIRES; add-view is mocked there
// so no real edge renders). Here: mount rb-diagram-detail(faa4acad, 4 boxes / 2 edges) and INJECT one extra view — element
// c2fca9c2 (a real relatedFrom-neighbor of the existing box 6b9bf49f) — into the diagram's /api/ior READ. buildEdges must then
// render a NEW .dm-edge between c2fca9c2 and 6b9bf49f (edgeCount 2→3). Control (no inject) = 2 edges, no c2fca9c2 edge → the +1
// edge IS the auto-wire. Pollution-safe BY CONSTRUCTION: only the diagram READ is modified (no add-view POST, ZERO writes).
// [test:uuid:2f6a1c3e-9b47-4d82-a5e1-0c7f3d61b9a4] R33.7.2 UC1 RbDiagramDetail.buildEdges (Impl 8c68b925) @390 DET-3x: an added
// element's view → its edge to an existing related box auto-renders (.dm-edge data-rel, count 2→3); control 2 edges (no fabricate).
import fs from 'node:fs'; import path from 'node:path';
import { chromium, devices } from '@playwright/test';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7', ADD = 'c2fca9c2-5b77-4a1f-aae2-cf9cdf0c981c', EXISTING = '6b9bf49f';
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r372b-edges') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runOnce(browser, i, { inject }) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  // modify ONLY the diagram's own /api/ior read (append a view); element reads pass through → real relationships for buildEdges
  await page.route(`**/api/ior/ior:instance:${DIAG}`, async route => {
    const resp = await route.fetch();
    let j; try { j = await resp.json(); } catch { return route.fulfill({ response: resp }); }
    if (inject && j?.unit?.model?.views) j.unit.model.views.push({ unit: `modelelement:${ADD}`, x: 250, y: 320, viewKind: 'class' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) });
  });
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail'), { timeout: 15000 }).catch(() => {});
  await page.evaluate((u) => { document.body.innerHTML = ''; const d = document.createElement('rb-diagram-detail'); d.id = 'dg'; d.setAttribute('ref', `diagram:${u}`); d.setAttribute('uuid', u); d.style.cssText = 'position:fixed;inset:0;background:#0d1117'; document.body.appendChild(d); }, DIAG);
  await page.waitForFunction(() => document.querySelectorAll('#dg .dm-box').length > 0, { timeout: 12000 }).catch(() => {});
  await sleep(1600); // let render() resolve all views' /api/ior + buildEdges wire the edges
  const info = await page.evaluate((add) => {
    const boxes = [...document.querySelectorAll('#dg .dm-box')].length;
    const edges = [...document.querySelectorAll('#dg .dm-edge')].map(x => ({ from: x.getAttribute('data-rel-from') || '', to: x.getAttribute('data-rel-to') || '' }));
    return { boxes, edgeCount: edges.length, hasAddedEdge: edges.some(e => e.from.includes(add) || e.to.includes(add)) };
  }, ADD);
  if (i === 1) await page.screenshot({ path: OUT + (inject ? 'injected' : 'control') + '.png' });
  await ctx.close();
  return info;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const withAdd = [], control = [];
try {
  for (let i = 1; i <= 3; i++) withAdd.push(await runOnce(browser, i, { inject: true }));
  control.push(await runOnce(browser, 1, { inject: false }));
} finally { await browser.close(); }

console.log('\n===== R33.7.2 UC1 buildEdges auto-wire @390 iPhone-12 (DET-3x) =====');
withAdd.forEach((R, i) => console.log(`add-view iter ${i + 1}: ${JSON.stringify(R)}`));
console.log(`control (no add): ${JSON.stringify(control[0])}`);
// GREEN: adding c2fca9c2's view → box 5, a NEW .dm-edge to the existing related box 6b9bf49f renders (edgeCount 2→3, hasAddedEdge)
const green3 = withAdd.length === 3 && withAdd.every(R => R.boxes === 5 && R.edgeCount === 3 && R.hasAddedEdge === true);
const controlOk = control[0] && control[0].boxes === 4 && control[0].edgeCount === 2 && control[0].hasAddedEdge === false; // baseline: no fabricated edge
const green = green3 && controlOk;
console.log(`\nAUTO-WIRE (added element → its edge auto-renders, 2→3): ${green3 ? 'GREEN DET-3x' : 'RED'}`);
console.log(`CONTROL (no add → 2 edges, no fabricated ${EXISTING}↔${ADD.slice(0, 8)} edge): ${controlOk ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.7.2 UC1 buildEdges:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
