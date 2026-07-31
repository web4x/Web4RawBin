// R33.6.2 — INDEPENDENT @390 component-harness gate (expert skipped self-verify → this is authoritative). DET-3x.
// INV-D1 suppress-page-scroll-on-drag: .dm-box has touch-action:none (a touch-drag moves the box, never scrolls the page).
// INV-D2 diagram-EDGE-autoscroll: dragging a selected box to within EDGE(32px) of the surface edge → an rAF loop calls
//   RbPanZoom.panBy (Impl 7dd375ac) → the CANVAS pans (content transform changes) even though gesture-pan is DISABLED while
//   a box is selected (R33.5 item3) → programmatic pan is the distinguishing behavior. Box follows the pointer.
// PLANTED-DEFECT: a box-drag kept in the CENTER (far from any edge) does NOT autoscroll (content transform unchanged).
// Mount rb-diagram-detail @390 iPhone-12 (component-harness, NOT authed /model). Pollution-safe (byte-restore). Client
// bundle = committed HEAD build (619991418, v0.8.23) — served SW v0.8.23 (phantom-guard: gate the BUNDLE not /api/config). node22.
// [test:uuid:b826d2a9-aab8-4d0c-8305-23d24f5f0454] R33.6.2 RbPanZoom.panBy (Impl 7dd375ac) @390 DET-3x: INV-D1 .dm-box
// touch-action:none (drag never scrolls the page) + INV-D2 edge-autoscroll (box-drag into the 32px surface margin → the
// rAF loop calls panBy → the canvas PANS while gesture-pan is OFF/box-selected; panBy called 20×, content transform
// changes) + planted-bite (center drag → no autoscroll). Independent of the expert's oracle. ★ TECHNIQUE (banked): a
// Playwright synthetic MOUSE does NOT engage an SVG setPointerCapture drag on a touch-context → dispatch REAL in-page
// PointerEvents (pointerdown ON the box so e.target→closest('.dm-box') sets drag; pointermoves on .dm-surface into the
// margin drive the rAF autoscroll). Also: edge-autoscroll needs pan room → zoom>1 first (at scale 1 clamp pins it).
import fs from 'node:fs'; import path from 'node:path';
import { chromium, devices } from '@playwright/test';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const DFILE = path.join(ROOT, 'data/model-store/index', ...DIAG.slice(0, 5).split(''), `${DIAG}.scenario.json`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r3362') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASELINE = fs.readFileSync(DFILE, 'utf8');

async function mount(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail'), { timeout: 15000 }).catch(() => {});
  await page.evaluate((u) => {
    document.body.style.margin = '0'; document.body.innerHTML = '';
    const d = document.createElement('rb-diagram-detail');
    d.id = 'dg'; d.setAttribute('ref', `diagram:${u}`); d.setAttribute('uuid', u);
    d.style.cssText = 'display:block;position:fixed;inset:0;background:#0d1117';
    document.body.appendChild(d);
  }, DIAG);
  await sleep(1500);
  return { ctx, page };
}
// zoom in so content > viewport → panBy has room (at scale=1 clamp pins it; R33.7.1 zoom-out isn't built yet)
const zoomIn = (page) => page.evaluate(() => { const s = document.querySelector('#dg .dm-surface'); for (let k = 0; k < 5; k++) s.dispatchEvent(new WheelEvent('wheel', { deltaY: -160, clientX: 195, clientY: 430, bubbles: true, cancelable: true })); });
const state = (page) => page.evaluate(() => {
  const b = document.querySelector('#dg .dm-box'); const r = b.getBoundingClientRect();
  return { boxTA: getComputedStyle(b).touchAction, cx: r.x + r.width / 2, cy: r.y + r.height / 2,
    t: getComputedStyle(document.querySelector('#dg .dm-content')).transform };
});

async function runOnce(browser, i) {
  fs.writeFileSync(DFILE, BASELINE);
  const { ctx, page } = await mount(browser);
  const s0 = await state(page);
  const invD1 = s0.boxTA === 'none';                                  // INV-D1: .dm-box touch-action:none

  // INV-D2: zoom in (pan room) → select box (pan disabled) → drag toward the LEFT surface edge (x<32) + HOLD → rAF panBy pans
  await zoomIn(page); await sleep(400);
  const bz = await state(page);                                      // box position AFTER zoom
  const preEdge = bz.t;
  await page.evaluate(() => { const el = document.querySelector('#dg'); const pz = el.pz || el._pz; window.__pb = 0; let pm = 0; document.querySelector('#dg .dm-surface').addEventListener('pointermove', () => pm++, true); window.__pm = () => pm; const o = pz.panBy.bind(pz); pz.panBy = (dx, dy) => { window.__pb++; return o(dx, dy); }; }); // non-mutating: count panBy + surface pointermoves
  // Drive the drag via REAL in-page PointerEvents (Playwright synthetic mouse doesn't engage the SVG pointer-capture drag).
  // pointerdown ON the box (e.target=box → closest('.dm-box') sets drag), pointermoves into the left margin → autoscroll rAF.
  const dbg = await page.evaluate(() => new Promise((resolve) => {
    const surf = document.querySelector('#dg .dm-surface'), box = document.querySelector('#dg .dm-box');
    const br = box.getBoundingClientRect(), bx = br.x + br.width / 2, by = br.y + br.height / 2;
    const ev = (t, x, y, tgt) => tgt.dispatchEvent(new PointerEvent(t, { pointerId: 1, clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: 'touch' }));
    ev('pointerdown', bx, by, box);
    for (let s = 1; s <= 6; s++) ev('pointermove', Math.round(bx - (bx - 12) * s / 6), by, surf);
    let n = 0; const tick = () => { ev('pointermove', 12, by, surf); if (++n < 20) requestAnimationFrame(tick); else { ev('pointerup', 12, by, surf); resolve({ panBy: window.__pb }); } };
    requestAnimationFrame(tick);
  }));
  if (i === 1) console.log('  DBG drag (in-page pointer):', JSON.stringify(dbg));
  await sleep(150);
  const postEdge = (await state(page)).t;
  const invD2_autoscroll = postEdge !== preEdge;                      // canvas panned via panBy while box-selected (gesture-pan off)
  if (i === 1) await page.screenshot({ path: OUT + '01-edge-autoscroll.png' });

  // PLANTED-DEFECT: a drag kept in the CENTER (far from edges) → NO autoscroll (content transform unchanged)
  fs.writeFileSync(DFILE, BASELINE); await page.evaluate((u) => { const d = document.querySelector('#dg'); d.setAttribute('ref', `diagram:${u}`); }, DIAG); await sleep(600);
  await zoomIn(page); await sleep(400);                              // same zoom precondition as INV-D2 (fair control)
  const c = await state(page);
  await page.mouse.click(c.cx, c.cy); await sleep(250);
  const preC = (await state(page)).t;
  await page.mouse.move(c.cx, c.cy); await page.mouse.down();
  await page.mouse.move(195, 430, { steps: 6 });                      // dead-center (far from all edges) → no margin → no autoscroll
  await sleep(650);
  const postC = (await state(page)).t;
  await page.mouse.up(); await sleep(150);
  const bite = postC === preC;                                        // center drag did NOT pan the canvas

  await ctx.close();
  return { invD1, boxTA: s0.boxTA, invD2_autoscroll, preEdge: preEdge.slice(0, 18), postEdge: postEdge.slice(0, 18), bite };
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const runs = [];
try { for (let i = 1; i <= 3; i++) runs.push(await runOnce(browser, i)); }
finally { await browser.close(); fs.writeFileSync(DFILE, BASELINE); console.log(`CLEANUP: ${DIAG.slice(0, 8)} restored=${fs.readFileSync(DFILE, 'utf8') === BASELINE}`); }

console.log('\n===== R33.6.2 suppress-scroll + edge-autoscroll @390 iPhone-12 (DET-3x) =====');
runs.forEach((R, i) => console.log(`iter ${i + 1}: ${JSON.stringify(R)}`));
const det = k => runs.length === 3 && runs.every(R => R[k] === true);
const d1 = det('invD1'), d2 = det('invD2_autoscroll'), bite = det('bite');
console.log(`\nINV-D1 suppress-page-scroll (.dm-box touch-action:none): ${d1 ? 'GREEN DET-3x' : 'RED'}`);
console.log(`INV-D2 edge-autoscroll (drag to edge → panBy pans canvas): ${d2 ? 'GREEN DET-3x' : 'RED'}`);
console.log(`PLANTED-DEFECT bite (center drag → no autoscroll): ${bite ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.6.2:', d1 && d2 && bite ? 'GREEN DET-3x' : 'RED');
process.exitCode = d1 && d2 && bite ? 0 : 1;
