// [test:uuid:cc76beea-de3f-46ba-9aad-09728ebd803a] R30.21 graph-independent detail render (RbDetailDrawer.resolveDetailUnit 159fb8f0 — /api/ior fetch-fallback + self-registered detail elements) — Tron's 'select task/class → no content': selecting ANY node type in the drawer renders REAL detail CONTENT, not an empty ~125-char shell. Was: only sprint (renderSprintDetail) rendered; task/req/class/method/impl/test/usecase/file/webitem were EMPTY (this.graph.get()→not-found, elements UNDEFINED on /app). Now all render via the graph-independent fetch.
// R30.21 (v0.7.31, app-XYZSNPGH.js). ALL 10 detail types. Behavior-first (setAttribute ref → assert real content), DET-3x. SystemTester.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// one real unit per type (sprint = renderSprintDetail control; the other 9 use type-specific detail elements)
const REFS = [
  ['sprint', 'sprint:2173e549-ca99-43e5-aea8-946b02141c13'],
  ['requirement', 'requirement:9993091a-aa45-4c4f-9c62-e4d5377ba3e8'],
  ['task', 'task:9937a1f1-5674-48fb-92fe-6dc4a38089b0'],
  ['usecase', 'usecase:997ea6db-b586-472e-8024-55ae7e0699f5'],
  ['class', 'class:97d6e2bf-6c02-4c36-82f6-c0c6178d1163'],
  ['method', 'method:9905fbfa-e41a-4177-b625-f6fee373efd2'],
  ['implementation', 'implementation:7f15c149-677d-4eec-a2dd-2ea29aa0eb25'],
  ['test', 'test:9907f272-0cfb-4c8e-8732-797fd679b9fb'],
  ['file', 'file:9bca3ed8-bdbb-470f-8bca-8f40cc5ead7e'],
  ['webitem', 'webitem:90322673-f687-46b5-85d0-9ffca09f671c'],
];

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1200, height: 900 } });
    await seedSystemTester(ctx); const page = await ctx.newPage();
    await page.goto(`${BASE}/app`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!customElements.get('rb-detail-drawer'), { timeout: 20000 }).catch(() => {});
    await sleep(600);
    const per = await page.evaluate(async (REFS) => {
      let d = document.querySelector('rb-detail-drawer'); if (!d) { d = document.createElement('rb-detail-drawer'); document.body.appendChild(d); }
      const out = {};
      for (const [type, ref] of REFS) {
        d.removeAttribute('ref'); await new Promise(r => setTimeout(r, 100));
        d.setAttribute('ref', ref); await new Promise(r => setTimeout(r, 1300));
        const dp = d.querySelector('.drawer-panel-detail'); const html = dp?.innerHTML || '';
        // real content = substantial (regression empty-shell was ~125) + a rendered content structure + NOT a whole-detail failure.
        // (a 'dv-empty' SUBSECTION like 'no children' is fine — reject only the actual not-found/failed render.)
        const hasStructure = /dv-title|dv-head|dv-name|dv-uuid|dv-link|dv-field|dv-row/.test(html);
        out[type] = { len: html.length, ok: html.length > 300 && hasStructure && !/not found|Failed to load/i.test(html) };
      }
      return out;
    }, REFS);
    const fails = REFS.filter(([t]) => !per[t].ok).map(([t]) => t);
    const pass = fails.length === 0;
    results.push(pass);
    console.log(`iter ${i}: ${REFS.map(([t]) => `${t}=${per[t].ok ? per[t].len : 'EMPTY(' + per[t].len + ')'}`).join(' ')} => ${pass ? 'GREEN' : 'RED [' + fails.join(',') + ']'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R30.21 graph-independent detail render — ALL 10 types (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
