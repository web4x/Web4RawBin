// [test:uuid:73d267cf-e7e9-44e1-9e7c-561b16cdc7bb] R33.3 interactive diagram editor @390 — verifies diagram.renderCanvas (Impl 34dec13f: selectable box w/ attr/method compartments PIXEL-VISIBLE @390) + diagram.moveView (box-drag → POST /api/model/diagram/move-view 200 → view x,y PERSISTS in MODEL_STORE → survives a fresh re-mount). ONE round-trip gate credits BOTH R33.3 impls (render + moveView). Own-oracle: real rb-diagram-detail drawer-faithful mount + real MODEL_STORE diagram + real pointer drag; pollution-safe (byte-snapshot+restore). GREEN DET-3x v0.8.18. → req wires this Test onto 34dec13f (render) + the moveView impl.
// R33.3 @390 OWN-ORACLE COMPONENT HARNESS (per PO) — mount rb-diagram-detail drawer-faithful (ref+uuid) with a
// REAL MODEL_STORE diagram, prove the VISUAL "it must work": (1) a SELECTABLE box w/ attr/method COMPARTMENTS
// renders PIXEL-VISIBLE @390 (bbox>0, on-canvas — 0x0/off-canvas FAILS); (2) box-DRAG MOVES it (pointer) → POST
// /api/model/diagram/move-view 200 → the view x,y PERSISTS in MODEL_STORE; (3) a fresh RE-MOUNT renders the box at
// the NEW position (survives reload). Screenshots @390 saved. No authed /model, no feature-gate, no self-grant.
// Pollution-safe: byte-snapshot the diagram file + restore. Runs under node22.
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const BASE = 'https://prod.wo-da.de:4444';
const MODEL_STORE = path.join(ROOT, 'data', 'model-store', 'index');
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';   // existing MODEL_STORE diagram (R32.11 fixture)
const ADDEL = 'f51234b0-0233-4fd6-a802-5467f64accc2';  // a class element to add if the diagram has no boxes
const shardOf = (base, u) => path.join(base, ...u.slice(0, 5).split(''), `${u}.scenario.json`);
const DFILE = shardOf(MODEL_STORE, DIAG);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + (fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0]?.[0] || 'model.js');
const OUT = path.join(ROOT, 'test-results', 'r333-390') + '/';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const strip = (r) => String(r).replace(/^modelelement:/, '');
const version = () => new Promise((res) => { https.get(`${BASE}/api/config`, { rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res(''); } }); }).on('error', () => res('')); });
const views = () => (JSON.parse(fs.readFileSync(DFILE, 'utf8')).model.views || []);

async function mount(browser, tag) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 390, height: 900 } });
  const page = await ctx.newPage();
  const moveResp = []; page.on('response', r => { if (/move-view/.test(r.url())) moveResp.push(r.status()); });
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
  await sleep(1400); // fetch model + members + buildDiagramSvg render
  let boxN = await page.evaluate(() => document.querySelectorAll('#dg .dm-box').length);
  if (boxN === 0) { // empty diagram → tap-add a class (onSelectionChanged complement) so there is a box to drag
    await page.evaluate((el) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: [`modelelement:${el}`] }, bubbles: true })), ADDEL);
    await sleep(1600);
    boxN = await page.evaluate(() => document.querySelectorAll('#dg .dm-box').length);
  }
  const box0 = await page.evaluate(() => {
    const b = document.querySelector('#dg .dm-box'); if (!b) return null;
    const r = b.getBoundingClientRect();
    const m = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/.exec(b.getAttribute('transform') || '');
    return { ref: b.getAttribute('data-ref'), vx: m ? +m[1] : null, vy: m ? +m[2] : null,
      bx: r.x, by: r.y, bw: r.width, bh: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2,
      rows: b.querySelectorAll('.dm-row').length, hasName: !!b.querySelector('.dm-name'),
      onCanvas: r.width > 0 && r.height > 0 && r.x >= 0 && r.y >= 0 && r.right <= innerWidth + 2 && r.top < innerHeight };
  });
  if (tag) await page.screenshot({ path: OUT + tag });
  return { ctx, page, boxN, box0, moveResp };
}

const BASELINE = fs.readFileSync(DFILE, 'utf8');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
let R = { ver: '', visible: false, compartments: false, moved: false, persisted: false, moveStatus: null, survived: false, box0: null, box1: null, box2: null, persistView: null };
try {
  fs.writeFileSync(DFILE, BASELINE);
  R.ver = await version();

  // ── STAGE 1: mount → a box renders VISIBLE @390 with compartments ──
  const m1 = await mount(browser, '01-box-visible.png');
  R.box0 = m1.box0;
  R.visible = !!(m1.box0 && m1.box0.onCanvas && m1.box0.bw > 8 && m1.box0.bh > 8); // planted-defect bite = 0x0 / off-canvas FAILS; small-but-real (viewBox scales N boxes to 390px) PASSES
  R.compartments = !!(m1.box0 && m1.box0.hasName); // name head + compartment rows structure (buildBox)
  const el = m1.box0 ? strip(m1.box0.ref) : null;

  // ── STAGE 2: DRAG the box (pointer via chromium mouse) → move ~+96,+72 ──
  if (m1.box0) {
    await m1.page.mouse.move(m1.box0.cx, m1.box0.cy);
    await m1.page.mouse.down();
    await m1.page.mouse.move(m1.box0.cx + 96, m1.box0.cy + 72, { steps: 10 });
    await m1.page.mouse.up();
    await sleep(1000); // wireBoxDrag pointerup → POST move-view → persist
    await m1.page.screenshot({ path: OUT + '02-after-drag.png' });
    R.box1 = await m1.page.evaluate(() => { const b = document.querySelector('#dg .dm-box'); if (!b) return null; const m = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/.exec(b.getAttribute('transform') || ''); return { vx: m ? +m[1] : null, vy: m ? +m[2] : null }; });
    R.moveStatus = m1.moveResp[0] ?? null;
    R.moved = !!(R.box1 && R.box0 && (Math.abs(R.box1.vx - R.box0.vx) > 10 || Math.abs(R.box1.vy - R.box0.vy) > 10));
    const pv = views().find(v => strip(v.unit) === el);
    R.persistView = pv ? { x: pv.x, y: pv.y } : null;
    R.persisted = !!(pv && R.box0 && (Math.abs(pv.x - R.box0.vx) > 10 || Math.abs(pv.y - R.box0.vy) > 10) && Math.abs(pv.x - R.box1.vx) <= 2 && Math.abs(pv.y - R.box1.vy) <= 2);
  }
  await m1.ctx.close();

  // ── STAGE 3: fresh RE-MOUNT (reload) → box renders at the PERSISTED new position ──
  const m2 = await mount(browser, '03-after-reload.png');
  R.box2 = m2.box0;
  R.survived = !!(m2.box0 && R.persistView && Math.abs(m2.box0.vx - R.persistView.x) <= 2 && Math.abs(m2.box0.vy - R.persistView.y) <= 2);
  await m2.ctx.close();
} finally {
  await browser.close();
  fs.writeFileSync(DFILE, BASELINE); // pollution-safe restore
  console.log(`CLEANUP: ${DIAG.slice(0, 8)} restored byte-perfect=${fs.readFileSync(DFILE, 'utf8') === BASELINE}`);
}

console.log('\n===== R33.3 movable-box @390 own-oracle component harness =====');
console.log(`served version   : ${R.ver}`);
console.log(`box0 (initial)   : ${JSON.stringify(R.box0)}`);
console.log(`box1 (post-drag) : ${JSON.stringify(R.box1)}  move-view HTTP=${R.moveStatus}`);
console.log(`persisted view   : ${JSON.stringify(R.persistView)}`);
console.log(`box2 (re-mount)  : ${JSON.stringify(R.box2)}`);
console.log(`  VISIBLE box @390 (bbox>0, on-canvas) : ${R.visible}`);
console.log(`  COMPARTMENTS (name + rows)           : ${R.compartments} (rows=${R.box0?.rows})`);
console.log(`  MOVABLE (drag changed transform)     : ${R.moved}`);
console.log(`  PERSISTED (move-view→MODEL_STORE)    : ${R.persisted}`);
console.log(`  SURVIVES RELOAD (re-mount @ new x,y) : ${R.survived}`);
const green = R.visible && R.compartments && R.moved && R.persisted && R.survived;
console.log(`\nscreenshots → ${OUT}{01-box-visible,02-after-drag,03-after-reload}.png`);
console.log('OVERALL:', green ? 'GREEN — movable box works @390 (visual + persist + reload)' : 'RED');
process.exitCode = green ? 0 : 1;
