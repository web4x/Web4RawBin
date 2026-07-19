<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.47: RepoRegistry — dynamic, persisted, bounds-checked registry (repo add/manage foundation)

[task:uuid:97c00946-a4aa-4ae1-9b8b-3bfec89b7fbd]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [~] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement `[requirement:uuid:b87eb99a-c83e-4745-9948-a84a1bb3ea00]`
  - foundation
    - RepoRegistry underpins R30.42-45 add/manage; supersedes R30.40 static ROOTS (choke point D1)
  - down
    - [UC](./planning.md) `[uc:uuid:9b34f2fb-fc65-49c2-96ad-9b41853a68bc]`
    - [UC](./planning.md) `[uc:uuid:3b5ff9d1-747a-4c9f-a160-929e9ad77ef0]`
    - [UC](./planning.md) `[uc:uuid:b27eecb3-c758-4f30-9fe7-c7f2b5012d02]`
    - [UC](./planning.md) `[uc:uuid:2280431a-1e82-4271-8458-1c9401318558]`
    - [UC](./planning.md) `[uc:uuid:f3f052a5-16e3-46e6-98df-d07c9ac63786]`
    - [UC](./planning.md) `[uc:uuid:490aaaf7-69fb-4569-99cb-d8217aa89f63]`
    - [UC](./planning.md) `[uc:uuid:6ef3bee2-7f4c-4bf8-91cc-98b231e4d613]`

## Task Description

Replace the static ROOTS allowlist with a RepoRegistry that registers/unregisters repos at RUNTIME, PERSISTS them across restart (load/persist), and routes EVERY candidate root through the single assertAllowedRoot bounds choke point (D1). The oosh root moves into the dynamic registry while still resolving HOME/oosh by construction (R30.40 symlink-follow preserved). This is the architect's UC3 spine + UC8 guard foundation underpinning the R30.42-45 add/manage endpoints.

## Context

Covers R30.47 (b87eb99a) → UC3 spine + UC8 guards (7 UCs) → RepoRegistry + assertAllowedRoot choke (D1). Supersedes R30.40 static ROOTS. Built v0.7.67 (cfb8ba85c), 7 methods marked; awaiting tester gate. Architect design-repo-manager.md §9.

## Intention

S30 diff/merge editor — R30.47 RepoRegistry foundation: the dynamic/persisted/bounds-checked registry underneath the R30.42-45 repo add/manage feature.

## Acceptance Criteria

- [ ] (D1) The registry supports runtime register/unregister (not a fixed compile-time allowlist).
- [ ] (D1) The registry persists (persist) + reloads on startup (load) so registered repos survive a restart.
- [ ] (D1) Every candidate root routes through the assertAllowedRoot choke point (register + load) — bounds enforced at ONE wired place.
- [ ] (D1) Supersedes the R30.40 static ROOTS: the oosh root now lives in the dynamic registry, still resolving HOME/oosh by construction (symlink-follow preserved).
- [ ] (gate) GATE (DET-3x): register a root → appears + persists across restart (load); an out-of-bounds root is rejected at the choke; version-bump.

## Implementation

BUILT v0.7.67 (cfb8ba85c), 7 methods marked — implementing done, TESTING in flight. No tester DET-3x GREEN cited yet → stays In Progress (NOT QA-Review) until the gate lands. Foundation for R30.42-45 (whose observable endpoints remain Tron-ratify HARD-gated).

## Subtasks

None (atomic task).
