// T37.20 DEFECT-2 inc-2 — rb-natural-detail: the ONE generic detail element for a natural class that owns its own render.
// It holds NO per-type logic — it asks the class (registered via natural-render.ts) to render itself by the unit's kind.
// Adding a 6th natural class needs NO new element and NO edit here (it registers its render; this element renders it).
import { RbDetailBase, type DetailCtx } from './rb-detail-base.js';
import { naturalRender } from '../mime/natural-render.js';

export class RbNaturalDetail extends RbDetailBase {
  protected renderDetail({ uuid, model }: DetailCtx): void {
    const m = (model || {}) as Record<string, unknown>;
    const kind = String(m.kind || '');
    // the CLASS renders itself (MVC-in-object); uuid is threaded in for the content URL. Honest fallback if unregistered.
    this.innerHTML = naturalRender(kind, { ...m, uuid })
      ?? `<div class="dv-type">${kind || 'unit'}</div><div class="dv-title">${String(m.name || uuid)}</div>`;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-natural-detail')) {
  customElements.define('rb-natural-detail', RbNaturalDetail);
}
