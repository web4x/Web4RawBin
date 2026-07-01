/**
 * R25.2 / BUG1 — rb-webitem-detail: launcher card for ior:class:WebItem in the trace detail drawer.
 * Reuses the v0.6.87 scheme-launcher pattern: badge + name + url + an Open button
 * (window.open(url) → Mail.app for message:, Maps for maps:, etc) + a forward-ref to the source file.
 */
import { refUuid } from '../../../ts/shared/TraceModel.js';
import { scenarioBrowserLinkFromIor } from './detail-children.js'; // R26.2: universal 📄 Scenario link

function esc(s: string): string {
  return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

export class RbWebItemDetail extends HTMLElement {
  static get observedAttributes() { return ['ref', 'uuid']; }
  connectedCallback(): void { this.render(); }
  attributeChangedCallback(): void { if (this.isConnected) this.render(); }

  // [impl:uuid:2598da09-7b89-4939-92f6-9e916d645e3c] R25.2 RbWebItemDetail.render — WebItem launcher card
  render(): void {
    const ref = this.getAttribute('ref') || '';
    const uuid = this.getAttribute('uuid') || refUuid(ref);
    if (!uuid) { this.innerHTML = '<div class="dv-empty">WebItem not found</div>'; return; }
    this.innerHTML = '<div class="dv-empty">Loading…</div>';
    fetch(`/api/ior/ior:instance:${uuid}`).then(r => r.json()).then(data => {
      const m = (data.unit?.model || {}) as Record<string, unknown>;
      const url = String(m.url || '');
      const childUuid = String((((m.children as string[]) || [])[0]) || '').replace('ior:instance:', '');
      const src = childUuid ? `<div style="margin-top:18px;font-size:0.8rem"><a href="/scenario?ior=${esc(childUuid)}" style="color:#42a5f5;text-decoration:none">📎 Source file</a></div>` : '';
      this.innerHTML = `<div style="padding:32px 20px;text-align:center"><div style="font-size:3rem">${esc(String(m.badge || '🔗'))}</div>`
        + `<h3 style="color:white;margin:12px 0;font-size:0.95rem">${esc(String(m.name || url))}</h3>`
        + `<div style="word-break:break-all;color:#a1887f;font-size:0.75rem;margin-bottom:20px">${esc(url)}</div>`
        + (url ? `<a href="${esc(url)}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 28px;background:#ff9800;color:#000;border-radius:8px;text-decoration:none;font-weight:600">↗ Open</a>` : '')
        + `${src}${scenarioBrowserLinkFromIor(uuid)}</div>`; // R26.2: link to the scenario unit on disk`
    }).catch(() => { this.innerHTML = '<div class="dv-empty">Failed to load WebItem</div>'; });
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-webitem-detail')) {
  customElements.define('rb-webitem-detail', RbWebItemDetail);
}
