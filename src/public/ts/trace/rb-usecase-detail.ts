/**
 * T111 — rb-usecase-detail: specialized DetailView for UseCase objects.
 *
 * Shows Object.verb name prominently, originating requirement links,
 * and implementing class + method links.
 *
// [impl:uuid:0c0ab5d2-3200-40a6-9d1f-ca9755ce6d89] R16.2 UseCaseDetailView (split for RbUseCaseDetail.render)
 * [impl:uuid:e1ad6c89-269b-47d2-96b5-1fa356cbc226] R16.2 UseCaseDetailView
 */
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus, viewBusKey } from './ViewBus.js';
import { navigate } from './nav.js';
import { forwardOnly } from './forward-only.js';
import { renderSupersededSection, renderAllChildrenSection, renderChainPathSection } from './detail-superseded.js';
import { fetchDetailData, scenarioBrowserLinkFromIor, scenarioBrowserHref, upsertSourceLink, upsertParentLink } from './detail-children.js';
import { RbDetailBase, type DetailCtx } from './rb-detail-base.js'; // R37.24 inc2: the ONE detail primitive (funnel + one-source) — extract-once, no per-element copy

export class RbUseCaseDetail extends RbDetailBase {
  // R37.24 inc2: funnel + one-source resolution live in RbDetailBase (extract-once). This element implements ONLY its type DOM.
  protected renderDetail({ uuid, obj, model }: DetailCtx): void {
    const links = obj ? forwardOnly(obj) : {};
    this.innerHTML = `
      <div class="dv-head">
        <span class="dv-type-badge dv-type-usecase">Use Case</span>
        <h3>${esc(String(model.name || uuid))}</h3>
        <code class="dv-uuid">${uuid}</code>
      </div>
      <div class="dv-fields">
        ${model.status ? `<div class="dv-field"><label>Status</label><span class="dv-status-badge">${esc(String(model.status))}</span></div>` : ''}
        ${scenarioBrowserLinkFromIor(uuid)}
      </div>
      <div class="dv-links">
        <h4>Forward Links</h4>
        ${renderLinks(this.graph, links)}
      </div>`;

    fetchDetailData(uuid).then(({ children, parent, sourceFile, sourceLine }) => {
      upsertSourceLink(this, sourceFile, sourceLine); upsertParentLink(this, parent); // R37.12 (B): idempotent — replace not stack
      renderChainPathSection(this, uuid);
      renderAllChildrenSection(this, children);
      renderSupersededSection(this, uuid);
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

if (typeof customElements !== 'undefined' && !customElements.get('rb-usecase-detail')) {
  customElements.define('rb-usecase-detail', RbUseCaseDetail);
}
