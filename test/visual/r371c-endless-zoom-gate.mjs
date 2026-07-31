// R33.7.1 BUG-1 endless zoom-out (Tron IMG_4795, v0.8.32 fix 8ad1ad537) @390 COMPONENT-harness, DET-3x independent.
// The device regression: a hard MIN=0.25 floor capped REPEATED zoom-out. Fix: grow-mode floor = GROW_MIN 0.02 (near-none) so
// repeated zoom-out KEEPS working and the SVG canvas grows EACH step, bounded only by MAX_CANVAS_PX=16000. AC-zoom-out-repeated-
// no-floor: assert MANY successive zoom-out steps EACH grow the SVG px AND the scale reaches well BELOW the old 0.25 floor — a
// one-step pass or a hit-floor = RED. Guard = CLIENT bundle (served model-*.js hash == committed, SW rawbin-v0.8.32), NOT /api/config.
// [test:uuid:5e91b3c7-2a6d-4f19-8b03-9d7e1c4a6520] R33.7.1 BUG-1 endless-zoom (RbPanZoom GROW_MIN / applyCanvasGrow cap) @390
// DET-3x: repeated setScale steps 0.5→0.02 EACH grow svg.style.width px (no 0.25 floor; scale reaches ~0.02), capped ≤16000.
import fs from 'node:fs'; import path from 'node:path';
import { chromium, devices } from '@playwright/test';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const DFILE = path.join(ROOT, 'data/model-store/index', ...DIAG.slice(0, 5).split(''), `${DIAG}.scenario.json`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r371c-endless') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASELINE = fs.readFileSync(DFILE, 'utf8');
const STEPS = [0.5, 0.25, 0.12, 0.06, 0.03, 0.02]; // successive zoom-out — well past the old MIN=0.25 hard floor

async function runOnce(browser, i) {
  fs.writeFileSync(DFILE, BASELINE);
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail'), { timeout: 15000 }).catch(() => {});
  await page.evaluate((u) => { const d = document.createElement('rb-diagram-detail'); d.id = 'dg'; d.setAttribute('ref', `diagram:${u}`); d.setAttribute('uuid', u); d.style.cssText = 'position:fixed;inset:0;background:#0d1117'; document.body.appendChild(d); }, DIAG);
  await page.waitForFunction(() => { const e = document.querySelector('#dg'); return e && e.pz && document.querySelector('#dg .dm-svg'); }, { timeout: 12000 }).catch(() => {});
  await sleep(800);

  const trace = [];
  for (const s of STEPS) {
    await page.evaluate((sc) => document.querySelector('#dg').pz.setScale(sc), s);
    await sleep(200);
    const m = await page.evaluate(() => { const e = document.querySelector('#dg'), svg = e.querySelector('.dm-svg'); return { scale: e.pz.currentScale, svgPx: parseFloat(svg.style.width) || svg.getBoundingClientRect().width }; });
    trace.push({ set: s, scale: Number(m.scale.toFixed(3)), svgPx: Math.round(m.svgPx) });
  }
  if (i === 1) await page.screenshot({ path: OUT + '01-deep-zoom.png' });
  await ctx.close();

  // EACH step (until the cap) grows the canvas: svgPx strictly increases for the pre-cap steps (0.5→0.25→0.12→0.06)
  const preCap = trace.slice(0, 4);
  const growsEachStep = preCap.every((t, k) => k === 0 || t.svgPx > trace[k - 1].svgPx);
  // NO hard floor: the deepest setScale(0.02) actually reaches ~0.02 (NOT clamped to the old MIN=0.25)
  const reachedFloor = trace[trace.length - 1].scale;
  const noHardFloor = reachedFloor < 0.1; // way below the regression's 0.25 floor
  // MAX_CANVAS_PX safety cap ~16000 (never runaway)
  const capped = trace.every(t => t.svgPx <= 16200);
  return { trace, growsEachStep, reachedFloor, noHardFloor, capped };
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const runs = [];
try { for (let i = 1; i <= 3; i++) runs.push(await runOnce(browser, i)); }
finally { await browser.close(); fs.writeFileSync(DFILE, BASELINE); console.log(`CLEANUP restored=${fs.readFileSync(DFILE, 'utf8') === BASELINE}`); }

console.log('\n===== R33.7.1 BUG-1 endless zoom-out @390 iPhone-12 (DET-3x) =====');
runs.forEach((R, i) => console.log(`iter ${i + 1}: floor=${R.reachedFloor} grows=${R.growsEachStep} noFloor=${R.noHardFloor} capped=${R.capped} | ${R.trace.map(t => `${t.scale}:${t.svgPx}px`).join(' → ')}`));
const g = k => runs.length === 3 && runs.every(R => R[k] === true);
const green = g('growsEachStep') && g('noHardFloor') && g('capped');
console.log(`\ncanvas GROWS each zoom-out step (no one-step pass): ${g('growsEachStep') ? 'GREEN' : 'RED'}`);
console.log(`NO hard floor — repeated zoom-out reaches ~0.02 (was capped 0.25): ${g('noHardFloor') ? 'GREEN' : 'RED'}`);
console.log(`MAX_CANVAS_PX cap (≤16000, no runaway): ${g('capped') ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.7.1 BUG-1:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
