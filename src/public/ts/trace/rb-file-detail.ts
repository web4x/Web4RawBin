/**
 * BUG18 + R20.28 DRY — rb-file-detail: specialized DetailView for File units.
 * Embeds content-preview.ts (renderContentPreview + loadTextPreview + wireUrlActions).
 *
 * [impl:uuid:d932447e-7791-4ed8-98d6-517f2699a5ed] BUG18 File DetailView
 */
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus } from './ViewBus.js';
import { navigate } from './nav.js';
import { fetchDetailData, renderParentLink, renderSourceLink, scenarioBrowserLinkFromIor } from './detail-children.js';
import { renderContentPreview, loadTextPreview, wireUrlActions, guessMimeFromName } from './content-preview.js';

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
        const mimeType = m.mimeType || m.contentType || guessMimeFromName(name) || '';
        const size = m.size || 0;
        const token = m.uploaderToken || '';
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
          </div>
          <div class="dv-links"></div>`;

        // Embed content-preview.ts (DRY — same buttons as room file view)
        const previewHtml = renderContentPreview(uuid, mimeType, name, token);
        const previewDiv = document.createElement('div');
        previewDiv.className = 'dv-content-preview';
        previewDiv.innerHTML = previewHtml;
        this.querySelector('.dv-fields')?.insertAdjacentElement('afterend', previewDiv);
        loadTextPreview(previewDiv, uuid, token);
        wireUrlActions(previewDiv);

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

        if (ref) this.unsubs.push(ViewBus.subscribe(ref, () => this.render()));
      }).catch(() => { this.innerHTML = '<div class="dv-empty">Failed to load file</div>'; });
    });
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-file-detail')) {
  customElements.define('rb-file-detail', RbFileDetail);
}
