// T37.21 — ROOM FILES SUNBURST @390 (Tron's FIRST-LOOK MORNING GATE, THE single most important verification).
// Tron's exact complaint + screenshot: the Heartspaces room "Files" sunburst rendered UNIFORM one-per-file arcs even
// though the files are wildly different sizes (LinkedIn Banner.png ~10MB vs a 43-byte doc). The bytes now reach his
// surface @0.8.164 (DATA-layer confirmed: /api/trace/children of the resolved files folder carries real model.size).
// THIS gate proves the PIXEL render on the surface he looks at: mount the room Files folder @390 real-WebKit and assert
// the sunburst arcs are PROPORTIONAL TO BYTES and VISIBLY DIFFERENT — the LARGEST arc is the 10MB png, the doc is a
// sliver — measured from the RENDERED SVG (getTotalLength), tied to the DATA he sees, and ABLE-TO-FAIL (an equal-angle /
// one-per-file stub → every arc equal → RED). Read-only live prod; no mutation.
//
// Measure note: a sunburst wedge's getTotalLength = k*angle + c (c = the constant radial segments per wedge, pie or
// donut). So absolute lengths aren't the byte-fractions, but the ANGLE-driven spread is: a proportional renderer makes
// max/min arc-length >> 1 (the 10MB png dwarfs the 43B doc); an equal-angle stub makes every wedge identical → max/min
// == 1. That ratio is the decisive, geometry-agnostic able-to-fail signal. We also map the LARGEST measured arc to its
// title byte-size and require it to be the png, and require the doc's arc to sit at the minimum.
// [test:uuid:f805cfe0-cc8c-455b-9608-c48e2c8ece1f] T37.21 P4b — room Files sunburst arc size = real ON-DISK BYTES (Tron's
// corrected childCount→bytes metric): rendered .dv-sunburst arcs proportional to /api/trace/children model.size (sunburst.ts
// sizeOf accessor + (size/total)*360 segments), largest arc=png(10MB) tiny=doc(43B), able-to-fail. Verifies the sunburst-bytes Impl.
import { webkit } from '@playwright/test';
const BASE = 'https://prod.wo-da.de:4444';
const ROOM = '6c04f959-f3d6-42eb-818f-5e2e4498bf91';          // Heartspaces (Tron's screenshot room)
const FILES_REF = `roomcoll:${ROOM}:files`;                    // the ref the tree/drawer mounts (Tron's render path)
const FILES_UUID = 'f0250bdc-bc79-4f21-a2ad-a78a96959fc1';     // resolved files-folder uuid (DATA path; full uuid — no 8-char false-negative)
const PNG = 10916416, DOC = 43;                                // Tron's extremes: LinkedIn Banner.png (~10MB) / BABËL doc (43B)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IPHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' };
const R = (v) => console.log(v);
const argmax = (a) => a.reduce((bi, v, i, x) => (v > x[bi] ? i : bi), 0);
const argmin = (a) => a.reduce((bi, v, i, x) => (v < x[bi] ? i : bi), 0);

const browser = await webkit.launch();
let exit = 1;
try {
  const ctx = await browser.newContext({ ...IPHONE, ignoreHTTPSErrors: true, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/trace', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector('rb-trace-tree'), { timeout: 20000 }).catch(() => {});
  await sleep(400);
  const servedVer = await page.evaluate(async () => { try { return (await (await fetch('/api/config')).json()).version; } catch { return '?'; } });

  // ── DATA ground truth (what Tron sees): the room Files children + their real byte sizes (floor null→1 like the client) ──
  const data = await page.evaluate(async (u) => {
    const j = await (await fetch(`/api/trace/children/${u}`)).json().catch(() => ({}));
    return (j.children || []).map((c) => ({ name: c.name, size: Math.max(Number(c.size ?? (c.model && c.model.size) ?? 0) || 0, 1) }));
  }, FILES_UUID);
  const dataSizes = data.map((d) => d.size).sort((a, b) => a - b);
  R(`DATA (Tron's surface, ${data.length} files): ${data.map((d) => `${(d.name || '?').slice(0, 20)}=${d.size}`).join(' · ')}`);

  // ── mount the room Files folder in the drawer (rb-detail-view fetch-path — the render Tron looks at) ──
  await page.evaluate((r) => { let d = document.querySelector('rb-detail-drawer'); if (!d) { d = document.createElement('rb-detail-drawer'); (document.querySelector('.trace-page') || document.body).appendChild(d); } d.removeAttribute('ref'); d.setAttribute('ref', r); d.setAttribute('open', ''); }, FILES_REF);
  await page.waitForFunction(() => { const v = document.querySelector('rb-detail-view, rb-detail-drawer'); return v && (v.querySelector('.dv-sunburst') || v.querySelector('.dv-title')); }, { timeout: 12000 }).catch(() => {});
  await sleep(1000);

  const sun = await page.evaluate(() => {
    const wrap = document.querySelector('.dv-sunburst');
    const title = document.querySelector('.dv-title')?.textContent || '';
    if (!wrap) return { present: false, title };
    const paths = [...wrap.querySelectorAll('svg path')];
    const arcs = paths.map((p) => {
      const tt = p.querySelector('title')?.textContent || '';
      const m = /—\s*(\d+)\s*$/.exec(tt);
      return { size: m ? Number(m[1]) : null, len: (typeof p.getTotalLength === 'function' ? p.getTotalLength() : 0), tt: tt.slice(-40) };
    });
    const box = wrap.querySelector('svg')?.getBoundingClientRect();
    return { present: true, title, empty: !!wrap.querySelector('.dv-sunburst-empty'), arcs, visible: !!box && box.width > 20 && box.height > 20 };
  });
  await page.screenshot({ path: 'test-results/r4021c-room-files/heartspaces-files-sunburst.png' }).catch(() => {});

  if (!sun.present) { R(`RED — no .dv-sunburst rendered on room Files (title="${sun.title}"). The sunburst did not fire on Tron's surface.`); throw new Error('no-sunburst'); }
  const arcs = sun.arcs, lens = arcs.map((a) => a.len), sizes = arcs.map((a) => a.size);
  R(`RENDERED arcs (${arcs.length}): ${arcs.map((a) => `size=${a.size} len=${a.len.toFixed(1)}`).join(' · ')}`);

  // (1) FIRES with children LOADED (arc-count == data file count, N>0 — not a sunburst-over-zero)
  const fires = sun.visible && !sun.empty && arcs.length > 0 && arcs.length === data.length;
  // (2) DATA-TIED: the rendered arc byte-sizes == the sizes Tron sees (multiset). Ties the render to his authoritative data.
  const arcSizesSorted = sizes.filter((s) => s != null).slice().sort((a, b) => a - b);
  const dataTied = arcSizesSorted.length === dataSizes.length && arcSizesSorted.every((s, i) => s === dataSizes[i]);
  // (3) LARGEST arc == the 10MB png
  const iMaxLen = argmax(lens), iMinLen = argmin(lens);
  const largestIsPng = sizes[iMaxLen] === PNG;
  // (4) the doc (43B) renders as a SLIVER: its arc length is within 5% of the minimum measured length
  const iDoc = sizes.findIndex((s) => s === DOC);
  const docIsTiny = iDoc >= 0 && lens[iDoc] <= Math.min(...lens) * 1.05;
  // (5) VISIBLY DIFFERENT + ABLE-TO-FAIL: max/min arc-length ratio >> 1 (equal-angle stub → exactly 1.0 → RED)
  const ratio = Math.min(...lens) > 0 ? Math.max(...lens) / Math.min(...lens) : Infinity;
  const visiblyDifferent = ratio > 1.5;

  R(`(1) fires+children-loaded: ${fires} (visible=${sun.visible} empty=${sun.empty} arcs=${arcs.length}==data=${data.length})`);
  R(`(2) arc-sizes == Tron's data sizes: ${dataTied} (arcs=${JSON.stringify(arcSizesSorted)} data=${JSON.stringify(dataSizes)})`);
  R(`(3) LARGEST arc is the png: ${largestIsPng} (max-len arc #${iMaxLen} size=${sizes[iMaxLen]}, png=${PNG})`);
  R(`(4) doc(43B) is a sliver: ${docIsTiny} (doc arc #${iDoc} len=${iDoc >= 0 ? lens[iDoc].toFixed(1) : 'n/a'}, min-len=${Math.min(...lens).toFixed(1)})`);
  R(`(5) visibly-different + able-to-fail: ${visiblyDifferent} (max/min arc-length ratio=${ratio.toFixed(2)}; equal-angle stub → 1.00 → RED)`);

  const green = fires && dataTied && largestIsPng && docIsTiny && visiblyDifferent;
  const CAV = `[read-only live prod /trace, served=${servedVer}; @390 real-WebKit; measured from the RENDERED .dv-sunburst SVG, tied to /api/trace/children sizes]`;
  R(`\n═══ T37.21 ROOM FILES SUNBURST (Tron's surface) ═══\n${green
    ? `GREEN — the Heartspaces room Files sunburst renders arcs PROPORTIONAL TO BYTES and visibly different: the LARGEST arc is the ~10MB LinkedIn Banner.png, the 43-byte doc is a sliver, arc byte-sizes match the data Tron sees, max/min arc-length ratio ${ratio.toFixed(2)} (an equal-angle one-per-file stub would be 1.00 → this gate bites). Tron's exact defect is FIXED on his surface. ${CAV}`
    : `RED — fires=${fires} dataTied=${dataTied} largestIsPng=${largestIsPng} docIsTiny=${docIsTiny} visiblyDifferent=${visiblyDifferent}(ratio=${ratio.toFixed(2)}). If this disagrees with what Tron sees, the error is OURS (surface/version/probe) — reconcile, do not blame his screenshot. ${CAV}`}`);
  exit = green ? 0 : 1;
} finally { await browser.close().catch(() => {}); }
process.exit(exit);
