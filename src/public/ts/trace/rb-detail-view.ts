/**
 * T107 — rb-detail-view: one object's full detail + its typed links as clickable chain rows.
 *
 * Resolves `ref` from the graph; renders title/type/uuid/status + every typed link (from
 * obj.toJSON().links — the route-like refs) as a row that navigate()s to the linked object.
 * So the DetailView IS the chain navigator (req↔task↔uc↔class↔method↔impl/test). ViewBus:
 * subscribes its own ref + each linked ref → re-renders on notify (no reload).
 *
 * [impl:uuid:107a6172-8394-45a6-897d-a07070707107] R15.6 DetailView (chain-navigable)
 */
import { TraceGraph, refUuid, type ObjectRef } from '../../../ts/shared/TraceModel.js';
import { ViewBus } from './ViewBus.js';
import { navigate } from './nav.js';

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
    if (!obj) { this.innerHTML = `<div class="trace-notfound">object not found: ${ref}</div>`; return; }

    const links = obj.toJSON().links; // { relation: [type:uuid…] } — already route-like
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
      <div class="dv-links">${rows.join('') || '<div class="dv-empty">no links</div>'}</div>`;

    // click link rows → navigate to the linked object
    this.querySelectorAll('.dv-link').forEach(row => {
      row.addEventListener('click', () => {
        const lref = (row as HTMLElement).dataset.ref!;
        const [type] = lref.split(':');
        navigate(type, 'show', { uuid: refUuid(lref) });
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
