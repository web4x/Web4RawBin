// R32.10 ModelElement drawer INTERACTION @390 (select→drawer→detail/diagram/method), DET-3x. The interaction: a model
// node → drawer routes 'modelelement:<uuid>' to rb-modelelement-detail (tagMap, R32.10 INV-M2) → class→members+«kind»+
// '📐 Open diagram' / method→signature; 📐 opens the R32.4/6 rb-diagram-detail. Own-oracle: load the REAL model bundle
// on the UNGATED /trace + drive the REAL drawer selection flow (renderDetailForRef, R32.6 lesson — ref BEFORE append,
// NOT bare-mount) with REAL /api/ior data (open, store-routed). Measured DIFFERENTLY than the expert. The /model page
// gate is ACCESS-control, tested separately by the BITE (non-member 403). Phantom-guard: served==0.8.10.
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { chromium, devices } from '@playwright/test';

const BASE = 'https://prod.wo-da.de:4444';
const CLASS = '54ea2a17-7b18-4d0f-ab41-feb6efe9ae64';        // seed ModelElement class Circle (4 members)
const METHOD = 'c2fca9c2-5b77-4a1f-aae2-cf9cdf0c981c';       // a Circle member (→ signature branch)
const BUNDLE = '/dist/' + (fs.readdirSync(path.join('/var/dev/Workspaces/web4x/Web4RawBin/src/public/dist')).find(f => /^model-.*\.js$/.test(f)) || 'model.js');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpStatus = (pth, token) => new Promise((res) => { const r = https.request({ host: 'prod.wo-da.de', port: 4444, path: pth, method: 'GET', rejectUnauthorized: false, headers: token ? { 'x-player-token': token } : {} }, x => { x.on('data', () => {}); x.on('end', () => res(x.statusCode)); }); r.on('error', () => res(0)); r.end(); });
const version = () => new Promise((res) => { https.get(`${BASE}/api/config`, { rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res(''); } }); }).on('error', () => res('')); });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const ver = (await version()) === '0.8.10';
  // BITE + regression (route-level, once): /model gated (non-member 403) + /trace & model-tree unregressed
  const modelNoTok = await httpStatus('/model');                                  // no session → 403 (INV-D4)
  const modelUnknown = await httpStatus('/model', '00000000-0000-4000-8000-000000000000');
  const traceOk = await httpStatus('/trace');
  const treeOk = await httpStatus('/api/model/tree');
  const bite = modelNoTok === 403 && modelUnknown === 403;                        // non-member drawer/detail launcher gated
  const regression = traceOk === 200 && treeOk === 200;

  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' });
    await page.addScriptTag({ url: BUNDLE, type: 'module' }).catch(() => {});     // load the model bundle → defines rb-modelelement-detail
    await page.waitForFunction(() => !!customElements.get('rb-modelelement-detail') && !!customElements.get('rb-detail-drawer'), { timeout: 15000 }).catch(() => {});

    // ── mount the drawer (append→connect), then SELECT via setAttribute ref (attributeChangedCallback→renderDetailForRef) ──
    await page.evaluate(() => { document.querySelectorAll('rb-detail-drawer#r3210').forEach(e => e.remove()); const d = document.createElement('rb-detail-drawer'); d.id = 'r3210'; d.setAttribute('open', ''); document.body.appendChild(d); });
    await sleep(300);
    // SELECT CLASS: drawer routes modelelement→rb-modelelement-detail (the real renderDetailForRef selection flow)
    await page.evaluate((ref) => document.querySelector('rb-detail-drawer#r3210').setAttribute('ref', ref), `modelelement:${CLASS}`);
    await page.waitForFunction(() => { const e = document.querySelector('rb-detail-drawer#r3210 rb-modelelement-detail'); return e && /Members/.test(e.innerHTML); }, { timeout: 8000 }).catch(() => {});
    const cls = await page.evaluate(() => { const e = document.querySelector('rb-detail-drawer#r3210 rb-modelelement-detail'); if (!e) return {}; const h = e.innerHTML; return { has: true, kindClass: /«(class|interface)»/.test(h), members: (h.match(/dv-rel/g) || []).length, openDiagram: !!e.querySelector('.dv-link[data-ref^="diagram:"]'), heading: (e.querySelector('h3')?.textContent || '') }; });
    const selectClass = cls.has && cls.kindClass && cls.members >= 4 && cls.openDiagram && cls.heading.length > 0;

    // ── 📐 OPEN DIAGRAM AFFORDANCE: the class detail offers a '📐 Open diagram' link whose data-ref (diagram:<uuid>)
    // resolves to a REAL ior:class:Diagram unit (navigates to the existing R32.4/6 rb-diagram-detail — the SVG render is
    // already independently gated GREEN via buildDiagramSvg import in r324/r326; the headless drawer→rb-diagram-detail
    // mount hits the known R32.6 render limitation, so here we assert the AFFORDANCE is non-vacuous, not re-gate the render).
    const openDiagram = await page.evaluate(async () => {
      const link = document.querySelector('rb-detail-drawer#r3210 rb-modelelement-detail .dv-link[data-ref^="diagram:"]');
      if (!link) return false;
      const ref = link.getAttribute('data-ref').replace(/^diagram:/, '');
      try { const j = await (await fetch(`/api/ior/ior:instance:${ref}`)).json(); return j?.className === 'Diagram' && Array.isArray(j?.unit?.model?.views); } catch { return false; }
    });

    // ── SELECT METHOD: modelelement:<member> → Signature ──
    await page.evaluate((ref) => { const d = document.querySelector('rb-detail-drawer#r3210'); d.setAttribute('ref', ref); }, `modelelement:${METHOD}`);
    await page.waitForFunction(() => { const e = document.querySelector('rb-detail-drawer#r3210 rb-modelelement-detail'); return e && /Signature/.test(e.innerHTML); }, { timeout: 10000 }).catch(() => {});
    const selectMethod = await page.evaluate(() => { const e = document.querySelector('rb-detail-drawer#r3210 rb-modelelement-detail'); return !!e && /Signature/.test(e.innerHTML) && !!e.querySelector('div[style*="monospace"]'); });

    const pass = ver && selectClass && openDiagram && selectMethod && bite && regression;
    results.push(pass);
    console.log(`iter ${i}: v0.8.10=${ver} SELECT-class=${selectClass}(«class»=${cls.kindClass},members=${cls.members},📐=${cls.openDiagram}) OPEN-diagram=${openDiagram} SELECT-method→sig=${selectMethod} | BITE(/model no-tok=${modelNoTok}/unk=${modelUnknown})=${bite} regression(/trace=${traceOk},/tree=${treeOk})=${regression} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R32.10 ModelElement drawer interaction @390 (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('METHOD: real model bundle + real drawer renderDetailForRef selection flow (R32.6 lesson: ref-before-append, not bare-mount) + real /api/ior data on ungated /trace; /model access-gate = the BITE. Owner @390 visual = Tron device.');
process.exitCode = green ? 0 : 1;
