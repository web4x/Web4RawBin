/**
 * T103 — Object.verb routing + MVC + flat-JSON seam tests (AC6).
 * Route resolution, attribute round-trip, ViewBus MVC propagation, serialize/deserialize fidelity.
 *
 * @vitest-environment jsdom
 * [test:uuid:103d3e4f-5061-4273-839a-d03030303104] AC1-AC5
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TraceGraph, Requirement, Task } from '../../src/ts/shared/TraceModel.js';
import { parseHash, buildHash, TraceRouter } from '../../src/public/ts/trace/TraceRouter.js';
import { VerbRegistry } from '../../src/public/ts/trace/VerbRegistry.js';
import { ViewBus } from '../../src/public/ts/trace/ViewBus.js';
import { serialize, deserialize, defaultRegistry } from '../../src/public/ts/trace/index.js';
import { RbTraceView } from '../../src/public/ts/trace/rb-trace-view.js';

// jsdom may evaluate the module before customElements attaches → ensure registration
if (!customElements.get('rb-trace-view')) customElements.define('rb-trace-view', RbTraceView);

const RU = '05284ac5-131a-4e10-a2f7-7215e026e438';
const TU = '101a0b1c-2d3e-4f50-8617-a01010101101';

function seed(): TraceGraph {
  const g = new TraceGraph();
  const r = new Requirement(g, RU, 'R15.1');
  const t = new Task(g, TU, 'T101');
  r.addTask(t);
  return g;
}

describe('T103 Object.verb routing', () => {
  // AC1: verb addressable as route (method anchor + query params)
  describe('parseHash / buildHash (AC1)', () => {
    it('parses #type.verb?params', () => {
      expect(parseHash(`#requirement.show?uuid=${RU}`)).toEqual({ type: 'requirement', verb: 'show', params: { uuid: RU } });
    });
    it('defaults verb to show when omitted', () => {
      expect(parseHash('#task')).toEqual({ type: 'task', verb: 'show', params: {} });
    });
    it('round-trips buildHash → parseHash', () => {
      const h = buildHash('requirement', 'link', { uuid: RU, to: `task:${TU}` });
      expect(parseHash(h)).toEqual({ type: 'requirement', verb: 'link', params: { uuid: RU, to: `task:${TU}` } });
    });
    it('empty hash → null', () => { expect(parseHash('#')).toBeNull(); });
  });

  describe('router resolution (AC1)', () => {
    let mount: HTMLElement;
    beforeEach(() => { mount = document.createElement('div'); });

    it('resolves type.verb to a handler and renders the View with attrs from the object', () => {
      const g = seed();
      const router = new TraceRouter(g, defaultRegistry(), mount);
      router.route(`#requirement.show?uuid=${RU}`);
      const view = mount.querySelector('rb-trace-view')!;
      expect(view).toBeTruthy();
      expect(view.getAttribute('type')).toBe('requirement');
      expect(view.getAttribute('ref')).toBe(`requirement:${RU}`);
    });

    it('unknown verb → notFound (never throws)', () => {
      const g = seed();
      const router = new TraceRouter(g, defaultRegistry(), mount);
      expect(() => router.route('#requirement.frobnicate?uuid=' + RU)).not.toThrow();
      expect(mount.innerHTML).toBe('');
    });

    it('list renders one View per object of the type', () => {
      const g = seed();
      new Task(g, '22a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f02', 'T2');
      const router = new TraceRouter(g, defaultRegistry(), mount);
      router.route('#task.list');
      expect(mount.querySelectorAll('rb-trace-view').length).toBe(2);
    });
  });

  // AC2: object attributes ⇄ web-component attributes
  describe('rb-trace-view attribute round-trip (AC2)', () => {
    it('reflects attributes into rendered DOM', () => {
      const el = document.createElement('rb-trace-view') as RbTraceView;
      el.setAttribute('type', 'task');
      el.setAttribute('title', 'My Task');
      el.setAttribute('ref', `task:${TU}`);
      document.body.appendChild(el);
      expect(el.querySelector('.tv-type')!.textContent).toBe('task');
      expect(el.querySelector('.tv-title')!.textContent).toBe('My Task');
      expect(el.getAttribute('ref')).toBe(`task:${TU}`); // get round-trips
      el.remove();
    });
  });

  // AC3: MVC live-update via ViewBus (no full reload)
  describe('ViewBus MVC propagation (AC3)', () => {
    it('notify re-renders only subscribed views; unsubscribe stops updates', () => {
      let renders = 0;
      const unsub = ViewBus.subscribe('task:' + TU, () => { renders++; });
      expect(ViewBus.count('task:' + TU)).toBe(1);
      ViewBus.notify('task:' + TU);
      ViewBus.notify('task:' + TU);
      expect(renders).toBe(2);
      ViewBus.notify('requirement:' + RU); // different ref → no effect
      expect(renders).toBe(2);
      unsub();
      ViewBus.notify('task:' + TU);
      expect(renders).toBe(2); // unsubscribed
      expect(ViewBus.count('task:' + TU)).toBe(0);
    });

    it('a mounted view re-renders on notify for its ref', () => {
      const el = document.createElement('rb-trace-view') as RbTraceView;
      el.setAttribute('type', 'task');
      el.setAttribute('ref', `task:${TU}`);
      document.body.appendChild(el);
      el.setAttribute('title', 'updated-model'); // model changed
      ViewBus.notify(`task:${TU}`);
      expect(el.querySelector('.tv-title')!.textContent).toBe('updated-model');
      el.remove();
    });
  });

  // AC4/AC5: serialize → deserialize fidelity
  describe('serialize/deserialize (AC4/AC5)', () => {
    it('flat JSON round-trips the typed graph with route-like refs', () => {
      const g = seed();
      const flat = serialize(g);
      expect(flat.find(o => o.uuid === RU)!.links.tasks).toEqual([`task:${TU}`]);
      const g2 = deserialize(flat);
      expect(g2.size).toBe(2);
      expect((g2.get(RU) as Requirement).tasks[0].uuid).toBe(TU);
      expect((g2.get(TU) as Task).requirements[0].uuid).toBe(RU);
    });
  });
});
