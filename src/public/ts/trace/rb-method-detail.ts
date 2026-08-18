/**
 * T158 — rb-method-detail: specialized DetailView for Method (verb) objects.
 * [impl:uuid:4b9b7203-ee0f-4d65-999f-264baf33ed01] R17 full chain
 */
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus, viewBusKey } from './ViewBus.js';
import { navigate } from './nav.js';
import { forwardOnly } from './forward-only.js';
import { renderSupersededSection, renderAllChildrenSection, renderChainPathSection } from './detail-superseded.js';
import { fetchDetailData, renderParentLink, renderSourceLink, scenarioBrowserLinkFromIor } from './detail-children.js';

export class RbMethodDetail extends HTMLElement {
  graph: TraceGraph | null = null;
  static get observedAttributes() { return ['ref']; }
  private unsubs: Array<() => void> = [];
  connectedCallback(): void { this.render(); }
  disconnectedCallback(): void { for (const u of this.unsubs) u(); this.unsubs = []; }
  attributeChangedCallback(): void { if (this.isConnected) this.render(); }
  render(): void {
    for (const u of this.unsubs) u(); this.unsubs = [];
    const ref = this.getAttribute('ref') || '';
    const obj = this.graph?.get(refUuid(ref));
    if (!obj) { this.innerHTML = '<div class="dv-empty">Method not found</div>'; return; }
    const links = forwardOnly(obj);
    this.innerHTML = `
      <div class="dv-head">
        <span class="dv-type-badge" style="background:rgba(198,40,40,0.25);color:#ef5350">Method</span>
        <h3>${esc(obj.title)}</h3>
        <code class="dv-uuid">${obj.uuid}</code>
        ${scenarioBrowserLinkFromIor(obj.uuid)}
      </div>
      </div>`;
    renderChainPathSection(this, obj.uuid);
    this.unsubs.push(ViewBus.subscribe(viewBusKey(ref), () => this.render()));
    this.querySelectorAll('.dv-link').forEach(row => {
      row.addEventListener('click', () => { const lref = (row as HTMLElement).dataset.ref!; navigate(lref.split(':')[0], 'show', { uuid: refUuid(lref) }); });
    });
    fetchDetailData(obj.uuid).then(({ children, parent, sourceFile, sourceLine }) => {
      if (sourceFile) { const sh = this.querySelector('.dv-head'); if (sh) sh.insertAdjacentHTML('beforeend', renderSourceLink(sourceFile, sourceLine)); }
      if (parent) { const h = this.querySelector('.dv-head'); if (h) { h.insertAdjacentHTML('afterend', renderParentLink(parent)); this.querySelector('.dv-parent-link')?.addEventListener('click', (e) => { e.preventDefault(); navigate(parent.type.toLowerCase(), 'show', { uuid: parent.uuid }); }); } }

      renderAllChildrenSection(this, children);
      renderSupersededSection(this, obj.uuid);
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
