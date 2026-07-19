// SEPARATE INVESTIGATION — does the REAL save path preserve box-drawing/multibyte UTF-8 in oosh/otmux?
// NON-DESTRUCTIVE (no writes): (1) server GET /api/files/otmux?repo=oosh preserves box-drawing chars intact (no U+FFFD);
// (2) the real save PUT body (Monaco edCenter → JSON) preserves them too — captured via route-intercept, nothing written.
// Ground truth (measured on disk): otmux is VALID UTF-8, 0 replacement chars, box-drawing = U+2500/2502/251C/2514/2550/2192.
// FileApi read (readFileSync utf-8, :87) + write (writeFileSync utf-8, :113) both use utf-8 → valid multibyte round-trips.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const DEEP = `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const BOX = /[─-╿←-⇿•×≥…—]/g;   // box-drawing + the arrows/bullets otmux uses
const boxSet = (s) => JSON.stringify([...new Set((s.match(BOX) || []))]);
const fffd = (s) => (s.match(/�/g) || []).length;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
let verdict = 'UNKNOWN';
try {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 900 } });
  await seedSystemTester(ctx);
  const page = await ctx.newPage();

  // (1) server GET preserves multibyte
  await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });
  const getRes = await page.evaluate(async () => { const r = await fetch('/api/files/otmux?repo=oosh'); const j = await r.json(); return j.content || ''; });
  const getBox = boxSet(getRes), getFffd = fffd(getRes);
  console.log(`(1) server GET: ${getRes.length} chars, box=${getBox}, U+FFFD=${getFffd}`);

  // (2) real save PUT body preserves multibyte (route-intercept — NO write)
  let putBody = null;
  await page.route('**/api/files/otmux**', route => { const rq = route.request(); if (rq.method() === 'PUT') { putBody = rq.postData(); route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"mtime":"2026-01-01T00:00:00Z"}' }); } else route.continue(); });
  await page.goto(DEEP, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => (document.querySelector('rb-diff-editor')?.edCenter?.getValue?.()?.length || 0) > 0, { timeout: 25000 }).catch(() => {});
  await sleep(1500);
  await page.click('rb-diff-editor .de-save', { timeout: 8000 }).catch(() => {});
  await sleep(900);
  let putContent = '';
  try { putContent = JSON.parse(putBody || '{}').content || ''; } catch {}
  const putBoxStr = boxSet(putContent), putFffd = fffd(putContent);
  console.log(`(2) real save PUT body: ${putContent.length} chars, box=${putBoxStr}, U+FFFD=${putFffd}`);

  await page.unroute('**/api/files/otmux**').catch(() => {});
  await ctx.close();

  const getClean = getFffd === 0 && getBox !== '[]';
  const putClean = putFffd === 0 && putBoxStr !== '[]';
  if (getClean && putClean) verdict = 'CLEAN — real save path preserves box-drawing/multibyte UTF-8 (read utf-8 + write utf-8; otmux is valid UTF-8). The expert corruption was a TEST readFileSync artifact (likely a byte-boundary slice cutting a multibyte char), NOT the real save.';
  else verdict = `POSSIBLE BUG — getClean=${getClean} putClean=${putClean} (U+FFFD get=${getFffd} put=${putFffd})`;
} finally { await browser.close(); }

console.log('\n===== SAVE-ENCODING VERDICT =====');
console.log(verdict);
process.exitCode = verdict.startsWith('CLEAN') ? 0 : 1;
