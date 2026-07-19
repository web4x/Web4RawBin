<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.49: Delete a dynamic repo from the manage panel (builtins never removable)

[task:uuid:7887c199-9c48-4845-ba70-74d4259a7312]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [ ] implementing (BLOCKED-ON-BUILD — delete-UI wiring, expert builds with UC7 on final-matrix green-light)
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement `[requirement:uuid:37b58836-2e9c-4de3-ac53-6e3289b48203]`
  - reuse
    - RepoRegistry.unregister spine (Impl 559b508b ↔ Test 6f6edecd) — the delete mechanism is already Tested; build wires the UI onto it
  - down
    - [UC](./planning.md) `[uc:uuid:e496716b-d3bc-4274-82be-1082c361f70a]`

## Task Description

The manage panel lets a user DELETE a dynamic (user-added) repo — after delete it is gone from the selector + the dynamic registry (via RepoRegistry.unregister). BUILTIN repos (rawbin, oosh) are NEVER removable: the delete affordance is absent/disabled and unregister refuses them. V1 delete is read-auth only (no admin-key; D4 requireAdmin stays deferred to R30.48). The pending BUILD is the delete-UI wiring onto the already-proven unregister spine.

## Context

Covers R30.49 (37b58836) → UC e496716b → RepoRegistry.unregister spine. ★ CHAIN complete-to-Test BY REUSE: the mechanism is RepoRegistry.unregister (Impl 559b508b) already Tested by 6f6edecd (r3047 gate: A.unregister-dynamic + A.unregister-builtin-false). The pending BUILD = wiring the delete-UI → unregister (blocked-on-build, expert builds WITH UC7 on architect's final-matrix green-light). D4 admin-auth deferred → R30.48/BH-3.

## Intention

S30 diff/merge editor — R30.49 delete-for-removable (Tron-approved, V1 push): the manage panel can remove a user-added repo, builtins protected.

## Acceptance Criteria

- [ ] (delete) A DYNAMIC (user-added) repo can be deleted from the manage panel via RepoRegistry.unregister — after delete it is gone from the selector + registry. (mechanism Tested 6f6edecd; UI wiring pending build.)
- [ ] (protect) A BUILTIN repo (rawbin, oosh) is NEVER removable — the delete affordance is absent/disabled + unregister refuses builtins (A.unregister-builtin-false).
- [ ] (V1-auth) V1 delete uses read-auth only (no admin-key); D4 requireAdmin stays deferred (R30.48 backlog) until multi-user.
- [ ] (gate) GATE: add a dynamic repo → delete it from the manage panel → gone from selector + registry; attempt to delete a builtin → refused. (Pending build.)

## Implementation

IN PROGRESS @ BLOCKED-ON-BUILD (Tron-approved, V1 push — NOT backlog). Chain complete-to-Test BY REUSE (unregister Impl 559b508b ↔ Test 6f6edecd, r3047 gate GREEN). Pending = delete-UI → unregister wiring (expert builds WITH T30.45/UC7 on architect final-matrix green-light, imminent). D4 admin-auth deferred R30.48.

## Subtasks

None (atomic task).
