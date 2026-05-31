# T138: skill set on scenarios (capture-quote, propose-task, walk-chain)
[task:uuid:9a1faf02-cffd-4e74-b115-5dba87b06ad0]

## Status

- [ ] Planned
- [x] In Progress
  - [x] refinement (req → architect)
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

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

## Acceptance Criteria

- [ ] AC1 — `captureQuote(text, sprintIor)` emits a valid Requirement scenario.json; IOR.resolve() round-trips
- [ ] AC2 — `proposeTask(reqIor, spec)` emits a valid Task scenario.json initialized at `Planned`; T133 FSM verbs callable on the new Task
- [ ] AC3 — `walkChain(ior)` returns a complete chain walk for an existing migrated task (e.g. Sprint 1 task-1) — covers req → task → useCase → method
- [ ] AC4 — Cycle detection: `walkChain` on a known cycle (architect picks or constructs one) terminates with a documented cycle marker
- [ ] AC5 — vitest covers each verb (≥2 tests per verb: happy path + edge)
- [ ] AC6 — Verbs are importable from `src/ts/scenario/skills.ts` and used in at least one downstream caller (e.g. trace-cli or migrate-to-scenario.ts)
- [ ] AC7 — `npm run build` + suite passes; rule-pair (a)+(b) per #15 (new exports + new module = surface change worth bumping); (c) STATIC_SHELL exempt

## QA Audit & User Feedback

- 2026-05-31: Tron via PO directed S17 2nd extension. CMM4 4-role enforced. Awaiting req anchor + architect design.

## Subtasks

None (atomic — single skills module).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 7 (S17 2nd extension)*
*Owners (CMM4): robbin-req (req anchor), robbin-architect (verb-contract design), robbin-expert (skills.ts impl), robbin-tester (verify)*
*Priority: 4 (verb-set foundation — T137 adopts it; T136 uses it)*
