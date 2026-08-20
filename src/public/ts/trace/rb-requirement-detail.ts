// [impl:uuid:9846e4d2-b1d6-4c2e-a77d-77b33a48460d] RbRequirementDetail.renderTronQuote impl
/**
 * T111 — rb-requirement-detail: specialized DetailView for Requirement objects.
 *
 * Shows full requirement text (word-wrap), status, and traceability chain
 * links to tasks, use cases, tests, implementations.
 *
 * [impl:uuid:e1ad6c89-269b-47d2-96b5-1fa356cbc226] R16.2 RequirementDetailView
 */
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus, viewBusKey } from './ViewBus.js';
import { navigate } from './nav.js';
import { forwardOnly } from './forward-only.js';
// [impl:uuid:7fcca3cf-7c87-4a3d-a64b-089c6d92cc0a] RbRequirementDetail.render impl
// [impl:uuid:660cb423-30cd-4d32-8a3f-d7bad22f6f5e] RbRequirementDetail.render
import { renderSupersededSection, renderAllChildrenSection, renderChainPathSection } from './detail-superseded.js';
import { fetchDetailData, scenarioBrowserLinkFromIor, scenarioBrowserHref, upsertSourceLink, upsertParentLink } from './detail-children.js';
import { upsertSection } from './detail-render.js'; // R37.12 (B): idempotent section insert for the CR-reason field

export class RbRequirementDetail extends HTMLElement {
  graph: TraceGraph | null = null;
  static get observedAttributes() { return ['ref']; }
  private unsubs: Array<() => void> = [];

  connectedCallback(): void { this.render(); }
  disconnectedCallback(): void { this.clearSubs(); }
  attributeChangedCallback(): void { if (this.isConnected) this.render(); }

  private clearSubs(): void { for (const u of this.unsubs) u(); this.unsubs = []; }

  render(): void {
    this.clearSubs();
    const ref = this.getAttribute('ref') || '';
    const obj = this.graph?.get(refUuid(ref));
    if (!obj) { this.innerHTML = '<div class="dv-empty">Requirement not found</div>'; return; }

    const links = forwardOnly(obj);
    this.innerHTML = `
      <div class="dv-head">
        <span class="dv-type-badge dv-type-requirement">Requirement</span>
        <h3>${esc(obj.title)}</h3>
        <code class="dv-uuid">${obj.uuid}</code>
      </div>
      <div class="dv-fields">
        ${obj.status ? `<div class="dv-field"><label>Status</label><span class="dv-status-badge">${esc(obj.status)}</span></div>` : ''}
        ${scenarioBrowserLinkFromIor(obj.uuid)}
      </div>
      <div class="dv-links">
        <h4>Forward Links</h4>
        ${renderLinks(this.graph, links)}
      </div>`;

    this.unsubs.push(ViewBus.subscribe(viewBusKey(ref), () => this.render()));
    // R40.10 BUG A: a ChangeRequest carries a `reason` the owner typed on decline — render it PROMINENTLY (top of fields).
    // REUSE (no fork): this same detail serves Requirement + ChangeRequest (RequirementTemplate); reason shows only when present.
    fetch(`/api/ior/ior:instance:${obj.uuid}`).then(r => r.ok ? r.json() : null).then(j => {
      const reason = j?.unit?.model?.reason;
      upsertSection(this, 'dv-cr-reason', reason ? `<div class="dv-field dv-cr-reason"><label>Reason</label><div style="white-space:pre-wrap;color:#e6edf3;font-size:0.85rem;margin-top:4px;padding:8px 10px;background:#161b22;border-radius:6px;border-left:3px solid #fb8c00">${esc(String(reason))}</div></div>` : null, this.querySelector('.dv-fields'), 'afterbegin'); // R37.12 (B): idempotent — replace not stack
    }).catch(() => { /* reason best-effort */ });
    fetchDetailData(obj.uuid).then(({ children, parent, sourceFile, sourceLine }) => {
      upsertSourceLink(this, sourceFile, sourceLine); upsertParentLink(this, parent); // R37.12 (B): idempotent — replace not stack

      renderChainPathSection(this, obj.uuid);
      renderAllChildrenSection(this, children);
      renderSupersededSection(this, obj.uuid);
    });
  }
}

const CHAIN_TYPES = new Set(['requirement', 'usecase', 'class', 'method', 'implementation', 'test', 'bug', 'changerequest']);
function renderLinks(graph: TraceGraph | null, links: Record<string, string[]>): string {
  const rows: string[] = [];
  for (const [relation, refs] of Object.entries(links)) {
    for (const lref of refs) {
      const lobj = graph?.get(refUuid(lref));
      const ltype = lref.split(':')[0];
      if (!CHAIN_TYPES.has(ltype)) continue;
      rows.push(`<a class="dv-link" href="${scenarioBrowserHref(refUuid(lref))}" style="display:block;color:#ff9800;text-decoration:none"><span class="dv-rel">${relation}</span><span class="dv-link-title">${esc(lobj?.title || lref)}</span></a>`);
    }
  }
  return rows.join('') || '<div class="dv-empty">no links</div>';
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-requirement-detail')) {
  customElements.define('rb-requirement-detail', RbRequirementDetail);
}
