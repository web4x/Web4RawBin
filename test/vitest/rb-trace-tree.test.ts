/**
 * T108 — rb-trace-tree capstone tests (AC6). tree render, expand/collapse + persist,
 * broken-node warning marker, node-select → navigate (DetailView).
 *
 * @vitest-environment jsdom
 * [test:uuid:4da22329-6cfc-467a-b7c0-778e0996eed1] R15.7
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { TraceGraph, Requirement, Task, UseCase } from '../../src/ts/shared/TraceModel.js';
import { RbTraceTree } from '../../src/public/ts/trace/rb-trace-tree.js';
import { RbObjectItem } from '../../src/public/ts/trace/rb-object-item.js';
import { setActiveRouter } from '../../src/public/ts/trace/nav.js';

// ensure registration under vitest-jsdom (module-eval-order gotcha)
if (!customElements.get('rb-trace-tree')) customElements.define('rb-trace-tree', RbTraceTree);
if (!customElements.get('rb-object-item')) customElements.define('rb-object-item', RbObjectItem);

const RU = '05284ac5-131a-4e10-a2f7-7215e026e438';
const UC1 = '20b2c3d4-e5f6-4a71-8b82-0c1d2e3f4a00';

function seed(): TraceGraph {
  const g = new TraceGraph();
  const r = new Requirement(g, RU, 'R15.7');
  const uc = new UseCase(g, UC1, 'unit.load');
  g.link(r, 'useCases', uc, 'requirements');
  return g;
}

describe('T108 rb-trace-tree', () => {
  afterEach(() => { document.body.innerHTML = ''; setActiveRouter(null); try { localStorage.clear(); } catch { /* */ } });

  it('renders requirement roots; expanding walks to useCases (AC2, chain correction)', () => {
    const g = seed();
    const tree = document.createElement('rb-trace-tree') as RbTraceTree;
    document.body.appendChild(tree);
    tree.setGraph(g);
    const rootRefs = [...tree.querySelectorAll('.tt-node > .tt-row rb-object-item')].map(e => e.getAttribute('ref'));
    expect(rootRefs).toContain(`requirement:${RU}`);
    expect(tree.querySelector('.tt-children')).toBeNull();
    (tree.querySelector('.oi-expand') as HTMLElement).click();
    const childRefs = [...tree.querySelectorAll('.tt-children rb-object-item')].map(e => e.getAttribute('ref'));
    expect(childRefs).toContain(`usecase:${UC1}`);
  });

  it('persists expand state across re-mount (AC2)', () => {
    const g = seed();
    let tree = document.createElement('rb-trace-tree') as RbTraceTree;
    document.body.appendChild(tree); tree.setGraph(g);
    (tree.querySelector('.oi-expand') as HTMLElement).click(); // expand via T115 expander
    expect(tree.querySelector('.tt-children')).toBeTruthy();
    tree.remove();
    // re-mount → expand state restored from localStorage
    tree = document.createElement('rb-trace-tree') as RbTraceTree;
    document.body.appendChild(tree); tree.setGraph(g);
    expect(tree.querySelector('.tt-children')).toBeTruthy();
  });

  it('shows a warning marker on a broken node, still visible (AC5)', () => {
    const g = seed();
    const tree = document.createElement('rb-trace-tree') as RbTraceTree;
    document.body.appendChild(tree);
    tree.setGraph(g, [RU]); // mark the requirement broken
    expect(tree.querySelector('.tt-warn')).toBeTruthy();
    expect(tree.querySelector(`rb-object-item[ref="requirement:${RU}"]`)).toBeTruthy(); // not hidden
  });

  it('clicking a node row selects it (AC4, R20.6)', () => {
    const g = seed();
    const tree = document.createElement('rb-trace-tree') as RbTraceTree;
    document.body.appendChild(tree); tree.setGraph(g);
    const item = tree.querySelector(`rb-object-item[ref="requirement:${RU}"]`) as HTMLElement;
    item.click();
    expect(item.hasAttribute('selected')).toBe(true);
  });
});
