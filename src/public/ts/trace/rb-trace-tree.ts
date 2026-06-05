/**
 * T108 — rb-trace-tree: the traceability graph as an expand/collapse TREE (sibling to the
 * file tree in /edit). Root = requirements; expanding walks the typed chain via each object's
 * links (req→task→useCase→class→method→impl/test). Node rows reuse <rb-object-item> (T105),
 * so a node click navigates to its DetailView (T107) through the active router. Expand state
 * persisted (localStorage, like rb-file-tree). Broken/dangling nodes (T102 validate) get a
 * warning marker — shown, never hidden.
 *
 * [impl:uuid:108b7283-94a5-46b7-898e-b08080808108] R15.7 traceability browser
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

  private get mode(): string { return this.getAttribute('data-mode') || 'scenario'; }
  private get childrenUrl(): string { return `/api/trace/children/`; }
  private get modeParam(): string { return this.mode === 'trace' ? '?mode=trace' : ''; }

  connectedCallback(): void {
    this.classList.add('trace-tree');
    try { this.expanded = new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); } catch { /* ignore */ }
    this.render();
    this.unsub = ViewBus.subscribe('graph', () => this.render());
    this.addEventListener('toggle-children', this.onToggleChildren as EventListener);
  }
  disconnectedCallback(): void {
    this.unsub?.(); this.unsub = null;
    this.removeEventListener('toggle-children', this.onToggleChildren as EventListener);
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
    } else {
      this.expanded.delete(ref);
      const kids = node.querySelector(':scope > .tt-children') as HTMLElement;
      if (kids) kids.style.display = 'none';
    }
    this.persist();
  };

  setGraph(graph: TraceGraph, brokenUuids: string[] = []): void {
    this.graph = graph;
    this.brokenUuids = new Set(brokenUuids);
    if (this.isConnected) this.render();
  }

  private persist(): void {
    try { localStorage.setItem(LS_KEY, JSON.stringify([...this.expanded])); } catch { /* ignore */ }
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
    const item = document.createElement('rb-object-item');
    item.setAttribute('ref', ref);
    item.setAttribute('type', obj ? obj.type : ref.split(':')[0]);
    item.setAttribute('title', obj ? obj.title : ref);
    if (obj && obj.title) item.setAttribute('description', obj.title);
    if (obj && obj.status) item.setAttribute('status', obj.status);
    if (hasChildren) {
      item.setAttribute('has-children', '');
      if (isOpen) item.setAttribute('children-open', '');
    }
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
    } catch { this.innerHTML = '<div class="tt-empty">Failed to load</div>'; }
  }

  private buildSeedNode(uuid: string, type: string, name: string, children: { uuid: string; type: string; name: string; hasChildren: boolean }[], hasChildren?: boolean, ancestors?: Set<string>): HTMLElement {
    const visited = ancestors || new Set<string>();
    const node = document.createElement('div');
    node.className = 'tt-node';
    if (visited.has(uuid)) {
      node.innerHTML = `<div class="tt-row" style="opacity:0.4;font-size:0.75rem;padding:2px 8px">↻ cycle: ${name || uuid.slice(0, 8)}</div>`;
      return node;
    }
    const row = document.createElement('div');
    row.className = 'tt-row';
    const item = document.createElement('rb-object-item');
    item.setAttribute('ref', `${(type || 'task').toLowerCase()}:${uuid}`);
    item.setAttribute('type', (type || 'task').toLowerCase());
    item.setAttribute('title', name || uuid);
    const showExpander = (children.length > 0 || hasChildren === true) && !visited.has(uuid);
    if (showExpander) item.setAttribute('has-children', '');
    row.appendChild(item);
    node.appendChild(row);
    if (showExpander) {
      const kids = document.createElement('div');
      kids.className = 'tt-children';
      kids.style.display = 'none';
      let loaded = children.length > 0;
      const childAncestors = new Set(visited); childAncestors.add(uuid);
      for (const child of children) {
        kids.appendChild(this.buildSeedNode(child.uuid, child.type, child.name, [], child.hasChildren, childAncestors));
      }
      node.appendChild(kids);
      item.addEventListener('toggle-children', ((e: CustomEvent) => {
        const open = e.detail.open;
        kids.style.display = open ? '' : 'none';
        this.toggleSeedExpanded(uuid, open);
        if (open && !loaded) {
          loaded = true;
          this.fetchAndRenderChildren(uuid, kids, childAncestors);
        }
      }) as EventListener);
    }
    return node;
  }

  private async fetchAndRenderChildren(uuid: string, container: HTMLElement, ancestors?: Set<string>): Promise<void> {
    const visited = ancestors || new Set<string>();
    visited.add(uuid);
    try {
      const res = await fetch(`/api/trace/children/${encodeURIComponent(uuid)}${this.modeParam}`);
      if (!res.ok) return;
      const data = await res.json();
      const children: { uuid: string; type: string; name: string; hasChildren: boolean }[] = data.children || [];
      for (const child of children) {
        container.appendChild(this.buildSeedNode(child.uuid, child.type, child.name, [], child.hasChildren, visited));
      }
    } catch { /* silently fail — node stays collapsed */ }
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-trace-tree')) {
  customElements.define('rb-trace-tree', RbTraceTree);
}
