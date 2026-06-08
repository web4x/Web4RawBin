/**
 * T107 — rb-detail-view + rb-overview tests (AC6). detail render + link-row navigation,
 * overview rollup correctness, live consistency (computed-from-graph, no stale snapshot).
 *
 * @vitest-environment jsdom
 * [test:uuid:107b7283-94a5-46b7-8a8e-b07070707108] R15.6
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { TraceGraph, Requirement, Task, UseCase } from '../../src/ts/shared/TraceModel.js';
import { RbDetailView } from '../../src/public/ts/trace/rb-detail-view.js';
import { RbOverview } from '../../src/public/ts/trace/rb-overview.js';
import { ViewBus } from '../../src/public/ts/trace/ViewBus.js';
import { setActiveRouter } from '../../src/public/ts/trace/nav.js';

// jsdom may evaluate the module before customElements attaches → ensure registration (tester pattern)
if (!customElements.get('rb-detail-view')) customElements.define('rb-detail-view', RbDetailView);
if (!customElements.get('rb-overview')) customElements.define('rb-overview', RbOverview);

const RU = '15a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f01';
const T1 = '101a0b1c-2d3e-4f50-8617-a01010101101';
const T2 = '22a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f02';

function seed() {
  const g = new TraceGraph();
  const r = new Requirement(g, RU, 'R15.6');
  const t1 = new Task(g, T1, 'Alpha'); t1.sprint = 'sprint-15'; t1.status = 'Planned';
  const t2 = new Task(g, T2, 'Bravo'); t2.sprint = 'sprint-15'; t2.status = 'Done';
  r.addTask(t1); r.addTask(t2);
  const uc1 = new UseCase(g, '30c3d4e5-f6a7-4b81-8c92-1d2e3f4a5b01', 'UC Alpha');
  const uc2 = new UseCase(g, '30c3d4e5-f6a7-4b81-8c92-1d2e3f4a5b02', 'UC Bravo');
  g.link(r, 'useCases', uc1, 'requirements');
  g.link(r, 'useCases', uc2, 'requirements');
  return { g, r, t1, t2, uc1, uc2 };
}

describe('T107 rb-detail-view', () => {
  afterEach(() => { document.body.innerHTML = ''; setActiveRouter(null); });

  it('renders title + typed link rows; clicking a row navigates to the linked object (AC1)', () => {
    const { g } = seed();
    const el = document.createElement('rb-detail-view') as RbDetailView;
    el.graph = g;
    el.setAttribute('ref', `requirement:${RU}`);
    document.body.appendChild(el);
    expect(el.querySelector('.dv-title')!.textContent).toBe('R15.6');
    const rows = el.querySelectorAll('.dv-link');
    expect(rows.length).toBe(2); // 2 usecase links (chain: Req→UC)
    const navSpy = vi.fn();
    setActiveRouter({ navigate: navSpy });
    (rows[0] as HTMLElement).click();
    expect(navSpy).toHaveBeenCalledWith('usecase', 'show', { uuid: expect.stringMatching(/^[0-9a-f-]{36}$/) });
  });

  it('re-renders on ViewBus.notify(ref) after a title change (AC3)', () => {
    const { g, r } = seed();
    const el = document.createElement('rb-detail-view') as RbDetailView;
    el.graph = g; el.setAttribute('ref', `requirement:${RU}`); document.body.appendChild(el);
    r.title = 'R15.6 retitled';
    ViewBus.notify(`requirement:${RU}`);
    expect(el.querySelector('.dv-title')!.textContent).toBe('R15.6 retitled');
  });
});

describe('T107 rb-overview', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('rolls up tasks by sprint with per-status counts + a row per task (AC2)', () => {
    const { g } = seed();
    const el = document.createElement('rb-overview') as RbOverview;
    el.graph = g; document.body.appendChild(el);
    const group = el.querySelector('.ov-group[data-sprint="sprint-15"]')!;
    expect(group).toBeTruthy();
    const counts = [...group.querySelectorAll('.ov-count')].map(c => c.textContent);
    expect(counts).toContain('Planned: 1');
    expect(counts).toContain('Done: 1');
    expect(group.querySelectorAll('rb-object-item').length).toBe(2);
  });

  it('is COMPUTED from the live graph — status change recomputes, no stale snapshot (AC4)', () => {
    const { g, t1 } = seed();
    const el = document.createElement('rb-overview') as RbOverview;
    el.graph = g; document.body.appendChild(el);
    // flip the Planned task → Done in the graph, then notify
    t1.status = 'Done';
    ViewBus.notify('graph');
    const counts = [...el.querySelectorAll('.ov-count')].map(c => c.textContent);
    expect(counts).toContain('Done: 2');
    expect(counts).toContain('Planned: 0');
  });
});
