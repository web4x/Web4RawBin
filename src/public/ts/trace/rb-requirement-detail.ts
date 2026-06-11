/**
 * T111 — rb-requirement-detail: specialized DetailView for Requirement objects.
 *
 * Shows full requirement text (word-wrap), status, and traceability chain
 * links to tasks, use cases, tests, implementations.
 *
 * [impl:uuid:e1ad6c89-269b-47d2-96b5-1fa356cbc226] R16.2 RequirementDetailView
 */
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus } from './ViewBus.js';
import { navigate } from './nav.js';
import { forwardOnly } from './forward-only.js';
// [impl:uuid:660cb423-30cd-4d32-8a3f-d7bad22f6f5e] RbRequirementDetail.render
import { singularChain, renderSingularChain } from './singular-chain.js';
import { fetchDetailData, renderParentLink, renderSourceLink } from './detail-children.js';

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

    const chain = this.graph ? singularChain(this.graph, obj.uuid) : [];
    const links = forwardOnly(obj);
    this.innerHTML = `
      <div class="dv-head">
        <span class="dv-type-badge dv-type-requirement">Requirement</span>
        <h3>${esc(obj.title)}</h3>
        <code class="dv-uuid">${obj.uuid}</code>
      </div>
      <div class="dv-fields">
        ${obj.status ? `<div class="dv-field"><label>Status</label><span class="dv-status-badge">${esc(obj.status)}</span></div>` : ''}
        <div class="dv-field"><a href="/scenario?ior=${obj.uuid}" class="dv-file-link" style="color:#ff9800;font-size:0.75rem;text-decoration:none">📄 Scenario view</a></div>
      </div>
      <div class="dv-links">
        <h4>Champagne Chain</h4>
        ${renderSingularChain(chain)}
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
      if (children.length > 0) { const l = this.querySelector('.dv-links'); if (l) l.insertAdjacentHTML('afterend', `<div style="border-top:1px solid rgba(255,255,255,0.1);margin-top:8px;padding-top:8px"><h4 style="font-size:0.75rem;color:rgba(255,255,255,0.5)">All children</h4>${children.map(c => `<div class="dv-link dv-sc" data-ref="${c.type.toLowerCase()}:${c.uuid}"><span class="dv-rel">${c.type}</span><span class="dv-link-title">${c.name}</span></div>`).join('')}</div>`); this.querySelectorAll('.dv-sc').forEach(row => row.addEventListener('click', () => { const r = (row as HTMLElement).dataset.ref!; navigate(r.split(':')[0], 'show', { uuid: r.split(':')[1] || '' }); })); }
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

if (typeof customElements !== 'undefined' && !customElements.get('rb-requirement-detail')) {
  customElements.define('rb-requirement-detail', RbRequirementDetail);
}
