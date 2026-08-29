/**
 * T158 — rb-method-detail: specialized DetailView for Method (verb) objects.
 * [impl:uuid:4b9b7203-ee0f-4d65-999f-264baf33ed01] R17 full chain
 */
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus, viewBusKey } from './ViewBus.js';
import { navigate } from './nav.js';
import { forwardOnly } from './forward-only.js';
import { renderSupersededSection, renderAllChildrenSection, renderChainPathSection } from './detail-superseded.js';
import { fetchDetailData, scenarioBrowserLinkFromIor, upsertSourceLink, upsertParentLink } from './detail-children.js';
import { RbDetailBase, type DetailCtx } from './rb-detail-base.js'; // R37.24 inc2: the ONE detail primitive (funnel + one-source) — extract-once, no per-element copy

export class RbMethodDetail extends RbDetailBase {
  // R37.24 inc2: funnel + one-source resolution live in RbDetailBase (extract-once). This element implements ONLY its type DOM.
  protected renderDetail({ uuid, model }: DetailCtx): void {
    this.innerHTML = `
      <div class="dv-head">
        <span class="dv-type-badge" style="background:rgba(198,40,40,0.25);color:#ef5350">Method</span>
        <h3>${esc(String(model.name || uuid))}</h3>
        <code class="dv-uuid">${uuid}</code>
        ${scenarioBrowserLinkFromIor(uuid)}
      </div>`;
    renderChainPathSection(this, uuid);
    fetchDetailData(uuid).then(({ children, parent, sourceFile, sourceLine }) => {
      upsertSourceLink(this, sourceFile, sourceLine); // R37.12 (B): idempotent — replace not stack
      upsertParentLink(this, parent);
      renderAllChildrenSection(this, children);
      renderSupersededSection(this, uuid);
    });
  }
}
function renderLinks(graph: TraceGraph | null, links: Record<string, string[]>): string {
  const rows: string[] = [];
  for (const [relation, refs] of Object.entries(links)) { for (const lref of refs) { const lobj = graph?.get(refUuid(lref)); rows.push(`<div class="dv-link" data-ref="${lref}"><span class="dv-rel">${relation}</span><span class="dv-link-title">${esc(lobj?.title || lref)}</span></div>`); } }
  return rows.join('') || '<div class="dv-empty">no links</div>';
}
function esc(s: string): string { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)); }
if (typeof customElements !== 'undefined' && !customElements.get('rb-method-detail')) { customElements.define('rb-method-detail', RbMethodDetail); }
