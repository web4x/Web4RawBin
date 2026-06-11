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
export type ViewBusListener = () => void;

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

  /** Notify all views bound to ref to re-render. */
  notify(ref: string): void {
    const set = this.subs.get(ref);
    if (!set) return;
    for (const cb of [...set]) cb();
  }

  /** Test/diagnostic: how many listeners are bound to a ref. */
  count(ref: string): number {
    return this.subs.get(ref)?.size ?? 0;
  }
}

export const ViewBus = new ViewBusImpl();
