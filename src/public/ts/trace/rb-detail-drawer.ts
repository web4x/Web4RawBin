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

export class RbDetailDrawer extends HTMLElement {
  static get observedAttributes() { return ['ref', 'open']; }
  private startY = 0;
  private dragging = false;

  connectedCallback(): void {
    this.render();
    this.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.addEventListener('touchend', this.onTouchEnd);
    document.addEventListener('keydown', this.onKeyDown);
  }

  disconnectedCallback(): void {
    this.removeEventListener('touchstart', this.onTouchStart);
    this.removeEventListener('touchmove', this.onTouchMove);
    this.removeEventListener('touchend', this.onTouchEnd);
    document.removeEventListener('keydown', this.onKeyDown);
  }

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

  close(): void {
    this.removeAttribute('ref');
    this.removeAttribute('open');
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
  // [impl:uuid:517b767c-dfc7-4b34-84d6-f152a163bc73] R19.79 nudge handle above buttons
    if (this.querySelector('.drawer-header')) return;
    this.innerHTML = `
      <div class="drawer-header">
        <div class="drawer-handle" style="cursor:grab;padding:8px 0;touch-action:none"></div>
        <button class="drawer-close" title="Close">✕</button>
      </div>
      <div class="drawer-body"></div>`;
    this.querySelector('.drawer-handle')!.addEventListener('click', () => this.close());
    this.querySelector('.drawer-close')!.addEventListener('click', () => this.close());
  }

  private onTouchStart = (e: TouchEvent): void => {
    const rect = this.getBoundingClientRect();
    const touchY = e.touches[0].clientY;
    if (touchY - rect.top < 60) {
      this.dragging = true;
      this.startY = touchY;
      this.style.transition = 'none';
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (!this.dragging) return;
    const dy = e.touches[0].clientY - this.startY;
    if (dy > 0) {
      this.style.transform = `translateY(${dy}px)`;
      e.preventDefault();
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    if (!this.dragging) return;
    this.dragging = false;
    const dy = e.changedTouches[0].clientY - this.startY;
    this.style.transition = '';
    this.style.transform = '';
    if (dy > 80) this.close();
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.hasAttribute('open')) this.close();
  };
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-detail-drawer')) {
  customElements.define('rb-detail-drawer', RbDetailDrawer);
}
