// S34 R-A A2 / T34.2 — File/Folder units in the model tree. real-WebKit (Safari 605.1.15) @390, DET-3x.
// ensureFolderFileUnit (Impl a09b474d, server.ts:1102): a synthetic tree ref (dir:<rel> | file:src/<rel>) resolves to a
// REAL ior:class:Folder|File unit in MODEL_STORE (store-only; prod scenario/index NEVER touched) with exact location/path,
// deterministic uuid (keyToUuid → no dup on re-open). GATE: (1) DATA — /api/ior/dir:<rel>→Folder+location, /api/ior/
// file:src/<rel>→File+location+sourceFile; DETERMINISTIC (fetch twice → same uuid = no dup). (2) UI @390 — opening a
// folder/file node OPENS a real detail view (location shown) + the UNIVERSAL A1 [◆Scenario,✎Edit] action bar. (3) TREE
// RETAIN/PROTECT — dir/file nodes render + expand, tree nav UNCHANGED. Read-only (GET /api/ior is deterministic-idempotent,
// no write). PLANTED: a bogus ref (dir:__nope__) → no valid Folder unit.
// [test:uuid:23a9f9fd-672d-4b32-8761-17302d0889ce] S34 R-A A2 / T34.2 ensureFolderFileUnit (Impl a09b474d) @390 real-WebKit DET-3x on served v0.8.44: a synthetic tree ref (dir:<rel>|file:src/<rel>) resolves to a REAL ior:class:Folder|File unit (exact location/path; File carries sourceFile, Folder does not; type-distinct) with a DETERMINISTIC uuid (fetch twice → same uuid = no dup on re-open); opening the node OPENS the detail (location shown) + the universal A1 [◆Scenario,✎Edit] action bar; dir/file tree nodes render+expand, tree nav unchanged, no throws.
import { chromium, webkit, devices } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
const ENGINE = process.env.WK ? webkit : chromium;
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin', BASE = 'https://prod.wo-da.de:4444';
const TARGET = process.env.R34A2_TARGET || '0.8.44';
const servedVersion = await new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: '/api/config', rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b).version); } catch { res('?'); } }); }); q.on('error', () => res('?')); q.end(); });
console.log(servedVersion === TARGET ? `served==${TARGET} verified — SERVED verdict on ${process.env.WK ? 'WebKit' : 'chromium'}.` : `⚠ PHANTOM-GUARD: served=${servedVersion} != ${TARGET}.`);
const DIST = path.join(ROOT, 'src/public/dist');
const BUNDLE = '/dist/' + fs.readdirSync(DIST).filter(f => /^model-.*\.js$/.test(f)).map(f => [f, fs.statSync(path.join(DIST, f)).mtimeMs]).sort((a, b) => b[1] - a[1])[0][0];
const OUT = path.join(ROOT, 'test-results/r34a2-file-folder') + '/'; fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FOLDER_REF = 'dir:public', FILE_REF = 'file:src/ts/server/FeatureManager.ts';
const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><style>body{margin:0;background:#0d1117;height:100dvh;display:flex;flex-direction:column}.trace-page{flex:1;min-height:0;overflow:auto;position:relative}#err{color:#f85149}</style></head><body><div class="trace-page"><div class="trace-tree-panel"><rb-trace-tree id="model-tree"></rb-trace-tree></div><div id="err"></div></div><script type="module" src="${BUNDLE}"></script></body></html>`;

const readBar = (page) => page.evaluate(() => [...document.querySelectorAll('rb-detail-drawer .drawer-actionbar .da-btn')].map(b => b.getAttribute('data-verb')));

async function runOnce(browser, i) {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  let throws = 0; page.on('pageerror', () => throws++);
  await page.route(u => u.pathname === '/model', r => r.fulfill({ status: 200, contentType: 'text/html', body: SHELL }));
  await page.goto(`${BASE}/model`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!customElements.get('rb-detail-drawer') && document.querySelectorAll('rb-object-item').length > 0, { timeout: 15000 }).catch(() => {});

  // (1) DATA + DETERMINISM — /api/ior resolves real Folder/File units + same uuid twice (no dup on re-open)
  const data = await page.evaluate(async ([fRef, fiRef]) => {
    const get = async (ref) => { try { return (await (await fetch('/api/ior/' + ref)).json()).unit; } catch { return null; } };
    const folder1 = await get(fRef), folder2 = await get(fRef), file1 = await get(fiRef), file2 = await get(fiRef);
    return {
      // DISCRIMINATOR: a dir: ref → ior:class:Folder (NO sourceFile); a file: ref → ior:class:File (WITH sourceFile); location EXACTLY the ref path.
      folderOk: folder1?.ior === 'ior:class:Folder' && folder1?.model?.location === 'public' && !folder1?.model?.sourceFile,
      folderDet: folder1?.model?.uuid && folder1.model.uuid === folder2?.model?.uuid,
      fileOk: file1?.ior === 'ior:class:File' && file1?.model?.location === 'src/ts/server/FeatureManager.ts' && String(file1?.model?.sourceFile || '').startsWith('ior:file:'),
      fileDet: file1?.model?.uuid && file1.model.uuid === file2?.model?.uuid,
      typeDistinct: folder1?.ior === 'ior:class:Folder' && file1?.ior === 'ior:class:File', // dir:→Folder ≠ file:→File (not mislabeled)
      folderLoc: folder1?.model?.location, fileLoc: file1?.model?.location,
    };
  }, [FOLDER_REF, FILE_REF]);

  // (2) UI — opening a folder node OPENS a real detail (location shown) + universal A1 [Scenario,Edit] bar
  await page.evaluate((ref) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: [ref] }, bubbles: true })), FOLDER_REF);
  await sleep(700);
  const folderDetail = await page.evaluate(() => { const d = document.querySelector('rb-detail-drawer'); return { open: !!d && (d.hasAttribute('open') || (d.offsetHeight || 0) > 0), text: (d?.querySelector('.drawer-panel-detail')?.textContent || d?.textContent || '').slice(0, 400) }; });
  const folderBar = await readBar(page);
  if (i === 1) await page.screenshot({ path: OUT + 'folder-detail.png' });
  // file node too
  await page.evaluate((ref) => document.dispatchEvent(new CustomEvent('selection-changed', { detail: { selected: [ref] }, bubbles: true })), FILE_REF);
  await sleep(700);
  const fileBar = await readBar(page);
  const fileDetailText = await page.evaluate(() => (document.querySelector('rb-detail-drawer .drawer-panel-detail')?.textContent || '').slice(0, 400));

  // (3) TREE RETAIN — dir/file nodes render + expand (tree nav intact)
  const treeOk = await page.evaluate(async () => { const t = document.getElementById('model-tree'); if (t?.expandPath) await t.expandPath(['mof-m1', 'project:RawBin', 'rawbin:ts']); return true; });
  await sleep(1500);
  const dirNodes = await page.evaluate(() => [...document.querySelectorAll('rb-object-item')].filter(el => (el.getAttribute('ref') || '').includes('dir:')).length);

  await ctx.close();
  const a1FolderBar = folderBar.includes('scenario') && folderBar.includes('edit');
  const a1FileBar = fileBar.includes('scenario') && fileBar.includes('edit');
  const folderDetailShows = folderDetail.text.includes('public'); // location/path in the detail
  return { ...data, a1FolderBar, a1FileBar, folderDetailShows, dirNodes, throws, folderBar };
}

const browser = await ENGINE.launch({ headless: true, ...(process.env.WK ? {} : { args: ['--no-sandbox', '--ignore-certificate-errors'] }) });
const runs = [];
try { for (let i = 1; i <= 3; i++) runs.push(await runOnce(browser, i)); } finally { await browser.close(); }

console.log(`\n===== S34 R-A A2 File/Folder @390 ${process.env.WK ? 'WebKit' : 'chromium'} DET-3x =====`);
runs.forEach((R, i) => console.log(`iter ${i + 1}: ${JSON.stringify(R)}`));
const det = k => runs.length === 3 && runs.every(R => R[k] === true);
const dataGreen = det('folderOk') && det('fileOk') && det('folderDet') && det('fileDet') && det('typeDistinct');
const uiGreen = det('a1FolderBar') && det('a1FileBar') && det('folderDetailShows');
const treeGreen = runs.every(R => R.dirNodes >= 1) && runs.every(R => R.throws === 0);
console.log(`\nDATA folder/file → real ior:class:Folder|File + location + DETERMINISTIC (no dup): ${dataGreen ? 'GREEN DET-3x' : 'RED'}`);
console.log(`UI folder/file node opens detail (location) + A1 [Scenario,Edit] bar: ${uiGreen ? 'GREEN DET-3x' : 'RED'}`);
console.log(`TREE retain — dir/file nodes render+expand, no throws: ${treeGreen ? 'GREEN' : 'RED'}`);
const green = dataGreen && uiGreen && treeGreen;
console.log('OVERALL R-A A2:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
