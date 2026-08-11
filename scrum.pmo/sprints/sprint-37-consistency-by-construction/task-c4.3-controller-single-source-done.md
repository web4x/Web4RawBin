<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task C4.3: CONTROLLER single-source Done — statusNext OWNS the Done transition, R40.10 approve DELEGATES, tronApprove folds in (no second writer)

[task:uuid:1b8ebc9a-7b94-468c-a0a9-f40f648e4cad]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned - C4.3 CONTROLLER single-source Done (subtask of T-C4 79fd2164; kills the two-writer Done risk C4 exposed). Pairs with R40.10 (approve-control) — that req's Done-write DELEGATES here. Chain at req-mint (architect confirms before expert wires). useCases[] pending architect design-step. Gate = second-Done-writer -> lint RED. Verify Impl.tests[] on disk before any flip. 0 Done; no unevidenced ticks.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Parent [Task C4](./task-c4-objects-self-heal.md) `[task:uuid:79fd2164-3f1a-4a60-b91f-87fbaa5f8a2d]`
    - Requirement R-C4 `[requirement:uuid:c8615e9f-df2e-4ebf-b916-cbdd346ad1a1]`
  - down
    - None (leaf subtask)

## Task Description

C4.3 (subtask of T-C4, MVC decomposition; architect shape 34ae87486). RISK C4 exposed: TWO writers for one transition — the FSM tronApprove AND R40.10's approve endpoint (approvedBy/approvedAt) can both set Done = the two-sources disease (two sources for one fact). C4.3 DECLARES which mechanism OWNS the Done transition and makes the other DELEGATE, never duplicate. Architect shape: statusNext OWNS Done, R40.10 approve DELEGATES to it, tronApprove folds in. A lint/bite prevents a second Done-writer from ever reappearing (by construction, not by vigilance). Family: under-recorded-progress / silent-drift (two-sources variant — the same class as the pin/board double-source).

## Acceptance Criteria

- [ ] (functional) The req/impl DECLARES which mechanism OWNS the Done transition: per architect shape statusNext OWNS Done, R40.10 approve DELEGATES to it, the FSM tronApprove FOLDS IN — exactly ONE writer of the Done transition.
- [ ] (functional) R40.10 approve (approvedBy/approvedAt) does NOT set Done independently — it delegates to the owner; the approve DATA (approvedBy/approvedAt) is still recorded as the Tron verdict, but the transition goes through the single owner.
- [ ] (functional) A LINT/bite prevents a SECOND independent Done-writer from reappearing (two-sources-one-fact killed by construction).
- [ ] (gate) STUB-MUST-FAIL: introduce a second independent Done-writer (or make R40.10 set Done directly) -> the lint/gate goes RED. FAMILY: under-recorded-progress / silent-drift (two-sources variant).

## Subtasks

None (leaf subtask).
