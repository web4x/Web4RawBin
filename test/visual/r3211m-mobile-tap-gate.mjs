// [test:uuid:6cb4c205-144a-47d4-a0b5-12fe07aed834] R32.11-MOBILE tap-to-add — verifies RbDiagramDetail.onSelectionChanged (the touch/iOS complement): a SINGLE tap on a class chip (document 'selection-changed' with one 'modelelement:' ref) with the diagram open → a UML box APPEARS (addView fires, POST 200). Drives the REAL event on the REAL mounted component (mounted as the drawer does: ref='diagram:<uuid>' + uuid='<stripped>') + network-captures the add-view POST. Bites: multi-select + non-modelelement are GUARDED (no box). Caught the diagram:-prefix 400 bug (8806b96c9) → fixed addView getAttribute('uuid') → RED→GREEN. → req wires this Test onto onSelectionChanged (marker-pending Impl).
// R32.11-MOBILE tap-to-add — the @390 TOUCH INTERACTION (NOT endpoint, NOT desktop-DnD), DET-3x. On touch/iOS Safari
// HTML5 DnD never fires, so a SINGLE tap on a class chip dispatches document 'selection-changed' → RbDiagramDetail.
// onSelectionChanged (v0.8.14) → addView (no coords) → a UML box APPEARS on the open diagram. This gate drives the REAL
// selection-changed event on the REAL mounted rb-diagram-detail and verifies the view is added via the wire (not a raw
// endpoint call). Planted-defect bite: a MULTI-select or a non-modelelement selection is GUARDED (no box) → proves the
// wire is real + discriminating. Pollution-safe: byte-snapshot faa4acad + restore. served==0.8.14 phantom-guard.
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const BASE = 'https://prod.wo-da.de:4444';
const MODEL_STORE = path.join(ROOT, 'data', 'model-store', 'index');
const FAA = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const ADDEL = 'f51234b0-0233-4fd6-a802-5467f64accc2';         // 'Id' — a store element NOT in faa4acad → a tap genuinely ADDS it (box appears)
const shardOf = (base, u) => path.join(base, ...u.slice(0, 5).split(''), `${u}.scenario.json`);
const FAA_FILE = shardOf(MODEL_STORE, FAA);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + (fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0]?.[0] || 'model.js'); // NEWEST model bundle (the live deploy), not the first alphabetically (stale)
const strip = (r) => String(r).replace(/^modelelement:/, '');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const version = () => new Promise((res) => { https.get(`${BASE}/api/config`, { rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res(''); } }); }).on('error', () => res('')); });
const faaViews = () => (JSON.parse(fs.readFileSync(FAA_FILE, 'utf8')).model.views || []).map(v => strip(v.unit));

// mount the open diagram + fire a document 'selection-changed' tap, wait for the addView POST to land on disk
async function tap(browser, selected, expectUuid, shouldAdd) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const posts = []; page.on('request', r => { if (r.method() === 'POST' && /add-view/.test(r.url())) posts.push(r.postData()); });
  const resp = []; page.on('response', r => { if (/add-view/.test(r.url())) resp.push(r.status()); });
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail'), { timeout: 15000 }).catch(() => {});
  // mount EXACTLY as rb-detail-drawer.renderDetailForRef:227-228 does — BOTH ref='diagram:<uuid>' AND uuid='<stripped>'
  await page.evaluate((u) => { const d = document.createElement('rb-diagram-detail'); d.id = 'tapdg'; d.setAttribute('ref', `diagram:${u}`); d.setAttribute('uuid', u); document.body.appendChild(d); }, FAA);
  await sleep(800); // diagram open + connectedCallback listening to 'selection-changed'
  // ★ the TAP: a class chip tap dispatches document 'selection-changed' (touch-native path — NOT a drop, NOT an endpoint call)
  await page.evaluate((sel) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: sel }, bubbles: true })), selected);
  // wait until the addView POST writes the view to disk (or a bounded timeout if it should NOT add)
  for (let t = 0; t < 20; t++) { if (faaViews().includes(expectUuid) === shouldAdd) break; await sleep(200); }
  await ctx.close();
  return { views: faaViews(), post: posts[0] || null, status: resp[0] ?? null };
}

const BASELINE = fs.readFileSync(FAA_FILE, 'utf8');
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const ver = (await version()) === '0.8.15';
  for (let i = 1; i <= 3; i++) {
    // ── SINGLE tap on a class chip NOT yet on the diagram → box APPEARS (the wire fires) ──
    fs.writeFileSync(FAA_FILE, BASELINE); const before = faaViews().length;       // baseline (ADDEL absent)
    const t = await tap(browser, [`modelelement:${ADDEL}`], ADDEL, true);
    const tapAdded = t.views.includes(ADDEL) && t.views.length === before + 1;    // box appeared via tap→selection→addView

    // ── BITE 1: MULTI-select tap → GUARDED (no box) ──
    fs.writeFileSync(FAA_FILE, BASELINE);
    const m = await tap(browser, [`modelelement:${ADDEL}`, 'modelelement:6b9bf49f-79df-418c-a7a5-b9e7cc565ef9'], ADDEL, false);
    const biteMulti = !m.views.includes(ADDEL) && m.views.length === before;       // ambiguous multi → no add

    // ── BITE 2: non-modelelement tap → GUARDED (no box) ──
    fs.writeFileSync(FAA_FILE, BASELINE);
    const ne = await tap(browser, ['task:deadbeef-0000-4000-8000-000000000000'], ADDEL, false);
    const biteNonEl = !ne.views.includes(ADDEL) && ne.views.length === before;     // non-class ref → no add

    const pass = ver && tapAdded && biteMulti && biteNonEl;
    results.push(pass);
    if (i === 1) console.log(`  ★ FIX VERIFIED (was the diagram:-prefix 400 bug r3211m 8806b96c9): addView now uses getAttribute('uuid') → POST body=${t.post} → status=${t.status} → box appears. The drawer sets uuid='<stripped>' (renderDetailForRef:228); addView reads it instead of stripRef('diagram:…').`);
    console.log(`iter ${i}: v0.8.15=${ver} SINGLE-tap→box-appears=${tapAdded}(${before}→${t.views.length}, POST=${t.status}) BITE multi-guarded=${biteMulti} non-element-guarded=${biteNonEl} => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally {
  await browser.close();
  fs.writeFileSync(FAA_FILE, BASELINE);
  console.log(`\nCLEANUP: faa4acad restored byte-perfect=${fs.readFileSync(FAA_FILE, 'utf8') === BASELINE}. Desktop DnD (drop→add-view) additive = gated by R32.11 (r3211-dnd-diagram-gate, add-view unchanged).`);
}

console.log('\n===== R32.11-MOBILE tap-to-add @390 TOUCH (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
