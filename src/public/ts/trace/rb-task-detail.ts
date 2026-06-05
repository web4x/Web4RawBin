/**
 * T111 — rb-task-detail: specialized DetailView for Task objects.
 *
 * Shows status badge, sprint, owner, and traceability chain links.
 * Renders inside rb-detail-drawer (T110). Self-registers as custom element.
 *
 * [impl:uuid:b1113a7d-8e15-4f02-c3b9-2a1f7d4e0c61] R16.2 TaskDetailView
 */
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus } from './ViewBus.js';
import { navigate } from './nav.js';
import { forwardOnly } from './forward-only.js';
import { fetchDetailData, renderParentLink, renderSourceLink } from './detail-children.js';

export class RbTaskDetail extends HTMLElement {
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
    if (!obj) { this.innerHTML = '<div class="dv-empty">Task not found</div>'; return; }

    const links = forwardOnly(obj);
    this.innerHTML = `
      <div class="dv-head">
        <span class="dv-type-badge dv-type-task">Task</span>
        <h3>${esc(obj.title)}</h3>
        <code class="dv-uuid">${obj.uuid}</code>
      </div>
      <div class="dv-fields">
        <div class="dv-field"><label>Status</label>
          <span class="dv-status-badge">${esc(obj.status || 'PLANNED')}</span></div>
        ${obj.sprint ? `<div class="dv-field"><label>Sprint</label><span>${esc(obj.sprint)}</span></div>` : ''}
        <div class="dv-field"><a href="/scenario?ior=${obj.uuid}" class="dv-file-link" style="color:#ff9800;font-size:0.75rem;text-decoration:none">📄 Scenario view</a></div>
      </div>
      <div class="dv-links">
        <h4>Traceability Chain</h4>
        ${renderLinks(this.graph, links)}
      </div>`;

    this.unsubs.push(ViewBus.subscribe(ref, () => this.render()));
    this.querySelectorAll('.dv-link').forEach(row => {
      row.addEventListener('click', () => {
        const lref = (row as HTMLElement).dataset.ref!;
        navigate(lref.split(':')[0], 'show', { uuid: refUuid(lref) });
      });
    });
    this.loadDetailData(obj.uuid);
  }

  private loadDetailData(uuid: string): void {
    fetchDetailData(uuid).then(({ children, parent, sourceFile, sourceLine }) => {
      if (sourceFile) { const sh = this.querySelector('.dv-head'); if (sh) sh.insertAdjacentHTML('beforeend', renderSourceLink(sourceFile, sourceLine)); }
      if (parent) {
        const head = this.querySelector('.dv-head');
        if (head) { head.insertAdjacentHTML('afterend', renderParentLink(parent)); this.querySelector('.dv-parent-link')?.addEventListener('click', (e) => { e.preventDefault(); navigate(parent.type.toLowerCase(), 'show', { uuid: parent.uuid }); }); }
      }
      if (children.length > 0) {
        const links = this.querySelector('.dv-links');
        if (links) links.insertAdjacentHTML('afterend', `<div style="border-top:1px solid rgba(255,255,255,0.1);margin-top:8px;padding-top:8px"><h4 style="font-size:0.75rem;color:rgba(255,255,255,0.5)">All children</h4>${children.map(c => `<div class="dv-link dv-sc" data-ref="${c.type.toLowerCase()}:${c.uuid}"><span class="dv-rel">${c.type}</span><span class="dv-link-title">${c.name}</span></div>`).join('')}</div>`);
        this.querySelectorAll('.dv-sc').forEach(row => row.addEventListener('click', () => { const r = (row as HTMLElement).dataset.ref!; navigate(r.split(':')[0], 'show', { uuid: r.split(':')[1] || '' }); }));
      }
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

if (typeof customElements !== 'undefined' && !customElements.get('rb-task-detail')) {
  customElements.define('rb-task-detail', RbTaskDetail);
}
