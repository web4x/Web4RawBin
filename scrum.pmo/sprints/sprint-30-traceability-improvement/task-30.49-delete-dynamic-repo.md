<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.49: Delete a dynamic repo from the manage panel (builtins never removable)

[task:uuid:7887c199-9c48-4845-ba70-74d4259a7312]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
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

- [x] (delete) A DYNAMIC (user-added) repo can be deleted from the manage panel via RepoRegistry.unregister — after delete it is gone from the selector + registry. Tested e4741c65 (r3049) + 6f6edecd (unregister spine).
- [x] (protect) A BUILTIN repo (rawbin, oosh) is NEVER removable — delete affordance absent/disabled + unregister refuses builtins (gate A.unregister-builtin-false + r3049).
- [x] (V1-auth) V1 delete uses read-auth only (no admin-key); D4 requireAdmin deferred (R30.48 backlog) until multi-user.
- [x] (gate) GATE GREEN DET-3x (r3049-delete-repo-gate.mjs, ebdf8b080 v0.7.72, served==gated): add dynamic -> delete from manage panel -> gone from selector+registry; delete builtin -> refused.

## Implementation

QA-REVIEW: delete-for-removable BUILT+GATED v0.7.72. Gate r3049 GREEN DET-3x (ebdf8b080), chain both-directions (delete->unregister 559b508b<->Test e4741c65 + reuse 6f6edecd), served==gated. D4 admin-auth deferred R30.48. 4/4 ACs. -> Tron visual/PO -> Done.

## Subtasks

None (atomic task).
