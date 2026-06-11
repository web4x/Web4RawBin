/**
 * T110 — rb-detail-drawer: Google-Maps-style bottom drawer for DetailViews.
 *
 * Two-part layout: .drawer-header (sticky, handle + X close) + .drawer-body
 * (scrollable, receives detail content). Swipe-down or ESC to dismiss.
 *
 * [impl:uuid:a1102f6c-7d04-4e91-b2a8-1f0e6c3d9b50] R16.1 DetailViewContainer
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

  get body(): HTMLElement {
    let b = this.querySelector('.drawer-body') as HTMLElement;
    if (!b) { this.render(); b = this.querySelector('.drawer-body') as HTMLElement; }
    return b;
  }

  private render(): void {
  // [impl:uuid:3a671bfc-12c2-4922-938e-01572d90808e] RbDetailDrawer.stickyClose R19.33
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
