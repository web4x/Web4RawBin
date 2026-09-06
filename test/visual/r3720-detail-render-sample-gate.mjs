// T37.20.3 verify (PO ruling) — 'EVERY /model detail RENDERS' is NOT proven by the 5 natural classes. Sample the OTHER unit
// types on the LIVE tree (/trace has requirement/task/usecase/class/method/implementation/test/sprint nodes) and flag ANY that
// renders an EMPTY detail (the R30.21-class defect: unit in /api but the detail view shows nothing). Real select via the tree →
// capture the mounted detail markup → assert non-empty structure. Runtime-read served version (provenance). NOT exhaustive — a
// SAMPLE across types; report which types (if any) render empty. iOS N/A (desktop-webkit, /trace is desktop).
import { webkit } from '@playwright/test';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const R = (v) => console.log(v);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = 'https://prod.wo-da.de:4444';

const browser = await webkit.launch();
let servedVersion = '?';
const out = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/trace`, { waitUntil: 'networkidle' });
  servedVersion = await page.evaluate(async () => { try { return (await (await fetch('/api/config', { cache: 'no-store' })).json()).version; } catch { return '?'; } });
  await sleep(1500);
  // expand a few layers so a VARIETY of unit types are present as rb-object-item nodes
  await page.evaluate(async () => { const t = document.querySelector('rb-trace-tree'); if (t?.expandAll) await t.expandAll().catch(() => {}); const items = [...document.querySelectorAll('rb-object-item')]; for (const it of items.slice(0, 30)) it.dispatchEvent(new CustomEvent('toggle-children', { bubbles: true, detail: { open: true } })); });
  await sleep(2500);

  // collect ONE node per distinct type prefix (requirement:/task:/usecase:/class:/method:/implementation:/test:/sprint:/file:/webitem:)
  const byType = await page.evaluate(() => {
    const seen = {}; const want = ['requirement', 'task', 'usecase', 'class', 'method', 'implementation', 'test', 'sprint', 'file', 'webitem'];
    for (const n of document.querySelectorAll('rb-object-item')) {
      const ref = [...n.attributes].map((a) => a.value).find((v) => /^[a-z]+:[0-9a-f]/i.test(v)) || '';
      const type = ref.split(':')[0].toLowerCase();
      if (want.includes(type) && !seen[type]) seen[type] = ref;
    }
    return seen;
  });
  R(`  served v${servedVersion} · types found on /trace: ${Object.keys(byType).join(', ')}`);

  for (const [type, ref] of Object.entries(byType)) {
    const detail = await page.evaluate(async (ref) => {
      const node = [...document.querySelectorAll('rb-object-item')].find((n) => [...n.attributes].some((a) => a.value === ref));
      if (!node) return { found: false };
      node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 1100));
      const d = document.querySelector('rb-detail-drawer .drawer-panel-detail, .drawer-panel-detail, rb-natural-detail, rb-task-detail, rb-detail-view, [class*="detail"]');
      const html = d ? d.innerHTML : '';
      const text = d ? (d.textContent || '').replace(/\s+/g, ' ').trim() : '';
      const notFound = /not found|failed|no detail|undefined/i.test(text) && text.length < 60;
      return { found: true, len: html.length, textLen: text.length, notFound, hasTitle: /dv-title|dv-type|<h[1-3]|drawer-panel/i.test(html), sample: text.slice(0, 70) };
    }, ref);
    // RENDERS = mounted + non-trivial content + not a not-found shell. Empty/short/not-found = the R30.21 defect.
    const renders = detail.found && !detail.notFound && detail.textLen > 25 && detail.len > 80;
    out.push({ type, ref: ref.slice(0, 22), renders, len: detail.len, textLen: detail.textLen, sample: detail.sample });
    R(`  ${type.padEnd(15)} ${renders ? 'RENDERS' : 'EMPTY/RED'} (htmlLen=${detail.len} textLen=${detail.textLen}) "${detail.sample || ''}"`);
  }
  await ctx.close();
} catch (e) { R(`  ERROR: ${String(e && e.message).slice(0, 200)}`); }
finally { await browser.close().catch(() => {}); }

R(`\n═══ T37.20.3 /model-detail RENDER SAMPLE — prod SERVED v${servedVersion} ═══`);
const empty = out.filter((o) => !o.renders);
for (const o of out) R(`  ${o.type.padEnd(15)}: ${o.renders ? 'RENDERS' : 'EMPTY (R30.21-class defect)'}`);
R(`  SAMPLED ${out.length} types · EMPTY: ${empty.length ? empty.map((e) => e.type).join(', ') : 'none'}`);
R(`  VERDICT: ${out.length >= 4 && empty.length === 0 ? 'PASS — every sampled type renders a non-empty detail' : empty.length ? 'FAIL — some types render EMPTY (named above)' : 'INCONCLUSIVE — too few types sampled'}`);
process.exit(out.length >= 4 && empty.length === 0 ? 0 : 1);
