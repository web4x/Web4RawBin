// S30 tree fixes gate — prod v0.7.11. READ-ONLY, 0 pollution (trace page). serviceWorkers:'block'
// = hard-refresh past SW. DET-3x.
//   (R30.2 BADGE) collapsed sprint nodes show REAL task-counts before expand (eager count from
//     /api/trace/sprints childCount; never a false 0), content still LAZY (no /children/<sprint>
//     fetch until the sprint is expanded). Asserted against the LIVE API (independent method) —
//     NOTE: architect said S30=1 but S30 now has 3 tasks (planner minted T30.2/T30.3, 0ac79d734);
//     the gate trusts the live count, not the stale stated number.
//   (R30.3 DRAWER) body-click a sprint node populates the detail with its name/goal/tasks;
//     expander-click only TOGGLES (does NOT select) — the architect caveat.

import { chromium } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const childUuid = (url) => { const m = /\/api\/trace\/children\/([^?]+)/.exec(url); return m ? decodeURIComponent(m[1]) : null; };
const CS = 'current-sprint-singleton-0000-000000000001';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 1100, height: 1100 } });
    const page = await ctx.newPage();
    const childFetches = [];
    page.on('request', (r) => { const u = childUuid(r.url()); if (u) childFetches.push(u); });

    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('rb-trace-tree > .tt-node').length >= 2, { timeout: 20000 }).catch(() => {});
    await sleep(1200);

    // ground truth: live API sprint childCounts (independent method)
    const api = await page.evaluate(async () => { const r = await fetch('/api/trace/sprints'); const d = await r.json(); const m = {}; for (const s of d) if (s.number) m[s.number] = s.childCount; return m; });

    // expand the Sprints collection (reveal eager sprint-nodes; must NOT fetch any sprint's tasks)
    const beforeColl = childFetches.length;
    await page.evaluate(() => { const t = document.querySelector('rb-trace-tree'); const n2 = t.querySelectorAll(':scope > .tt-node')[1]; n2?.querySelector(':scope > .tt-row rb-object-item .oi-expand')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    await sleep(1000);
    const collEager = childFetches.length === beforeColl; // revealing sprints fetched nothing

    // read each sprint node's badge (child-count) — eager, before any sprint-expand
    const badges = await page.evaluate(() => {
      const t = document.querySelector('rb-trace-tree'); const n2 = t.querySelectorAll(':scope > .tt-node')[1];
      const box = n2?.querySelector(':scope > .tt-children'); if (!box) return {};
      const out = {};
      box.querySelectorAll(':scope > .tt-node > .tt-row rb-object-item').forEach(it => {
        const name = (it.getAttribute('name') || it.textContent || '');
        const m = /Sprint\s+(\d+)/.exec(name); if (m) out[m[1]] = it.getAttribute('child-count');
      });
      return out;
    });

    // (R30.2) badge == live API count, and >0 for sprints that have tasks (never false 0)
    let badgeOk = true; const badgeDetail = [];
    for (const num of [26, 27, 28, 29, 30]) {
      const b = badges[num]; const a = api[num];
      const ok = b != null && a != null && Number(b) === Number(a) && Number(b) > 0;
      if (!ok) badgeOk = false; badgeDetail.push(`S${num}:badge=${b}/api=${a}`);
    }
    // content still lazy: no sprint-uuid children fetched yet (only the CS singleton on load)
    const nonCsFetches = childFetches.filter(u => u !== CS);
    const stillLazy = nonCsFetches.length === 0;

    // (R30.3) DRAWER — body-click a sprint node (.oi-name, NOT expander) selects -> detail populates
    const target = await page.evaluate(() => {
      const t = document.querySelector('rb-trace-tree'); const n2 = t.querySelectorAll(':scope > .tt-node')[1];
      const box = n2.querySelector(':scope > .tt-children');
      const items = [...box.querySelectorAll(':scope > .tt-node > .tt-row rb-object-item')];
      const it = items.find(x => /Sprint\s+30/.test(x.getAttribute('name') || x.textContent || '')) || items[0];
      it.querySelector('.oi-name')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return (it.getAttribute('name') || it.textContent || '').replace(/\s+/g, ' ').trim();
    });
    await sleep(1500);
    const detail = await page.evaluate(() => {
      const d = document.getElementById('trace-detail'); const dr = document.querySelector('rb-detail-drawer');
      const txt = ((d?.textContent || '') + ' ' + (dr?.textContent || '')).replace(/\s+/g, ' ').trim();
      return { len: txt.length, txt };
    });
    const spNum = (/Sprint\s+(\d+)/.exec(target) || [])[1];
    const drawerPopulated = detail.len > 40 && new RegExp(`Sprint\\s*${spNum}`).test(detail.txt) && /(goal|Goal|Traceabil|Task|30\.|T30)/.test(detail.txt);

    // caveat: expander-click on ANOTHER sprint must NOT change the selection/detail to it (toggle only)
    const beforeExpanderDetail = detail.txt.slice(0, 60);
    await page.evaluate(() => {
      const t = document.querySelector('rb-trace-tree'); const n2 = t.querySelectorAll(':scope > .tt-node')[1];
      const box = n2.querySelector(':scope > .tt-children');
      const items = [...box.querySelectorAll(':scope > .tt-node > .tt-row rb-object-item')];
      const other = items.find(x => /Sprint\s+26/.test(x.getAttribute('name') || x.textContent || ''));
      other?.querySelector('.oi-expand')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await sleep(1000);
    const afterExpander = await page.evaluate(() => { const d = document.getElementById('trace-detail'); const dr = document.querySelector('rb-detail-drawer'); return ((d?.textContent || '') + ' ' + (dr?.textContent || '')).replace(/\s+/g, ' ').trim().slice(0, 60); });
    const expanderDoesNotSelect = afterExpander === beforeExpanderDetail; // detail unchanged by expander-click

    const pass = badgeOk && collEager && stillLazy && drawerPopulated && expanderDoesNotSelect;
    results.push(pass);
    console.log(`iter ${i}: BADGE[${badgeDetail.join(' ')}]=${badgeOk} collEager=${collEager} lazy=${stillLazy} | DRAWER body-click "${target.slice(0, 24)}"->populated=${drawerPopulated}(len${detail.len}) expanderNoSelect=${expanderDoesNotSelect} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }

  console.log('\n=== VERDICT S30 tree fixes (R30.2 badge + R30.3 drawer, DET-3x) ===');
  results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
  const green = results.length === 3 && results.every(Boolean);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
  process.exitCode = green ? 0 : 1;
} finally { await browser.close(); }
