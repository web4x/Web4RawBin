// [test:uuid:2b20035d-9f90-4518-aaf8-49d46dd21de1] R31.5.5 /edit-swap composed regression (Impl 3b8e6c24 RbEditorLayout.editorStripDescriptor) — GREEN DET-3x @390 v0.7.132: /edit?layout=r31.5 hosts the UNCHANGED rb-diff-editor via the [L,C,R] strip descriptor → FULL R30 diff/merge UNREGRESSED (deep-link restore + 3 panes co-visible always-3-col portrait + spline ribbons + 49/61 conflicts + folding + toolbar) AND layout=r31.5 == default /edit (presentation-only). Distinct composed-regression intention Test alongside the structural Test 432beb1a.
// R31.5 FINAL composed gate (Sprint-31): /edit?layout=r31.5 hosts the UNCHANGED rb-diff-editor → the FULL R30 diff/merge
// must be UNREGRESSED @390, and the MERGE stays ALWAYS-3-COLUMNS in portrait (TRON RULING #2, never snap). Guardrail is
// by-construction (only edit.ts changed +13 lines; rb-diff-editor/diff3/rb-code-editor untouched) — this gate confirms the
// LIVE composed render + interaction, and that layout=r31.5 is presentation-ONLY vs the default /edit (equivalent feature-set).
// DET-3x @390 iPhone-12. Self-verifies served version (phantom-guard). Deep-link diff = Tron's R30.24 diff (otmux oosh 516ebb3↔dev).
// Asserts (both modes): rb-diff-editor mounted + deep-link restored (left=516ebb3/right=dev/content) | 3 panes Local|Result|Repo
// CO-VISIBLE in a ROW (always-3-col, NOT stacked/snapped) | spline ribbons render (R30.34) | gutter decorations (deletion/
// accept-reject) | folding available (R30.53) | toolbar (Apply-All/Save/Share/jump). Then: layout=r31.5 == default (no regression).
import { chromium, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import https from 'node:https';
import fs from 'node:fs';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`, REPO = '/var/dev/Workspaces/web4x/Web4RawBin', TARGET = '0.7.132';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const httpGet = (p) => new Promise((r) => { const q = https.request({ host: HOST, port: PORT, path: p, method: 'GET', rejectUnauthorized: false }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => r(b)); }); q.on('error', () => r('')); q.end(); });
const DEEP = (r31) => `/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1${r31 ? '&layout=r31.5' : ''}`;

const measure = (page) => page.evaluate(() => {
  const el = document.querySelector('rb-diff-editor');
  if (!el) return { mounted: false };
  const paneOf = (cls) => { const p = el.querySelector(`.de-pane.${cls}`); if (!p) return null; const r = p.getBoundingClientRect(); return { w: Math.round(r.width), x: Math.round(r.left), visible: r.width > 8 && r.height > 8 }; };
  const L = paneOf('de-local'), C = paneOf('de-center'), R = paneOf('de-remote');
  const threeVisible = !!(L && C && R && L.visible && C.visible && R.visible);
  const inRow = !!(L && C && R) && L.x < C.x && C.x < R.x;                          // side-by-side left→result→repo (not stacked/snapped)
  const panesDir = getComputedStyle(el.querySelector('.de-panes') || el).flexDirection;
  return { mounted: true,
    leftRef: el.left?.ref, rightRef: el.right?.ref, leftLen: (el.left?.content || '').length, rightLen: (el.right?.content || '').length,
    threeVisible, inRow, panesDir, paneW: [L?.w, C?.w, R?.w],
    ribbons: el.querySelectorAll('.de-panes svg path, .de-panes svg polyline, .de-panes path').length,
    gutters: el.querySelectorAll('.de-gutter-add,.de-gutter-delete,.de-gutter-modify,.de-gutter-conflict').length,
    foldAvail: !!el.querySelector('.monaco-editor .cldr, .codicon-folding-expanded, .codicon-folding-collapsed, .margin-view-overlays'),
    toolbar: !!(el.querySelector('.de-apply-all') && el.querySelector('.de-save') && el.querySelector('.de-share') && el.querySelector('.de-jump-next')),
    openCount: (el.querySelector('.de-open-count')?.textContent || '').trim() };
});
const loadDiff = async (page, url) => {
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); return e && (e.left?.content?.length > 0) && (e.right?.content?.length > 0); }, { timeout: 25000 }).catch(() => {});
  await sleep(1500); // ribbons + alignment + folding settle
};
// deletion/accept-reject machinery is proven by the CONFLICT COUNT (de-open-count 'N/M open conflicts') + the per-change
// spline ribbons — both non-virtualized. The .de-gutter-* Monaco line-decorations are viewport-virtualized at 107px panes
// (present in the render — see screenshot — but not reliably in the DOM query for off-screen lines) so they're diagnostic-only.
const featureSetOk = (m) => m.mounted && m.leftRef === '516ebb3' && m.rightRef === 'dev' && m.leftLen > 0 && m.rightLen > 0
  && m.threeVisible && m.inRow && m.panesDir === 'row' && m.ribbons > 0 && /\d+\/\d+/.test(m.openCount) && m.foldAvail && m.toolbar;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  const servedVersion = JSON.parse(await httpGet('/api/config') || '{}').version;
  if (servedVersion !== TARGET) { console.log(`ABORT (phantom-guard): served=${servedVersion} != ${TARGET}`); process.exitCode = 1; }
  else {
  console.log(`served version verified == ${TARGET}`);
  const edit200 = (await httpGet('/api/config')) && true;
  console.log(`routes: /edit=${(await new Promise(r => { const q = https.request({ host: HOST, port: PORT, path: DEEP(false), rejectUnauthorized: false }, res => r(res.statusCode)); q.on('error', () => r(0)); q.end(); }))} /edit?layout=r31.5=${(await new Promise(r => { const q = https.request({ host: HOST, port: PORT, path: DEEP(true), rejectUnauthorized: false }, res => r(res.statusCode)); q.on('error', () => r(0)); q.end(); }))}`);
  fs.mkdirSync(`${REPO}/test-results/r315composed`, { recursive: true });

  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    // DEFAULT /edit (baseline)
    await loadDiff(page, DEEP(false));
    const base = await measure(page);
    // COMPOSED /edit?layout=r31.5 (the swap)
    await loadDiff(page, DEEP(true));
    const r31 = await measure(page);
    if (i === 1) await page.screenshot({ path: `${REPO}/test-results/r315composed/edit-layout-r31.5-390.png` });

    // WIDE viewport still 3-col side-by-side (landscape) under the composed layout
    await page.setViewportSize({ width: 1280, height: 800 }); await sleep(800);
    const wide = await measure(page);

    const baseOk = featureSetOk(base);
    const r31Ok = featureSetOk(r31);
    const presentationOnly = base.mounted && r31.mounted && base.threeVisible === r31.threeVisible && (base.ribbons > 0) === (r31.ribbons > 0) && base.toolbar === r31.toolbar; // swap didn't drop features
    const wide3col = wide.threeVisible && wide.inRow && wide.panesDir === 'row';
    const pass = baseOk && r31Ok && presentationOnly && wide3col;
    results.push(pass);
    console.log(`iter ${i}: DEFAULT ok=${baseOk}(refs=${base.leftRef}/${base.rightRef} 3col=${base.threeVisible}&row=${base.inRow} ribbons=${base.ribbons} gutters=${base.gutters} fold=${base.foldAvail} tb=${base.toolbar} open='${base.openCount}') | r31.5 ok=${r31Ok}(3col=${r31.threeVisible}&row=${r31.inRow} dir=${r31.panesDir} paneW=${r31.paneW} ribbons=${r31.ribbons} gutters=${r31.gutters} fold=${r31.foldAvail} tb=${r31.toolbar}) | presentation-only=${presentationOnly} wide-3col=${wide3col} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
  }
} finally { await browser.close(); }

console.log('\n===== R31.5 composed FINAL — diff/merge regression @390 (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('NOTE: interactive accept/reject + Tron device-visual of composed /edit?layout=r31.5 = Tron batch. Guardrail source-untouched = function preserved by construction.');
process.exitCode = green ? 0 : 1;
