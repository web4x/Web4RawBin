// R40.71/72 AFTER-RENDER GATE @390 (v0.8.152) — the PO bar is ZERO UNEXPLAINED BARE, not the flattering count.
// Every one of the 78 previously-bare classes (+ 16 non-derivable methods) MUST render EITHER a real 📂 source link
// OR the explicit italic-muted "source not available" marker — ZERO may render simply empty. A single empty-with-no-
// marker-no-link is a FAIL regardless of the other numbers. Expect ~58 classes sourced + ~20 marked; ~16 methods marked.
// Screenshot/pixel evidence via shadow-piercing text checks (textContent is shadow-blind). served==0.8.152 self-verified.
// ALSO (PO): version-consistency — the served client bundle must match the committed dist AND the version string, so a
// version that lies (0.8.151 serving 0.8.152 client, which my before-render exposed) is confirmed resolved.
import { webkit, devices } from '@playwright/test';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync('test-results/r4071', { recursive: true });
const bare = JSON.parse(fs.readFileSync('/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/bare78.json', 'utf8'));
// a real source-file link — ANY source extension, not just .ts/.mjs/.js (MainRoute derives to src/public/index.html;
// a too-narrow extension list false-flags an .html-sourced class as unexplained — caught v0.8.152 after-render).
const SRC = /(?:src|scripts|test)\/[\w./-]+\.(?:ts|tsx|mjs|js|html|css|json|md|sh|scss|vue)\b/i;
const MARK = /source not available/i;

const browser = await webkit.launch();
try {
  const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  // served version (self) + version-consistency (served client bundle == committed dist)
  const ver = await page.goto(`${BASE}/api/config`, { waitUntil: 'domcontentloaded' }).then((r) => r.json()).then((j) => j.version).catch(() => '?');
  const traceHtml = await page.goto(`${BASE}/trace`, { waitUntil: 'domcontentloaded' }).then((r) => r.text()).catch(() => '');
  const servedBundle = (traceHtml.match(/\/dist\/(trace-page-[A-Z0-9]+\.js)/) || [])[1] || '?';
  let committedBundle = '?';
  try { committedBundle = execSync('ls src/public/dist/trace-page-*.js', { encoding: 'utf8' }).trim().split('/').pop(); } catch {}
  const versionConsistent = ver === '0.8.152' && servedBundle === committedBundle;
  console.log(`served=${ver} | servedBundle=${servedBundle} committedBundle=${committedBundle} → version/client CONSISTENT=${versionConsistent}`);

  // classify each unit by its RENDERED state: link (📂) / marked ("source not available") / UNEXPLAINED (neither = the FAIL)
  const classify = async (type, uuid) => {
    await page.goto(`${BASE}/scenario?ior=ior:instance:${uuid}`, { waitUntil: 'networkidle' }).catch(() => {});
    await sleep(1400);
    const hasLink = await page.getByText(SRC).first().isVisible().catch(() => false);
    const hasMark = await page.getByText(MARK).first().isVisible().catch(() => false);
    return hasLink ? 'link' : hasMark ? 'marked' : 'UNEXPLAINED';
  };
  const sweep = async (label, uuids) => {
    const c = { link: 0, marked: 0, UNEXPLAINED: 0, unexplainedUuids: [] };
    for (const u of uuids) { const r = await classify(label === 'class' ? 'class' : 'method', u); c[r]++; if (r === 'UNEXPLAINED') c.unexplainedUuids.push(u.slice(0, 8)); }
    console.log(`  ${label}: link(📂)=${c.link} marked=${c.marked} UNEXPLAINED=${c.UNEXPLAINED}${c.UNEXPLAINED ? ' ← ' + c.unexplainedUuids.join(',') : ''}`);
    return c;
  };
  console.log(`Full-population sweep of the 78 classes + 16 methods (zero-unexplained bar):`);
  const cls = await sweep('class', bare.classes);
  const mth = await sweep('method', bare.methods);

  // representative screenshots (pixel evidence) + DET-3x stability on 3 reps
  const SPEAKINGTREE = '015b1ac0-eb5d-4b4b-9749-84d3b2214421';
  await page.goto(`${BASE}/scenario?ior=ior:instance:${SPEAKINGTREE}`, { waitUntil: 'networkidle' }).catch(() => {});
  await sleep(1500); await page.screenshot({ path: 'test-results/r4071/AFTER-speakingtree-sourced.png' }).catch(() => {});
  // DET-3x: SpeakingTree must show a link all 3 runs (was marked on .151, sourced on .152)
  const det = [];
  for (let i = 0; i < 3; i++) { await page.goto(`${BASE}/scenario?ior=ior:instance:${SPEAKINGTREE}`, { waitUntil: 'networkidle' }).catch(() => {}); await sleep(1200); det.push(await page.getByText(SRC).first().isVisible().catch(() => false)); }
  const detStable = det.every((x) => x === true);

  // ── verdict ──
  const zeroUnexplained = cls.UNEXPLAINED === 0 && mth.UNEXPLAINED === 0;
  const covered = cls.link + cls.marked === bare.classes.length && mth.link + mth.marked === bare.methods.length;
  console.log(`\n═══ R40.71/72 AFTER-RENDER GATE (v0.8.152, @390) ═══`);
  console.log(`served==0.8.152 + client bundle==committed (version doesn't lie): ${versionConsistent}`);
  console.log(`CLASSES (78): ${cls.link} sourced(📂) + ${cls.marked} marked = ${cls.link + cls.marked}/78, UNEXPLAINED=${cls.UNEXPLAINED} [expected ~58+20]`);
  console.log(`METHODS (16): ${mth.link} sourced + ${mth.marked} marked, UNEXPLAINED=${mth.UNEXPLAINED} [expected ~16 marked]`);
  console.log(`SpeakingTree sourced DET-3x: ${detStable} (${det.join('/')})`);
  console.log(`★ ZERO-UNEXPLAINED-BARE (the bar): ${zeroUnexplained ? 'PASS — every one of the 78+16 is sourced OR marked, none empty' : 'FAIL — ' + (cls.UNEXPLAINED + mth.UNEXPLAINED) + ' render empty with NO link and NO marker'}`);
  const green = versionConsistent && zeroUnexplained && covered && detStable;
  console.log(`\nVERDICT: ${green ? 'VERIFIED — zero unexplained-bare, version consistent, ~58📂+20marked classes / ~16 marked methods' : (zeroUnexplained ? 'PARTIAL/CHECK — zero-unexplained holds but ' + (!versionConsistent ? 'version inconsistent' : !detStable ? 'DET unstable' : 'count off') : 'BROKEN — unexplained-bare present = FAIL regardless of the other numbers')}`);
  await ctx.close();
  process.exit(green ? 0 : 1);
} finally { await browser.close().catch(() => {}); }
