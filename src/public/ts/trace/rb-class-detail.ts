/**
// [impl:uuid:ac1f9cfc-2fd2-423d-a48a-d1b28b656800] RbClassDetail.renderAll
 * T158 — rb-class-detail: specialized DetailView for Class (noun) objects.
 * Shows source file, methods list, use case links.
 *
 * [impl:uuid:4b9b7203-ee0f-4d65-999f-264baf33ed01] R17 full chain
 */
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus } from './ViewBus.js';
import { navigate } from './nav.js';
import { forwardOnly } from './forward-only.js';
import { renderSupersededSection, renderAllChildrenSection } from './detail-superseded.js';
import { fetchDetailData, renderParentLink, renderSourceLink, scenarioBrowserLinkFromIor } from './detail-children.js';

export class RbClassDetail extends HTMLElement {
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
    if (!obj) { this.innerHTML = '<div class="dv-empty">Class not found</div>'; return; }

    this.innerHTML = `
      <div class="dv-head">
        <span class="dv-type-badge" style="background:rgba(106,27,154,0.25);color:#ab47bc">Class</span>
        <h3>${esc(obj.title)}</h3>
        <code class="dv-uuid">${obj.uuid}</code>
        ${scenarioBrowserLinkFromIor(obj.uuid)}
      </div>
      <div class="dv-links">
        <h4>Traceability Chain (narrowed)</h4>
        <div class="dv-chain-loading" style="color:rgba(255,255,255,0.4);font-size:0.75rem">Loading...</div>
      </div>`;
    fetch(`/api/trace/children/${encodeURIComponent(obj.uuid)}?mode=trace`).then(r => r.json()).then(data => {
      const chain = this.querySelector('.dv-chain-loading');
      if (!chain) return;
      const children = data.children || [];
      if (children.length === 0) { chain.textContent = 'no narrowed children'; return; }
      chain.outerHTML = children.map((c: any) => `<div class="dv-link" data-ref="${c.type.toLowerCase()}:${c.uuid}"><span class="dv-rel">${c.type}</span><span class="dv-link-title">${esc(c.name)}</span></div>`).join('');
      this.querySelectorAll('.dv-links .dv-link').forEach(row => row.addEventListener('click', () => { const r = (row as HTMLElement).dataset.ref!; navigate(r.split(':')[0], 'show', { uuid: r.split(':')[1] || '' }); }));
    }).catch(() => { const c = this.querySelector('.dv-chain-loading'); if (c) c.textContent = 'failed to load'; });

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

const CHAIN_TYPES = new Set(['requirement', 'usecase', 'class', 'method', 'implementation', 'test', 'bug', 'changerequest']);
function renderLinks(graph: TraceGraph | null, links: Record<string, string[]>): string {
  const rows: string[] = [];
  for (const [relation, refs] of Object.entries(links)) {
    for (const lref of refs) {
      const lobj = graph?.get(refUuid(lref));
      const ltype = lref.split(':')[0];
      if (!CHAIN_TYPES.has(ltype)) continue;
      rows.push(`<div class="dv-link" data-ref="${lref}"><span class="dv-rel">${relation}</span><span class="dv-link-title">${esc(lobj?.title || lref)}</span></div>`);
    }
  }
  return rows.join('') || '<div class="dv-empty">no links</div>';
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-class-detail')) {
  customElements.define('rb-class-detail', RbClassDetail);
}
