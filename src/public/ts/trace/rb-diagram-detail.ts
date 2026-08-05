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
import { buildDiagramSvg, borderPoint, stripRef, type ViewLink, type DiagramNode, type DiagramRelation, type EdgeKind, type Rect } from './diagram-view-model.js';

// R33.6.3: box transform parser — module-scoped so both wireBoxDrag and rerouteEdges read a box's live (x,y).
const TR = /translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)/;

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
  rb-diagram-detail .dm-box{cursor:pointer;touch-action:none} /* R33.6.2 INV-D1: a touch-drag on a box moves the box, never scrolls the page */
  rb-diagram-detail .dm-box-bg{fill:#161b22;stroke:#30363d;stroke-width:1}
  rb-diagram-detail .dm-box:hover .dm-box-bg,rb-diagram-detail .dm-box:focus .dm-box-bg{stroke:#58a6ff}
  rb-diagram-detail .dm-box-selected .dm-box-bg{stroke:#58a6ff;stroke-width:2.5} /* R33.5 item2: local box selection highlight */
  rb-diagram-detail .dm-name{fill:#e6edf3;font:600 12px system-ui}
  rb-diagram-detail .dm-row{fill:#c9d1d9;font:11px ui-monospace,monospace}
  rb-diagram-detail .dm-sep{stroke:#30363d;stroke-width:1}
  rb-diagram-detail .dm-edge{stroke:#8b949e;stroke-width:1.5;fill:none;cursor:pointer}
  rb-diagram-detail .dm-edge:hover{stroke:#58a6ff}
  rb-diagram-detail .dm-edge-dependency{stroke-dasharray:5 4}
  rb-diagram-detail .dm-edge-trace{stroke-dasharray:2 3;stroke:#a371f7} /* R36.4 UmlTraceRelationship UC→method: fine-dotted, distinct hue */
  rb-diagram-detail .dm-arrow-open{fill:none;stroke:#8b949e;stroke-width:1.5}
  rb-diagram-detail .dm-arrow-hollow{fill:#0d1117;stroke:#8b949e;stroke-width:1.5}
  rb-diagram-detail .dm-empty{padding:24px;color:rgba(230,237,243,.6);font:13px system-ui;text-align:center}
  rb-diagram-detail .dm-surface{position:relative}
  rb-diagram-detail .dm-trace-btn{position:absolute;top:8px;right:8px;z-index:5;background:#21262d;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;padding:4px 8px;font:12px system-ui;cursor:pointer}
  rb-diagram-detail .dm-trace-btn.dm-trace-armed{background:#a371f7;color:#fff;border-color:#a371f7}
  rb-diagram-detail.dm-tracing .dm-box{cursor:crosshair}
  rb-diagram-detail .dm-toolbar{display:flex;gap:8px;padding:6px 10px;background:#161b22;border-bottom:1px solid #30363d}
  rb-diagram-detail .dm-resync{background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:6px;padding:4px 10px;font:12px system-ui;cursor:pointer}
  rb-diagram-detail .dm-resync:hover{border-color:#58a6ff}
  rb-diagram-detail .dm-resync[disabled]{opacity:.5;cursor:default}
</style>`;

export class RbDiagramDetail extends HTMLElement {
  graph: unknown = null; // set by the drawer (unused — this view fetches its own model via /api/ior)
  static get observedAttributes(): string[] { return ['ref']; }
  private pz: RbPanZoom | null = null;
  private _canvasBase: { w: number; h: number } | null = null; // R33.7.1 canvas-grow: tight content bounds (viewBox maxX/maxY) captured on render
  private _traceMode = false; private _traceFrom: string | null = null; // R36.4 inc-2: draw-to-create trace gesture (arm → click source → click target)
  private ro: ResizeObserver | null = null;
  private _sourceFile: string | null = null; // R32.8: the model's source .ts (for Re-Sync); captured in render()
  private _selectedBox: string | null = null; // R33.5 item2: the locally-selected box ref — diagram STAYS open (no replaceWith)

  connectedCallback(): void { document.addEventListener('rb-model-resync-request', this.onResyncRequest); document.addEventListener('selection-changed', this.onSelectionChanged); document.addEventListener('rb-diagram-refresh', this.onRefresh); void this.render(); this.broadcastActiveDiagram(this.getAttribute('uuid') || stripRef(this.getAttribute('ref') || '') || null); } // R33.9: this diagram is now the ACTIVE membership target
  attributeChangedCallback(): void { if (this.isConnected) void this.render(); }
  disconnectedCallback(): void { document.removeEventListener('rb-model-resync-request', this.onResyncRequest); document.removeEventListener('selection-changed', this.onSelectionChanged); document.removeEventListener('rb-diagram-refresh', this.onRefresh); this.ro?.disconnect(); this.ro = null; this.pz = null; this.broadcastActiveDiagram(null); } // R33.9: no diagram open → membership verbs hide

  // R32.8: the tree-header Re-Sync button (or any model view) drives the SAME method via this document event.
  private onResyncRequest = (): void => { void this.reSyncFromSource(); };
  private onRefresh = (): void => { void this.render(); }; // R33.7.2 UC1: re-render from MODEL_STORE after discover add-views → buildEdges wires the new edges

  // [impl:uuid:5150477e-4091-46c6-bdee-50c9250c7725] RbDiagramDetail.broadcastActiveDiagram (Method c1f… req-repoints) —
  // R33.9: signal the OPEN diagram's uuid to the action-bar host (rb-active-diagram) so MEMBERSHIP verbs (add/remove/
  // discover) target THIS diagram EXPLICITLY (kills the fragile /api/model/tree last-diagram scan). {uuid} on connect,
  // {uuid:null} on disconnect → host shows membership only when a diagram is active (INV-A1/A2/A4, IMG_4802/4803 fix).
  private broadcastActiveDiagram(uuid: string | null): void { document.dispatchEvent(new CustomEvent('rb-active-diagram', { detail: { uuid }, bubbles: true })); }

  // [impl:uuid:20f8a19e-a508-4fcd-8329-04b73bbbcc54] RbDiagramDetail.onSelectionChanged (Method fcd2464e, Class 039ec367, off UC 87d3d693 diagram.tapToAdd) — TAP-to-add complement for
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

  // [impl:uuid:34dec13f-5cb6-4f01-8894-e85954174830] RbDiagramDetail.render (Method 65649d26, off UC 42e6d425
  // diagram.renderCanvas, req 700957e1) — R33.3 resolve-and-render the reachable diagram canvas: fetch the Diagram
  // (drawer uuid, NOT stripRef 'diagram:'), resolve each view-link's element+members, buildDiagramSvg → boxes+edges.
  private async render(): Promise<void> {
    const ref = this.getAttribute('ref') || '';
    // R33.3 fix (caught by the @390 render harness — unit tests never exercised this DOM path): resolve the diagram
    // via the drawer-provided STRIPPED uuid. stripRef strips ior:instance:/modelelement: but NOT 'diagram:' (the
    // r3211m 8806b96c9 class of bug), so stripRef('diagram:<uuid>') stayed prefixed → the fetch mis-resolved →
    // EMPTY canvas (no boxes ever rendered from a drawer 'diagram:' ref). addView was fixed; render() was not.
    const d = await this.fetchModel(this.getAttribute('uuid') || stripRef(ref));
    const views: ViewLink[] = Array.isArray(d?.views) ? (d!.views as ViewLink[]) : [];
    // Resolve each view-link's element + its members (compartments) — bounded to the diagram's views.
    const nodes = new Map<string, DiagramNode>();
    let sourceFile: string | null = null; // R32.8: the model's source .ts (single-file model) for Re-Sync
    // R36.1/R36.2 part-2 (B): the UmlMethod/UmlFunction facet-lens renders a signature line — build it from the
    // canonical model's R36.3 fields (visibility/parameters/returnType); undefined for non-method units.
    const sigOf = (m: Record<string, unknown>): string | undefined => {
      const k = String(m.kind || '');
      if (k !== 'method' && k !== 'function' && m.parameters === undefined && m.returnType === undefined) return undefined;
      const vis = m.visibility ? String(m.visibility) + ' ' : '';
      const params = Array.isArray(m.parameters)
        ? (m.parameters as unknown[]).map((p) => typeof p === 'string' ? p : (p && typeof p === 'object' ? `${(p as Record<string, unknown>).name ?? ''}${(p as Record<string, unknown>).type ? ': ' + (p as Record<string, unknown>).type : ''}` : '')).join(', ')
        : '';
      const ret = m.returnType ? ': ' + String(m.returnType) : '';
      return `${vis}${String(m.name || '')}(${params})${ret}`;
    };
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
      // R36.4 DERIVED trace: a UseCase carries a singular `method` ref (Object.verb → its Method) — the trace ALREADY
      // exists in the chain data, so emit it as a typed {kind:'trace'} relation (NO new unit). buildEdges renders it
      // as a dashed connector IFF the target Method is also on the diagram (both-on-diagram guard). Authored traces
      // (UmlTraceRelationship units) are the separate server-persist path (R36.4 increment-2).
      if (m.method && typeof m.method === 'string') relations.push({ to: stripRef(m.method), kind: 'trace' as EdgeKind });
      nodes.set(uuid, { name: String(m.name || uuid.slice(0, 8)), kind: String(m.kind || 'class'), attrs, methods, relations, signature: sigOf(m) });
    }));
    this._sourceFile = sourceFile;
    // R36.4 inc-2: overlay AUTHORED traces (UmlTraceRelationship units) — inject {to,kind:'trace'} onto the from-node
    // when BOTH endpoints are on-diagram, so buildEdges renders them via the SAME derived-trace path (de-dup handles
    // any derived+authored overlap). Best-effort (viewers without model access get no overlay).
    try {
      const tr = await fetch('/api/model/traces', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      for (const t of (tr?.traces || []) as Array<{ from: string; to: string }>) {
        const f = stripRef(String(t.from)), to = stripRef(String(t.to));
        const fromNode = nodes.get(f);
        if (fromNode && nodes.has(to)) (fromNode.relations = fromNode.relations || []).push({ to, kind: 'trace' as EdgeKind });
      }
    } catch { /* authored-trace overlay best-effort */ }
    const { svg, count } = buildDiagramSvg(views, (u) => nodes.get(u) || null);
    // R33.6.5 BUG-2 (architect bc21ca747): the in-diagram Re-Sync toolbar is RETIRED — Re-Sync now lives ONLY in the
    // drawer action-bar (ACTIONS_BY_TYPE.diagram 're-sync' → rb-model-resync-request → onResyncRequest → reSyncFromSource),
    // so removing the old .dm-resync toolbar (+ its click wire) leaves EXACTLY ONE Re-Sync (AC-single-resync-no-duplicate).
    this.innerHTML = `${STYLE}<div class="dm-surface"><button class="dm-trace-btn${this._traceMode ? ' dm-trace-armed' : ''}" title="Draw a trace: click the source box then the target box">🔗 Trace</button><div class="dm-content">${count ? svg : '<div class="dm-empty">Empty diagram — drop a class to add a view (R32.5).</div>'}</div></div>`;

    const surface = this.querySelector('.dm-surface') as HTMLElement | null;
    const content = this.querySelector('.dm-content') as HTMLElement | null;
    if (surface && content && count) {
      this.pz = new RbPanZoom(surface, content); // R31.6 reuse — pinch/drag pan+zoom
      this.pz.growMode = true; // R33.7.1 canvas-grow: diagram opts in (scale<1 GROWS the SVG canvas, not CSS-shrink)
      const vb = ((this.querySelector('.dm-svg') as SVGSVGElement | null)?.getAttribute('viewBox') || '0 0 100 100').split(/\s+/).map(Number);
      this._canvasBase = { w: vb[2] || 100, h: vb[3] || 100 }; // tight content bounds = canvasBase (INV-Z1: scale 1 = whole)
      this.pz.onCanvasGrow = (scale): void => this.applyCanvasGrow(scale); // grow/restore the SVG canvas per scale
      const z = Number(d?.zoom); if (Number.isFinite(z) && z > 0) this.pz.setScale(z); // R33.7.1 (INV-Z2): restore persisted per-diagram zoom (re-applies regime)
      const dUuid = this.getAttribute('uuid') || stripRef(ref);
      this.pz.onZoomEnd = (scale): void => { void this.persistZoom(dUuid, scale); }; // R33.7.1: persist on user zoom-settle
    }
    // R32.11 (INV-R1): the surface is a DROP TARGET (even when empty — the 'drop a class' label IS the zone). Drag a
    // class card from the model tree → add its view-link at the drop point → persist → re-render. Wired every render.
    if (surface && content) {
      surface.addEventListener('dragover', (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; });
      surface.addEventListener('drop', (e) => { void this.onDropAddView(e, content); });
    }
    // R33.5 item2: box selection is handled by wireBoxDrag's pointer path (LOCAL highlight + tree-reveal — the
    // diagram STAYS, NO selectionModel.replaceWith; class-detail opens only on a TREE click). Edge-click still reveals.
    const traceBtn = this.querySelector('.dm-trace-btn') as HTMLElement | null;
    traceBtn?.addEventListener('click', (e) => { e.stopPropagation(); this._traceMode = !this._traceMode; this._traceFrom = null; traceBtn.classList.toggle('dm-trace-armed', this._traceMode); this.classList.toggle('dm-tracing', this._traceMode); });
    this.addEventListener('click', (e) => {
      // R36.4 inc-2 draw-to-create: in trace-mode, click source box then target box → author the trace → re-render.
      if (this._traceMode) {
        const boxEl = (e.target as HTMLElement).closest('.dm-box');
        const boxRef = boxEl?.getAttribute('data-ref');
        if (boxRef) {
          e.stopPropagation(); const uuid = stripRef(boxRef);
          if (!this._traceFrom) { this._traceFrom = uuid; boxEl?.classList.add('dm-trace-src'); }
          else if (uuid !== this._traceFrom) { const from = this._traceFrom; this._traceMode = false; this._traceFrom = null; void this.createTrace(from, uuid); }
          return;
        }
      }
      const edge = (e.target as HTMLElement).closest('.dm-edge')?.getAttribute('data-rel-to');
      if (edge) { e.stopPropagation(); selectionModel.replaceWith(edge); }
    });
    // R33.3 AC2 (INV-S33V-2): MOVABLE boxes — pointer/touch drag a .dm-box → live-move → persist x,y → survives reload.
    if (surface && content && count) this.wireBoxDrag(surface, content);
    // AC-5: ResizeObserver fits the surface to the drawer box (SVG preserveAspectRatio scales by construction).
    if (surface) { this.ro = new ResizeObserver(() => { /* SVG viewBox fits; hook for future pz re-fit */ }); this.ro.observe(surface); }
  }

  // R36.4 inc-2: POST an AUTHORED trace (from→to) → server mints UmlTraceRelationship in MODEL_STORE (idempotent) →
  // re-render (the /api/model/traces overlay draws it). markerPending: authorTrace Impl 8c68b925 (req mints, trails).
  private async createTrace(from: string, to: string): Promise<void> {
    try {
      const r = await fetch('/api/model/trace/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ from, to, relation: 'traces' }) });
      if (r.ok) this.render(); // authored trace now overlays via the /api/model/traces fetch
    } catch { /* author-trace best-effort */ }
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
    // R32.11-MOBILE fix (tester r3211m 8806b96c9): the drawer's renderDetailForRef sets uuid='<stripped>' AND
    // ref='diagram:<uuid>'; stripRef strips ior:instance:/modelelement: but NOT 'diagram:' → the server add-view
    // uuid-regex 400'd on 'diagram:…' → NO box (killed BOTH tap-to-add AND desktop drop). Use the pre-stripped
    // uuid attribute the drawer already provides; keep stripRef(ref) only as a defensive fallback.
    const diagramUuid = this.getAttribute('uuid') || stripRef(this.getAttribute('ref') || '');
    if (!diagramUuid || !elementUuid) return;
    try {
      const r = await fetch('/api/model/diagram/add-view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagramUuid, elementUuid, x, y }) });
      if (r.ok) await this.render();
    } catch { /* noop — surface stays as-is */ }
  }

  // [impl:uuid:a4f8ad6a-49c9-4c9a-9f15-5ea168f8e5be] RbDiagramDetail.wireBoxDrag (Method 383d2467, off UC f783de5b
  // diagram.moveView, req 700957e1) — R33.3 AC2 / INV-S33V-2: make each .dm-box MOVABLE.
  // R33.5 items 2+3: a pointer press on a .dm-box SELECTS it (local highlight + tree-reveal — diagram STAYS, no
  // selectionModel.replaceWith) AND disables RbPanZoom pan (boxSelect → pz.setEnabled(false)) so the drag MOVES the
  // box, never pans; a press on empty canvas DESELECTS + re-enables pan. A real move persists x,y via move-view →
  // survives reload; a no-move press is a tap-select. Coords convert to content space by the current CSS scale.
  // R33.6.2 (INV-D1/D2): drag no longer scrolls the page (.dm-box touch-action:none) and, when the pointer nears the
  // surface edge, an rAF loop pans the canvas (RbPanZoom.panBy) so a box can be dragged toward off-screen space. The
  // box is placed PAN-INVARIANTLY (origin = pointer-in-content + grab-offset, from the LIVE content rect) so it keeps
  // tracking the pointer while the canvas autoscrolls underneath.
  private wireBoxDrag(surface: HTMLElement, content: HTMLElement): void {
    const scaleNow = (): number => (content.offsetWidth ? content.getBoundingClientRect().width / content.offsetWidth : 1);
    const EDGE = 32, SPEED = 8; // autoscroll margin (px from a surface edge) + pan speed (px/frame)
    let drag: { el: SVGGElement; uuid: string; sx: number; sy: number; gx: number; gy: number; moved: boolean } | null = null;
    let raf = 0, lastX = 0, lastY = 0;
    const moveTo = (clientX: number, clientY: number): void => {
      if (!drag) return;
      const s = scaleNow() || 1; const rect = content.getBoundingClientRect();
      const nx = Math.max(0, Math.round((clientX - rect.left) / s + drag.gx));
      const ny = Math.max(0, Math.round((clientY - rect.top) / s + drag.gy));
      drag.el.setAttribute('transform', `translate(${nx},${ny})`);
      this.rerouteEdges(drag.uuid); // R33.6.3: connectors follow the box LIVE — no stale line left at the old anchor
    };
    const autoscroll = (): void => {
      if (!drag) { raf = 0; return; }
      const r = surface.getBoundingClientRect();
      let vx = 0, vy = 0;
      if (lastX < r.left + EDGE) vx = SPEED; else if (lastX > r.right - EDGE) vx = -SPEED;
      if (lastY < r.top + EDGE) vy = SPEED; else if (lastY > r.bottom - EDGE) vy = -SPEED;
      // R33.7.1 canvas-grow: at scale<1 the canvas is native-scrolled (overflow:auto), so pan via surface.scrollBy
      // (panBy=CSS-translate has no effect there); at >=1 keep RbPanZoom.panBy UNCHANGED. (drop/moveTo coord map is
      // universal — content rect reflects scroll + scaleNow=1 in grow mode — so no <1 branch needed there.)
      if (vx || vy) { if (this.pz && this.pz.currentScale < 1) surface.scrollBy(-vx, -vy); else this.pz?.panBy(vx, vy); moveTo(lastX, lastY); drag.moved = true; raf = requestAnimationFrame(autoscroll); }
      else { raf = 0; } // pointer left the margin → stop autoscrolling (restarts on the next near-edge pointermove)
    };
    surface.addEventListener('pointerdown', (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest('.dm-box') as SVGGElement | null;
      if (!el) { this.boxSelect(null); return; } // empty canvas → deselect + pan re-enabled (RbPanZoom handles the drag)
      const uuid = stripRef(el.getAttribute('data-ref') || '');
      if (!uuid) return;
      this.boxSelect(el); // item2 local-select (diagram stays) + item3 pan OFF → drag moves, never pans
      const m = TR.exec(el.getAttribute('transform') || '');
      const ox = m ? parseFloat(m[1]) : 0, oy = m ? parseFloat(m[2]) : 0;
      const s = scaleNow() || 1; const rect = content.getBoundingClientRect();
      drag = { el, uuid, sx: e.clientX, sy: e.clientY, gx: ox - (e.clientX - rect.left) / s, gy: oy - (e.clientY - rect.top) / s, moved: false };
      lastX = e.clientX; lastY = e.clientY;
      try { el.setPointerCapture(e.pointerId); } catch { /* */ }
      e.stopPropagation();
    });
    surface.addEventListener('pointermove', (e: PointerEvent) => {
      if (!drag) return;
      lastX = e.clientX; lastY = e.clientY;
      if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 3) drag.moved = true;
      moveTo(e.clientX, e.clientY); // live feedback
      if (!raf) raf = requestAnimationFrame(autoscroll); // kick the edge-autoscroll loop (self-stops away from edges)
    });
    const end = (): void => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (!drag) return;
      const d = drag; drag = null;
      if (!d.moved) return; // a tap (no move) → box stays SELECTED, no persist
      const m = TR.exec(d.el.getAttribute('transform') || '');
      void this.persistMove(d.uuid, m ? Math.round(parseFloat(m[1])) : 0, m ? Math.round(parseFloat(m[2])) : 0);
    };
    surface.addEventListener('pointerup', end);
    surface.addEventListener('pointercancel', end);
  }

  // [impl:uuid:bde57b1a-3cc5-4c79-8656-18d29a01c979] RbDiagramDetail.boxSelect (Method 65423a29) — R33.5 item2:
  // LOCAL box selection — highlight (.dm-box-selected), reveal in the tree (best-effort 'rb-tree-reveal' event; the
  // diagram is NOT replaced — replaceWith REMOVED), and disable pan while selected (item3). null → clear + re-enable pan.
  private boxSelect(el: SVGGElement | null): void {
    this.querySelectorAll('.dm-box-selected').forEach((b) => b.classList.remove('dm-box-selected'));
    this._selectedBox = el?.getAttribute('data-ref') || null;
    if (el && this._selectedBox) {
      el.classList.add('dm-box-selected');
      document.dispatchEvent(new CustomEvent('rb-tree-reveal', { detail: { ref: this._selectedBox }, bubbles: true })); // R33.7.4 reveal (R-D1)
      // R34.4 (R-C) + R34.6 (R-D2): selecting an element FROM the OPEN diagram → re-assert the active-diagram context +
      // fire detail-shown{modelelement} so the host's actionsForContext (a1a5be99) emits the element's UNIT + MEMBERSHIP
      // verbs (incl the existing remove-from-diagram). Rides R33.9 — NO new verb/Method; the diagram STAYS (no drawer swap).
      const dUuid = this.getAttribute('uuid') || stripRef(this.getAttribute('ref') || '');
      if (dUuid) document.dispatchEvent(new CustomEvent('rb-active-diagram', { detail: { uuid: dUuid }, bubbles: true }));
      document.dispatchEvent(new CustomEvent('rb-drawer-detail-shown', { detail: { type: 'modelelement', ref: this._selectedBox }, bubbles: true }));
    }
    this.pz?.setEnabled(!el); // item3: pan ONLY when nothing selected
  }

  private async persistMove(elementUuid: string, x: number, y: number): Promise<void> {
    const diagramUuid = this.getAttribute('uuid') || stripRef(this.getAttribute('ref') || '');
    if (!diagramUuid || !elementUuid) return;
    try { await fetch('/api/model/diagram/move-view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagramUuid, elementUuid, x, y }) }); }
    catch { /* box stays at its dropped position; MODEL_STORE is authoritative on next render */ }
  }

  // R33.7.1 (INV-Z2): persist the per-diagram zoom (store-only /api/model/diagram/zoom → MODEL_STORE; prod untouched).
  private async persistZoom(diagramUuid: string, zoom: number): Promise<void> {
    if (!diagramUuid) return;
    try { await fetch('/api/model/diagram/zoom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagramUuid, zoom }) }); }
    catch { /* zoom stays client-side; MODEL_STORE authoritative on next render */ }
  }

  // [impl:uuid:eb468578-716d-46de-9b66-0f71d85d8066] RbDiagramDetail.applyCanvasGrow (Method e9792c2b, UC 56fe4cdb
  // diagram.canvasGrowOnZoomOut, req 754a1f9d) — R33.7.1 canvas-GROW (distinct chain from setScale 301b71d4 = scale/persist).
  // R33.7.1 canvas-grow (INV-Z1', architect pin 7338c6954/93244b3f6): RbPanZoom.onCanvasGrow at scale<1 → GROW the SVG
  // canvas so boxes keep VISUAL size and placeable room appears. width/height = base/scale px + viewBox '0 0 base.w/scale
  // base.h/scale' (grows 1:1 → 1 unit = 1px), content sized to match so the surface (overflow:auto) NATIVE-scrolls the
  // grown canvas. scale>=1 → restore base (100% / tight viewBox / overflow:hidden) so the CSS-magnify path is UNTOUCHED.
  private applyCanvasGrow(scale: number): void {
    const svg = this.querySelector('.dm-svg') as SVGSVGElement | null;
    const surface = this.querySelector('.dm-surface') as HTMLElement | null;
    const content = this.querySelector('.dm-content') as HTMLElement | null;
    const b = this._canvasBase;
    if (!svg || !surface || !content || !b) return;
    if (scale < 1) {
      const MAX_CANVAS_PX = 16000; // R33.7.1 BUG-1 (bc21ca747): safety cap — endless zoom-out can't exceed browser canvas limits
      const w = Math.min(MAX_CANVAS_PX, Math.round(b.w / scale)), h = Math.min(MAX_CANVAS_PX, Math.round(b.h / scale));
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.style.width = `${w}px`; svg.style.height = `${h}px`;
      content.style.width = `${w}px`; content.style.height = `${h}px`; // hold the grown SVG → surface scrollWidth/Height grows
      surface.style.overflow = 'auto';
    } else {
      svg.setAttribute('viewBox', `0 0 ${b.w} ${b.h}`);
      svg.style.width = ''; svg.style.height = '';
      content.style.width = ''; content.style.height = ''; // back to the CSS 100% (magnify path untouched)
      surface.style.overflow = 'hidden';
    }
  }

  // [impl:uuid:83b9922b-5fb8-4c1d-ad57-bedbae1c2262] RbDiagramDetail.rerouteEdges (Method 123e0c21) — R33.6.3:
  // after a box moves, recompute the border-to-border endpoints of every connector touching `uuid` from the boxes'
  // CURRENT transforms + sizes, reusing the EXPORTED borderPoint so the live geometry matches buildEdges exactly
  // (INV-R1 no drift, INV-R2 no fork). Called from the drag moveTo → connectors follow the node, no stale line left.
  private rerouteEdges(uuid: string): void {
    const svg = this.querySelector('.dm-svg'); if (!svg) return;
    const rectOf = (u: string): Rect | null => {
      const g = svg.querySelector(`.dm-box[data-ref="modelelement:${u}"]`) as SVGGElement | null; if (!g) return null;
      const m = TR.exec(g.getAttribute('transform') || ''); const bg = g.querySelector('rect');
      return { x: m ? parseFloat(m[1]) : 0, y: m ? parseFloat(m[2]) : 0, w: bg ? parseFloat(bg.getAttribute('width') || '0') : 0, h: bg ? parseFloat(bg.getAttribute('height') || '0') : 0 };
    };
    svg.querySelectorAll(`.dm-edge[data-rel-from="modelelement:${uuid}"], .dm-edge[data-rel-to="modelelement:${uuid}"]`).forEach((line) => {
      const src = rectOf(stripRef(line.getAttribute('data-rel-from') || '')), tgt = rectOf(stripRef(line.getAttribute('data-rel-to') || ''));
      if (!src || !tgt) return;
      const a = borderPoint(src, tgt.x + tgt.w / 2, tgt.y + tgt.h / 2), b = borderPoint(tgt, src.x + src.w / 2, src.y + src.h / 2);
      line.setAttribute('x1', a.x.toFixed(1)); line.setAttribute('y1', a.y.toFixed(1));
      line.setAttribute('x2', b.x.toFixed(1)); line.setAttribute('y2', b.y.toFixed(1));
    });
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-diagram-detail')) customElements.define('rb-diagram-detail', RbDiagramDetail);
