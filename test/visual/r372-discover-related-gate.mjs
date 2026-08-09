// R33.7.2 — ModelView.discoverRelated (Impl 8e8c1d75) @390 COMPONENT-harness gate, DET-3x independent.
// discoverRelated(ref, activeDiagramUuid): fetch the element (/api/ior) → 1-LEVEL neighbors = relatesTo ∪ relatedFrom
// (dedup, exclude self, INV-DA1 no transitive) → add-view each (POST /api/model/diagram/add-view) → rb-diagram-refresh.
// Gate the LOGIC independently: serve the /model shell + REAL bundle (wireDrawerActions live; NOT authed /model — public
// data), route-intercept /api/model/diagram/add-view (capture the POSTed elementUuids, fulfill ok = ZERO real write =
// pollution-safe), COMPUTE the EXPECTED neighbors LIVE from /api/ior myself (measured ≠ the impl's own run), then drive
// the discover action (rb-active-diagram + rb-drawer-detail-shown + rb-drawer-action{discover}) → assert the add-view POSTs
// == exactly the expected neighbor set (self excluded, deduped) + rb-diagram-refresh dispatched. Planted-defect: discover
// with NO active diagram → 'Open a diagram first', ZERO add-view (INV: explicit diagram target required). served==HEAD==0.8.37.
// [test:uuid:a02d7ae6-d2f3-4a30-a1a5-24dee6f42c71] R33.7.2 ModelView.discoverRelated (Impl 8e8c1d75) @390 DET-3x: Discover →
// exactly the element's 1-level relatesTo∪relatedFrom neighbors add-viewed (self-excl, dedup) + refresh; no-diagram → 0 (bite).
import fs from 'node:fs'; import path from 'node:path';
import { chromium, devices } from '@playwright/test';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const DIAG = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';
const ELEMENT = '92bf4d5f-4933-4b1c-af9d-b0c1a844f044'; // listComplete — has relatesTo (1-level neighbors)
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  + `<link rel="stylesheet" href="/app.css"></head><body><div class="trace-page"><rb-trace-tree id="model-tree"></rb-trace-tree><rb-detail-drawer></rb-detail-drawer><div id="err"></div></div>`
  + `<script type="module" src="${BUNDLE}"></script></body></html>`;

async function runOnce(browser, withDiagram) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const addViewPosts = [];
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.route('**/api/model/diagram/add-view', r => { try { const d = JSON.parse(r.request().postData() || '{}'); addViewPosts.push(d.elementUuid); } catch { /* noop */ } return r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-diagram-detail'), { timeout: 15000 }).catch(() => {}); // bundle loaded → wireDrawerActions live
  await sleep(600);
  // compute EXPECTED neighbors LIVE from /api/ior (independent of the impl's own fetch)
  const expected = await page.evaluate(async (el) => {
    const m = (await (await fetch(`/api/ior/ior:instance:${el}`)).json())?.unit?.model || {};
    const refs = [...(m.relatesTo || []), ...(m.relatedFrom || [])].map(x => String(x).split(':').pop());
    return [...new Set(refs)].filter(u => u && u !== el);
  }, ELEMENT);
  // drive the discover action through the real event chain (wireDrawerActions → discoverRelated)
  await page.evaluate(({ el, diag, withDiagram }) => {
    window.__refresh = 0; document.addEventListener('rb-diagram-refresh', () => window.__refresh++);
    if (withDiagram) document.dispatchEvent(new CustomEvent('rb-active-diagram', { detail: { uuid: diag }, bubbles: true }));
    document.dispatchEvent(new CustomEvent('rb-drawer-detail-shown', { detail: { type: 'modelelement', ref: `modelelement:${el}` }, bubbles: true }));
    document.dispatchEvent(new CustomEvent('rb-drawer-action', { detail: { verb: 'discover' }, bubbles: true }));
  }, { el: ELEMENT, diag: DIAG, withDiagram });
  await sleep(1800); // discoverRelated: fetch /api/ior + add-view POST(s) + refresh
  const refresh = await page.evaluate(() => window.__refresh);
  const errText = await page.evaluate(() => document.getElementById('err')?.textContent || '');
  await ctx.close();
  return { expected, posts: addViewPosts.filter(Boolean), refresh, errText };
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const happy = [], planted = [];
try {
  for (let i = 0; i < 3; i++) happy.push(await runOnce(browser, true));
  planted.push(await runOnce(browser, false)); // no active diagram → must refuse
} finally { await browser.close(); }

const setEq = (a, b) => a.length === b.length && [...new Set(a)].every(x => b.includes(x)) && [...new Set(b)].every(x => a.includes(x));
console.log('\n===== R33.7.2 discoverRelated @390 iPhone-12 (DET-3x) =====');
happy.forEach((R, i) => console.log(`happy ${i + 1}: expected=${JSON.stringify(R.expected)} posts=${JSON.stringify(R.posts)} refresh=${R.refresh} err="${R.errText}"`));
console.log(`planted (no-diagram): posts=${JSON.stringify(planted[0].posts)} err="${planted[0].errText}"`);
const happyGreen = happy.length === 3 && happy.every(R => R.expected.length >= 1 && setEq(R.posts, R.expected) && !R.posts.includes(ELEMENT) && R.refresh >= 1);
const bite = planted[0].posts.length === 0 && /Open a diagram first/i.test(planted[0].errText); // INV: explicit diagram required
const green = happyGreen && bite;
console.log(`\nDISCOVER → exactly 1-level neighbors add-viewed (self-excl) + refresh: ${happyGreen ? 'GREEN DET-3x' : 'RED'}`);
console.log(`PLANTED-DEFECT (no active diagram → 0 add-view + refuses): ${bite ? 'GREEN' : 'RED'}`);
console.log('OVERALL R33.7.2:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
