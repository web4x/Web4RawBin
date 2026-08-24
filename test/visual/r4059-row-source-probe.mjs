// BOUNDED row-vs-detail probe (PO 2026-08-24, authorized). ONE question only:
// does the IN-PROGRESS tree ROW resolve the SAME unit (7a956c21=T40.1) reading status from a DIFFERENT source than the
// detail (real divergence = Tron's original complaint), OR is it a selector artifact (a different/wrong row whose ref
// merely contains 7a956c21, e.g. under the Profile branch)? Dump the row's resolved ref/uuid + its status-attr value +
// the tree-source status for that node vs the detail-source (/api/ior) status. STOP THERE — no mechanism diagnosis.
// READ-ONLY on served prod @390 real-WebKit. No mutation.
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const UUID = '7a956c21-5f37-4062-b921-9bdd5a461546';
const IOS = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: false, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', ignoreHTTPSErrors: true };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// detail-source truth (what /api/ior derives)
const iorStatus = await (async () => {
  const res = await fetch(`${BASE}/api/ior/ior:instance:${UUID}`).catch(() => null);
  if (!res) return '(fetch-fail)';
  const d = await res.json(); return d?.unit?.model?.status ?? '(none)';
})();

const b = await webkit.launch({ headless: true });
try {
  const ctx = await b.newContext({ ...IOS, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/trace`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await p.waitForFunction(() => !!customElements.get('rb-object-item'), { timeout: 20000 }).catch(() => {});
  await sleep(1500);

  // enumerate EVERY rb-object-item whose ref contains the uuid — dump exact ref, status attr, type, visibility, parent chain
  const rows = await p.evaluate((uu) => {
    const parentChain = (el) => { const out = []; let n = el.parentElement; let hops = 0; while (n && hops < 12) { if (n.tagName?.toLowerCase() === 'rb-object-item') { const nm = (n.getAttribute('title') || n.querySelector('.oi-name')?.textContent || '').slice(0, 34); if (nm) out.push(nm); } n = n.parentElement; hops++; } return out; };
    return [...document.querySelectorAll('rb-object-item')].filter(x => (x.getAttribute('ref') || '').includes(uu)).map(x => ({
      ref: x.getAttribute('ref'),
      refIsExactTask: x.getAttribute('ref') === `task:${uu}`,
      statusAttr: x.getAttribute('status'),
      type: x.getAttribute('type'),
      title: (x.getAttribute('title') || x.querySelector('.oi-name')?.textContent || '').slice(0, 48),
      visible: (x.offsetHeight || 0) > 0,
      badge: (String((x.querySelector('.oi-status')?.className?.baseVal) || x.querySelector('.oi-status')?.className || '').match(/oi-status-(\w+)/) || [])[1] || '',
      parentChain: parentChain(x),
    }));
  }, UUID);

  console.log(`detail-source (/api/ior unit.model.status) = "${iorStatus}"`);
  console.log(`rb-object-item elements whose ref contains ${UUID.slice(0, 8)}: ${rows.length}`);
  for (const [i, r] of rows.entries()) {
    console.log(`  [${i}] ref="${r.ref}" exactTask=${r.refIsExactTask} type=${r.type} statusAttr="${r.statusAttr}" badge=${r.badge} visible=${r.visible}`);
    console.log(`       title="${r.title}" parentChain=${JSON.stringify(r.parentChain)}`);
  }

  // ── BOUNDED ANSWER ──
  const exact = rows.filter(r => r.refIsExactTask);
  const inProg = rows.find(r => /in.?progress/i.test(String(r.statusAttr)));
  console.log('\n── BOUNDED ANSWER ──');
  if (inProg && inProg.refIsExactTask) {
    console.log(`REAL DIVERGENCE: the IN-PROGRESS row IS T40.1 (ref="task:${UUID}", exact same unit). Its tree-source status attr="${inProg.statusAttr}" vs the detail-source (/api/ior) status="${iorStatus}". Same unit, two sources, disagreeing — persists after reload (measured prior run). = Tron's two-views-disagree complaint on his actual task. REPORTING, not diagnosing.`);
  } else if (inProg && !inProg.refIsExactTask) {
    console.log(`SELECTOR ARTIFACT: the IN-PROGRESS row's ref="${inProg.ref}" is NOT the exact task node (type=${inProg.type}, under ${JSON.stringify(inProg.parentChain)}) — it merely CONTAINS the uuid. The exact task:${UUID} row(s): ${JSON.stringify(exact.map(e => ({ statusAttr: e.statusAttr, badge: e.badge })))}. Dropping the flag as an artifact of my substring match.`);
  } else if (!inProg) {
    console.log(`NO IN-PROGRESS row this run. Exact task rows: ${JSON.stringify(exact.map(e => ({ statusAttr: e.statusAttr, badge: e.badge })))} vs detail "${iorStatus}". ${exact.every(e => e.statusAttr === iorStatus) ? 'Tree and detail AGREE — prior IN-PROGRESS was likely a transient/artifact; drop.' : 'Divergence present — see rows.'}`);
  }
} finally { await b.close(); }
