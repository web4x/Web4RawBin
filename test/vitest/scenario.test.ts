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
  ViewGenerator,
  IORResolver,
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

  it('prefixPath splits first 5 hex chars into 5 dir levels', () => {
    expect(idx.prefixPath('a7f3c1d2-8b4e-4f9a-b6c5-3d2e1f0a9b8c')).toBe('a/7/f/3/c');
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
    const unit: ScenarioUnit = { ior: 'ior:class:Task', model: { name: 'T1', description: 'Do X', status: 'Done', statusChecklist: '- [x] Done' }, ownerIor: null };
    const html = reg.renderHtml(unit);
    expect(html).toContain('T1');
    expect(html).toContain('Do X');
    const md = reg.renderMd(unit);
    expect(md).toContain('# T1');
    expect(md).toContain('Do X');
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

  it('all 7 class templates registered in defaultTemplateRegistry', () => {
    const reg = defaultTemplateRegistry();
    for (const cls of ['Sprint', 'Task', 'Requirement', 'UseCase', 'Class', 'Method', 'Test']) {
      expect(reg.has(iorClass(cls))).toBe(true);
    }
  });
});

describe('T126: ViewGenerator', () => {
  let idxDir: string;
  let outDir: string;
  let idx: ScenarioIndex;
  beforeEach(() => {
    idxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-idx-'));
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-out-'));
    idx = new ScenarioIndex(idxDir);
  });
  afterEach(() => {
    fs.rmSync(idxDir, { recursive: true, force: true });
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('generateAll emits .md + .html with speaking names', () => {
    const uuid = 'a7f3c1d2-8b4e-4f9a-b6c5-3d2e1f0a9b8c';
    idx.put(uuid, { ior: 'ior:class:Task', model: { uuid, slug: 'task-1-bootstrap', name: 'T1', description: 'Do X', status: 'Done' }, ownerIor: null });
    const gen = new ViewGenerator(idx, defaultTemplateRegistry(), outDir);
    const result = gen.generateAll();
    expect(result.filesWritten).toBeGreaterThanOrEqual(2);
    expect(fs.existsSync(path.join(outDir, 'task', 'task-1-bootstrap.md'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'task', 'task-1-bootstrap.html'))).toBe(true);
    const md = fs.readFileSync(path.join(outDir, 'task', 'task-1-bootstrap.md'), 'utf-8');
    expect(md).toContain('T1');
  });

  it('generates sprint overview + planning.md with speaking names + nested subtasks', () => {
    const sprintUuid = 'b72e58c4-91d3-4a07-b845-3c6f1d92e7a0';
    const taskUuid = 'c83f69d5-a2e4-4b18-c956-4d7a2e03f8b1';
    const childUuid = 'd94a8bf6-b3c5-4d29-a178-6f9c4e25b0d3';
    idx.put(childUuid, { ior: 'ior:class:Task', model: { uuid: childUuid, slug: 'task-1-1-child', name: 'T1.1: Child', status: 'Done', children: [] }, ownerIor: iorInstance(taskUuid) });
    idx.put(taskUuid, { ior: 'ior:class:Task', model: { uuid: taskUuid, slug: 'task-1-bootstrap', name: 'T1: Bootstrap', status: 'Done', children: [iorInstance(childUuid)] }, ownerIor: iorInstance(sprintUuid) });
    idx.put(sprintUuid, { ior: 'ior:class:Sprint', model: { uuid: sprintUuid, slug: 'sprint-1', name: 'Sprint 1', number: 1, goal: 'Foundation', status: 'Done', tasks: [iorInstance(taskUuid)] }, ownerIor: null });
    const gen = new ViewGenerator(idx, defaultTemplateRegistry(), outDir);
    const result = gen.generateAll();
    expect(result.filesWritten).toBeGreaterThanOrEqual(7);
    const overview = fs.readFileSync(path.join(outDir, 'overview.md'), 'utf-8');
    expect(overview).toContain('sprint-1.md');
    const planning = fs.readFileSync(path.join(outDir, 'sprint', 'sprint-1-planning.md'), 'utf-8');
    expect(planning).toContain('T1: Bootstrap');
    expect(planning).toContain('task-1-bootstrap.md');
    expect(planning).toContain('  - [x]');
    expect(planning).toContain('T1.1: Child');
  });

  it('generateOne returns md + html for a single uuid', () => {
    const uuid = 'd94a7ae6-b3f5-4c29-a067-5e8b3f14a9c2';
    idx.put(uuid, { ior: 'ior:class:Requirement', model: { uuid, name: 'R1', description: 'Do Y', priority: 'HIGH' }, ownerIor: null });
    const gen = new ViewGenerator(idx, defaultTemplateRegistry(), outDir);
    const result = gen.generateOne(uuid);
    expect(result).not.toBeNull();
    expect(result!.md).toContain('R1');
    expect(result!.html).toContain('R1');
  });
});

describe('T127.2: IORResolver', () => {
  let idxDir: string;
  let idx: ScenarioIndex;
  beforeEach(() => { idxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ior-')); idx = new ScenarioIndex(idxDir); });
  afterEach(() => { fs.rmSync(idxDir, { recursive: true, force: true }); });

  it('resolves ior:class to className', () => {
    const resolver = new IORResolver(idx, defaultTemplateRegistry(), '/tmp');
    const result = resolver.resolve('ior:class:Task');
    expect(result.type).toBe('class');
    expect(result.className).toBe('Task');
  });

  it('resolves ior:instance to unit + rendered views', () => {
    const uuid = 'e05f1a2b-3c4d-4e5f-9a7b-8c9d0e1f2a3b';
    idx.put(uuid, { ior: 'ior:class:Task', model: { uuid, name: 'TestTask', status: 'Done' }, ownerIor: null });
    const resolver = new IORResolver(idx, defaultTemplateRegistry(), '/tmp');
    const result = resolver.resolve(`ior:instance:${uuid}`);
    expect(result.type).toBe('instance');
    expect(result.className).toBe('Task');
    expect(result.unit).toBeDefined();
    expect(result.html).toContain('TestTask');
    expect(result.md).toContain('TestTask');
  });

  it('resolves ior:file to filePath', () => {
    const resolver = new IORResolver(idx, defaultTemplateRegistry(), os.tmpdir());
    const result = resolver.resolve('ior:file:.');
    expect(result.type).toBe('file');
    expect(result.filePath).toBeDefined();
  });

  it('returns unknown for invalid IOR', () => {
    const resolver = new IORResolver(idx, defaultTemplateRegistry(), '/tmp');
    expect(resolver.resolve('garbage').type).toBe('unknown');
  });
});
