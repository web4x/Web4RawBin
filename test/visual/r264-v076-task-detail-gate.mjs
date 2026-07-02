// [test:uuid:dc94cff0-ec9d-416b-8d9f-cfca9f225f3f] R27.1 renderStatusChecklist — statusChecklist ☑/☐ hierarchy
// v0.7.6 gate — task detail: 📄 Task-file MD link (serves 200) + visual statusChecklist (☑/☐
// hierarchy). READ-ONLY mount of a real Task unit (0c1b375e, sourceFile→sprint-21 planning.md).
// 0 pollution. DET-3x.
//   (1) rb-task-detail shows a 📄 Task file link whose href serves HTTP 200.
//   (2) model.statusChecklist renders as a hierarchical ☑ (done) / ☐ (pending) visual list.
// NOTE flagged: tasks WITHOUT sourceFile derive /md/.../<slug>.md which 404s (per-task MD not generated).

import { chromium } from '@playwright/test';
import https from 'https';

const BASE = 'https://prod.wo-da.de:4444';
const TASK = '0c1b375e-6a2a-4b35-bb64-b43adce88697'; // Task w/ statusChecklist + sourceFile (serves 200)
const httpGet = (p) => new Promise((res) => { const r = https.get({ host: 'prod.wo-da.de', port: 4444, path: p, rejectUnauthorized: false, timeout: 8000 }, (x) => { let n = 0; x.on('data', c => n += c.length); x.on('end', () => res({ status: x.statusCode, size: n })); }); r.on('error', () => res({ status: 0 })); r.on('timeout', () => { r.destroy(); res({ status: 0 }); }); });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
const page = await ctx.newPage();

const results = [];
try {
  await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!customElements.get('rb-task-detail'), { timeout: 20000 }).catch(() => {});
  // wait for the trace graph to load on the tree
  await page.waitForFunction(() => { const t = document.querySelector('rb-trace-tree'); return t && t.graph; }, { timeout: 20000 }).catch(() => {});

  for (let i = 1; i <= 3; i++) {
    const dom = await page.evaluate(async (uuid) => {
      document.querySelectorAll('.__td').forEach(e => e.remove());
      const el = document.createElement('rb-task-detail'); el.className = '__td';
      const tree = document.querySelector('rb-trace-tree'); if (tree && tree.graph) el.graph = tree.graph; // real graph from /trace
      el.setAttribute('ref', `task:${uuid}`); document.body.appendChild(el);
      await new Promise(z => setTimeout(z, 3200));
      const t = el.textContent || '';
      const link = el.querySelector('a[href^="/md/"]');
      // checklist: ☑/☐ glyphs + indented rows
      const checkRows = [...el.querySelectorAll('div')].filter(d => /^[☑☐]\s/.test((d.textContent || '').trim()));
      const hasDone = checkRows.some(d => (d.textContent || '').trim().startsWith('☑'));
      const hasPending = checkRows.some(d => (d.textContent || '').trim().startsWith('☐'));
      const indented = checkRows.some(d => /padding-left:\s*(1[2-9]|[2-9]\d)/.test(d.getAttribute('style') || ''));
      return { taskFileLink: !!link && /📄\s*Task file/.test(t), href: link?.getAttribute('href') || '', rows: checkRows.length, hasDone, hasPending, indented };
    }, TASK);

    // (1) 📄 link present + its href serves 200
    const md = dom.href ? await httpGet(dom.href) : { status: 0 };
    const item1 = dom.taskFileLink && dom.href.startsWith('/md/') && md.status === 200;
    // (2) statusChecklist renders as ☑/☐ glyphs with an indented hierarchy (this task is all-done → ☑ + nesting)
    const item2 = dom.rows >= 2 && (dom.hasDone || dom.hasPending) && dom.indented;
    const pass = item1 && item2;
    results.push(pass);
    console.log(`iter ${i}: (1)📄link-200=${item1}[href=${dom.href.slice(0, 48)},http=${md.status}] (2)checklist☑☐=${item2}[rows=${dom.rows},done=${dom.hasDone},pending=${dom.hasPending},nested=${dom.indented}] => ${pass ? 'GREEN' : 'RED'}`);
  }
} finally { await browser.close(); }

console.log('\n=== VERDICT v0.7.6 task detail (DET-3x) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('READ-ONLY mount — 0 pollution. NOTE: sourceFile-backed tasks serve 200; tasks w/o sourceFile derive /md/.../<slug>.md which 404s (per-task MD not generated) — flagged for expert.');
process.exit(green ? 0 : 1);
