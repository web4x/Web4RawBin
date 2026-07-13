// [test:uuid:9c6cfdbc-107d-40af-adfc-90450149eb81] R30.10 GitApi.fileHistory — /api/git/file-history newest-first + cross-repo + reject-first (traversal/abs/bad-repo->400)
// [test:uuid:16b2721a-dfac-4a8a-8433-f7fedfe5728e] R30.10 RbDiffEditor.populateRightHistory — Open Diff local file -> RIGHT .de-history auto-populates that file versions (newest loaded)
// R30.10 — per-file git history (GitApi.fileHistory e9cfaab3 + RbDiffEditor.populateRightHistory
// 58c11039, prod v0.7.19). READ-ONLY (GET only). DET-3x. Reject-first on the security-sensitive path.
//   PART A fileHistory API: /api/git/file-history?repo=&path= → newest-first commit list (200);
//     bad path (../traversal / abs) → 400 (safeRelPath); bad repo key → 400; cross-repo (oosh) → 200.
//   PART B populateRightHistory UX: Open Diff → LOCAL file → RIGHT auto-populates .de-history select
//     with that file's versions (newest option first).

import https from 'https';
import { chromium } from '@playwright/test';
const HOST = 'prod.wo-da.de', PORT = 4444, BASE = `https://${HOST}:${PORT}`;
const api = (pathq) => new Promise((res) => { const r = https.request({ host: HOST, port: PORT, path: pathq, method: 'GET', rejectUnauthorized: false, timeout: 8000, headers: { Origin: BASE } }, (resp) => { let b = ''; resp.on('data', c => b += c); resp.on('end', () => res({ status: resp.statusCode, body: b })); }); r.on('error', () => res({ status: 0, body: '' })); r.on('timeout', () => { r.destroy(); res({ status: 0, body: '' }); }); r.end(); });
const rej = (s) => s === 400 || s === 403;

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const c = {};
    // PART A — fileHistory API
    const h = await api('/api/git/file-history?repo=rawbin&path=package.json');
    let commits = []; try { commits = JSON.parse(h.body).commits || JSON.parse(h.body).history || []; } catch {}
    c.live = h.status === 200 && commits.length > 0;
    // newest-first: first commit date >= last commit date
    const dt = (x) => new Date(x?.date || x?.authorDate || 0).getTime();
    c.newestFirst = commits.length < 2 || dt(commits[0]) >= dt(commits[commits.length - 1]);
    c.crossRepo = (await api('/api/git/file-history?repo=oosh&path=README.md')).status === 200 || (await api('/api/git/file-history?repo=oosh&path=oo')).status === 200;
    // reject-first (security): traversal / abs / bad repo
    c.rejTraversal = rej((await api('/api/git/file-history?repo=rawbin&path=' + encodeURIComponent('../../../etc/passwd'))).status);
    c.rejAbs = rej((await api('/api/git/file-history?repo=rawbin&path=' + encodeURIComponent('/etc/passwd'))).status);
    c.rejBadRepo = rej((await api('/api/git/file-history?repo=nosuchrepo&path=package.json')).status);

    // PART B — populateRightHistory UX
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1400, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/edit/package.json`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#tb-diff', { timeout: 20000 }).catch(() => {});
    await page.evaluate(() => document.querySelector('#tb-diff')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const ux = await page.evaluate(async () => {
      const nap = (ms) => new Promise(r => setTimeout(r, ms));
      await nap(2500); // showDiff mounts diff + loadSide(local) → populateRightHistory fetches file-history
      const sel = document.querySelector('.el-diff .de-history, rb-diff-editor .de-history, .de-history');
      const opts = sel ? [...sel.querySelectorAll('option')].map(o => (o.textContent || '').slice(0, 40)) : [];
      return { hasSelect: !!sel, optCount: opts.length, first: opts[0] || '' };
    });
    await ctx.close();
    c.historySelect = ux.hasSelect && ux.optCount > 0;

    const pass = c.live && c.newestFirst && c.crossRepo && c.rejTraversal && c.rejAbs && c.rejBadRepo && c.historySelect;
    results.push({ pass, c, ux, n: commits.length });
    console.log(`iter ${i}: API[live=${c.live}(${commits.length}) newestFirst=${c.newestFirst} crossRepo=${c.crossRepo} rejTrav=${c.rejTraversal} rejAbs=${c.rejAbs} rejBadRepo=${c.rejBadRepo}] | UX[select=${c.historySelect} opts=${ux.optCount}] => ${pass ? 'GREEN' : 'RED'}`);
  }
  console.log('\n=== VERDICT R30.10 file-history (DET-3x) ===');
  results.forEach((r, i) => console.log(`  iter ${i + 1}: ${r.pass ? 'GREEN' : 'RED'}`));
  const green = results.length === 3 && results.every(r => r.pass);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
  process.exitCode = green ? 0 : 1;
} finally { await browser.close(); }
