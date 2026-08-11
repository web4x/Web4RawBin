<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.4.2: CONTROLLER single transition entry (statusNext) — guard + evidence-precondition + tick-checklist + DERIVE + persist + emit

[task:uuid:fe6b4379-f116-4bf5-8b81-dd7d41d1bdba]

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

Planned - C4.2 CONTROLLER statusNext single entry (subtask of T-C4 79fd2164; the PREVENTION half that stops the C2/C6 recurrence). Rides existing task-fsm.ts FSM. Chain at req-mint (architect confirms before expert wires). useCases[] pending architect design-step. Gate = break-path RED + evidence-precondition-refuses bite. Verify Impl.tests[] on disk before any flip. 0 Done; no unevidenced ticks.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Parent [Task 37.4](./task-37.4-objects-self-heal.md) `[task:uuid:79fd2164-3f1a-4a60-b91f-87fbaa5f8a2d]`
    - Requirement R37.4 `[requirement:uuid:c8615e9f-df2e-4ebf-b916-cbdd346ad1a1]`
  - down
    - None (leaf subtask)

## Task Description

C4.2 (subtask of T-C4, MVC decomposition; architect shape 34ae87486). The CONTROLLER (task-fsm.ts) exists — 7 states + TRANSITIONS + guards — but is unwired: six separate start* calls, no single advance, not wired to persistence. C4.2 = ONE advance entry point statusNext that moves a task to the next LEGAL state via the existing TRANSITIONS table, TICKS the checklist and lets deriveStatusEnum produce the status (NEVER hand-sets the enum), PERSISTS via the ScenarioIndex.put path, and REFUSES to advance past a step whose evidence is absent (evidence-precondition — a box ticked without evidence corrupts the exact signal Tron steers QA by). This is the PREVENTION half (records progress at the moment it happens); the checklist-chain-audit detector is the AUDIT backstop (C4.7). Ride the existing FSM, do NOT rebuild it. Family: under-recorded-progress / silent-drift.

## Acceptance Criteria

- [ ] (functional) A SINGLE advance entry point (statusNext) moves a task to the next LEGAL state via the existing TRANSITIONS table — NOT six separate start* calls. Rides task-fsm.ts (guardTransition), does not rebuild it.
- [ ] (functional) statusNext TICKS the CHECKLIST and lets deriveStatusEnum produce the status — it NEVER hand-sets the status enum (status stays DERIVED, R37.5).
- [ ] (functional) statusNext PERSISTS the scenario unit via the ScenarioIndex.put path (a legitimate committed-class writer; coordinate with the class-guard work).
- [ ] (functional) EVIDENCE-PRECONDITION: statusNext REFUSES to advance past a step whose evidence is absent (chain has not reached that step) — a box ticked without evidence corrupts Tron's QA signal.
- [ ] (gate) STUB-MUST-FAIL: break the advance/derive/persist path -> gate RED. + EVIDENCE-PRECONDITION BITE: attempt to advance a step with absent evidence -> MUST refuse (RED if it advances). FAMILY: under-recorded-progress / silent-drift.

## Subtasks

None (leaf subtask).
