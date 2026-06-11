/**
 * T103 — rb-trace-view: minimal View web component (base for T105-T107).
 *
 * Object fields → component ATTRIBUTES (uuid/type/title/ref) — set/get round-trips (AC2).
 * Subscribes to ViewBus by its `ref` on connect → re-renders its region on notify (AC3);
 * unsubscribes on disconnect. Attribute change also re-renders (existing rb-* pattern).
 *
 * [impl:uuid:9ce0b153-0c3d-4749-aa57-954b359b797d] AC2 attributes / AC3 MVC view
 */
import { ViewBus } from './ViewBus.js';

export class RbTraceView extends HTMLElement {
  static get observedAttributes() { return ['uuid', 'type', 'title', 'ref']; }
  private unsub: (() => void) | null = null;

  connectedCallback(): void {
    this.render();
    const ref = this.getAttribute('ref');
    if (ref) this.unsub = ViewBus.subscribe(ref, () => this.render());
  }

  disconnectedCallback(): void {
    this.unsub?.();
    this.unsub = null;
  }

  attributeChangedCallback(name: string, _old: string | null, _new: string | null): void {
    if (!this.isConnected) return;
    // a changed ref re-binds the subscription
    if (name === 'ref') { this.unsub?.(); const ref = this.getAttribute('ref'); this.unsub = ref ? ViewBus.subscribe(ref, () => this.render()) : null; }
    this.render();
  }

  render(): void {
    const type = this.getAttribute('type') || '';
    const title = this.getAttribute('title') || '';
    const ref = this.getAttribute('ref') || '';
    this.innerHTML = `<div class="trace-view"><span class="tv-type">${type}</span><span class="tv-title">${esc(title)}</span><code class="tv-ref">${ref}</code></div>`;
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-trace-view')) {
  customElements.define('rb-trace-view', RbTraceView);
}
