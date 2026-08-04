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

  // [impl:uuid:f8b113b7-29a9-400e-b3fa-f3be7e5798cf] R21.9 RbFileDetail.render — actions-first reorder + 75vh pan/zoom pane
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


        const contentUrl = `/api/room/file/${uuid}/content${token ? '?token=' + encodeURIComponent(token) : ''}`;
        // R21.9 reorder: buttons TOP → 75vh preview MIDDLE → metadata BOTTOM
        this.innerHTML = `
          <div class="dv-head">
            <span class="dv-type-badge" style="background:rgba(78,52,46,0.25);color:#a1887f">File</span>
            <h3>${esc(name)}</h3>
            <code class="dv-uuid">${uuid}</code>
          </div>
          <div class="cv-actions" data-uuid="${uuid}" data-token="${token || ''}" data-url="${esc(contentUrl)}" data-mime="${esc(mimeType)}" data-name="${esc(name)}" style="display:flex;gap:8px;margin:8px 0;flex-wrap:wrap">
            <button class="btn pz-reset" style="flex:1;font-size:0.8rem;display:none">⤢ Reset zoom</button>
          </div>
          <rb-preview-pane class="cv-preview-content" style="display:none"></rb-preview-pane>
          <div class="dv-fields">
            ${mimeType ? `<div class="dv-field"><label>Type</label><span>${esc(mimeType)}</span></div>` : ''}
            ${size ? `<div class="dv-field"><label>Size</label><span>${sizeLabel}</span></div>` : ''}
            ${scenarioBrowserLinkFromIor(uuid)}
          </div>
          <div class="dv-links"></div>`;

        const pane = this.querySelector('rb-preview-pane') as RbPreviewPane;
        // R35.1 (A): file preview is now toggle-driven by the universalActionBar 'preview-file' action — pane starts hidden
        // + .cv-preview-content, lazy fillPreviewPane on first show (ONE file-preview mechanism, DRY). New-tab bespoke button
        // REMOVED → 'open-newtab' reads cv-actions data-url. pz-reset (zoom) stays, shown only while the pane is open.
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
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-file-detail')) {
  customElements.define('rb-file-detail', RbFileDetail);
}
