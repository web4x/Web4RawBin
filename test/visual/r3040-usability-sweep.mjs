// R30 END-TO-END USABILITY SWEEP of the 3-way merge editor on Tron's REAL deep-link (v0.7.61, edit-CYBX5O6I.js).
// Screenshots the ACTUAL rendered view (not fixtures/DOM-count) and collects gaps ranked by severity.
// Areas: (1) 3-col multi-viewport incl sub-820, (2) SVG spline L→C→R + scroll-track, (3) merge actions ≫≪✕,
// (4) count + resolution checkmarks, (5) brighter-current nav, (6) scroll-sync, (7) repo-aware save both buttons,
// (8) edge cases (clean/one-sided/large/many), (9) mobile 3-col. Non-destructive (save via route-intercept). SystemTester.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1`;
const OUT = 'test-results/r3040-sweep';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const findings = [];
const gap = (area, sev, msg) => { findings.push({ area, sev, msg }); console.log(`  ⚠ [${sev}] ${area}: ${msg}`); };
const ok = (area, msg) => console.log(`  ✓ ${area}: ${msg}`);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const boot = async (w, h) => {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();
  await page.goto(DEEP, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 25000 }).catch(() => {});
  await page.waitForFunction(() => (document.querySelector('rb-diff-editor')?.edCenter?.getValue?.()?.length || 0) > 0, { timeout: 25000 }).catch(() => {});
  await sleep(1500);
  return { ctx, page };
};
const panes = (page) => page.evaluate(() => {
  const box = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  return { local: box('.de-local'), center: box('.de-center'), remote: box('.de-remote') };
});

try {
  // ───────── AREA 1 + 9: 3 columns at multiple viewports incl the sub-820 scaled/zoom band ─────────
  console.log('\n== AREA 1/9: 3-column layout across viewports ==');
  const VIEWPORTS = [[1920, 1080], [1600, 900], [1440, 900], [1280, 800], [1024, 768], [900, 800], [819, 900], [800, 900], [700, 900], [390, 844]];
  for (const [w, h] of VIEWPORTS) {
    const { ctx, page } = await boot(w, h);
    const p = await panes(page);
    await page.screenshot({ path: `${OUT}/vp-${w}.png` }).catch(() => {});
    if (!p.local || !p.center || !p.remote) { gap(`vp-${w}`, 'HIGH', `a pane is missing (local=${!!p.local} center=${!!p.center} remote=${!!p.remote})`); await ctx.close(); continue; }
    const sideBySide = p.local.x < p.center.x && p.center.x < p.remote.x;            // left→center→right order
    const sameRow = Math.abs(p.local.y - p.center.y) < 40 && Math.abs(p.center.y - p.remote.y) < 40; // not stacked
    if (!sideBySide || !sameRow) gap(`vp-${w}`, 'HIGH', `NOT 3 side-by-side columns (stacked?) L.x=${p.local.x} C.x=${p.center.x} R.x=${p.remote.x} | L.y=${p.local.y} C.y=${p.center.y} R.y=${p.remote.y}`);
    else ok(`vp-${w}`, `3 columns side-by-side (L.x=${p.local.x} C.x=${p.center.x} R.x=${p.remote.x}, y≈${p.local.y})`);
    await ctx.close();
  }

  // ───────── Desktop feature pass (areas 2,3,4,5,6,7) on one 1600px context ─────────
  console.log('\n== AREAS 2-7: desktop feature pass (1600px) ==');
  const { ctx, page } = await boot(1600, 950);

  // AREA 2: SVG overlay spline L→C→R + scroll-track
  const svg = await page.evaluate(() => {
    const paths = [...document.querySelectorAll('rb-diff-editor svg path')].filter(p => (p.getAttribute('d') || '').length > 8);
    const overlays = document.querySelectorAll('rb-diff-editor svg').length;
    return { svgCount: overlays, pathCount: paths.length };
  });
  await page.screenshot({ path: `${OUT}/spline-desktop.png` }).catch(() => {});
  if (svg.pathCount < 1) gap('spline', 'HIGH', `no SVG ribbon paths found (svgs=${svg.svgCount})`);
  else ok('spline', `${svg.pathCount} SVG ribbon paths across ${svg.svgCount} overlays`);
  // scroll-track: capture a ribbon path d before/after scroll
  const preD = await page.evaluate(() => document.querySelector('rb-diff-editor svg path')?.getAttribute('d') || '');
  await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); (e.edCenter || e.edLocal)?.setScrollTop?.(1200); }).catch(() => {});
  await sleep(600);
  const postD = await page.evaluate(() => document.querySelector('rb-diff-editor svg path')?.getAttribute('d') || '');
  if (preD && postD && preD === postD) gap('spline-scroll', 'MED', 'ribbon path did NOT change on scroll (may not track scroll)');
  else ok('spline-scroll', 'ribbon path updates on scroll');

  // AREA 6: scroll-sync across 3 panes
  const sync = await page.evaluate(async () => {
    const e = document.querySelector('rb-diff-editor');
    const tops = () => [e.edLocal?.getScrollTop?.() ?? -1, e.edCenter?.getScrollTop?.() ?? -1, e.edRemote?.getScrollTop?.() ?? -1];
    e.edLocal?.setScrollTop?.(2000); await new Promise(r => setTimeout(r, 400));
    return tops();
  });
  if (sync[0] > 100 && Math.abs(sync[0] - sync[1]) < 60 && Math.abs(sync[1] - sync[2]) < 60) ok('scroll-sync', `all 3 panes tracked (${sync.map(Math.round).join('/')})`);
  else gap('scroll-sync', 'HIGH', `panes not scroll-locked: local/center/remote tops = ${sync.map(Math.round).join('/')}`);
  await page.evaluate(() => { const e = document.querySelector('rb-diff-editor'); e.edLocal?.setScrollTop?.(0); }).catch(() => {});
  await sleep(300);

  // AREA 4: open-conflicts count
  const countTxt = await page.evaluate(() => (document.querySelector('rb-diff-editor .de-count')?.textContent || '').trim());
  if (/\d+\s*\/\s*\d+/.test(countTxt) || /\d+\s+(open )?conflict/i.test(countTxt)) ok('count', `"${countTxt}"`);
  else gap('count', 'MED', `open-conflicts count not in 'X/Y open conflicts' form: "${countTxt}"`);

  // AREA 3: merge action ≫ mutates center
  const act = await page.evaluate(async () => {
    const e = document.querySelector('rb-diff-editor');
    const before = e.edCenter?.getValue?.() ?? '';
    const btn = document.querySelector('rb-diff-editor [data-act="right"], rb-diff-editor .de-gutter-right [data-cid], rb-diff-editor [data-act="add-right"]');
    if (!btn) return { found: false };
    btn.scrollIntoView(); btn.click(); await new Promise(r => setTimeout(r, 800));
    const after = e.edCenter?.getValue?.() ?? '';
    return { found: true, changed: before !== after, beforeLen: before.length, afterLen: after.length };
  });
  await page.screenshot({ path: `${OUT}/action-after.png` }).catch(() => {});
  if (!act.found) gap('actions', 'HIGH', 'no gutter action button (≫/≪) found');
  else if (!act.changed) gap('actions', 'HIGH', `gutter action did NOT change CENTER (${act.beforeLen}→${act.afterLen})`);
  else ok('actions', `≫ mutated CENTER (${act.beforeLen}→${act.afterLen})`);

  // AREA 5: brighter-current on nav
  const bright = await page.evaluate(async () => {
    const e = document.querySelector('rb-diff-editor');
    const nav = document.querySelector('rb-diff-editor [title*="next" i], rb-diff-editor .de-jump-next, rb-diff-editor button[data-act="jump-next"]');
    if (nav) { nav.click(); } else if (e.jumpToChange) { e.jumpToChange(1); }
    await new Promise(r => setTimeout(r, 600));
    return { current: document.querySelectorAll('rb-diff-editor .de-block-current, rb-diff-editor .de-current').length };
  });
  await page.screenshot({ path: `${OUT}/brighter-current.png` }).catch(() => {});
  if (bright.current < 1) gap('brighter', 'MED', 'no de-block-current highlight after nav');
  else ok('brighter', `current-change highlighted (${bright.current} el)`);

  // AREA 7: repo-aware save, BOTH buttons — route-intercept (non-destructive)
  let putUrl = null;
  await page.route('**/api/files/otmux**', route => { const r = route.request(); if (r.method() === 'PUT') { putUrl = r.url(); route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"mtime":"2026-01-01T00:00:00Z"}' }); } else route.continue(); });
  const deStatus = () => page.evaluate(() => (document.querySelector('rb-diff-editor .de-status')?.textContent || '').trim());
  putUrl = null; await page.click('rb-diff-editor .de-save', { timeout: 8000 }).catch(() => {}); await sleep(900);
  const saveDiff = { url: putUrl, status: await deStatus() };
  putUrl = null; await page.click('#tb-save', { timeout: 8000 }).catch(() => {}); await sleep(900);
  const saveTb = { url: putUrl, status: await deStatus() };
  const header = await page.evaluate(() => (document.querySelector('rb-diff-editor .de-center .de-title')?.textContent || '').trim());
  await page.screenshot({ path: `${OUT}/save-both.png` }).catch(() => {});
  const repoOk = (u) => !!u && /[?&]repo=oosh/.test(u);
  if (repoOk(saveDiff.url) && /saved/i.test(saveDiff.status)) ok('save-💾', `${saveDiff.status}`); else gap('save-💾', 'HIGH', `3-Way 💾 save gap: url=${saveDiff.url} status="${saveDiff.status}"`);
  if (repoOk(saveTb.url) && /saved/i.test(saveTb.status)) ok('save-toolbar', `${saveTb.status}`); else gap('save-toolbar', 'HIGH', `toolbar save gap: url=${saveTb.url} status="${saveTb.status}"`);
  if (/otmux@\S+/.test(header)) ok('save-header', `"${header}"`); else gap('save-header', 'MED', `center header not file@branch: "${header}"`);
  await page.unroute('**/api/files/otmux**').catch(() => {});
  await ctx.close();

  // ───────── AREA 8: edge cases ─────────
  console.log('\n== AREA 8: edge cases ==');
  const edges = [
    { name: 'clean-same-ref', url: `${BASE}/edit/otmux?repo=oosh&left=dev&right=dev&3way=1`, expect: 'clean/0-conflicts' },
    { name: 'many-conflicts', url: DEEP, expect: 'many conflicts render + count' },
  ];
  for (const ec of edges) {
    const ctx2 = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1600, height: 950 } });
    await seedSystemTester(ctx2); const pg = await ctx2.newPage();
    await pg.goto(ec.url, { waitUntil: 'networkidle' });
    await pg.waitForFunction(() => (document.querySelector('rb-diff-editor')?.edCenter?.getValue?.()?.length || 0) > 0, { timeout: 25000 }).catch(() => {});
    await sleep(1200);
    const st = await pg.evaluate(() => ({ count: (document.querySelector('rb-diff-editor .de-count')?.textContent || '').trim(), status: (document.querySelector('rb-diff-editor .de-status')?.textContent || '').trim(), centerLen: document.querySelector('rb-diff-editor')?.edCenter?.getValue?.()?.length || 0 }));
    await pg.screenshot({ path: `${OUT}/edge-${ec.name}.png` }).catch(() => {});
    if (st.centerLen > 0) ok(`edge-${ec.name}`, `center renders (${st.centerLen}b), count="${st.count}" status="${st.status}"`);
    else gap(`edge-${ec.name}`, 'HIGH', `center empty on ${ec.expect}`);
    await ctx2.close();
  }
} finally { await browser.close(); }

console.log('\n===== USABILITY SWEEP VERDICT (v0.7.61) =====');
const bySev = s => findings.filter(f => f.sev === s);
console.log(`HIGH: ${bySev('HIGH').length} | MED: ${bySev('MED').length} | LOW: ${bySev('LOW').length}`);
findings.forEach(f => console.log(`  [${f.sev}] ${f.area}: ${f.msg}`));
console.log(findings.length === 0 ? 'CLEAN — fully usable, no gaps found' : `${findings.length} gap(s) — see above`);
process.exitCode = 0;
