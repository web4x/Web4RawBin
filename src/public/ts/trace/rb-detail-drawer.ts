/**
// [impl:uuid:97f2cf22-a595-455c-88a8-f38d37a893f7] RbDetailDrawer.setBackground
// [impl:uuid:6cea8532-de05-4a44-b16f-457720090427] RbDetailDrawer.sourceLink
// [impl:uuid:16a9d665-6772-43b8-bc55-4e0632ad8d7d] RbDetailDrawer.browseSource
// [impl:uuid:f18b2894-2ade-4af5-8069-1b242defecc7] RbDetailDrawer.browseFile
// [impl:uuid:b58645af-6717-498f-a540-318d53ffae09] RbDetailDrawer.browseFileLine
// [impl:uuid:50708a40-b1d4-431f-987f-0b003e94caf5] RbDetailDrawer.parentNav
// [impl:uuid:5c7a4443-190a-4b6a-84d6-9594b8efbe04] RbDetailDrawer.narrowChain
// [impl:uuid:f94da2cd-e818-4f8b-be4c-b0fc30a0d689] RbDetailDrawer.filePreview
// [impl:uuid:301da3f0-2a47-450a-aa19-408a8a4bad0f] RbDetailDrawer.byTypeRender
 * T110 — rb-detail-drawer: Google-Maps-style bottom drawer for DetailViews.
 *
 * Two-part layout: .drawer-header (sticky, handle + X close) + .drawer-body
 * (scrollable, receives detail content). Swipe-down or ESC to dismiss.
 *
// [impl:uuid:6d75cd49-72a3-42e5-aaa7-2b40b572a83b] R16.1 DetailViewContainer (split for RbDetailDrawer.open)
 * [impl:uuid:19654b84-90e4-4a89-a9a8-10221f883d25] R16.1 DetailViewContainer
 * [impl:uuid:ff684e10-e57c-45ae-97b9-8f866264c737] R19.52 fullWidth (CSS in app.css:264)
 */

import { selectionModel } from './selection-model.js';
import { ChatPanel } from './ChatPanel.js';
import { TraceGraph, makeObject, type ObjectType } from '../../../ts/shared/TraceModel.js';
import './rb-file-detail.js';
import './rb-webitem-detail.js';
// R30.21: the drawer instantiates these type-specific detail elements via createElement in renderDetailForRef —
// it must register them itself so they render on ANY host page (scenario-view, /app), not only where the page
// happened to import them. Undefined element = empty render (Tron's "select task/class → no content").
import './rb-requirement-detail.js';
import './rb-task-detail.js';
import './rb-usecase-detail.js';
import './rb-class-detail.js';
import './rb-method-detail.js';
import './rb-implementation-detail.js';
import './rb-test-detail.js';
import './rb-detail-view.js';
import './rb-diagram-detail.js'; // R32.4: MDA SVG diagram surface as a drawer detail-view (additive; no fork)

export class RbDetailDrawer extends HTMLElement {
  static get observedAttributes() { return ['ref', 'open', 'data-position']; }
  private startY = 0;
  private startHeight = 0;
  private dragging: 'resize' | 'dismiss' | false = false;
  private _restoreHeight = '';      // BUG3: height to restore when expanding from minimized
  private mouseResizing = false;    // BUG2: desktop grab-bar resize in progress
  private mouseMoved = false;
  private startBottom = 0;          // v0.6.95: drawer's actual bottom edge at drag-start (position-aware resize)
  private chatPanel: ChatPanel | null = null;
  private _mode: 'chat' | 'detail' | 'preview' = 'chat';

  // [impl:uuid:94f6e1f8-84a8-4ca5-9a44-6108ef6201bc] R20.6 selectionDriven drawer
  connectedCallback(): void {
    this.render();
    this.observePosition(); // R31.9: drive data-position (inline compartment ≥1025 / bottom drawer ≤1024) by container width — ONE instance, CSS-responsive
    const handle = this.querySelector('.drawer-handle');
    if (handle) {
      handle.addEventListener('touchstart', this.onTouchStart, { passive: true });
      handle.addEventListener('touchmove', this.onTouchMove, { passive: false });
      handle.addEventListener('touchend', this.onTouchEnd);
      handle.addEventListener('mousedown', this.onMouseDown); // BUG2: desktop resize
    }
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('selection-changed', this.onSelectionChanged);
  }

  disconnectedCallback(): void {
    const handle = this.querySelector('.drawer-handle');
    if (handle) {
      handle.removeEventListener('touchstart', this.onTouchStart);
      handle.removeEventListener('touchmove', this.onTouchMove);
      handle.removeEventListener('touchend', this.onTouchEnd);
      handle.removeEventListener('mousedown', this.onMouseDown);
    }
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('selection-changed', this.onSelectionChanged);
    this._posRo?.disconnect(); this._posRo = null; // R31.9: stop the container-query position driver
  }

  // [impl:uuid:e927ecfe-619c-49f2-9ee4-dc82340f6433] R30.22 RbDetailDrawer.onSelectionChanged — selection-driven open (content-visible)
  private onSelectionChanged = (e: Event): void => {
    const selected = (e as CustomEvent).detail?.selected || [];
    if (selected.length === 1) {
      // R27.8(d) HARD INVARIANT (Tron): EACH select opens the drawer to peek + re-renders, from ANY prior state
      // (closed/removed/minimized/expanded), even re-selecting the SAME node. Clear currentRef so a same-ref re-render
      // isn't skipped; render directly when the ref attr is unchanged (attributeChangedCallback won't fire for it).
      const ref = selected[0];
      const dp = this.detailPanel; if (dp) dp.dataset.currentRef = '';
      const sameRef = this.getAttribute('ref') === ref;
      const wasOpen = this.hasAttribute('open');                // capture BEFORE mutating
      this.setAttribute('open', '');
      if (!wasOpen) this.openExpanded();                        // R30.22: content-select opens EXPANDED (visible), not peek — supersedes R27.8(B) closed→peek for content. ALREADY OPEN → PRESERVE state.
      this.setAttribute('ref', ref);
      if (sameRef) this.renderDetailForRef(ref);
    } else if (selected.length === 0) {
      // [impl:uuid:c3c70517-b56c-4765-94ae-cb677601f99c] R20.6 emptyShowsChat
      this.removeAttribute('ref');
      const dp = this.detailPanel;
      if (dp) dp.dataset.currentRef = '';
      this.tearDownTransientDetail(); // R31.4 INV-T1: deselect (empty selection) kills the terminal ws + sm_ session
      if (this.chatPanel) this.setMode('chat');
    }
  };

  // R30.22: open the drawer EXPANDED with the body visible (content-height), NOT the R27.8 peek — so a
  // detail-select shows its content immediately (no grab-bar click). X→minimize-peek, grab-bar→toggle,
  // ESC→close all remain unchanged; only the closed→open transition for a content-select changes.
  private openExpanded(): void {
    this.removeAttribute('minimized');
    const body = this.querySelector('.drawer-body') as HTMLElement | null;
    if (body) body.style.display = 'flex';
  }

  attributeChangedCallback(name: string): void {
    if (name === 'ref') {
      const ref = this.getAttribute('ref');
      if (ref) {
        const wasOpen = this.hasAttribute('open');            // capture BEFORE opening
        this.setAttribute('open', '');
        if (!wasOpen) this.openExpanded();                    // R30.22: content-ref opens EXPANDED (visible), not peek; already-open → PRESERVE state
        this.renderDetailForRef(ref);
      } else {
        this.removeAttribute('open');
      }
    } else if (name === 'data-position') { // R31.5.7: reactive position flip (inline↔bottom)
      this.applyPosition((this.getAttribute('data-position') as 'inline' | 'bottom') || 'bottom');
    }
  }

  // [impl:uuid:6e2d4b81-9a3c-4f57-b8e0-1d7c3a5f9e26] RbDetailDrawer.applyPosition (Method d48cc0ce, off UC 0f08964b, Class d86af73d)
  // R31.5.7 (drawer = Details compartment, THE CRUX): thin PRESENTATION-APPLICATION method, LAYOUT-ONLY. Sets the
  // data-position attr → app.css branches (inline = position:static in-flow [D] strip segment / bottom = position:fixed
  // as today); re-fit rides the EXISTING ResizeObserver / attributeChangedCallback. Touches NOTHING in the detail-render
  // flow / scroll / grab-bar / expand-minimize / in-room R30.20 X→chat — ONE component, position=mode (NO 2nd
  // full-width-drawer fork = the regression Tron flagged). Default (no attr) = today's bottom. Driven by the SAME
  // container-query as 5.4 (landscape→inline / portrait→bottom). AC-INV-PRESENTATION: same instance, both positions,
  // same functional tests — only computed layout differs.
  applyPosition(pos: 'inline' | 'bottom'): void {
    if (this.getAttribute('data-position') !== pos) this.setAttribute('data-position', pos);
    // R31.9: entering desktop (inline Details-compartment) CLEAR the stale bottom-drawer drag height (onTouchMove :384 /
    // stickyBottom set this.style.height) so it can't fight the flex:1 compartment = the resize-break Tron reported.
    // Bottom keeps its drag height (height is the resize axis there). This is the "clear stale inline height across BP" fix.
    if (pos === 'inline') { this.style.height = ''; this.style.maxHeight = ''; this.style.transform = ''; }
  }

  private _posRo: ResizeObserver | null = null;
  // [impl:uuid:240c539f-4c32-40e8-b40f-856dcb3daf6b] RbDetailDrawer.observePosition (Method e8097351, off UC cc45a580, Class d86af73d)
  // R31.9 container-query DRIVER (load-bearing): observe the HOST CONTAINER width → drive the existing applyPosition
  // (R31.5.7 d48cc0ce) so the ONE drawer instance transitions inline(≥1025 Details-compartment)↔bottom(≤1024 drawer)
  // via CSS [data-position] — NO JS instance-switch, NO re-mount (same DOM node), NO hard-@media jump. Observes the
  // PARENT (not self → no feedback loop) mirroring RbStrip.observeContainer (rb-strip.ts:81). Wires the previously-dead
  // R31.5.7 data-position mechanism (0 callers before). Cleaned up in disconnectedCallback.
  private observePosition(): void {
    if (this.getAttribute('data-context') === 'room-chat') return; // R31.12 #1: the in-room chat sheet OPTS OUT — no data-position driver (R31.9 was /trace+SM-designed); stays the base bottom chat sheet
    if (this._posRo) return;
    const host = this.parentElement || document.body; // .trace-page / .room-view / editor-area — its width crosses the 1025 BP
    const decide = (): void => this.applyPosition((host.getBoundingClientRect().width || window.innerWidth) >= 1025 ? 'inline' : 'bottom');
    this._posRo = new ResizeObserver(() => decide());
    this._posRo.observe(host);
    decide(); // initial position — correct on first paint (no jump)
  }

  private _graph: any = null;
  set graph(g: any) { this._graph = g; }
  private _fallbackGraph: TraceGraph | null = null; // R30.21: holds units fetched when the real graph is absent/incomplete

  // [impl:uuid:dbddf408-60f3-4094-91b6-268861d651c6] R20.10 renderDetailForRef
  private async renderDetailForRef(ref: string): Promise<void> {
    this.setMode('detail');
    const panel = this.detailPanel;
    if (!panel || panel.dataset.currentRef === ref) return;
    // R31.4 leak fix (CLIENT root, architect 08b66194f — kills the drawer double-render): onSelectionChanged invokes
    // renderDetailForRef TWICE per select (attributeChangedCallback:119 via setAttribute('ref') + the sameRef:92 path).
    // This method is ASYNC, so its currentRef guard (above) can't dedupe two SYNCHRONOUS invocations — and R27.8(d)'s
    // :86 currentRef='' clears it anyway → 2 renders → 2 terminal elements → 2 ws → the 1st orphans mid-connect = the
    // leaked sm_. A SYNCHRONOUS per-ref in-flight guard, set BEFORE any await + cleared in finally, collapses the two
    // to EXACTLY 1 render/element/ws; a later DELIBERATE re-select (after finally) still re-renders (R27.8(d) intact).
    // Pairs with the server PtyBridge readyState reap (defense-in-depth). SHARED drawer → applies to /trace+/scenario.
    if (panel.dataset.rendering === ref) return;
    panel.dataset.rendering = ref;
    try {
    const colonIdx = ref.indexOf(':');
    const type = colonIdx > 0 ? ref.slice(0, colonIdx) : 'unknown';
    const uuid = colonIdx > 0 ? ref.slice(colonIdx + 1) : ref;
    // [impl:uuid:36934fe3-c15b-4429-8aa2-48c79e674688] BUG8 collection detail via parent
    if (type === 'collection') {
      const parts = uuid.split('-');
      const kind = parts[0];
      const roomUuid = parts.slice(1).join('-');
      if (!roomUuid) return;
      panel.dataset.currentRef = ref;
      panel.innerHTML = `<h3 style="color:white;margin:0 0 8px;font-size:0.9rem">${kind === 'members' ? 'Members' : 'Files'}</h3><div class="dv-loading">Loading...</div>`;
      try {
        const res = await fetch(`/api/trace/children/${roomUuid}`);
        const data = await res.json();
        const coll = (data.children || []).find((c: any) => c.uuid === uuid);
        const children = coll?.children || [];
        panel.innerHTML = `<h3 style="color:white;margin:0 0 8px;font-size:0.9rem">${kind === 'members' ? 'Members' : 'Files'} (${children.length})</h3>` +
          (children.length === 0 ? '<div class="dv-empty">None</div>' :
          children.map((c: any) => `<div class="dv-link" data-ref="${(c.type || '').toLowerCase()}:${c.uuid}"><span class="dv-rel">${c.type}</span><span class="dv-link-title">${c.name || c.uuid}</span></div>`).join(''));
      } catch { panel.innerHTML = '<div class="dv-empty">Failed to load</div>'; }
      return;
    }
    // R30.3: Sprint / CurrentSprint nodes render directly via renderSprintDetail (extracted below).
    if (type.toLowerCase() === 'sprint' || type.toLowerCase() === 'currentsprint') {
      await this.renderSprintDetail(uuid, type, panel);
      return;
    }
    panel.dataset.currentRef = ref;
    const tagMap: Record<string, string> = {
      requirement: 'rb-requirement-detail', task: 'rb-task-detail', usecase: 'rb-usecase-detail',
      class: 'rb-class-detail', method: 'rb-method-detail', implementation: 'rb-implementation-detail',
      test: 'rb-test-detail', file: 'rb-file-detail', webitem: 'rb-webitem-detail',
      otmuxpane: 'rb-terminal-detail', // R31.4 DRY: Server Manager terminal = a detail-view (defined by the server-manager bundle; tag string only → no xterm in /trace bundles)
      feature: 'rb-feature-detail', // R31.8b/c: FeatureManager view = a detail-view (defined by the feature-manager bundle; tag string only → stays out of /trace)
      profile: 'rb-profile-detail', // R31.8c NODE-4: granted-user detail (revoke); tag string only, defined by the feature-manager bundle
      diagram: 'rb-diagram-detail', // R32.4: MDA SVG diagram surface (additive; drawer self-imports it above — no fork)
    };
    const tag = tagMap[type] || 'rb-detail-view';
    // R30.21: resolve a graph that HAS the unit (real graph, or a fetched fallback) BEFORE the element mounts,
    // so type-specific details render in scenario-view (no drawer.graph) + for chain-only units (impl/test).
    const detailGraph = await this.resolveDetailUnit(uuid, type);
    panel.innerHTML = '';
    const el = document.createElement(tag) as any;
    el.setAttribute('ref', ref);
    el.setAttribute('uuid', uuid);
    if (detailGraph) el.graph = detailGraph;
    panel.appendChild(el);
    } finally { if (panel.dataset.rendering === ref) delete panel.dataset.rendering; } // R31.4 leak fix: release the in-flight guard AFTER the async render completes → a later deliberate re-select re-renders (R27.8(d)); the 2nd sync invocation of THIS select already returned above
  }

  // [impl:uuid:159fb8f0-856e-4c89-afd8-19b7579d91cd] R30.21 RbDetailDrawer.resolveDetailUnit
  // Graph-INDEPENDENT detail resolution. The type-specific detail elements read this.graph.get(uuid) and hard-fail
  // to "not found" when the drawer has no graph (scenario-view never sets drawer.graph) or the unit is chain-only
  // (impl/test aren't tree nodes). Mirror renderSprintDetail: fetch /api/ior and register a minimal TraceObject into
  // the (real or fallback) graph so the element resolves + renders, then loads its own rich detail. Returns the graph
  // to hand to the element. File/WebItem types fetch by uuid themselves (makeObject throws → caught → harmless).
  private async resolveDetailUnit(uuid: string, type: string): Promise<TraceGraph | null> {
    if (this._graph?.get(uuid)) return this._graph;                        // real graph already has it
    const g: TraceGraph = this._graph || (this._fallbackGraph ??= new TraceGraph());
    if (!g.has(uuid)) {
      try {
        const res = await fetch(`/api/ior/ior:instance:${uuid}`);
        const model = (await res.json())?.unit?.model || {};
        const obj = makeObject(g, type as ObjectType, uuid, String(model.name || model.title || uuid));
        if (model.status) obj.status = String(model.status);
        if (model.sprint) obj.sprint = String(model.sprint);
      } catch { /* unknown type (file/webitem) or fetch failure → element degrades gracefully */ }
    }
    return g;
  }

  // [impl:uuid:0267036c-ec5a-4e13-a74e-1a89f45412b3] RbDetailDrawer.renderSprintDetail — R30.3 sprint selection populates the detail drawer
  // R30.3: Sprint / CurrentSprint nodes come from /api/trace/sprints (not the in-memory graph), so the
  // generic rb-detail-view resolves empty. Render sprint details directly (name, goal, task list) — like the collection case.
  private async renderSprintDetail(uuid: string, type: string, panel: HTMLElement): Promise<void> {
    panel.dataset.currentRef = `${type}:${uuid}`;
    panel.innerHTML = '<div class="dv-loading">Loading...</div>';
    try {
      const res = await fetch(`/api/ior/ior:instance:${uuid}`);
      const m = (await res.json())?.unit?.model || {};
      const goal = String(m.goal || m.sprintGoal || m.description || '');
      const tasks: string[] = Array.isArray(m.tasks) ? m.tasks : [];
      const childRes = await fetch(`/api/trace/children/${encodeURIComponent(uuid)}`);
      const kids = (await childRes.json().catch(() => ({})))?.children || [];
      panel.innerHTML =
        `<div class="dv-head"><span class="dv-type">${type}</span><h3 class="dv-title">${String(m.name || uuid)}</h3><code class="dv-uuid">${uuid}</code></div>` +
        (goal ? `<p style="color:rgba(255,255,255,0.7);font-size:0.78rem;margin:8px 0">${goal}</p>` : '') +
        `<div class="dv-scenario-children"><h4 style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:4px">Tasks (${tasks.length || kids.length})</h4>` +
        (kids.length === 0 ? '<div class="dv-empty">no tasks</div>' :
          kids.map((c: any) => `<div class="dv-link" data-ref="${String(c.type || 'task').toLowerCase()}:${c.uuid}"><span class="dv-rel">${c.type || 'Task'}</span><span class="dv-link-title">${c.name || c.uuid}</span></div>`).join('')) +
        `</div>`;
    } catch { panel.innerHTML = '<div class="dv-empty">Failed to load sprint</div>'; }
  }

  // [impl:uuid:e76330fe-e29d-4587-b113-a1ed940ce62c] R20.6 removeDefaultHighlight keep-X
  // [impl:uuid:2e4ff35c-6286-4400-a2c8-d6ebfde62638] R20.11 close
  close(): void {
    this.removeAttribute('ref');
    this.removeAttribute('open');
    this.removeAttribute('minimized'); this.removeAttribute('maximized');  // R27.8(b) + R31.4: clean slate
    this.style.height = '';
    this.style.maxHeight = '';
    const dp = this.detailPanel; if (dp) dp.dataset.currentRef = '';        // R27.8(b): so a later reopen RE-RENDERS (not the stale-ref no-op)
    const body = this.querySelector('.drawer-body') as HTMLElement | null; if (body) body.style.display = 'flex'; // R27.8(b): restore body (minimize set it none)
    this.tearDownTransientDetail(); // R31.4 INV-T1: ESC/full-close kills the terminal ws + sm_ session
    selectionModel.clear();
  }

  // R31.4 INV-T1 (auto-close): the terminal detail (rb-terminal-detail) owns a LIVE ws + a server-side grouped tmux
  // session — expensive, and it LEAKS if the element merely lingers in the DOM. Unlike a normal (persistent) detail,
  // it MUST NOT survive a drawer-away state — minimize/peek/close/empty-select keep the element mounted (body hidden,
  // no disconnectedCallback) so its teardown never fires → 14 orphaned sm_ sessions observed. FIX: explicitly REMOVE
  // the terminal element on those transitions → disconnectedCallback → RbTerminalDetail.teardown → ws.close → server
  // cleanup() kills the sm_ grouped session. Terminal-SPECIFIC by tag (persistent details correctly survive minimize/
  // peek); re-selecting the pane re-attaches via renderDetailForRef. Select-AWAY to another ref already tears down via
  // renderDetailForRef's panel.innerHTML='' — this covers the states that DON'T re-render.
  // [impl:uuid:cb153623-3acb-4c45-8dc8-e2bceeba4ae1] RbDetailDrawer.tearDownTransientDetail (R31.4 INV-T1 auto-close)
  private tearDownTransientDetail(): void {
    if (this.getAttribute('data-context') === 'room-chat') return; // R31.12 #1: the in-room chat sheet is NOT governed by the R31.4 terminal auto-close/teardown lifecycle
    const term = this.detailPanel?.querySelector('rb-terminal-detail');
    if (term) { term.remove(); const dp = this.detailPanel; if (dp) dp.dataset.currentRef = ''; } // remove → teardown → ws close → kill sm_ session; clear ref so a reopen re-renders
  }

// [impl:uuid:b53858c3-89ba-48ee-a659-2d03a3c88e51] impl:RbDetailDrawer.stickyBottom (split for RbDetailDrawer.c
// [impl:uuid:b708531d-4274-4987-b573-94fbf2e2cb88] impl:RbDetailDrawer.stickyBottom (split for RbDetailDrawer.o
// [impl:uuid:c1e90fe2-ea6d-4ada-abbd-09286a75bdfd] impl:RbDetailDrawer.stickyBottom (split for RbDetailDrawer.c
// [impl:uuid:868331a4-7890-4467-bb99-9aec0cb78f4b] impl:RbDetailDrawer.stickyBottom (split for RbDetailDrawer.s
  // [impl:uuid:d0235605-5d79-4411-a6ff-c72099ffd2f9] RbDetailDrawer.stickyBottom
  get body(): HTMLElement {
    let b = this.querySelector('.drawer-body') as HTMLElement;
    if (!b) { this.render(); b = this.querySelector('.drawer-body') as HTMLElement; }
    return b;
  }

  // [impl:uuid:aa585fcc-dfc1-42a8-a77d-0c0fb03ca5fd] RbDetailDrawer.stickyClose R19.33
  private render(): void {
    if (this.querySelector('.drawer-header')) return;
    this.innerHTML = `
      <div class="drawer-header">
        ${this.renderGrabBar()}
        <button class="drawer-max" title="Maximize">⛶</button>
        <button class="drawer-close" title="Close">✕</button>
      </div>
      <div class="drawer-body" style="display:flex;flex-direction:column">
        <div class="drawer-panel-chat" style="display:flex;flex-direction:column;flex:1;min-height:0"></div>
        <div class="drawer-panel-detail" style="display:none"></div>
        <div class="drawer-panel-preview" style="display:none"></div>
      </div>`;
    // R30.20 (mode-aware close): X returns detail→chat when a chat panel exists (in-room), else minimizes to peek
    // (trace context, or already in chat). ESC still fully CLOSES; grab-bar toggles peek↔expand via closeAndMinimize().
    this.querySelector('.drawer-handle')!.addEventListener('click', () => { if (this.mouseMoved) return; this.closeAndMinimize(); });
    this.querySelector('.drawer-max')!.addEventListener('click', () => this.toggleMaximize());
    this.querySelector('.drawer-close')!.addEventListener('click', () => this.closeOrReturn());
  }

  // R31.4 AC-maximize (Option A, PO-endorsed): full-viewport drawer = maximum terminal space, NO-disrupt — the grouped
  // attach shows the whole window (NO tmux zoom, which is a shared window property that would leak to other viewers →
  // options C/D true single-pane isolation deferred pending Tron). Toggles the `maximized` attr → app.css lifts the
  // drawer to fixed inset:0; the terminal's ResizeObserver auto-re-fits to the larger box. General to the shared drawer
  // (any detail can maximize). Cleared by minimize()/close() for a clean slate.
  private toggleMaximize(): void {
    if (this.hasAttribute('maximized')) { this.removeAttribute('maximized'); return; }
    this.removeAttribute('minimized');
    const body = this.querySelector('.drawer-body') as HTMLElement | null; if (body) body.style.display = 'flex'; // maximize implies expanded
    this.setAttribute('maximized', '');
  }

  setMode(m: 'chat' | 'detail' | 'preview'): void {
    this._mode = m;
    for (const [cls, active] of [['chat', m === 'chat'], ['detail', m === 'detail'], ['preview', m === 'preview']] as const) {
      const el = this.querySelector(`.drawer-panel-${cls}`) as HTMLElement;
      if (el) el.style.display = active ? (cls === 'chat' ? 'flex' : 'block') : 'none';
    }
  }

  // [impl:uuid:65f43714-97e3-4e70-b8ef-a0e6d88ed31d] R30.20 RbDetailDrawer.closeOrReturn
  // Mode-aware X: in a room (chat panel exists) a detail view steps BACK to chat instead of vanishing the room;
  // in trace context (no chat panel) or already in chat, minimize to peek. ESC still fully closes (separate handler).
  closeOrReturn(): void {
    if (this.chatPanel && this._mode === 'detail') this.setMode('chat');
    else this.minimize();
  }

  get chat(): ChatPanel | null {
    if (!this.chatPanel) {
      const panel = this.querySelector('.drawer-panel-chat') as HTMLElement;
      if (panel) this.chatPanel = new ChatPanel(panel);
    }
    return this.chatPanel;
  }

  get detailPanel(): HTMLElement {
    return this.querySelector('.drawer-panel-detail') as HTMLElement;
  }

  get previewPanel(): HTMLElement {
    return this.querySelector('.drawer-panel-preview') as HTMLElement;
  }

  // [impl:uuid:58abb87f-90c2-478c-8c4b-a7cb953519bf] R20.2 renderGrabBar
  private renderGrabBar(): string {
    return '<div class="drawer-handle"><div class="drawer-handle-bar"></div></div>';
  }

  // [impl:uuid:cea22d12-cdae-4c25-a1e8-4231b1d46eb1] R19.84 handleDragResize
  // [impl:uuid:79601135-a1b2-4c3d-8e4f-5a6b7c8d9e03] R19.86 dismiss threshold
  private onTouchStart = (e: TouchEvent): void => {
    const handle = this.querySelector('.drawer-handle');
    const t = e.target as Node;
    this.startY = e.touches[0].clientY;
    if (handle && (handle.contains(t) || t === handle)) {
      this.dragging = 'resize';
      this.startHeight = this.offsetHeight;
      this.style.transition = 'none';
      this.style.maxHeight = 'none';
    } else {
      this.dragging = false;
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    const touchY = e.touches[0].clientY;
    const dy = touchY - this.startY;
    if (this.dragging === 'resize') {
      e.preventDefault();
      const newH = this.startHeight + (this.startY - touchY);
      const clamped = Math.min(window.innerHeight * 0.95, Math.max(120, newH));
      this.style.height = `${clamped}px`;
    } else if (this.dragging === 'dismiss') {
      if (dy > 0) { this.style.transform = `translateY(${dy}px)`; e.preventDefault(); }
    } else if (dy > 10) {
      this.dragging = 'dismiss';
      this.style.transition = 'none';
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    if (!this.dragging) return;
    const mode = this.dragging;
    this.dragging = false;
    this.style.transition = '';
    if (mode === 'resize') {
      const h = parseInt(this.style.height || '0');
      if (h < 120) { this.minimize(); } // BUG3: resize-to-tiny minimizes (peek), not close
    } else {
      const dy = e.changedTouches[0].clientY - this.startY;
      this.style.transform = '';
      if (dy > 80) this.minimize(); // BUG3: swipe-down minimizes (peek), not close
    }
  };

  // BUG3: minimize to a peek bar (header only); click the bar to expand. ESC still fully closes.
  // [impl:uuid:bfe09645-5e91-42e1-a843-c882b61be9b5] R25.4 RbDetailDrawer.minimize
  minimize(): void {
    if (this.hasAttribute('minimized')) return;
    this.removeAttribute('maximized'); // R31.4: minimize supersedes maximize
    this._restoreHeight = this.style.height || `${this.offsetHeight}px`;
    this.setAttribute('minimized', '');
    this.style.height = ''; this.style.maxHeight = ''; this.style.transform = '';
    const body = this.querySelector('.drawer-body') as HTMLElement | null; if (body) body.style.display = 'none';
    this.tearDownTransientDetail(); // R31.4 INV-T1: minimize/peek must kill the terminal ws + sm_ session (the leak: body hidden but element stayed mounted)
  }
  expand(): void {
    if (!this.hasAttribute('minimized')) return;
    this.removeAttribute('minimized');
    const body = this.querySelector('.drawer-body') as HTMLElement | null;
    if (body) body.style.display = 'flex';
    if (this._restoreHeight) this.style.height = this._restoreHeight;
  }

  // [impl:uuid:e42b85e8-d844-4e7b-be17-561a82d780b9] R27.8 RbDetailDrawer.closeAndMinimize
  // Grab-bar peek/expand orchestration: toggles minimized↔expanded (reuses R25.4 minimize()/expand()). Paired with
  // X→close() + open-minimized default (7029d8728): closed → open+minimized(peek) → grab-bar → expanded; X/ESC → close.
  closeAndMinimize(): void {
    if (this.hasAttribute('minimized')) this.expand(); else this.minimize();
  }

  // BUG2: desktop grab-bar resize — mirrors the touch handlers; move/up on document so the drag
  // continues off the handle. A mousedown with no movement falls through to the grab-bar peek toggle.
  // [impl:uuid:9d095150-0c3b-42bc-9763-1d79a46383f7] R25.4 RbDetailDrawer.onMouseDown (grab-bar pointer)
  private onMouseDown = (e: MouseEvent): void => {
    const handle = this.querySelector('.drawer-handle');
    if (!handle || !(handle.contains(e.target as Node) || e.target === handle)) return;
    this.startY = e.clientY; this.startHeight = this.offsetHeight;
    this.startBottom = this.getBoundingClientRect().bottom; // v0.6.95: anchor to the ACTUAL bottom edge (works in any layout/position, not just a viewport-bottom sheet)
    this.mouseResizing = true; this.mouseMoved = false;
    this.style.transition = 'none'; this.style.maxHeight = 'none';
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    e.preventDefault();
  };
  private onMouseMove = (e: MouseEvent): void => {
    if (!this.mouseResizing) return;
    if (this.hasAttribute('minimized')) this.expand();
    this.mouseMoved = true;
    // v0.6.95: height = distance from the cursor to the drawer's anchored bottom edge — correct in
    // EVERY layout (was startHeight + Δ, which only held when the drawer bottom == viewport bottom → jumped after the media breakpoint repositioned it).
    const newH = this.startBottom - e.clientY;
    this.style.height = `${Math.min(window.innerHeight * 0.95, Math.max(120, newH))}px`;
  };
  private onMouseUp = (): void => {
    if (!this.mouseResizing) return;
    this.mouseResizing = false;
    this.style.transition = '';
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    if (this.mouseMoved && parseInt(this.style.height || '0') <= 120) this.minimize();
    setTimeout(() => { this.mouseMoved = false; }, 0); // reset AFTER the trailing click is processed
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.hasAttribute('open')) this.close();
  };
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-detail-drawer')) {
  customElements.define('rb-detail-drawer', RbDetailDrawer);
}
