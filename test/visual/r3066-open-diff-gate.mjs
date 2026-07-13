// [test:uuid:43f0c9f5-e657-419e-af4e-d0e3f7d4b90c] R30.6.6 RbEditorLayout.showDiff — [Open Diff] lazy-mounts diff LEFT=current file+buffer (DET-3x GREEN, read-only)
// R30.6.6 gate — [🔀 Open Diff] toolbar button lazy-mounts rb-diff-editor with LEFT preselected to
// the current file (path + CURRENT buffer, so unsaved edits show). RbEditorLayout.showDiff (impl
// dc302e8e, prod v0.7.15). READ-ONLY by construction: opens a file (GET), edits the buffer IN-MEMORY
// (client-side, no save/PUT), clicks Open Diff (mounts overlay + loadSide with in-memory content = no
// fetch). No writes, no seed, nothing to restore. serviceWorkers:'block'. DET-3x.
//   AC-button   : [🔀 Open Diff] (#tb-diff) present in the toolbar next to Save.
//   AC-mount    : rb-diff-editor overlay (.el-diff) created LAZILY — absent before click, present after.
//   AC-dispatch : click #tb-diff -> toolbar-open-diff -> showDiff(currentFilePath).
//   AC-preselect: LEFT path = current file AND LEFT content = current buffer (incl. an unsaved edit).

import { chromium } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const FILE = 'package.json';
const MARK = 'ZZ_UNSAVED_EDIT_MARKER_' ;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1300, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/edit/${FILE}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('rb-editor-toolbar', { timeout: 20000 }).catch(() => {});
    // wait for the code editor to load the file content
    await page.waitForFunction(() => { const c = document.querySelector('rb-code-editor'); return c && c.getValue && c.getValue().length > 0; }, { timeout: 20000 }).catch(() => {});
    await sleep(600);
    const tag = MARK + i;

    const r = await page.evaluate(async ({ mark, file }) => {
      const out = {};
      const nap = (ms) => new Promise(r => setTimeout(r, ms));
      // AC-button: [Open Diff] present near Save
      out.button = !!document.querySelector('#tb-diff') && /Open Diff/i.test(document.querySelector('#tb-diff')?.textContent || '') && !!document.querySelector('#tb-save, [id*="save"], .tb-btn');
      // AC-mount: overlay is lazy — must NOT exist before the click
      out.lazyBefore = !document.querySelector('.el-diff rb-diff-editor');
      // introduce an UNSAVED buffer edit (client-side only, no save) via the underlying Monaco editor
      const ce = document.querySelector('rb-code-editor');
      const orig = ce.getValue();
      (ce.editor?.setValue ? ce.editor.setValue(mark + '\n' + orig) : (ce.editor?.getModel?.()?.setValue?.(mark + '\n' + orig)));
      out.buffered = ce.getValue().startsWith(mark);
      // AC-dispatch: click the real toolbar button
      document.querySelector('#tb-diff').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await nap(1200);
      // AC-mount: overlay + rb-diff-editor now present
      const diff = document.querySelector('.el-diff rb-diff-editor');
      out.mounted = !!document.querySelector('.el-diff') && !!diff;
      // AC-preselect: LEFT path = current file AND LEFT content = current buffer (incl the unsaved mark)
      out.leftPath = diff?.left?.path === file;
      const leftContent = (diff?.left?.lines || []).join('\n');
      out.leftIsBuffer = leftContent.startsWith(mark) && leftContent.includes('"name"'); // buffer = mark + package.json
      return out;
    }, { mark: tag, file: FILE });

    const pass = r.button && r.lazyBefore && r.buffered && r.mounted && r.leftPath && r.leftIsBuffer;
    results.push(pass);
    console.log(`iter ${i}: button=${r.button} lazyBefore=${r.lazyBefore} buffered=${r.buffered} mounted=${r.mounted} leftPath=${r.leftPath} leftIsBuffer=${r.leftIsBuffer} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }

  console.log('\n=== VERDICT R30.6.6 [Open Diff] LEFT=current-file+buffer (DET-3x) ===');
  results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
  const green = results.length === 3 && results.every(Boolean);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
  process.exitCode = green ? 0 : 1;
} finally { await browser.close(); }
