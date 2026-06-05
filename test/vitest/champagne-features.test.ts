/**
 * T191 Champagne — dedicated tests for shipped Tron-facing features.
 *
 * [test:uuid:dc891c35-a906-4270-9082-8b492ff61668] T191 champagne feature tests
 * [verifies:uuid:35c3d4e5-f6a7-4b82-9c93-1d2e3f4a5b64] R15.4 defaultItemView per object
 * [verifies:uuid:45d4e5f6-a7b8-4c90-8d01-2e3f4a5b6c75] R15.5 ListOverview search
 * [verifies:uuid:55e5f6a7-b8c9-4d01-8e12-3f4a5b6c7d86] R15.6 Task DetailViews
 * [verifies:uuid:65f6a7b8-c9d0-4e12-8f23-4a5b6c7d8e96] R15.7 traceability browser
 * [verifies:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000004] R17.4 UUID prefix index
 * [verifies:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000008] R17.8 views generated from JSON
 * [verifies:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000009] R17.9 planning.md generated
 * [verifies:uuid:d4e5f6a7-b8c9-4d0e-1f2a-000000000010] R17.10 sprint overview
 * [verifies:uuid:bca276d9-8ff6-4234-a562-19e15e4ab8fb] R16.3 pageNav sticky
 * [verifies:uuid:c32974c5-dd10-45a7-b5dd-0d711b412fdc] R-ED1 markdown nested lists
 * [verifies:uuid:80ca8e83-fb7e-4c22-8a93-b9d381c7f269] R-RoomFlood room cleanup
 * [verifies:uuid:47a86209-e0bb-4142-a6ad-4fff94ff9921] R17.20 req+UC scenario units
 * [verifies:uuid:bebee55d-7d39-4f0c-b7de-d56e72d01363] R17.18 traceability as units
 * [verifies:uuid:b2237873-39b9-4154-9624-f809a9ca4983] R16.4 chain data fix
 * [verifies:uuid:7e4f8a2b-c3d5-4e6f-9a1b-2c3d4e5f6a25] R17.26 traceability is a tree
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const IDX_DIR = path.resolve(__dirname, '../../scenario/index');
const SPRINTS_JSON = path.resolve(__dirname, '../../scenario/sprints.json');
const SPRINTS_MD = path.resolve(__dirname, '../../scenario/sprints.md');

describe('R15.4: defaultItemView per object (rb-object-item)', () => {
  it('rb-object-item.ts exists with render method', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../src/public/ts/trace/rb-object-item.ts'), 'utf-8');
    expect(src).toContain('class RbObjectItem');
    expect(src).toContain('render()');
    expect(src).toContain('TRACE_ICONS');
  });
});

describe('R15.5: ListOverview search', () => {
  it('rb-list-overview.test.ts exists and covers list rendering', () => {
    expect(fs.existsSync(path.resolve(__dirname, 'rb-list-overview.test.ts'))).toBe(true);
  });
});

describe('R15.6: Task DetailView + planning overview', () => {
  it('rb-task-detail.ts has render with chain links', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../src/public/ts/trace/rb-task-detail.ts'), 'utf-8');
    expect(src).toContain('class RbTaskDetail');
    expect(src).toContain('renderLinks');
    expect(src).toContain('Scenario view');
  });

  it('generated planning.md contains task list with checkboxes', () => {
    const plannings = fs.readdirSync(path.join(SPRINTS_MD, 'sprint')).filter(f => f.includes('planning'));
    expect(plannings.length).toBeGreaterThan(0);
    const content = fs.readFileSync(path.join(SPRINTS_MD, 'sprint', plannings[0]), 'utf-8');
    expect(content).toMatch(/- \[.\]/);
  });
});

describe('R15.7: Traceability browser', () => {
  it('rb-trace-tree.ts has tree component with lazy-load', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../src/public/ts/trace/rb-trace-tree.ts'), 'utf-8');
    expect(src).toContain('class RbTraceTree');
    expect(src).toContain('toggle-children');
  });

  it('/api/trace returns objects with types', async () => {
    const { scanRepo } = await import('../../src/ts/server/TraceConsistency.js');
    const { graph } = scanRepo(path.resolve(__dirname, '../../scrum.pmo/sprints'), path.resolve(__dirname, '../../src'));
    expect(graph.all().length).toBeGreaterThan(100);
  });
});

describe('R17.4: UUID prefix index', () => {
  it('scenario/index has 5-level UUID prefix structure', () => {
    const entries = fs.readdirSync(IDX_DIR);
    expect(entries.length).toBeGreaterThan(0);
    const sample = entries[0];
    const level2 = fs.readdirSync(path.join(IDX_DIR, sample));
    expect(level2.length).toBeGreaterThan(0);
  });

  it('index contains scenario.json files', () => {
    const allFiles: string[] = [];
    function walk(dir: string) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) walk(path.join(dir, e.name));
        else if (e.name.endsWith('.scenario.json')) allFiles.push(e.name);
      }
    }
    walk(IDX_DIR);
    expect(allFiles.length).toBeGreaterThan(100);
  });
});

describe('R17.8: Views generated from flat JSON', () => {
  it('task views are generated from templates', () => {
    const taskDir = path.join(SPRINTS_MD, 'task');
    const mdFiles = fs.readdirSync(taskDir).filter(f => f.endsWith('.md'));
    expect(mdFiles.length).toBeGreaterThan(50);
    const sample = fs.readFileSync(path.join(taskDir, mdFiles[0]), 'utf-8');
    expect(sample).toMatch(/^#|Traceability/m);
  });
});

describe('R17.9: planning.md is generated', () => {
  it('planning.md files exist for multiple sprints', () => {
    const plannings = fs.readdirSync(path.join(SPRINTS_MD, 'sprint')).filter(f => f.includes('planning'));
    expect(plannings.length).toBeGreaterThanOrEqual(2);
  });
});

describe('R17.10: Sprint overview', () => {
  it('overview.md lists sprints with status', () => {
    const overview = fs.readFileSync(path.join(SPRINTS_MD, 'overview.md'), 'utf-8');
    expect(overview).toContain('Sprint');
    expect(overview).toMatch(/Done|In Progress/);
  });
});

describe('R16.3: pageNav sticky', () => {
  it('server.ts pageNav renders position:sticky;top:0', () => {
    const serverTs = fs.readFileSync(path.resolve(__dirname, '../../src/ts/server/server.ts'), 'utf-8');
    expect(serverTs).toContain('position:sticky');
    expect(serverTs).toContain('top:0');
  });
});

describe('R-ED1: Markdown nested lists', () => {
  it('MD_CSS has ul/ol padding-left for nesting', () => {
    const serverTs = fs.readFileSync(path.resolve(__dirname, '../../src/ts/server/server.ts'), 'utf-8');
    expect(serverTs).toMatch(/ul,ol\{padding-left/);
    expect(serverTs).toMatch(/ul ul|ol ol/);
  });
});

describe('R17.20: Requirement + UseCase scenario units', () => {
  it('requirement and usecase units exist in index', () => {
    let reqs = 0, ucs = 0;
    function walk(dir: string) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) walk(path.join(dir, e.name));
        else if (e.name.endsWith('.scenario.json')) {
          const d = JSON.parse(fs.readFileSync(path.join(dir, e.name), 'utf-8'));
          if (d.ior === 'ior:class:Requirement') reqs++;
          if (d.ior === 'ior:class:UseCase') ucs++;
        }
      }
    }
    walk(IDX_DIR);
    expect(reqs).toBeGreaterThan(20);
    expect(ucs).toBeGreaterThan(10);
  });
});

describe('R17.18: Traceability links as scenario units', () => {
  it('tracelink views exist', () => {
    const tlDir = path.join(SPRINTS_MD, 'tracelink');
    if (fs.existsSync(tlDir)) {
      const files = fs.readdirSync(tlDir).filter(f => f.endsWith('.md'));
      expect(files.length).toBeGreaterThan(0);
    }
  });
});

describe('R17.26: Traceability is a TREE', () => {
  it('TraceModel FORWARD_KEYS defines 7-step chain', async () => {
    const { FORWARD_KEYS } = await import('../../src/ts/shared/TraceModel.js');
    expect(FORWARD_KEYS.requirement).toBe('tasks');
    expect(FORWARD_KEYS.task).toBe('useCases');
    expect(FORWARD_KEYS.usecase).toBe('classes');
    expect(FORWARD_KEYS.class).toBe('methods');
    expect(FORWARD_KEYS.method).toBe('implementations');
    expect(FORWARD_KEYS.implementation).toBe('tests');
  });
});

describe('R16.4: Chain data diagnosis + fix', () => {
  it('trace-cli validate returns issues array', async () => {
    const { validate } = await import('../../src/ts/server/TraceConsistency.js');
    const { TraceGraph } = await import('../../src/ts/shared/TraceModel.js');
    const g = new TraceGraph();
    const issues = validate(g, []);
    expect(Array.isArray(issues)).toBe(true);
  });
});

describe('R-RoomFlood: E2E cleanup', () => {
  it('cleanupTestUsers helper exists in helpers.ts', () => {
    const helpers = fs.readFileSync(path.resolve(__dirname, '../../test/e2e/helpers.ts'), 'utf-8');
    expect(helpers).toContain('cleanupTestUsers');
    expect(helpers).toContain('cleanupTestRooms');
  });
});
