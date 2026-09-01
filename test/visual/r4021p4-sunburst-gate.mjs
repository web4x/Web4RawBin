// T37.21 PART 4 — child-size SUNBURST (sunburst.ts renderChildSizeSunburst, v0.8.155 40545ce9d). Architect discriminators
// (c165e2506): arc-count == direct-child-count · LARGEST-childCount child = LARGEST arc (MEASURED from rendered geometry:
// longest path getTotalLength, NOT re-derived) · deterministic order == API child order (architect: renderer does NOT sort
// → verify /api/trace/children order is STABLE) · size == childCount, floored max(cc,1) = the SAME single-source field as
// the tree badge · DEFINED empty-state for 0 children (never a blank ring) · visible @390. Read-only on the live prod
// /trace client (rb-detail-view type-gate = model.type || ref-prefix → a `collection:` ref renders the sunburst over that
// unit's real /api/trace/children). No auth, no writes, no identities. FAILABILITY: arc-count bites (drop a path) +
// proportional bites (unequal-size/equal-len → largest≠largest). (Real folder-TYPE triggering is P1's job; P4 = renderer.)
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const argmax = (arr) => arr.reduce((bi, v, i, a) => (v > a[bi] ? i : bi), 0);

const browser = await webkit.launch();
let verdict = 'INCONCLUSIVE', exit = 1;
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/trace', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('rb-trace-tree'), { timeout: 20000 }).catch(() => {});
  await sleep(500);
  const servedVer = await page.evaluate(async () => { try { return (await (await fetch('/api/config')).json()).version; } catch { return '?'; } });

  // discover: a Sprint whose children have VARIED childCounts (largest-arc testable) + a childless leaf (empty-state).
  const disc = await page.evaluate(async () => {
    const sprints = await (await fetch('/api/trace/sprints')).json();
    let target = null, leaf = null;
    for (const s of sprints.filter((s) => s.hasChildren).sort((a, b) => (b.childCount || 0) - (a.childCount || 0))) {
      const k1 = await (await fetch(`/api/trace/children/${s.uuid}`)).json();
      const ch = (k1.children || []).map((c) => ({ uuid: c.uuid, name: c.name, childCount: c.childCount || 0 }));
      if (!leaf) { const lf = ch.find((c) => c.childCount === 0); if (lf) leaf = lf.uuid; }
      if (!target && ch.length >= 2 && new Set(ch.map((c) => c.childCount)).size >= 2) {
        const k2 = await (await fetch(`/api/trace/children/${s.uuid}`)).json(); // 2nd fetch → order stability
        const order1 = ch.map((c) => c.uuid).join(','), order2 = (k2.children || []).map((c) => c.uuid).join(',');
        target = { uuid: s.uuid, name: s.name, children: ch, orderStable: order1 === order2 };
      }
      if (target && leaf) break;
    }
    return { target, leaf };
  });
  if (!disc.target) { verdict = 'INCONCLUSIVE: no sprint with >=2 varied-childCount children found on the served client.'; throw new Error('no-target'); }
  const t = disc.target;
  R(`  target: "${t.name}" (${t.uuid.slice(0, 8)}) children=${t.children.length} childCounts=[${t.children.map((c) => c.childCount).join(',')}] orderStable=${t.orderStable}`);

  const mountSun = (ref) => page.evaluate((r) => { let d = document.querySelector('rb-detail-drawer'); if (!d) { d = document.createElement('rb-detail-drawer'); (document.querySelector('.trace-page') || document.body).appendChild(d); } d.removeAttribute('ref'); d.setAttribute('ref', r); d.setAttribute('open', ''); }, ref);
  await mountSun(`collection:${t.uuid}`);
  await page.waitForFunction(() => !!document.querySelector('.dv-sunburst svg path'), { timeout: 12000 }).catch(() => {});
  await sleep(900);

  const sb = await page.evaluate(() => {
    const wrap = document.querySelector('.dv-sunburst'); if (!wrap) return { present: false };
    const svg = wrap.querySelector('svg'); const paths = svg ? [...svg.querySelectorAll('path')] : [];
    const arcs = paths.map((p) => { const tt = (p.querySelector('title')?.textContent || ''); const m = /—\s*(\d+)\s*$/.exec(tt); return { name: tt.replace(/\s*—\s*\d+\s*$/, ''), size: m ? Number(m[1]) : null, len: (typeof p.getTotalLength === 'function' ? p.getTotalLength() : 0) }; });
    const box = svg?.getBoundingClientRect();
    return { present: true, empty: !!wrap.querySelector('.dv-sunburst-empty'), arcCount: paths.length, arcs, visible: !!box && box.width > 20 && box.height > 20 };
  });
  await page.screenshot({ path: 'test-results/r4021p4/sunburst.png' }).catch(() => {});
  if (!sb.present) { verdict = `RED — no .dv-sunburst rendered for collection:${t.uuid.slice(0, 8)}.`; throw new Error('no-sb'); }

  const exp = t.children;
  const arcCountOk = sb.arcCount === exp.length;
  const sizeSourceOk = sb.arcs.length === exp.length && sb.arcs.every((a, i) => a.size === Math.max(exp[i]?.childCount ?? 0, 1)); // == max(childCount,1), IN ORDER (single-source + deterministic)
  const idxMaxSize = argmax(sb.arcs.map((a) => a.size)), idxMaxLen = argmax(sb.arcs.map((a) => a.len));
  const largestOk = exp.length === 1 ? true : idxMaxSize === idxMaxLen;   // MEASURED: biggest childCount ⇒ biggest arc
  const orderOk = t.orderStable;                                          // architect: renderer preserves API order → order must be stable
  R(`  arc-count==children:${arcCountOk}(${sb.arcCount}/${exp.length}) · size==childCount(floored)+order:${sizeSourceOk} · largest-size=largest-arc(measured):${largestOk}(maxSize#${idxMaxSize}/maxLen#${idxMaxLen}) · api-order-stable:${orderOk} · visible:${sb.visible}`);

  // empty-state: a childless leaf mounted as collection → defined empty-state, no path
  let emptyOk = null;
  if (disc.leaf) {
    await mountSun(`collection:${disc.leaf}`);
    await page.waitForFunction(() => { const w = document.querySelector('.dv-sunburst'); return w && (w.querySelector('.dv-sunburst-empty') || w.querySelector('svg path')); }, { timeout: 8000 }).catch(() => {});
    await sleep(500);
    const es = await page.evaluate(() => { const w = document.querySelector('.dv-sunburst'); return { empty: !!w?.querySelector('.dv-sunburst-empty'), paths: w?.querySelectorAll('svg path').length || 0, text: (w?.querySelector('.dv-sunburst-empty')?.textContent || '') }; });
    emptyOk = es.empty && es.paths === 0 && /no children/i.test(es.text);
    R(`  empty-state (childless→defined, no ring): ${emptyOk} (empty=${es.empty} paths=${es.paths} "${es.text.slice(0, 30)}")`);
  }

  // FAILABILITY
  const fail = await page.evaluate(() => {
    const svg = document.querySelector('.dv-sunburst svg'); const before = svg ? svg.querySelectorAll('path').length : 0;
    svg?.querySelector('path')?.remove(); const after = svg ? svg.querySelectorAll('path').length : before;
    const sizes = [5, 1, 2], lens = [10, 10, 10]; const am = (a) => a.reduce((bi, v, i, x) => (v > x[bi] ? i : bi), 0);
    return { arcCountBites: before > 0 && after === before - 1, propBites: am(sizes) !== am(lens) };
  });
  R(`  FAILABILITY: arc-count bites=${fail.arcCountBites} · proportional bites=${fail.propBites}`);

  const CAV = `[read-only on live prod /trace; served version string=${servedVer}, client=v0.8.155 (batched restart); type-gate via collection: ref prefix — real folder-type triggering is P1.]`;
  const green = arcCountOk && sizeSourceOk && largestOk && orderOk && sb.visible && !sb.empty && (emptyOk === null || emptyOk) && fail.arcCountBites && fail.propBites;
  if (green) verdict = `GREEN — Part-4 sunburst over "${t.name}" (${exp.length} children): arc-count==children, sizes==childCount single-source (floored, in stable API order), LARGEST-childCount child has the LARGEST measured arc (#${idxMaxSize}), empty-state defined for childless${emptyOk === null ? ' (no leaf found to test)' : ''}, visible @390. Discriminators proven able-to-fail (arc-count + proportional). ${CAV}`;
  else verdict = `RED — Part-4: arc-count=${arcCountOk}(${sb.arcCount}/${exp.length}) size==cc=${sizeSourceOk} largest=largest=${largestOk} order-stable=${orderOk} visible=${sb.visible} empty=${sb.empty} emptyState=${emptyOk} fail[arc=${fail.arcCountBites},prop=${fail.propBites}]. ${CAV}`;
} catch (e) {
  if (!/no-(target|sb)/.test(String(e && e.message))) verdict = `ERROR: ${String(e && e.message).slice(0, 200)}`;
} finally { await browser.close().catch(() => {}); }
R(`\n═══ T37.21 PART-4 SUNBURST GATE ═══\n${verdict}`);
process.exit(/^GREEN/.test(verdict) ? 0 : 1);
