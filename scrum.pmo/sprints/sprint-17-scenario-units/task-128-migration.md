[Back to Sprint 17 Planning](./planning.md)

# T128: Migrate all existing sprints/tasks/requirements to scenario-unit model

[task:uuid:b94d2681-54f0-47e3-a431-f3d84e469b30]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owners:** robbin-planner (structure + coordination), robbin-req (requirement units), robbin-expert (migration tooling), robbin-tester (verify)

## Traceability

`[task:uuid:b94d2681-54f0-47e3-a431-f3d84e469b30]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **requirement:** R17.14 migrate all sprints/tasks/requirements with references to classes, tests, puml use cases, puml classes, verb/methods
- down
  - T128.1 — exemplar: Sprint 1 task-1 + task-1.1 (Tron's preferred structural template)
  - T128.2 — Sprints 2-9 batch (closed/QA'd; artifact-preserving — no prose rewrites)
  - T128.3 — Sprints 10-16 batch (active; regenerate views from instances)
  - T128.4 — method markers retrofit: every src/ method gets `[impl:uuid:]` linking up to a Task (chain closure for R17.13)
- chain
  - **requirement:** R17.14 + R17.13 (method→task→req closure achieved here)
  - **use case:** migrate.task, migrate.requirement, migrate.useCase, migrate.method, migrate.test, migrate.sprint, link.method-to-task (T124.6 PUML)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** `scripts/migrate-to-scenario.ts` (one-shot per sprint, --dry-run + --apply gated)
- requires
  - T125 (foundation), T126 (views), T127 (nav)
- enables
  - T129 verification

## Task Description
One-shot migration of every existing sprint (S1-S16) and the closed/QA history
into the scenario-unit model. Strategy:

**T128.1 — exemplar (Sprint 1 task-1 + task-1.1):**
- Hand-build the migration for Sprint 1's `task-1` + `task-1.1` (Tron's referenced
  structural template). This is the gold standard. Emit `<uuid>.scenario.json`
  units in `scenario/index/<5char>/`, build the `scenarios/sprints.json/sprint-1/task-1/task-1.1` symlink tree, and verify the generated `.md` + `.html` views match the desired aesthetic.

**T128.2 — Sprints 2-9 batch (closed):**
- These are signed-off; their prose is historical artifact. Migration extracts
  task uuids, owner ior, ac list, status, commits → `model` JSON. Original
  markdown stays as historical record under `scrum.pmo/.legacy/sprints/`. No prose rewrites.

**T128.3 — Sprints 10-16 batch (active):**
- Migration produces scenario-unit instances AND regenerates `planning.md` +
  per-task views from the templates (R17.9, R17.10). Each task file becomes a
  generated view of its unit. The `--apply` step replaces the hand-edited file
  with the generated view; planner verifies parity before applying.

**T128.4 — method markers retrofit (closes R17.13):**
- Scan `src/` for methods that should carry `[impl:uuid:]` linking to a Task; add
  the marker. Bounded to methods listed in task `chain` blocks. T121 already
  regenerated task:uuids to v4 (clean base). Output: trace-cli reports
  orphanMethods=0 (or matches documented waiver).

## Acceptance Criteria
- [ ] AC1 — Sprint 1 task-1 + task-1.1 migrated via T128.1; views generated; symlink tree resolves; PO/Tron approves the exemplar
- [ ] AC2 — Sprints 2-9 migrated via T128.2 (artifact mode); their indexed units exist in `scenario/index/`; legacy markdown preserved under `.legacy/`
- [ ] AC3 — Sprints 10-16 migrated via T128.3 (regenerated views); their `planning.md` + per-task files are now generated views (no hand-edited prose)
- [ ] AC4 — `[impl:uuid:]` markers added per T128.4; trace-cli reports `orphanMethods=0` (or matches documented waiver)
- [ ] AC5 — `npm run trace:check` clean against the migrated graph
- [ ] AC6 — `sprint audit` (Web4Articles compliance) passes 0-issue across all migrated sprints
- [ ] AC7 — `npm run build` succeeds; full vitest + playwright pass; rule-pair #15 + #16 verified

## Drive Plan (planner-coordinated)
1. T128.1 exemplar BEFORE the batch passes — Tron sign-off on the structure before scaling.
2. T128.2 closed sprints (low risk — artifact mode).
3. T128.3 active sprints (review each `planning.md` regeneration vs current).
4. T128.4 method markers (parallel-OK once T128.1 is signed off).
5. Each sub-task is its own commit; planner maintains symbols on every cycle.

## Dependencies
- **Requires:** T125 (foundation), T126 (views), T127 (nav), and T121 clean uuid base (already done)
- **Enables:** T129 verification

## Definition of Done
- [ ] All AC met; sub-tasks T128.1-T128.4 committed
- [ ] Every migrated sprint passes sprint audit + trace:check
- [ ] Legacy markdown preserved under `.legacy/` (closed sprints) or replaced by generated views (active sprints)
- [ ] Tron QA approved (per-batch gates; final approval after T129)

## QA Audit & User Feedback
- 2026-05-30: Planned — exemplar first (T128.1, Tron sign-off), then closed batch, then active batch, then method markers. PO/Tron gate per batch.

## Subtasks
T128.1, T128.2, T128.3, T128.4 — created by planner+req+expert during execution.

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 5*
*Owners: robbin-planner (structure), robbin-req (req units), robbin-expert (tooling), robbin-tester (verify)*
*Priority: 5 (migration — the volume of work; gates the sprint close)*
