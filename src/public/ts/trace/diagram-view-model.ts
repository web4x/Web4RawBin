// R32.4 diagram-view PURE core (DOM-free → unit-testable in node/tsx; the R32.1/R32.2 pure-core pattern).
// Builds UML class-box SVG from Layer-2 view-links + resolved element nodes. NO DOM/fetch here — rb-diagram-detail.ts
// (the custom element) does the fetch + mount + pan/zoom + click; this module is the render logic it calls.
// R32.6 EXTENDS it: an ADDITIVE edge pass (buildEdges) — model relatesTo/relations → on-surface X→Y edges.

export type EdgeKind = 'association' | 'generalization' | 'dependency' | 'trace'; // R36.4: UmlTraceRelationship (UC→method), dashed
export interface DiagramRelation { to: string; kind: EdgeKind } // to = target element uuid (or ref); kind = M2-derived
export interface ViewLink { unit: string; x: number; y: number; w?: number; h?: number; viewKind?: string; }
import { deriveViewKind } from '../../../ts/shared/facet-type.js'; // R32.11-B2 / BUG D: the ONE ior-class→facet-type fn, shared with the server add-view (no rival map)

export interface DiagramNode { name: string; kind: string; attrs: string[]; methods: string[]; relations?: DiagramRelation[]; signature?: string; ior?: string; model?: Record<string, unknown>; }

// R32.11-B2 / BUG D: the facet key for a view — view.viewKind (authoritative when present) else DERIVED from the
// element's ior-class via the shared deriveViewKind (legacy/missing viewKind no longer silently becomes 'class'),
// else the node's own kind. renderFacet stays the ONE lens router; this only chooses its key. Used by all 3 sites.
const facetKind = (view: ViewLink, node: DiagramNode): string => view.viewKind || deriveViewKind(node.ior, node.model) || node.kind || 'class';

// R36.1/R36.2 part-2 (B): the class-family facet viewKinds that render as a UML/TS class box + participate in edges.
const CLASS_FACETS = new Set(['class', 'interface', 'UmlClass', 'tsClass', 'ts-class-code']);

// R33.6.1 fix: ALSO strip the 'diagram:' prefix. A new/empty diagram opened with only ref='diagram:<uuid>' (no
// `uuid` attr) made addView fall back to stripRef(ref) → 'diagram:<uuid>' unstripped → server 400 bad-uuid → NO box.
// Stripping it here fixes the whole class (addView / render / drop / tap) by construction, uuid-attr present or not.
// THE ONE ref-parser (imported by every call site — no per-module copy): strip ALL leading `word:` type-prefixes
// generically (ior:instance: / modelelement: / diagram: / class: / usecase: / any future type) so a new type can NEVER
// drift a copy out of sync again (BUG B: the old 3-prefix list didn't strip class:/usecase: → colon survived into
// elementUuid → server hex-regex 400). A uuid is hex+dash (no colon), so the +group stops after the prefixes. Server
// regex stays strict (path-safety guard) — parsing is owned HERE, not spread.
// [impl:uuid:20962425-8860-4641-bfc1-2e0330ac5d16] DiagramViewModel.stripRef (BUG B)
export const stripRef = (r: string): string => String(r || '').replace(/^([a-z][a-z0-9]*:)+/i, '');
export const esc = (s: string): string => String(s).replace(/[<>&]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;'));

export const BOX_W = 180, HEAD_H = 26, ROW_H = 18, PAD = 8;

// Box height from row counts — SHARED by buildBox (render) and buildEdges (border-clip geometry) so they agree.
export function boxH(node: DiagramNode): number {
  const attrH = node.attrs.length * ROW_H, methH = node.methods.length * ROW_H;
  return HEAD_H + (attrH || ROW_H) + (methH || ROW_H);
}

// One UML class box (SVG <g>) at the view-link's x,y. Compartments: name (+«interface» stereotype), attributes,
// methods; height derives from row counts. data-ref carries the SELECT target for box-click → node detail.
export function buildBox(view: ViewLink, node: DiagramNode, tsLens = false): string {
  const w = view.w || BOX_W;
  const attrH = node.attrs.length * ROW_H;
  const h = boxH(node);
  const stereo = node.kind === 'interface' ? '«interface» ' : (tsLens ? '«ts» ' : ''); // R36.2 (B): tsClass facet-lens label over the SAME canonical data
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

// R36.1/R36.2 part-2 (B): facet-view geometry helpers (width/height per facetType) — shared by renderFacet + the
// buildDiagramSvg/buildEdges/buildTraceEdge bounds. (Own [impl] not required; renderFacet's marker sits below.)
export function facetW(view: ViewLink, node: DiagramNode): number {
  const k = facetKind(view, node);
  if (k === 'UmlUseCase' || node.kind === 'usecase') return view.w || 160;
  return view.w || BOX_W;
}
export function facetH(view: ViewLink, node: DiagramNode): number {
  const k = facetKind(view, node);
  if (k === 'UmlUseCase' || node.kind === 'usecase') return 52;
  if (k === 'UmlMethod' || k === 'UmlFunction' || node.kind === 'method' || node.kind === 'function') return HEAD_H + ROW_H;
  return boxH(node);
}
// [impl:uuid:94ad4f50-aac8-4de5-ad34-e6776fc4b938] DiagramViewModel.renderFacet (Method a6a05d34) — R36.1/R36.2 part-2 (B)
// facet-lens, built ONCE, reused by buildDiagramSvg for EVERY view-link (no fork, no N renderers). facetType
// (view.viewKind) selects the lens over the ONE canonical node (from /api/ior reconcileCanonical): class-family → UML
// box (or «ts» lens for tsClass); UmlMethod/UmlFunction → a signature box; UmlUseCase → an ellipse.
// (Marker moved adjacent-above this decl — task 275 — so strict-AST binds 94ad4f50 to renderFacet, not facetW.)
export function renderFacet(view: ViewLink, node: DiagramNode): string {
  const k = facetKind(view, node);
  if (k === 'UmlUseCase' || node.kind === 'usecase') return renderUseCaseFacet(view, node);
  if (k === 'UmlMethod' || k === 'UmlFunction' || node.kind === 'method' || node.kind === 'function') return renderMethodFacet(view, node);
  if (k === 'UmlNode' || k === 'node' || k === 'deployment-node' || node.kind === 'node') return renderNodeFacet(view, node); // R40.2 deployment-node lens
  return buildBox(view, node, k === 'tsClass' || k === 'ts-class-code'); // class-family: UML box (TS lens for tsClass)
}
// R40.2 [ride 94ad4f50 — renderFacet EXTENSION, no new marker] UmlNode deployment-node lens: the «node» 3D box
// (front + top + right faces) with the node name and its measured refs as compartment rows (sshd_config / SSH
// identity / domain / TLS cert). Children (otmux panes) are NOT drawn here — they ride the LIVE readSessionTree lens
// in the node's detail (never mirrored into the persisted graph → INV-T tree byte-diff == 0). Pure SVG, no DOM/fetch.
function renderNodeFacet(view: ViewLink, node: DiagramNode): string {
  const d = 10, w = facetW(view, node), bodyH = HEAD_H + node.attrs.length * ROW_H, h = bodyH; // front-face height
  const front = `M0,${d} L${w},${d} L${w},${d + h} L0,${d + h} Z`;
  const top = `M0,${d} L${d},0 L${w + d},0 L${w},${d} Z`;
  const right = `M${w},${d} L${w + d},0 L${w + d},${h} L${w},${d + h} Z`;
  const rows = node.attrs.map((a, i) => `<text x="6" y="${d + HEAD_H + 13 + i * ROW_H}" class="dm-row">${esc(a)}</text>`).join('');
  return `<g class="dm-box dm-facet-node" data-ref="modelelement:${stripRef(view.unit)}" transform="translate(${view.x},${view.y})" tabindex="0">`
    + `<path class="dm-box-bg" d="${top}"/><path class="dm-box-bg" d="${right}"/><path class="dm-box-bg" d="${front}"/>`
    + `<text x="${w / 2}" y="${d + 17}" text-anchor="middle" class="dm-name">«node» ${esc(node.name)}</text>`
    + `<line x1="0" y1="${d + HEAD_H}" x2="${w}" y2="${d + HEAD_H}" class="dm-sep"/>${rows}</g>`;
}
// UmlMethod/UmlFunction lens: one compartment = the signature (visibility name(params): returnType, from the canonical node).
function renderMethodFacet(view: ViewLink, node: DiagramNode): string {
  const w = facetW(view, node), h = HEAD_H + ROW_H, sig = node.signature || `${node.name}()`;
  return `<g class="dm-box dm-facet-method" data-ref="modelelement:${stripRef(view.unit)}" transform="translate(${view.x},${view.y})" tabindex="0">`
    + `<rect class="dm-box-bg" width="${w}" height="${h}" rx="4"/>`
    + `<text x="${w / 2}" y="17" text-anchor="middle" class="dm-name">${esc(node.name)}</text>`
    + `<line x1="0" y1="${HEAD_H}" x2="${w}" y2="${HEAD_H}" class="dm-sep"/>`
    + `<text x="6" y="${HEAD_H + 13}" class="dm-row">${esc(sig)}</text></g>`;
}
// UmlUseCase lens: an ellipse with the use-case name (Object.verb). Its trace connector to the method lands with R36.4.
function renderUseCaseFacet(view: ViewLink, node: DiagramNode): string {
  const w = facetW(view, node), h = 52, rx = w / 2, ry = h / 2;
  return `<g class="dm-box dm-facet-usecase" data-ref="modelelement:${stripRef(view.unit)}" transform="translate(${view.x},${view.y})" tabindex="0">`
    + `<ellipse class="dm-box-bg" cx="${rx}" cy="${ry}" rx="${rx}" ry="${ry}"/>`
    + `<text x="${rx}" y="${ry + 4}" text-anchor="middle" class="dm-name">${esc(node.name)}</text></g>`;
}

// ONE <defs> marker set (Q3): arrowhead by M2 kind. Generalization = hollow triangle; Association/Dependency = open arrow.
export const EDGE_DEFS = '<defs>'
  + '<marker id="dm-arrow-generalization" markerWidth="14" markerHeight="12" refX="11" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L11,5 L0,10 Z" class="dm-arrow-hollow"/></marker>'
  + '<marker id="dm-arrow-association" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L9,5 L0,10" class="dm-arrow-open"/></marker>'
  + '<marker id="dm-arrow-dependency" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L9,5 L0,10" class="dm-arrow-open"/></marker>'
  + '<marker id="dm-arrow-trace" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L9,5 L0,10" class="dm-arrow-open"/></marker>' // R36.4 UmlTraceRelationship (UC→method); the dashed LINE (.dm-edge-trace) distinguishes it
  + '</defs>';

export interface Rect { x: number; y: number; w: number; h: number }
// Exit point on rect r's border along the ray from r's center toward (tx,ty). Straight center-to-center, clipped.
// R33.6.3: EXPORTED so RbDiagramDetail.rerouteEdges reuses the SAME geometry live during a box drag (INV-R1 no-drift, no fork).
export function borderPoint(r: Rect, tx: number, ty: number): { x: number; y: number } {
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
    const uuid = stripRef(v.unit); const node = nodeOf(uuid); if (!node) continue;
    // R36.4: rect EVERY facet view (facet-aware size) so a trace connector (UC→method) can anchor to usecase/method
    // views too — not only class-family. Class relations still originate on class nodes' relations[]; usecase nodes
    // carry the derived {to:method, kind:'trace'} relation. borderPoint clip + (from,to,kind) de-dup unchanged.
    rects.set(uuid, { x: v.x, y: v.y, w: facetW(v, node), h: facetH(v, node) });
    nodes.set(uuid, node);
  }
  const seen = new Set<string>(); const edges: string[] = [];
  for (const [from, node] of nodes) {
    const src = rects.get(from)!;
    for (const rel of node.relations || []) {
      if (rel.kind === 'trace') continue; // R36.4: trace edges are the buildTraceEdge pass (below) — this pass = class relations
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

// [impl:uuid:dc101d02-d345-4ef3-a7a8-8231a1a695db] DiagramViewModel.buildTraceEdge (Method 6a2cbd63, Class 09730090)
// R36.4 — the TRACE-edge pass, EXTENDS buildEdges (8c68b925): emits kind='trace' relations (derived UC→method +
// authored UmlTraceRelationship, both injected as {to,kind:'trace'} on the from-node). Same rect/borderPoint/de-dup
// machinery as buildEdges; dashed dm-edge-trace + dm-arrow-trace; data-rel-* for R33.6.3 reroute + click. buildEdges
// skips 'trace' (this pass owns it) → renders in the same SVG group so RbPanZoom transforms + reroute apply, no fork.
export function buildTraceEdge(views: ViewLink[], nodeOf: (uuid: string) => DiagramNode | null): { svg: string; count: number } {
  const rects = new Map<string, Rect>(); const nodes = new Map<string, DiagramNode>();
  for (const v of views) { const uuid = stripRef(v.unit); const node = nodeOf(uuid); if (!node) continue; rects.set(uuid, { x: v.x, y: v.y, w: facetW(v, node), h: facetH(v, node) }); nodes.set(uuid, node); }
  const seen = new Set<string>(); const edges: string[] = [];
  for (const [from, node] of nodes) {
    const src = rects.get(from)!;
    for (const rel of node.relations || []) {
      if (rel.kind !== 'trace') continue; // ONLY trace edges here (class relations = buildEdges)
      const to = stripRef(rel.to);
      if (to === from || !rects.has(to)) continue; // off-diagram (or self) → no dangling edge
      const key = `${from}->${to}:trace`; if (seen.has(key)) continue; seen.add(key); // de-dup (derived+authored overlap)
      const tgt = rects.get(to)!;
      const sc = { x: src.x + src.w / 2, y: src.y + src.h / 2 }, tc = { x: tgt.x + tgt.w / 2, y: tgt.y + tgt.h / 2 };
      const a = borderPoint(src, tc.x, tc.y), b = borderPoint(tgt, sc.x, sc.y);
      edges.push(`<line class="dm-edge dm-edge-trace" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" `
        + `marker-end="url(#dm-arrow-trace)" data-rel-from="modelelement:${from}" data-rel-to="modelelement:${to}" data-rel-kind="trace"/>`);
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
    const node = nodeOf(stripRef(v.unit));
    if (!node) continue;
    boxes.push(renderFacet(v, node)); // R36.1/R36.2 (B): facet-lens per view.viewKind (built once); class-family default
    maxX = Math.max(maxX, v.x + facetW(v, node) + PAD);
    maxY = Math.max(maxY, v.y + facetH(v, node) + PAD);
  }
  const { svg: edgeSvg, count: edges } = buildEdges(views, nodeOf); // class-relation edges FIRST (behind boxes)
  const { svg: traceSvg, count: traceCount } = buildTraceEdge(views, nodeOf); // R36.4: trace edges (UC→method / authored)
  const vb = `0 0 ${Math.max(maxX, 100)} ${Math.max(maxY, 100)}`;
  return { svg: `<svg class="dm-svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${EDGE_DEFS}${edgeSvg}${traceSvg}${boxes.join('')}</svg>`, count: boxes.length, edges: edges + traceCount };
}
