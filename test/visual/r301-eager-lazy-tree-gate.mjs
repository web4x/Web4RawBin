// [test:uuid:7b37982c-11a8-4ff9-9353-58e136a3b84b] R30.1 RbTraceTree.renderCurrentSprintEagerLazy — eager-lazy trace tree (DET-3x GREEN)
// T30.1 gate — eager-lazy traceability tree (RbTraceTree.renderCurrentSprintEagerLazy, impl
// e649a695, LIVE prod v0.7.10 6ededd4bb). READ-ONLY, 0 pollution (trace page, no user/room).
// serviceWorkers:'block' = hard-refresh past SW cache. DET-3x.
//   (1) top node = 'CurrentSprint: Sprint 30' (NOT 'Current: Task X')
//   (2) 3 EAGER children open: Current(T30.1) / Last(T27.8) / Next(T27.5)
//   (3) 2nd top = 'Sprints 01-30' COLLAPSED, badge(child-count)=30
//   (4) EAGER sprint-nodes + LAZY tasks: on load only /children/<CS> fetched (no sprint-uuid);
//       expanding the collection reveals sprint-nodes with NO new fetch (eager); expanding a
//       sprint fires /children/<sprint> + renders its tasks (lazy)
//   (5) EXACTLY 2 top-level nodes
//   (6) shares the R26.1 loader (fetchAndRenderChildren) — proven by the lazy expand loading tasks

import { chromium } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const childUuid = (url) => { const m = /\/api\/trace\/children\/([^?]+)/.exec(url); return m ? decodeURIComponent(m[1]) : null; };

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });

async function readTree(page) {
  return page.evaluate(() => {
    const tree = document.querySelector('rb-trace-tree'); if (!tree) return { none: true };
    const tops = [...tree.querySelectorAll(':scope > .tt-node')];
    const read = (n) => { const it = n.querySelector(':scope > .tt-row rb-object-item'); const kids = n.querySelector(':scope > .tt-children'); return it ? { ref: it.getAttribute('ref') || '', title: (it.textContent || '').replace(/\s+/g, ' ').trim(), childCount: it.getAttribute('child-count'), open: it.hasAttribute('children-open'), childNodes: kids ? [...kids.querySelectorAll(':scope > .tt-node')].map(c => (c.querySelector(':scope > .tt-row rb-object-item')?.textContent || '').replace(/\s+/g, ' ').trim()) : [] } : null; };
    return { count: tops.length, nodes: tops.map(read) };
  });
}

const results = [];
try {
  for (let i = 1; i <= 3; i++) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', viewport: { width: 900, height: 1000 } });
    const page = await ctx.newPage();
    const childFetches = [];
    page.on('request', (r) => { const u = childUuid(r.url()); if (u) childFetches.push(u); });

    await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelectorAll('rb-trace-tree > .tt-node').length >= 2, { timeout: 20000 }).catch(() => {});
    await sleep(1500);
    const CS = 'current-sprint-singleton-0000-000000000001';
    const onLoadChildFetches = [...childFetches];

    const t = await readTree(page);
    const n1 = t.nodes?.[0] || {}, n2 = t.nodes?.[1] || {};

    // (5) exactly 2 top-level
    const twoTops = t.count === 2;
    // (1) top = CurrentSprint: Sprint N, not Current: Task
    const c1 = n1.ref?.startsWith('currentsprint:') && /^CurrentSprint:\s*Sprint\s*\d+/.test(n1.title) && !/Current:\s*Task/i.test(n1.title);
    // (2) 3 eager children open: Current(T30.1)/Last(T27.8)/Next(T27.5)
    const kids = n1.childNodes || [];
    const c2 = n1.open && kids.length === 3
      && kids.some(k => /Current/i.test(k) && /30\.1/.test(k))
      && kids.some(k => /Last/i.test(k) && /27\.8/.test(k))
      && kids.some(k => /Next/i.test(k) && /27\.5/.test(k));
    // (3) 2nd = Sprints 01-30 COLLAPSED badge=30
    const c3 = /^Sprints 01-30/.test(n2.title || '') && n2.open === false && n2.childCount === '30';
    // (4) LAZY on load: only the CS singleton was fetched for children — no sprint-uuid children fetch
    const onLoadNonCS = onLoadChildFetches.filter(u => u !== CS);
    const lazyOnLoad = onLoadChildFetches.includes(CS) && onLoadNonCS.length === 0;

    // expand the collection (should reveal sprint-nodes with NO new children fetch — eager)
    const beforeExpand = childFetches.length;
    await page.evaluate(() => { const t = document.querySelector('rb-trace-tree'); const n2 = t.querySelectorAll(':scope > .tt-node')[1]; n2?.querySelector(':scope > .tt-row rb-object-item')?.dispatchEvent(new CustomEvent('toggle-children', { bubbles: true, detail: { open: true } })); });
    await sleep(1200);
    const afterCollectionExpand = childFetches.length;
    const collectionEager = afterCollectionExpand === beforeExpand; // no fetch to reveal eager sprint-nodes

    // expand ONE sprint node -> lazy task fetch (shared R26.1 loader) + tasks render
    const sprintUuid = await page.evaluate(() => { const t = document.querySelector('rb-trace-tree'); const n2 = t.querySelectorAll(':scope > .tt-node')[1]; const kidsBox = n2?.querySelector(':scope > .tt-children'); const sp = kidsBox?.querySelector(':scope > .tt-node'); const it = sp?.querySelector(':scope > .tt-row rb-object-item'); const uuid = (it?.getAttribute('ref') || '').split(':')[1]; it?.dispatchEvent(new CustomEvent('toggle-children', { bubbles: true, detail: { open: true } })); return uuid; });
    await sleep(1800);
    const sprintTaskFetched = childFetches.includes(sprintUuid);
    const tasksRendered = await page.evaluate((su) => { const t = document.querySelector('rb-trace-tree'); const sp = t.querySelector(`rb-object-item[ref$=":${su}"]`)?.closest('.tt-node'); return sp ? sp.querySelectorAll(':scope > .tt-children > .tt-node').length : 0; }, sprintUuid);
    // (4)+(6): lazy on load + eager reveal + sprint tasks lazily loaded via the shared loader
    const c4 = lazyOnLoad && collectionEager && sprintTaskFetched && tasksRendered > 0;
    const c6 = sprintTaskFetched && tasksRendered > 0; // R26.1 fetchAndRenderChildren produced the tasks

    const pass = twoTops && c1 && c2 && c3 && c4 && c6;
    results.push(pass);
    console.log(`iter ${i}: (5)2tops=${twoTops} (1)CS-top="${n1.title}"=${c1} (2)3eager=${c2}[${kids.length}] (3)collapsed30="${n2.title}"badge=${n2.childCount}open=${n2.open}=${c3} (4)lazy[load=${lazyOnLoad},collEager=${collectionEager},sprintFetch=${sprintTaskFetched},tasks=${tasksRendered}]=${c4} (6)R26.1=${c6} => ${pass ? 'GREEN' : 'RED'}`);
    await ctx.close();
  }

  console.log('\n=== VERDICT T30.1 eager-lazy tree (DET-3x) ===');
  results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
  const green = results.length === 3 && results.every(Boolean);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
  process.exitCode = green ? 0 : 1;
} finally { await browser.close(); }
