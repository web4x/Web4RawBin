<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.4.2: CONTROLLER — one generic unitController.apply for ANY unit mutation (validate-via-registered-policy → apply → persist → emit); Task FSM = policy #1, statusNext = thin facade

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
    - Requirement R37.11 `[requirement:uuid:cfe02f4b-f07d-41ec-8aca-c462c22306f9]`
  - down
    - None (leaf subtask)

## Task Description

C4.2 (subtask of T-C4/T37.4, MVC/view-pipeline shape; RE-ISSUED generic DRY, architect 55a5e2897). SUPERSEDES the task-shaped statusNext-only framing (now merely POLICY #1). In an all-classes-are-scenario-units world a Task-specific statusNext multiplies into N controllers = the same disease at scale — so the mechanism is GENERIC and Task is the first plug-in. ONE controller entry unitController.apply(idx, ior, uuid, intent, {actor, evidenceRef?}) is the SOLE mutation entry for ANY unit (any ior:class:*): (1) VALIDATE via the REGISTERED policy for that ior (registerPolicy(ior, policy); default-accept if none); (2) APPLY the policy mutation; (3) PERSIST via ScenarioIndex.put with the deliberate-opt flag = THE committed-class opt-in site (the guard opt-in list names unitController.apply, SUBSUMING statusNext's); (4) EMIT UNIT_CHANGED{ior,uuid,revision}. Task FSM = POLICY #1 (task-fsm.ts guardTransition + the SHARED evidenceForStep predicate; apply = tick-checklist so deriveStatusEnum derives the status, NEVER hand-set). statusNext = a THIN Task facade over apply, NOT a second entry. Ride existing seams (task-fsm.ts, ScenarioIndex.put), NO fork. Family: under-recorded-progress / silent-drift.

## Acceptance Criteria

- [ ] (functional) ONE controller entry unitController.apply(idx, ior, uuid, intent) is the SOLE mutation entry for ANY unit (any ior:class:*): validate via the REGISTERED policy for that ior -> apply -> persist -> emit. NOT a Task-specific statusNext; policies REGISTER via registerPolicy(ior, policy) (default-accept if none).
- [ ] (functional) Task FSM = POLICY #1 (guardTransition + the SHARED evidenceForStep predicate); apply TICKS the checklist and lets deriveStatusEnum produce the status — NEVER hand-sets the enum (status stays DERIVED, R37.5). statusNext = a THIN Task facade over apply, NOT a second entry.
- [ ] (functional) apply PERSISTS via ScenarioIndex.put with the deliberate-opt flag = THE committed-class opt-in site (the guard opt-in list names unitController.apply, subsuming statusNext's). EVIDENCE-PRECONDITION via the SHARED evidenceForStep predicate (single-source with checklist-chain-audit, hardening C): REFUSE to advance past a step whose evidence is absent — a box ticked without evidence corrupts the signal Tron steers QA by.
- [ ] (DRY-AC / gate) STUB-MUST-FAIL: adding a NEW class policy = REGISTRATION ONLY — register a throwaway policy in the test, assert it works AND the diff touches ONLY the registry; a controller/bus/pipeline edit for policy N+1 -> RED. + break the validate->apply->persist->emit path -> RED. FAMILY: under-recorded-progress / silent-drift.

## Subtasks

None (leaf subtask).
