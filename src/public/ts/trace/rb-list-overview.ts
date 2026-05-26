/**
 * T106 — rb-list-overview: a collection of <rb-object-item> (T105) with a search box.
 *
 * Search is behind a pluggable SearchProvider so local→remote share ONE contract — swapping
 * `list.searchProvider` to a RemoteSearch never changes the component API (R15.5). Debounced
 * 300ms. Empty state on no matches. ViewBus 'graph' topic re-runs the active search on
 * add/remove. NO artificial input/result limits (Tron rule).
 *
 * [impl:uuid:106f5061-7283-4495-896c-f06060606106] R15.5 ListOverview + search
 */
import './rb-object-item.js';
import { ViewBus } from './ViewBus.js';
import { TraceGraph, type ObjectRef, refUuid } from '../../../ts/shared/TraceModel.js';

export interface SearchProvider {
  search(query: string): Promise<ObjectRef[]>;
}

/** Default provider: substring filter over the in-memory graph (title/type/uuid). */
export class LocalSearch implements SearchProvider {
  constructor(private graph: TraceGraph) {}
  async search(query: string): Promise<ObjectRef[]> {
    const q = query.trim().toLowerCase();
    const all = this.graph.all();
    const hits = q
      ? all.filter(o => o.title.toLowerCase().includes(q) || o.type.includes(q) || o.uuid.includes(q))
      : all;
    return hits.map(o => o.ref());
  }
}

export class RbListOverview extends HTMLElement {
  graph: TraceGraph | null = null;
  searchProvider: SearchProvider | null = null;
  private scopeRefs: ObjectRef[] | null = null; // explicit set; null = whole graph / type
  private debounce: ReturnType<typeof setTimeout> | null = null;
  private unsub: (() => void) | null = null;

  connectedCallback(): void {
    this.renderShell();
    this.runSearch('');
    this.unsub = ViewBus.subscribe('graph', () => this.runSearch(this.query()));
  }

  disconnectedCallback(): void {
    this.unsub?.();
    if (this.debounce) clearTimeout(this.debounce);
  }

  /** Explicit scope: render only these refs (still filtered by the search). */
  setItems(refs: ObjectRef[]): void {
    this.scopeRefs = [...refs];
    if (this.isConnected) this.runSearch(this.query());
  }

  private provider(): SearchProvider | null {
    if (this.searchProvider) return this.searchProvider;
    return this.graph ? new LocalSearch(this.graph) : null;
  }

  private query(): string {
    return (this.querySelector('.lo-search') as HTMLInputElement | null)?.value ?? '';
  }

  private renderShell(): void {
    this.classList.add('list-overview');
    this.innerHTML = `
      <input class="lo-search" type="text" placeholder="Search…" autocomplete="off">
      <div class="lo-results"></div>`;
    const input = this.querySelector('.lo-search') as HTMLInputElement;
    input.addEventListener('input', () => {
      if (this.debounce) clearTimeout(this.debounce);
      this.debounce = setTimeout(() => this.runSearch(input.value), 300);
    });
  }

  /** Run a search through the provider and render the result items. Public for tests/sync flush. */
  async runSearch(query: string): Promise<void> {
    const provider = this.provider();
    let refs = provider ? await provider.search(query) : [];
    if (this.scopeRefs) { const scope = new Set(this.scopeRefs); refs = refs.filter(r => scope.has(r)); }
    if (this.graph) refs = refs.filter(r => this.graph!.has(refUuid(r))); // drop removed objects
    this.renderItems(refs);
  }

  private renderItems(refs: ObjectRef[]): void {
    const box = this.querySelector('.lo-results');
    if (!box) return;
    if (refs.length === 0) { box.innerHTML = `<div class="lo-empty">No results</div>`; return; }
    box.innerHTML = '';
    for (const ref of refs) {
      const obj = this.graph?.get(refUuid(ref));
      const el = document.createElement('rb-object-item');
      el.setAttribute('ref', ref);
      el.setAttribute('type', obj ? obj.type : ref.split(':')[0]);
      el.setAttribute('title', obj ? obj.title : ref);
      box.appendChild(el);
    }
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('rb-list-overview')) {
  customElements.define('rb-list-overview', RbListOverview);
}
