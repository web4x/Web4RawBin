/**
 * T111 — rb-task-detail: specialized DetailView for Task objects.
 *
 * Shows status badge, sprint, owner, and traceability chain links.
 * Renders inside rb-detail-drawer (T110). Self-registers as custom element.
 *
 * [impl:uuid:e1ad6c89-269b-47d2-96b5-1fa356cbc226] R16.2 TaskDetailView
 */
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus } from './ViewBus.js';
import { navigate } from './nav.js';
import { forwardOnly } from './forward-only.js';
// [impl:uuid:1ff4d2bb-3af9-4517-8cde-8e6fc498e887] RbTaskDetail.render impl
// [impl:uuid:a495b735-6836-4dba-84b2-b279f2da17df] RbTaskDetail.render
import { renderSupersededSection, renderAllChildrenSection, renderChainPathSection } from './detail-superseded.js';
import { fetchDetailData, renderParentLink, renderSourceLink, scenarioBrowserLinkFromIor, scenarioBrowserHref } from './detail-children.js';

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
        ${scenarioBrowserLinkFromIor(obj.uuid)}
      </div>
      <div class="dv-links">
        <h4>Forward Links</h4>
        ${renderLinks(this.graph, links)}
      </div>`;

    this.unsubs.push(ViewBus.subscribe(ref, () => this.render()));
    this.loadDetailData(obj.uuid);
  }

  private loadDetailData(uuid: string): void {
    fetchDetailData(uuid).then(({ children, parent, sourceFile, sourceLine }) => {
      if (sourceFile) { const sh = this.querySelector('.dv-head'); if (sh) sh.insertAdjacentHTML('beforeend', renderSourceLink(sourceFile, sourceLine)); }
      if (parent) {
        const head = this.querySelector('.dv-head');
        if (head) { head.insertAdjacentHTML('afterend', renderParentLink(parent)); this.querySelector('.dv-parent-link')?.addEventListener('click', (e) => { e.preventDefault(); navigate(parent.type.toLowerCase(), 'show', { uuid: parent.uuid }); }); }
      }
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

if (typeof customElements !== 'undefined' && !customElements.get('rb-task-detail')) {
  customElements.define('rb-task-detail', RbTaskDetail);
}
