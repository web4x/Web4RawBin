// T37.21 P5 — DIR-FOLDER SUNBURST @390 (unblocked v0.8.165, R37.33 resolveDirRefAbs: dir refs uniformly repo-relative →
// the puml directory leaves now populate by resolved-uuid; was sunburst-over-zero, which the hardened arc==children>0
// assertion correctly refused before). Same renderer as the room Files gate (renderChildSizeSunburst a34f1a68, sizeOf
// reads on-disk BYTES). Mount a physical /model puml dir with 9 .puml children of widely varied byte sizes and prove the
// sunburst FIRES and is PROPORTIONAL TO BYTES + visibly different + able-to-fail — measured from the RENDERED SVG, tied
// to the /api/trace/children sizes. Read-only live prod; no mutation.
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const DIR_REF = 'dir:scrum.pmo/sprints/sprint-20-traceability-first/diagrams'; // 9 .puml, bytes 576..6464 (ratio 11.2)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const argmax = (a) => a.reduce((bi, v, i, x) => (v > x[bi] ? i : bi), 0);

const browser = await webkit.launch();
let exit = 1;
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/trace', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('rb-trace-tree'), { timeout: 20000 }).catch(() => {});
  await sleep(400);
  const servedVer = await page.evaluate(async () => { try { return (await (await fetch('/api/config')).json()).version; } catch { return '?'; } });

  // DATA ground truth: the dir's .puml children + real byte sizes (floor null→1 like the client sizeOf)
  const data = await page.evaluate(async (ref) => {
    const j = await (await fetch(`/api/trace/children/${encodeURIComponent(ref)}`)).json().catch(() => ({}));
    return (j.children || []).map((c) => ({ name: c.name, size: Math.max(Number(c.size ?? (c.model && c.model.size) ?? 0) || 0, 1) }));
  }, DIR_REF);
  const dataSizes = data.map((d) => d.size).sort((a, b) => a - b);
  const dMax = Math.max(...dataSizes), dMin = Math.min(...dataSizes);
  R(`DATA (${DIR_REF}, ${data.length} pumls): ${data.map((d) => `${(d.name || '?').slice(0, 22)}=${d.size}`).join(' · ')}`);

  // mount the dir folder in the drawer (rb-detail-view fetch-path via resolveDirRefAbs)
  await page.evaluate((r) => { let d = document.querySelector('rb-detail-drawer'); if (!d) { d = document.createElement('rb-detail-drawer'); (document.querySelector('.trace-page') || document.body).appendChild(d); } d.removeAttribute('ref'); d.setAttribute('ref', r); d.setAttribute('open', ''); }, DIR_REF);
  await page.waitForFunction(() => { const v = document.querySelector('rb-detail-view, rb-detail-drawer'); return v && (v.querySelector('.dv-sunburst') || v.querySelector('.dv-title')); }, { timeout: 12000 }).catch(() => {});
  await sleep(1000);

  const sun = await page.evaluate(() => {
    const wrap = document.querySelector('.dv-sunburst');
    const title = document.querySelector('.dv-title')?.textContent || '';
    if (!wrap) return { present: false, title };
    const paths = [...wrap.querySelectorAll('svg path')];
    const arcs = paths.map((p) => { const tt = p.querySelector('title')?.textContent || ''; const m = /—\s*(\d+)\s*$/.exec(tt); return { size: m ? Number(m[1]) : null, len: (typeof p.getTotalLength === 'function' ? p.getTotalLength() : 0) }; });
    const box = wrap.querySelector('svg')?.getBoundingClientRect();
    return { present: true, title, empty: !!wrap.querySelector('.dv-sunburst-empty'), arcs, visible: !!box && box.width > 20 && box.height > 20 };
  });
  await page.screenshot({ path: 'test-results/r4021d-p5-dir/sprint20-diagrams-sunburst.png' }).catch(() => {});

  if (!sun.present) { R(`RED — no .dv-sunburst rendered on the dir folder (title="${sun.title}"). Sunburst did not fire.`); throw new Error('no-sunburst'); }
  const arcs = sun.arcs, lens = arcs.map((a) => a.len), sizes = arcs.map((a) => a.size);
  R(`RENDERED arcs (${arcs.length}): ${arcs.map((a) => `size=${a.size} len=${a.len.toFixed(1)}`).join(' · ')}`);

  const fires = sun.visible && !sun.empty && arcs.length > 0 && arcs.length === data.length;         // children loaded, not over-zero
  const arcSizesSorted = sizes.filter((s) => s != null).slice().sort((a, b) => a - b);
  const dataTied = arcSizesSorted.length === dataSizes.length && arcSizesSorted.every((s, i) => s === dataSizes[i]); // render == data
  const iMaxLen = argmax(lens);
  const largestIsMaxByte = sizes[iMaxLen] === dMax;                                                    // largest arc == biggest .puml
  const iMin = sizes.findIndex((s) => s === dMin);
  const smallestIsSliver = iMin >= 0 && lens[iMin] <= Math.min(...lens) * 1.05;                        // smallest .puml is a sliver
  const ratio = Math.min(...lens) > 0 ? Math.max(...lens) / Math.min(...lens) : Infinity;
  const visiblyDifferent = ratio > 1.5;                                                                // equal-angle stub → 1.00 → RED

  R(`(1) fires+children-loaded: ${fires} (visible=${sun.visible} empty=${sun.empty} arcs=${arcs.length}==data=${data.length})`);
  R(`(2) arc-sizes == data sizes: ${dataTied}`);
  R(`(3) LARGEST arc == biggest .puml (${dMax}B): ${largestIsMaxByte} (max-len arc #${iMaxLen} size=${sizes[iMaxLen]})`);
  R(`(4) smallest .puml (${dMin}B) is a sliver: ${smallestIsSliver}`);
  R(`(5) visibly-different + able-to-fail: ${visiblyDifferent} (max/min arc-length ratio=${ratio.toFixed(2)}; equal-angle stub → 1.00 → RED)`);

  const green = fires && dataTied && largestIsMaxByte && smallestIsSliver && visiblyDifferent;
  const CAV = `[read-only live prod /trace, served=${servedVer}; @390 real-WebKit; RENDERED .dv-sunburst tied to /api/trace/children sizes; P5 dir unblocked by R37.33 resolveDirRefAbs]`;
  R(`\n═══ T37.21 P5 DIR-FOLDER SUNBURST ═══\n${green
    ? `GREEN — the puml dir sunburst FIRES with children loaded (${arcs.length} arcs == ${data.length} .puml, not over-zero) and is PROPORTIONAL TO BYTES: largest arc = the ${dMax}B puml, smallest (${dMin}B) a sliver, arc byte-sizes match the data, max/min ratio ${ratio.toFixed(2)} (equal-angle stub → 1.00 → bites). Same renderer (a34f1a68) as the room gate, now firing on a physical dir. ${CAV}`
    : `RED — fires=${fires} dataTied=${dataTied} largestIsMaxByte=${largestIsMaxByte} smallestIsSliver=${smallestIsSliver} visiblyDifferent=${visiblyDifferent}(ratio=${ratio.toFixed(2)}). ${CAV}`}`);
  exit = green ? 0 : 1;
} finally { await browser.close().catch(() => {}); }
process.exit(exit);
