<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.49: All Tasks owned by the owner profile — scope

[task:uuid:ca03557b-53bd-40d9-8361-23191e22f6b6]

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

Deliver + verify requirement R40.49 (All Tasks owned by the owner profile — scope). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.49; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(intent)** Every ior:class:Task has ownerIor = the owner profile 05e58f81 (Marcel Donges), so the Set-as-Current owner-gate passes for the owner (T40.1's 403-while-null is resolved).
- [ ] **(by-construction/trap)** The backfill modifies ownerIor on ior:class:Task units ONLY. NO non-Task unit's ownerIor is modified — Impl->Method, ChangeRequest->Test, Requirement->Sprint etc. are STRUCTURAL parents, left untouched.
- [ ] **(stub-must-fail)** A seeded NON-Task unit whose ownerIor would change under the backfill => RED. (Without this, a correct-looking backfill silently destroys the traceability graph.)
- [ ] **(by-construction/measured-trap)** RELOCATION (Case B = 220 tasks) applies ONLY to old-schema tasks the Sprint RECIPROCATES (lists in Sprint.tasks[]): copy the Sprint from ownerIor into model.parent FIRST, then set ownerIor=owner-profile — the Sprint acknowledges them, so the parent is real. Post-backfill these keep ownerIor=owner-profile AND parent=their Sprint AND remain in Sprint.tasks[].
- [ ] **(stub-must-fail)** A reciprocated Task (Case B) that loses its Sprint linkage after the backfill (parent unset AND absent from Sprint.tasks[]) => RED.
- [ ] **(migration)** Gated dry-run + before/after counts (525 Tasks: 195 null->owned, 330 Sprint-in-ownerIor->parent-relocated-then-owned), reversible, ambiguous->flag; the owner profile uuid is not leaked into logs beyond the unit field.
- [ ] **(source)** The owner value is the owner profile UNIT (05e58f81), resolved SINGLE-SOURCE (profileUuidOf(owner) / the owner profile), not a literal scattered across call sites — the owner-gate reads the same source it is backfilled from.
- [ ] **(by-construction/never-fabricate)** The 99 Case-D ORPHANS (old-schema, NO sprint reciprocates) get owner set + the stale ownerIor DROPPED, and are NOT relocated. Relocating a stale pointer into model.parent would FABRICATE a parent the named Sprint denies = 99 new drift. They were already unsorted, so nothing visible regresses; re-homing is R40.51. stub-must-fail: a migration that sets model.parent on an orphan to a Sprint whose tasks[] does not list it => RED. Architect-confirmed post-apply invariant (quote, fd8c968af): for the 99 D-orphans, model.parent stays ABSENT AND ownerIor==05e58f81 (owner set, stale ownerIor->Sprint DROPPED, NO model.parent written; they remain honestly unsorted).
- [ ] **(gating)** --apply stays GATED until the expert dry-run ADDS the reciprocation check and REPRODUCES A=206/B=220/D=99/C=0/anomaly=0 exactly, then the architect clears it. Not "unblocked" on the split alone.

## Subtasks
