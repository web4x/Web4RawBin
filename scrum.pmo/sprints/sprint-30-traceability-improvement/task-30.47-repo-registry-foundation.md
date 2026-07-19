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
  - [x] testing
- [x] QA Review
- [x] Done

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

- [x] (mechanism) Runtime register/unregister (not a compile-time allowlist) — Tested (register c8529e2a + unregister 6f6edecd via module-import builtin-refused), r3047 re-gate GREEN v0.7.71.
- [x] (mechanism) Persists + reloads on startup (persist/load) so repos survive restart — Tested (persist 09c60094 + load 91da80e8), re-gate GREEN.
- [x] (§10.1 mechanism/policy separation) Spine is PURE MECHANISM: register=pure store (no policy throw), load=keep-iff-.git-present (stale-drop by existence, NOT an allowlist), resolve=pure lookup (no TOCTOU). The D1 bounds policy (assertAllowedRoot) is a BACKLOG endpoint-guard (R30.48/BH-3), NOT in the registry mechanism — separation achieved.
- [x] (supersede) Supersedes R30.40 static ROOTS: oosh root lives in the dynamic registry, still resolving HOME/oosh by construction (symlink-follow preserved) — gated.
- [x] (gate) DET-3x GREEN at SERVED v0.7.71 (re-gate 1e6ffa99f, served==gated): register->appears+persists across restart (load); assertAllowedRoot choke-LOGIC rejects out-of-bounds (gate B; enforcement deferred to R30.48); version-bump.

## Implementation

✓ DONE (2026-07-19, architect co-sign + PO sign — internal foundation gate, correctly NOT Tron-visual): shipped repo-registry.ts verified vs §10.1 (dormant guards REAL + re-wire-commented, 8 name-matched impl markers chain-complete, builtins protected + server-derived keys, ZERO client add/delete exposure = no V1 attack surface, Tron-ratified trusted-local scope). Guards dormant-not-ripped = clean R30.48 re-entry, no false-credit. QA-REVIEW: R30.47 pure-mechanism spine. Chain-to-Test COMPLETE both-directions — register c8529e2a / persist 09c60094 / load 91da80e8 / unregister 6f6edecd (correct-by-construction off gate 8269634c0). ✓ SERVED==GATED RESOLVED: fresh-tester re-gated r3047 GREEN DET-3x at served v0.7.71 (1e6ffa99f, current-module re-import; §10.1 .git-stale-drop + D1-dormant captured). 5/5 ACs honest (D1 enforcement deferred to R30.48 per AC3, tracked BH-3). Internal-foundation gate (DET-3x, not Tron-visual) -> Done via architect+PO.

## Subtasks

None (atomic task).
