<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.53: ONE canonical sprint-dir resolver (sprintDir

[task:uuid:6134f49c-9317-4392-815f-9f1cdd1b4be7]

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

Deliver + verify requirement R40.53 (ONE canonical sprint-dir resolver (sprintDir). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.53; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(by-construction)** ONE exported sprintDirOf(sprintUnit) -> sprint-0N-<slug> (zero-padded number + slug, derived from sprintNumOf), living next to sprintNumOf/bySprintDisplayOrder in the sprint-pin-resolver/sprint-label home. It is the SINGLE source for which directory is this sprint.
- [ ] **(by-construction)** EVERY consumer routes through sprintDirOf: the MD generator(s), server.ts:1416 taskMdHref, AND - critically - check-sprint-slug-dir.ts (the GUARD must verify the CANONICAL sprint-0N-<slug>/ exists, not the slug-only path). Today the guard resolves the slug-only path = it BLESSES the disease; routing it through sprintDirOf fixes the complicit guard.
- [ ] **(by-construction)** No consumer builds sprints/<model.slug>/ anymore -> slug-only emission STOPS. The canonical dir is the ONLY dir any consumer produces.
- [ ] **(stub-must-fail/invariant)** A consumer that builds a sprint dir path WITHOUT sprintDirOf (e.g. raw sprints/${model.slug}) => grep-lint RED. Invariant-gate (assert the shared resolver is used), NOT a value-gate (do not merely check one path renders right) - the same lesson as R40.50 AC-invariant-gate.
- [ ] **(migration)** Nobody commits the 16 stray sprints/<slug>/ dirs (they are the duplicate). Once sprintDirOf lands + regen re-emits to the canonical dir, the strays are deleted in their OWN commit. (Architect/expert owns the generator fix + the deletion; this req captures the invariant.)

## Subtasks
