// R37.21 Part 4 — child-size SUNBURST (pure view). RIDES R40.16 (architect c165e2506): the single-source child-size
// field is `childCount` — the SAME per-node value the tree child-count badge uses (server mofFolder, server.ts:1223),
// read here through the ONE accessor `sizeOf` so badge + sunburst can NEVER disagree. NO new size field, NO ad-hoc count.
// This is THE one sunburst renderer (nothing pre-existed to fork). Pure function → SVG string; unit-testable in node.
//
// Acceptance (architect): arc-count == direct-child-count · angle ∝ childCount (largest childCount = largest arc, NOT
// equal slices) · size(child)=max(childCount,1) so a leaf (childCount 0) still occupies an arc · deterministic order
// (preserves the API child order, which is index-stable) · a DEFINED empty-state for 0 children (never a blank ring).

export type SunburstChild = { name: string; childCount?: number };

// THE single accessor — identical semantics to the tree badge (childCount, floored at 1 so leaves render).
export function sizeOf(c: SunburstChild): number { return Math.max(Number(c?.childCount ?? 0), 1); }

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

// deterministic hue per index (golden-angle spread → distinct adjacent arcs, stable across renders)
function arcColor(i: number): string { return `hsl(${(i * 137.508) % 360} 62% 55%)`; }

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg - 90) * Math.PI / 180; // 0° = 12 o'clock, clockwise
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

// one annular sector (donut wedge) from a0→a1 degrees, inner radius ri, outer ro
function sectorPath(cx: number, cy: number, ri: number, ro: number, a0: number, a1: number): string {
  const large = (a1 - a0) > 180 ? 1 : 0;
  const [ox0, oy0] = polar(cx, cy, ro, a0), [ox1, oy1] = polar(cx, cy, ro, a1);
  const [ix1, iy1] = polar(cx, cy, ri, a1), [ix0, iy0] = polar(cx, cy, ri, a0);
  return `M${ox0.toFixed(2)} ${oy0.toFixed(2)} A${ro} ${ro} 0 ${large} 1 ${ox1.toFixed(2)} ${oy1.toFixed(2)} `
    + `L${ix1.toFixed(2)} ${iy1.toFixed(2)} A${ri} ${ri} 0 ${large} 0 ${ix0.toFixed(2)} ${iy0.toFixed(2)} Z`;
}

export type SunburstSeg = { name: string; size: number; startDeg: number; endDeg: number };

// PURE geometry (node-testable, no DOM): one segment per child, sweep ∝ size, cumulative from 0°, input order preserved.
// arc-count == children.length; sum of sweeps == 360; largest size ⇒ largest sweep. Empty → [].
export function sunburstSegments(children: SunburstChild[] | null | undefined): SunburstSeg[] {
  const items = Array.isArray(children) ? children : [];
  if (items.length === 0) return [];
  const total = items.reduce((s, c) => s + sizeOf(c), 0);
  let a0 = 0;
  return items.map((c) => { const size = sizeOf(c); const a1 = a0 + (size / total) * 360; const seg = { name: c.name, size, startDeg: a0, endDeg: a1 }; a0 = a1; return seg; });
}

// [impl:uuid:PENDING-req-mint] R37.21 Part 4 renderChildSizeSunburst — flagged to req for the Part-4 Impl uuid
export function renderChildSizeSunburst(children: SunburstChild[] | null | undefined): string {
  const items = Array.isArray(children) ? children : [];
  const wrap = (inner: string) =>
    `<div class="dv-sunburst" style="margin:10px 0"><h4 style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:6px">Child size (sunburst)</h4>${inner}</div>`;

  // DEFINED empty-state — never a blank ring (architect + R40.16 fail-loud-ish: say it plainly)
  if (items.length === 0) {
    return wrap(`<div class="dv-sunburst-empty" style="color:rgba(255,255,255,0.4);font-size:0.8rem;font-style:italic">no children — nothing to size</div>`);
  }

  const cx = 100, cy = 100, ro = 92, ri = 46;

  // single child → a FULL ring (a 360° sector can't be one arc); label it whole.
  let paths: string;
  if (items.length === 1) {
    const outer = `M${cx} ${cy - ro} A${ro} ${ro} 0 1 1 ${cx - 0.01} ${cy - ro} Z`;
    const inner = `M${cx} ${cy - ri} A${ri} ${ri} 0 1 0 ${cx - 0.01} ${cy - ri} Z`;
    paths = `<path d="${outer} ${inner}" fill="${arcColor(0)}" fill-rule="evenodd"><title>${esc(items[0].name)} — ${sizeOf(items[0])}</title></path>`;
  } else {
    paths = sunburstSegments(items).map((s, i) =>
      `<path d="${sectorPath(cx, cy, ri, ro, s.startDeg, s.endDeg)}" fill="${arcColor(i)}" stroke="#1b1b1f" stroke-width="1"><title>${esc(s.name)} — ${s.size}</title></path>`
    ).join('');
  }

  // legend — deterministic, arc-count rows, each naming its childCount (the sized value)
  const legend = items.map((c, i) =>
    `<div style="display:flex;align-items:center;gap:6px;font-size:0.72rem;color:rgba(255,255,255,0.7)"><span style="width:10px;height:10px;border-radius:2px;background:${arcColor(i)};flex-shrink:0"></span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.name)}</span><span style="margin-left:auto;color:rgba(255,255,255,0.45)">${sizeOf(c)}</span></div>`
  ).join('');

  return wrap(
    `<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">`
    + `<svg viewBox="0 0 200 200" width="160" height="160" role="img" aria-label="child size sunburst, ${items.length} children" style="flex-shrink:0">${paths}</svg>`
    + `<div style="display:flex;flex-direction:column;gap:3px;min-width:120px;flex:1">${legend}</div>`
    + `</div>`
  );
}
