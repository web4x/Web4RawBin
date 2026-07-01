/**
 * R21.9 — RbPanZoom: content-type-agnostic pan/zoom controller (DRY, AC-f1/f2).
 *
 * CSS transform translate(tx,ty) scale(s) with transform-origin:0 0 on the content (AC-b1).
 * scale clamped [1,8] (AC-b2); zoom-about-point keeps the cursor/pinch-midpoint stationary
 * tx'=px-f*(px-tx) (AC-b3); tx/ty clamped so content can't leave view, recenters at s=1 (AC-b4).
 * Wheel zoom about cursor, passive:false (AC-c1); mouse drag pans only when s>1 (AC-c2);
 * 1-finger pan when s>1 (no page-scroll hijack at s=1, AC-d1); 2-finger pinch about midpoint
 * + pan by midpoint delta (AC-d2); double-tap toggles reset<->2x at tap point (AC-d3).
 * Listeners on the VIEWPORT only (AC-e3); e.target hit-test never elementFromPoint (AC-e2);
 * destroy() removes all listeners (AC-e4); iframe pointer-events:none during gesture —
 * on BOTH touch (touchstart) and desktop drag (mousedown), restored on idle (AC-e5).
 */
export class RbPanZoom {
  private scale = 1;
  private tx = 0;
  private ty = 0;
  private readonly MIN = 1;
  private readonly MAX = 8;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private pinchDist = 0;
  private pinchMidX = 0;
  private pinchMidY = 0;
  private lastTapTime = 0;
  private lastTapX = 0;
  private lastTapY = 0;
  private boundoff: Array<() => void> = [];

  constructor(private viewport: HTMLElement, private content: HTMLElement) {
    this.attach();
    this.apply();
  }

  private on<K extends keyof HTMLElementEventMap>(t: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions): void {
    this.viewport.addEventListener(t, fn as EventListener, opts);
    this.boundoff.push(() => this.viewport.removeEventListener(t, fn as EventListener, opts));
  }

  // [impl:uuid:0564d93b-b492-4314-9dad-a53f7ea131af] R22.2 RbPanZoom.attach (mouse handlers)
  private attach(): void {
    this.on('wheel', (e) => { // AC-c1
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      this.zoomAbout(e.offsetX, e.offsetY, factor);
    }, { passive: false });

    this.on('mousedown', (e) => {
      if (this.scale <= 1) return; // AC-c2: pan only when zoomed
      this.dragging = true; this.lastX = e.clientX; this.lastY = e.clientY;
      this.viewport.style.cursor = 'grabbing';
      this.gesturing(); // AC-e5: disable iframe pointer capture on DESKTOP drag too (not just touch)
    });
    this.on('mousemove', (e) => {
      if (!this.dragging) return;
      this.tx += e.clientX - this.lastX; this.ty += e.clientY - this.lastY;
      this.lastX = e.clientX; this.lastY = e.clientY;
      this.clamp(); this.apply();
    });
    const endDrag = () => { this.dragging = false; this.viewport.style.cursor = this.scale > 1 ? 'grab' : 'auto'; this.idle(); };
    this.on('mouseup', endDrag);
    this.on('mouseleave', endDrag);
    this.on('dblclick', (e) => this.doubleTapToggle(e.clientX, e.clientY)); // R22.2 mouse-parity: dblclick toggles reset<->2x (touch already has double-tap)

    this.on('touchstart', (e) => {
      this.gesturing();
      if (e.touches.length === 2) {
        this.pinchDist = this.dist(e.touches[0], e.touches[1]);
        const mid = this.mid(e.touches[0], e.touches[1]);
        this.pinchMidX = mid.x; this.pinchMidY = mid.y;
      } else if (e.touches.length === 1) {
        const t = e.touches[0]; this.lastX = t.clientX; this.lastY = t.clientY;
        // double-tap detector (AC-e1): single-finger start
        const now = Date.now();
        if (now - this.lastTapTime < 300 && Math.abs(t.clientX - this.lastTapX) < 30 && Math.abs(t.clientY - this.lastTapY) < 30) {
          this.pendingDoubleTap = true;
        }
        this.lastTapX = t.clientX; this.lastTapY = t.clientY;
      }
    }, { passive: false });

    this.on('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const d = this.dist(e.touches[0], e.touches[1]);
        const mid = this.mid(e.touches[0], e.touches[1]);
        const rect = this.viewport.getBoundingClientRect();
        const px = mid.x - rect.left, py = mid.y - rect.top;
        if (this.pinchDist > 0) this.zoomAbout(px, py, d / this.pinchDist);
        // pan by midpoint delta (AC-d2)
        this.tx += (mid.x - this.pinchMidX); this.ty += (mid.y - this.pinchMidY);
        this.pinchDist = d; this.pinchMidX = mid.x; this.pinchMidY = mid.y;
        this.clamp(); this.apply();
      } else if (e.touches.length === 1 && this.scale > 1) {
        e.preventDefault(); // AC-d1: only hijack scroll when zoomed
        const t = e.touches[0];
        this.tx += t.clientX - this.lastX; this.ty += t.clientY - this.lastY;
        this.lastX = t.clientX; this.lastY = t.clientY;
        this.clamp(); this.apply();
      }
    }, { passive: false });

    this.on('touchend', (e) => {
      if (e.touches.length === 0) { // AC-e1: gesture fully ended
        if (this.pendingDoubleTap) { this.pendingDoubleTap = false; this.doubleTapToggle(this.lastTapX, this.lastTapY); }
        this.lastTapTime = Date.now();
        this.pinchDist = 0;
        this.idle();
      }
    });
  }

  private pendingDoubleTap = false;

  // [impl:uuid:7831f755-af9a-424d-9505-8bdbb92d6f84] R22.2 RbPanZoom.doubleTapToggle — mouse dblclick + touch double-tap parity
  private doubleTapToggle(clientX: number, clientY: number): void { // AC-d3
    const rect = this.viewport.getBoundingClientRect();
    if (this.scale > 1) { this.reset(); }
    else { this.scale = 1; this.tx = 0; this.ty = 0; this.zoomAbout(clientX - rect.left, clientY - rect.top, 2); }
  }

  /** AC-b3: zoom about (px,py) in viewport coords, keeping that point stationary. */
  zoomAbout(px: number, py: number, factor: number): void {
    const ns = Math.max(this.MIN, Math.min(this.MAX, this.scale * factor));
    const f = ns / this.scale;
    this.tx = px - f * (px - this.tx);
    this.ty = py - f * (py - this.ty);
    this.scale = ns;
    this.clamp(); this.apply();
  }

  private clamp(): void { // AC-b4
    const vw = this.viewport.clientWidth, vh = this.viewport.clientHeight;
    const minTx = Math.min(0, vw - vw * this.scale);
    const minTy = Math.min(0, vh - vh * this.scale);
    this.tx = Math.min(0, Math.max(minTx, this.tx));
    this.ty = Math.min(0, Math.max(minTy, this.ty));
    if (this.scale <= 1) { this.tx = 0; this.ty = 0; } // recenter
  }

  private apply(): void { // AC-b1
    this.content.style.transformOrigin = '0 0';
    this.content.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`;
    this.viewport.style.cursor = this.scale > 1 ? 'grab' : 'auto';
  }

  /** AC-e6 / reset to identity. */
  reset(): void { this.scale = 1; this.tx = 0; this.ty = 0; this.apply(); }

  private gesturing(): void { // AC-e5: disable iframe pointer capture mid-gesture
    this.content.querySelectorAll('iframe').forEach(f => (f as HTMLElement).style.pointerEvents = 'none');
  }
  private idle(): void {
    this.content.querySelectorAll('iframe').forEach(f => (f as HTMLElement).style.pointerEvents = '');
  }

  private dist(a: Touch, b: Touch): number { return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
  private mid(a: Touch, b: Touch): { x: number; y: number } { return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }; }

  destroy(): void { for (const off of this.boundoff) off(); this.boundoff = []; this.idle(); } // AC-e4
}
