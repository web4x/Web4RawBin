// Radical-OOP Slice 1 (architect class model 996a39408, Tron law: "a Room IS a Room class"): the model's abstract
// `Node` — a tree CONTAINER node that OWNS rendering its own children. Coded as `ContainerNode` because `Node` is a DOM
// global (a `class Node` would shadow the global type in every importer). It realizes the model's Node contract:
//   • renderChildren() — ASKS the ONE children derivation (/api/trace/children) and DOM-reconciles its children IN PLACE
//     (reflect-not-recompute, R40.83): ADD-ONLY — existing child nodes are never rebuilt → an expanded/collapsed sibling
//     does NOT collapse or flash on an add (the already-live no-collapse behaviour stays green).
//   • onChildAdded() — "I gained a child" → renderChildren().
//   • subscribes to ITS OWN ref — a unit-changed for this container (any add path publishes ONE
//     ViewBus.notify(viewBusKey(ref))) makes THIS node render its own children. No caller rebuilds from a ref + machinery.
// COLLAPSES + DELETES RbTraceTree.reDeriveDirectChildren (its behaviour + FIX-2 childless-container case live here now).
import { ViewBus, viewBusKey } from './ViewBus.js';

// The direct-children derivation row shape (server /api/trace/children children[]). Construction of a child DOM node is
// delegated to the tree's node factory via `buildChild` (node CONSTRUCTION is a separate concern from children-RENDERING;
// its full absorption into Node is a later slice — Slice 1 owns rendering, not a tree rewrite).
export interface ChildRow { uuid: string; type?: string; name: string; children?: ChildRow[]; hasChildren?: boolean; chainMethod?: { uuid: string; type: string; name: string }; description?: string; status?: string; childCount?: number; }

export interface NodeDeps {
  childrenUrl: string;                         // the ONE children-derivation endpoint base
  modeParam: string;                           // e.g. '?mode=scenario'
  buildChild: (child: ChildRow) => HTMLElement; // the tree's node factory (construction — reused, not duplicated)
  computeBadges: () => void;                   // re-stamp count badges after a reconcile
}

export class ContainerNode {
  private unsub: (() => void) | null = null;
  constructor(private ref: string, private el: HTMLElement, private deps: NodeDeps) {
    // subscribe to MY OWN ref (canonical key — subscribe==notify by construction): any add path notifies this ref → I render.
    this.unsub = ViewBus.subscribe(viewBusKey(ref), () => void this.renderChildren());
  }
  dispose(): void { try { this.unsub?.(); } catch { /* */ } this.unsub = null; }

  // "I gained a child" → render my own children. (The event-side name for the same behaviour.)
  onChildAdded(): void { void this.renderChildren(); }

  // [impl:uuid:8693dc2b-680e-4866-8fab-37c0fe2c6cae] ContainerNode.renderChildren (Method renderChildren, Class Node, UC
  // nodeContainer.renderOwnChildren) — ASK the ONE children derivation, DOM-reconcile IN PLACE. ADD-ONLY: existing kids are
  // never rebuilt → no collapse/flash of expanded siblings (the live no-collapse fix). Owns FIX-2 (childless container →
  // create .tt-children so an empty container's FIRST child renders in place). Collapsed from RbTraceTree.reDeriveDirectChildren.
  async renderChildren(): Promise<void> {
    // 3-line runtime disambiguation (architect): names WHICH runtime failure this method owns — it does NOT shrink scope.
    if (!this.el.isConnected) { console.log(`[Node.renderChildren] ref=${this.ref.slice(0, 28)} SKIP: node not in DOM`); return; } // (1) detached node
    let kids = this.el.querySelector(':scope > .tt-children') as HTMLElement | null;
    if (!kids) { // (2) childless container not yet having a .tt-children (empty room's FIRST folder) — FIX-2, the method owns it
      console.log(`[Node.renderChildren] ref=${this.ref.slice(0, 28)} childless-container → CREATE .tt-children (FIX-2)`);
      kids = document.createElement('div');
      kids.className = 'tt-children';
      this.el.appendChild(kids);
      this.el.querySelector(':scope > .tt-row > rb-object-item')?.setAttribute('has-children', '');
    }
    try {
      const res = await fetch(`${this.deps.childrenUrl}${encodeURIComponent(this.ref)}${this.deps.modeParam}`);
      if (!res.ok) { console.log(`[Node.renderChildren] ref=${this.ref.slice(0, 28)} children-derivation !ok=${res.status}`); return; } // (3) derivation unavailable
      const data = await res.json();
      const existing = new Set(Array.from(kids.querySelectorAll(':scope > .tt-node > .tt-row > rb-object-item')).map((i) => i.getAttribute('ref') || ''));
      for (const child of (data.children || []) as ChildRow[]) {
        const cref = `${(child.type || 'task').toLowerCase()}:${child.uuid}`;
        if (existing.has(cref)) continue; // ADD-ONLY reconcile: existing children untouched → no rebuild, no collapse, no flash
        kids.appendChild(this.deps.buildChild(child));
      }
      this.deps.computeBadges();
    } catch { /* best-effort live-insert */ }
  }
}
