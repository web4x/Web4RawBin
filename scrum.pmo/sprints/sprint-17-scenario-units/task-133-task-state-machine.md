<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T133: Task state-machine + status methods

[task:uuid:306f1ca2-0e9e-4071-a653-994262904463]

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

`[task:uuid:306f1ca2-0e9e-4071-a653-994262904463]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:bebee55d-7d39-4f0c-b7de-d56e72d01363]` —
    "The Task class needs a proper state machine + status methods (verbs) so
    state transitions are first-class operations on the scenario-unit Task
    instance rather than free-form checkbox edits." (Tron via PO 2026-05-31;
    req-eng to anchor the verbatim Tron quote in this slot.)
- down
  - None (atomic task)
- follows
  - [T125: Foundation (Task class)](./task-125-foundation.md) — T133 adds methods to the Task class
  - [T124.1: data model](./task-124.1-architect-data-model.md) — defines the unit/class structure this extends
- chain (req → usecase → puml → class/method)
  - **requirement:** r133 task state-machine + status methods (Tron 2026-05-31)
  - **use case:** task.plan, task.startRefinement, task.completeRefinement, task.startCreatingTestCases, task.startImplementing, task.completeImplementing, task.startTesting, task.completeTesting, task.submitForQA, task.tronApprove (architect refines the verb list during T133.1 below)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds the Task verbs as first-class UCs (T117 PUML machinery)
  - **class/method:** `src/ts/scenario/classes.ts` Task class → new verb methods + state-transition guards; corresponds to symbol legend (⏳📝🔧✅🧪🏁) progression

## Acceptance Criteria

- [ ] AC1 — Task class has a documented state machine with all transitions modeled (architect's diagram in this file)
- [ ] AC2 — Status methods (verbs) implemented per architect's design; each verb is a single callable that mutates state + persists via T125.3 index-store
- [ ] AC3 — Guards prevent invalid transitions (e.g. can't `startTesting()` from `Planned`); errors are clear
- [ ] AC4 — `task.tronApprove()` callable ONLY by Tron-authored explicit-approval commits — guard NOT bypassable by planner-sync (parallels learnings #15 QA-gate rule)
- [ ] AC5 — Each verb emits an event consumed by T126 ViewGenerator → views live-update on transition
- [ ] AC6 — Symbol legend (⏳📝🔧✅🧪🏁) is derived from `model.status` (single source of truth — planner no longer mirrors manually)
- [ ] AC7 — vitest covers every transition + every guard rejection
- [ ] AC8 — `npm run build` succeeds; suite passes; rule-pair #15 + #16
- [ ] AC9 — Method markers added on every verb method per learning #18 + T128.4 retrofit — every verb traces back to req:r133 and task T133

## Dependencies

- **Requires:** T125 (Task class foundation)
- **Coordinate-with:** T132 (HTML status template renders the state machine's current state)
- **Enables:** T126 ViewGenerator can subscribe to state events; legends are computed not maintained; T134 traceability units can model Task transitions

## Definition of Done

- [ ] All AC met; state machine documented + tested
- [ ] Rule-pair (a)+(b) ✓, (c) appropriate per change scope
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-05-31: Tron via PO directed planning. CMM4 4-role engagement enforced. Awaiting req anchor + architect FSM design + verb naming.

## Subtasks

None (atomic task — single Task class extension; sub-tasks per verb optional if architect wants to split).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 2 follow-on*
*Owners (CMM4): robbin-req (requirement), robbin-architect (FSM design), robbin-expert (impl), robbin-tester (verify)*
*Priority: 6 (first-class state — replaces manual symbol mirroring)*
