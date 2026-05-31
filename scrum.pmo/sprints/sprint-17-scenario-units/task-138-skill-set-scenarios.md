[Back to Sprint 17 Planning](./planning.md)

# T138: skill set on scenarios (capture-quote, propose-task, walk-chain)

[task:uuid:9a1faf02-cffd-4e74-b115-5dba87b06ad0]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req → architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned (CMM4 4-role per learnings #18)
1. **robbin-req** — captures verbatim Tron quote; specifies the skill verbs from req-eng perspective
2. **robbin-architect** — designs the skill verb contract (signatures, inputs/outputs, IOR semantics)
3. **robbin-expert** — implements the skill verbs as callable methods on the scenario classes
4. **robbin-tester** — verifies each verb end-to-end + chain coverage

## Traceability

`[task:uuid:9a1faf02-cffd-4e74-b115-5dba87b06ad0]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:39a893de-1e86-4d0e-ace4-c09be2d42bdb]` —
    "Define and ship a skill verb-set operating over scenario units:
    `capture-quote` (Tron quote → Requirement unit), `propose-task`
    (requirement + spec → Task unit with sub-state ready for refinement),
    `walk-chain` (any IOR → traversal of its req→task→useCase→class→method→test
    chain). These verbs are first-class skills any role can invoke." (Tron
    via PO 2026-05-31; req-eng to anchor verbatim Tron quote here.)
- down
  - None (atomic — single skill-set deliverable)
- follows
  - [T125: 7-class foundation](./task-125-foundation.md) — verbs operate on these
  - [T133: Task FSM + verbs](./task-133-task-state-machine.md) — propose-task creates a Task in initial FSM state
  - [T134: TraceLink](./task-134-traceability-as-units.md) — walk-chain follows TraceLinks
  - [T137: req+planner learn scenarios](./task-137-req-planner-learn-scenarios.md) — T138 IS the verb-set those roles learn; coordinate
- chain
  - **requirement:** r138 skill-set on scenarios (Tron 2026-05-31)
  - **use case:** skill.captureQuote, skill.proposeTask, skill.walkChain (architect adds to s17-usecases.puml)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** new `src/ts/scenario/skills.ts` (or extension to `classes.ts`) — verbs as exported functions taking class instances + emitting events

## Task Description
Three foundational verbs every role uses, implemented over the scenario-unit
model:

**`captureQuote(text, sprintIor, taskIor?)` → Requirement unit**
- Input: verbatim Tron text, the Sprint that owns it, optional Task that motivates it
- Generates v4 `requirement:<uuid>`, stores `model.quote = text` + `model.capturedAt` + `ownerIor = sprintIor`
- Writes scenario.json via index-store (T125.3)
- If `taskIor` provided, emits a TraceLink (T134) from Task to Requirement
- Returns the new Requirement IOR

**`proposeTask(requirementIor, spec)` → Task unit**
- Input: a Requirement IOR + a spec object (title, ownerIor, AC list, etc.)
- Generates v4 `task:<uuid>`, initializes Task FSM (T133) at `Planned` state
- Wires `chain` block (`up → requirementIor`, `ownerIor → containing Sprint`)
- Emits TraceLink Requirement→Task + Sprint→Task
- Returns the new Task IOR

**`walkChain(ior)` → ChainWalk (array of IOR steps)**
- Input: any IOR (requirement, task, useCase, class, method, test, traceabilityLink)
- Traverses outgoing TraceLinks recursively to build the full chain (req → task → useCase → class → method → test)
- Returns the walk as a structured array (each step = `{ior, class, relation}`)
- Used by trace-cli, /trace browser, and role self-verification

## Architect Design — robbin-architect (2026-05-31)

### Skill Schema

Each `.skill` is a scenario-aware verb — a function that reads/writes scenario units via the ScenarioIndex + emits TraceLinks. Skills are the API that agents invoke instead of hand-editing markdown.

```typescript
// src/ts/scenario/skills.ts — all 4 skills exported from one module

interface SkillResult<T> {
  ior: string;          // IOR of the created/modified unit
  unit: ScenarioUnit;   // the unit itself
  links: string[];      // IORs of any TraceLinks emitted
}
```

### Skill 1: `captureQuote(text, sprintIor, taskIor?): SkillResult<Requirement>`

Captures a verbatim Tron quote as a Requirement scenario unit.

```typescript
function captureQuote(
  text: string,
  sprintIor: string,
  taskIor?: string
): SkillResult<Requirement> {
  // Dedupe: hash the text → check index for existing req with same hash
  const textHash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
  const existing = idx.findByModelField('textHash', textHash);
  if (existing) return { ior: existing.ior, unit: existing, links: [] };

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
    const link = emitTraceLink(uuid, taskIor.replace('ior:instance:', ''), 'implements');
    links.push(link);
  }
  return { ior: `ior:instance:${uuid}`, unit, links };
}
```

**Dedupe:** SHA-256 hash of text → stored in `model.textHash`. Same text = same requirement returned (no duplicate).

### Skill 2: `proposeTask(requirementIor, spec): SkillResult<Task>`

Creates a Task unit initialized at `Planned` state (T133 FSM).

```typescript
interface TaskSpec {
  name: string;
  description: string;
  assigned?: string;
  effort?: string;
  acceptanceCriteria?: string[];
  sprintIor: string;
}

function proposeTask(requirementIor: string, spec: TaskSpec): SkillResult<Task> {
  const uuid = crypto.randomUUID();
  const unit: ScenarioUnit = {
    ior: 'ior:class:Task',
    model: {
      uuid, name: spec.name, description: spec.description,
      status: 'Planned',  // T133 FSM initial state
      assigned: spec.assigned || '', effort: spec.effort || '',
      acceptanceCriteria: spec.acceptanceCriteria?.join('\n') || '',
      statusChecklist: '- [ ] Planned\n- [ ] In Progress\n  - [ ] refinement\n  - [ ] creating test cases\n  - [ ] implementing\n  - [ ] testing\n- [ ] QA Review\n- [ ] Done',
      children: [], requirements: [requirementIor],
      useCases: [], implementations: [],
    },
    ownerIor: spec.sprintIor,
  };
  idx.put(uuid, unit);

  const links: string[] = [];
  // Requirement → Task link
  const reqUuid = requirementIor.replace('ior:instance:', '');
  links.push(emitTraceLink(reqUuid, uuid, 'implements'));
  // Sprint → Task link (contains)
  const sprintUuid = spec.sprintIor.replace('ior:instance:', '');
  links.push(emitTraceLink(sprintUuid, uuid, 'contains'));

  return { ior: `ior:instance:${uuid}`, unit, links };
}
```

### Skill 3: `walkChain(ior, direction?): ChainStep[]`

Traverses the TraceLink graph from any node.

```typescript
interface ChainStep {
  ior: string;
  type: string;     // class name: Task, Requirement, UseCase, etc.
  name: string;
  relation: string; // how we got here
  depth: number;
}

function walkChain(
  startIor: string,
  direction: 'down' | 'up' | 'both' = 'both',
  maxDepth = 10
): ChainStep[] {
  const visited = new Set<string>();
  const steps: ChainStep[] = [];

  function walk(ior: string, depth: number, incomingRelation: string): void {
    if (depth > maxDepth) return;
    const uuid = ior.replace('ior:instance:', '');
    if (visited.has(uuid)) {
      steps.push({ ior, type: '⚠️ CYCLE', name: `cycle at ${uuid.slice(0,8)}`, relation: incomingRelation, depth });
      return;  // Cycle detected — terminate this branch
    }
    visited.add(uuid);

    const unit = idx.get(uuid);
    if (!unit) return;
    steps.push({
      ior, type: unit.ior.replace('ior:class:', ''),
      name: unit.model.name || '', relation: incomingRelation, depth
    });

    // Find all TraceLinks where this uuid is from or to
    const links = idx.findLinks(uuid);
    for (const link of links) {
      const isFrom = link.model.from.includes(uuid);
      const targetIor = isFrom ? link.model.to : link.model.from;
      const rel = isFrom ? link.model.relation : (INVERSE_MAP[link.model.relation] || link.model.relation);
      if (direction === 'down' && !isFrom) continue;
      if (direction === 'up' && isFrom) continue;
      walk(targetIor, depth + 1, rel);
    }
  }

  walk(startIor, 0, 'start');
  return steps;
}
```

**Cycle detection:** `visited` set. If a UUID is seen again, emit a `⚠️ CYCLE` marker and stop that branch. No infinite recursion.
**Depth limit:** default 10 (req→task→uc→class→method→test = 6 levels max in normal chain).

### Skill 4: `statusTransition(taskIor, verb, opts?): SkillResult<Task>`

Wraps the T133 Task FSM verbs as a skill.

```typescript
type TaskVerb = 'startRefinement' | 'startCreatingTestCases' | 'startImplementing' |
  'startTesting' | 'requestQAReview' | 'tronApprove';

function statusTransition(
  taskIor: string,
  verb: TaskVerb,
  opts?: { tronCommitRef?: string }
): SkillResult<Task> {
  const uuid = taskIor.replace('ior:instance:', '');
  const unit = idx.get(uuid);
  if (!unit || unit.ior !== 'ior:class:Task') {
    throw new Error(`Not a Task unit: ${taskIor}`);
  }

  const prevStatus = unit.model.status;

  // Apply the FSM verb (T133 guard logic)
  switch (verb) {
    case 'startRefinement':
      guardTransition(unit, 'Planned');
      unit.model.status = 'Refining'; break;
    case 'startCreatingTestCases':
      guardTransition(unit, 'Refining');
      unit.model.status = 'CreatingTestCases'; break;
    case 'startImplementing':
      guardTransition(unit, 'Refining', 'CreatingTestCases');
      unit.model.status = 'Implementing'; break;
    case 'startTesting':
      guardTransition(unit, 'Implementing');
      unit.model.status = 'Testing'; break;
    case 'requestQAReview':
      guardTransition(unit, 'Testing');
      unit.model.status = 'QAReview'; break;
    case 'tronApprove':
      guardTransition(unit, 'QAReview');
      if (!opts?.tronCommitRef) throw new Error('tronApprove requires tronCommitRef');
      unit.model.status = 'Done';
      unit.model.tronApprovalCommit = opts.tronCommitRef; break;
  }

  // Update statusChecklist to reflect new state
  unit.model.statusChecklist = regenerateChecklist(unit.model.status);
  idx.put(uuid, unit);

  return { ior: taskIor, unit, links: [] };
}
```

### Module Structure

All 4 skills in one file: `src/ts/scenario/skills.ts`

```typescript
export { captureQuote } from './skills/captureQuote.js';
export { proposeTask } from './skills/proposeTask.js';
export { walkChain } from './skills/walkChain.js';
export { statusTransition } from './skills/statusTransition.js';
```

Or if keeping it simple: single `skills.ts` with all 4 exported functions (~200 lines total).

### Error Handling

All skills throw on invalid input (wrong IOR format, non-existent unit, guard violation). No silent failures. Callers (agents, trace-cli, migration) catch and report.

## Acceptance Criteria
- [ ] AC1 — `captureQuote(text, sprintIor)` emits a valid Requirement scenario.json; IOR.resolve() round-trips
- [ ] AC2 — `proposeTask(reqIor, spec)` emits a valid Task scenario.json initialized at `Planned`; T133 FSM verbs callable on the new Task
- [ ] AC3 — `walkChain(ior)` returns a complete chain walk for an existing migrated task (e.g. Sprint 1 task-1) — covers req → task → useCase → method
- [ ] AC4 — Cycle detection: `walkChain` on a known cycle (architect picks or constructs one) terminates with a documented cycle marker
- [ ] AC5 — vitest covers each verb (≥2 tests per verb: happy path + edge)
- [ ] AC6 — Verbs are importable from `src/ts/scenario/skills.ts` and used in at least one downstream caller (e.g. trace-cli or migrate-to-scenario.ts)
- [ ] AC7 — `npm run build` + suite passes; rule-pair (a)+(b) per #15 (new exports + new module = surface change worth bumping); (c) STATIC_SHELL exempt

## Test Scenarios
| Test | Action | Expected |
|------|--------|----------|
| TS1 | captureQuote("verbatim test text", sprint1Ior) | New Requirement unit emitted; IOR returned; round-trip OK |
| TS2 | captureQuote with the same text twice | Architect-defined: dedupe OR error (per AC) |
| TS3 | proposeTask on the new req | Task unit initialized at Planned state; chain wired |
| TS4 | walkChain on Sprint 1 task-1 IOR | Returns full chain walk: task→req+useCase+method+test |
| TS5 | walkChain on a synthetic cycle | Terminates with cycle marker |
| TS6 | Use captureQuote+proposeTask in migrate-to-scenario.ts | Migration emits the same shape as hand-written units |

## Dependencies
- **Requires:** T125 (classes), T133 (Task FSM), T134 (TraceLink for chain edges)
- **Coordinate-with:** T137 (req+planner SKILL.md adopts these verbs); T136 (migration extension uses captureQuote+proposeTask)
- **Enables:** Role-self-improvement workflow (T137) becomes mechanical: use verbs, not hand-edit markdown

## Drive Plan (planner-coordinated, CMM4)
1. **req-eng** anchors verbatim Tron quote; clarifies verb-naming and dedupe semantics
2. **architect** designs signatures + error handling + cycle detection
3. **expert** implements `skills.ts` per design; integrates with T125/T133/T134
4. **tester** runs TS1-TS6 + verifies usage from at least one caller

## Definition of Done
- [ ] All AC met
- [ ] Rule-pair held
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-31: Tron via PO directed S17 2nd extension. CMM4 4-role enforced. Awaiting req anchor + architect design.

## Subtasks
None (atomic — single skills module).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 7 (S17 2nd extension)*
*Owners (CMM4): robbin-req (req anchor), robbin-architect (verb-contract design), robbin-expert (skills.ts impl), robbin-tester (verify)*
*Priority: 4 (verb-set foundation — T137 adopts it; T136 uses it)*
