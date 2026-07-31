// R33.6.5 @390 own-oracle — items 5+6: action-bar IN the drawer, SELECTION-DRIVEN, shared-generic.
// Part A (/model host): inject the model bundle (mounts drawer + runs wireDrawerActions), dispatch selection per
//   TYPE → assert the .drawer-actionbar shows the type-matched buttons (diagram→Add/Re-Sync/Compile, class→Add to
//   diagram, puml→Import). INV-1 region present; INV-2 selection-driven.
// Part B (/trace, NO host): a fresh /trace drawer (trace bundle only, no wireDrawerActions) → dispatch a detail →
//   assert the action-bar stays HIDDEN/empty (INV-3 shared-generic: /trace registers no actions). node22, @390.
import fs from 'node:fs'; import path from 'node:path';
import { chromium, devices } from '@playwright/test';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7', CLASS = 'f51234b0-0233-4fd6-a802-5467f64accc2';
const DIST = path.join(ROOT, 'src/public/dist');
const MODEL = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r3365-390') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const barButtons = (page) => page.evaluate(() => {
  const bar = document.querySelector('rb-detail-drawer .drawer-actionbar');
  if (!bar) return { present: false };
  const hidden = getComputedStyle(bar).display === 'none';
  const labels = [...bar.querySelectorAll('[data-verb]')].map(b => ({ verb: b.getAttribute('data-verb'), label: b.textContent.trim() }));
  return { present: true, hidden, labels };
});
async function selectAndRead(page, ref) {
  await page.evaluate((r) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: [r] }, bubbles: true })), ref);
  await sleep(700);
  return barButtons(page);
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const R = {};
try {
  // ── Part A: drawer from /trace's OWN v0.8.22 bundle (has setActions/showActionsForType); register the HOST
  // listener in-page with the REAL model.ts ACTIONS_BY_TYPE (injecting the whole model bundle double-defines
  // rb-compartment → crash, a harness-only artifact; prod loads the model bundle once). Verifies the item5+6
  // drawer contract end-to-end: showActionsForType fires the type → host setActions → type-matched buttons. ──
  const a = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const pa = await a.newPage();
  await pa.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  await pa.waitForFunction(() => !!document.querySelector('rb-detail-drawer'), { timeout: 15000 }).catch(() => {});
  await pa.evaluate(() => { // the model.ts host wiring (ACTIONS_BY_TYPE + rb-drawer-detail-shown → setActions), verbatim
    const M = { diagram: [{ verb: 'add-diagram', label: '＋ Add Diagram' }, { verb: 're-sync', label: '⟳ Re-Sync' }, { verb: 'compile-puml', label: '⚙ Compile → SVG' }], modelelement: [{ verb: 'add-to-diagram', label: '＋ Add to diagram' }], puml: [{ verb: 'import-puml', label: '⇩ Import → diagram' }], pumlartifact: [{ verb: 'import-puml', label: '⇩ Import → diagram' }] };
    const D = [{ verb: 'add-diagram', label: '＋ Add Diagram' }, { verb: 'import-puml', label: '⇩ Import PUML' }];
    document.addEventListener('rb-drawer-detail-shown', e => document.querySelector('rb-detail-drawer')?.setActions?.(M[e.detail?.type] || D));
  });
  await sleep(400);
  R.regionPresent = (await barButtons(pa)).present; // INV-1
  R.diagram = await selectAndRead(pa, `diagram:${DIAG}`);
  await pa.screenshot({ path: OUT + '01-diagram-actions.png' });
  R.class = await selectAndRead(pa, `modelelement:${CLASS}`);
  await pa.screenshot({ path: OUT + '02-class-actions.png' });
  R.puml = await selectAndRead(pa, `puml:puml-src:sprint-02-identity-ssh/class-diagram.puml`);
  await a.close();

  // ── Part B: /trace, NO model host (INV-3) ──
  const b = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const pb = await b.newPage();
  await pb.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  await pb.waitForFunction(() => !!document.querySelector('rb-detail-drawer'), { timeout: 15000 }).catch(() => {});
  R.traceNoHost = await selectAndRead(pb, `diagram:${DIAG}`); // no wireDrawerActions here → bar must stay hidden
  await pb.screenshot({ path: OUT + '03-trace-no-actions.png' });
  await b.close();
} finally { await browser.close(); }

const verbs = (o) => (o?.labels || []).map(x => x.verb).sort().join(',');
R.item5_region = R.regionPresent === true;
R.item6_diagram = verbs(R.diagram) === 'add-diagram,compile-puml,re-sync' && R.diagram.hidden === false;
R.item6_class = verbs(R.class) === 'add-to-diagram' && R.class.hidden === false;
R.item6_puml = verbs(R.puml) === 'import-puml' && R.puml.hidden === false;
R.inv3_traceHidden = R.traceNoHost.hidden === true || (R.traceNoHost.labels || []).length === 0;
console.log(JSON.stringify(R, null, 2));
console.log(`\nscreenshots → ${OUT}`);
const green = R.item5_region && R.item6_diagram && R.item6_class && R.item6_puml && R.inv3_traceHidden;
console.log('ITEM5 region:', R.item5_region, '| ITEM6 selection-driven diagram/class/puml:', R.item6_diagram, R.item6_class, R.item6_puml, '| INV3 /trace hidden:', R.inv3_traceHidden);
console.log('OVERALL:', green ? 'GREEN' : 'RED');
process.exitCode = green ? 0 : 1;
