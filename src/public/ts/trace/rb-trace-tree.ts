// [impl:uuid:ee897257-f1f8-40cd-a8ae-00c4b4b6092f] RbTraceTree.renderSeed impl
// [impl:uuid:08fdddd4-c2bf-4997-bae4-0faa9f6d8f83] RbTraceTree.renderAllTypes
// [impl:uuid:7e43dda4-d7fd-45db-98b5-0e7a72d222c5] RbTraceTree.computeBadges
// [impl:uuid:1e008b80-6dcc-4f5c-aa2b-a4d809057b3a] RbTraceTree.cycleOmit
// [impl:uuid:f124b7ff-ee8e-4d00-a799-f87e1f4a1883] RbTraceTree.syncSelection
// [impl:uuid:49cb3038-9a42-455d-b636-71b60276a155] RbTraceTree.chainToTest
// [impl:uuid:4042da6f-e083-4564-bab7-562558b7464b] RbTraceTree.ancestorGuard
// [impl:uuid:4846d57e-610e-4977-a189-662074030cb1] RbTraceTree.cycleGuard
// [impl:uuid:3d3a4239-5939-4f5b-ae8d-bba2d2c086da] RbTraceTree.prefetchLayer
// [impl:uuid:eb038984-43bb-415c-91ed-25f6db3114f9] RbTraceTree.lazyAppend
// [impl:uuid:5d4ba96f-68f2-4f33-8b8f-636c704b2ee1] RbTraceTree.fetchAndRenderChildren
// [impl:uuid:5a552045-cc8d-4aaa-9d3c-d8c834f59df1] PathHeader.clickNavigate
// [impl:uuid:bf4879c6-30ee-4d47-8d7d-c80aa9f26fc7] TraceChain.treeRework
// [impl:uuid:7d40684c-e6b1-410c-90c7-3d80d229568b] Breadcrumb.contrastFix
// [impl:uuid:092a5eb3-0ee6-40fd-be9d-9cdc89b3e53c] TraceLayout.mobileCap
// [impl:uuid:9f495b68-d22d-41a7-85d1-9ccd78211506] TraceNarrow.classMethodScope
// [impl:uuid:efb696b4-5ea9-41e2-a478-09b33f67a85b] RbTraceTree.nodeEl impl
// [impl:uuid:c9c53769-36fc-4431-bc57-8f68192592b9] RbTraceTree.navigate impl
/**
 * T108 — rb-trace-tree: the traceability graph as an expand/collapse TREE (sibling to the
 * file tree in /edit). Root = requirements; expanding walks the typed chain via each object's
 * links (req→task→useCase→class→method→impl/test). Node rows reuse <rb-object-item> (T105),
 * so a node click navigates to its DetailView (T107) through the active router. Expand state
 * persisted (localStorage, like rb-file-tree). Broken/dangling nodes (T102 validate) get a
 * warning marker — shown, never hidden.
 *
 * [impl:uuid:f2dbefd1-c76d-48cc-b397-b6d66ddbba4d] R15.7 traceability browser
 */
import './rb-object-item.js';
import { TraceGraph, refUuid } from '../../../ts/shared/TraceModel.js';
import { ViewBus } from './ViewBus.js';

const LS_KEY = 'rawbin-trace-expanded';

// R31.3: RECURSIVE N-level itemView node (was ~2-level: child had no nested `children`). children?:TreeNode[] at
// EVERY depth → windows/panes (and any deep chain) are first-class. Backward-compat: a 2-level /trace payload just
// omits deeper `children` (hasChildren still drives lazy API fetch). Chevron per (children.length || hasChildren).
type TreeNode = { uuid: string; type: string; name: string; description?: string; hasChildren?: boolean; children?: TreeNode[]; childCount?: number; chainMethod?: { uuid: string; type: string; name: string }; status?: string };

export class RbTraceTree extends HTMLElement {
  graph: TraceGraph | null = null;
  brokenUuids = new Set<string>();
  private expanded = new Set<string>();
  private unsub: (() => void) | null = null;
  private pendingReveal: string | null = null;
  private prefetchCache = new Map<string, any[]>();
  private prefetchInFlight = new Set<string>();
  // R31.3 BADGE-via-REFERENCES: the eager nodeChildCount side-map is RETIRED — the badge count now lives on each
  // node's dataset.childRefCount (an array length stamped at build), so there is no colon-keyed map to diverge.
  private _items: TreeNode[] | null = null;
  private _seedRafId = 0;
  private _seedAbort: AbortController | null = null;

  private get mode(): string { return this.getAttribute('data-mode') || 'scenario'; }
  private get lsKey(): string { return this.mode === 'room' ? 'rawbin-room-expanded' : LS_KEY; }
  private get childrenUrl(): string { return `/api/trace/children/`; }
  private get modeParam(): string { return this.mode === 'trace' ? '?mode=trace' : ''; }

  // [impl:uuid:c5b331a7-d844-4cea-a7a4-1e5eebceec37] R19.90 setItems (split)
  set items(roots: TreeNode[]) {
    this._items = roots;
    if (this.isConnected) this.renderItems();
  }
  get items() { return this._items; }

  // R33.5 item1 (reused helper, call-site — no marker): reveal a lazy path by UUID. Walk each ancestor, dispatch
  // toggle-children (→ onToggleChildren fetches + renders that level), wait for the next level to appear → a
  // freshly-created leaf SHOWS. Mirrors revealNode's DOM-walk but with an EXPLICIT path (the synthetic mof folders
  // have no parent chain for fetchAncestorPath, and expanded is keyed by type:uuid — a raw-uuid add never matches).
  // Match by ref*=uuid (itemRefs are type:uuid; the uuid substring is unique enough for these folder nodes).
  async expandPath(uuids: string[]): Promise<void> {
    for (let i = 0; i < uuids.length; i++) {
      const item = this.querySelector(`rb-object-item[ref*="${uuids[i]}"]`) as HTMLElement | null;
      if (!item) break;
      if (!item.hasAttribute('children-open')) {
        item.dispatchEvent(new CustomEvent('toggle-children', { bubbles: true, detail: { open: true } }));
        await this.waitForNode(uuids[i + 1] || uuids[i]);
      }
    }
  }

  private upgradeProperty(prop: string): void {
    if (this.hasOwnProperty(prop)) {
      const val = (this as any)[prop];
      delete (this as any)[prop];
      (this as any)[prop] = val;
    }
  }

  // [impl:uuid:c3951765-6dff-4025-828d-bf4931cca8b3] RbTraceTree.connectedCallback — R40.17 live-pin RECEIVER concern
  // (R30.11 distinct-on-shared: this is a shared lifecycle method; this Impl credits its live-pin subscribe — the
  // eager-lazy branch subscribes to the CurrentSprint singleton ref so a designate notify re-fetches the 2-node pin).
  connectedCallback(): void {
    this.classList.add('trace-tree');
    this.upgradeProperty('items');
    this.upgradeProperty('graph');
    try { this.expanded = new Set(JSON.parse(localStorage.getItem(this.lsKey) || '[]')); } catch { /* ignore */ }
    if (this.hasAttribute('data-eager-lazy')) {
      void this.renderCurrentSprintEagerLazy(); // T30.1: 2-node eager-lazy tree
      // R40.17 LIVE-pin: subscribe to the CurrentSprint singleton's OWN ref (TARGETED — NOT the broad 'graph' channel,
      // which stays flood-excluded at the block below). A pin-designate notifies this ref → re-fetch ONLY the 2-node
      // pin, so the sprint tree updates LIVE with no Refresh @390 without re-rendering (flooding) the whole tree.
      this.unsub = ViewBus.subscribe('current-sprint-singleton-0000-000000000001', () => { void this.renderCurrentSprintEagerLazy(); });
    }
    else if (this._items) { this.renderItems(); } else { this.render(); }
    if (!this.getAttribute('data-seed-ior') && !this.hasAttribute('data-eager-lazy') && !this._items) { // R31.8c round-4 FIX-A2(a): an ITEMS-fed tree (server-manager / feature-manager) must NOT subscribe to graph updates — render() would wipe its items to the 'no graph' placeholder
      this.unsub = ViewBus.subscribe('graph', () => this.render());
    }
    this.addEventListener('toggle-children', this.onToggleChildren as EventListener);
    window.addEventListener('hashchange', this.onHashChange);
    document.addEventListener('rb-model-resynced', this.onModelResynced); // R32.8: re-render a MODEL (seed) tree after Re-Sync
    document.addEventListener('rb-tree-reveal', this.onTreeReveal); // R33.7.4: diagram box-select → reveal that element in the tree
  }
  disconnectedCallback(): void {
    this.unsub?.(); this.unsub = null;
    this.removeEventListener('toggle-children', this.onToggleChildren as EventListener);
    window.removeEventListener('hashchange', this.onHashChange);
    document.removeEventListener('rb-model-resynced', this.onModelResynced);
    document.removeEventListener('rb-tree-reveal', this.onTreeReveal);
  }

  // [impl:uuid:9cdf5072-baab-453a-a46b-3fa561e58faa] RbTraceTree.onTreeReveal (Method 152435d1) — R33.7.4 (RED-fix,
  // architect 9e56c218d): a diagram box-select dispatches rb-tree-reveal{ref}. The MODEL tree is SYNTHETIC folders
  // (not unit-parents), so revealNode's ownerIor/FWD_SCAN ancestor-walk returns parent:null for model elements → dead.
  // Instead build the EXPLICIT structural path from the element's /api/ior model (sourceFile + memberOf) and REUSE
  // R33.5 expandPath (INV-TR1 — the SAME reuse importPumlSrc uses), then scroll+highlight the leaf via highlightNode.
  private onTreeReveal = (e: Event): void => {
    const ref = (e as CustomEvent<{ ref?: string }>).detail?.ref || '';
    if (ref) void this.revealModelElement(refUuid(ref));
  };

  // R33.7.4 reveal a MODEL element by its synthetic mof path: mof-m1 → project:RawBin → rawbin:ts → file:<full-path>
  // → (owning class if a member) → the element. src/ files nest under RawBin/ts; other sourceFiles under project:<sf>
  // (mirrors mofChildren server.ts:1112-1119). expandPath opens each ancestor (ref*= substring, prefix-agnostic ':<uuid>'
  // for units), then highlightNode scrolls+flashes the leaf. Off-tree/absent → graceful no-op (INV-TR3, never throws).
  private async revealModelElement(uuid: string): Promise<void> {
    if (!uuid) return;
    try {
      const m = (await (await fetch(`/api/ior/ior:instance:${uuid}`)).json())?.unit?.model || null;
      if (!m) return;
      const sf = String(m.sourceFile || '');
      const ancestors = sf.startsWith('src/') ? ['mof-m1', 'project:RawBin', 'rawbin:ts', 'file:' + sf] : ['mof-m1', 'project:' + (sf || 'model')];
      const memberOf = m.memberOf ? (String(m.memberOf).split(':').pop() || '') : ''; // a member nests under its class
      if (memberOf) ancestors.push(':' + memberOf);
      await this.expandPath(ancestors);
      const leaf = this.querySelector(`rb-object-item[ref*=":${uuid}"]`) as HTMLElement | null;
      if (leaf) this.highlightNode(leaf); // scrollIntoView + flash = the AC's scroll + highlight
    } catch { /* INV-TR3 best-effort: reveal never throws */ }
  }

  // R32.8 AC3: a model Re-Sync (rb-diagram-detail) refreshed MODEL_STORE → re-render this tree if it's a seed
  // (model) tree so added elements appear + removed disappear. Trace trees are unaffected — the event only fires
  // from the model view. NO fork (reuses render()).
  private onModelResynced = (): void => { if (this.getAttribute('data-seed-ior')) void this.render(); };

  private onToggleChildren = (e: CustomEvent): void => {
    const item = (e.target as HTMLElement).closest('rb-object-item');
    if (!item) return;
    const ref = item.getAttribute('ref') || '';
    if (!ref) return;
    const node = item.closest('.tt-node');
    if (!node) return;
    if (e.detail.open) {
      this.expanded.add(ref);
      let kids = node.querySelector(':scope > .tt-children') as HTMLElement;
      if (!kids) {
        kids = document.createElement('div');
        kids.className = 'tt-children';
        node.appendChild(kids);
        if (this.graph) {
          const obj = this.graph.get(refUuid(ref));
          if (obj) {
            const ancestry = new Set<string>();
            let ancestor: Element | null = node;
            while (ancestor) {
              const aItem = ancestor.querySelector(':scope > .tt-row > rb-object-item');
              if (aItem) { const aRef = aItem.getAttribute('ref') || ''; if (aRef) ancestry.add(aRef); }
              ancestor = ancestor.parentElement?.closest('.tt-node') || null;
            }
            for (const cref of obj.children.map(c => c.ref())) {
              if (ancestry.has(cref)) continue;
              kids.appendChild(this.nodeEl(cref, ancestry));
            }
          }
        } else {
          this.fetchAndRenderChildren(refUuid(ref), kids);
        }
      }
      kids.style.display = '';
      requestAnimationFrame(() => (node as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    } else {
      this.expanded.delete(ref);
      const kids = node.querySelector(':scope > .tt-children') as HTMLElement;
      if (kids) kids.style.display = 'none';
    }
    this.persist();
  };

  private renderItems(): void {
    if (!this._items) { console.log('[renderItems] no _items'); return; }
    this.querySelectorAll(':scope > .tt-empty').forEach(e => e.remove()); // R31.8c round-4 FIX-A2(c): clear a stale 'no graph'/'Loading…' placeholder from a prior render() before reconciling items
    console.log(`[renderItems] roots=${this._items.length} isConnected=${this.isConnected} children=[${this._items.map(r => `${r.type}:${(r.children||[]).length}`).join(',')}]`);
    const existingRoots = new Map<string, HTMLElement>();
    this.querySelectorAll(':scope > .tt-node').forEach(n => {
      const item = n.querySelector('rb-object-item');
      const ref = item?.getAttribute('ref') || '';
      if (ref) existingRoots.set(ref, n as HTMLElement);
    });
    const wantedRefs = new Set<string>();
    for (const root of this._items) {
      const ref = `${(root.type || 'task').toLowerCase()}:${root.uuid}`;
      wantedRefs.add(ref);
      const ex = existingRoots.get(ref);
      if (ex) {
        console.log(`[renderItems] PATH-A(update) ref=${ref} children=${(root.children||[]).length}`);
        const item = ex.querySelector('rb-object-item') as any;
        if (item) item.data = { ref, type: (root.type || 'task').toLowerCase(), title: root.name, ...(root.description ? { description: root.description } : {}), ...((root.children || []).length > 0 || root.hasChildren === true ? { 'has-children': '' } : {}), ...((root.children || []).length ? { 'child-count': String((root.children || []).length) } : {}) }; // R31.3 BADGE + R31.8c: honor root.hasChildren (lazy roots keep the expander on re-render)
        ex.dataset.childRefCount = String((root.children || []).length || root.childCount || 0); // R31.8c round-4-fix RED-2: re-stamp child-ref count on UPDATE so computeBadges' max(domCount,refCount) reflects the FRESH server count (revoke → featureRoots childCount decrements → badge decrements); previously only item.data updated → stale refCount kept the old badge
        let kids = ex.querySelector('.tt-children') as HTMLElement;
        if (!kids && root.children && root.children.length > 0) {
          kids = document.createElement('div');
          kids.className = 'tt-children';
          kids.style.display = '';
          ex.appendChild(kids);
          if (item) { item.setAttribute('has-children', ''); item.setAttribute('children-open', ''); }
          console.log(`[renderItems] PATH-A created missing .tt-children for ref=${ref}`);
        }
        if (kids && root.children) {
          const existingChildren = new Map<string, HTMLElement>();
          kids.querySelectorAll(':scope > .tt-node').forEach(cn => {
            const ci = cn.querySelector('rb-object-item');
            const cr = ci?.getAttribute('ref') || '';
            if (cr) existingChildren.set(cr, cn as HTMLElement);
          });
          const wantedChildren = new Set<string>();
          for (const child of root.children) {
            const cref = `${(child.type || 'task').toLowerCase()}:${child.uuid}`;
            wantedChildren.add(cref);
            const cex = existingChildren.get(cref);
            if (cex) {
              const ci = cex.querySelector('rb-object-item') as any;
              if (ci) ci.data = { ref: cref, type: (child.type || 'task').toLowerCase(), title: child.name, ...(child.description ? { description: child.description } : {}), ...((child.children || []).length || child.hasChildren ? { 'has-children': '' } : {}), ...((child.children || []).length ? { 'child-count': String((child.children || []).length) } : {}) }; // R31.3 BADGE + keep chevron on re-render
              cex.dataset.childRefCount = String((child.children || []).length || child.childCount || 0); // R31.8c round-4-fix RED-2: same fresh-count re-stamp for nested nodes on UPDATE
            } else {
              kids.appendChild(this.buildSeedNode(child.uuid, child.type, child.name, child.children || [], (child.children || []).length > 0 || child.hasChildren === true, undefined, undefined, child.description)); // R31.3: pass inline children (windows keep their panes + chevron on re-render)
            }
          }
          for (const [cr, cn] of existingChildren) { if (!wantedChildren.has(cr)) cn.remove(); }
        }
      } else {
        console.log(`[renderItems] PATH-B(new) ref=${ref} children=${(root.children||[]).length}`);
        const node = this.buildSeedNode(root.uuid, root.type, root.name, root.children || [], (root.children || []).length > 0 || root.hasChildren === true, undefined, undefined, root.description, undefined, undefined, root.childCount); // R31.8c fix: honor root.hasChildren for LAZY top-level roots (featureRoots: hasChildren:true, no inline children) → expander renders → children reachable. round-2 AC4: thread root.childCount → serverChildCount → collapsed badge shows the real count (was 0).
        this.appendChild(node);
        // R31.3: NO force-open — roots start COLLAPSED (layer-by-layer); buildSeedNode opens a level only per
        // data-always-expanded / persisted-expanded, so a fresh multi-level tree no longer explodes-then-settles.
      }
    }
    for (const [ref, n] of existingRoots) { if (!wantedRefs.has(ref)) n.remove(); }
    this.computeBadges();
  }

  setGraph(graph: TraceGraph, brokenUuids: string[] = []): void {
    this.graph = graph;
    this.brokenUuids = new Set(brokenUuids);
    if (this.isConnected) this.render();
  }

  private persist(): void {
    try { localStorage.setItem(this.lsKey, JSON.stringify([...this.expanded])); } catch { /* ignore */ }
  }

  render(): void {
    if (this._items) { this.renderItems(); return; } // R31.8c round-4 FIX-A2(b): items-fed tree renders its items, never the 'no graph' branch (a stray render() must not wipe server-manager/feature-manager)
    const seedIor = this.getAttribute('data-seed-ior');
    if (seedIor) { if (!this._seedAbort) this.renderSeed(seedIor); return; }
    if (!this.graph) { this.innerHTML = '<div class="tt-empty">no graph</div>'; return; }
    const roots = this.graph.ofType('requirement');
    this.innerHTML = '';

    // Walk forward-only from requirement roots (LOCKED chain children)
    const reachable = new Set<string>();
    const walk = (ref: string) => {
      if (reachable.has(ref)) return;
      reachable.add(ref);
      const obj = this.graph!.get(refUuid(ref));
      if (obj) obj.children.forEach(c => walk(c.ref()));
    };
    for (const r of roots) walk(r.ref());

    for (const obj of roots) this.appendChild(this.nodeEl(obj.ref(), new Set()));

    // T165: orphan items — typed objects not reachable from any requirement
    const orphans = this.graph.all().filter(o => !reachable.has(o.ref()));
    if (orphans.length > 0) {
      const hdr = document.createElement('div');
      hdr.className = 'tt-orphan-header';
      hdr.textContent = `Orphan items (${orphans.length})`;
      hdr.style.cssText = 'color:rgba(255,255,255,0.5);font-size:0.75rem;padding:8px 4px 4px;border-top:1px solid rgba(255,255,255,0.1);margin-top:8px';
      this.appendChild(hdr);
      for (const obj of orphans) this.appendChild(this.nodeEl(obj.ref(), new Set()));
    }
    this.computeBadges();
    this.prefetchVisibleLayer();
    if (this.pendingReveal) { const u = this.pendingReveal; this.pendingReveal = null; requestAnimationFrame(() => this.revealNode(u)); }
  }

  /** Build a node row (rb-object-item with built-in expander) and, if expanded, its children. */
  private nodeEl(ref: string, ancestry: Set<string>): HTMLElement {
    const node = document.createElement('div');
    node.className = 'tt-node';
    const obj = this.graph!.get(refUuid(ref));
    const childRefs = obj ? obj.children.map(c => c.ref()) : [];
    const hasChildren = childRefs.length > 0 && !ancestry.has(ref);
    const isOpen = this.expanded.has(ref);

    const row = document.createElement('div');
    row.className = 'tt-row';
    const item = document.createElement('rb-object-item') as any;
    const nodeCount = childRefs.length; // R31.3 BADGE-via-REFERENCES: the count IS the child-reference array length (obj.children) — the scenario tree's native pattern; stamp it on the node like buildSeedNode
    node.dataset.childRefCount = String(nodeCount);
    item.data = { ref, type: obj ? obj.type : ref.split(':')[0], title: obj ? obj.title : ref, ...(obj?.title ? { description: obj.title } : {}), ...(obj?.status ? { status: obj.status } : {}), ...(hasChildren ? { 'has-children': '' } : {}), ...(hasChildren && nodeCount ? { 'child-count': String(nodeCount) } : {}), ...(hasChildren && isOpen ? { 'children-open': '' } : {}) };
    if (this.brokenUuids.has(refUuid(ref))) {
      const warn = document.createElement('span');
      warn.className = 'tt-warn'; warn.title = 'traceability issue (T102)'; warn.textContent = '⚠️';
      row.appendChild(warn);
    }
    row.appendChild(item);
    node.appendChild(row);

    if (hasChildren && isOpen) {
      const kids = document.createElement('div');
      kids.className = 'tt-children';
      const nextAncestry = new Set(ancestry); nextAncestry.add(ref);
      for (const cref of childRefs) kids.appendChild(this.nodeEl(cref, nextAncestry));
      node.appendChild(kids);
    } else if (hasChildren) {
      item.setAttribute('has-children', '');
    }
    return node;
  }

  private scenarioExpandKey(): string {
    return `rawbin-scenario-expanded-${this.getAttribute('data-seed-ior') || ''}`;
  }

  private isSeedExpanded(uuid: string): boolean {
    try { return new Set(JSON.parse(localStorage.getItem(this.scenarioExpandKey()) || '[]')).has(uuid); } catch { return false; }
  }

  private toggleSeedExpanded(uuid: string, open: boolean): void {
    try {
      const set = new Set(JSON.parse(localStorage.getItem(this.scenarioExpandKey()) || '[]'));
      if (open) set.add(uuid); else set.delete(uuid);
      localStorage.setItem(this.scenarioExpandKey(), JSON.stringify([...set]));
    } catch { /* ignore */ }
  }

  async renderSeed(rawUuid: string): Promise<void> {
    const uuid = rawUuid.replace(/^ior:instance:/, '').replace(/\.scenario\.json$/, '').trim();
    cancelAnimationFrame(this._seedRafId);
    this._seedRafId = requestAnimationFrame(() => this._doRenderSeed(uuid));
  }

  private async _doRenderSeed(uuid: string): Promise<void> {
    if (this._seedAbort) this._seedAbort.abort();
    const ctrl = new AbortController();
    this._seedAbort = ctrl;
    this.innerHTML = '<div class="tt-empty">Loading…</div>';
    try {
      const res = await fetch(`/api/trace/children/${encodeURIComponent(uuid)}${this.modeParam}`, { signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      if (!res.ok) { this.innerHTML = '<div class="tt-empty">Not found</div>'; return; }
      const data = await res.json();
      if (ctrl.signal.aborted) return;
      const frag = document.createDocumentFragment();
      // [impl:uuid:76bbedda-a1b2-4c3d-8e4f-5a6b7c8d9e05] R20.3 defaultChildrenHidden
      const rootNode = this.buildSeedNode(uuid, data.type, data.name, data.children || [], data.hasChildren);
      frag.appendChild(rootNode);
      this.innerHTML = '';
      this.appendChild(frag);
      this.computeBadges();
      this.prefetchVisibleLayer();
      this._seedAbort = null;
    } catch (e: any) { if (e?.name !== 'AbortError') { this.innerHTML = '<div class="tt-empty">Failed to load</div>'; this._seedAbort = null; } }
  }

  // [impl:uuid:5b3d9f1a-2e6c-4a7b-9c4d-8f1e0a2b6d3c] R31.3 RbTraceTree.buildSeedNode (Method 08ad3bdd, off UC 6b1132ce)
  // N-LEVEL LAYER-BY-LAYER: build a node + expander from (children.length || hasChildren); STORE the inline children
  // and build ONLY the direct child layer, lazily on first open (no eager grandchild recursion = kills explode-then-
  // settle). Each direct child is itself collapsed with its own chevron. Backward-compat with /trace: an API-backed
  // node (no inline children, hasChildren:true) still lazy-fetches on open. data-always-expanded/shouldStartOpen/
  // persisted-expanded drive initial open state per level.
  private buildSeedNode(uuid: string, type: string, name: string, children: TreeNode[], hasChildren?: boolean, ancestors?: Set<string>, chainMethod?: { uuid: string; type: string; name: string }, description?: string, shouldStartOpen?: boolean, status?: string, serverChildCount?: number): HTMLElement {
    const node = document.createElement('div');
    node.className = 'tt-node';
    if (ancestors && ancestors.has(uuid)) return node;
    const row = document.createElement('div');
    row.className = 'tt-row';
    const item = document.createElement('rb-object-item') as any;
    const showExpander = children.length > 0 || hasChildren === true;
    const itemRef = `${(type || 'task').toLowerCase()}:${uuid}`;
    const forceOpen = this.hasAttribute('data-always-expanded');
    // R31.3 BADGE-via-REFERENCES: the badge SOURCE OF TRUTH is the node's own child-REFERENCE count (an array length,
    // NOT a colon-keyed side map) — stamp it on the node element. Inline children → children.length; else an API-lazy
    // node uses the server's per-node count. NO nodeChildCount map, NO refUuid/split — colon-immune by construction.
    const childRefCount = (children && children.length) || (hasChildren ? (serverChildCount ?? '') : 0);
    node.dataset.childRefCount = String(childRefCount);
    item.data = { ref: itemRef, type: (type || 'task').toLowerCase(), title: name || uuid, ...(description ? { description } : {}), ...(status ? { status } : {}), ...(showExpander ? { 'has-children': '' } : {}), ...(showExpander && childRefCount ? { 'child-count': String(childRefCount) } : {}), ...((forceOpen || shouldStartOpen) && showExpander ? { 'children-open': '' } : {}) };
    console.log(`[buildSeedNode] ref=${itemRef} children=${children.length} hasChildren=${hasChildren}`);
    row.appendChild(item);
    node.appendChild(row);
    if (showExpander) {
      const kids = document.createElement('div');
      kids.className = 'tt-children';
      const alwaysExpanded = this.hasAttribute('data-always-expanded');
      // R31.3: per-level initial open = data-always-expanded OR caller shouldStartOpen OR persisted expanded-set.
      const startOpen = alwaysExpanded || shouldStartOpen === true || this.expanded.has(itemRef);
      kids.style.display = startOpen ? '' : 'none';
      const branchPath = new Set(ancestors || []); branchPath.add(uuid);
      // R31.3 LAYER-BY-LAYER: STORE the inline children; build ONLY the DIRECT layer, and only when opened — NO eager
      // grandchild recursion (killed the :339 explode-then-settle). Each direct child is itself collapsed with its own
      // chevron (recursively storing ITS inline children) → N levels reveal one layer per expand. Record child counts
      // so badges show real numbers before a layer is built.
      const inlineKids = children || [];
      let loaded = false;
      const buildDirectLayer = (): void => {
        if (loaded) return; loaded = true;
        for (const child of inlineKids) {
          const gk = child.children || [];
          kids.appendChild(this.buildSeedNode(child.uuid, child.type, child.name, gk, gk.length > 0 || child.hasChildren === true, new Set(branchPath), child.chainMethod, child.description, alwaysExpanded, child.status, child.childCount)); // R31.3: pass the child's server count → stamped on ITS node (badge before its layer builds)
        }
      };
      if (startOpen && inlineKids.length) buildDirectLayer();
      node.appendChild(kids);
      item.addEventListener('toggle-children', ((e: CustomEvent) => {
        e.stopPropagation();
        const open = e.detail.open;
        kids.style.display = open ? '' : 'none';
        this.toggleSeedExpanded(uuid, open);
        if (open && !loaded) {
          if (inlineKids.length) buildDirectLayer();                                   // inline data (e.g. server-manager) → build the direct layer
          else if (chainMethod) { loaded = true; kids.appendChild(this.buildSeedNode(chainMethod.uuid, chainMethod.type, chainMethod.name, [], true, new Set(branchPath))); }
          else { loaded = true; this.fetchAndRenderChildren(uuid, kids, branchPath); }  // API-backed (e.g. /trace deep layers) → lazy fetch
        }
        if (open) requestAnimationFrame(() => node.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
      }) as EventListener);
    }
    return node;
  }

  // [impl:uuid:e649a695-331a-4631-9072-e04abecc27ce] R30.1 RbTraceTree.renderCurrentSprintEagerLazy
  // T30.1 eager-lazy tree: exactly TWO top-level nodes — (1) "CurrentSprint: Sprint <N>" with 3 EAGER slot children
  // (Current/Last Completed/Next Backlog); (2) "Sprints 01-<N>" COLLAPSED collection (badge=sprint count) with EAGER
  // sprint-nodes whose TASKS load LAZILY on expand — via the SHARED R26.1 loader (buildSeedNode → fetchAndRenderChildren),
  // never a 2nd loader. Structure eager / payload lazy.
  async renderCurrentSprintEagerLazy(): Promise<void> {
    const CS = 'current-sprint-singleton-0000-000000000001';
    let sprints: Array<{ uuid: string; name: string; number?: number; hasChildren?: boolean; childCount?: number }> = [];
    let slots: Array<{ uuid: string; type: string; name: string; hasChildren?: boolean; status?: string }> = [];
    let sprintName = 'Current Sprint';
    try {
      const [spRes, csRes, iorRes] = await Promise.all([
        fetch('/api/trace/sprints'),
        fetch(`${this.childrenUrl}${encodeURIComponent(CS)}?mode=trace`),
        fetch(`/api/ior/ior:instance:${CS}`),
      ]);
      sprints = await spRes.json();
      slots = (await csRes.json()).children || [];
      const model = (await iorRes.json())?.unit?.model || {};
      sprintName = String(model.sprintName || 'Current Sprint');
    } catch { /* degrade to whatever loaded */ }
    sprints = (sprints || []).slice().sort((a, b) => (b.number || 0) - (a.number || 0)); // R40.50: DESCENDING (Sprint 40 on top) — a<->b flipped
    const N = sprints.length ? Math.max(...sprints.map((s) => s.number || 0)) : 0; // R40.50 COUPLING FIX: sprints[len-1] was the MAX only while ascending — Math.max is order-independent so the sprint-number label survives the flip
    const pad2 = (n: number) => String(n).padStart(2, '0');

    this.innerHTML = '';
    // (1) CurrentSprint — 3 EAGER slot children, OPEN
    const csKids = slots.map(s => ({ uuid: s.uuid, type: s.type || 'Task', name: s.name, hasChildren: s.hasChildren !== false, status: s.status }));
    const csNode = this.buildSeedNode(CS, 'CurrentSprint', `CurrentSprint: ${sprintName}`, csKids, true, undefined, undefined, undefined, true);
    csNode.classList.add('cs-pin-node'); // R40.18 (Tron "i DONT want it TRUNCATED"): scope the no-truncation wrap to the pin SLOT rows ONLY via a marker class (app.css .cs-pin-node) — never global .oi-name (every tree row would wrap = layout change nobody asked for)
    this.appendChild(csNode);
    // R40.18 defect-1 FIX (Tron @390 screenshot): the CSS un-truncate is not enough — rb-object-item renders generateName(title)
    // (SHORTENED for compact tree rows) into .oi-name, so the pin row showed "Task 37.24:…" with a LITERAL ellipsis. Set the
    // FULL name as the `name` attr on each pin SLOT item → render uses getAttribute('name') verbatim (bypasses generateName);
    // the scoped .cs-pin-node CSS then wraps the full string. Re-applied every pin render (this method re-runs on the emit).
    csNode.querySelectorAll(':scope > .tt-children > .tt-node > .tt-row > rb-object-item').forEach((it) => {
      const full = it.getAttribute('title'); if (full) it.setAttribute('name', full);
    });
    // (2) Sprints collection — EAGER sprint-nodes (tasks LAZY on expand), COLLAPSED, badge=sprint count
    // R31.3 BADGE-via-REFERENCES: carry each sprint's server task-count as childCount → buildSeedNode stamps it on the
    // node's dataset.childRefCount so the badge shows the real N before its tasks lazy-load (no nodeChildCount map).
    const spKids = sprints.map(sp => ({ uuid: sp.uuid, type: 'Sprint', name: sp.name, hasChildren: sp.hasChildren !== false, childCount: sp.childCount })); // R40.4-phase2: /api/trace/sprints already composes 'Sprint N: title' server-side (single-source) → render verbatim, no client re-compose (was the drift risk)
    this.appendChild(this.buildSeedNode('sprints-collection-30-1', 'collection', `Sprints 01-${pad2(N)}`, spKids, true, undefined, undefined, undefined, false));
    this.computeBadges();
  }

  async revealNode(uuid: string): Promise<void> {
    const seed = this.getAttribute('data-seed-ior') || 'graph';
    console.log(`[revealNode] uuid=${uuid} seed=${seed} hasNodes=${!!this.querySelector('.tt-node')}`);
    if (!this.querySelector('.tt-node')) { this.pendingReveal = uuid; console.log(`[revealNode] QUEUED`); return; }
    const selector = `rb-object-item[ref*=":${uuid}"]`;
    const existing = this.querySelector(selector);
    if (existing) {
      console.log(`[revealNode] FOUND ref=${existing.getAttribute('ref')}`);
      this.highlightNode(existing as HTMLElement);
      return;
    }
    console.log(`[revealNode] NOT in DOM, fetching ancestors...`);
    const path = await this.fetchAncestorPath(uuid);
    console.log(`[revealNode] path=[${path.join(',')}] len=${path.length}`);
    if (path.length === 0) { console.log(`[revealNode] EMPTY path`); return; }
    const rootInTree = this.querySelector(`rb-object-item[ref*=":${path[0]}"]`);
    console.log(`[revealNode] pathRoot=${path[0]} inTree=${!!rootInTree} rootRef=${rootInTree?.getAttribute('ref')}`);
    if (!rootInTree) { console.log(`[revealNode] SKIP — root not in this tree`); return; }
    for (let i = 0; i < path.length; i++) {
      const aUuid = path[i];
      const item = this.querySelector(`rb-object-item[ref*=":${aUuid}"]`) as HTMLElement;
      console.log(`[revealNode] step[${i}] ancestor=${aUuid} found=${!!item} ref=${item?.getAttribute('ref')} open=${item?.hasAttribute('children-open')}`);
      if (!item) { console.log(`[revealNode] BREAK — not in DOM`); break; }
      if (!item.hasAttribute('children-open')) {
        item.dispatchEvent(new CustomEvent('toggle-children', { bubbles: true, detail: { open: true } }));
        const nextUuid = i < path.length - 1 ? path[i + 1] : uuid;
        console.log(`[revealNode] expanded, waiting for next=${nextUuid}`);
        await this.waitForNode(nextUuid);
        const appeared = !!this.querySelector(`rb-object-item[ref*=":${nextUuid}"]`);
        console.log(`[revealNode] next appeared=${appeared}`);
      }
    }
    const target = this.querySelector(selector);
    console.log(`[revealNode] FINAL target=${!!target} ref=${target?.getAttribute('ref')}`);
    if (target) this.highlightNode(target as HTMLElement);
    else console.log(`[revealNode] FAIL — target never appeared`);
  }

  private waitForNode(uuid: string, timeout = 5000): Promise<void> {
    return new Promise(resolve => {
      const sel = `rb-object-item[ref*=":${uuid}"]`;
      const check = () => {
        if (this.querySelector(sel)) { resolve(); return; }
        if ((performance.now() - start) > timeout) { console.log(`[waitForNode] TIMEOUT uuid=${uuid}`); resolve(); return; }
        requestAnimationFrame(check);
      };
      const start = performance.now();
      check();
    });
  }

  private async fetchAncestorPath(uuid: string): Promise<string[]> {
    const path: string[] = [];
    let current = uuid;
    const seen = new Set<string>();
    for (let i = 0; i < 10; i++) {
      if (seen.has(current)) break;
      seen.add(current);
      try {
        const res = await fetch(`/api/trace/children/${encodeURIComponent(current)}${this.modeParam}`);
        if (!res.ok) { console.log(`[fetchAncestorPath] ${res.status} for ${current}`); break; }
        const data = await res.json();
        const parentUuid = data.parent?.uuid;
        console.log(`[fetchAncestorPath] ${current} (${data.type}) → parent=${parentUuid || 'NULL'}`);
        if (!parentUuid) break;
        path.unshift(parentUuid);
        current = parentUuid;
      } catch (e) { console.log(`[fetchAncestorPath] ERR`, e); break; }
    }
    return path;
  }

  private highlightNode(el: HTMLElement): void {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const node = el.closest('.tt-node');
    if (node) {
      node.classList.add('tt-highlighted');
      setTimeout(() => node.classList.remove('tt-highlighted'), 2000);
    }
  }

  private onHashChange = (): void => {
    const hash = location.hash.replace('#', '');
    const m = hash.match(/uuid=([0-9a-f-]{36})/i);
    if (m) this.revealNode(m[1]);
  };

  // R31.3 BADGE-via-REFERENCES: badge = max(real built rows once a layer exists, the node's stamped child-REFERENCE
  // count). The count lives on node.dataset.childRefCount (an array length stamped at build in buildSeedNode) — NO
  // nodeChildCount map, NO refUuid/split(':'). Colon-immune by construction (session uuids like 'sess:NAME' no longer
  // break the lookup). [R31.3: eagerChildCountBadges RETIRED — its Impl d28ee95a is now orphaned, req to retire it.]
  // Marker for this method = 7e43dda4 (top of file).
  computeBadges(root?: HTMLElement): void {
    const scope = root || this;
    scope.querySelectorAll('rb-object-item[has-children]').forEach(item => {
      const node = item.closest('.tt-node') as HTMLElement | null;
      const children = node?.querySelector(':scope > .tt-children');
      const domCount = children ? children.querySelectorAll(':scope > .tt-node').length : 0;
      const refCount = Number(node?.dataset.childRefCount) || 0;
      item.setAttribute('child-count', String(Math.max(domCount, refCount)));
    });
  }

  private prefetchLayer(node: HTMLElement): Promise<void> {
    const item = node.querySelector(':scope > .tt-row rb-object-item');
    const uuid = refUuid(item?.getAttribute('ref') || ''); // same colon-in-uuid safety as computeBadges (refUuid = after the FIRST colon)
    if (!uuid || this.prefetchCache.has(uuid) || this.prefetchInFlight.has(uuid)) return Promise.resolve();
    this.prefetchInFlight.add(uuid);
    return fetch(`${this.childrenUrl}${encodeURIComponent(uuid)}${this.modeParam}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { this.prefetchCache.set(uuid, data.children || []); node.dataset.childRefCount = String((data.children || []).length); if (item) item.setAttribute('child-count', String((data.children || []).length)); } }) // R31.3: stamp the actual prefetched count on the node → computeBadges' single source
      .catch(() => {})
      .finally(() => this.prefetchInFlight.delete(uuid));
  }

  prefetchVisibleLayer(root?: HTMLElement): Promise<void> {
    const scope = root || this;
    const nodes = [...scope.querySelectorAll('.tt-node')].filter(n => n.querySelector(':scope > .tt-row rb-object-item[has-children]'));
    return Promise.all(nodes.map(n => this.prefetchLayer(n as HTMLElement))).then(() => {});
  }

  private async fetchAndRenderChildren(uuid: string, container: HTMLElement, ancestors?: Set<string>): Promise<void> {
    const branchVisited = new Set(ancestors || []);
    branchVisited.add(uuid);
    try {
      let children: any[];
      const cached = this.prefetchCache.get(uuid);
      if (cached) {
        children = cached;
        this.prefetchCache.delete(uuid);
      } else {
        const res = await fetch(`${this.childrenUrl}${encodeURIComponent(uuid)}${this.modeParam}`);
        if (!res.ok) return;
        const data = await res.json();
        children = data.children || [];
      }
      for (const child of children) {
        // R31.3 BADGE-via-REFERENCES: pass the child's server count → buildSeedNode stamps node.dataset.childRefCount (no map, level-by-level badge correct before ITS children load)
        container.appendChild(this.buildSeedNode(child.uuid, child.type, child.name, [], child.hasChildren, new Set(branchVisited), (child as any).chainMethod, (child as any).description, false, (child as any).status, (child as any).childCount));
      }
      const parentItem = container.parentElement?.querySelector(':scope > .tt-row rb-object-item');
      if (parentItem) parentItem.setAttribute('child-count', String(children.length));
      this.computeBadges(container);
      this.prefetchVisibleLayer(container);
    } catch { /* silently fail — node stays collapsed */ }
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-trace-tree')) {
  customElements.define('rb-trace-tree', RbTraceTree);
}
