// R32.4 diagram-view PURE core (DOM-free → unit-testable in node/tsx; the R32.1/R32.2 pure-core pattern).
// Builds UML class-box SVG from Layer-2 view-links + resolved element nodes. NO DOM/fetch here — rb-diagram-detail.ts
// (the custom element) does the fetch + mount + pan/zoom + click; this module is the render logic it calls.
// R32.6 EXTENDS it: an ADDITIVE edge pass (buildEdges) — model relatesTo/relations → on-surface X→Y edges.

export type EdgeKind = 'association' | 'generalization' | 'dependency';
export interface DiagramRelation { to: string; kind: EdgeKind } // to = target element uuid (or ref); kind = M2-derived
export interface ViewLink { unit: string; x: number; y: number; w?: number; h?: number; viewKind?: string; }
export interface DiagramNode { name: string; kind: string; attrs: string[]; methods: string[]; relations?: DiagramRelation[]; }

export const stripRef = (r: string): string => String(r || '').replace(/^ior:instance:/, '').replace(/^modelelement:/, '');
export const esc = (s: string): string => String(s).replace(/[<>&]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;'));

export const BOX_W = 180, HEAD_H = 26, ROW_H = 18, PAD = 8;

// Box height from row counts — SHARED by buildBox (render) and buildEdges (border-clip geometry) so they agree.
export function boxH(node: DiagramNode): number {
  const attrH = node.attrs.length * ROW_H, methH = node.methods.length * ROW_H;
  return HEAD_H + (attrH || ROW_H) + (methH || ROW_H);
}

// One UML class box (SVG <g>) at the view-link's x,y. Compartments: name (+«interface» stereotype), attributes,
// methods; height derives from row counts. data-ref carries the SELECT target for box-click → node detail.
export function buildBox(view: ViewLink, node: DiagramNode): string {
  const w = view.w || BOX_W;
  const attrH = node.attrs.length * ROW_H;
  const h = boxH(node);
  const stereo = node.kind === 'interface' ? '«interface» ' : '';
  const rows = (items: string[], y0: number): string => items.map((t, i) =>
    `<text x="6" y="${y0 + i * ROW_H + 13}" class="dm-row">${esc(t)}</text>`).join('');
  const y1 = HEAD_H, y2 = HEAD_H + (attrH || ROW_H);
  return `<g class="dm-box" data-ref="modelelement:${stripRef(view.unit)}" transform="translate(${view.x},${view.y})" tabindex="0">`
    + `<rect class="dm-box-bg" width="${w}" height="${h}" rx="4"/>`
    + `<text x="${w / 2}" y="17" text-anchor="middle" class="dm-name">${stereo}${esc(node.name)}</text>`
    + `<line x1="0" y1="${y1}" x2="${w}" y2="${y1}" class="dm-sep"/>${rows(node.attrs, y1)}`
    + `<line x1="0" y1="${y2}" x2="${w}" y2="${y2}" class="dm-sep"/>${rows(node.methods.map((m) => m + '()'), y2)}`
    + `</g>`;
}

// ONE <defs> marker set (Q3): arrowhead by M2 kind. Generalization = hollow triangle; Association/Dependency = open arrow.
export const EDGE_DEFS = '<defs>'
  + '<marker id="dm-arrow-generalization" markerWidth="14" markerHeight="12" refX="11" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L11,5 L0,10 Z" class="dm-arrow-hollow"/></marker>'
  + '<marker id="dm-arrow-association" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L9,5 L0,10" class="dm-arrow-open"/></marker>'
  + '<marker id="dm-arrow-dependency" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L9,5 L0,10" class="dm-arrow-open"/></marker>'
  + '</defs>';

interface Rect { x: number; y: number; w: number; h: number }
// Exit point on rect r's border along the ray from r's center toward (tx,ty). Straight center-to-center, clipped.
function borderPoint(r: Rect, tx: number, ty: number): { x: number; y: number } {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2, dx = tx - cx, dy = ty - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const sx = dx ? (r.w / 2) / Math.abs(dx) : Infinity, sy = dy ? (r.h / 2) / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return { x: cx + dx * s, y: cy + dy * s };
}

// [impl:uuid:77761d46-4144-4b84-a9e4-4c876da310d0] DiagramViewModel.buildEdges (Method 8c68b925, Class 09730090, off UC 20fe541e diagram.renderEdges)
// R32.6 edge pass — for each on-diagram box X, an edge X→Y per X.relations IFF Y is ALSO an on-diagram box
// (off-diagram target = NO dangling edge). Arrowhead by M2 kind. De-dup (from,to,kind) → idempotent re-render.
export function buildEdges(views: ViewLink[], nodeOf: (uuid: string) => DiagramNode | null): { svg: string; count: number } {
  const rects = new Map<string, Rect>();
  const nodes = new Map<string, DiagramNode>();
  for (const v of views) {
    if (v.viewKind && v.viewKind !== 'class' && v.viewKind !== 'interface') continue;
    const uuid = stripRef(v.unit); const node = nodeOf(uuid); if (!node) continue;
    rects.set(uuid, { x: v.x, y: v.y, w: v.w || BOX_W, h: boxH(node) });
    nodes.set(uuid, node);
  }
  const seen = new Set<string>(); const edges: string[] = [];
  for (const [from, node] of nodes) {
    const src = rects.get(from)!;
    for (const rel of node.relations || []) {
      const to = stripRef(rel.to);
      if (to === from || !rects.has(to)) continue; // off-diagram (or self) → no dangling edge
      const key = `${from}->${to}:${rel.kind}`;
      if (seen.has(key)) continue; seen.add(key); // de-dup by (from,to,kind) → idempotent
      const tgt = rects.get(to)!;
      const sc = { x: src.x + src.w / 2, y: src.y + src.h / 2 }, tc = { x: tgt.x + tgt.w / 2, y: tgt.y + tgt.h / 2 };
      const a = borderPoint(src, tc.x, tc.y), b = borderPoint(tgt, sc.x, sc.y);
      edges.push(`<line class="dm-edge dm-edge-${rel.kind}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" `
        + `marker-end="url(#dm-arrow-${rel.kind})" data-rel-from="modelelement:${from}" data-rel-to="modelelement:${to}" data-rel-kind="${rel.kind}"/>`);
    }
  }
  return { svg: edges.join(''), count: edges.length };
}

// [impl:uuid:ba96a744-13f9-42ea-b1cf-746e87481a18] DiagramViewModel.buildDiagramSvg (Method 3fc6ed5b, Class 09730090, off UC 6a155572)
// Assemble the surface SVG from the ordered view-links + a resolver. Returns svg + box count (+ R32.6 edge count).
// Member sub-views render inside their class. R32.6: edges (buildEdges) render in the SAME <svg> group, BEHIND the
// boxes (drawn first) so RbPanZoom transforms them WITH the nodes and boxes stay readable. Unresolved units skipped.
export function buildDiagramSvg(views: ViewLink[], nodeOf: (uuid: string) => DiagramNode | null): { svg: string; count: number; edges: number } {
  const boxes: string[] = []; let maxX = 0, maxY = 0;
  for (const v of views) {
    if (v.viewKind && v.viewKind !== 'class' && v.viewKind !== 'interface') continue;
    const node = nodeOf(stripRef(v.unit));
    if (!node) continue;
    boxes.push(buildBox(v, node));
    maxX = Math.max(maxX, v.x + (v.w || BOX_W) + PAD);
    maxY = Math.max(maxY, v.y + boxH(node) + PAD);
  }
  const { svg: edgeSvg, count: edges } = buildEdges(views, nodeOf); // edges FIRST (behind boxes)
  const vb = `0 0 ${Math.max(maxX, 100)} ${Math.max(maxY, 100)}`;
  return { svg: `<svg class="dm-svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${EDGE_DEFS}${edgeSvg}${boxes.join('')}</svg>`, count: boxes.length, edges };
}
