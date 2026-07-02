// [test:uuid:a392d306-4b01-40ff-bfc8-db74d8e1e720] R22.1 renderChainPathSection
// R22.1 gate — detail views: ONE 'Traceability Chain' section (no duplicate 'No chain') +
// Forward Links are clickable <a href> (orange) to the scenario MD browser. v0.6.75.
// Fix 61b21fbf6: deleted the inline <h4>Traceability Chain>+singularChain('No chain') block
// from rb-task/requirement/usecase-detail (renderChainPathSection is the sole chain section);
// renderLinks now emits <a class="dv-link" href=scenarioBrowserHref> (orange) not <div data-ref>.
//
// Faithful surface: mount each real detail component with the page's TraceGraph
// (document.querySelector('rb-trace-tree').graph) + ref — same component the drawer builds.
// Per view (Task, Requirement, UseCase), DET-3x:
//   Bug#1: exactly ONE 'Traceability Chain' heading; no 'No chain' duplicate text.
//   Bug#2: forward-link rows are <a> (not div) with href ^=/md/scenario/index/ + orange color.

import { chromium } from '@playwright/test';

const BASE = process.env.GATE_BASE || 'https://prod.wo-da.de:4444';
const VIEWS = [
  { type: 'task',        tag: 'rb-task-detail',        uuid: '0c1b375e-6a2a-4b35-bb64-b43adce88697' }, // T21.1
  { type: 'requirement', tag: 'rb-requirement-detail', uuid: '661836fd-2db8-4863-8556-0d698c897cd5' }, // R22.1
  { type: 'usecase',     tag: 'rb-usecase-detail',     uuid: '9394f330-f3e1-4499-9d20-ee0820c91d23' },
];

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
// wait for the trace graph to load
await page.waitForFunction(() => { const t = document.querySelector('rb-trace-tree'); return !!(t && t.graph && t.graph.get); }, { timeout: 25000 });

async function checkView(v) {
  // mount the real component with the page graph + ref
  await page.evaluate(({ tag, type, uuid }) => {
    document.querySelectorAll('.__r221').forEach(e => e.remove());
    const el = document.createElement(tag); el.className = '__r221';
    el.graph = document.querySelector('rb-trace-tree').graph;
    el.setAttribute('ref', `${type}:${uuid}`);
    document.body.appendChild(el);
  }, v);
  // wait for renderChainPathSection to have RUN (it emits the <h4>Traceability Chain> heading
  // synchronously, before the async server-walk) — heading count is valid immediately.
  await page.waitForFunction(() => {
    const el = document.querySelector('.__r221'); if (!el) return false;
    return !!el.querySelector('.dv-chain-walk') || /not found/i.test(el.textContent || '');
  }, { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(300);

  return await page.evaluate(() => {
    const el = document.querySelector('.__r221'); if (!el) return { ok: false };
    const notFound = /not found/i.test(el.textContent || '');
    // Bug#1: count 'Traceability Chain' headings
    const heads = [...el.querySelectorAll('h4')].filter(h => /traceability chain/i.test(h.textContent || ''));
    const chainHeadings = heads.length;
    const noNoChain = !/\bNo chain\b/.test(el.textContent || ''); // the singular-chain duplicate's text
    // Bug#2: forward-link rows
    const linksWrap = el.querySelector('.dv-links');
    const aLinks = linksWrap ? [...linksWrap.querySelectorAll('a.dv-link')] : [];
    const divLinks = linksWrap ? [...linksWrap.querySelectorAll('div.dv-link')] : []; // old broken style
    const fwd = aLinks.map(a => ({
      tag: a.tagName, href: a.getAttribute('href') || '',
      mdHref: /^\/md\/scenario\/index\//.test(a.getAttribute('href') || ''),
      orange: getComputedStyle(a).color === 'rgb(255, 152, 0)',
    }));
    const fwdCount = fwd.length;
    const allClickable = fwdCount > 0 && fwd.every(f => f.tag === 'A' && f.mdHref && f.orange);
    const noOldDivLinks = divLinks.length === 0;
    return { ok: true, notFound, chainHeadings, noNoChain, fwdCount, allClickable, noOldDivLinks };
  });
}

const results = [];
for (let run = 1; run <= 3; run++) {
  const row = {};
  for (const v of VIEWS) {
    const r = await checkView(v);
    // Bug#1 (the screenshot bug) applies to ALL 3 views. Bug#2 (clickable forward links)
    // is only assertable where links exist (UseCases have none in this graph) — when
    // present, every row MUST be a clickable <a>/md/ orange (and never the old <div>).
    const bug1 = r.ok && !r.notFound && r.chainHeadings === 1 && r.noNoChain;
    const bug2 = r.noOldDivLinks && (r.fwdCount === 0 ? true : r.allClickable);
    row[v.type] = { ...r, pass: bug1 && bug2 };
  }
  const runPass = VIEWS.every(v => row[v.type].pass);
  results.push(runPass);
  console.log(`--- run ${run} ---`);
  for (const v of VIEWS) { const r = row[v.type]; console.log(`  ${v.type.padEnd(11)}: chainHeadings=${r.chainHeadings} noNoChain=${r.noNoChain} fwd<a>=${r.fwdCount} allClickable=${r.allClickable} noOldDivLinks=${r.noOldDivLinks}${r.notFound ? ' NOT-FOUND' : ''} => ${r.pass ? 'GREEN' : 'RED'}`); }
}
await browser.close();

console.log('\n=== VERDICT R22.1 (DET-3x, 3 detail views) ===');
results.forEach((p, i) => console.log(`  run ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
