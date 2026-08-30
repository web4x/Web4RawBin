/**
 * BUG18 + R20.28 DRY — rb-file-detail: specialized DetailView for File units.
 * R37.24-CONVERGENCE (Phase A, architect design 19c340d4f): NOW extends RbDetailBase — the render FUNNEL, the ONE
 * model-source (graph obj ELSE /api/ior fetch), and the fail-LOUD renderUnresolved all live in the base (extract-once,
 * no per-element copy). This element implements ONLY its File-specific DOM via renderDetail(ctx). Deleted: its own
 * connectedCallback/attributeChangedCallback funnel, its own fetch(/api/ior) unit-model source, and its own not-found
 * paths (File not found / File unit not found / Failed to load file) — a genuine 404 is the base's honest-empty '⚠
 * unresolved' BEFORE renderDetail runs. A SUPPLEMENTAL fetch (children/source-links, media bytes) degrades ITS OWN
 * section inline (visible), never a silent whole-element fail, never a 2nd not-found path (architect boundary).
 *
 * [impl:uuid:d932447e-7791-4ed8-98d6-517f2699a5ed] BUG18 File DetailView (carried onto renderDetail — R37.24 convergence)
 */
import { fetchDetailData, scenarioBrowserLinkFromIor, upsertSourceLink, upsertParentLink } from './detail-children.js';
import { guessMimeFromName, fillPreviewPane } from './content-preview.js'; // R40.12: restore eager media render
import './rb-preview-pane.js';
import type { RbPreviewPane } from './rb-preview-pane.js';
import { RbDetailBase, type DetailCtx } from './rb-detail-base.js'; // R37.24 inc2: the ONE detail primitive (funnel + one-source + fail-loud)

export class RbFileDetail extends RbDetailBase {
  // R37.24 inc2: the funnel + one-model-source + honest-empty-on-unresolved live in RbDetailBase (extract-once). This
  // element implements ONLY its File DOM from the resolved ctx — no funnel, no unit fetch, no not-found path here.
  // [impl:uuid:f8b113b7-29a9-400e-b3fa-f3be7e5798cf] R21.9 RbFileDetail.renderDetail — actions-first reorder + 75vh pan/zoom pane (carried onto renderDetail — R37.24 convergence)
  protected renderDetail({ uuid, model }: DetailCtx): void {
    const m = model || {};
    const name = String(m.name || uuid.slice(0, 8));
    const mimeType = String(m.mimeType || m.contentType || guessMimeFromName(name) || '');
    const size = Number(m.size || 0);
    const token = String(m.uploaderToken || '');
    const sizeLabel = size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`;
    const contentUrl = `/api/room/file/${uuid}/content${token ? '?token=' + encodeURIComponent(token) : ''}`;

    // R21.9 reorder: buttons TOP → 75vh preview MIDDLE → metadata BOTTOM
    this.innerHTML = `
      <div class="dv-head">
        <span class="dv-type-badge" style="background:rgba(78,52,46,0.25);color:#a1887f">File</span>
        <h3>${esc(name)}</h3>
        <code class="dv-uuid">${uuid}</code>
      </div>
      <div class="cv-actions" data-uuid="${uuid}" data-token="${esc(token)}" data-url="${esc(contentUrl)}" data-mime="${esc(mimeType)}" data-name="${esc(name)}" style="display:flex;gap:8px;margin:8px 0;flex-wrap:wrap">
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
    // R35.1 (A): non-media file preview stays toggle-driven by the universalActionBar 'preview-file' action; pz-reset shown only while open.
    this.querySelector('.pz-reset')?.addEventListener('click', () => pane.reset());
    // R40.12: MEDIA subtypes AUTO-RENDER on select + FAIL-LOUD (never a visible-but-empty pane).
    this.autoRenderMediaPreview(pane, uuid, mimeType, name, token);

    // SUPPLEMENTAL (children/source/parent links) — DEGRADES ITS OWN SECTION inline; a failure here leaves the head +
    // preview + fields intact (the MODEL fail-loud is the base's, this is a linked-section-only enrichment).
    fetchDetailData(uuid).then(({ sourceFile, sourceLine, parent }) => {
      upsertSourceLink(this, sourceFile, sourceLine); // R37.12 (B): idempotent — replace not stack
      upsertParentLink(this, parent);
    }).catch(() => { /* supplemental-only: the head/preview already rendered from the base-resolved model */ });
  }

  // R40.12 — File MEDIA subtypes render their player on SELECT (auto); non-media stays toggle-driven. FAIL-LOUD: an
  // unfillable pane shows an explicit 'preview unavailable: <mime>', never empty (degrades THIS section, not the element).
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
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-file-detail')) {
  customElements.define('rb-file-detail', RbFileDetail);
}
