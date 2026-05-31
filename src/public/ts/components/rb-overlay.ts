export interface OverlayOptions {
  className?: string;
 * [impl:uuid:e8d95f47-0a17-4d64-b653-338584dcc6fd] T41 overlay base
  closable?: boolean;
  onClose?: () => void;
}

export class RbOverlay {
  private overlay: HTMLElement | null = null;
  private onClose: (() => void) | null = null;
  private startY = 0;
  private bodyOverflowBefore = '';

  get isOpen(): boolean { return this.overlay !== null; }
  get element(): HTMLElement | null { return this.overlay; }

  show(content: string, opts?: OverlayOptions): HTMLElement {
    if (this.overlay) this.hide();

    const closable = opts?.closable !== false;
    this.onClose = opts?.onClose ?? null;

    this.overlay = document.createElement('div');
    this.overlay.className = `rb-overlay ${opts?.className || ''}`.trim();
    this.overlay.innerHTML = `<div class="rb-overlay-sheet">${content}</div>`;

    if (closable) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.hide();
      });
    }

    this.bodyOverflowBefore = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    document.body.appendChild(this.overlay);

    const sheet = this.overlay.querySelector('.rb-overlay-sheet') as HTMLElement;
    if (sheet && closable) {
      sheet.addEventListener('touchstart', (e: TouchEvent) => {
        this.startY = e.touches[0].clientY;
      }, { passive: true });
      sheet.addEventListener('touchmove', (e: TouchEvent) => {
        if (e.touches[0].clientY - this.startY > 50) this.hide();
      }, { passive: true });
    }

    return this.overlay;
  }

  hide(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      document.body.style.overflow = this.bodyOverflowBefore;
      this.onClose?.();
      this.onClose = null;
    }
  }
}
