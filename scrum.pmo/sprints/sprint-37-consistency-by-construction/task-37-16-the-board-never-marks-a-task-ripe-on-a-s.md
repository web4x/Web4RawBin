<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.16: The board never marks a task RIPE on a S

[task:uuid:9fdd8302-dadd-4f97-8a66-33e433c7c50e]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R37.16 (The board never marks a task RIPE on a S). Retroactive task unit minted scenario-first from the existing CURRENT-sprint requirement (#126 gap: active S37 work untracked). Covers R37.16; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(functional)** The scoreboard NEVER marks a task RIPE (flip-ready) using a SIBLING task's Test: a task whose coveredRequirement is shared by sibling tasks is NOT auto-RIPE from the requirement's aggregate green.
- [ ] **(functional)** Such a task is downgraded to a distinct RIPE-SHARED state = requires manual verify-owner-first (confirm the task's OWN facet is evidenced); it can NEVER auto-flip on a sibling's passing Test.
- [ ] **(functional)** The signal is STRUCTURAL (coveredRequirement shared by >1 task), NOT Impl-ownership — measured-impossible: the shared Impl (e.g. b5f72641) has no sharedByTasks field, so Impl-ownership cannot be the key. Derive shared-ness from the tasks' coveredRequirements, not the Impl.
- [ ] **(gate)** STUB-MUST-FAIL bite (else the guard certifies nothing): construct a sibling with a passing Test on the shared requirement -> assert the OTHER sibling is NOT marked RIPE (it is RIPE-SHARED); a guard that would auto-RIPE it -> RED. Proves a sibling's passing Test does NOT mark the task ripe.
- [ ] **(functional)** A shared-requirement task reaches TRUE RIPE only when its OWN distinct-intent Test/facet passes (verify-owner-first), never the requirement's aggregate coverage — matches the shared-Impl-two-distinct-Tests anti-double-credit pattern (T40.5 discipline) applied to the board.

## Subtasks
