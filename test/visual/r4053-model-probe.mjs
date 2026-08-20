// R40.53 defect #2 repro PROBE — PO hypothesis: the drawer duplication (Parent×2/Status×3) is SURFACE-SPECIFIC to
// /model (synthetic mof roots + expandPath entry into rb-trace-tree/rb-detail-drawer), not /trace. Explore /model in
// scratch (system-literal owner session — proved renderable), find how a Task detail opens, fire make-current, watch
// for a SECOND render stacking (renderParentLink twice into the same host). v0.8.121 = the known-bad build.
import { setupFoundation } from './r4031-foundation.mjs';
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const COMMIT = process.env.MC_COMMIT || 'c3e8b22f5';
const TARGET = process.env.MC_TASK || '97e8a6ad-46db-440f-a9be-cfb97ca64df4';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const f = await setupFoundation({ commit: COMMIT, buildDist: true, attachEvidenceTo: TARGET });
console.log(`scratch up: ${f.base} v${f.servedVersion} sha=${f.worktreeSha}`);
const browser = await webkit.launch({ headless: true });
try {
  const ctx = await browser.newContext(IOS);
  const oh = f.ownerHeaders();
  await ctx.addInitScript((t) => { try { localStorage.setItem('rawbin-player-id', t); } catch {} }, oh['x-player-token']);
  const smMatch = (oh['Cookie'] || '').match(/sm_session=([^;]+)/);
  if (smMatch) await ctx.addCookies([{ name: 'sm_session', value: smMatch[1], domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  page.on('console', m => { const s = m.text(); if (/error|403|fail/i.test(s)) console.log('  [page]', s.slice(0, 140)); });

  const resp = await page.goto(`${f.base}/model`, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => { console.log('goto err', String(e.message || e).slice(0, 120)); return null; });
  console.log('/model HTTP:', resp?.status());
  await sleep(2000);
  const survey = await page.evaluate(() => {
    const els = new Set(); document.querySelectorAll('*').forEach(e => { if (e.tagName.includes('-')) els.add(e.tagName.toLowerCase()); });
    const tree = document.querySelector('rb-trace-tree');
    const items = [...document.querySelectorAll('rb-object-item')].slice(0, 12).map(e => (e.getAttribute('ref') || (e.innerText || '').slice(0, 40)));
    const drawer = document.querySelector('rb-detail-drawer');
    return { customEls: [...els], treeLen: (tree?.innerText || '').length, itemCount: document.querySelectorAll('rb-object-item').length, sampleItems: items, hasDrawer: !!drawer, bodyText: (document.body.innerText || '').slice(0, 200) };
  });
  console.log('CUSTOM ELS:', survey.customEls.join(', ') || '(none)');
  console.log(`tree innerText len=${survey.treeLen} · rb-object-item count=${survey.itemCount} · hasDrawer=${survey.hasDrawer}`);
  console.log('sample item refs:', JSON.stringify(survey.sampleItems));
  if (!survey.customEls.length) console.log('BODY:', JSON.stringify(survey.bodyText));

  // try to open the drawer on TARGET the /model way: click the matching rb-object-item, else setAttribute
  const opened = await page.evaluate((t) => {
    const item = [...document.querySelectorAll('rb-object-item')].find(e => (e.getAttribute('ref') || '').includes(t));
    if (item) { item.click(); return 'clicked-item'; }
    const d = document.querySelector('rb-detail-drawer'); if (d) { d.setAttribute('open', ''); d.setAttribute('ref', 'task:' + t); return 'setAttr'; }
    return 'no-drawer';
  }, TARGET.slice(0, 8));
  await sleep(2500);
  const parentCount = () => page.evaluate(() => {
    const d = document.querySelector('rb-detail-drawer'); const panel = d?.querySelector('.drawer-panel-detail') || d;
    const txt = panel?.innerText || '';
    return { pLabels: (txt.match(/(^|\n)\s*Parent\b/g) || []).length, sLabels: (txt.match(/(^|\n)\s*Status\b/g) || []).length, len: (panel?.innerHTML || '').length };
  });
  const b = await parentCount();
  console.log(`open=${opened} → drawer BEFORE make-current: Parent×${b.pLabels} Status×${b.sLabels} len=${b.len}`);
  const mc = await fetch(`${f.base}/api/task/${TARGET}/make-current`, { method: 'POST', headers: oh });
  console.log('make-current →', mc.status);
  await sleep(3000);
  const a = await parentCount();
  console.log(`drawer AFTER make-current: Parent×${a.pLabels} Status×${a.sLabels} len=${a.len}  ${(a.pLabels > b.pLabels || a.len > b.len * 1.4) ? '⚠ GREW (possible defect #2!)' : '= stable'}`);
} finally {
  await browser.close();
  const td = await f.teardown();
  console.log(`teardown: prodUp=${td.prodUp} leftover=${td.leftover}`);
}
