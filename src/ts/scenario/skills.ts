/**
 * T138 — Scenario skills: captureQuote, proposeTask, walkChain, statusTransition.
 * Agent-invocable verbs that read/write scenario units via ScenarioIndex.
 *
 * [impl:uuid:f8138a01-b202-4c03-9d04-e05f06a07b09] R17.18
 */
import crypto from 'node:crypto';
import { type ScenarioUnit, iorInstance } from './types.js';
import { ScenarioIndex } from './index-store.js';
import { createTraceLink, inverseRelation, RELATION_INVERSE } from './trace-link.js';
import { startRefinement, startCreatingTestCases, startImplementing, startTesting, requestQAReview, tronApprove } from './task-fsm.js';

export interface SkillResult {
  ior: string;
  unit: ScenarioUnit;
  links: string[];
}

export interface ChainStep {
  ior: string;
  type: string;
  name: string;
  relation: string;
  depth: number;
}

export interface TaskSpec {
  name: string;
  description: string;
  assigned?: string;
  effort?: string;
  acceptanceCriteria?: string[];
  sprintIor: string;
}

export type TaskVerb = 'startRefinement' | 'startCreatingTestCases' | 'startImplementing' | 'startTesting' | 'requestQAReview' | 'tronApprove';

export function captureQuote(idx: ScenarioIndex, text: string, sprintIor: string, taskIor?: string): SkillResult {
  const textHash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);

  for (const uuid of idx.list()) {
    const existing = idx.get(uuid);
    if (existing && (existing.model as any).textHash === textHash) {
      return { ior: `ior:instance:${uuid}`, unit: existing, links: [] };
    }
  }

  const uuid = crypto.randomUUID();
  const unit: ScenarioUnit = {
    ior: 'ior:class:Requirement',
    model: {
      uuid, name: text.split(/\s+/).slice(0, 8).join(' ') + '…',
      description: text, tronQuote: text, textHash,
      capturedAt: new Date().toISOString(),
      tasks: [], tests: [],
    },
    ownerIor: sprintIor,
  };
  idx.put(uuid, unit);

  const links: string[] = [];
  if (taskIor) {
    const link = createTraceLink(taskIor.replace('ior:instance:', ''), 'task', uuid, 'requirement', 'implements');
    idx.put(link.model.uuid as string, link);
    links.push(`ior:instance:${link.model.uuid}`);
  }
  return { ior: `ior:instance:${uuid}`, unit, links };
}

export function proposeTask(idx: ScenarioIndex, requirementIor: string, spec: TaskSpec): SkillResult {
  const uuid = crypto.randomUUID();
  const unit: ScenarioUnit = {
    ior: 'ior:class:Task',
    model: {
      uuid, name: spec.name, description: spec.description,
      status: 'Planned',
      assigned: spec.assigned || '', effort: spec.effort || '',
      acceptanceCriteria: (spec.acceptanceCriteria || []).join('\n'),
      statusChecklist: '- [ ] Planned\n- [ ] In Progress\n  - [ ] refinement\n  - [ ] creating test cases\n  - [ ] implementing\n  - [ ] testing\n- [ ] QA Review\n- [ ] Done',
      children: [], requirements: [requirementIor],
      useCases: [], implementations: [],
    },
    ownerIor: spec.sprintIor,
  };
  idx.put(uuid, unit);

  const links: string[] = [];
  const reqUuid = requirementIor.replace('ior:instance:', '');
  const l1 = createTraceLink(reqUuid, 'requirement', uuid, 'task', 'implements');
  idx.put(l1.model.uuid as string, l1);
  links.push(`ior:instance:${l1.model.uuid}`);

  const sprintUuid = spec.sprintIor.replace('ior:instance:', '');
  const l2 = createTraceLink(sprintUuid, 'sprint', uuid, 'task', 'contains');
  idx.put(l2.model.uuid as string, l2);
  links.push(`ior:instance:${l2.model.uuid}`);

  return { ior: `ior:instance:${uuid}`, unit, links };
}

export function walkChain(idx: ScenarioIndex, startIor: string, direction: 'down' | 'up' | 'both' = 'both', maxDepth = 10): ChainStep[] {
  const visited = new Set<string>();
  const steps: ChainStep[] = [];

  function walk(ior: string, depth: number, incomingRelation: string): void {
    if (depth > maxDepth) return;
    const uuid = ior.replace('ior:instance:', '');
    if (visited.has(uuid)) return;
    visited.add(uuid);

    const unit = idx.get(uuid);
    if (!unit) return;
    steps.push({
      ior, type: unit.ior.replace('ior:class:', ''),
      name: (unit.model.name as string) || '', relation: incomingRelation, depth,
    });

    for (const linkUuid of idx.list()) {
      const link = idx.get(linkUuid);
      if (!link || link.ior !== 'ior:class:TraceLink') continue;
      const m = link.model as Record<string, unknown>;
      const fromUuid = String(m.from || '').replace('ior:instance:', '');
      const toUuid = String(m.to || '').replace('ior:instance:', '');
      const isFrom = fromUuid === uuid;
      const isTo = toUuid === uuid;
      if (!isFrom && !isTo) continue;
      const targetUuid = isFrom ? toUuid : fromUuid;
      if (!targetUuid) continue;
      const rel = isFrom ? String(m.relation || '') : inverseRelation(String(m.relation || ''));
      if (direction === 'down' && !isFrom) continue;
      if (direction === 'up' && isFrom) continue;
      walk(`ior:instance:${targetUuid}`, depth + 1, rel);
    }
  }

  walk(startIor, 0, 'start');
  return steps;
}

export function statusTransition(idx: ScenarioIndex, taskIor: string, verb: TaskVerb, opts?: { tronCommitRef?: string }): SkillResult {
  const uuid = taskIor.replace('ior:instance:', '');
  const unit = idx.get(uuid);
  if (!unit || unit.ior !== 'ior:class:Task') throw new Error(`Not a Task unit: ${taskIor}`);

  switch (verb) {
    case 'startRefinement': startRefinement(unit); break;
    case 'startCreatingTestCases': startCreatingTestCases(unit); break;
    case 'startImplementing': startImplementing(unit); break;
    case 'startTesting': startTesting(unit); break;
    case 'requestQAReview': requestQAReview(unit); break;
    case 'tronApprove': tronApprove(unit, opts?.tronCommitRef || ''); break;
  }

  idx.put(uuid, unit);
  return { ior: taskIor, unit, links: [] };
}
