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

export class RbDetailDrawer extends HTMLElement {
  static get observedAttributes() { return ['ref', 'open']; }
  private startY = 0;
  private startHeight = 0;
  private dragging: 'resize' | 'dismiss' | false = false;

  // [impl:uuid:94f6e1f8-84a8-4ca5-9a44-6108ef6201bc] R20.6 selectionDriven drawer
  connectedCallback(): void {
    this.render();
    this.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.addEventListener('touchend', this.onTouchEnd);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('selection-changed', this.onSelectionChanged);
  }

  disconnectedCallback(): void {
    this.removeEventListener('touchstart', this.onTouchStart);
    this.removeEventListener('touchmove', this.onTouchMove);
    this.removeEventListener('touchend', this.onTouchEnd);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('selection-changed', this.onSelectionChanged);
  }

  private onSelectionChanged = (e: Event): void => {
    const selected = (e as CustomEvent).detail?.selected || [];
    if (selected.length === 1) {
      this.setAttribute('ref', selected[0]);
    } else if (selected.length === 0) {
      // [impl:uuid:c3c70517-a1b2-4c3d-8e4f-5a6b7c8d9e0a] R20.6 emptyShowsChat
      this.removeAttribute('ref');
      this.removeAttribute('open');
    }
  };

  attributeChangedCallback(name: string): void {
    if (name === 'ref') {
      const ref = this.getAttribute('ref');
      if (ref) {
        this.setAttribute('open', '');
      } else {
        this.removeAttribute('open');
      }
    }
  }

  // [impl:uuid:e76330fe-e29d-4587-b113-a1ed940ce62c] R20.6 removeDefaultHighlight keep-X
  close(): void {
    this.removeAttribute('ref');
    this.removeAttribute('open');
    this.style.height = '';
    this.style.maxHeight = '';
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

  private render(): void {
  // [impl:uuid:aa585fcc-dfc1-42a8-a77d-0c0fb03ca5fd] RbDetailDrawer.stickyClose R19.33
  // [impl:uuid:0dd08b2f-a1b2-4c3d-8e4f-5a6b7c8d9e07] R20.2 renderGrabBar
    if (this.querySelector('.drawer-header')) return;
    this.innerHTML = `
      <div class="drawer-header">
        <div class="drawer-handle"><div class="drawer-handle-bar"></div></div>
        <button class="drawer-close" title="Close">✕</button>
      </div>
      <div class="drawer-body"></div>`;
    this.querySelector('.drawer-handle')!.addEventListener('click', () => this.close());
    this.querySelector('.drawer-close')!.addEventListener('click', () => this.close());
  }

  // [impl:uuid:01771d5b-a1b2-4c3d-8e4f-5a6b7c8d9e0f] R19.84 drawer.dragResize
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
      if (h < 120) { this.close(); this.style.height = ''; this.style.maxHeight = ''; }
    } else {
      const dy = e.changedTouches[0].clientY - this.startY;
      this.style.transform = '';
      if (dy > 80) this.close();
    }
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.hasAttribute('open')) this.close();
  };
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-detail-drawer')) {
  customElements.define('rb-detail-drawer', RbDetailDrawer);
}
