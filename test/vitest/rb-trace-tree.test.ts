/**
 * T108 — rb-trace-tree capstone tests (AC6). tree render, expand/collapse + persist,
 * broken-node warning marker, node-select → navigate (DetailView).
 *
 * @vitest-environment jsdom
 * [test:uuid:108c8394-a5b6-47c8-89af-c08080808109] R15.7
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { TraceGraph, Requirement, Task } from '../../src/ts/shared/TraceModel.js';
import { RbTraceTree } from '../../src/public/ts/trace/rb-trace-tree.js';
import { RbObjectItem } from '../../src/public/ts/trace/rb-object-item.js';
import { setActiveRouter } from '../../src/public/ts/trace/nav.js';

// ensure registration under vitest-jsdom (module-eval-order gotcha)
if (!customElements.get('rb-trace-tree')) customElements.define('rb-trace-tree', RbTraceTree);
if (!customElements.get('rb-object-item')) customElements.define('rb-object-item', RbObjectItem);

const RU = '15a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f01';
const T1 = '101a0b1c-2d3e-4f50-8617-a01010101101';

function seed(): TraceGraph {
  const g = new TraceGraph();
  const r = new Requirement(g, RU, 'R15.7');
  const t = new Task(g, T1, 'Capstone task');
  r.addTask(t);
  return g;
}

describe('T108 rb-trace-tree', () => {
  afterEach(() => { document.body.innerHTML = ''; setActiveRouter(null); try { localStorage.clear(); } catch { /* */ } });

  it('renders requirement roots; expanding walks to tasks (AC2)', () => {
    const g = seed();
    const tree = document.createElement('rb-trace-tree') as RbTraceTree;
    document.body.appendChild(tree);
    tree.setGraph(g);
    // root requirement present, collapsed → no child task row yet
    const rootRefs = [...tree.querySelectorAll('.tt-node > .tt-row rb-object-item')].map(e => e.getAttribute('ref'));
    expect(rootRefs).toContain(`requirement:${RU}`);
    expect(tree.querySelector('.tt-children')).toBeNull();
    // expand the requirement
    (tree.querySelector('.tt-chevron') as HTMLElement).click();
    const childRefs = [...tree.querySelectorAll('.tt-children rb-object-item')].map(e => e.getAttribute('ref'));
    expect(childRefs).toContain(`task:${T1}`);
  });

  it('persists expand state across re-mount (AC2)', () => {
    const g = seed();
    let tree = document.createElement('rb-trace-tree') as RbTraceTree;
    document.body.appendChild(tree); tree.setGraph(g);
    (tree.querySelector('.tt-chevron') as HTMLElement).click(); // expand
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

  it('clicking a node row navigates to its DetailView (AC4)', () => {
    const g = seed();
    const navSpy = vi.fn();
    setActiveRouter({ navigate: navSpy });
    const tree = document.createElement('rb-trace-tree') as RbTraceTree;
    document.body.appendChild(tree); tree.setGraph(g);
    (tree.querySelector(`rb-object-item[ref="requirement:${RU}"]`) as HTMLElement).click();
    expect(navSpy).toHaveBeenCalledWith('requirement', 'show', { uuid: RU });
  });
});
