// R31.5.2 + R31.5.4 — RbStrip (<rb-strip>): the ordered row of bars '|' and compartments '[]', + its responsive
// viewport MODE. Design: design-r31.5-build-decomposition.md PIECE 1 (Tron BUILD-authorized). Owns layout+scroll+snap;
// NO content logic (it hosts whatever the descriptors give). Foundation only — added AROUND the app (nothing imports
// it yet) so /trace + the editor stay unregistered/unchanged until the instance-wiring step (5.5/5.6).
import './rb-compartment.js';

// StripDescriptor = the layer-3 DATA CONTRACT (an interface, NOT a chain Method): one entry per row segment.
export interface StripDescriptor { id: string; kind: 'compartment' | 'bar'; content?: Node | string; label?: string; }

export class RbStrip extends HTMLElement {
  private _descriptors: StripDescriptor[] | null = null;
  private _ro: ResizeObserver | null = null;
  private _activeId = '';

  connectedCallback(): void {
    this.observeContainer();
    if (this._descriptors) this.renderDescriptors(this._descriptors);
  }
  disconnectedCallback(): void { if (this._ro) { this._ro.disconnect(); this._ro = null; } }

  set items(d: StripDescriptor[]) { this.renderDescriptors(d); }
  get items(): StripDescriptor[] | null { return this._descriptors; }

  // [impl:uuid:8f1b6c3d-0a4e-4d92-b7c5-1e9f2a6d8b40] RbStrip.renderDescriptors (Method 9053202e, Class 91d575d0)
  // R31.5.2 LOAD-BEARING: build the ordered row from the descriptor array — 'compartment'→hosts an <rb-compartment>,
  // 'bar'→a .rb-bar segment; DIFF/PATCH on re-set (idempotent, like rb-trace-tree.items: reuse a segment by id, rebuild
  // only on kind-change, drop removed, re-order in place). Landscape flex-row is the default layout; the scroll-snap
  // MODE is applyViewportMode (5.4), not here. buildSegment is the PRIVATE segment-builder helper.
  renderDescriptors(descriptors: StripDescriptor[]): void {
    this._descriptors = descriptors;
    if (!this.isConnected) return;
    const existing = new Map<string, HTMLElement>();
    this.querySelectorAll<HTMLElement>(':scope > .rb-seg').forEach(n => { const id = n.dataset.id || ''; if (id) existing.set(id, n); });
    const wanted = new Set<string>();
    let prev: HTMLElement | null = null;
    for (const d of descriptors) {
      wanted.add(d.id);
      let seg = existing.get(d.id);
      if (!seg || seg.dataset.kind !== d.kind) { if (seg) seg.remove(); seg = this.buildSegment(d); } // rebuild only on kind-change
      const anchor = prev ? prev.nextSibling : this.firstChild;
      if (seg !== anchor) this.insertBefore(seg, anchor); // idempotent re-order (move only if misplaced)
      prev = seg;
    }
    for (const [id, n] of existing) { if (!wanted.has(id)) n.remove(); } // drop removed
  }

  // PRIVATE helper (not a chain Method): one row segment per descriptor.
  private buildSegment(d: StripDescriptor): HTMLElement {
    const seg = document.createElement('div');
    seg.className = 'rb-seg rb-seg-' + d.kind;
    seg.dataset.id = d.id; seg.dataset.kind = d.kind; if (d.label) seg.dataset.label = d.label; // R31.5.3: label for rb-snap-nav buttons
    if (d.kind === 'compartment') {
      const c = document.createElement('rb-compartment');
      c.setAttribute('presentation', 'expanded');
      if (d.content instanceof Node) c.appendChild(d.content); else if (typeof d.content === 'string') c.innerHTML = d.content;
      seg.appendChild(c);
    } else {
      seg.classList.add('rb-bar');
      if (d.content instanceof Node) seg.appendChild(d.content); else if (typeof d.content === 'string') seg.innerHTML = d.content;
    }
    return seg;
  }

  // [impl:uuid:2a9c5e17-3d8b-46f1-a0c4-7b2e5d9f14a3] RbStrip.applyViewportMode (Method 232a66f7, Class 91d575d0)
  // R31.5.4 LOAD-BEARING: set data-mode → app.css branches LANDSCAPE (flex; overflow:visible; all side-by-side) vs
  // PORTRAIT (overflow-x:auto; scroll-snap-type:x mandatory; compartments=snap-targets, bars ride the leading edge;
  // --rb-peek:12vw → 88vw compartment min-width). Focus-restore: on a landscape↔portrait FLIP, scrollIntoView the
  // ACTIVE compartment (its id stored on the strip). observeContainer is the private container-query driver.
  applyViewportMode(mode: 'landscape' | 'portrait'): void {
    const prev = this.getAttribute('data-mode');
    if (prev === mode) return;
    this.setAttribute('data-mode', mode);
    if (prev && this._activeId) { // a real FLIP (not first apply) → restore focus to the active compartment
      const seg = this.querySelector<HTMLElement>(`:scope > .rb-seg[data-id="${CSS.escape(this._activeId)}"]`);
      if (seg) requestAnimationFrame(() => seg.scrollIntoView({ inline: 'start', block: 'nearest' }));
    }
  }

  // Container-query driver: a ResizeObserver on the strip's own box (composes when nested — a strip inside a
  // compartment measures its OWN container) → applyViewportMode. app.css also carries the @container/orientation rules.
  private observeContainer(): void {
    if (this._ro) return;
    const decide = (w: number): void => this.applyViewportMode(w >= 900 ? 'landscape' : 'portrait');
    this._ro = new ResizeObserver(entries => { for (const e of entries) decide(e.contentRect.width); });
    this._ro.observe(this);
    decide(this.getBoundingClientRect().width || window.innerWidth);
  }

  // The active (last-snapped / focused) compartment id, preserved across mode flips (rb-snap-nav 5.3 will set this).
  setActive(id: string): void { this._activeId = id; }
}
customElements.define('rb-strip', RbStrip);
