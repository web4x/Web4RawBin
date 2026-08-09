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

R-C1 (build 2nd). BOTH the CurrentSprint pin AND the current-TASK pointer ('📌 Current: Task N') are DERIVED by a resolver from the scenario units on disk (sprint = the sprint with active work; task = the active in-progress task) - NEITHER has a hand-editable stored value. 'Advance' becomes RUNNING the resolver. Fixes BOTH measured stale pointers: the 3-sprint-stale sprint-pin (S33 while work on S36) AND the ~5-sprint-stale task-pointer ('Task 31.1') - same drift class.

## Acceptance Criteria

- [ ] (functional) BOTH the CurrentSprint pin AND the current-task pointer ('📌 Current: Task N') are DERIVED by a resolver from the scenario units on disk; NEITHER has a hand-editable stored value the resolver can disagree with.
- [ ] (functional) The current-task pointer is COMPUTED from the task units' status on disk (the active in-progress task), NEVER hand-set - the ~5-sprint-stale 'Task 31.1' pointer is a hand-set drift of the SAME class as the stale sprint-pin, eliminated the same by-construction way.
- [ ] (functional) The three CurrentSprint slots are COMPUTED from unit/task state, NEVER hand-set: CURRENT = the sprint carrying IN-PROGRESS work (a sprint open ONLY on QA-pending items is NOT current - e.g. S36 today, open only for QA); LAST-COMPLETED = the highest fully-Done sprint; NEXT-BACKLOG = the next Planned sprint. The resolver decides 'is an open-for-QA sprint still current', never a human.
- [ ] (gate) TEST EXERCISES AC-three-slots: feed a fixture where S36 is open ONLY on QA-pending items AND S37 has in-progress work -> the resolver returns current=S37, last-completed=S35, next-backlog=S38-or-none. Deterministic from unit/task state; no hand-set slot. Verify Impl.tests[] on disk before flip.
- [ ] (functional) 'Advance the pin' (skill-expert duty) = RUNNING the resolver, NOT editing a value; a hand-set value is overridden by the recompute.
- [ ] (functional) The computed sprint-pin == the sprint carrying active work (today S36, not stale S33, no 34/35 skip) AND the computed task-pointer == the active in-progress task on disk (not the ~5-sprint-stale 'Task 31.1').
- [ ] (gate) TEST EXERCISES AC-computed+AC-task-pointer+AC-matches-files: arrange units so active work = sprint N / task T, run the resolver -> sprint-pin==N AND task-pointer==T deterministically; plant a stale hand-set sprint-pin OR task-pointer -> the recompute overrides BOTH. Verify Impl.tests[] on disk before flip.

## Subtasks

None (atomic task).
