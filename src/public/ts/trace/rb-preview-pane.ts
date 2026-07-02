/**
 * R21.9 — rb-preview-pane: a 75vh in-flow preview viewport with pan/zoom (RbPanZoom).
 * NOT position:fixed (AC-a5) — it never intercepts taps outside its box. The inner
 * .pz-viewport (overflow:hidden) is the ONLY gesture surface (AC-e3); .pz-content holds
 * the previewed element (img/pre/iframe — AC-f1). setContent() tears down the old
 * controller before wiring a new one (AC-e4) and resets transform on file change (AC-e6).
 */
import { RbPanZoom } from './pan-zoom.js';

export class RbPreviewPane extends HTMLElement {
  private pz: RbPanZoom | null = null;

  connectedCallback(): void {
    if (this.querySelector('.pz-viewport')) return;
    this.style.cssText = 'display:block;height:75vh;overflow:hidden;border-radius:8px;background:rgba(0,0,0,0.25)';
    this.innerHTML = `<div class="pz-viewport" style="width:100%;height:100%;overflow:hidden;touch-action:none;position:relative"><div class="pz-content" style="width:100%;height:100%"></div></div>`;
  }

  /** Replace the previewed content (HTML string) and (re)init pan/zoom. */
  setContent(html: string): void {
    if (!this.querySelector('.pz-viewport')) this.connectedCallback();
    const viewport = this.querySelector('.pz-viewport') as HTMLElement;
    const content = this.querySelector('.pz-content') as HTMLElement;
    this.pz?.destroy(); this.pz = null;        // AC-e4 teardown before re-wire
    content.innerHTML = html;
    this.pz = new RbPanZoom(viewport, content); // resets to {1,0,0} (AC-e6)
  }

  /** Reset pan/zoom to identity (fit). */
  reset(): void { this.pz?.reset(); }

  disconnectedCallback(): void { this.pz?.destroy(); this.pz = null; }
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-preview-pane')) {
  customElements.define('rb-preview-pane', RbPreviewPane);
}
