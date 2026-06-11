// [impl:uuid:4947f284-3c25-4c8a-b0fa-b31e4cf049e4] RbDetailView.renderObject
/**
 * T107 — rb-detail-view: one object's full detail + its typed links as clickable chain rows.
 *
 * Resolves `ref` from the graph; renders title/type/uuid/status + every typed link (from
 * obj.toJSON().links — the route-like refs) as a row that navigate()s to the linked object.
 * So the DetailView IS the chain navigator (req↔task↔uc↔class↔method↔impl/test). ViewBus:
 * subscribes its own ref + each linked ref → re-renders on notify (no reload).
 *
 * [impl:uuid:8d98abfd-9970-4951-8344-b82828b7dac4] R15.6 DetailView (chain-navigable)
 */
import { TraceGraph, refUuid, type ObjectRef } from '../../../ts/shared/TraceModel.js';
import { ViewBus } from './ViewBus.js';
import { navigate } from './nav.js';
import { forwardOnly } from './forward-only.js';
import { fetchDetailData, renderParentLink, renderSourceLink } from './detail-children.js';

export class RbDetailView extends HTMLElement {
  graph: TraceGraph | null = null;
  static get observedAttributes() { return ['ref']; }
  private unsubs: Array<() => void> = [];

  connectedCallback(): void { this.classList.add('detail-view'); this.render(); }
  disconnectedCallback(): void { this.clearSubs(); }
  attributeChangedCallback(): void { if (this.isConnected) this.render(); }

  private clearSubs(): void { for (const u of this.unsubs) u(); this.unsubs = []; }

  render(): void {
    this.clearSubs();
    const ref = this.getAttribute('ref') || '';
    const obj = this.graph?.get(refUuid(ref));
    if (!obj) {
      this.innerHTML = `<div class="dv-head"><span class="dv-type">${ref.split(':')[0] || '?'}</span><h3 class="dv-title">Loading...</h3><code class="dv-uuid">${refUuid(ref)}</code></div><div class="dv-scenario-children"><span style="color:rgba(255,255,255,0.4);font-size:0.7rem">Loading...</span></div>`;
      fetchDetailData(refUuid(ref)).then(({ children, parent, sourceFile, sourceLine }) => {
        const head = this.querySelector('.dv-head');
        if (head) {
          const name = children.length > 0 ? (parent?.name || refUuid(ref)) : refUuid(ref);
          head.querySelector('.dv-title')!.textContent = parent?.name || name;
        }
        if (sourceFile && head) head.insertAdjacentHTML('beforeend', renderSourceLink(sourceFile, sourceLine));
        if (parent && head) {
          head.insertAdjacentHTML('afterend', renderParentLink(parent));
          this.querySelector('.dv-parent-link')?.addEventListener('click', (e) => { e.preventDefault(); navigate(parent.type.toLowerCase(), 'show', { uuid: parent.uuid }); });
        }
        const container = this.querySelector('.dv-scenario-children');
        if (!container || children.length === 0) { if (container) container.innerHTML = '<div class="dv-empty">no children</div>'; return; }
        container.innerHTML = `<h4 style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:4px">Children</h4>` + children.map(c => `<div class="dv-link" data-ref="${c.type.toLowerCase()}:${c.uuid}"><span class="dv-rel">${c.type}</span><span class="dv-link-title">${c.name}</span></div>`).join('');
        container.querySelectorAll('.dv-link').forEach(row => { row.addEventListener('click', () => { const lref = (row as HTMLElement).dataset.ref!; navigate(lref.split(':')[0], 'show', { uuid: lref.split(':')[1] || lref }); }); });
      });
      return;
    }

    const links = forwardOnly(obj);
    const rows: string[] = [];
    for (const [relation, refs] of Object.entries(links)) {
      for (const lref of refs) {
        const lobj = this.graph?.get(refUuid(lref));
        rows.push(`<div class="dv-link" data-ref="${lref}"><span class="dv-rel">${relation}</span><span class="dv-link-title">${esc(lobj?.title || lref)}</span><code class="dv-link-ref">${lref}</code></div>`);
      }
    }
    this.innerHTML = `
      <div class="dv-head">
        <span class="dv-type">${obj.type}</span>
        <h3 class="dv-title">${esc(obj.title)}</h3>
        <code class="dv-uuid">${obj.uuid}</code>
        ${obj.status ? `<span class="dv-status">${esc(obj.status)}</span>` : ''}
        <div class="dv-field"><a href="/scenario?ior=${obj.uuid}" class="dv-file-link" style="color:#ff9800;font-size:0.75rem;text-decoration:none">📄 Scenario view</a></div>
      </div>
      <div class="dv-links">${rows.join('') || '<div class="dv-empty">no links</div>'}</div>
      <div class="dv-scenario-children" style="border-top:1px solid rgba(255,255,255,0.1);margin-top:8px;padding-top:8px"><span style="color:rgba(255,255,255,0.4);font-size:0.7rem">Loading all children...</span></div>`;

    // click link rows → navigate to the linked object
    this.querySelectorAll('.dv-link').forEach(row => {
      row.addEventListener('click', () => {
        const lref = (row as HTMLElement).dataset.ref!;
        const [type] = lref.split(':');
        navigate(type, 'show', { uuid: refUuid(lref) });
      });
    });

    // R18.9+R18.10: fetch ALL children + parent (scenario mode) for the detail pane
    fetchDetailData(obj.uuid).then(({ children, parent, sourceFile, sourceLine }) => {
      // R18.11+R18.12: source file link
      if (sourceFile) {
        const head = this.querySelector('.dv-head');
        if (head) head.insertAdjacentHTML('beforeend', renderSourceLink(sourceFile, sourceLine));
      }
      // R18.10: render parent link
      const parentDiv = this.querySelector('.dv-head');
      if (parentDiv && parent) {
        parentDiv.insertAdjacentHTML('afterend', renderParentLink(parent));
        this.querySelector('.dv-parent-link')?.addEventListener('click', (e) => {
          e.preventDefault();
          navigate(parent.type.toLowerCase(), 'show', { uuid: parent.uuid });
        });
      }
      const container = this.querySelector('.dv-scenario-children');
      if (!container || children.length === 0) { if (container) container.innerHTML = ''; return; }
      container.innerHTML = `<h4 style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:4px">All children (scenario)</h4>` +
        children.map(c => `<div class="dv-link" data-ref="${c.type.toLowerCase()}:${c.uuid}"><span class="dv-rel">${c.type}</span><span class="dv-link-title">${c.name}</span></div>`).join('');
      container.querySelectorAll('.dv-link').forEach(row => {
        row.addEventListener('click', () => {
          const lref = (row as HTMLElement).dataset.ref!;
          navigate(lref.split(':')[0], 'show', { uuid: lref.split(':')[1] || lref });
        });
      });
    });

    // MVC: re-render on this object OR any linked object changing
    this.unsubs.push(ViewBus.subscribe(obj.ref(), () => this.render()));
    const linked = new Set<ObjectRef>(Object.values(links).flat());
    for (const lref of linked) this.unsubs.push(ViewBus.subscribe(lref, () => this.render()));
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-detail-view')) {
  customElements.define('rb-detail-view', RbDetailView);
}
