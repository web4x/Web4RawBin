// v0.7.8 R27.3 gate — per-task-MD 404 fix (slug drift + planning.md collapse). READ-ONLY, 0 pollution.
//   (1) AC-resolve: rb-task-detail 📄 link for a task WITHOUT sourceFile (previously 404) now serves 200
//       — the fix resolves the dir from the sprint's PINNED slug + ignores sourceFile=planning.md.
//   (2) roundtrip byte-match: generate-sprint-md --check GREEN for sprint-26 + sprint-27.
//   (3) spot-check a sprint-26 task AND a sprint-27 task — both 📄 links → 200.
// DET-3x. This closes the coverage gap I flagged during the v0.7.6 gate.

import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import https from 'https';

const BASE = 'https://prod.wo-da.de:4444';
const REPO = '/var/dev/Workspaces/2cuGitHub/Web4RawBin';
const S26_TASK = '026af82c-3668-4d94-ae01-51e5276f851b'; // sprint-26 task-26.6 (no sourceFile — 404'd before)
const S27_TASK = '788bc972-145d-476a-877b-8fecbf037ef4'; // sprint-27 task (no sourceFile)
const S26 = '1d98197d-87ee-4355-8858-406961b2f19d';
const S27 = 'c1c63a2e-7b62-48b0-a031-bd91bab14d2a';

const httpGet = (p) => new Promise((res) => { const r = https.get({ host: 'prod.wo-da.de', port: 4444, path: p, rejectUnauthorized: false, timeout: 8000 }, (x) => { let n = 0; x.on('data', c => n += c.length); x.on('end', () => res({ status: x.statusCode, size: n })); }); r.on('error', () => res({ status: 0 })); r.on('timeout', () => { r.destroy(); res({ status: 0 }); }); });
const checkSprint = (uuid) => { try { const o = execSync(`npx tsx scripts/generate-sprint-md.ts --check ${uuid}`, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); return /byte-match/i.test(o) && !/drift|mismatch|✗/i.test(o); } catch (e) { return /byte-match/i.test((e.stdout || '') + '') && !/drift|✗/i.test((e.stdout || '') + ''); } };

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!customElements.get('rb-task-detail'), { timeout: 20000 }).catch(() => {});
await page.waitForFunction(() => { const t = document.querySelector('rb-trace-tree'); return t && t.graph; }, { timeout: 20000 }).catch(() => {});

// rendered 📄 href from the real component (does the pinned-slug resolution)
async function taskHref(uuid) {
  return page.evaluate(async (u) => {
    document.querySelectorAll('.__td').forEach(e => e.remove());
    const el = document.createElement('rb-task-detail'); el.className = '__td';
    const tree = document.querySelector('rb-trace-tree'); if (tree && tree.graph) el.graph = tree.graph;
    el.setAttribute('ref', `task:${u}`); document.body.appendChild(el);
    await new Promise(z => setTimeout(z, 3200));
    // the TASK FILE link specifically (not the 📄 Scenario link) — title/text disambiguate
    const a = el.querySelector('a[title="Open the task markdown file"]')
      || [...el.querySelectorAll('a[href^="/md/"]')].find(x => /Task file/.test(x.textContent || '') || /\/sprints\//.test(x.getAttribute('href') || ''));
    return a?.getAttribute('href') || '';
  }, uuid);
}

const results = [];
for (let i = 1; i <= 3; i++) {
  const h26 = await taskHref(S26_TASK);
  const r26 = h26 ? await httpGet(h26) : { status: 0 };
  const h27 = await taskHref(S27_TASK);
  const r27 = h27 ? await httpGet(h27) : { status: 0 };
  // (1) AC-resolve: the previously-404 no-sourceFile task now 200 (and NOT collapsed to planning.md)
  const item1 = r26.status === 200 && /task-26\./.test(h26) && !/planning\.md/.test(h26);
  // (2) roundtrip byte-match --check GREEN for both sprints
  const item2 = checkSprint(S26) && checkSprint(S27);
  // (3) spot-check: sprint-26 AND sprint-27 task both 200
  const item3 = r26.status === 200 && r27.status === 200 && /task-27\./.test(h27);
  const pass = item1 && item2 && item3;
  results.push(pass);
  console.log(`iter ${i}: (1)s26-404→200=${item1}[${h26.replace('/md/scrum.pmo/sprints/', '')} ${r26.status}] (2)--check-byteMatch=${item2} (3)s26+s27→200=${item3}[s27=${r27.status}] => ${pass ? 'GREEN' : 'RED'}`);
}
await browser.close();

console.log('\n=== VERDICT v0.7.8 R27.3 per-task-MD 404 fix (DET-3x) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('READ-ONLY (component mount + HTTP GET + --check) — 0 pollution. Closes the v0.7.6 derived-404 flag.');
process.exit(green ? 0 : 1);
