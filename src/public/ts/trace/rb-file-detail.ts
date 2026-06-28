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
import { guessMimeFromName } from './content-preview.js';
import './rb-preview-pane.js';
import type { RbPreviewPane } from './rb-preview-pane.js';

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

        const contentUrl = `/api/room/file/${uuid}/content${token ? '?token=' + encodeURIComponent(token) : ''}`;
        // R21.9 reorder: buttons TOP → 75vh preview MIDDLE → metadata BOTTOM
        this.innerHTML = `
          <div class="dv-head">
            <span class="dv-type-badge" style="background:rgba(78,52,46,0.25);color:#a1887f">File</span>
            <h3>${esc(name)}</h3>
            <code class="dv-uuid">${uuid}</code>
          </div>
          <div class="cv-actions" style="display:flex;gap:8px;margin:8px 0;flex-wrap:wrap">
            <button class="btn cv-newtab" style="flex:1;font-size:0.8rem">↗ New tab</button>
            <button class="btn pz-reset" style="flex:1;font-size:0.8rem">⤢ Reset zoom</button>
          </div>
          <rb-preview-pane></rb-preview-pane>
          <div class="dv-fields">
            ${mimeType ? `<div class="dv-field"><label>Type</label><span>${esc(mimeType)}</span></div>` : ''}
            ${size ? `<div class="dv-field"><label>Size</label><span>${sizeLabel}</span></div>` : ''}
            ${scenarioBrowserLinkFromIor(uuid)}
            <div class="dv-field"><a href="${editHref}" class="dv-file-link" style="color:#ff9800;font-size:0.75rem;text-decoration:none">✏️ Edit scenario</a></div>
          </div>
          <div class="dv-links"></div>`;

        const pane = this.querySelector('rb-preview-pane') as RbPreviewPane;
        this.fillPane(pane, uuid, mimeType, name, token, contentUrl);
        this.querySelector('.cv-newtab')?.addEventListener('click', () => window.open(contentUrl, '_blank'));
        this.querySelector('.pz-reset')?.addEventListener('click', () => pane.reset());

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

  /** R21.9: build the preview element by MIME and load it into the 75vh pan/zoom pane. */
  private fillPane(pane: RbPreviewPane, uuid: string, mimeType: string, name: string, token: string, contentUrl: string): void {
    const imgStyle = 'display:block;max-width:100%;height:auto';
    const frameStyle = 'width:100%;height:75vh;border:none;background:white';
    if (mimeType === 'image/svg+xml') {
      pane.setContent(`<object data="${contentUrl}" type="image/svg+xml" style="${imgStyle};background:white;border-radius:8px"></object>`);
    } else if (mimeType.startsWith('image/')) {
      pane.setContent(`<img src="${contentUrl}" alt="${esc(name)}" style="${imgStyle}">`);
    } else if (mimeType === 'application/pdf' || mimeType === 'text/html') {
      pane.setContent(`<iframe src="${contentUrl}" sandbox="allow-same-origin" style="${frameStyle}"></iframe>`);
    } else if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      pane.setContent('<pre style="margin:0;padding:12px;white-space:pre-wrap;color:#e0e0e0;font-size:0.8rem">Loading…</pre>');
      fetch(contentUrl).then(r => r.ok ? r.text() : Promise.reject()).then(txt => {
        pane.setContent(`<pre style="margin:0;padding:12px;white-space:pre-wrap;color:#e0e0e0;font-size:0.8rem">${esc(txt.slice(0, 20000))}</pre>`);
      }).catch(() => pane.setContent('<pre style="padding:12px;color:#a1887f">Failed to load</pre>'));
    } else {
      pane.setContent(`<a href="${contentUrl}" download="${esc(name)}" style="display:block;padding:24px;color:#ff9800">⬇ Download ${esc(name)}</a>`);
    }
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-file-detail')) {
  customElements.define('rb-file-detail', RbFileDetail);
}
