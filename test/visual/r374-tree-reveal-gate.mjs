// R33.7.4 — RbTraceTree.onTreeReveal (Impl 9cdf5072) @390 COMPONENT-harness gate, DET-3x independent (served==HEAD==0.8.29).
// AC: select a diagram element → the tree scrolls+expands to REVEAL it. onTreeReveal receives rb-tree-reveal{ref} (fired by
// the diagram boxSelect, item2) → revealNode(fetchAncestorPath → expand ancestry + scrollIntoView + highlight; no-op if the
// element isn't in this tree, INV-TR3). Harness: serve the /model shell (public data, NOT authed /model, no self-grant) → real
// model bundle → the REAL model tree (#model-tree, onTreeReveal wired) + mount rb-diagram-detail(faa4acad) in the same page →
// select a box (fires rb-tree-reveal{modelelement:uuid}) → assert the model tree REVEALS that element (rb-object-item present +
// highlighted, was 0/absent before). PLANTED-DEFECT: reveal a bogus uuid → no reveal (revealNode SKIP, INV-TR3). Read-only.
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
import { chromium, devices } from '@playwright/test';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r374-reveal') + '/'; fs.mkdirSync(OUT, { recursive: true });
const TARGET = '0.8.29', sleep = ms => new Promise(r => setTimeout(r, ms));
const served = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
if (served !== TARGET) console.log(`⚠ served=${served} != ${TARGET} (verdict credits only on served==${TARGET})`);
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  + `<link rel="stylesheet" href="/app.css"><style>body{margin:0;background:#0d1117;color:#e6edf3;height:100dvh;display:flex;flex-direction:column;font-family:system-ui}.trace-page{flex:1;min-height:0;overflow:auto}#err{color:#f85149}#dg{position:fixed;right:0;bottom:0;width:60%;height:45%;background:#0d1117;border:1px solid #333}</style></head><body>`
  + `<div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="model-tree" data-always-expanded></rb-trace-tree></div><div id="err"></div></div>`
  + `<script type="module" src="${BUNDLE}"></script></body></html>`;

async function runOnce(browser, i, { bogus }) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const logs = [];
  if (i === 1 && !bogus) page.on('console', m => { const t = m.text(); if (/revealNode|waitForNode/.test(t)) logs.push(t); });
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.getElementById('model-tree') && document.querySelectorAll('rb-object-item').length > 0, { timeout: 15000 }).catch(() => {});
  // mount the diagram (its boxes are the model elements to reveal)
  await page.evaluate((u) => { const d = document.createElement('rb-diagram-detail'); d.id = 'dg'; d.setAttribute('ref', `diagram:${u}`); d.setAttribute('uuid', u); document.body.appendChild(d); }, DIAG);
  await page.waitForFunction(() => !!document.querySelector('#dg .dm-box'), { timeout: 12000 }).catch(() => {});
  await sleep(800);

  // pick a real element uuid from a diagram box (modelelement:<uuid>)
  const elem = await page.evaluate(() => { const b = document.querySelector('#dg .dm-box'); const ref = b?.getAttribute('data-ref') || ''; return (ref.split(':').pop() || ''); });
  const revealUuid = bogus ? 'deadbeef-0000-4000-8000-000000000000' : elem;
  const hl = (u) => page.evaluate((x) => { const el = document.querySelector(`#model-tree rb-object-item[ref*=":${x}"]`); const node = el?.closest('.tt-node'); return { present: !!el, highlighted: !!node && node.classList.contains('tt-highlighted') }; }, u);
  const before = await hl(revealUuid); // with data-always-expanded the element is rendered (in-DOM) but NOT yet highlighted

  // fire the reveal exactly as the diagram does (rb-tree-reveal{ref}) → onTreeReveal → revealNode → highlightNode
  await page.evaluate((u) => document.dispatchEvent(new CustomEvent('rb-tree-reveal', { detail: { ref: `modelelement:${u}` }, bubbles: true })), revealUuid);
  await sleep(700); // highlightNode adds .tt-highlighted for 2000ms → read INSIDE the window
  const after = await hl(revealUuid);
  if (i === 1) await page.screenshot({ path: OUT + (bogus ? 'planted' : 'reveal') + '.png' });
  if (i === 1 && !bogus && logs.length) console.log('  revealNode trace:', logs.slice(-6).join(' | '));
  await ctx.close();
  return { elem: revealUuid.slice(0, 8), beforeHi: before.highlighted, present: after.present, highlighted: after.highlighted };
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const reveal = [], planted = [];
try {
  for (let i = 1; i <= 3; i++) reveal.push(await runOnce(browser, i, { bogus: false }));
  planted.push(await runOnce(browser, 1, { bogus: true }));
} finally { await browser.close(); }

console.log('\n===== R33.7.4 onTreeReveal @390 iPhone-12 (DET-3x) =====');
reveal.forEach((R, i) => console.log(`reveal iter ${i + 1}: ${JSON.stringify(R)}`));
console.log(`planted (bogus): ${JSON.stringify(planted[0])}`);
const revealGreen = reveal.length === 3 && reveal.every(R => R.present === true && R.beforeHi === false && R.highlighted === true); // element rendered → reveal HIGHLIGHTS it (not highlighted before)
const bite = planted[0] && planted[0].highlighted === false;
const green = revealGreen && bite;
console.log(`\nREVEAL (diagram element → tree scrolls+highlights it, beforeHi=false→highlighted=true): ${revealGreen ? 'GREEN DET-3x' : 'RED'}`);
console.log(`PLANTED-DEFECT bite (bogus uuid → no reveal, INV-TR3): ${bite ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.7.4:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
