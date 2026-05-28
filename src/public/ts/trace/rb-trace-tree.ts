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
  }
  disconnectedCallback(): void { this.unsub?.(); this.unsub = null; }

  setGraph(graph: TraceGraph, brokenUuids: string[] = []): void {
    this.graph = graph;
    this.brokenUuids = new Set(brokenUuids);
    if (this.isConnected) this.render();
  }

  private persist(): void {
    try { localStorage.setItem(LS_KEY, JSON.stringify([...this.expanded])); } catch { /* ignore */ }
  }

  render(): void {
    if (!this.graph) { this.innerHTML = '<div class="tt-empty">no graph</div>'; return; }
    const roots = this.graph.ofType('requirement');
    this.innerHTML = '';
    const rootObjs = roots.length ? roots : this.graph.all(); // fall back to all if no requirements
    for (const obj of rootObjs) this.appendChild(this.nodeEl(obj.ref(), new Set()));
  }

  /** Build a node row (chevron + rb-object-item) and, if expanded, its children. */
  private nodeEl(ref: string, ancestry: Set<string>): HTMLElement {
    const node = document.createElement('div');
    node.className = 'tt-node';
    const obj = this.graph!.get(refUuid(ref));
    const childRefs = obj ? Object.values(obj.toJSON().links).flat() : [];
    const hasChildren = childRefs.length > 0 && !ancestry.has(ref); // cycle guard
    const isOpen = this.expanded.has(ref);

    const row = document.createElement('div');
    row.className = 'tt-row';
    const chevron = document.createElement('span');
    chevron.className = 'tt-chevron';
    chevron.textContent = hasChildren ? (isOpen ? '▾' : '▸') : '·';
    if (hasChildren) {
      chevron.addEventListener('click', (e) => {
        e.stopPropagation(); // don't trigger the item's navigate
        if (this.expanded.has(ref)) this.expanded.delete(ref); else this.expanded.add(ref);
        this.persist();
        this.render();
      });
    }
    const item = document.createElement('rb-object-item');
    item.setAttribute('ref', ref);
    item.setAttribute('type', obj ? obj.type : ref.split(':')[0]);
    item.setAttribute('title', obj ? obj.title : ref);
    if (obj && obj.title) item.setAttribute('description', obj.title);
    if (obj && obj.status) item.setAttribute('status', obj.status);
    if (this.brokenUuids.has(refUuid(ref))) {
      const warn = document.createElement('span');
      warn.className = 'tt-warn'; warn.title = 'traceability issue (T102)'; warn.textContent = '⚠️';
      row.appendChild(warn);
    }
    row.appendChild(chevron);
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
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-trace-tree')) {
  customElements.define('rb-trace-tree', RbTraceTree);
}
