<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.24: Selecting a diagram element changes the acti

[task:uuid:6ba813f4-5e48-4bf3-883c-c5918b34616c]

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

Deliver + verify requirement R40.24 (Selecting a diagram element changes the acti). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.24; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(selection-driven)** Selecting a diagram/model element CHANGES the action bar to include the element-context verbs: remove-from-diagram, delete, find-linked.
- [ ] **(anti-vacuity)** Those verbs are FIREABLE and ACT on the selected element (not merely rendered — a verb that appears but does nothing fails).
- [ ] **(no-reverse-regression)** The A1 defaults and the diagram-LEVEL verbs REMAIN present (no regression the other way).
- [ ] **(red-baseline-device-gate)** Pinned by a RED-baseline DEVICE gate @390 with STUB-MUST-FAIL, added to the device lane so it RE-RUNS (an ungated protection is a promise, not a guard — this behaviour worked and a refactor took it).
- [ ] **(family)** Implemented via the family-named selection-driven-action-provider (single source for selection->verbs), not a bespoke bar.

## Subtasks
