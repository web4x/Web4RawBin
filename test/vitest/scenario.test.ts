/**
 * T125 — Scenario-unit foundation tests (AC6: ≥1 test per sub-task).
 * [test:uuid:5a125001-b002-4c03-9d04-e05f06a07b08] T125 scenario-unit primitives
 *
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  parseIor, iorClass, iorInstance, iorFile,
  ClassRegistry, TaskLoader,
  ScenarioIndex,
  ViewTemplateRegistry, TaskTemplate, defaultTemplateRegistry,
  type ScenarioUnit,
} from '../../src/ts/scenario/index.js';

describe('T125.1: Unit + IOR primitives', () => {
  it('parseIor extracts type and value', () => {
    expect(parseIor('ior:class:Task')).toEqual({ type: 'class', value: 'Task' });
    expect(parseIor('ior:instance:abc-123')).toEqual({ type: 'instance', value: 'abc-123' });
    expect(parseIor('ior:file:src/foo.ts')).toEqual({ type: 'file', value: 'src/foo.ts' });
    expect(parseIor('invalid')).toBeNull();
  });

  it('ior builders produce correct format', () => {
    expect(iorClass('Task')).toBe('ior:class:Task');
    expect(iorInstance('abc')).toBe('ior:instance:abc');
    expect(iorFile('src/x.ts')).toBe('ior:file:src/x.ts');
  });
});

describe('T125.2: Class loaders + registry', () => {
  it('ClassRegistry resolves all 7 class loaders', () => {
    const reg = new ClassRegistry();
    for (const name of ['Sprint', 'Task', 'Requirement', 'UseCase', 'Class', 'Method', 'Test']) {
      expect(reg.has(iorClass(name))).toBe(true);
    }
    expect(reg.all().length).toBe(7);
  });

  it('TaskLoader.create populates defaults + overrides', () => {
    const unit: ScenarioUnit = { ior: 'ior:class:Task', model: { uuid: 'x', name: 'T1' }, ownerIor: 'ior:instance:s1' };
    const result = TaskLoader.create(unit);
    expect(result.model.uuid).toBe('x');
    expect(result.model.name).toBe('T1');
    expect(result.model.status).toBe('');
    expect(result.ownerIor).toBe('ior:instance:s1');
  });
});

describe('T125.3: ScenarioIndex storage', () => {
  let tmp: string;
  let idx: ScenarioIndex;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'scenario-idx-')); idx = new ScenarioIndex(tmp); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('put + get round-trips a scenario unit', () => {
    const uuid = 'a7f3c1d2-8b4e-4f9a-b6c5-3d2e1f0a9b8c';
    const unit: ScenarioUnit = { ior: 'ior:class:Task', model: { uuid, name: 'Test' }, ownerIor: null };
    idx.put(uuid, unit);
    const loaded = idx.get(uuid);
    expect(loaded).toEqual(unit);
  });

  it('prefix takes first 5 hex chars (no hyphens)', () => {
    expect(idx.prefix('a7f3c1d2-8b4e-4f9a-b6c5-3d2e1f0a9b8c')).toBe('a7f3c');
  });

  it('list returns stored UUIDs', () => {
    const uuid = 'b72e58c4-91d3-4a07-b845-3c6f1d92e7a0';
    idx.put(uuid, { ior: 'ior:class:Sprint', model: { uuid }, ownerIor: null });
    expect(idx.list()).toContain(uuid);
  });

  it('has returns false for missing UUID', () => {
    expect(idx.has('00000000-0000-4000-8000-000000000000')).toBe(false);
  });
});

describe('T125.4: ViewTemplateRegistry', () => {
  it('defaultTemplateRegistry renders Task HTML + MD', () => {
    const reg = defaultTemplateRegistry();
    const unit: ScenarioUnit = { ior: 'ior:class:Task', model: { name: 'T1', description: 'Do X', status: 'Done' }, ownerIor: null };
    const html = reg.renderHtml(unit);
    expect(html).toContain('T1');
    expect(html).toContain('Do X');
    const md = reg.renderMd(unit);
    expect(md).toContain('### T1');
    expect(md).toContain('**Status:** Done');
  });

  it('returns fallback for unknown class', () => {
    const reg = new ViewTemplateRegistry();
    const unit: ScenarioUnit = { ior: 'ior:class:Unknown', model: {}, ownerIor: null };
    expect(reg.renderHtml(unit)).toContain('No template');
    expect(reg.renderMd(unit)).toContain('No template');
  });

  it('register + resolve works', () => {
    const reg = new ViewTemplateRegistry();
    reg.register('ior:class:Task', TaskTemplate);
    expect(reg.has('ior:class:Task')).toBe(true);
    expect(reg.resolve('ior:class:Task')).toBe(TaskTemplate);
  });
});
