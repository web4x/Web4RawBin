// R33.5 diagram-UX-polish @390 GATE — DET-3x, Tron-real-interaction, screenshot+pixel, planted-defect (NOT loads).
// Covers 3 of the 4 R33.5 Impls (the cleanly-gateable, pollution-safe ones):
//   item2 RbDiagramDetail.boxSelect (bde57b1a): click a box → .dm-box-selected + 'rb-tree-reveal' fires, diagram STAYS
//         (replaceWith REMOVED), NO 'selection-changed' for the box (class-detail only on tree-click).
//   item3 RbPanZoom.setEnabled (44f3ddd3): zoom>1 → EMPTY-canvas drag PANS; SELECTED-box drag MOVES the box, NO pan.
//   item4 server.pumlChildren (9eb2c39c): /api/trace/children/rawbin:puml enumerates the 55 EXISTING source .puml as
//         puml-src itemviews (LIVE served endpoint = served-verification). PLANTED-DEFECT control: a bogus ref ≠ 55.
// item1 ModelView.addDiagram (ffdd9347) is behind the FEATURE-GATED /model page (requireFeatureAccessHttp
//   'Model-Driven Code Quality' → SystemTester 403) — NOT gated here; flagged to req/PO (needs a pollution-safe
//   feature-grant OR Tron device-verify). See report.
// Pollution-safe: byte-backup/restore the driven diagram unit; item4 is read-only. @390 iPhone-12-class. node22.
// [test:uuid:68165531-d8d9-43e9-922f-83e8bfb711b1] R33.5 item2 RbDiagramDetail.boxSelect (Impl bde57b1a) — @390 click a box → .dm-box-selected + rb-tree-reveal, diagram STAYS (no replaceWith), no selection-changed for the box; GREEN DET-3x.
// [test:uuid:fc65297a-3daa-4d74-abda-d72284936d51] R33.5 item3 RbPanZoom.setEnabled (Impl 44f3ddd3) — @390 zoom>1: empty-canvas drag PANS, selected-box drag MOVES the box with NO pan (setEnabled(false) while selected); GREEN DET-3x.
// [test:uuid:6b647166-0c8d-4496-b163-aac793f6accb] R33.5 item4 server.pumlChildren (Impl 9eb2c39c) — LIVE served /api/trace/children/rawbin:puml enumerates the 55 source .puml as puml-src itemviews; bogus ref ≠ 55 (planted control); GREEN DET-3x.
import fs from 'node:fs'; import path from 'node:path';
import { chromium, devices } from '@playwright/test';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const DFILE = path.join(ROOT, 'data/model-store/index', ...DIAG.slice(0, 5).split(''), `${DIAG}.scenario.json`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r335-390') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASELINE = fs.readFileSync(DFILE, 'utf8');
const IPHONE = devices['iPhone 12'];

async function mount(browser) {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' }); // REAL mobile: isMobile+dSF3+mobile-UA
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail'), { timeout: 15000 }).catch(() => {});
  await page.evaluate((u) => {
    document.body.style.margin = '0'; document.body.innerHTML = '';
    window.__ev = { reveal: [], sel: [] };
    document.addEventListener('rb-tree-reveal', e => window.__ev.reveal.push(e.detail?.ref));
    document.addEventListener('selection-changed', e => window.__ev.sel.push((e.detail?.selected || []).join()));
    const d = document.createElement('rb-diagram-detail');
    d.id = 'dg'; d.setAttribute('ref', `diagram:${u}`); d.setAttribute('uuid', u);
    d.style.cssText = 'display:block;position:fixed;inset:0;background:#0d1117';
    document.body.appendChild(d);
  }, DIAG);
  await sleep(1500);
  return { ctx, page };
}
const boxInfo = (page) => page.evaluate(() => {
  const b = document.querySelector('#dg .dm-box'); if (!b) return null;
  const r = b.getBoundingClientRect();
  const t = getComputedStyle(document.querySelector('#dg .dm-content')).transform;
  return { ref: b.getAttribute('data-ref'), selected: b.classList.contains('dm-box-selected'),
    cx: r.x + r.width / 2, cy: r.y + r.height / 2, svg: !!document.querySelector('#dg .dm-svg'),
    reveal: window.__ev.reveal.slice(), sel: window.__ev.sel.slice(), contentTransform: t };
});

async function runOnce(browser, i) {
  fs.writeFileSync(DFILE, BASELINE);
  const { ctx, page } = await mount(browser);
  const R = {};
  const b0 = await boxInfo(page);
  R.item2_control_unselectedFirst = b0 && b0.selected === false; // planted-defect control: box NOT selected pre-click

  // ── item2 (bde57b1a): click a box → local select + reveal, diagram STAYS, no selection-changed for the box ──
  await page.mouse.click(b0.cx, b0.cy); await sleep(400);
  const b1 = await boxInfo(page);
  if (i === 1) await page.screenshot({ path: OUT + '01-box-selected.png' });
  R.item2_selected = b1.selected === true;
  R.item2_diagramStays = b1.svg === true && b0.svg === true;                 // .dm-svg present before AND after (no replaceWith)
  R.item2_revealed = b1.reveal.some(r => (r || '').includes(b0.ref.replace('modelelement:', '')));
  R.item2_noSelectionChanged = !b1.sel.some(s => s.includes(b0.ref.replace('modelelement:', '')));

  // ── item3 (44f3ddd3): zoom>1, EMPTY-drag PANS, SELECTED-box-drag MOVES-no-pan ──
  await page.evaluate(() => { const s = document.querySelector('#dg .dm-surface'); for (let k = 0; k < 4; k++) s.dispatchEvent(new WheelEvent('wheel', { deltaY: -140, clientX: 195, clientY: 450, bubbles: true, cancelable: true })); });
  await sleep(300);
  const empty = await page.evaluate(() => {
    for (let y = 80; y < 820; y += 40) for (let x = 40; x < 350; x += 40) {
      const el = document.elementFromPoint(x, y);
      if (el && el.closest('#dg') && !el.closest('.dm-box') && !el.closest('.dm-edge')) return { x, y };
    }
    return { x: 40, y: 100 };
  });
  await page.mouse.click(empty.x, empty.y); await sleep(200);              // deselect → pan re-enabled (setEnabled(true))
  const preEmpty = await page.evaluate(() => getComputedStyle(document.querySelector('#dg .dm-content')).transform);
  await page.mouse.move(empty.x, empty.y); await page.mouse.down(); await page.mouse.move(empty.x + 55, empty.y + 40, { steps: 8 }); await page.mouse.up(); await sleep(300);
  const postEmpty = await page.evaluate(() => getComputedStyle(document.querySelector('#dg .dm-content')).transform);
  R.item3_emptyDragPans = preEmpty !== postEmpty;
  if (i === 1) await page.screenshot({ path: OUT + '02-empty-drag-pans.png' });
  const bb = await boxInfo(page);
  const preSel = await page.evaluate(() => getComputedStyle(document.querySelector('#dg .dm-content')).transform);
  await page.mouse.move(bb.cx, bb.cy); await page.mouse.down(); await page.mouse.move(bb.cx + 50, bb.cy + 40, { steps: 8 }); await page.mouse.up(); await sleep(400);
  const postSel = await page.evaluate(() => { const b = document.querySelector('#dg .dm-box'); const r = b.getBoundingClientRect(); return { t: getComputedStyle(document.querySelector('#dg .dm-content')).transform, bx: r.x + r.width / 2, by: r.y + r.height / 2 }; });
  R.item3_selectedDragMovesBox = Math.abs(postSel.bx - bb.cx) > 8 || Math.abs(postSel.by - bb.cy) > 8;
  R.item3_selectedDragNoPan = preSel === postSel.t;                        // content transform UNCHANGED = no pan while a box is selected
  if (i === 1) await page.screenshot({ path: OUT + '03-selected-drag-moves-no-pan.png' });

  // ── item4 (9eb2c39c): LIVE served /api/trace/children/rawbin:puml → 55 puml-src itemviews; bogus ref ≠ 55 (planted control) ──
  const puml = await page.evaluate(async () => {
    const cnt = async (ref) => { try { const t = await (await fetch('/api/trace/children/' + ref, { credentials: 'same-origin' })).text(); return (t.match(/puml-src:/g) || []).length; } catch { return -1; } };
    return { real: await cnt('rawbin:puml'), bogus: await cnt('rawbin:bogusxyz') };
  });
  R.item4_puml55 = puml.real === 55;                    // served endpoint enumerates the 55 source .puml
  R.item4_plantedDefect = puml.bogus !== 55;            // a non-puml ref does NOT return 55 (gate discriminates)

  await ctx.close();
  return R;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const runs = [];
try {
  for (let i = 1; i <= 3; i++) runs.push(await runOnce(browser, i));
} finally {
  await browser.close();
  fs.writeFileSync(DFILE, BASELINE);
  console.log(`CLEANUP: ${DIAG.slice(0, 8)} restored=${fs.readFileSync(DFILE, 'utf8') === BASELINE}`);
}

const KEYS = ['item2_control_unselectedFirst', 'item2_selected', 'item2_diagramStays', 'item2_revealed', 'item2_noSelectionChanged',
  'item3_emptyDragPans', 'item3_selectedDragMovesBox', 'item3_selectedDragNoPan', 'item4_puml55', 'item4_plantedDefect'];
console.log('\n===== R33.5 items 2/3/4 @390 iPhone-12 (DET-3x) =====');
runs.forEach((R, i) => console.log(`iter ${i + 1}: ${JSON.stringify(R)}`));
const detGreen = k => runs.length === 3 && runs.every(R => R[k] === true);
const item2 = ['item2_control_unselectedFirst', 'item2_selected', 'item2_diagramStays', 'item2_revealed', 'item2_noSelectionChanged'].every(detGreen);
const item3 = ['item3_emptyDragPans', 'item3_selectedDragMovesBox', 'item3_selectedDragNoPan'].every(detGreen);
const item4 = ['item4_puml55', 'item4_plantedDefect'].every(detGreen);
console.log(`\nITEM2 boxSelect (bde57b1a):`, item2 ? 'GREEN DET-3x' : 'RED');
console.log(`ITEM3 setEnabled pan (44f3ddd3):`, item3 ? 'GREEN DET-3x' : 'RED');
console.log(`ITEM4 pumlChildren 55 (9eb2c39c):`, item4 ? 'GREEN DET-3x' : 'RED');
console.log(`screenshots → ${OUT}`);
console.log('OVERALL (2/3/4):', item2 && item3 && item4 ? 'GREEN DET-3x' : 'RED');
console.log('item1 addDiagram (ffdd9347): NOT gated — /model is feature-gated (requireFeatureAccessHttp), flagged to req/PO.');
process.exitCode = item2 && item3 && item4 ? 0 : 1;
