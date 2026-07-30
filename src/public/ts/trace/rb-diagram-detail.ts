// R32.4 SVG diagram SURFACE + NODES — a drawer DETAIL-VIEW (design 3d9f17737, req 496936cb). NO drawer/tree fork
// (R31.12 law): registered in the drawer tagMap for a `diagram:` ref, mounts via the STANDARD selection→
// renderDetailForRef flow (inherits R31.9 responsive position + open/close/expand). Renders a Diagram unit's
// Layer-2 view-links (design-mda-model.md:56-61) as UML class boxes (compartments from the element's `members`,
// kind from M1 model.kind), positioned by x,y ON THE LINK (unit untouched, R25.7). Pan/zoom = RbPanZoom (R31.6
// reuse); fit = ResizeObserver; box-click → selectionModel → SHARED node detail. EDGES = R32.6 (excluded here).
// Pure render logic lives in diagram-view-model.ts (DOM-free, unit-tested by the R32.4 gate).
import { RbPanZoom } from './pan-zoom.js';
import { selectionModel } from './selection-model.js';
import { dropDispatcher } from '../drop-dispatcher.js';
import { buildDiagramSvg, stripRef, type ViewLink, type DiagramNode, type DiagramRelation, type EdgeKind } from './diagram-view-model.js';

// M2 relationship metaclass uuid → edge kind (seed constants; the pure module stays uuid-free, kind-driven).
const REL_KIND: Record<string, EdgeKind> = {
  'a1d2e3f4-0000-4a1b-8c2d-000000000010': 'association',
  'a1d2e3f4-0000-4a1b-8c2d-000000000011': 'generalization',
  'a1d2e3f4-0000-4a1b-8c2d-000000000012': 'dependency',
};
const kindOf = (typeRef: string): EdgeKind => REL_KIND[stripRef(typeRef)] || 'association';

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
  rb-diagram-detail .dm-edge{stroke:#8b949e;stroke-width:1.5;fill:none;cursor:pointer}
  rb-diagram-detail .dm-edge:hover{stroke:#58a6ff}
  rb-diagram-detail .dm-edge-dependency{stroke-dasharray:5 4}
  rb-diagram-detail .dm-arrow-open{fill:none;stroke:#8b949e;stroke-width:1.5}
  rb-diagram-detail .dm-arrow-hollow{fill:#0d1117;stroke:#8b949e;stroke-width:1.5}
  rb-diagram-detail .dm-empty{padding:24px;color:rgba(230,237,243,.6);font:13px system-ui;text-align:center}
  rb-diagram-detail .dm-toolbar{display:flex;gap:8px;padding:6px 10px;background:#161b22;border-bottom:1px solid #30363d}
  rb-diagram-detail .dm-resync{background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:6px;padding:4px 10px;font:12px system-ui;cursor:pointer}
  rb-diagram-detail .dm-resync:hover{border-color:#58a6ff}
  rb-diagram-detail .dm-resync[disabled]{opacity:.5;cursor:default}
</style>`;

export class RbDiagramDetail extends HTMLElement {
  graph: unknown = null; // set by the drawer (unused — this view fetches its own model via /api/ior)
  static get observedAttributes(): string[] { return ['ref']; }
  private pz: RbPanZoom | null = null;
  private ro: ResizeObserver | null = null;
  private _sourceFile: string | null = null; // R32.8: the model's source .ts (for Re-Sync); captured in render()

  connectedCallback(): void { document.addEventListener('rb-model-resync-request', this.onResyncRequest); document.addEventListener('selection-changed', this.onSelectionChanged); void this.render(); }
  attributeChangedCallback(): void { if (this.isConnected) void this.render(); }
  disconnectedCallback(): void { document.removeEventListener('rb-model-resync-request', this.onResyncRequest); document.removeEventListener('selection-changed', this.onSelectionChanged); this.ro?.disconnect(); this.ro = null; this.pz = null; }

  // R32.8: the tree-header Re-Sync button (or any model view) drives the SAME method via this document event.
  private onResyncRequest = (): void => { void this.reSyncFromSource(); };

  // [R32.11-MOBILE marker-pending — req IMPL-mints] RbDiagramDetail.onSelectionChanged — TAP-to-add complement for
  // touch/iOS Safari, where HTML5 DnD (dragover/drop) never fires → the drag-add path is DEAD on mobile (Tron @390).
  // A SINGLE selected model-element (class chip, ref 'modelelement:<uuid>') → auto-add its view to THIS OPEN diagram
  // with NO coords (server auto-grid), reusing addView (idempotent — server dedups, INV-R1..R4). Desktop DnD stays
  // intact + additive (this is a complement, not a replacement).
  private onSelectionChanged = (e: Event): void => {
    if (!this.getAttribute('ref')) return;                                    // only when THIS diagram is open
    const sel = (e as CustomEvent<{ selected?: string[] }>).detail?.selected || [];
    if (sel.length !== 1) return;                                             // a single, unambiguous tap only
    const ref = sel[0];
    if (!ref.startsWith('modelelement:')) return;                             // only a model-element (class) adds a view
    void this.addView(stripRef(ref));                                         // no coords → server auto-grid
  };

  // [impl:uuid:fb22c5cd-8806-4738-bf80-f0e87e052984] RbDiagramDetail.reSyncFromSource (Method 3fd80641, Class 039ec367, off UC 75639bd8 model.sync)
  // R32.8 action-sync. Re-runs generation on the model's own
  // sourceFile via the EXISTING /api/model/generate (TsToModel.generate → same-uuid rebind + reconcile +
  // idempotent, INV-S1/S2/S3), then re-renders diagram+edges AND broadcasts 'rb-model-resynced' so the tree
  // (R32.3) + PUML (R32.7) re-render from the one MODEL_STORE (INV-S4). NO server code (reuses the endpoint).
  async reSyncFromSource(): Promise<void> {
    if (!this._sourceFile) return;
    const btn = this.querySelector('.dm-resync') as HTMLButtonElement | null;
    if (btn) { btn.disabled = true; btn.textContent = '⟳ Syncing…'; }
    const r = await dropDispatcher.dispatchModelGenerate(this._sourceFile);
    if (r?.ok) {
      await this.render(); // re-render diagram + edges from the refreshed MODEL_STORE
      document.dispatchEvent(new CustomEvent('rb-model-resynced', { detail: { sourceFile: this._sourceFile, diagramUuid: r.diagramUuid }, bubbles: true }));
    } else if (btn) { btn.disabled = false; btn.textContent = '⟳ Re-Sync'; }
  }

  private async fetchModel(uuid: string): Promise<Record<string, unknown> | null> {
    try { const r = await fetch(`/api/ior/ior:instance:${uuid}`); return (await r.json())?.unit?.model || null; } catch { return null; }
  }

  private async render(): Promise<void> {
    const ref = this.getAttribute('ref') || '';
    const d = await this.fetchModel(stripRef(ref));
    const views: ViewLink[] = Array.isArray(d?.views) ? (d!.views as ViewLink[]) : [];
    // Resolve each view-link's element + its members (compartments) — bounded to the diagram's views.
    const nodes = new Map<string, DiagramNode>();
    let sourceFile: string | null = null; // R32.8: the model's source .ts (single-file model) for Re-Sync
    await Promise.all(views.map(async (v) => {
      const uuid = stripRef(v.unit);
      const m = await this.fetchModel(uuid); if (!m) return;
      if (m.sourceFile && !sourceFile) sourceFile = String(m.sourceFile);
      const memberRefs = Array.isArray(m.members) ? (m.members as string[]) : [];
      const members = await Promise.all(memberRefs.map((r) => this.fetchModel(stripRef(r))));
      const attrs: string[] = [], methods: string[] = [], relations: DiagramRelation[] = [];
      // R32.6: aggregate relations for edges — CLASS-level (heritage→Generalization) + MEMBER-level (typed
      // attr/getter/setter→Association) so a class box's edges include its members' typed relationships.
      const collect = (rec: Record<string, unknown> | null): void => {
        if (rec && Array.isArray(rec.relations)) for (const rel of rec.relations as { to: string; type: string }[]) relations.push({ to: stripRef(String(rel.to)), kind: kindOf(String(rel.type)) });
      };
      collect(m);
      for (const mm of members) { if (!mm) continue; (String(mm.kind) === 'method' ? methods : attrs).push(String(mm.name)); collect(mm); }
      nodes.set(uuid, { name: String(m.name || uuid.slice(0, 8)), kind: String(m.kind || 'class'), attrs, methods, relations });
    }));
    this._sourceFile = sourceFile;
    const { svg, count } = buildDiagramSvg(views, (u) => nodes.get(u) || null);
    // R32.8 AC1: Re-Sync action on the diagram (model units only — shown when there's a source .ts to re-sync).
    const toolbar = (count && sourceFile) ? `<div class="dm-toolbar"><button class="dm-resync" title="Re-Sync model from source TS">⟳ Re-Sync</button></div>` : '';
    this.innerHTML = `${STYLE}${toolbar}<div class="dm-surface"><div class="dm-content">${count ? svg : '<div class="dm-empty">Empty diagram — drop a class to add a view (R32.5).</div>'}</div></div>`;
    this.querySelector('.dm-resync')?.addEventListener('click', () => { void this.reSyncFromSource(); });

    const surface = this.querySelector('.dm-surface') as HTMLElement | null;
    const content = this.querySelector('.dm-content') as HTMLElement | null;
    if (surface && content && count) { this.pz = new RbPanZoom(surface, content); } // R31.6 reuse — pinch/drag pan+zoom
    // R32.11 (INV-R1): the surface is a DROP TARGET (even when empty — the 'drop a class' label IS the zone). Drag a
    // class card from the model tree → add its view-link at the drop point → persist → re-render. Wired every render.
    if (surface && content) {
      surface.addEventListener('dragover', (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; });
      surface.addEventListener('drop', (e) => { void this.onDropAddView(e, content); });
    }
    // AC-6: box-click → SHARED drawer node detail via standard selection (no fork).
    this.addEventListener('click', (e) => {
      const box = (e.target as HTMLElement).closest('.dm-box')?.getAttribute('data-ref');
      if (box) { e.stopPropagation(); selectionModel.replaceWith(box); return; }
      // R32.6 edge-click → SHARED relationship detail (the target element ref; standard selection flow, no fork).
      const edge = (e.target as HTMLElement).closest('.dm-edge')?.getAttribute('data-rel-to');
      if (edge) { e.stopPropagation(); selectionModel.replaceWith(edge); }
    });
    // AC-5: ResizeObserver fits the surface to the drawer box (SVG preserveAspectRatio scales by construction).
    if (surface) { this.ro = new ResizeObserver(() => { /* SVG viewBox fits; hook for future pz re-fit */ }); this.ro.observe(surface); }
  }

  // R32.11 (INV-R1) marker-pending — a class card dropped on .dm-surface: read the dragged ref (application/rb-object-ref,
  // set by rb-object-item.onDragStart), map the cursor into .dm-content coords (RbPanZoom-aware = post-transform rect ÷
  // layout width), then persist+re-render via addView. The drop was previously only LABELED (:104), never wired.
  private async onDropAddView(e: DragEvent, content: HTMLElement): Promise<void> {
    e.preventDefault();
    const raw = e.dataTransfer?.getData('application/rb-object-ref') || e.dataTransfer?.getData('text/plain') || '';
    const elementUuid = stripRef((raw.split(',')[0] || '').split('\n')[0].trim());
    if (!elementUuid) return;
    const rect = content.getBoundingClientRect();
    const scale = content.offsetWidth ? rect.width / content.offsetWidth : 1; // RbPanZoom-aware without reaching into pz internals
    const x = Math.max(0, Math.round((e.clientX - rect.left) / scale));
    const y = Math.max(0, Math.round((e.clientY - rect.top) / scale));
    await this.addView(elementUuid, x, y);
  }

  // R32.11 (INV-R1/R2/R3/R4) — append a view-link for `elementUuid` to THIS Diagram via POST /api/model/diagram/add-view
  // (MODEL_STORE only, server dedups → idempotent), then re-render. Shared by the drop (with coords) and the
  // select-class auto-show complement (no coords → server auto-grid). x,y omitted ⇒ server places it.
  // [impl:uuid:4e74dfee-e9ea-4284-80c7-f196b91e93a9] RbDiagramDetail.addView (Method 70be1605, Class 039ec367, off UC cdd29583 diagram.addView) — R32.11 INV-R1..R4
  private async addView(elementUuid: string, x?: number, y?: number): Promise<void> {
    const diagramUuid = stripRef(this.getAttribute('ref') || '');
    if (!diagramUuid || !elementUuid) return;
    try {
      const r = await fetch('/api/model/diagram/add-view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagramUuid, elementUuid, x, y }) });
      if (r.ok) await this.render();
    } catch { /* noop — surface stays as-is */ }
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-diagram-detail')) customElements.define('rb-diagram-detail', RbDiagramDetail);
