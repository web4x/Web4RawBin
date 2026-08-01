// R33.8 Remove-from-diagram (INVERSE of add-view) @390 COMPONENT-harness gate, DET-3x independent (served==HEAD==0.8.33).
// Impls: server persistRemoveView 2c64aa7b (drops a view-link from the Diagram unit, MODEL_STORE) + client removeFromDiagram
// 4c9c3969 (/model drawer verb → POST /api/model/diagram/remove-view). Mount rb-diagram-detail (NOT authed /model, no
// self-grant) → note a box → POST the REAL remove-view (server impl) → remount → the box is GONE from the diagram VIEW,
// but INV-RM1: the ModelElement UNIT STAYS (/api/ior still resolves it → re-addable). PLANTED-DEFECT: remove a uuid NOT on
// the diagram → {removed:false}, box count UNCHANGED (bite). Pollution-safe: DIAG unit byte-backed-up + restored (remove
// writes MODEL_STORE; prod scenario/index untouched). The /model drawer-UI click stays Tron-visual (R33.5 item-1 pattern).
// [test:uuid:786b1863-bb80-497d-9c94-b0c32b2e8988] R33.8 server.persistRemoveView (Impl 2c64aa7b) @390 DET-3x: POST
// /api/model/diagram/remove-view drops the view-link → box GONE from the diagram view; INV-RM1 the ModelElement UNIT STAYS
// (/api/ior resolves it before AND after = re-addable, view-only not delete); planted-defect (uuid not on diagram → removed:false, no change).
// [test:uuid:72af686c-538e-4a2d-b1c1-a4be8c689cdf] R33.8 ModelView.removeFromDiagram (Impl 4c9c3969) @390 DET-3x: the client
// remove-view LOGIC + observable effect (POST /api/model/diagram/remove-view → box removed from the diagram, element stays
// re-addable) — verified via the exact endpoint removeFromDiagram calls. SCOPE: the /model drawer verb-CLICK (select element
// → ✕ Remove from diagram) is Tron-visual (real feature-gated /model; R33.5 item-1 split), NOT headless-gated here.
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
import { chromium, webkit, devices } from '@playwright/test';
const ENGINE = process.env.WK ? webkit : chromium; // R33 WebKit sweep: WK=1 -> real Safari @390
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444', TARGET = process.env.R338_TARGET || '0.8.37';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const DFILE = path.join(ROOT, 'data/model-store/index', ...DIAG.slice(0, 5).split(''), `${DIAG}.scenario.json`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r338-remove') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASELINE = fs.readFileSync(DFILE, 'utf8');
const served = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
if (served !== TARGET) { console.log(`⚠ PHANTOM-GUARD: served=${served} != ${TARGET} — ABORT (won't gate a skewed server).`); process.exit(1); }
console.log(`served==${TARGET} verified.`);

async function mount(browser) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail'), { timeout: 15000 }).catch(() => {});
  return { ctx, page };
}
async function mountDiagram(page) {
  await page.evaluate((u) => { document.body.style.margin = '0'; const o = document.getElementById('dg'); if (o) o.remove(); const d = document.createElement('rb-diagram-detail'); d.id = 'dg'; d.setAttribute('ref', `diagram:${u}`); d.setAttribute('uuid', u); d.style.cssText = 'display:block;position:fixed;inset:0;background:#0d1117'; document.body.appendChild(d); }, DIAG);
  await page.waitForFunction(() => document.querySelectorAll('#dg .dm-box').length > 0, { timeout: 12000 }).catch(() => {});
  await sleep(900);
}
const boxUuids = (page) => page.evaluate(() => [...document.querySelectorAll('#dg .dm-box')].map(b => (b.getAttribute('data-ref') || '').split(':').pop()).filter(Boolean));
const iorExists = (page, uuid) => page.evaluate(async (u) => { try { const r = await fetch(`/api/ior/ior:instance:${u}`); const j = await r.json(); return r.ok && !!(j?.unit?.model); } catch { return false; } }, uuid);
const removeView = (page, elementUuid) => page.evaluate(async ([d, e]) => { try { const r = await fetch('/api/model/diagram/remove-view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagramUuid: d, elementUuid: e }) }); return await r.json(); } catch (x) { return { error: String(x) }; } }, [DIAG, elementUuid]);

async function runOnce(browser, i) {
  fs.writeFileSync(DFILE, BASELINE);
  const { ctx, page } = await mount(browser);
  const R = {};
  await mountDiagram(page);
  const before = await boxUuids(page);
  const target = before[0];
  R.elementExistsBefore = await iorExists(page, target);

  // real remove-view (server impl 2c64aa7b) → drop the view-link
  const rm = await removeView(page, target);
  R.removedFlag = rm && rm.removed === true;
  await mountDiagram(page);                                   // remount → re-fetch diagram → box should be GONE
  const after = await boxUuids(page);
  R.boxGone = after.length === before.length - 1 && !after.includes(target);
  R.elementStaysAfter = await iorExists(page, target);       // INV-RM1: ModelElement UNIT STAYS (re-addable)
  if (i === 1) await page.screenshot({ path: OUT + '01-removed.png' });

  // planted-defect: remove a uuid NOT on the diagram → {removed:false}, count unchanged
  const bogus = '00000000-0000-4000-8000-0000000000ff';
  const rmBogus = await removeView(page, bogus);
  await mountDiagram(page);
  const afterBogus = await boxUuids(page);
  R.plantedBite = rmBogus && rmBogus.removed === false && afterBogus.length === after.length;

  await ctx.close();
  return R;
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const runs = [];
try { for (let i = 1; i <= 3; i++) runs.push(await runOnce(browser, i)); }
finally { await browser.close(); fs.writeFileSync(DFILE, BASELINE); console.log(`CLEANUP: ${DIAG.slice(0, 8)} restored=${fs.readFileSync(DFILE, 'utf8') === BASELINE}`); }

console.log('\n===== R33.8 Remove-from-diagram @390 iPhone-12 (DET-3x) =====');
runs.forEach((R, i) => console.log(`iter ${i + 1}: ${JSON.stringify(R)}`));
const g = k => runs.length === 3 && runs.every(R => R[k] === true);
const green = g('elementExistsBefore') && g('removedFlag') && g('boxGone') && g('elementStaysAfter') && g('plantedBite');
console.log(`\nremove fires (removed:true): ${g('removedFlag') ? 'GREEN' : 'RED'}`);
console.log(`box GONE from diagram view: ${g('boxGone') ? 'GREEN' : 'RED'}`);
console.log(`INV-RM1 ModelElement UNIT STAYS (/api/ior before+after): ${g('elementExistsBefore') && g('elementStaysAfter') ? 'GREEN' : 'RED'}`);
console.log(`planted-defect bite (not-on-diagram → removed:false, no change): ${g('plantedBite') ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.8:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
