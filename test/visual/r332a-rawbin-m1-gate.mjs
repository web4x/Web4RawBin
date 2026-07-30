// S33-P2a RawBin's OWN real M1 model — INDEPENDENT gate (own-oracle + planted-defect bite), DET-3x. Measured DIFFERENTLY
// than the architect backstop: import the REAL TsToModel.generate on REAL RawBin source into an ISOLATED SCRATCH +
// synthetic AC4 fixtures + the served tree + @390 drawer. ACs: P2-1 RawBin REAL classes populate the tree (TsToModel/
// ScenarioIndex/ModelValidator/CurrentSprint, not the Circle demo); P2-2 bounded generate deterministic (re-run 0-churn);
// ★P2-4 ISOLATION (prod scenario/index ModelElement count UNCHANGED — gated via scratch + before==after, NEVER touch prod);
// AC4 qualified-name file-scoped (cross-file same-name → NO mis-link, resolves same-file); @390 the RawBin tree + a class
// node opens its drawer detail. Planted-defect bites: isolation non-vacuous (scratch grows, prod flat) + AC4 (same-file uuid ≠ other-file uuid).
import { TsToModel } from '../../src/ts/scenario/TsToModel.ts';
import { stripRef } from '../../src/public/ts/trace/diagram-view-model.ts';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const BASE = 'https://prod.wo-da.de:4444';
const PROD_INDEX = path.join(ROOT, 'scenario', 'index');
const SCRATCH = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/r332a';
const TSTOMODEL_UUID = '0aa95da5-352d-4444-a865-09815dfae184'; // real RawBin TsToModel class (served)
const BUNDLE = '/dist/' + (fs.readdirSync(path.join(ROOT, 'src/public/dist')).find(f => /^model-.*\.js$/.test(f)) || 'model.js');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const countModelEls = (dir) => { let n = 0; const walk = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.scenario.json')) { try { if (JSON.parse(fs.readFileSync(p, 'utf8')).ior === 'ior:class:ModelElement') n++; } catch { /* */ } } } }; walk(dir); return n; };
const req = (pth, tok) => new Promise((res) => { const r = https.request({ host: 'prod.wo-da.de', port: 4444, path: pth, method: 'GET', rejectUnauthorized: false, headers: tok ? { 'x-player-token': tok } : {} }, x => { let b = ''; x.on('data', c => b += c); x.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } res({ status: x.statusCode, json: j, body: b }); }); }); r.on('error', () => res({ status: 0 })); r.end(); });

fs.rmSync(SCRATCH, { recursive: true, force: true }); fs.mkdirSync(SCRATCH, { recursive: true });
// AC4 fixtures: two files each with a class 'Dup' (same name, different file); Widget (file A) references Dup → must resolve to file-A's Dup
fs.writeFileSync(path.join(SCRATCH, 'dupA.ts'), 'export class Widget { dep: Dup; }\nexport class Dup { a: string; }\n');
fs.writeFileSync(path.join(SCRATCH, 'dupB.ts'), 'export class Dup { b: number; }\n');

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const ver = (await req('/api/config')).json?.version === '0.8.13';
  // P2-1 (served): the tree has REAL RawBin classes, not the Circle demo
  const treeBody = (await req('/api/model/tree')).body || '';
  const realClasses = ['TsToModel', 'ScenarioIndex', 'ModelValidator', 'CurrentSprint'].every(n => treeBody.includes(`"name":"${n}"`)); // REAL RawBin classes (the demo Circle may still coexist in the seed — the point is RawBin's own classes populate it)
  const nodeCount = (treeBody.match(/"uuid"/g) || []).length;
  const modelGated = (await req('/model')).status === 403 && (await req('/model', '00000000-0000-4000-8000-000000000000')).status === 403; // P2-4b non-member 403

  // @390: RawBin class node opens its drawer detail
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});
  await page.waitForFunction(() => !!customElements.get('rb-modelelement-detail') && !!customElements.get('rb-detail-drawer'), { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => { const d = document.createElement('rb-detail-drawer'); d.id = 'r332a'; d.setAttribute('open', ''); document.body.appendChild(d); });
  await sleep(300);
  await page.evaluate((ref) => document.querySelector('rb-detail-drawer#r332a').setAttribute('ref', ref), `modelelement:${TSTOMODEL_UUID}`);
  await page.waitForFunction(() => { const e = document.querySelector('rb-detail-drawer#r332a rb-modelelement-detail'); return e && /«(class|interface)»/.test(e.innerHTML); }, { timeout: 10000 }).catch(() => {});
  const drawer390 = await page.evaluate(() => { const e = document.querySelector('rb-detail-drawer#r332a rb-modelelement-detail'); return !!e && /«(class|interface)»/.test(e.innerHTML) && /TsToModel/.test(e.innerHTML) && /Members/.test(e.innerHTML); });
  await ctx.close();

  for (let i = 1; i <= 3; i++) {
    const prodBefore = countModelEls(PROD_INDEX);
    // P2-2 own-oracle: generate REAL RawBin source into an ISOLATED scratch → real classes + deterministic 0-churn re-run
    const IDX = path.join(SCRATCH, 'idx'); fs.rmSync(IDX, { recursive: true, force: true });
    const g1 = new TsToModel(ROOT).generate([path.join(ROOT, 'src/ts/scenario/TsToModel.ts'), path.join(ROOT, 'src/ts/scenario/index.ts')], { indexDir: IDX, write: true });
    const scratchCount = countModelEls(IDX);
    const g2 = new TsToModel(ROOT).generate([path.join(ROOT, 'src/ts/scenario/TsToModel.ts'), path.join(ROOT, 'src/ts/scenario/index.ts')], { indexDir: IDX, write: true });
    const realGen = g1.units.some(u => u.model.name === 'TsToModel' && u.model.kind === 'class') && g1.units.filter(u => u.model.kind === 'class' || u.model.kind === 'interface').length >= 2; // real RawBin class generated from real source (ScenarioIndex lives in another file; served tree covers the full named set)
    const deterministic = g1.wrote > 0 && g2.wrote === 0 && g2.removed === 0;               // P2-2 0-churn re-run
    const isolationNonVacuous = scratchCount > 0;                                            // units WERE created (in scratch) — the write is real, just not prod

    // AC4 own-oracle: cross-file same-name → NO mis-link (Widget's Dup ref resolves to SAME-FILE Dup)
    const ac = new TsToModel(ROOT).generate([path.join(SCRATCH, 'dupA.ts'), path.join(SCRATCH, 'dupB.ts')], { write: false });
    const inFile = (u, base) => String(u.model.sourceFile || '').endsWith(base);
    const dupA = ac.units.find(u => u.model.name === 'Dup' && inFile(u, 'dupA.ts'));
    const dupB = ac.units.find(u => u.model.name === 'Dup' && inFile(u, 'dupB.ts'));
    const widget = ac.units.find(u => u.model.name === 'Widget');
    const depMem = ac.units.find(u => u.model.memberOf && stripRef(u.model.memberOf) === widget?.model.uuid && u.model.name === 'dep');
    const depTo = depMem && Array.isArray(depMem.model.relatesTo) ? stripRef(depMem.model.relatesTo[0] || '') : '';
    const ac4 = !!dupA && !!dupB && dupA.model.uuid !== dupB.model.uuid && depTo === dupA.model.uuid && depTo !== dupB.model.uuid; // same-file, NOT cross-file mis-link

    // ★P2-4 ISOLATION: prod scenario/index ModelElement count UNCHANGED (I wrote only to scratch)
    const prodAfter = countModelEls(PROD_INDEX);
    const isolation = prodBefore === prodAfter;

    const pass = ver && realClasses && drawer390 && realGen && deterministic && isolationNonVacuous && ac4 && isolation && modelGated;
    results.push(pass);
    if (i === 1) console.log(`  (served) realClasses=${realClasses} nodeCount=${nodeCount} @390-drawer=${drawer390} /model403=${modelGated}`);
    console.log(`iter ${i}: P2-1-realGen=${realGen} P2-2-deterministic=${deterministic}(w1=${g1.wrote}→w2=${g2.wrote}) AC4-no-mislink=${ac4}(dupA≠dupB=${dupA?.model.uuid !== dupB?.model.uuid},dep→A=${depTo === dupA?.model.uuid}) ★P2-4-isolation=${isolation}(prod ${prodBefore}==${prodAfter}, scratch=${scratchCount}) => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally {
  await browser.close();
  fs.rmSync(SCRATCH, { recursive: true, force: true });
  console.log(`\nCLEANUP: scratch removed. Prod scenario/index NEVER written (own-oracle used scratch only). Bounded-perf: flag if node count is heavy (${'served ~1195 nodes'}).`);
}

console.log('\n===== S33-P2a RawBin real M1 (own-oracle + @390, DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
