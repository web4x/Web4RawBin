/**
 * T106 — rb-list-overview tests (AC7). render, local filter, provider substitution,
 * empty state, live add/remove via ViewBus 'graph'. Uses runSearch() directly for determinism.
 *
 * @vitest-environment jsdom
 * [test:uuid:a2f83b59-5943-462e-b70e-bf6429ea1b90] R15.5
 */
import { describe, it, expect, afterEach } from 'vitest';
import { TraceGraph, Requirement, Task } from '../../src/ts/shared/TraceModel.js';
import { RbListOverview, LocalSearch, type SearchProvider } from '../../src/public/ts/trace/rb-list-overview.js';
import { RbObjectItem } from '../../src/public/ts/trace/rb-object-item.js';

// jsdom may evaluate the modules before customElements attaches → ensure registration
if (!customElements.get('rb-list-overview')) customElements.define('rb-list-overview', RbListOverview);
if (!customElements.get('rb-object-item')) customElements.define('rb-object-item', RbObjectItem);

const A = '1aaaaaaa-d4e5-4f60-8a71-9b0c1d2e3f01';
const B = '2bbbbbbb-d4e5-4f60-8a71-9b0c1d2e3f02';
const C = '3ccccccc-d4e5-4f60-8a71-9b0c1d2e3f03';

function graph(): TraceGraph {
  const g = new TraceGraph();
  new Task(g, A, 'Alpha');
  new Task(g, B, 'Bravo');
  new Requirement(g, C, 'Charlie');
  return g;
}
function items(el: RbListOverview): string[] {
  return [...el.querySelectorAll('rb-object-item')].map(e => e.getAttribute('ref')!);
}

describe('T106 rb-list-overview', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  // [test:uuid:7147ca60-adc0-479f-8923-e319baad83d0] R19.90 RbTraceTree.setItems — dedicated (renders items via setter)
  it('renders one rb-object-item per ref via setItems (AC1)', async () => {
    const g = graph();
    const el = document.createElement('rb-list-overview') as RbListOverview;
    el.graph = g;
    document.body.appendChild(el);
    el.setItems([`task:${A}`, `task:${B}`, `requirement:${C}`]);
    await el.runSearch('');
    expect(items(el).sort()).toEqual([`requirement:${C}`, `task:${A}`, `task:${B}`].sort());
  });

  it('LocalSearch filters by substring; clear returns all (AC2)', async () => {
    const g = graph();
    const el = document.createElement('rb-list-overview') as RbListOverview;
    el.graph = g; document.body.appendChild(el);
    el.setItems([`task:${A}`, `task:${B}`, `requirement:${C}`]);
    await el.runSearch('brav');
    expect(items(el)).toEqual([`task:${B}`]);
    await el.runSearch('');
    expect(items(el).length).toBe(3);
  });

  it('swapping searchProvider (mock RemoteSearch) does not change the API (AC3)', async () => {
    const g = graph();
    const el = document.createElement('rb-list-overview') as RbListOverview;
    el.graph = g; document.body.appendChild(el);
    const remote: SearchProvider = { search: async () => [`task:${A}`] };
    el.searchProvider = remote;
    await el.runSearch('anything');
    expect(items(el)).toEqual([`task:${A}`]);
  });

  it('renders an explicit empty state on no matches (AC4)', async () => {
    const g = graph();
    const el = document.createElement('rb-list-overview') as RbListOverview;
    el.graph = g; document.body.appendChild(el);
    await el.runSearch('zzzzz-nomatch');
    expect(el.querySelector('.lo-empty')).toBeTruthy();
    expect(items(el).length).toBe(0);
  });

  it('live add/remove: removing an object drops it on re-query (AC5)', async () => {
    const g = graph();
    const el = document.createElement('rb-list-overview') as RbListOverview;
    el.graph = g; document.body.appendChild(el);
    el.setItems([`task:${A}`, `task:${B}`]);
    await el.runSearch('');
    expect(items(el).length).toBe(2);
    // remove task:B from the graph, then re-query (ViewBus 'graph' path)
    (g as any)['byUuid'].delete(B);
    await el.runSearch('');
    expect(items(el)).toEqual([`task:${A}`]); // task:B dropped (not in graph)
  });

  it('default LocalSearch matches by type and uuid too', async () => {
    const g = graph();
    const ls = new LocalSearch(g);
    expect((await ls.search('requirement')).length).toBe(1);
    expect((await ls.search(A)).length).toBe(1);
  });

  it('search input has no maxlength (Tron no-limits rule, AC6)', () => {
    const el = document.createElement('rb-list-overview') as RbListOverview;
    el.graph = graph(); document.body.appendChild(el);
    expect((el.querySelector('.lo-search') as HTMLInputElement).maxLength).toBe(-1); // unset
  });
});
