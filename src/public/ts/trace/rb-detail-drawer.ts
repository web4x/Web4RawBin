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
import './rb-file-detail.js';
import './rb-webitem-detail.js';

export class RbDetailDrawer extends HTMLElement {
  static get observedAttributes() { return ['ref', 'open']; }
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
  }

  // [impl:uuid:e927ecfe-6fba-4a91-aa74-ed13da8e8fe4] RbDetailDrawer.onSelectionChanged
  private onSelectionChanged = (e: Event): void => {
    const selected = (e as CustomEvent).detail?.selected || [];
    if (selected.length === 1) {
      // R27.8(d) HARD INVARIANT (Tron): EACH select opens the drawer to peek + re-renders, from ANY prior state
      // (closed/removed/minimized/expanded), even re-selecting the SAME node. Clear currentRef so a same-ref re-render
      // isn't skipped; render directly when the ref attr is unchanged (attributeChangedCallback won't fire for it).
      const ref = selected[0];
      const dp = this.detailPanel; if (dp) dp.dataset.currentRef = '';
      const sameRef = this.getAttribute('ref') === ref;
      this.setAttribute('open', '');
      this.setAttribute('minimized', '');
      this.setAttribute('ref', ref);
      if (sameRef) this.renderDetailForRef(ref);
    } else if (selected.length === 0) {
      // [impl:uuid:c3c70517-b56c-4765-94ae-cb677601f99c] R20.6 emptyShowsChat
      this.removeAttribute('ref');
      const dp = this.detailPanel;
      if (dp) dp.dataset.currentRef = '';
      if (this.chatPanel) this.setMode('chat');
    }
  };

  attributeChangedCallback(name: string): void {
    if (name === 'ref') {
      const ref = this.getAttribute('ref');
      if (ref) {
        this.setAttribute('open', '');
        this.setAttribute('minimized', ''); // R27.8: open MINIMIZED (peek) on first open; grab-bar expands
        this.renderDetailForRef(ref);
      } else {
        this.removeAttribute('open');
      }
    }
  }

  private _graph: any = null;
  set graph(g: any) { this._graph = g; }

  // [impl:uuid:dbddf408-60f3-4094-91b6-268861d651c6] R20.10 renderDetailForRef
  private async renderDetailForRef(ref: string): Promise<void> {
    this.setMode('detail');
    const panel = this.detailPanel;
    if (!panel || panel.dataset.currentRef === ref) return;
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
    panel.dataset.currentRef = ref;
    const tagMap: Record<string, string> = {
      requirement: 'rb-requirement-detail', task: 'rb-task-detail', usecase: 'rb-usecase-detail',
      class: 'rb-class-detail', method: 'rb-method-detail', implementation: 'rb-implementation-detail',
      test: 'rb-test-detail', file: 'rb-file-detail', webitem: 'rb-webitem-detail',
    };
    const tag = tagMap[type] || 'rb-detail-view';
    panel.innerHTML = '';
    const el = document.createElement(tag) as any;
    el.setAttribute('ref', ref);
    el.setAttribute('uuid', uuid);
    if (this._graph) el.graph = this._graph;
    panel.appendChild(el);
  }

  // [impl:uuid:e76330fe-e29d-4587-b113-a1ed940ce62c] R20.6 removeDefaultHighlight keep-X
  // [impl:uuid:2e4ff35c-6286-4400-a2c8-d6ebfde62638] R20.11 close
  close(): void {
    this.removeAttribute('ref');
    this.removeAttribute('open');
    this.removeAttribute('minimized');                                     // R27.8(b): clean slate
    this.style.height = '';
    this.style.maxHeight = '';
    const dp = this.detailPanel; if (dp) dp.dataset.currentRef = '';        // R27.8(b): so a later reopen RE-RENDERS (not the stale-ref no-op)
    const body = this.querySelector('.drawer-body') as HTMLElement | null; if (body) body.style.display = 'flex'; // R27.8(b): restore body (minimize set it none)
    selectionModel.clear();
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
        <button class="drawer-close" title="Close">✕</button>
      </div>
      <div class="drawer-body" style="display:flex;flex-direction:column">
        <div class="drawer-panel-chat" style="display:flex;flex-direction:column;flex:1;min-height:0"></div>
        <div class="drawer-panel-detail" style="display:none"></div>
        <div class="drawer-panel-preview" style="display:none"></div>
      </div>`;
    // R27.8 (corrected): X MINIMIZES/collapses to peek (Tron: "collapse on the x" — R25.4 X=minimize stands); the
    // grab-bar toggles peek↔expand via closeAndMinimize(); ESC fully CLOSES.
    this.querySelector('.drawer-handle')!.addEventListener('click', () => { if (this.mouseMoved) return; this.closeAndMinimize(); });
    this.querySelector('.drawer-close')!.addEventListener('click', () => this.minimize());
  }

  setMode(m: 'chat' | 'detail' | 'preview'): void {
    this._mode = m;
    for (const [cls, active] of [['chat', m === 'chat'], ['detail', m === 'detail'], ['preview', m === 'preview']] as const) {
      const el = this.querySelector(`.drawer-panel-${cls}`) as HTMLElement;
      if (el) el.style.display = active ? (cls === 'chat' ? 'flex' : 'block') : 'none';
    }
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
    this._restoreHeight = this.style.height || `${this.offsetHeight}px`;
    this.setAttribute('minimized', '');
    this.style.height = ''; this.style.maxHeight = ''; this.style.transform = '';
    const body = this.querySelector('.drawer-body') as HTMLElement | null; if (body) body.style.display = 'none';
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
