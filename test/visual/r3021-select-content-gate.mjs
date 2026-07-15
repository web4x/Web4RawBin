// [test:uuid:cc76beea-de3f-46ba-9aad-09728ebd803a] R30.21 non-sprint detail render (renderDetailForRef / graph-null fetch-fallback) — Tron's 'select task/class → no content': selecting a NON-SPRINT node (task/requirement/class/impl) in the drawer must render REAL detail CONTENT (dv-title/dv-link), not an empty ~125-char shell. Sprint already renders (renderSprintDetail); this covers the other types.
// R30.21 (v0.7.x). RED BASELINE until the non-sprint renderer is fixed (drawer renders sprint=5135 chars but task/impl=~125 empty). Behavior-first, DET-3x. SystemTester.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const SPRINT = 'sprint:2173e549-ca99-43e5-aea8-946b02141c13';
const IMPL = 'impl:7f15c149-677d-4eec-a2dd-2ea29aa0eb25'; // real impl unit

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1200, height: 900 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
    await sleep(600);
    const r = await page.evaluate(async ({ sprint, impl }) => {
      let d = document.querySelector('rb-detail-drawer'); if (!d) { d = document.createElement('rb-detail-drawer'); document.body.appendChild(d); }
      const render = async (ref) => { d.removeAttribute('ref'); await new Promise(r => setTimeout(r, 100)); d.setAttribute('ref', ref); await new Promise(r => setTimeout(r, 1400)); const dp = d.querySelector('.drawer-panel-detail'); return { len: (dp?.innerHTML || '').length, content: /dv-title|dv-head|dv-link/.test(dp?.innerHTML || '') }; };
      // sprint = control (must always render); grab a real task ref from the sprint's dv-links
      const s = await render(sprint);
      const taskRef = d.querySelector('.drawer-panel-detail [data-ref^="task:"]')?.getAttribute('data-ref');
      const task = taskRef ? await render(taskRef) : { len: 0, content: false };
      const im = await render(impl);
      return { sprintContent: s.content, sprintLen: s.len, taskRef, taskContent: task.content, taskLen: task.len, implContent: im.content, implLen: im.len };
    }, { sprint: SPRINT, impl: IMPL });
    // R30.21 GREEN = non-sprint types render REAL content (task + impl), with sprint still rendering (control)
    const pass = r.sprintContent === true && r.taskRef != null && r.taskContent === true && r.implContent === true;
    results.push(pass);
    console.log(`iter ${i}: sprint=${r.sprintContent}(${r.sprintLen}) | task=${r.taskContent}(${r.taskLen}) | impl=${r.implContent}(${r.implLen}) => ${pass ? 'GREEN' : 'RED (non-sprint render empty)'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.21 non-sprint detail render (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED — task/class/impl render EMPTY (Tron regression; RED until non-sprint renderer fixed)');
process.exitCode = green ? 0 : 1;
