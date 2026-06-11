/**
 * T101 — Typed traceability Object model unit tests (AC5).
 * Covers: construction, v4 UUID validation, duplicate rejection, typed bidirectional
 * graph traversal across the full chain, and flat-JSON round-trip.
 *
 * [test:uuid:4ba25dfa-f2a0-46bc-ac4b-f784c94f06c1] AC1-AC4 typed object model
 * [test:uuid:8edc3d29-79ee-4d7f-b2df-b48a1d68226f] test:TraceObject.parent
 * [verifies:uuid:eca7cb3f-8346-4658-9e85-5c1e2453956b] R17.26 traceability tree
 */
import { describe, it, expect, beforeEach } from 'vitest';
// [test:uuid:e4ce14a4-1ddb-4ca1-9326-38dd31ce0eb0]
// [test:uuid:fc207340-eef9-438d-b4b4-8e53c4392e5c]
// [test:uuid:f9fd3cc0-8023-4898-ab5c-55284689b382]
// [test:uuid:578163bd-f05c-43d7-824c-dd1edd5da041]
import {
  TraceGraph, Requirement, Task, UseCase, TraceClass, Method, Implementation, Test as TraceTest,
  isUuidV4, toRef, refUuid,
} from '../../src/ts/shared/TraceModel.js';

// helper: distinct valid v4 UUIDs
const U = {
  req: '05284ac5-131a-4e10-a2f7-7215e026e438',
  task: '57a0c96c-ff48-4f3f-9859-291687e897a2',
  uc: '22a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f02',
  cls: '33a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f03',
  method: '44a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f04',
  impl: '55a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f05',
  test: '66a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f06',
};

describe('T101 TraceModel', () => {
  let g: TraceGraph;
  beforeEach(() => { g = new TraceGraph(); });

  // [test:uuid:4ba25dfa-f2a0-46bc-ac4b-f784c94f06c1] AC4 UUID validation
  describe('UUID validation (AC4)', () => {
    it('accepts a valid v4 UUID on construction', () => {
      const r = new Requirement(g, U.req, 'R15.1');
      expect(r.uuid).toBe(U.req);
      expect(isUuidV4(r.uuid)).toBe(true);
    });
    it('rejects a non-v4 UUID on construction', () => {
      expect(() => new Requirement(g, 'not-a-uuid', 'bad')).toThrow(/Invalid v4 UUID/);
      expect(() => new Task(g, '12345678-1234-1234-1234-123456789012', 'v?')).toThrow(/Invalid v4 UUID/); // not version 4
    });
    it('rejects a duplicate UUID across types', () => {
      new Requirement(g, U.req, 'first');
      expect(() => new Task(g, U.req, 'dup')).toThrow(/Duplicate UUID/);
      expect(g.size).toBe(1);
    });
    it('isUuidV4 guards non-strings and bad shapes', () => {
      expect(isUuidV4('')).toBe(false);
      expect(isUuidV4(U.req.toUpperCase())).toBe(true); // case-insensitive
    });
  });

  // AC1: all 7 classes exist with stable uuid + type discriminator
  describe('all object types construct (AC1)', () => {
    it('constructs each of the 7 typed classes', () => {
      expect(new Requirement(g, U.req, 'r').type).toBe('requirement');
      expect(new Task(g, U.task, 't').type).toBe('task');
      expect(new UseCase(g, U.uc, 'u').type).toBe('usecase');
      expect(new TraceClass(g, U.cls, 'c').type).toBe('class');
      expect(new Method(g, U.method, 'm').type).toBe('method');
      expect(new Implementation(g, U.impl, 'i').type).toBe('implementation');
      expect(new TraceTest(g, U.test, 'x').type).toBe('test');
      expect(g.size).toBe(7);
    });
  });

  // AC2/AC3: typed, bidirectional, navigable chain
  describe('navigable typed graph (AC2/AC3)', () => {
    it('resolves the full req->task->uc->class->method->impl/test chain bidirectionally', () => {
      const req = new Requirement(g, U.req, 'R15.1');
      const task = new Task(g, U.task, 'T101');
      const uc = new UseCase(g, U.uc, 'object model');
      const cls = new TraceClass(g, U.cls, 'TraceObject');
      const method = new Method(g, U.method, 'addTask');
      const impl = new Implementation(g, U.impl, 'TraceModel.ts');
      const test = new TraceTest(g, U.test, 'graph traversal');

      req.addTask(task); req.addTest(test); req.addImplementation(impl);
      task.addUseCase(uc);
      uc.addClass(cls);
      cls.addMethod(method);
      method.addImplementation(impl); method.addTest(test);
      impl.addTest(test);

      // forward
      expect(req.tasks.map(t => t.uuid)).toEqual([U.task]);
      expect(task.useCases[0]).toBe(uc);
      expect(uc.classes[0]).toBe(cls);
      expect(cls.methods[0]).toBe(method);
      expect(method.implementations[0]).toBe(impl);
      expect(method.tests[0]).toBe(test);
      // inverse (bidirectional)
      expect(task.requirements[0]).toBe(req);
      expect(uc.tasks[0]).toBe(task);
      expect(cls.useCases[0]).toBe(uc);
      expect(method.classes[0]).toBe(cls);
      expect(impl.methods[0]).toBe(method);
      expect(impl.requirements[0]).toBe(req);
      expect(test.requirements[0]).toBe(req);
      expect(test.methods[0]).toBe(method);
      expect(test.implementations[0]).toBe(impl);
    });

    it('typed getters filter by type and de-duplicate links', () => {
      const req = new Requirement(g, U.req, 'r');
      const task = new Task(g, U.task, 't');
      req.addTask(task); req.addTask(task); // idempotent
      expect(req.tasks.length).toBe(1);
    });
  });

  // Flat-JSON serialization with route refs (Tron's model)
  describe('flat-JSON round-trip', () => {
    it('serializes to flat JSON with route-like refs and rebuilds an equivalent graph', () => {
      const req = new Requirement(g, U.req, 'R15.1');
      const task = new Task(g, U.task, 'T101');
      req.addTask(task);

      const flat = g.toJSON();
      expect(flat).toHaveLength(2);
      const reqFlat = flat.find(o => o.uuid === U.req)!;
      expect(reqFlat.links.tasks).toEqual([toRef('task', U.task)]);
      expect(refUuid(reqFlat.links.tasks[0])).toBe(U.task);

      const g2 = TraceGraph.fromJSON(flat);
      expect(g2.size).toBe(2);
      const req2 = g2.get(U.req) as Requirement;
      expect(req2).toBeInstanceOf(Requirement);
      expect(req2.tasks[0].uuid).toBe(U.task);
      expect((g2.get(U.task) as Task).requirements[0].uuid).toBe(U.req);
    });
  });
});
