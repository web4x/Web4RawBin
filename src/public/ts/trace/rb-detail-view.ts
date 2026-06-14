// [impl:uuid:4947f284-3c25-4c8a-b0fa-b31e4cf049e4] RbDetailView.renderObject
// [impl:uuid:07942a94-4713-4985-b618-9d9717e86cda] RbDetailView.roomScenarioDetail
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
import { selectionModel } from './selection-model.js';
import { forwardOnly } from './forward-only.js';
import { fetchDetailData, renderParentLink, renderSourceLink, scenarioBrowserLinkFromIor } from './detail-children.js';
import { renderContentPreview, loadTextPreview, wireUrlActions } from './content-preview.js';
import { renderSupersededSection, renderAllChildrenSection } from './detail-superseded.js';

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
    // [impl:uuid:4846d57e-610e-4977-a189-662074030cb1] R19.67 room-detail fallback
    if (!obj) {
      const uuid = refUuid(ref);
      this.innerHTML = `<div class="dv-head"><span class="dv-type">Loading...</span><h3 class="dv-title">Loading...</h3><code class="dv-uuid">${uuid}</code></div><div class="dv-scenario-children"><span style="color:rgba(255,255,255,0.4);font-size:0.7rem">Loading...</span></div>`;
      // Fetch the unit's own data (name, type, children) from /api/trace/children
      fetch(`/api/trace/children/${uuid}`).then(r => r.ok ? r.json() : null).then(data => {
        const head = this.querySelector('.dv-head');
        if (head && data) {
          head.querySelector('.dv-type')!.textContent = data.type || ref.split(':')[0] || '?';
          head.querySelector('.dv-title')!.textContent = data.name || uuid;
          head.insertAdjacentHTML('beforeend', `${scenarioBrowserLinkFromIor(uuid)}`);
        }
      }).catch(() => {});
      fetchDetailData(uuid).then(({ children, parent, sourceFile, sourceLine }) => {
        const head = this.querySelector('.dv-head');
        if (sourceFile && head) head.insertAdjacentHTML('beforeend', renderSourceLink(sourceFile, sourceLine));
        if (parent && head) {
          head.insertAdjacentHTML('afterend', renderParentLink(parent));
          this.querySelector('.dv-parent-link')?.addEventListener('click', (e) => { e.preventDefault(); selectionModel.replaceWith(`${parent.type.toLowerCase()}:${parent.uuid}`); });
        }
        const container = this.querySelector('.dv-scenario-children');
        if (!container || children.length === 0) { if (container) container.innerHTML = '<div class="dv-empty">no children</div>'; return; }
        container.innerHTML = `<h4 style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:4px">Children</h4>` + children.map(c => `<div class="dv-link" data-ref="${c.type.toLowerCase()}:${c.uuid}"><span class="dv-rel">${c.type}</span><span class="dv-link-title">${c.name}</span></div>`).join('');
        container.querySelectorAll('.dv-link').forEach(row => { row.addEventListener('click', () => { const lref = (row as HTMLElement).dataset.ref!; selectionModel.replaceWith(lref); }); });
      });
      return;
    }

    // [impl:uuid:09611d71-f2b2-4fab-9961-def94165c470] R20.5 renderSingularChain
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
        ${scenarioBrowserLinkFromIor(obj.uuid)}
      </div>
      <div class="dv-links">${rows.join('') || '<div class="dv-empty">no links</div>'}</div>`;

    if (obj.type === 'file' || obj.type === 'File') {
      this.createFilePreviewButton(obj.uuid, obj.title);
    }

    // click link rows → navigate to the linked object
    this.querySelectorAll('.dv-link').forEach(row => {
      row.addEventListener('click', () => {
        const lref = (row as HTMLElement).dataset.ref!;
        const [type] = lref.split(':');
        selectionModel.replaceWith(lref);
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
          selectionModel.replaceWith(`${parent.type.toLowerCase()}:${parent.uuid}`);
        });
      }
      renderAllChildrenSection(this, children);
      renderSupersededSection(this, obj.uuid);
    });

    // MVC: re-render on this object OR any linked object changing
    this.unsubs.push(ViewBus.subscribe(obj.ref(), () => this.render()));
    const linked = new Set<ObjectRef>(Object.values(links).flat());
    for (const lref of linked) this.unsubs.push(ViewBus.subscribe(lref, () => this.render()));
  }

  // [impl:uuid:1a5ad916-33ba-4829-80c4-44efd8756c35] R19.93 createFilePreviewButton
  private createFilePreviewButton(uuid: string, title: string): void {
    fetchDetailData(uuid).then(() => {
      fetch(`/api/ior/ior:instance:${uuid}`).then(r => r.json()).then(res => {
        if (!res.unit?.model) return;
        const fm = res.unit.model;
        const tok = localStorage.getItem('rawbin-player-id') || '';
        const previewBtn = document.createElement('button');
        previewBtn.className = 'btn';
        previewBtn.style.cssText = 'width:100%;margin:8px 0;padding:8px;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.85rem';
        previewBtn.textContent = `Preview ${fm.name || title}`;
        const linksEl = this.querySelector('.dv-links');
        if (linksEl) linksEl.insertAdjacentElement('beforebegin', previewBtn);
        previewBtn.addEventListener('click', () => {
          const preview = renderContentPreview(uuid, fm.mimeType || '', fm.name || title, tok);
          previewBtn.insertAdjacentHTML('afterend', preview);
          loadTextPreview(this, uuid, tok);
          wireUrlActions(this);
          previewBtn.remove();
        });
      }).catch(() => {});
    });
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-detail-view')) {
  customElements.define('rb-detail-view', RbDetailView);
}
