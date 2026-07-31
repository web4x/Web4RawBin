// R33.6.1 repro — WHY does add-view fail to show a box on a NEW/EMPTY diagram (server proven working)? @390.
// Own-oracle: create a fresh EMPTY Diagram fixture in MODEL_STORE, mount rb-diagram-detail, exercise BOTH add
// paths (tap = selection-changed 'modelelement:'; drop = drop event w/ application/rb-object-ref) and capture
// which fires, whether the add-view POST goes out + its body/status, and whether a .dm-box appears + persists.
// Two mounts: (A) drawer-faithful ref+uuid; (B) ref-only (no uuid attr) = a freshly-created-diagram suspicion.
// Pollution-safe: the fixture file is deleted in finally. node22.
import fs from 'node:fs'; import path from 'node:path';
import { chromium, devices } from '@playwright/test';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const EMPTY = 'e0000000-0000-4000-8000-000000003361'; // test-only empty diagram
const CLASS = 'f51234b0-0233-4fd6-a802-5467f64accc2'; // 'Id' — a real MODEL_STORE element to add
const EFILE = path.join(ROOT, 'data/model-store/index', ...EMPTY.slice(0, 5).split(''), `${EMPTY}.scenario.json`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const writeEmpty = () => { fs.mkdirSync(path.dirname(EFILE), { recursive: true }); fs.writeFileSync(EFILE, JSON.stringify({ ior: 'ior:class:Diagram', ownerIor: null, model: { uuid: EMPTY, name: 'R3361 empty test', views: [] } }, null, 2) + '\n'); };
const viewsOnDisk = () => { try { return (JSON.parse(fs.readFileSync(EFILE, 'utf8')).model.views || []).length; } catch { return -1; } };

async function trial(browser, setUuidAttr, kind) {
  writeEmpty();
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const posts = []; page.on('request', r => { if (/add-view/.test(r.url()) && r.method() === 'POST') posts.push(r.postData()); });
  const resp = []; page.on('response', async r => { if (/add-view/.test(r.url())) resp.push({ status: r.status(), body: await r.text().catch(() => '') }); });
  const logs = []; page.on('console', m => logs.push(m.text().slice(0, 120)));
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail'), { timeout: 15000 }).catch(() => {});
  await page.evaluate(({ u, setUuid }) => {
    document.body.style.margin = '0'; document.body.innerHTML = '';
    const d = document.createElement('rb-diagram-detail');
    d.id = 'dg'; d.setAttribute('ref', `diagram:${u}`); if (setUuid) d.setAttribute('uuid', u);
    d.style.cssText = 'display:block;position:fixed;inset:0;background:#0d1117';
    document.body.appendChild(d);
  }, { u: EMPTY, setUuid: setUuidAttr });
  await sleep(1200);
  const emptyBefore = await page.evaluate(() => ({ boxes: document.querySelectorAll('#dg .dm-box').length, empty: !!document.querySelector('#dg .dm-empty'), ref: document.querySelector('#dg').getAttribute('ref'), uuid: document.querySelector('#dg').getAttribute('uuid') }));
  if (kind === 'tap') {
    await page.evaluate((c) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: [`modelelement:${c}`] }, bubbles: true })), CLASS);
  } else {
    await page.evaluate((c) => { const s = document.querySelector('#dg .dm-surface'); const dt = new DataTransfer(); dt.setData('application/rb-object-ref', `modelelement:${c}`); s.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true, clientX: 150, clientY: 300 })); }, CLASS);
  }
  await sleep(1800);
  const after = await page.evaluate(() => ({ boxes: document.querySelectorAll('#dg .dm-box').length, empty: !!document.querySelector('#dg .dm-empty') }));
  await ctx.close();
  return { kind, setUuidAttr, emptyBefore, boxesAfter: after.boxes, stillEmpty: after.empty, post: posts[0] || null, resp: resp[0] || null, diskViews: viewsOnDisk(), addViewLogs: logs.filter(l => /add-view|addView|diagram/.test(l)).slice(0, 4) };
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  results.push(await trial(browser, true, 'tap'));   // A: uuid attr set, TAP
  results.push(await trial(browser, true, 'drop'));  // A: uuid attr set, DROP
  results.push(await trial(browser, false, 'tap'));  // B: NO uuid attr (fresh-created suspicion), TAP
} finally {
  await browser.close();
  try { fs.unlinkSync(EFILE); } catch { /* */ }
  console.log(`CLEANUP: fixture deleted=${!fs.existsSync(EFILE)}`);
}
for (const r of results) {
  console.log(`\n--- ${r.kind} setUuidAttr=${r.setUuidAttr} ---`);
  console.log(`  before: boxes=${r.emptyBefore.boxes} empty=${r.emptyBefore.empty} ref=${r.emptyBefore.ref} uuid=${r.emptyBefore.uuid}`);
  console.log(`  add-view POST: ${r.post}`);
  console.log(`  add-view resp: ${JSON.stringify(r.resp)}`);
  console.log(`  AFTER: boxes=${r.boxesAfter} stillEmpty=${r.stillEmpty} diskViews=${r.diskViews}`);
  console.log(`  BOX APPEARED: ${r.boxesAfter >= 1 ? 'YES' : 'NO'}`);
}
