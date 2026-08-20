/**
 * BUG18 + R20.28 DRY — rb-file-detail: specialized DetailView for File units.
 * Embeds content-preview.ts (renderContentPreview + loadTextPreview + wireUrlActions).
 *
 * [impl:uuid:d932447e-7791-4ed8-98d6-517f2699a5ed] BUG18 File DetailView
 */
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus, viewBusKey } from './ViewBus.js';
import { navigate } from './nav.js';
import { fetchDetailData, scenarioBrowserLinkFromIor, upsertSourceLink, upsertParentLink } from './detail-children.js';
import { guessMimeFromName, fillPreviewPane } from './content-preview.js'; // R40.12: restore eager media render
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
        // R35.1 (A): non-media file preview stays toggle-driven by the universalActionBar 'preview-file' action (lazy
        // fillPreviewPane on first show — DRY, keeps large/other files behind a click). pz-reset shown only while open.
        this.querySelector('.pz-reset')?.addEventListener('click', () => pane.reset());
        // R40.12: MEDIA subtypes AUTO-RENDER on select again (ea7443e87's unification dropped the eager call → the
        // 75vh pane read as Tron's empty black box). Restore it for media + FAIL-LOUD (never a visible-but-empty pane).
        this.autoRenderMediaPreview(pane, uuid, mimeType, name, token);

        upsertSourceLink(this, sourceFile, sourceLine); // R37.12 (B): idempotent — replace not stack
        upsertParentLink(this, parent);

        if (ref) this.unsubs.push(ViewBus.subscribe(viewBusKey(ref), () => this.render()));
      }).catch(() => { this.innerHTML = '<div class="dv-empty">Failed to load file</div>'; });
    });
  }

  // R40.12 — File MEDIA subtypes render their player on SELECT (auto), restoring the S23 auto-render that ea7443e87's
  // file-preview unification dropped (it left the 75vh pane visible-but-unfilled = Tron's empty black box). Non-media
  // stays toggle-driven. FAIL-LOUD: an unfillable pane shows an explicit 'preview unavailable: <mime>', never empty.
  // [impl:uuid:aba7b795-7951-4294-af69-436f7c204d13] R40.12 RbFileDetail.autoRenderMediaPreview (converges into R40.11's generic type-driven view)
  private autoRenderMediaPreview(pane: RbPreviewPane, uuid: string, mimeType: string, name: string, token: string): void {
    const isMedia = /^(audio|video|image)\//.test(mimeType) || mimeType === 'application/pdf' || mimeType === 'text/html'
      || mimeType === 'text/uri-list' || name.endsWith('.url') || name.endsWith('.webloc');
    if (!isMedia) return;                                        // non-media: keep the toggle path (pane stays hidden)
    pane.style.display = '';                                     // show the pane so the media player is visible on select
    try { fillPreviewPane(pane, uuid, mimeType, name, token); }  // eager render (fillPreviewPane always fills → never empty)
    catch { pane.setContent(`<div style="padding:24px;color:#ff6b6b">⚠ preview unavailable: ${esc(mimeType || 'unknown type')}</div>`); } // FAIL-LOUD
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-file-detail')) {
  customElements.define('rb-file-detail', RbFileDetail);
}
