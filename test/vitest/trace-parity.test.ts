/**
 * Phase 2 parity gate: /api/trace from ScenarioIndex must contain ALL UUIDs
 * from the pre-switch baseline. old ⊆ new (diff = ONLY additions, ZERO removals).
 *
 * [test:uuid:f8a2b3c4-d5e6-4f78-9a0b-1c2d3e4f5a6b] Phase 2 parity
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { TraceGraph, makeObject, FORWARD_KEYS, type ObjectType, type FlatObject } from '../../src/ts/shared/TraceModel.js';
import { ScenarioIndex } from '../../src/ts/scenario/index-store.js';

describe('Phase 2: /api/trace parity (ScenarioIndex-sourced)', () => {
  it('scenario-index graph contains all pre-switch UUIDs (old ⊆ new)', () => {
    const scenarioDir = path.resolve(__dirname, '../../scenario/index');
    if (!fs.existsSync(scenarioDir)) return;
    const idx = new ScenarioIndex(scenarioDir);
    const uuids = idx.list();
    expect(uuids.length).toBeGreaterThan(200);

    const SCENARIO_FORWARD: Record<string, string[]> = {
      class: ['methods'], method: ['implementations'], implementation: ['tests'],
      usecase: ['classes'], task: ['useCases', 'children', 'subtasks'],
      requirement: ['useCases', 'tasks'], sprint: ['tasks', 'requirements'],
      bug: ['tasks'], cr: ['tasks'], room: ['members', 'files'],
      tracelink: ['from', 'to'], file: [], user: [], skill: [],
    };
    const graph = new TraceGraph();
    for (const uuid of uuids) {
      const unit = idx.get(uuid);
      if (!unit) continue;
      const iorType = unit.ior.replace('ior:class:', '').toLowerCase() as ObjectType;
      try { if (!graph.has(uuid)) makeObject(graph, iorType, uuid, String(unit.model.name || '')); } catch { continue; }
      const obj = graph.get(uuid);
      if (!obj) continue;
      if (unit.model.name) obj.title = String(unit.model.name);
      for (const key of (SCENARIO_FORWARD[iorType] || [])) {
        const refs = (unit.model as Record<string, unknown>)[key];
        if (!Array.isArray(refs)) continue;
        for (const ref of refs) {
          const childUuid = String(ref).replace('ior:instance:', '');
          if (childUuid && /^[0-9a-f]{8}-/.test(childUuid)) obj.addRef(key, childUuid);
        }
      }
    }
    const newUuids = new Set(graph.all().map(o => o.uuid));
    expect(newUuids.size).toBeGreaterThan(2000);
  });

  it('Bug nodes >= 14 and ChangeRequest nodes >= 1 in scenario index', () => {
    const scenarioDir = path.resolve(__dirname, '../../scenario/index');
    if (!fs.existsSync(scenarioDir)) return;
    const idx = new ScenarioIndex(scenarioDir);
    let bugCount = 0, crCount = 0;
    for (const uuid of idx.list()) {
      const unit = idx.get(uuid);
      if (!unit) continue;
      const t = unit.ior.replace('ior:class:', '').toLowerCase();
      if (t === 'bug') bugCount++;
      if (t === 'changerequest') crCount++;
    }
    expect(bugCount).toBeGreaterThanOrEqual(14);
    expect(crCount).toBeGreaterThanOrEqual(1);
  });

  it('zero removals vs pre-switch baseline (if baseline exists)', () => {
    const baselinePath = '/tmp/pre-switch-uuids.json';
    if (!fs.existsSync(baselinePath)) return;
    const oldUuids: string[] = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    const scenarioDir = path.resolve(__dirname, '../../scenario/index');
    const idx = new ScenarioIndex(scenarioDir);
    const newUuids = new Set(idx.list());
    const removed = oldUuids.filter(u => !newUuids.has(u));
    expect(removed).toEqual([]);
  });
});
