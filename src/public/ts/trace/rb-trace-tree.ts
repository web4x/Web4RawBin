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

export class RbTraceTree extends HTMLElement {
  graph: TraceGraph | null = null;
  brokenUuids = new Set<string>();
  private expanded = new Set<string>();
  private unsub: (() => void) | null = null;
  private pendingReveal: string | null = null;
  private prefetchCache = new Map<string, any[]>();
  private prefetchInFlight = new Set<string>();
  private _items: { uuid: string; type: string; name: string; description?: string; children?: { uuid: string; type: string; name: string; description?: string; hasChildren: boolean }[] }[] | null = null;

  private get mode(): string { return this.getAttribute('data-mode') || 'scenario'; }
  private get lsKey(): string { return this.mode === 'room' ? 'rawbin-room-expanded' : LS_KEY; }
  private get childrenUrl(): string { return `/api/trace/children/`; }
  private get modeParam(): string { return this.mode === 'trace' ? '?mode=trace' : ''; }

  set items(roots: { uuid: string; type: string; name: string; description?: string; children?: { uuid: string; type: string; name: string; description?: string; hasChildren: boolean }[] }[]) {
    this._items = roots;
    if (this.isConnected) this.renderItems();
  }
  get items() { return this._items; }

  private upgradeProperty(prop: string): void {
    if (this.hasOwnProperty(prop)) {
      const val = (this as any)[prop];
      delete (this as any)[prop];
      (this as any)[prop] = val;
    }
  }

  connectedCallback(): void {
    this.classList.add('trace-tree');
    this.upgradeProperty('items');
    this.upgradeProperty('graph');
    try { this.expanded = new Set(JSON.parse(localStorage.getItem(this.lsKey) || '[]')); } catch { /* ignore */ }
    if (this._items) { this.renderItems(); } else { this.render(); }
    this.unsub = ViewBus.subscribe('graph', () => this.render());
    this.addEventListener('toggle-children', this.onToggleChildren as EventListener);
    window.addEventListener('hashchange', this.onHashChange);
  }
  disconnectedCallback(): void {
    this.unsub?.(); this.unsub = null;
    this.removeEventListener('toggle-children', this.onToggleChildren as EventListener);
    window.removeEventListener('hashchange', this.onHashChange);
  }

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
        if (item) item.data = { ref, type: (root.type || 'task').toLowerCase(), title: root.name, ...(root.description ? { description: root.description } : {}), 'has-children': (root.children || []).length > 0 ? '' : undefined };
        const kids = ex.querySelector('.tt-children') as HTMLElement;
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
              if (ci) ci.data = { ref: cref, type: (child.type || 'task').toLowerCase(), title: child.name, ...(child.description ? { description: child.description } : {}) };
            } else {
              kids.appendChild(this.buildSeedNode(child.uuid, child.type, child.name, [], child.hasChildren, undefined, undefined, child.description));
            }
          }
          for (const [cr, cn] of existingChildren) { if (!wantedChildren.has(cr)) cn.remove(); }
        }
      } else {
        console.log(`[renderItems] PATH-B(new) ref=${ref} children=${(root.children||[]).length}`);
        const node = this.buildSeedNode(root.uuid, root.type, root.name, root.children || [], (root.children || []).length > 0, undefined, undefined, root.description);
        this.appendChild(node);
        const item = node.querySelector('rb-object-item');
        if (item && !item.hasAttribute('children-open')) {
          item.setAttribute('children-open', '');
          const kids = node.querySelector('.tt-children') as HTMLElement;
          if (kids) kids.style.display = '';
        }
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
    const seedIor = this.getAttribute('data-seed-ior');
    if (seedIor) { this.renderSeed(seedIor); return; }
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
    item.data = { ref, type: obj ? obj.type : ref.split(':')[0], title: obj ? obj.title : ref, ...(obj?.title ? { description: obj.title } : {}), ...(obj?.status ? { status: obj.status } : {}), ...(hasChildren ? { 'has-children': '' } : {}), ...(hasChildren && isOpen ? { 'children-open': '' } : {}) };
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

  private async renderSeed(rawUuid: string): Promise<void> {
    const uuid = rawUuid.replace(/^ior:instance:/, '').replace(/\.scenario\.json$/, '').trim();
    this.innerHTML = '<div class="tt-empty">Loading…</div>';
    try {
      const res = await fetch(`/api/trace/children/${encodeURIComponent(uuid)}${this.modeParam}`);
      if (!res.ok) { this.innerHTML = '<div class="tt-empty">Not found</div>'; return; }
      const data = await res.json();
      this.innerHTML = '';
      this.appendChild(this.buildSeedNode(uuid, data.type, data.name, data.children || [], data.hasChildren));
      this.computeBadges();
      this.prefetchVisibleLayer();
    } catch { this.innerHTML = '<div class="tt-empty">Failed to load</div>'; }
  }

  private buildSeedNode(uuid: string, type: string, name: string, children: { uuid: string; type: string; name: string; description?: string; hasChildren: boolean; chainMethod?: { uuid: string; type: string; name: string } }[], hasChildren?: boolean, ancestors?: Set<string>, chainMethod?: { uuid: string; type: string; name: string }, description?: string): HTMLElement {
    const node = document.createElement('div');
    node.className = 'tt-node';
    if (ancestors && ancestors.has(uuid)) return node;
    const row = document.createElement('div');
    row.className = 'tt-row';
    const item = document.createElement('rb-object-item') as any;
    const showExpander = children.length > 0 || hasChildren === true;
    const itemRef = `${(type || 'task').toLowerCase()}:${uuid}`;
    item.data = { ref: itemRef, type: (type || 'task').toLowerCase(), title: name || uuid, ...(description ? { description } : {}), ...(showExpander ? { 'has-children': '' } : {}) };
    console.log(`[buildSeedNode] ref=${itemRef} children=${children.length} hasChildren=${hasChildren}`);
    row.appendChild(item);
    node.appendChild(row);
    if (showExpander) {
      const kids = document.createElement('div');
      kids.className = 'tt-children';
      kids.style.display = 'none';
      let loaded = children.length > 0;
      const branchPath = new Set(ancestors || []); branchPath.add(uuid);
      for (const child of children) {
        kids.appendChild(this.buildSeedNode(child.uuid, child.type, child.name, [], child.hasChildren, new Set(branchPath), (child as any).chainMethod, (child as any).description));
      }
      node.appendChild(kids);
      item.addEventListener('toggle-children', ((e: CustomEvent) => {
        e.stopPropagation();
        const open = e.detail.open;
        kids.style.display = open ? '' : 'none';
        this.toggleSeedExpanded(uuid, open);
        if (open && !loaded) {
          loaded = true;
          if (chainMethod) {
            kids.appendChild(this.buildSeedNode(chainMethod.uuid, chainMethod.type, chainMethod.name, [], true, new Set(branchPath)));
          } else {
            this.fetchAndRenderChildren(uuid, kids, branchPath);
          }
        }
        if (open) requestAnimationFrame(() => node.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
      }) as EventListener);
    }
    return node;
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

  computeBadges(root?: HTMLElement): void {
    const scope = root || this;
    scope.querySelectorAll('rb-object-item[has-children]').forEach(item => {
      const node = item.closest('.tt-node');
      const children = node?.querySelector(':scope > .tt-children');
      const count = children ? children.querySelectorAll(':scope > .tt-node').length : 0;
      const cached = this.prefetchCache.get(item.getAttribute('ref')?.split(':')[1] || '');
      item.setAttribute('child-count', String(cached?.length ?? count));
    });
  }

  private prefetchLayer(node: HTMLElement): Promise<void> {
    const item = node.querySelector(':scope > .tt-row rb-object-item');
    const uuid = item?.getAttribute('ref')?.split(':')[1] || '';
    if (!uuid || this.prefetchCache.has(uuid) || this.prefetchInFlight.has(uuid)) return Promise.resolve();
    this.prefetchInFlight.add(uuid);
    return fetch(`${this.childrenUrl}${encodeURIComponent(uuid)}${this.modeParam}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) { this.prefetchCache.set(uuid, data.children || []); if (item) item.setAttribute('child-count', String((data.children || []).length)); } })
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
        container.appendChild(this.buildSeedNode(child.uuid, child.type, child.name, [], child.hasChildren, new Set(branchVisited), (child as any).chainMethod, (child as any).description));
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
