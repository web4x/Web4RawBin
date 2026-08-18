/**
 * T103 — ViewBus: client-side MVC observer keyed by object ref (`type:uuid`).
 *
 * Views subscribe(ref) on connect, unsubscribe on disconnect. After a mutation verb the
 * controller calls notify(ref) → every View bound to that object re-renders ONLY its region
 * (no full reload). This keeps the SHARED TraceModel DOM-free: the "Object does MVC" at the
 * system level through the bus, NOT via a view registry field on TraceObject.
 *
 * [impl:uuid:9ce0b153-0c3d-4749-aa57-954b359b797d] AC3 MVC live-update
 */
export type ViewBusListener = (payload?: unknown) => void; // T37.25 ONE BUS: optional payload so the ../ViewBus viewBus adapter can deliver a model over the SAME instance; trace views ignore it (re-render/re-fetch)

class ViewBusImpl {
  private subs = new Map<string, Set<ViewBusListener>>();

  /** Subscribe a view to an object ref. Returns an unsubscribe fn. */
  subscribe(ref: string, cb: ViewBusListener): () => void {
    let set = this.subs.get(ref);
    if (!set) { set = new Set(); this.subs.set(ref, set); }
    set.add(cb);
    return () => this.unsubscribe(ref, cb);
  }

  unsubscribe(ref: string, cb: ViewBusListener): void {
    const set = this.subs.get(ref);
    if (!set) return;
    set.delete(cb);
    if (set.size === 0) this.subs.delete(ref);
  }

  /** Notify all views bound to ref to re-render. Optional payload (T37.25) is passed through for model-carrying subscribers. */
  notify(ref: string, payload?: unknown): void {
    const set = this.subs.get(ref);
    if (!set) return;
    for (const cb of [...set]) cb(payload);
  }

  /** Test/diagnostic: how many listeners are bound to a ref. */
  count(ref: string): number {
    return this.subs.get(ref)?.size ?? 0;
  }
}

// R40.45 (architect 98ac90205) — the ONE canonical ViewBus key builder. BOTH notify AND every subscribe route through
// this, so the two sides CANNOT disagree (same single-source reasoning as FROZEN_LEGACY_MAX): a key defined ad-hoc per
// site is exactly how notify(`type:uuid`) drifted from subscribe(rawRef) → inert live-MVC (controls+badge+detail never
// re-rendered on a remote OR the acting-tab-local emit). Canonical form = `<type-lowercased>:<uuid>` — type is
// case-normalised, an `ior:instance:` prefix + a federated `uuid@host` suffix are stripped (identity = the local uuid).
// Accepts a raw ref string (`Task:uuid`, `task:uuid`) OR {type,uuid}. A bare token (no colon, e.g. 'graph') passes through.
// Enforced by check-viewbus-key-single-source (a raw-ref subscribe/notify → RED; stub-must-fail proves it binds).
export function viewBusKey(ref: string | { type?: string; uuid?: string }): string {
  if (typeof ref !== 'string') return `${String(ref?.type || '').toLowerCase()}:${String(ref?.uuid || '').split('@')[0]}`;
  const s = ref.replace(/^ior:instance:/, '');
  const i = s.indexOf(':');
  if (i < 0) return s.toLowerCase(); // bare token (e.g. 'graph') — no type:uuid form
  return `${s.slice(0, i).toLowerCase()}:${s.slice(i + 1).split('@')[0]}`; // type lowercased; uuid verbatim minus federated @host
}

export const ViewBus = new ViewBusImpl();
