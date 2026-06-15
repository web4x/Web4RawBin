/**
 * BUG18 — rb-file-detail: specialized DetailView for File scenario units.
 * Shows file name, mimeType, size, content preview, browse/edit/source links.
 *
 * [impl:uuid:d932447e-7791-4ed8-98d6-517f2699a5ed] BUG18 File DetailView
 */
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus } from './ViewBus.js';
import { navigate } from './nav.js';
import { fetchDetailData, renderParentLink, renderSourceLink, scenarioBrowserLinkFromIor } from './detail-children.js';

export class RbFileDetail extends HTMLElement {
  graph: TraceGraph | null = null;
  static get observedAttributes() { return ['ref', 'uuid']; }
  private unsubs: Array<() => void> = [];

  connectedCallback(): void { this.render(); }
  disconnectedCallback(): void { for (const u of this.unsubs) u(); this.unsubs = []; }
  attributeChangedCallback(): void { if (this.isConnected) this.render(); }

  render(): void {
    for (const u of this.unsubs) u(); this.unsubs = [];
    const ref = this.getAttribute('ref') || '';
    const uuid = this.getAttribute('uuid') || refUuid(ref);
    if (!uuid) { this.innerHTML = '<div class="dv-empty">File not found</div>'; return; }

    this.innerHTML = '<div class="dv-empty">Loading file…</div>';

    fetchDetailData(uuid).then(({ children, parent, sourceFile, sourceLine }) => {
      fetch(`/api/ior/ior:instance:${uuid}`).then(r => r.json()).then(data => {
        const unit = data.unit;
        if (!unit) { this.innerHTML = '<div class="dv-empty">File unit not found</div>'; return; }
        const m = unit.model || {};
        const name = m.name || uuid.slice(0, 8);
        const mimeType = m.mimeType || '';
        const size = m.size || 0;
        const sizeLabel = size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`;

        const hex = uuid.replace(/-/g, '');
        const shard = `${hex[0]}/${hex[1]}/${hex[2]}/${hex[3]}/${hex[4]}`;
        const editHref = `/edit/scenario/index/${shard}/${uuid}.scenario.json`;

        this.innerHTML = `
          <div class="dv-head">
            <span class="dv-type-badge" style="background:rgba(78,52,46,0.25);color:#a1887f">File</span>
            <h3>${esc(name)}</h3>
            <code class="dv-uuid">${uuid}</code>
          </div>
          <div class="dv-fields">
            ${mimeType ? `<div class="dv-field"><label>Type</label><span>${esc(mimeType)}</span></div>` : ''}
            ${size ? `<div class="dv-field"><label>Size</label><span>${sizeLabel}</span></div>` : ''}
            ${scenarioBrowserLinkFromIor(uuid)}
            <div class="dv-field"><a href="${editHref}" class="dv-file-link" style="color:#ff9800;font-size:0.75rem;text-decoration:none">✏️ Edit scenario</a></div>
            <div class="dv-field dv-file-actions" style="display:flex;gap:8px;margin-top:4px">
              <button class="btn-file-preview" style="background:rgba(102,126,234,0.15);color:#667eea;border:none;padding:4px 10px;border-radius:6px;font-size:0.75rem;cursor:pointer">👁 Preview</button>
              <a href="/api/file-content/${uuid}" target="_blank" rel="noopener" class="btn-file-newtab" style="background:rgba(255,152,0,0.15);color:#ffa726;border:none;padding:4px 10px;border-radius:6px;font-size:0.75rem;cursor:pointer;text-decoration:none;display:inline-block">↗ Open in new tab</a>
            </div>
          </div>
          <div id="file-preview-${uuid}" class="dv-preview" style="display:none"></div>
          <div class="dv-links"></div>`;

        if (sourceFile) {
          const sh = this.querySelector('.dv-head');
          if (sh) sh.insertAdjacentHTML('beforeend', renderSourceLink(sourceFile, sourceLine));
        }
        if (parent) {
          const h = this.querySelector('.dv-head');
          if (h) {
            h.insertAdjacentHTML('afterend', renderParentLink(parent));
            this.querySelector('.dv-parent-link')?.addEventListener('click', (e) => {
              e.preventDefault();
              navigate(parent.type.toLowerCase(), 'show', { uuid: parent.uuid });
            });
          }
        }

        const previewEl = document.getElementById(`file-preview-${uuid}`);
        const previewBtn = this.querySelector('.btn-file-preview');
        if (previewBtn && previewEl) {
          previewBtn.addEventListener('click', () => {
            if (previewEl.style.display === 'none') {
              previewEl.style.display = '';
              if (!previewEl.dataset.loaded) {
                previewEl.dataset.loaded = '1';
                if (mimeType.startsWith('image/')) {
                  previewEl.innerHTML = `<div style="text-align:center;padding:12px"><img src="/api/file-content/${uuid}" style="max-width:100%;max-height:400px;border-radius:8px" alt="${esc(name)}"></div>`;
                } else {
                  this.loadTextPreview(uuid, name);
                }
              }
              (previewBtn as HTMLElement).textContent = '👁 Hide preview';
            } else {
              previewEl.style.display = 'none';
              (previewBtn as HTMLElement).textContent = '👁 Preview';
            }
          });
        }

        if (ref) this.unsubs.push(ViewBus.subscribe(ref, () => this.render()));
      }).catch(() => { this.innerHTML = '<div class="dv-empty">Failed to load file</div>'; });
    });
  }

  private loadTextPreview(uuid: string, name: string): void {
    fetch(`/api/file-content/${uuid}`).then(r => {
      if (!r.ok) return;
      return r.text();
    }).then(text => {
      if (!text) return;
      const preview = document.getElementById(`file-preview-${uuid}`);
      if (!preview) return;
      const truncated = text.length > 2000 ? text.slice(0, 2000) + '\n…(truncated)' : text;
      preview.innerHTML = `<pre style="background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;overflow-x:auto;font-size:0.75rem;max-height:300px;overflow-y:auto"><code>${esc(truncated)}</code></pre>`;
    }).catch(() => {});
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-file-detail')) {
  customElements.define('rb-file-detail', RbFileDetail);
}
