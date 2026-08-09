<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task C4: Objects self-heal (validate on init/read, never run silently drifted) [R-C4]

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

Planned - cluster R-C4 (objects self-heal, validate on init/read), build LAST. Chain at build-go. Gate = Test EXERCISES drifted object -> recompute-to-reality OR refuse/throw, never silent-wrong (CI/tooling, not @390). Verify Impl.tests[] on disk before flip.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R-C4 `[requirement:uuid:c8615e9f-df2e-4ebf-b916-cbdd346ad1a1]`
  - down
    - None (atomic task)

## Task Description

R-C4 (build LAST). The pin and board objects VALIDATE on init/read: they reflect reality (recompute from files) or REFUSE to run drifted — they never return a silently-drifted value. Consistency is a property of the objects, not of anyone's vigilance.

## Acceptance Criteria

- [ ] (functional) The pin/board objects VALIDATE on init/read -> either recompute to reflect reality, or REFUSE to run when drifted.
- [ ] (functional) The objects NEVER return a silently-drifted value - always fail-loud or self-correct on read.
- [ ] (gate) TEST EXERCISES AC-validate-on-init+AC-never-silent: construct a drifted pin/board object -> it recomputes to reality OR throws/refuses (never returns silently-wrong). Verify Impl.tests[] on disk before flip.

## Subtasks

None (atomic task).
