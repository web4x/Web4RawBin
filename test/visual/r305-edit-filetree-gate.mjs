// [test:uuid:5ef5b43f-aa5d-49d6-b79d-e5247bdc80d2] R30.5 RbFileTree.loadDir — /edit full project tree on load (DET-3x GREEN, read-only)
// R30.5 gate — /edit Files pane populates the full project tree on load (RbFileTree.loadDir,
// impl 0b026300, prod v0.7.13). Fix: root dirPath stays '' (dropped ||'/') → /api/files/ hits
// project-root; before, '' → '/' → %2F → server Forbidden → empty tree.
//
// READ-ONLY BY CONSTRUCTION (architect's gate-design law): loads /edit, the tree GETs /api/files/
// (same-origin authorized — no token/name needed), asserts the rendered tree. NO writes, NO identity
// seed, NO profile touch. Nothing to restore. serviceWorkers:'block' = past SW cache. DET-3x.
//   (b) root tree populated with the real project dirs (src / scenario / scrum.pmo / test …), NOT empty.
//   (c) REGRESSION: expanding a subdir (src) loads its children (subdirs send their real path).

import { chromium } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const EXPECT_DIRS = ['src', 'scenario', 'scrum.pmo', 'test'];

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1100, height: 1000 } });
    const page = await ctx.newPage();
    const fileFetches = [];
    page.on('response', (r) => { const u = r.url(); if (u.includes('/api/files/')) fileFetches.push({ url: u, status: r.status() }); });

    await page.goto(`${BASE}/edit`, { waitUntil: 'networkidle' });
    await page.waitForSelector('rb-file-tree', { timeout: 20000 }).catch(() => {});
    // (b) wait for the root tree to populate with folder rows
    let root = { rows: 0, dirs: [], text: '' };
    for (let t = 0; t < 20; t++) {
      root = await page.evaluate(() => {
        const tree = document.querySelector('rb-file-tree'); if (!tree) return { rows: 0, dirs: [], text: '' };
        const rows = [...tree.querySelectorAll(':scope > .ft-row, :scope .ft-row')];
        const topDirs = [...tree.querySelectorAll('[data-dir]')].map(e => (e.getAttribute('data-dir') || '').replace(/\/$/, '')).filter(d => d && !d.includes('/'));
        return { rows: rows.length, dirs: [...new Set(topDirs)], text: (tree.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) };
      });
      if (root.dirs.length > 0) break;
      await sleep(400);
    }
    const rootRes = fileFetches.find(f => f.url.endsWith('/api/files/') || /\/api\/files\/$/.test(f.url));
    const rootAuthorized = !!rootRes && rootRes.status === 200;
    const hasProjectDirs = EXPECT_DIRS.filter(d => root.dirs.includes(d));
    const bPopulated = rootAuthorized && root.dirs.length >= 3 && hasProjectDirs.length >= 3;

    // (c) REGRESSION: expand 'src' → its children load (subdir sends its real path 'src/')
    const beforeExpand = fileFetches.length;
    await page.evaluate(() => { const row = document.querySelector('rb-file-tree [data-dir="src/"]'); row?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await sleep(1500);
    const subFetched = fileFetches.slice(beforeExpand).some(f => /\/api\/files\/src(%2F|\/)?$/.test(f.url) && f.status === 200) || fileFetches.some(f => f.url.includes('files/src') && f.status === 200);
    const subChildren = await page.evaluate(() => { const c = document.querySelector('rb-file-tree [data-children="src/"]'); return c ? c.querySelectorAll('.ft-row').length : 0; });
    const cRegression = subFetched && subChildren > 0;

    const pass = bPopulated && cRegression;
    results.push(pass);
    console.log(`iter ${i}: (b) rootAuth=${rootAuthorized} dirs=[${root.dirs.slice(0, 8).join(',')}] found=[${hasProjectDirs.join(',')}] populated=${bPopulated} | (c) src-expand fetched=${subFetched} children=${subChildren}=${cRegression} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }

  console.log('\n=== VERDICT R30.5 /edit filetree full-tree-on-load (DET-3x) ===');
  results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
  const green = results.length === 3 && results.every(Boolean);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
  process.exitCode = green ? 0 : 1;
} finally { await browser.close(); }
