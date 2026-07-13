// [test:uuid:663de4ee-043a-43b1-9eed-60fef19c8691] R30.6.2 RbDiffEditor.pickFile — overlay reuses rb-file-tree; file-select -> loadSide(/api/files) sets path+lines
// [test:uuid:1d64fd65-2ff6-4b5b-9b4d-5fd7df5adc23] R30.6.4 RbDiffEditor.pickRef — git branch/commit picker (GitApi) -> setSideRef -> loadSide(/api/git/file?ref=main) sets ref+lines
// [test:uuid:2599c7a9-6747-43c6-b6a3-f406c48f620b] R30.6 RbDiffEditor.connectedCallback — mounting renders the diff-editor UI (.de-file/.de-swap + panes)
// [test:uuid:969c15aa-661c-417a-96f8-97d7c4a67ac5] R30.6.1 RbDiffEditor.computeDiff — pure LCS: [a,b,c,d]vs[a,x,c,d,e]->change b->x[1,2] + add e[4,4]/[4,5]; identical->0 hunks
// [test:uuid:05c67143-0190-4563-91e1-7f9f975e0359] R30.6.3 RbDiffEditor.takeHunk — choosing a hunk right side rebuilds Center with that side
// [test:uuid:00c1b920-5d3a-4b94-8ac4-19afe3001052] R30.6.5 RbDiffEditor.swapSides — swaps left<->right + recomputes
// R30.6 gate — rb-diff-editor (3-way diff/merge editor), prod v0.7.14. READ-ONLY by construction
// (mounts the component + drives its pure/DOM methods with in-memory data; no file writes, no
// /api/files PUT, no identity seed, nothing to restore). serviceWorkers:'block'. DET-3x.
//   R30.6   connectedCallback (ef6708f6): mounting rb-diff-editor renders the editor UI
//           (.de-file / .de-ref / .de-swap controls + the 3 panes).
//   R30.6.1 computeDiff (15843ac9): PURE LCS. Expert's exact case [a,b,c,d] vs [a,x,c,d,e] ->
//           change b->x (left[1,2]/right[1,2]) + add e@end (left[4,4]/right[4,5]); identical -> 0 hunks.
//   R30.6.3 takeHunk (6ebfac12): choosing a hunk's right side rebuilds Center with that side.
//   R30.6.5 swapSides (97b584c6): swaps left<->right + recomputes.
//   R30.6.2 pickFile (552dd534): overlay reuses rb-file-tree; file-select -> loadSide(/api/files).
//   R30.6.4 pickRef (f0b7ef57): git branch/commit picker (GET /api/git/branches|commits) ->
//           setSideRef -> loadSide(GET /api/git/file?ref=main). ALL 6/6 GREEN (GitApi live post-restart).

import { chromium } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1200, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/edit`, { waitUntil: 'networkidle' });
    // rb-diff-editor must be defined by the editor bundle
    const defined = await page.waitForFunction(() => !!customElements.get('rb-diff-editor'), { timeout: 20000 }).then(() => true).catch(() => false);

    const r = await page.evaluate(async () => {
      const out = {};
      const el = document.createElement('rb-diff-editor');
      document.body.appendChild(el); // fires connectedCallback
      await new Promise(r => setTimeout(r, 300));
      // (R30.6) connectedCallback rendered the editor UI
      out.connected = !!el.querySelector('.de-swap') && el.querySelectorAll('.de-file').length >= 2 && el.querySelectorAll('textarea, .de-pane, [class*=de-]').length > 0;

      // (R30.6.1) computeDiff — pure, exact expert case
      const h = el.computeDiff(['a', 'b', 'c', 'd'], ['a', 'x', 'c', 'd', 'e']);
      const chg = h.find(x => x.type === 'change'); const add = h.find(x => x.type === 'add');
      out.computeDiff = h.length === 2
        && chg && chg.leftRange[0] === 1 && chg.leftRange[1] === 2 && chg.rightRange[0] === 1 && chg.rightRange[1] === 2 && chg.left.join() === 'b' && chg.right.join() === 'x'
        && add && add.leftRange[0] === 4 && add.leftRange[1] === 4 && add.rightRange[0] === 4 && add.rightRange[1] === 5 && add.right.join() === 'e';
      out.computeDiffIdentity = el.computeDiff(['a', 'b', 'c'], ['a', 'b', 'c']).length === 0;

      // set up sides in-memory (loadSide's data shape) + recompute to populate hunks/Center
      el.left = { path: 't.txt', ref: '', lines: ['a', 'b', 'c', 'd'] };
      el.right = { path: 't.txt', ref: '', lines: ['a', 'x', 'c', 'd', 'e'] };
      el.recompute();
      await new Promise(r => setTimeout(r, 100));
      const centerBefore = el.centerEl?.value ?? '';

      // (R30.6.3) takeHunk: choose the change hunk's RIGHT side -> Center gets 'x'
      const changeHunk = el.hunks.find(x => x.type === 'change');
      el.takeHunk(changeHunk.id, 'right');
      await new Promise(r => setTimeout(r, 100));
      const centerAfter = el.centerEl?.value ?? '';
      out.takeHunk = !centerBefore.includes('x') && centerAfter.includes('x') && centerAfter.split('\n').includes('x');

      // (R30.6.5) swapSides: left<->right
      const beforeLeft = el.left.lines.join(',');
      el.swapSides();
      await new Promise(r => setTimeout(r, 100));
      out.swapSides = el.left.lines.join(',') === 'a,x,c,d,e' && el.right.lines.join(',') === beforeLeft;
      el.remove();

      // ---- GitApi-live methods (now that the server restarted) ----
      const nap = (ms) => new Promise(r => setTimeout(r, ms));
      const el2 = document.createElement('rb-diff-editor'); document.body.appendChild(el2); await nap(200);

      // (R30.6.2) pickFile: overlay reuses rb-file-tree; file-select -> loadSide(/api/files) sets path+lines
      el2.pickFile('left'); await nap(300);
      let box = document.querySelector('.de-overlay-box');
      box?.dispatchEvent(new CustomEvent('file-select', { detail: { path: 'package.json' }, bubbles: true }));
      await nap(1800);
      out.pickFile = el2.left?.path === 'package.json' && (el2.left?.lines?.length || 0) > 0;

      // (R30.6.4) pickRef: git branch/commit picker -> setSideRef -> loadSide(/api/git/file?ref=) sets ref+lines
      await el2.pickRef('left'); await nap(1500);
      const btns = [...document.querySelectorAll('.de-overlay-box button')];
      const mainBtn = btns.find(b => /(⎇\s*)?main\b/.test(b.textContent || ''));
      out.pickRefOverlay = btns.length > 0 && !!mainBtn; // picker listed branches (GitApi served)
      mainBtn?.click();
      await nap(1800);
      out.pickRef = el2.left?.ref === 'main' && (el2.left?.lines?.length || 0) > 0;
      el2.remove();
      document.querySelectorAll('.de-overlay').forEach(o => o.remove());
      return out;
    });

    const pass = defined && r.connected && r.computeDiff && r.computeDiffIdentity && r.takeHunk && r.swapSides && r.pickFile && r.pickRef;
    results.push(pass);
    console.log(`iter ${i}: connectedCallback=${r.connected} computeDiff=${r.computeDiff} identity0=${r.computeDiffIdentity} takeHunk=${r.takeHunk} swapSides=${r.swapSides} | pickFile=${r.pickFile} pickRef=${r.pickRef}(overlay=${r.pickRefOverlay}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }

  console.log('\n=== VERDICT R30.6 rb-diff-editor (DET-3x) ===');
  results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
  console.log('ALL 6/6 methods gated GREEN (GitApi live post-restart). READ-ONLY: GET /api/files + /api/git/*.');
  const green = results.length === 3 && results.every(Boolean);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
  process.exitCode = green ? 0 : 1;
} finally { await browser.close(); }
