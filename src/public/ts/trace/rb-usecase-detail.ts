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
import { ViewBus } from './ViewBus.js';
import { navigate } from './nav.js';
import { forwardOnly } from './forward-only.js';
import { singularChain, renderSingularChain } from './singular-chain.js';
import { renderSupersededSection, renderAllChildrenSection } from './detail-superseded.js';
import { fetchDetailData, renderParentLink, renderSourceLink, scenarioBrowserLinkFromIor } from './detail-children.js';

export class RbUseCaseDetail extends HTMLElement {
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
    if (!obj) { this.innerHTML = '<div class="dv-empty">Use case not found</div>'; return; }

    const chain = this.graph ? singularChain(this.graph, obj.uuid) : [];
    const links = forwardOnly(obj);
    this.innerHTML = `
      <div class="dv-head">
        <span class="dv-type-badge dv-type-usecase">Use Case</span>
        <h3>${esc(obj.title)}</h3>
        <code class="dv-uuid">${obj.uuid}</code>
      </div>
      <div class="dv-fields">
        ${obj.status ? `<div class="dv-field"><label>Status</label><span class="dv-status-badge">${esc(obj.status)}</span></div>` : ''}
        ${scenarioBrowserLinkFromIor(obj.uuid)}
      </div>
      <div class="dv-links">
        <h4>Traceability Chain</h4>
        ${renderSingularChain(chain, obj.uuid)}
        <h4>Forward Links</h4>
        ${renderLinks(this.graph, links)}
      </div>`;

    this.unsubs.push(ViewBus.subscribe(ref, () => this.render()));
    this.querySelectorAll('.dv-link').forEach(row => {
      row.addEventListener('click', () => {
        const lref = (row as HTMLElement).dataset.ref!;
        navigate(lref.split(':')[0], 'show', { uuid: refUuid(lref) });
      });
    });
    fetchDetailData(obj.uuid).then(({ children, parent, sourceFile, sourceLine }) => {
      if (sourceFile) { const sh = this.querySelector(".dv-head"); if (sh) sh.insertAdjacentHTML("beforeend", renderSourceLink(sourceFile, sourceLine)); } if (parent) { const h = this.querySelector('.dv-head'); if (h) { h.insertAdjacentHTML('afterend', renderParentLink(parent)); this.querySelector('.dv-parent-link')?.addEventListener('click', (e) => { e.preventDefault(); navigate(parent.type.toLowerCase(), 'show', { uuid: parent.uuid }); }); } }

      renderAllChildrenSection(this, children);
      renderSupersededSection(this, obj.uuid);
    });
  }
}

function renderLinks(graph: TraceGraph | null, links: Record<string, string[]>): string {
  const rows: string[] = [];
  for (const [relation, refs] of Object.entries(links)) {
    for (const lref of refs) {
      const lobj = graph?.get(refUuid(lref));
      rows.push(`<div class="dv-link" data-ref="${lref}"><span class="dv-rel">${relation}</span><span class="dv-link-title">${esc(lobj?.title || lref)}</span></div>`);
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
