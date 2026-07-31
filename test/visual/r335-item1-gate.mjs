// R33.5 item1 @390 own-oracle — ModelView.addDiagram reveal mechanism (ffdd9347). The full add (POST /create) is
// behind the feature-gated /model page (SystemTester 403) → the CREATE half is the tester's owner-cookie real-gate.
// This verifies the REVEAL half on served v0.8.19: mount rb-trace-tree, feed the mof roots, call the SAME
// tree.expandPath(['mof-m1','project:RawBin','rawbin:diagram']) that addDiagram calls → the diagrams/ folder opens
// and a Diagram node BECOMES VISIBLE (was hidden/collapsed). Planted control: before expandPath, no diagram node.
// /api/trace/children is ungated (served). node22, @390.
import fs from 'node:fs'; import path from 'node:path';
import { chromium, devices } from '@playwright/test';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r335-390') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
let R = {};
try {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-trace-tree'), { timeout: 15000 }).catch(() => {});
  // mount the tree + feed the mof roots (the gated /api/model/tree only supplies these 2 lazy roots; children
  // lazy-fetch via the UNGATED /api/trace/children — the same path the live /model tree uses).
  await page.evaluate(() => {
    document.body.style.margin = '0'; document.body.innerHTML = '';
    const t = document.createElement('rb-trace-tree');
    t.id = 'mt'; t.style.cssText = 'display:block;position:fixed;inset:0;overflow:auto;background:#0d1117';
    document.body.appendChild(t);
    t.items = [
      { uuid: 'mof-m1', type: 'mof-layer', name: 'M1 · Projects', hasChildren: true, childCount: 1 },
      { uuid: 'mof-m2', type: 'mof-layer', name: 'M2 · UML Profile', hasChildren: true, childCount: 1 },
    ];
  });
  await sleep(900);
  const before = await page.evaluate(() => document.querySelectorAll('#mt rb-object-item[ref^="diagram:"]').length);
  R.beforeDiagramNodes = before; // planted control: 0 (collapsed)
  await page.screenshot({ path: OUT + '04-item1-before.png' });

  // the SAME call addDiagram makes after /create
  await page.evaluate(async () => { await document.querySelector('#mt').expandPath(['mof-m1', 'project:RawBin', 'rawbin:diagram']); });
  await sleep(1500);
  const after = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('#mt rb-object-item[ref^="diagram:"]')];
    return { count: nodes.length, names: nodes.slice(0, 5).map(n => n.getAttribute('ref')),
      diagramsFolderOpen: !!document.querySelector('#mt rb-object-item[ref*="rawbin:diagram"][children-open]') };
  });
  R.afterDiagramNodes = after.count; R.afterRefs = after.names; R.diagramsFolderOpen = after.diagramsFolderOpen;
  await page.screenshot({ path: OUT + '05-item1-after-reveal.png' });
  R.item1_reveals = before === 0 && after.count >= 1; // hidden (collapsed) → Diagram node(s) SHOWN after expandPath walked+opened the path
  await ctx.close();
} finally { await browser.close(); }

console.log('\n===== R33.5 item1 @390 (reveal mechanism, served v0.8.19) =====');
console.log(JSON.stringify(R, null, 2));
console.log(`screenshots → ${OUT}{04-item1-before,05-item1-after-reveal}.png`);
console.log('ITEM1 (expandPath reveals a Diagram node under an OPEN diagrams/ — was collapsed):', R.item1_reveals ? 'GREEN' : 'RED');
console.log('NOTE: the POST /create half is feature-gated (/model) → tester owner-cookie real-gate.');
process.exitCode = R.item1_reveals ? 0 : 1;
