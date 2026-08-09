// R40.19 — History back-navigation regression gate (architect design 31f40eb32). Protects rb-editor-toolbar.ts
// historyBack (Impl 6b4d7714, #tb-back → window.history.back) + pathLabelNav (Impl 197054f9, #tb-path → /md/<parent>/).
// Tron: back-nav is PERFECT NOW and must not regress. BEHAVIOURAL @390 real-WebKit, never DOM-count — a rendered
// back button that does nothing passes a count, so we assert the navigation OUTCOME (the view actually became the
// correct target, by URL + rendered identity). STUB-MUST-FAIL both ways + anti-vacuity negative control. DET-3x.
// FRESHNESS: on GREEN, stamps served version + HEAD to test-results/r4019/STAMP.json (committed) so a green older than
// the served artifact reads NOT-RUN. Registered in gate:device:live → auto-runs post-deploy (item 1).
import { webkit, devices } from '@playwright/test';
import { execSync } from 'node:child_process';
import https from 'node:https';
import fs from 'node:fs';
const BASE = 'https://prod.wo-da.de:4444';
const A = 'scripts/check-sprint-label.ts';   // in a folder → containingFolderHref = /md/scripts/
const B = 'package.json';                     // root file → distinct history entry
const iPhone = devices['iPhone 12'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const servedVersion = () => new Promise((res) => { https.get(`${BASE}/api/config`, { rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }).on('error', () => res('?')); });

const openEdit = async (page, path) => { await page.goto(`${BASE}/edit/${path}`, { waitUntil: 'networkidle' }); await page.waitForSelector('#tb-back', { timeout: 15000 }).catch(() => {}); await sleep(400); };
const pathLabel = (page) => page.evaluate(() => document.querySelector('#tb-path')?.textContent?.replace(/ ●$/, '').trim() || '');

const browser = await webkit.launch();
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...iPhone, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();

    // (A) REAL back lands on the CORRECT previous view (A), asserted by URL + rendered identity (#tb-path)
    await openEdit(page, A); await openEdit(page, B);               // history: A → B, now on B
    await page.click('#tb-back'); await sleep(1500);
    const backUrlOk = /\/edit\/scripts\/check-sprint-label\.ts/.test(page.url());
    const backIdOk = /check-sprint-label\.ts/.test(await pathLabel(page));
    const aReal = backUrlOk && backIdOk;

    // (A) STUB-MUST-FAIL: neuter window.history.back → tap back → must NOT land on A (stays B)
    await openEdit(page, A); await openEdit(page, B);
    await page.evaluate(() => { window.history.back = () => {}; });
    await page.click('#tb-back'); await sleep(1000);
    const aStubHeld = /\/edit\/package\.json/.test(page.url());     // stayed on B = the real assertion would go RED here

    // (B) REAL path-label nav resolves the containing folder view (/md/scripts/), asserted by rendered content (not 404/blank)
    await openEdit(page, A);
    await page.click('#tb-path'); await page.waitForLoadState('networkidle').catch(() => {}); await sleep(1200);
    const folderUrlOk = /\/md\/scripts\/?$/.test(page.url());
    const folderRendered = await page.evaluate(() => !/404/.test(document.title) && (document.body.innerText || '').length > 40);
    const bReal = folderUrlOk && folderRendered;

    // (B) STUB-MUST-FAIL: neuter pathLabelNav → tap path → folder must NOT render (url unchanged)
    await openEdit(page, A);
    await page.evaluate(() => { const t = document.querySelector('rb-editor-toolbar'); if (t) t.pathLabelNav = () => {}; });
    await page.click('#tb-path'); await sleep(1000);
    const bStubHeld = /\/edit\/scripts\/check-sprint-label\.ts/.test(page.url()); // stayed on the file = assertion would go RED

    // ANTI-VACUITY negative control: a NON-back tap (#tb-mode) must NOT navigate back
    await openEdit(page, A); await openEdit(page, B);
    await page.click('#tb-mode').catch(() => {}); await sleep(800);
    const negControlOk = /\/edit\/package\.json/.test(page.url());  // still on B — did not spuriously go back

    const pass = aReal && aStubHeld && bReal && bStubHeld && negControlOk;
    results.push(pass);
    console.log(`iter ${i}: (A)back→correct=${aReal}(url=${backUrlOk} id=${backIdOk}) | (A)stub-must-fail=${aStubHeld} | (B)path→folder=${bReal}(url=${folderUrlOk} rendered=${folderRendered}) | (B)stub-must-fail=${bStubHeld} | neg-control(non-back≠back)=${negControlOk} => ${pass ? 'GREEN' : 'RED'}`);
    if (i === 1) await page.screenshot({ path: 'test-results/r4019/folder-after-pathnav-iter1.png' }).catch(() => {});
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R40.19 history-back regression @390 real-WebKit (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
if (green) {
  const version = await servedVersion();
  const head = execSync('git rev-parse --short HEAD', { cwd: '/var/dev/Workspaces/web4x/Web4RawBin', encoding: 'utf8' }).trim();
  fs.mkdirSync('test-results/r4019', { recursive: true });
  fs.writeFileSync('test-results/r4019/STAMP.json', JSON.stringify({ gate: 'r4019-history-back', result: 'GREEN', servedVersion: version, head, impls: ['6b4d7714', '197054f9'] }, null, 2) + '\n');
  console.log(`FRESHNESS STAMP: GREEN @ served ${version} / HEAD ${head} → test-results/r4019/STAMP.json`);
}
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
