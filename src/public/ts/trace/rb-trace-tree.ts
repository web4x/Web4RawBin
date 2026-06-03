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
    if (e.detail.open) this.expanded.add(ref); else this.expanded.delete(ref);
    this.persist();
    this.render();
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

    // Walk forward from requirement roots to find reachable set
    const reachable = new Set<string>();
    const walk = (ref: string) => {
      if (reachable.has(ref)) return;
      reachable.add(ref);
      const obj = this.graph!.get(refUuid(ref));
      if (obj) Object.values(obj.toJSON().links).flat().forEach(walk);
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
    const childRefs = obj ? Object.values(obj.toJSON().links).flat() : [];
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
      const res = await fetch(`/api/trace/children/${encodeURIComponent(uuid)}`);
      if (!res.ok) { this.innerHTML = '<div class="tt-empty">Not found</div>'; return; }
      const data = await res.json();
      this.innerHTML = '';
      this.appendChild(this.buildSeedNode(uuid, data.type, data.name, data.children || []));
    } catch { this.innerHTML = '<div class="tt-empty">Failed to load</div>'; }
  }

  private buildSeedNode(uuid: string, type: string, name: string, children: { uuid: string; type: string; name: string; hasChildren: boolean }[]): HTMLElement {
    const node = document.createElement('div');
    node.className = 'tt-node';
    const row = document.createElement('div');
    row.className = 'tt-row';
    const item = document.createElement('rb-object-item');
    item.setAttribute('ref', `${(type || 'task').toLowerCase()}:${uuid}`);
    item.setAttribute('type', (type || 'task').toLowerCase());
    item.setAttribute('title', name || uuid);
    if (children.length > 0) item.setAttribute('has-children', '');
    const isOpen = this.isSeedExpanded(uuid);
    if (isOpen) item.setAttribute('children-open', '');
    row.appendChild(item);
    node.appendChild(row);
    if (children.length > 0) {
      const kids = document.createElement('div');
      kids.className = 'tt-children';
      kids.style.display = isOpen ? '' : 'none';
      for (const child of children) {
        kids.appendChild(this.buildSeedNode(child.uuid, child.type, child.name, []));
      }
      node.appendChild(kids);
      item.addEventListener('toggle-children', ((e: CustomEvent) => {
        const open = e.detail.open;
        kids.style.display = open ? '' : 'none';
        this.toggleSeedExpanded(uuid, open);
      }) as EventListener);
    }
    return node;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-trace-tree')) {
  customElements.define('rb-trace-tree', RbTraceTree);
}
