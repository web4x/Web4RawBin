// [impl:uuid:PENDING] R37.24 inc2 — RbDetailBase: THE ONE detail-element primitive (extract-once, zero copies).
// PO ruling (anti-CMM2): the single-render FUNNEL and the ONE-model-source resolution must live in ONE place, not be
// hand-pasted into 8 detail elements (that would fix a duplicate-path defect by creating 8 duplicate implementations).
// EVERY rb-*-detail element extends this base and implements renderDetail(ctx) for its TYPE-specific DOM only.
//
// AXIS-1 (single render owner): connectedCallback + attributeChangedCallback FUNNEL to renderIfRefChanged, keyed on the
//   ref — renders EXACTLY ONCE per ref-change (kills the drawer-vs-element + connected-vs-attrChanged double). A ViewBus
//   notify re-renders directly (a data-change, not a ref-change — bypasses the funnel by design).
// AXIS-2 (one model source): the graph obj IF it has the uuid (fast path), ELSE FETCH THE FULL UNIT (/api/ior → the full
//   model incl statusChecklist) — NEVER a thin "not found" stub. Genuinely unresolvable (404) → honest-empty unresolved,
//   never silently thinner. Kills the full-vs-thin split by construction.
// The HAZARD-GATE asserts ZERO detail elements implement their own funnel or not-found/thin path outside THIS primitive
// (one number proves unevadability AND completeness — the 8 that exist AND the 9th nobody has written yet).
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus, viewBusKey } from './ViewBus.js';

export interface DetailCtx {
  ref: string;              // the full ref ("task:<uuid>")
  uuid: string;             // bare uuid
  obj: any | null;          // the graph TraceObject when the real graph has it (for forwardOnly links); null on a fetch-path resolve
  model: Record<string, any>; // the FULL unit model — from the graph obj OR the /api/ior fetch (never a thin stub)
}

export function escHtml(s: string): string {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

export abstract class RbDetailBase extends HTMLElement {
  graph: TraceGraph | null = null;
  static get observedAttributes() { return ['ref']; }
  protected unsubs: Array<() => void> = [];
  private _renderedRef: string | null = null;

  connectedCallback(): void { this.renderIfRefChanged(); }
  disconnectedCallback(): void { this.clearSubs(); }
  attributeChangedCallback(): void { if (this.isConnected) this.renderIfRefChanged(); }

  protected clearSubs(): void { for (const u of this.unsubs) u(); this.unsubs = []; }

  // AXIS-1: the ONE render entry-point. connected + attrChanged both land here; the ref key dedupes the double (no
  // debounce, no guard-of-a-race — the ref IS the identity). A genuine ref-change renders once.
  private renderIfRefChanged(): void {
    const ref = this.getAttribute('ref') || '';
    if (ref === this._renderedRef) return;
    this._renderedRef = ref;
    void this.resolveAndRender();
  }

  // AXIS-2: resolve the model from the ONE source, then hand the type-specific element a full ctx to render.
  private async resolveAndRender(): Promise<void> {
    this.clearSubs();
    const ref = this.getAttribute('ref') || '';
    const uuid = refUuid(ref);
    const obj = this.graph?.get(uuid) || null;
    let model: Record<string, any> | null = obj ? this.modelFromObj(obj) : null;
    if (!model) {
      const j = await fetch(`/api/ior/ior:instance:${uuid}`).then(r => r.ok ? r.json() : null).catch(() => null);
      if (!j?.unit) { this.innerHTML = `<div class="dv-empty">⚠ unresolved: ${escHtml(ref || uuid)}</div>`; this.announceShown(ref); return; } // honest-empty, NEVER a thin stub — but STILL announce (else the action bar keeps the PREVIOUS unit's verbs on an unresolved detail)
      model = (j.unit.model || {}) as Record<string, any>;
    }
    this.renderDetail({ ref, uuid, obj, model });
    this.announceShown(ref);
    // MVC: a unit-changed on THIS ref re-derives (data-change re-render; not a ref-change so it bypasses the funnel).
    this.unsubs.push(ViewBus.subscribe(viewBusKey(ref), () => this.forceRerender()));
  }

  // R37.24 inc2 AXIS-3: the ELEMENT is the SINGLE owner of the shown-signal — EVERY render path (content OR honest-empty)
  // announces its OWN rendered ref so the action bar derives ref+type from the same source as the content (the drawer's
  // onDetailShown drives the bar from THIS; no separate drawer-side ref that can split → no verb on a unit not being read).
  // A render WITHOUT this announce = the bar's memo goes stale vs the content (the hazard-gate REDs on a render-without-dispatch).
  private announceShown(ref: string): void {
    document.dispatchEvent(new CustomEvent('rb-drawer-detail-shown', { detail: { type: (ref.split(':')[0] || '').toLowerCase(), ref }, bubbles: true }));
  }

  // A data-change re-render (not a ref-change) — resets the funnel key so the SAME ref re-resolves + repaints. Used by
  // the base's own ref-subscription and available to a subclass that must re-render on EXTRA triggers (e.g. rb-detail-view
  // re-rendering when a LINKED object changes). Never call for a ref-change — attributeChangedCallback funnels that.
  protected forceRerender(): void { this._renderedRef = null; this.renderIfRefChanged(); }

  // Default model projection from a graph TraceObject; a subclass may override to carry more fields.
  protected modelFromObj(obj: any): Record<string, any> {
    return { name: obj.title, status: obj.status, uuid: obj.uuid, ...(obj.sprint ? { sprint: obj.sprint } : {}) };
  }

  // The ONLY thing a detail element implements: its type-specific DOM from the resolved ctx. No funnel, no fetch, no
  // not-found path here — those are the base's, once (the hazard-gate asserts this).
  protected abstract renderDetail(ctx: DetailCtx): void;
}
