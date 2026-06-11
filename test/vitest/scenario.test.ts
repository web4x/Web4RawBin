/**
 * T125 — Scenario-unit foundation tests (AC6: ≥1 test per sub-task).
 * [test:uuid:5a125001-b002-4c03-9d04-e05f06a07b08] T125 scenario-unit primitives
 * [verifies:uuid:cb93f0db-0e42-4795-b41f-2e125120f259] R17.1 scenario JSON unit
 * [verifies:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000016] R17.17 task status state-machine
 * [verifies:uuid:9dedeb00-6038-4c43-bcd4-efab99792be1] R17.24 source location on UC
 * [verifies:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000017] R17.16 HTML status renders
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
  ViewTemplateRegistry, TaskTemplate, defaultTemplateRegistry, renderStatusHtml,
  ViewGenerator,
  IORResolver,
  startRefinement, startImplementing, startTesting, requestQAReview, tronApprove, canTransition, resetToPlanned,
  createTraceLink, inverseRelation, TraceLinkLoader,
  captureQuote, proposeTask, walkChain, statusTransition,
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
    expect(reg.all().length).toBe(12);
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

  it('R18.29: addLink creates symlink + persists unitLinks[]', () => {
    const uuid = 'a7f3c1d2-8b4e-4f9a-b6c5-3d2e1f0a9b8c';
    idx.put(uuid, { ior: 'ior:class:Task', model: { uuid, name: 'T1' }, ownerIor: null });
    const linkPath = 'sprints.json/sprint-1/task/task-1.scenario.json';
    idx.addLink(uuid, linkPath);
    const reloaded = idx.get(uuid);
    expect((reloaded!.model as any).unitLinks).toContain(linkPath);
    const symlinkFull = path.join(idx.scenarioRoot, linkPath);
    expect(fs.existsSync(symlinkFull)).toBe(true);
  });

  it('R18.30: removeLink removes symlink + updates unitLinks[]', () => {
    const uuid = 'a7f3c1d2-8b4e-4f9a-b6c5-3d2e1f0a9b8c';
    const linkPath = 'sprints.json/sprint-1/task/task-1.scenario.json';
    idx.put(uuid, { ior: 'ior:class:Task', model: { uuid, name: 'T1', unitLinks: [linkPath] }, ownerIor: null });
    idx.removeLink(uuid, linkPath);
    const reloaded = idx.get(uuid);
    expect((reloaded!.model as any).unitLinks).not.toContain(linkPath);
    expect(fs.existsSync(path.join(idx.scenarioRoot, linkPath))).toBe(false);
  });

  it('R18.31: put() auto-syncs symlinks when unitLinks[] present', () => {
    const uuid = 'b72e58c4-91d3-4a07-b845-3c6f1d92e7a0';
    const linkPath = 'sprints.json/sprint-2/task/task-7.scenario.json';
    idx.put(uuid, { ior: 'ior:class:Task', model: { uuid, name: 'T7', unitLinks: [linkPath] }, ownerIor: null });
    expect(fs.existsSync(path.join(idx.scenarioRoot, linkPath))).toBe(true);
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

  it('resolves bare UUID (no ior: prefix) to instance', () => {
    const uuid = 'e05f1a2b-3c4d-4e5f-9a7b-8c9d0e1f2a3b';
    idx.put(uuid, { ior: 'ior:class:Task', model: { uuid, name: 'BareTest' }, ownerIor: null });
    const resolver = new IORResolver(idx, defaultTemplateRegistry(), '/tmp');
    const result = resolver.resolve(uuid);
    expect(result.type).toBe('instance');
    expect(result.unit).toBeDefined();
    expect(result.html).toContain('BareTest');
  });

  it('resolves uuid.scenario.json suffix to instance', () => {
    const uuid = 'e05f1a2b-3c4d-4e5f-9a7b-8c9d0e1f2a3b';
    idx.put(uuid, { ior: 'ior:class:Task', model: { uuid, name: 'SuffixTest' }, ownerIor: null });
    const resolver = new IORResolver(idx, defaultTemplateRegistry(), '/tmp');
    const result = resolver.resolve(`${uuid}.scenario.json`);
    expect(result.type).toBe('instance');
    expect(result.html).toContain('SuffixTest');
  });

  it('returns unknown for invalid IOR', () => {
    const resolver = new IORResolver(idx, defaultTemplateRegistry(), '/tmp');
    expect(resolver.resolve('garbage').type).toBe('unknown');
  });
});

describe('T132: renderStatusHtml', () => {
  it('renders checklist with nested substeps as HTML list', () => {
    const checklist = '- [x] Planned\n- [x] In Progress\n  - [x] refinement\n  - [ ] implementing\n- [ ] Done';
    const html = renderStatusHtml(checklist);
    expect(html).toContain('<ul class="sv-steps">');
    expect(html).toContain('<ul class="sv-substeps">');
    expect(html).toContain('✅ Planned');
    expect(html).toContain('⬜ implementing');
    expect(html).toContain('⬜ Done');
  });

  it('returns empty for empty checklist', () => {
    expect(renderStatusHtml('')).toBe('');
  });
});

describe('T133: Task state machine', () => {
  function mkTask(status = 'Planned'): ScenarioUnit {
    return { ior: 'ior:class:Task', model: { uuid: 'x', status }, ownerIor: null };
  }

  it('happy path: Planned → Refining → Implementing → Testing → QAReview → Done', () => {
    const t = mkTask();
    startRefinement(t); expect(t.model.status).toBe('Refining');
    startImplementing(t); expect(t.model.status).toBe('Implementing');
    startTesting(t); expect(t.model.status).toBe('Testing');
    requestQAReview(t); expect(t.model.status).toBe('QAReview');
    tronApprove(t, 'abc123'); expect(t.model.status).toBe('Done');
    expect((t.model as any).tronApprovalCommit).toBe('abc123');
  });

  it('rejects invalid transition', () => {
    const t = mkTask('Planned');
    expect(() => startTesting(t)).toThrow(/Cannot transition/);
  });

  it('tronApprove requires commit ref', () => {
    const t = mkTask('QAReview');
    expect(() => tronApprove(t, '')).toThrow(/requires a Tron commit ref/);
  });

  it('canTransition checks allowed targets', () => {
    const t = mkTask('Implementing');
    expect(canTransition(t, 'Testing')).toBe(true);
    expect(canTransition(t, 'Done')).toBe(false);
  });

  it('resetToPlanned works from any state', () => {
    const t = mkTask('Testing');
    resetToPlanned(t); expect(t.model.status).toBe('Planned');
  });
});

describe('T134: TraceLink', () => {
  it('createTraceLink produces valid unit with from/to/relation', () => {
    const link = createTraceLink('aaa-uuid', 'task', 'bbb-uuid', 'requirement', 'implements');
    expect(link.ior).toBe('ior:class:TraceLink');
    expect(link.model.from).toBe('ior:instance:aaa-uuid');
    expect(link.model.to).toBe('ior:instance:bbb-uuid');
    expect(link.model.relation).toBe('implements');
    expect(link.model.direction).toBe('bidirectional');
    expect(link.model.uuid).toBeTruthy();
  });

  it('inverseRelation returns correct inverse', () => {
    expect(inverseRelation('implements')).toBe('implementedBy');
    expect(inverseRelation('contains')).toBe('containedBy');
    expect(inverseRelation('tests')).toBe('testedBy');
  });

  it('TraceLinkLoader.create populates defaults', () => {
    const unit = TraceLinkLoader.create({ ior: 'ior:class:TraceLink', model: { uuid: 'x', relation: 'follows' }, ownerIor: null });
    expect(unit.model.relation).toBe('follows');
    expect(unit.model.direction).toBe('bidirectional');
  });

  it('ClassRegistry resolves TraceLink (8th class)', () => {
    const reg = new ClassRegistry();
    expect(reg.has(iorClass('TraceLink'))).toBe(true);
    expect(reg.all().length).toBe(12);
  });

  it('defaultTemplateRegistry renders TraceLink HTML+MD', () => {
    const reg = defaultTemplateRegistry();
    const link = createTraceLink('aaa', 'task', 'bbb', 'requirement', 'implements', { label: 'T1 implements R1' });
    expect(reg.renderHtml(link)).toContain('implements');
    expect(reg.renderMd(link)).toContain('implements');
    expect(reg.renderMd(link)).toContain('T1 implements R1');
  });
});

describe('T138: Skills', () => {
  let idxDir: string;
  let idx: ScenarioIndex;
  beforeEach(() => { idxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-')); idx = new ScenarioIndex(idxDir); });
  afterEach(() => { fs.rmSync(idxDir, { recursive: true, force: true }); });

  it('captureQuote creates Requirement + dedupes on repeat', () => {
    const r1 = captureQuote(idx, 'the items should have a name attribute', 'ior:instance:sprint-1');
    expect(r1.unit.ior).toBe('ior:class:Requirement');
    expect(r1.unit.model.tronQuote).toBe('the items should have a name attribute');
    const r2 = captureQuote(idx, 'the items should have a name attribute', 'ior:instance:sprint-1');
    expect(r2.ior).toBe(r1.ior);
  });

  it('proposeTask creates Task at Planned + emits TraceLinks', () => {
    const req = captureQuote(idx, 'test req', 'ior:instance:sprint-1');
    const task = proposeTask(idx, req.ior, { name: 'T1', description: 'Do X', sprintIor: 'ior:instance:sprint-1' });
    expect(task.unit.ior).toBe('ior:class:Task');
    expect(task.unit.model.status).toBe('Planned');
    expect(task.links.length).toBe(2);
  });

  it('walkChain traverses from requirement down to task', () => {
    const req = captureQuote(idx, 'walk test', 'ior:instance:s1');
    const task = proposeTask(idx, req.ior, { name: 'T-walk', description: '', sprintIor: 'ior:instance:s1' });
    const chain = walkChain(idx, req.ior, 'both');
    expect(chain.length).toBeGreaterThanOrEqual(2);
    expect(chain.some(s => s.type === 'Requirement')).toBe(true);
    expect(chain.some(s => s.type === 'Task')).toBe(true);
  });

  it('statusTransition applies FSM verb + persists', () => {
    const req = captureQuote(idx, 'fsm test', 'ior:instance:s1');
    const task = proposeTask(idx, req.ior, { name: 'T-fsm', description: '', sprintIor: 'ior:instance:s1' });
    statusTransition(idx, task.ior, 'startRefinement');
    const reloaded = idx.get(task.ior.replace('ior:instance:', ''));
    expect(reloaded?.model.status).toBe('Refining');
  });
});

// S19 T-file-unit R19.14 tests
import { createFileUnit, readFileUnitContent } from '../../src/ts/scenario/file-unit.js';
describe('S19 T-file-unit R19.14: files as scenario units', () => {
  let tmp: string; let idx: ScenarioIndex;
  beforeEach(() => { tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fu-')); fs.mkdirSync(path.join(tmp, 'index')); idx = new ScenarioIndex(path.join(tmp, 'index')); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });
  it('creates file unit + content sidecar', () => {
    const u = createFileUnit(idx, { name: 'hello.txt', content: 'hello world' });
    expect(u.ior).toBe('ior:class:File');
    expect((u.model as any).size).toBe(11);
    expect((u.model as any).contentPath).toMatch(/.content/);
  });
  it('roomUuid populates unitLinks[] + ownerIor', () => {
    const u = createFileUnit(idx, { name: 'f.md', content: 'x', roomUuid: 'abc-def' });
    expect(u.ownerIor).toBe('ior:instance:abc-def');
    expect((u.model as any).unitLinks).toContain('rooms/abc-def/files/' + (u.model as any).uuid + '.scenario.json');
  });
  it('readFileUnitContent retrieves the bytes', () => {
    const u = createFileUnit(idx, { name: 'b.bin', content: Buffer.from([1,2,3,4]) });
    const back = readFileUnitContent(idx, (u.model as any).uuid);
    expect(back).not.toBeNull();
    expect(Array.from(back!)).toEqual([1,2,3,4]);
  });
});
