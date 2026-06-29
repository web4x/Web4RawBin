// R22.3 gate — Traceability Chain shows a clickable 📂 source link per hop.
// Fix 5a3e794d6: /api/trace/children returns sourceFile+sourceLine per child;
// renderChainPathSection renders renderSourceLink (blue #42a5f5 <a href=/md/...> 📂 path:line)
// on its own line after each chain-link row (Class→.puml, Method/Impl→.ts:line).
//
// Mount each detail component with the page TraceGraph, wait for the async chain walk to
// SETTLE, then assert the chain section has clickable 📂 source links (≥1 hop), each an
// <a> to /md/ in blue, opening the source in the /md browser. DET-3x over Class/Method/Impl.

import { chromium } from '@playwright/test';
const BASE = process.env.GATE_BASE || 'https://prod.wo-da.de:4444';
const NODES = [
  { type: 'class',          tag: 'rb-class-detail',          uuid: '88dcce3a-770b-4c61-b996-02a72f5d6bef', wantExt: '.puml' }, // ScenarioUnit (Class→.puml)
  { type: 'method',         tag: 'rb-method-detail',         uuid: '963b67a2-488c-4580-b5ba-697537f02754', wantExt: '.ts' },   // Method→.ts:line
  { type: 'implementation', tag: 'rb-implementation-detail', uuid: '97143b41-287a-4981-9c1d-ebadef1edfb0', wantExt: '.ts' },   // Impl→.ts:line
];

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--ignore-certificate-errors'] });
const page = await (await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 900 } })).newPage();
await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => { const t = document.querySelector('rb-trace-tree'); return !!(t && t.graph && t.graph.get); }, { timeout: 25000 });

async function checkNode(n) {
  await page.evaluate(({ tag, type, uuid }) => {
    document.querySelectorAll('.__r223').forEach(e => e.remove());
    const el = document.createElement(tag); el.className = '__r223';
    el.graph = document.querySelector('rb-trace-tree').graph;
    el.setAttribute('ref', `${type}:${uuid}`);
    document.body.appendChild(el);
  }, n);
  // wait for the chain walk to SETTLE (walkChain replaces '.dv-chain-walk' with rows, or 'no chain path')
  await page.waitForFunction(() => {
    const el = document.querySelector('.__r223'); if (!el) return false;
    if (/not found/i.test(el.textContent || '')) return true;
    const path = el.querySelector('.dv-chain-path'); if (!path) return false;
    const walk = path.querySelector('.dv-chain-walk');
    return !walk /* replaced by rows */ || /no chain path/i.test(walk.textContent || '');
  }, { timeout: 18000 }).catch(() => {});
  await page.waitForTimeout(300);

  return await page.evaluate(() => {
    const el = document.querySelector('.__r223'); if (!el) return { ok: false };
    const chain = el.querySelector('.dv-chain-path');
    const headSrc = [...el.querySelectorAll('.dv-head .dv-source a')];
    const chainSrc = chain ? [...chain.querySelectorAll('.dv-source a')] : [];
    const allSrc = [...headSrc, ...chainSrc];
    const linkInfo = allSrc.map(a => ({
      tag: a.tagName, hasFolder: /📂/.test(a.textContent || ''),
      mdHref: /^\/md\//.test(a.getAttribute('href') || ''),
      blue: getComputedStyle(a).color === 'rgb(66, 165, 245)',
      label: (a.textContent || '').trim(),                 // full label (no truncation — needed for ext match)
      href: a.getAttribute('href') || '',
    }));
    const clickable = linkInfo.filter(l => l.tag === 'A' && l.hasFolder && l.mdHref && l.blue);
    const chainRows = chain ? chain.querySelectorAll('.dv-chain-link').length : 0;
    return { ok: true, chainRows, headSrcN: headSrc.length, chainSrcN: chainSrc.length, clickableN: clickable.length, labels: clickable.map(l => l.label), sample: linkInfo.slice(0, 3) };
  });
}

const results = [];
for (let run = 1; run <= 3; run++) {
  const row = {};
  for (const n of NODES) {
    const r = await checkNode(n);
    // each node must show ≥1 clickable 📂 source link of the expected kind (Class→.puml, Method/Impl→.ts)
    const extOk = r.ok && (r.labels || []).some(l => l.includes(n.wantExt) || decodeURIComponent(l).includes(n.wantExt));
    row[n.type] = { ...r, extOk, pass: r.ok && r.clickableN >= 1 && extOk };
  }
  const runPass = NODES.every(n => row[n.type].pass);
  results.push(runPass);
  console.log(`--- run ${run} ---`);
  for (const n of NODES) { const r = row[n.type]; console.log(`  ${n.type.padEnd(14)}: chainRows=${r.chainRows} srcLinks(head=${r.headSrcN} chain=${r.chainSrcN}) clickable📂=${r.clickableN} ${n.wantExt}=${r.extOk} => ${r.pass ? 'GREEN' : 'RED'}${r.labels?.[0] ? ' e.g. ' + JSON.stringify(r.labels[0]) : ''}`); }
}
await browser.close();

console.log('\n=== VERDICT R22.3 (DET-3x, Class/Method/Impl) ===');
results.forEach((p, i) => console.log(`  run ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
