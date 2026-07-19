// [test:uuid:db352d49-0850-4ddc-a077-ecaca77f3ef3] R30.41 RbDiffEditor.applyLanguage 5e0e5cd5 — per-filetype syntax
// highlighting in ALL 3 panes (Local/Result/Repository) of the 3-way merge editor, DETERMINISTIC after full mount
// (applyLanguage runs at the END of both mountThreePane + loadSide, idempotent — .ts must not lose the Monaco-loader race).
// Measured DIFFERENTLY than the expert's playwright: per-pane Monaco MODEL language-id + distinct token-class (.mtkN) count
// (plaintext = 1 color; highlighted = many) + screenshot. Also (3) R30.35 change-blocks + R30.34 SVG spline coexist INTACT
// over the highlighted text, and (4) no regression to the r3041 fixes (selectors=oosh, header=otmux@<branch>, refs intact).
// v0.7.65 (edit-YLYSV5RK.js). DET-3x per filetype. SystemTester, read-only.
import { chromium } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const OUT = 'test-results/r3043-syntax';
const EXPECT_BRANCH = (process.env.OOSH_BRANCH || '').trim();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const CASES = [
  { name: 'shell', langRe: /shell|bash/i, url: `${BASE}/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`, regress: true },
  { name: 'typescript', langRe: /typescript/i, url: `${BASE}/edit/${encodeURIComponent('src/ts/server/FileApi.ts')}?repo=rawbin&left=b4868a6b&right=main&3way=1`, regress: false },
];

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = {};
try {
  for (const c of CASES) {
    results[c.name] = [];
    for (let i = 1; i <= 3; i++) {
      const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1400, height: 950 } });
      await seedSystemTester(ctx);
      const page = await ctx.newPage();
      await page.goto(c.url, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => (document.querySelector('rb-diff-editor')?.edCenter?.getValue?.()?.length || 0) > 0, { timeout: 25000 }).catch(() => {});
      // full mount: wait until all 3 editor models carry a non-plaintext language (the race-fix's post-mount state)
      await page.waitForFunction(() => { const e = document.querySelector('rb-diff-editor'); const ids = ['edLocal', 'edCenter', 'edRemote'].map(k => { try { return e[k]?.getModel?.()?.getLanguageId?.(); } catch { return null; } }); return ids.every(x => x && x !== 'plaintext'); }, { timeout: 20000 }).catch(() => {});
      await sleep(1200);

      const st = await page.evaluate(() => {
        const e = document.querySelector('rb-diff-editor');
        const lang = (k) => { try { return e[k].getModel().getLanguageId(); } catch { return '?'; } };
        const mtk = (sel) => { const set = new Set(); document.querySelectorAll(`${sel} .view-lines span[class*="mtk"]`).forEach(s => s.classList.forEach(cl => { if (/^mtk\d+$/.test(cl)) set.add(cl); })); return set.size; };
        const blocks = document.querySelectorAll('rb-diff-editor [class*="de-block"]').length;
        const splinePaths = [...document.querySelectorAll('rb-diff-editor svg path')].filter(p => (p.getAttribute('d') || '').length > 8).length;
        const repos = [...document.querySelectorAll('rb-diff-editor .de-repo')].map(s => (s.value || '').toLowerCase());
        return {
          langLocal: lang('edLocal'), langCenter: lang('edCenter'), langRemote: lang('edRemote'),
          mtkLocal: mtk('.de-local'), mtkCenter: mtk('.de-center'), mtkRemote: mtk('.de-remote'),
          blocks, splinePaths, repos, header: (document.querySelector('rb-diff-editor .de-center .de-title')?.textContent || '').trim(),
          leftRef: e?.left?.ref || '', rightRef: e?.right?.ref || '',
        };
      });
      if (i === 1) await page.screenshot({ path: `${OUT}/highlight-${c.name}.png` }).catch(() => {});

      const langOk = c.langRe.test(st.langLocal) && c.langRe.test(st.langCenter) && c.langRe.test(st.langRemote);   // (1)(2) all 3 panes the right language
      const colored = st.mtkLocal > 2 && st.mtkCenter > 2 && st.mtkRemote > 2;                                        // multiple token colors = highlighted, not plaintext
      const coexist = st.blocks > 0 && st.splinePaths > 0;                                                            // (3) change-blocks + spline intact over highlighted text
      let regressOk = true;
      if (c.regress) regressOk = st.repos.length >= 2 && st.repos.every(r => r === 'oosh') && (!EXPECT_BRANCH || st.header === `otmux@${EXPECT_BRANCH}`) && st.leftRef === '516ebb3' && st.rightRef === 'dev'; // (4)
      const pass = langOk && colored && coexist && regressOk;
      results[c.name].push(pass);
      console.log(`${c.name} iter ${i}: lang L/C/R=${st.langLocal}/${st.langCenter}/${st.langRemote}(${langOk}) | mtk L/C/R=${st.mtkLocal}/${st.mtkCenter}/${st.mtkRemote}(colored=${colored}) | coexist blocks=${st.blocks} spline=${st.splinePaths}(${coexist}) | regress=${regressOk} => ${pass ? 'GREEN' : 'RED'}`);
      await ctx.close();
    }
  }
} finally { await browser.close(); }

console.log('\n===== R30.41 syntax highlighting (DET-3x per filetype, v0.7.65) =====');
let allGreen = true;
for (const c of CASES) { const r = results[c.name] || []; const g = r.length === 3 && r.every(Boolean); allGreen = allGreen && g; console.log(`  ${c.name}: ${r.map((p, i) => `${i + 1}:${p ? 'G' : 'R'}`).join(' ')} => ${g ? 'GREEN' : 'RED'}`); }
console.log('OVERALL:', allGreen ? 'GREEN DET-3x (all 3 panes highlight per filetype + blocks/spline coexist + no r3041 regression + race-deterministic)' : 'RED');
process.exitCode = allGreen ? 0 : 1;
