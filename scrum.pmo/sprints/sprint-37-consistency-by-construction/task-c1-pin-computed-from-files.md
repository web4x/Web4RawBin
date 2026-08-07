<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task C1: Pin is COMPUTED from files (never hand-set) [R-C1]

[task:uuid:458b6b1c-b967-4c5f-8ff8-1e57e380159e]

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

Planned - cluster R-C1 (pin COMPUTED-from-files resolver), build 2nd (after R-C2). Chain at build-go. Gate = Test EXERCISES resolver -> pin==active-sprint deterministically + hand-set value overridden by recompute (CI/tooling, not @390). Verify Impl.tests[] on disk before flip.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R-C1 `[requirement:uuid:91486de1-0cdd-4d57-b07e-9a5ce945702a]`
  - down
    - None (atomic task)

## Task Description

R-C1 (build 2nd). The CurrentSprint pin is DERIVED by a resolver from the scenario units on disk (the sprint carrying the active in-progress work) - NO hand-editable stored value. 'Advance the pin' (skill-expert duty) becomes RUNNING the resolver, not editing a value. Fixes the measured 3-sprint stale pin (S33 while work is on S36).

## Acceptance Criteria

- [ ] (functional) A currentSprint resolver DERIVES the pin from the scenario units on disk (the sprint the active work is on); there is NO hand-editable stored pin value the resolver can disagree with.
- [ ] (functional) 'Advance the pin' (skill-expert duty) = RUNNING the resolver, NOT editing a value; a hand-set value is overridden by the recompute.
- [ ] (functional) The computed pin == the sprint carrying the active in-progress work on disk (today S36, not the stale S33) - no 34/35 skip.
- [ ] (gate) TEST EXERCISES AC-computed+AC-matches-files: arrange units so active work is on sprint N, run the resolver -> pin==N deterministically; plant a stale/hand-set pin -> the recompute overrides it to N. Verify Impl.tests[] on disk before flip.

## Subtasks

None (atomic task).
