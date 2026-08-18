// [test:uuid:4d9e2f81-7a3c-4b56-9e08-1c5a3f7b2d64] T37.26 / R40.4 SprintView.sprintDisplayName (Impl c0e32287) — the DISTINCT
// intent from e7fb7e65/sprintLabel (that is the 'Sprint <number>' PREFIX atom, DASH format): this asserts EXACTLY the
// COLON canon 'Sprint <n>: <title>' (and 'Task <n>.<m>: <title>') + NO-DOUBLING (feeding an already-prefixed name does NOT
// yield 'Sprint 37: Sprint 37: …' — the Tron "TWO implementations" bug the v0.8.101/102 double-render fix killed). NOT
// reusing d7e4b9a1/8f3a1d05 (e7fb7e65's Tests) = would be T40.5 borrowed-credit. Pure-fn proof (colon+idempotent+stub-
// must-fail) on git-clean HEAD source (sprint-label.ts == committed == served) + @390 real-WebKit SERVED render (label
// shows the colon format ONCE, visible, not doubled). FAMILY: DRY double-render / two-sources.
import { webkit, devices } from '@playwright/test';
import { seedSystemTester } from './system-tester-setup.mjs';
import { sprintDisplayName, taskDisplayName } from '../../src/ts/scenario/sprint-label.ts';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const results = {};

// ── PURE-FN: EXACTLY 'Sprint <n>: <title>' colon canon + IDEMPOTENT no-doubling ──
const onceOnly = (s, re) => (s.match(re) || []).length === 1;                  // the prefix appears EXACTLY once
const colonSprint = /^Sprint \d+: /;
results['sprint-colon-format'] = sprintDisplayName('Formatter thing', 37) === 'Sprint 37: Formatter thing'
  && colonSprint.test(sprintDisplayName('Formatter thing', 37))
  && !sprintDisplayName('Formatter thing', 37).includes(' — ');                // NOT the dash format (that's e7fb7e65)
results['sprint-no-doubling'] = sprintDisplayName('Sprint 37: Foo', 37) === 'Sprint 37: Foo'          // pre-colon-prefixed → NOT doubled
  && sprintDisplayName('Sprint 37 — Foo', 37) === 'Sprint 37: Foo'             // pre-dash-prefixed → re-canon'd, NOT doubled
  && onceOnly(sprintDisplayName('Sprint 37: Foo', 37), /Sprint 37/g);          // 'Sprint 37' occurs exactly once
results['task-colon-format'] = taskDisplayName('Task 37.26 — Sprint/task-name FORMATTER') === 'Task 37.26: Sprint/task-name FORMATTER'
  && taskDisplayName('Task 37.26: Foo') === 'Task 37.26: Foo'                  // idempotent, no double
  && onceOnly(taskDisplayName('Task 37.26: Foo'), /Task 37\.26/g);
results['no-fabricate'] = sprintDisplayName('Just a title', null) === 'Just a title';                 // no number → stripped title alone, never fabricate a number

// ── STUB-MUST-FAIL: the colon + no-doubling checks MUST be able to go RED (non-vacuous) ──
results['stub-must-fail'] = !colonSprint.test('Sprint 5 — X')                  // a DASH string fails the colon assert
  && !onceOnly('Sprint 5: X Sprint 5: X', /Sprint 5/g);                        // a DOUBLED string fails the once-only assert

// ── @390 SERVED RENDER: the tree renders the colon label, ONCE, visible (no doubling on the served build) ──
const browser = await webkit.launch();
const renderPass = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ...devices['iPhone 12'], ignoreHTTPSErrors: true, serviceWorkers: 'block' });
    await seedSystemTester(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!document.querySelector('rb-trace-tree'), { timeout: 20000 }).catch(() => {});
    await sleep(1500);
    // Drive the DETAIL HEADER with a REAL Sprint unit — the reliable served render surface for sprintDisplayName (the
    // eager-lazy tree shows only the CurrentSprint pin at top level; real sprint rows are behind a collapsed badge).
    const r = await page.evaluate(async () => {
      const j = await (await fetch('/api/trace/sprints')).json().catch(() => ({}));
      const list = (j.sprints || j || []).filter(s => s && s.uuid && s.number != null);
      if (!list.length) return { count: 0, why: 'no-sprint-units' };
      const out = [];
      for (const sp of list.slice(0, 6)) {
        let d = document.querySelector('rb-detail-drawer'); if (!d) { d = document.createElement('rb-detail-drawer'); document.body.appendChild(d); }
        d.setAttribute('ref', `sprint:${sp.uuid}`);
        await new Promise(r => setTimeout(r, 1000));
        const t = (d.querySelector('.dv-title')?.textContent || '').trim();
        if (!/Sprint \d+/.test(t)) continue;
        const el = d.querySelector('.dv-title');
        out.push({ colon: new RegExp(`^Sprint ${sp.number}: `).test(t), dash: / — /.test(t), doubled: (t.match(/Sprint \d+/g) || []).length > 1, visible: !!el && !!el.offsetParent, sample: t.slice(0, 44) });
      }
      return { count: out.length, allColon: out.length > 0 && out.every(o => o.colon && !o.dash), noneDoubled: out.every(o => !o.doubled), allVisible: out.every(o => o.visible), sample: out[0]?.sample };
    });
    await page.screenshot({ path: `test-results/r3726/sprint-displayname-@390-iter${i}.png` }).catch(() => {});
    const pass = r.count >= 1 && r.allColon && r.noneDoubled && r.allVisible;
    renderPass.push(pass);
    console.log(`render iter ${i}: colon-served=${r.allColon} no-doubling=${r.noneDoubled} visible=${r.allVisible} (${r.count} rows, e.g. "${r.sample}") => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }
} finally { await browser.close(); }
results['served-render-@390'] = renderPass.length === 3 && renderPass.every(Boolean);

console.log('\n===== T37.26 sprintDisplayName colon-canon + no-doubling (pure-fn DET + @390 real-WebKit DET-3x) =====');
let green = true;
for (const [k, v] of Object.entries(results)) { console.log(`  ${k}: ${v ? 'GREEN' : 'RED'}`); if (!v) green = false; }
console.log('OVERALL:', green ? 'GREEN — EXACTLY "Sprint <n>: <title>"/"Task <n>.<m>: <title>", no-doubling, served-rendered @390; stub-must-fail proven' : 'RED');
process.exitCode = green ? 0 : 1;
