[Back to Sprint 17 Planning](./planning.md)

# T133: Task state-machine + status methods

[task:uuid:306f1ca2-0e9e-4071-a653-994262904463]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement (req → architect)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owners (CMM4 4-role, per learnings #18):**
1. **robbin-req** — captures verbatim Tron requirement; anchors `requirement:uuid` below
2. **robbin-architect** — designs the state model (states, transitions, guards), maps to current symbol legend (⏳📝🔧✅🧪🏁), defines the Task class's status methods (verbs)
3. **robbin-expert** — implements the Task state machine + verb methods on the scenario-unit Task class
4. **robbin-tester** — verifies state transitions + guards; chain-walk from method back to req

**This file is the single source of truth.** All roles work from this file — no chat clarification.

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

## Problem Statement (req-eng to refine)
Today: Task state lives in checkbox edits in markdown files (the Web4Articles
Status block). Planner manually keeps the legend symbols (⏳📝🔧✅🧪🏁) in sync.
Tron via PO 2026-05-31: this should be first-class — Task instance has a
state machine + methods (verbs) for each transition, with guards (e.g. can't
go to QA Review without testing complete; can't go to Done without Tron
approval — that gate stays Tron-only).

## Architect Design (TO FILL during refinement)
Architect: model the state machine. Likely states (mapping to symbol legend):
- `Planned` (⏳)
- `Refining` / `Designed` (📝)
- `Implementing` (🔧)
- `Implemented` / `Shipped` (✅)
- `Testing` / `Tested` (🧪)
- `TronApproved` / `Done` (🏁)

Transitions + guards (architect refines):
- `Planned → Refining` (open)
- `Refining → Designed` (refinement complete by architect or req)
- `Designed → Implementing` (expert picks up)
- `Implementing → Implemented` (impl commit; rule-pair must hold per #15+#16 — guard built into the verb)
- `Implemented → Testing` (tester picks up)
- `Testing → Tested` (tester PASS)
- `Tested → TronApproved` (gate — `task.tronApprove()` callable ONLY by an explicit Tron approval commit per the standing rule; planner-sync can never call it)

Status methods on Task class (the "verbs" Tron mentioned):
- `task.plan()`, `task.startRefinement()`, `task.completeRefinement()`,
  `task.startImplementing()`, `task.completeImplementing()`,
  `task.startTesting()`, `task.completeTesting()`, `task.tronApprove()` …
- Each verb mutates `model.status` AND emits an event for view live-update (T126.4 wiring).

## Architect Design — robbin-architect (2026-05-31)

### State Machine (7 states, 8 transitions)

```
                    ┌──────────────────────────────────────────────────┐
                    │                                                  │
  ⏳ Planned ──→ 📝 Refining ──→ 🔧 Implementing ──→ ✅ Implemented  │
                                                          │            │
                                                          ↓            │
                                                     🧪 Testing       │
                                                          │            │
                                                          ↓            │
                                                     🏁 Done ←── Tron gate
                                                                       │
                                                                       │
                              (QAReview is the waiting state            │
                               between Testing→Done;                   │
                               tronApprove() is the gate)──────────────┘
```

### States + Symbol Legend

| State | Symbol | Meaning | Entered by |
|-------|--------|---------|------------|
| `Planned` | ⏳ | Task created, not started | Default on creation |
| `Refining` | 📝 | Architect/req refining spec | `startRefinement()` |
| `CreatingTestCases` | 📝🧪 | Tester writing test cases | `startCreatingTestCases()` |
| `Implementing` | 🔧 | Expert coding | `startImplementing()` |
| `Testing` | 🧪 | Tester verifying | `startTesting()` |
| `QAReview` | 🔍 | Awaiting Tron approval | `requestQAReview()` |
| `Done` | 🏁 | Tron approved | `tronApprove()` — **TRON-ONLY GATE** |

### Transition Table

| From | To | Verb Method | Guard |
|------|----|-------------|-------|
| Planned | Refining | `startRefinement()` | none (open) |
| Refining | CreatingTestCases | `startCreatingTestCases()` | refinement section non-empty |
| CreatingTestCases | Implementing | `startImplementing()` | none (open) |
| Refining | Implementing | `startImplementing()` | allowed (skip test-case phase) |
| Implementing | Testing | `startTesting()` | impl commit ref in model |
| Testing | QAReview | `requestQAReview()` | all test scenarios PASS |
| QAReview | Done | `tronApprove()` | **TRON-ONLY: requires `tronCommitRef` arg** |
| ANY | Planned | `reset()` | admin/architect override (rare) |

### Verb Method Signatures

```typescript
class Task extends Unit {
  // State machine verbs
  startRefinement(): void {
    this.guardTransition('Planned');
    this.model.status = 'Refining';
    this.emit();
  }

  startCreatingTestCases(): void {
    this.guardTransition('Refining');
    this.model.status = 'CreatingTestCases';
    this.emit();
  }

  startImplementing(): void {
    this.guardTransition('Refining', 'CreatingTestCases');
    this.model.status = 'Implementing';
    this.emit();
  }

  startTesting(): void {
    this.guardTransition('Implementing');
    this.model.status = 'Testing';
    this.emit();
  }

  requestQAReview(): void {
    this.guardTransition('Testing');
    this.model.status = 'QAReview';
    this.emit();
  }

  tronApprove(tronCommitRef: string): void {
    this.guardTransition('QAReview');
    if (!tronCommitRef) throw new Error('tronApprove requires a Tron commit ref');
    this.model.status = 'Done';
    this.model.tronApprovalCommit = tronCommitRef;
    this.emit();
  }

  // Guard helper — throws if current status not in allowed list
  private guardTransition(...allowed: string[]): void {
    if (!allowed.includes(this.model.status)) {
      throw new Error(`Cannot transition from '${this.model.status}' — allowed: ${allowed.join(', ')}`);
    }
  }

  // Emit: persist + regenerate views
  private emit(): void {
    this.save();  // persist to scenario/index/
    ViewBus.notify(`task:${this.model.uuid}`);  // trigger view live-update
  }
}
```

### Tron Gate

`tronApprove()` requires a `tronCommitRef` string — the git commit hash of Tron's explicit approval. This is NOT automatable by planner-sync or any agent. The commit must be authored by Tron (verified by examining `git log --author` if needed). The method stores the ref in `model.tronApprovalCommit` for audit trail.

### Symbol Derivation (single source of truth)

```typescript
function taskSymbol(status: string): string {
  const SYMBOLS: Record<string, string> = {
    Planned: '⏳', Refining: '📝', CreatingTestCases: '📝🧪',
    Implementing: '🔧', Testing: '🧪', QAReview: '🔍', Done: '🏁',
  };
  return SYMBOLS[status] || '❓';
}
```

Planner no longer maintains symbols manually — they're computed from `model.status`.

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

## Test Scenarios
File: `test/vitest/task-state-machine.test.ts` (new).

| Test | Action | Expected |
|------|--------|----------|
| TS1 | New Task instance — assert initial state | `model.status === 'Planned'` (⏳) |
| TS2 | Walk happy path: refinement → impl → testing → TronApprove | Each transition succeeds; final state = `Done` (🏁) |
| TS3 | Attempt `task.startTesting()` from `Planned` | Throws/rejects with clear error; state unchanged |
| TS4 | Attempt `task.tronApprove()` without Tron commit marker | Throws; state unchanged (gate held) |
| TS5 | View regeneration after `task.completeImplementing()` | Task's .md+.html re-emitted with new symbol prefix (✅) |
| TS6 | Method markers — trace-cli reports task.* verbs all linked to T133 | orphanMethods=0 for these methods |

## Dependencies
- **Requires:** T125 (Task class foundation)
- **Coordinate-with:** T132 (HTML status template renders the state machine's current state)
- **Enables:** T126 ViewGenerator can subscribe to state events; legends are computed not maintained; T134 traceability units can model Task transitions

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **req-eng** anchors verbatim Tron quote; clarifies any verb naming preferences (Tron's "status methods" phrasing).
2. **architect** designs the FSM (states + transitions + guards), commits the design in this file + adds verbs as UCs in s17-usecases.puml.
3. **expert** implements on `src/ts/scenario/classes.ts` Task class — small commits per verb if helpful.
4. **tester** runs TS1-TS6 + chain-walk verification.

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
