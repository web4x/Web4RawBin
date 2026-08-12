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
import { renderSupersededSection, renderAllChildrenSection } from './detail-superseded.js';

export class RbDetailView extends HTMLElement {
  graph: TraceGraph | null = null;
  static get observedAttributes() { return ['ref']; }
  private unsubs: Array<() => void> = [];

  connectedCallback(): void { this.classList.add('detail-view'); this.render(); }
  disconnectedCallback(): void { this.clearSubs(); }
  attributeChangedCallback(): void { if (this.isConnected) this.render(); }

  private clearSubs(): void { for (const u of this.unsubs) u(); this.unsubs = []; }

  // R40.11 slice-3 (AC-3 field RENDER). ONE generic type-driven field view: renders the unit's own scalar
  // `fields` (from /api/trace/children; the M2 TYPE determines which exist) as labeled rows — no per-type
  // bespoke view (DRY). [impl] marker lands adjacent-above on req's slice-3 uuid (host: renderTypeDrivenFields).
  // [impl:uuid:613a26bb-2c37-48e0-b95d-a645ce61c4b1] renderTypeDrivenFields — R40.11 slice-3 (AC-3 render)
  private renderTypeDrivenFields(head: Element, fields: Record<string, string>): void {
    const keys = Object.keys(fields || {});
    if (!keys.length) return;
    const esc = (s: string): string => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));
    head.insertAdjacentHTML('afterend', `<div class="dv-fields">${keys.map(k => `<div class="dv-field"><span class="dv-field-k">${esc(k)}</span><span class="dv-field-v">${esc(fields[k])}</span></div>`).join('')}</div>`);
  }

  // R40.11 slice-3 (AC-4 fail-loud). An unresolvable ref → EXPLICIT '⚠ unresolved: <ior>', never a perpetual
  // 'Loading…' spinner (the silent failure that hid the bug). [impl] marker on req's slice-3 uuid (host: renderUnresolved).
  // [impl:uuid:b9eaac0f-9425-435b-9105-82cedd780216] renderUnresolved — R40.11 slice-3 (AC-4 fail-loud)
  private renderUnresolved(label: string): void {
    const h = this.querySelector('.dv-head');
    if (!h) return;
    h.querySelector('.dv-type')!.textContent = 'unresolved';
    h.querySelector('.dv-title')!.textContent = '⚠ unresolved: ' + label;
    const kids = this.querySelector('.dv-scenario-children');
    if (kids) kids.innerHTML = '<div class="dv-empty">no resolvable unit for this reference</div>';
  }

  render(): void {
    this.clearSubs();
    const ref = this.getAttribute('ref') || '';
    const obj = this.graph?.get(refUuid(ref));
    // [impl:uuid:4846d57e-610e-4977-a189-662074030cb1] R19.67 room-detail fallback
    if (!obj) {
      const uuid = refUuid(ref);
      this.innerHTML = `<div class="dv-head"><span class="dv-type">Loading...</span><h3 class="dv-title">Loading...</h3><code class="dv-uuid">${uuid}</code></div><div class="dv-scenario-children"><span style="color:rgba(255,255,255,0.4);font-size:0.7rem">Loading...</span></div>`;
      // R40.11 slice-3 (AC-4 FAIL-LOUD): a ref that resolves to NO unit must show an EXPLICIT 'unresolved: <ior>' —
      // never the perpetual 'Loading…' spinner (Tron's eternal-hang drawer; a silent failure that HID the bug).
      // Slices 1-2 mint the typed units + emit REAL iors; this fires fail-loud whenever the unit genuinely does not
      // resolve (404). Legitimate chain-only units (impl/test) EXIST in the index → 200 via fetchDetailData → no
      // false-fail. (Was scoped to synthetic depref: only; broadened because slice-2 emits real iors now.)
      // Fetch the unit's own data (name, type, children) from /api/trace/children
      fetch(`/api/trace/children/${uuid}`).then(r => r.ok ? r.json() : null).then(data => {
        const head = this.querySelector('.dv-head');
        if (head && data) {
          head.querySelector('.dv-type')!.textContent = data.type || ref.split(':')[0] || '?';
          head.querySelector('.dv-title')!.textContent = data.name || uuid;
          head.insertAdjacentHTML('beforeend', `${scenarioBrowserLinkFromIor(uuid)}`);
          this.renderTypeDrivenFields(head, data.fields || {}); // R40.11 slice-3 (AC-3): ONE generic type-driven field view
          // R35.1: the vCard button (member/user) is now a universalActionBar action (download-vcard, universal-actions.ts) —
          // bespoke button REMOVED (INV-2); the bar handler fetches the real playerToken + calls downloadVCard (INV-1 same effect).
        } else if (head && !data) {
          // R40.11 slice-3 (AC-4): 404 = the unit genuinely does NOT resolve → EXPLICIT error, never an eternal
          // spinner. Broadened from synthetic-only: slice-2 emits REAL iors, so an unresolvable REAL ior must also
          // fail loud. Legitimate chain-only units (impl/test) exist in the index → 200 (data present) → no false-fail.
          this.renderUnresolved(ref || uuid);
        }
      }).catch(() => this.renderUnresolved(ref || uuid));
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

    // R35.1: file preview = rb-file-detail (tagMap ALWAYS routes file→rb-file-detail) + the universalActionBar
    // preview-file/open-newtab actions. The old rb-detail-view fallback button was DEAD (tagMap never lands file here) → REMOVED (INV-2).

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
