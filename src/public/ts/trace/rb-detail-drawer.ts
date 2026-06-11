/**
 * T110 — rb-detail-drawer: Google-Maps-style bottom drawer for DetailViews.
 *
 * Two-part layout: .drawer-header (sticky, handle + X close) + .drawer-body
 * (scrollable, receives detail content). Swipe-down or ESC to dismiss.
 *
 * [impl:uuid:19654b84-90e4-4a89-a9a8-10221f883d25] R16.1 DetailViewContainer
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

  // [impl:uuid:d0235605-5d79-4411-a6ff-c72099ffd2f9] RbDetailDrawer.stickyBottom
  get body(): HTMLElement {
    let b = this.querySelector('.drawer-body') as HTMLElement;
    if (!b) { this.render(); b = this.querySelector('.drawer-body') as HTMLElement; }
    return b;
  }

  private render(): void {
  // [impl:uuid:aa585fcc-dfc1-42a8-a77d-0c0fb03ca5fd] RbDetailDrawer.stickyClose R19.33
    if (this.querySelector('.drawer-header')) return;
    this.innerHTML = `
      <div class="drawer-header">
        <div class="drawer-handle"></div>
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
