/**
 * T102 — Traceability consistency engine unit tests (AC6).
 * validate() on clean + drifted graphs; fixMatrix() drift→consistent→idempotent;
 * generated-region markers preserve manual content.
 *
 * [test:uuid:102c3d4e-5f60-4071-8293-c02020202103] AC2/AC3/AC4/AC6
 * [verifies:uuid:a1e2f3d4-b5c6-4d7e-8f90-1a2b3c4d5e26] R17.26 trace consistency
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TraceGraph, Requirement, Task, UseCase, Test as TraceTest } from '../../src/ts/shared/TraceModel.js';
import {
  scanRepo, validate, fixMatrix, generateRegion, formatReport, REGION_BEGIN, REGION_END,
  type TaskCoverage,
} from '../../src/ts/server/TraceConsistency.js';

const RU = '15a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f01';
const TU = '101a0b1c-2d3e-4f50-8617-a01010101101';

function cov(over: Partial<TaskCoverage> = {}): TaskCoverage {
  return { sprint: 'sprint-15', task: 'task-101-x', uuid: TU, reqUuid: RU, req: true, uc: true, puml: true, method: true, ...over };
}

describe('T102 TraceConsistency', () => {
  // AC2: validate reports broken/missing chain links
  describe('validate (AC2)', () => {
    it('returns no errors for a consistent graph+coverage', () => {
      const g = new TraceGraph();
      const r = new Requirement(g, RU, 'R15.1');
      const t = new Task(g, TU, 'task-101-x');
      r.addTask(t);
      const issues = validate(g, [cov()]);
      expect(issues.filter(i => i.level === 'error')).toHaveLength(0);
    });

    it('flags a task with no [task:uuid]', () => {
      const g = new TraceGraph();
      const issues = validate(g, [cov({ uuid: null, reqUuid: null, req: false })]);
      expect(issues.some(i => i.level === 'error' && /no \[task:uuid\]/.test(i.reason))).toBe(true);
    });

    it('flags a dangling requirement up-link (uuid not in graph)', () => {
      const g = new TraceGraph();
      new Task(g, TU, 'task-101-x'); // task exists, but its reqUuid is not registered
      const issues = validate(g, [cov({ reqUuid: '99999999-9999-4999-8999-999999999999' })]);
      expect(issues.some(i => i.level === 'error' && /not found in any requirements/.test(i.reason))).toBe(true);
    });

    it('flags a requirement with no linked task', () => {
      const g = new TraceGraph();
      new Requirement(g, RU, 'orphan req'); // no addTask
      const issues = validate(g, []);
      expect(issues.some(i => i.level === 'error' && i.ref === `requirement:${RU}` && /no linked task/.test(i.reason))).toBe(true);
    });

    it('warns on a task with no requirement up-link', () => {
      const g = new TraceGraph();
      new Task(g, TU, 'task-101-x');
      const issues = validate(g, [cov({ reqUuid: null, req: false })]);
      expect(issues.some(i => i.level === 'warn' && /no requirement up-link/.test(i.reason))).toBe(true);
    });

    it('formatReport says CONSISTENT on zero issues', () => {
      expect(formatReport([])).toMatch(/CONSISTENT/);
    });
  });

  // AC3/AC4: fix regenerates the marked region, preserves manual content, idempotent
  describe('fixMatrix (AC3/AC4)', () => {
    let tmp: string;
    beforeEach(() => { tmp = path.join(os.tmpdir(), `trace-matrix-${Date.now()}-${Math.random().toString(16).slice(2)}.md`); });
    afterEach(() => { try { fs.rmSync(tmp); } catch { /* ignore */ } });

    it('appends a marked region to a file with no markers, preserving manual content', () => {
      const manual = '# Manual Matrix\n\nHand-authored planner content.\n';
      fs.writeFileSync(tmp, manual);
      const res = fixMatrix(tmp, [cov()]);
      expect(res.changed).toBe(true);
      const out = fs.readFileSync(tmp, 'utf-8');
      expect(out).toContain('Hand-authored planner content.'); // manual preserved
      expect(out).toContain(REGION_BEGIN);
      expect(out).toContain(REGION_END);
      expect(out).toContain('| sprint-15 | task-101-x |');
    });

    it('is idempotent — second fix makes no change', () => {
      fs.writeFileSync(tmp, '# M\n');
      expect(fixMatrix(tmp, [cov()]).changed).toBe(true);
      expect(fixMatrix(tmp, [cov()]).changed).toBe(false); // already consistent
    });

    it('repairs drift inside the region without touching content outside', () => {
      fs.writeFileSync(tmp, '# M\n');
      fixMatrix(tmp, [cov()]);                 // region with task-101-x ✓✓✓✓
      const res = fixMatrix(tmp, [cov({ uc: false, puml: false })]); // drift: uc/puml now ✗
      expect(res.changed).toBe(true);
      const out = fs.readFileSync(tmp, 'utf-8');
      expect(out.startsWith('# M')).toBe(true); // manual header intact
      // exactly one region (no duplication)
      expect(out.split(REGION_BEGIN).length - 1).toBe(1);
      expect(out.split(REGION_END).length - 1).toBe(1);
    });

    it('generateRegion is deterministic for the same coverage', () => {
      expect(generateRegion([cov()])).toBe(generateRegion([cov()]));
    });
  });

  // T117: Pass 4 — PUML <<UseCase>> parsing
  describe('Pass 4: PUML UseCase parsing (T117)', () => {
    let tmp: string;
    beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-p4-')); });
    afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

    it('parses <<UseCase>> blocks and creates UseCase objects linked to tasks', () => {
      const sprint = path.join(tmp, 'sprint-16-test');
      fs.mkdirSync(path.join(sprint, 'diagrams'), { recursive: true });
      fs.writeFileSync(path.join(sprint, 'task-110-test.md'), `# T110\n[task:uuid:${TU}]\n[requirement:uuid:${RU}]\n`);
      fs.writeFileSync(path.join(sprint, 'requirements.md'), `[requirement:uuid:${RU}]\nR16.1 Test\n→ [T110](./task-110-test.md)\n`);
      fs.writeFileSync(path.join(sprint, 'diagrams', 'test.puml'), `
class "drawer.open" <<UseCase>> {
  [uc:uuid:16a01001-d001-4a01-b001-000000110001]
  requirement: R16.1
  task: T110
  object: Drawer
  verb: open
}
`);
      const { graph } = scanRepo(tmp);
      const ucs = graph.ofType('usecase');
      expect(ucs.length).toBe(1);
      expect(ucs[0].title).toBe('drawer.open');
      const task = graph.get(TU) as Task;
      expect(task.useCases.length).toBe(1);
    });
  });

  // T116: validate flags UseCase orphans
  describe('validate UseCase chain (T116)', () => {
    it('warns on a use case with no linked task', () => {
      const g = new TraceGraph();
      new Requirement(g, RU, 'R16.1');
      const ucUuid = '16a01001-d001-4a01-b001-000000110001';
      new UseCase(g, ucUuid, 'orphan.uc');
      const issues = validate(g, []);
      expect(issues.some(i => i.level === 'warn' && i.ref === `usecase:${ucUuid}` && /no linked task/.test(i.reason))).toBe(true);
    });
  });

  // T119: Pass 6 — test:uuid parsing
  describe('Pass 6: test:uuid parsing (T119)', () => {
    let tmp: string;
    beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-p6-')); });
    afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

    it('parses [test:uuid] markers and creates Test objects', () => {
      const sprint = path.join(tmp, 'sprint-test');
      fs.mkdirSync(sprint, { recursive: true });
      fs.writeFileSync(path.join(sprint, 'task-101-x.md'), `# T101\n[task:uuid:${TU}]\n[requirement:uuid:${RU}]\n`);
      fs.writeFileSync(path.join(sprint, 'requirements.md'), `[requirement:uuid:${RU}]\nR15.1 Test req\n`);
      const testDir = path.join(tmp, 'tests');
      fs.mkdirSync(testDir, { recursive: true });
      const testUuid = '20a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f99';
      fs.writeFileSync(path.join(testDir, 'example.test.ts'), `// [test:uuid:${testUuid}] R15.1 unit test\n`);
      const { graph } = scanRepo(sprint, undefined, testDir);
      const tests = graph.ofType('test');
      expect(tests.length).toBe(1);
      expect(tests[0].uuid).toBe(testUuid);
    });
  });

  // T119: validate flags orphan tests
  describe('validate orphan tests (T119)', () => {
    it('warns on a test with no linked requirement or method', () => {
      const g = new TraceGraph();
      const testUuid = '30b2c3d4-e5f6-4a71-8b82-0c1d2e3f4a00';
      new TraceTest(g, testUuid, 'orphan test');
      const issues = validate(g, []);
      expect(issues.some(i => i.level === 'warn' && i.ref === `test:${testUuid}` && /no linked requirement/.test(i.reason))).toBe(true);
    });
  });
});
