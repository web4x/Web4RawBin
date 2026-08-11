<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.4: Objects self-heal (validate on init/read, never run silently drifted) [R37.4]

[task:uuid:79fd2164-3f1a-4a60-b91f-87fbaa5f8a2d]

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

Planned - cluster R37.4 (objects self-heal, validate on init/read), build LAST. Chain at build-go. Gate = Test EXERCISES drifted object -> recompute-to-reality OR refuse/throw, never silent-wrong (CI/tooling, not @390). Verify Impl.tests[] on disk before flip.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R37.4 `[requirement:uuid:c8615e9f-df2e-4ebf-b916-cbdd346ad1a1]`
  - down (subtasks — MVC/view-pipeline decomposition)
    - [Task 37.4.1: MODEL self-heal on read](./task-37.4.1-model-self-heal-on-read.md) `[task:uuid:236918e9-6369-450f-aec3-b741451be147]`
    - [Task 37.4.2: CONTROLLER statusNext single entry](./task-37.4.2-controller-statusnext.md) `[task:uuid:fe6b4379-f116-4bf5-8b81-dd7d41d1bdba]`
    - [Task 37.4.3: CONTROLLER single-source Done](./task-37.4.3-controller-single-source-done.md) `[task:uuid:1b8ebc9a-7b94-468c-a0a9-f40f648e4cad]`
    - (C4.4-C4.8 pending, created in later batches)

## Task Description

R37.4 (build LAST). The pin and board objects VALIDATE on init/read: they reflect reality (recompute from files) or REFUSE to run drifted — they never return a silently-drifted value. Consistency is a property of the objects, not of anyone's vigilance.

## Acceptance Criteria

- [ ] (functional) The pin/board objects VALIDATE on init/read -> either recompute to reflect reality, or REFUSE to run when drifted.
- [ ] (functional) The objects NEVER return a silently-drifted value - always fail-loud or self-correct on read.
- [ ] (gate) TEST EXERCISES AC-validate-on-init+AC-never-silent: construct a drifted pin/board object -> it recomputes to reality OR throws/refuses (never returns silently-wrong). Verify Impl.tests[] on disk before flip.

## Subtasks

T-C4 is the COORDINATION ROOT of an 8-part MVC / view-pipeline decomposition (Tron: 'faaaaar away from mvc and a view pipeline'; analysis-c4-task-statusnext.md 63fb728a8 + architect shape 34ae87486). BATCH 1 (MODEL + CONTROLLER, the prevention layer) stood up:
- [Task 37.4.1: MODEL self-heal on read](./task-37.4.1-model-self-heal-on-read.md) `[task:uuid:236918e9-6369-450f-aec3-b741451be147]`
- [Task 37.4.2: CONTROLLER statusNext single entry](./task-37.4.2-controller-statusnext.md) `[task:uuid:fe6b4379-f116-4bf5-8b81-dd7d41d1bdba]`
- [Task 37.4.3: CONTROLLER single-source Done](./task-37.4.3-controller-single-source-done.md) `[task:uuid:1b8ebc9a-7b94-468c-a0a9-f40f648e4cad]`

PENDING later batches: C4.4 view-pipeline (generated boards) · C4.5 view-pipeline (live client) · C4.6 notification/observer · C4.7 retain checklist-chain-audit · C4.8 MVC-boundary lint.
