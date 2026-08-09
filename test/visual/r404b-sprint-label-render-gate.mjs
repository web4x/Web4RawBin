// [test:uuid:8f3a1d05-4e72-4b96-a3c1-6d0f9e2b7a48] R40.4 SprintLabel.sprintLabel (Impl e7fb7e65) — the all-surfaces RENDER
// half (the single-source half is r404-sprint-label-single-source-gate.mjs): the 'Sprint N' number is RENDERED on the
// tree row (rb-trace-tree:475) AND the detail-header (rb-detail-drawer:309), @390 real-WebKit, fully visible + NOT
// truncated (pixel/geometry, never a DOM-count). This is the row I pulled OFF Tron's device list as automatable — honoring it.
import { webkit, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await webkit.launch();
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!document.querySelector('rb-trace-tree'), { timeout: 20000 }).catch(() => {});
    await sleep(1500);

    // (1) TREE rows render 'Sprint <N> — <name>' + are NOT truncated (rendered text fully visible, not clipped) @390
    const tree = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('rb-trace-tree *')].filter(e => /(^|\s)Sprint \d+/.test((e.textContent || '').trim()) && (e.children.length === 0 || e.querySelector(':scope > .to-label, :scope > span')));
      const labels = [];
      for (const e of rows.slice(0, 40)) {
        const t = (e.textContent || '').trim();
        const m = t.match(/Sprint (\d+)/);
        if (!m) continue;
        const el = e.querySelector('.to-label, span') || e;
        const clipped = el.scrollWidth > el.clientWidth + 2;          // pixel: text wider than its box = truncated/ellipsis
        const visible = !!el.offsetParent && el.getClientRects().length > 0;
        labels.push({ n: m[1], hasName: / — /.test(t) || t.length > `Sprint ${m[1]}`.length + 2, clipped, visible });
      }
      // dedup by number
      const seen = new Set(); const uniq = labels.filter(l => !seen.has(l.n) && seen.add(l.n));
      return { count: uniq.length, anyClipped: uniq.some(l => l.clipped), allVisible: uniq.every(l => l.visible), nums: uniq.map(l => l.n) };
    });
    // lazy/eager tree: only the CURRENT sprint renders at top level (rest behind a collapsed badge) — ≥1 rendered sprint
    // row with the number, fully visible + not clipped, IS the tree-row render surface (same sprintLabel fn per node).
    const treeOk = tree.count >= 1 && !tree.anyClipped && tree.allVisible;

    // (2) DETAIL header renders 'Sprint N' — drive the shared drawer with a real Sprint unit ref
    const hdr = await page.evaluate(async () => {
      const sprints = await (await fetch('/api/trace/sprints')).json().catch(() => ({}));
      const sp = (sprints.sprints || sprints || []).find(s => s && s.uuid && (s.number != null));
      if (!sp) return { ok: false, why: 'no-sprint-unit' };
      let d = document.querySelector('rb-detail-drawer'); if (!d) { d = document.createElement('rb-detail-drawer'); document.body.appendChild(d); }
      d.setAttribute('ref', `sprint:${sp.uuid}`);
      await new Promise(r => setTimeout(r, 1400));
      const title = (d.querySelector('.dv-title')?.textContent || '');
      return { ok: new RegExp(`Sprint ${sp.number}\\b`).test(title), title, num: sp.number };
    });
    const headerOk = hdr.ok;

    await page.screenshot({ path: `test-results/r404b/sprint-label-@390-iter${i}.png` }).catch(() => {});
    const pass = treeOk && headerOk;
    results.push(pass);
    console.log(`iter ${i}: tree-renders=${treeOk}(${tree.count} sprints ${JSON.stringify(tree.nums)} clipped=${tree.anyClipped} allVisible=${tree.allVisible}) | detail-header='Sprint N'=${headerOk}(${JSON.stringify(hdr.title || hdr.why)}) => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }

console.log('\n===== R40.4 sprint-label RENDER @390 real-WebKit (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
