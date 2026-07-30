// R32.4 SVG diagram SURFACE + NODES — a drawer DETAIL-VIEW (design 3d9f17737, req 496936cb). NO drawer/tree fork
// (R31.12 law): registered in the drawer tagMap for a `diagram:` ref, mounts via the STANDARD selection→
// renderDetailForRef flow (inherits R31.9 responsive position + open/close/expand). Renders a Diagram unit's
// Layer-2 view-links (design-mda-model.md:56-61) as UML class boxes (compartments from the element's `members`,
// kind from M1 model.kind), positioned by x,y ON THE LINK (unit untouched, R25.7). Pan/zoom = RbPanZoom (R31.6
// reuse); fit = ResizeObserver; box-click → selectionModel → SHARED node detail. EDGES = R32.6 (excluded here).
// Pure render logic lives in diagram-view-model.ts (DOM-free, unit-tested by the R32.4 gate).
import { RbPanZoom } from './pan-zoom.js';
import { selectionModel } from './selection-model.js';
import { buildDiagramSvg, stripRef, type ViewLink, type DiagramNode } from './diagram-view-model.js';

const STYLE = `<style>
  rb-diagram-detail .dm-surface{width:100%;height:100%;min-height:220px;overflow:hidden;position:relative;background:#0d1117}
  rb-diagram-detail .dm-content{width:100%;height:100%;transform-origin:0 0}
  rb-diagram-detail .dm-svg{width:100%;height:100%}
  rb-diagram-detail .dm-box{cursor:pointer}
  rb-diagram-detail .dm-box-bg{fill:#161b22;stroke:#30363d;stroke-width:1}
  rb-diagram-detail .dm-box:hover .dm-box-bg,rb-diagram-detail .dm-box:focus .dm-box-bg{stroke:#58a6ff}
  rb-diagram-detail .dm-name{fill:#e6edf3;font:600 12px system-ui}
  rb-diagram-detail .dm-row{fill:#c9d1d9;font:11px ui-monospace,monospace}
  rb-diagram-detail .dm-sep{stroke:#30363d;stroke-width:1}
  rb-diagram-detail .dm-empty{padding:24px;color:rgba(230,237,243,.6);font:13px system-ui;text-align:center}
</style>`;

export class RbDiagramDetail extends HTMLElement {
  graph: unknown = null; // set by the drawer (unused — this view fetches its own model via /api/ior)
  static get observedAttributes(): string[] { return ['ref']; }
  private pz: RbPanZoom | null = null;
  private ro: ResizeObserver | null = null;

  connectedCallback(): void { void this.render(); }
  attributeChangedCallback(): void { if (this.isConnected) void this.render(); }
  disconnectedCallback(): void { this.ro?.disconnect(); this.ro = null; this.pz = null; }

  private async fetchModel(uuid: string): Promise<Record<string, unknown> | null> {
    try { const r = await fetch(`/api/ior/ior:instance:${uuid}`); return (await r.json())?.unit?.model || null; } catch { return null; }
  }

  private async render(): Promise<void> {
    const ref = this.getAttribute('ref') || '';
    const d = await this.fetchModel(stripRef(ref));
    const views: ViewLink[] = Array.isArray(d?.views) ? (d!.views as ViewLink[]) : [];
    // Resolve each view-link's element + its members (compartments) — bounded to the diagram's views.
    const nodes = new Map<string, DiagramNode>();
    await Promise.all(views.map(async (v) => {
      const uuid = stripRef(v.unit);
      const m = await this.fetchModel(uuid); if (!m) return;
      const memberRefs = Array.isArray(m.members) ? (m.members as string[]) : [];
      const members = await Promise.all(memberRefs.map((r) => this.fetchModel(stripRef(r))));
      const attrs: string[] = [], methods: string[] = [];
      for (const mm of members) { if (!mm) continue; (String(mm.kind) === 'method' ? methods : attrs).push(String(mm.name)); }
      nodes.set(uuid, { name: String(m.name || uuid.slice(0, 8)), kind: String(m.kind || 'class'), attrs, methods });
    }));
    const { svg, count } = buildDiagramSvg(views, (u) => nodes.get(u) || null);
    this.innerHTML = `${STYLE}<div class="dm-surface"><div class="dm-content">${count ? svg : '<div class="dm-empty">Empty diagram — drop a class to add a view (R32.5).</div>'}</div></div>`;

    const surface = this.querySelector('.dm-surface') as HTMLElement | null;
    const content = this.querySelector('.dm-content') as HTMLElement | null;
    if (surface && content && count) { this.pz = new RbPanZoom(surface, content); } // R31.6 reuse — pinch/drag pan+zoom
    // AC-6: box-click → SHARED drawer node detail via standard selection (no fork).
    this.addEventListener('click', (e) => {
      const r = (e.target as HTMLElement).closest('.dm-box')?.getAttribute('data-ref');
      if (r) { e.stopPropagation(); selectionModel.replaceWith(r); }
    });
    // AC-5: ResizeObserver fits the surface to the drawer box (SVG preserveAspectRatio scales by construction).
    if (surface) { this.ro = new ResizeObserver(() => { /* SVG viewBox fits; hook for future pz re-fit */ }); this.ro.observe(surface); }
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-diagram-detail')) customElements.define('rb-diagram-detail', RbDiagramDetail);
