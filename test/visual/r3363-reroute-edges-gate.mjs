// R33.6.3 — INDEPENDENT @390 component-harness gate (expert skipped self-verify → authoritative). DET-3x.
// INV-R1 reroute-connectors-on-move: moving a box → rerouteEdges (Impl 83b9922b) recomputes BOTH endpoints (x1,y1,x2,y2)
// of every .dm-edge whose data-rel-from/to == the moved box's modelelement → the connector LINES follow LIVE, no stale
// line at the old anchor. PLANTED-DEFECT: edges NOT connected to the moved box are UNTOUCHED.
// Drive the box move via REAL in-page PointerEvents (r3362 technique: Playwright synthetic mouse doesn't engage the SVG
// setPointerCapture drag). Mount rb-diagram-detail @390 iPhone-12 (component-harness). Pollution-safe (byte-restore).
// Client bundle = committed HEAD build (fd31ebccc, v0.8.24); served SW rawbin-v0.8.24 (phantom-guard: gate the BUNDLE). node22.
// [test:uuid:78535548-a18b-481c-a988-1f1253f42775] R33.6.3 RbDiagramDetail.rerouteEdges (Impl 83b9922b) @390 DET-3x: moving a box recomputes both
// endpoints (x1,y1,x2,y2) of every connected .dm-edge (line follows LIVE, no stale) + planted-bite (unconnected edges
// untouched). Independent of the expert oracle; in-page PointerEvent drag (r3362 technique).
import fs from 'node:fs'; import path from 'node:path';
import { chromium, webkit, devices } from '@playwright/test';
const ENGINE = process.env.WK ? webkit : chromium; // R33 WebKit sweep: WK=1 -> real Safari @390
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const DFILE = path.join(ROOT, 'data/model-store/index', ...DIAG.slice(0, 5).split(''), `${DIAG}.scenario.json`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r3363') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASELINE = fs.readFileSync(DFILE, 'utf8');

async function mount(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail'), { timeout: 15000 }).catch(() => {});
  await page.evaluate((u) => { document.body.style.margin = '0'; document.body.innerHTML = ''; const d = document.createElement('rb-diagram-detail'); d.id = 'dg'; d.setAttribute('ref', `diagram:${u}`); d.setAttribute('uuid', u); d.style.cssText = 'display:block;position:fixed;inset:0;background:#0d1117'; document.body.appendChild(d); }, DIAG);
  await sleep(1500);
  return { ctx, page };
}
// edges keyed by from|to → [x1,y1,x2,y2]; boxes → screen center + modelelement uuid
const scene = (page) => page.evaluate(() => {
  const strip = s => (s || '').replace(/^modelelement:/, '');
  const edges = [...document.querySelectorAll('#dg .dm-edge')].map(l => ({ from: strip(l.getAttribute('data-rel-from')), to: strip(l.getAttribute('data-rel-to')), c: ['x1', 'y1', 'x2', 'y2'].map(a => l.getAttribute(a)).join(',') }));
  const boxes = [...document.querySelectorAll('#dg .dm-box')].map(b => { const r = b.getBoundingClientRect(); return { uuid: (b.getAttribute('data-ref') || '').replace(/^modelelement:/, ''), cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; });
  return { edges, boxes };
});

async function runOnce(browser, i) {
  fs.writeFileSync(DFILE, BASELINE);
  const { ctx, page } = await mount(browser);
  const s0 = await scene(page);
  if (!s0.edges.length) { await ctx.close(); return { setup: false }; }
  // pick the box that has BOTH connected AND unconnected edges (so the bite is non-vacuous)
  const pick = s0.boxes.map(b => { const conn = s0.edges.filter(e => e.from === b.uuid || e.to === b.uuid).length; return { b, conn, unconn: s0.edges.length - conn }; }).filter(x => x.conn > 0).sort((a, b) => Math.min(b.conn, b.unconn) - Math.min(a.conn, a.unconn))[0];
  const box = pick.b;
  const connBefore = s0.edges.filter(e => e.from === box.uuid || e.to === box.uuid).map(e => e.c);
  const unconnBefore = s0.edges.filter(e => e.from !== box.uuid && e.to !== box.uuid).map(e => e.c);

  // move the box by (+90,+70) via REAL in-page PointerEvents → rerouteEdges fires live during the drag
  await page.evaluate(({ ux, uy }) => new Promise((resolve) => {
    const g = document.querySelector(`#dg .dm-box[data-ref="modelelement:${ux}"]`), surf = document.querySelector('#dg .dm-surface');
    const r = g.getBoundingClientRect(), bx = r.x + r.width / 2, by = r.y + r.height / 2;
    const ev = (t, x, y, tgt) => tgt.dispatchEvent(new PointerEvent(t, { pointerId: 1, clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: 'touch' }));
    ev('pointerdown', bx, by, g);
    let s = 0; const tick = () => { s++; ev('pointermove', bx + 90 * s / 10, by + 70 * s / 10, surf); if (s < 10) requestAnimationFrame(tick); else { ev('pointerup', bx + 90, by + 70, surf); resolve(); } };
    requestAnimationFrame(tick);
  }), { ux: box.uuid, uy: 0 });
  await sleep(500);
  if (i === 1) await page.screenshot({ path: OUT + '01-reroute.png' });
  const s1 = await scene(page);
  const connAfter = s1.edges.filter(e => e.from === box.uuid || e.to === box.uuid).map(e => e.c);
  const unconnAfter = s1.edges.filter(e => e.from !== box.uuid && e.to !== box.uuid).map(e => e.c);

  await ctx.close();
  const connChanged = connBefore.length > 0 && connBefore.every((c, k) => c !== connAfter[k]);      // every connected edge recomputed
  const unconnSame = unconnBefore.length > 0 && unconnBefore.every((c, k) => c === unconnAfter[k]);  // unconnected edges untouched (bite)
  return { setup: true, edges: s0.edges.length, box: box.uuid.slice(0, 8), conn: pick.conn, unconn: pick.unconn, connChanged, unconnSame };
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const runs = [];
try { for (let i = 1; i <= 3; i++) runs.push(await runOnce(browser, i)); }
finally { await browser.close(); fs.writeFileSync(DFILE, BASELINE); console.log(`CLEANUP: ${DIAG.slice(0, 8)} restored=${fs.readFileSync(DFILE, 'utf8') === BASELINE}`); }

console.log('\n===== R33.6.3 reroute-connectors-on-move @390 iPhone-12 (DET-3x) =====');
runs.forEach((R, i) => console.log(`iter ${i + 1}: ${JSON.stringify(R)}`));
const setupOk = runs.every(R => R.setup);
const reroute = setupOk && runs.every(R => R.connChanged === true);
const bite = setupOk && runs.every(R => R.unconnSame === true);
console.log(`\nINV-R1 reroute (connected edges follow the moved box, no stale): ${reroute ? 'GREEN DET-3x' : 'RED'}`);
console.log(`PLANTED-DEFECT bite (unconnected edges untouched): ${bite ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.6.3:', reroute && bite ? 'GREEN DET-3x' : (setupOk ? 'RED' : 'RED (setup: no edges in diagram)'));
process.exitCode = reroute && bite ? 0 : 1;
