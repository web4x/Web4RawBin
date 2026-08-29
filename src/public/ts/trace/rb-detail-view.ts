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
import { ViewBus, viewBusKey } from './ViewBus.js';
import { navigate } from './nav.js';
import { selectionModel } from './selection-model.js';
import { forwardOnly } from './forward-only.js';
import { fetchDetailData, scenarioBrowserLinkFromIor, upsertSourceLink, upsertParentLink } from './detail-children.js';
import { renderSupersededSection, renderAllChildrenSection } from './detail-superseded.js';
import { upsertSection } from './detail-render.js'; // R37.12 (B): the ONE idempotent section insert (type-fields, scenario-link)
import { RbDetailBase, type DetailCtx } from './rb-detail-base.js'; // R37.24 inc2: the ONE detail primitive (funnel + one-source) — extract-once, no per-element copy

export class RbDetailView extends RbDetailBase {
  // R37.24 inc2: the funnel + one-model-source resolution + honest-empty-on-unresolved all live in RbDetailBase
  // (extract-once). This GENERIC detail (the tagMap default) implements ONLY its DOM via renderDetail(ctx).

  // R40.11 slice-3 (AC-3 field RENDER). ONE generic type-driven field view: renders the unit's own scalar
  // `fields` (from /api/trace/children; the M2 TYPE determines which exist) as labeled rows — no per-type
  // bespoke view (DRY). [impl] marker lands adjacent-above on req's slice-3 uuid (host: renderTypeDrivenFields).
  // [impl:uuid:613a26bb-2c37-48e0-b95d-a645ce61c4b1] renderTypeDrivenFields — R40.11 slice-3 (AC-3 render)
  private renderTypeDrivenFields(head: Element, fields: Record<string, string>): void {
    const keys = Object.keys(fields || {});
    if (!keys.length) return;
    const esc = (s: string): string => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));
    upsertSection(this, 'dv-fields', `<div class="dv-fields">${keys.map(k => `<div class="dv-field"><span class="dv-field-k">${esc(k)}</span><span class="dv-field-v">${esc(fields[k])}</span></div>`).join('')}</div>`, head, 'afterend'); // R37.12 (B): idempotent
  }

  // R37.24 inc2: the ONLY thing this element implements — its DOM from the resolved ctx. The base guarantees ctx.model
  // is the FULL unit (graph obj OR /api/ior fetch) and shows honest-empty '⚠ unresolved' on a genuine 404 BEFORE this
  // runs (so the old renderUnresolved + the eternal-'Loading…' spinner are RETIRED — no thin/never-resolving path here).
  protected renderDetail({ ref, uuid, obj, model }: DetailCtx): void {
    this.classList.add('detail-view');
    if (obj) {
      // R20.5 renderSingularChain — full graph fast-path (forward links from the graph obj)
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
          <span class="dv-type">${esc(String(obj.type))}</span>
          <h3 class="dv-title">${esc(obj.title)}</h3>
          <code class="dv-uuid">${obj.uuid}</code>
          ${obj.status ? `<span class="dv-status">${esc(obj.status)}</span>` : ''}
          ${scenarioBrowserLinkFromIor(obj.uuid)}
        </div>
        <div class="dv-links">${rows.join('') || '<div class="dv-empty">no links</div>'}</div>`;
      this.querySelectorAll('.dv-link').forEach(row => row.addEventListener('click', () => selectionModel.replaceWith((row as HTMLElement).dataset.ref!)));
      fetchDetailData(obj.uuid).then(({ children, parent, sourceFile, sourceLine }) => {
        upsertSourceLink(this, sourceFile, sourceLine); // R37.12 (B): idempotent
        upsertParentLink(this, parent, (p) => selectionModel.replaceWith(`${p.type.toLowerCase()}:${p.uuid}`));
        renderAllChildrenSection(this, children);
        renderSupersededSection(this, obj.uuid);
      });
      const linked = new Set<string>(Object.values(links).flat()); // re-render when a LINKED object changes (base already subs THIS ref)
      for (const lref of linked) this.unsubs.push(ViewBus.subscribe(viewBusKey(lref), () => this.forceRerender()));
      return;
    }
    // fetch-path (no graph): the base resolved the FULL model — build the head from it + type-driven fields + children.
    this.innerHTML = `<div class="dv-head"><span class="dv-type">${esc(String(model.type || ref.split(':')[0] || '?'))}</span><h3 class="dv-title">${esc(String(model.name || uuid))}</h3><code class="dv-uuid">${uuid}</code></div><div class="dv-scenario-children"></div>`;
    const head = this.querySelector('.dv-head');
    if (head) {
      upsertSection(this, 'dv-scenario-link', `<span class="dv-scenario-link">${scenarioBrowserLinkFromIor(uuid)}</span>`, head, 'beforeend'); // R37.12 (B): idempotent
      fetch(`/api/trace/children/${uuid}`).then(r => r.ok ? r.json() : null).then(data => { if (data && head.isConnected) this.renderTypeDrivenFields(head, data.fields || {}); }).catch(() => {}); // R40.11 slice-3 (AC-3)
    }
    fetchDetailData(uuid).then(({ children, parent, sourceFile, sourceLine }) => {
      upsertSourceLink(this, sourceFile, sourceLine); // R37.12 (B): idempotent
      upsertParentLink(this, parent, (p) => selectionModel.replaceWith(`${p.type.toLowerCase()}:${p.uuid}`));
      const container = this.querySelector('.dv-scenario-children');
      if (!container || children.length === 0) { if (container) container.innerHTML = '<div class="dv-empty">no children</div>'; return; }
      container.innerHTML = `<h4 style="font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:4px">Children</h4>` + children.map(c => `<div class="dv-link" data-ref="${c.type.toLowerCase()}:${c.uuid}"><span class="dv-rel">${c.type}</span><span class="dv-link-title">${c.name}</span></div>`).join('');
      container.querySelectorAll('.dv-link').forEach(row => { row.addEventListener('click', () => selectionModel.replaceWith((row as HTMLElement).dataset.ref!)); });
    });
  }

  // R35.1: createFilePreviewButton + renderFilePreview REMOVED (INV-2) — dead file-type fallback (tagMap routes
  // file→rb-file-detail always). File preview now = rb-file-detail (toggle pane) + universalActionBar preview-file/open-newtab.
  // Their scenario Impls 1a5ad916 (createFilePreviewButton) + 71954a38 (renderFilePreview) go dead → req re-points (data=truth).
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-detail-view')) {
  customElements.define('rb-detail-view', RbDetailView);
}
