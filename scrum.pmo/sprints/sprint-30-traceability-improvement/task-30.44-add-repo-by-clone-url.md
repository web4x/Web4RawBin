<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.44: Add a repository by clone URL + checkout location

[task:uuid:06623fea-ad42-4635-8b7e-bef5f216462f]

## Status
- [x] Planned
- [x] In Progress
  - [~] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement `[requirement:uuid:3c9f69c1-8bee-4309-9e30-df61cea34de3]`
  - shared-enabler
    - Dynamic RepoRegistry (mutable/persisted) — supersedes R30.40 static ROOTS; shared across R30.42-45
  - hard-gate
    - Tron ratifies DESIGN + SECURITY before ANY build
  - down
    - [UC](./planning.md) `[uc:uuid:eb0902d5-b5f8-4c45-b27a-c89287e89a64]`

## Task Description

The add dialog accepts a GIT CLONE URL + a CHECKOUT LOCATION (server path); clones there, registers into the dynamic registry, surfaces clone progress/failure (success→usable; failure→clear error, no half-registered repo). ⚠ SECURITY: arbitrary clone URL + write location is the attack surface.

## Context

Covers R30.44 (3c9f69c1) -> UC eb0902d5 -> Class RbDiffEditor 18165081 + RepoRegistry + server /api. Dynamic-registry SHARED enabler (RepoRegistry mutable/persisted — supersedes R30.40's static ROOTS mechanism; tracked under R30.42-45, not a separate observable). ★ HARD GATE: Tron ratifies the architect DESIGN + SECURITY decisions BEFORE any build — task stays DESIGN-stage (refinement), NO implementation until ratified. ⚠ SECURITY-sensitive (server-local-path + clone-url = path-traversal / arbitrary-clone attack surface — PO taking security decisions to Tron).

## Intention

S30 diff/merge editor — R30.42-45 repo add/manage feature (Tron): register/manage repos dynamically (add by path, add by clone, manage worktrees) instead of a static ROOTS list.

## Acceptance Criteria

- [ ] (add) The dialog accepts a GIT CLONE URL and a CHECKOUT LOCATION (server path); it clones the repo to that location.
- [ ] (add) After a successful clone, the repo is registered in the dynamic registry and APPEARS in the selector.
- [ ] (add) Clone progress/failure is surfaced (success -> repo usable; failure -> clear error, nothing half-registered).
- [ ] (security) [PENDING Tron ratify] The clone CHECKOUT LOCATION is BOUNDED to ratified allowed roots (no arbitrary server write path); a location outside bounds is rejected before cloning.
- [ ] (security) [PENDING Tron ratify] The clone URL / protocol is constrained per Tron ratify (e.g. allowed schemes/hosts, credential handling) - no SSRF / arbitrary-command surface.
- [ ] (security) [PENDING Tron ratify] Cloning is gated by the ratified authorization model.
- [ ] (security) [PENDING Tron ratify] The cloned repo registers per the ratified persistence mechanism; a failed clone leaves NOTHING half-registered.
- [ ] (gate) GATE (DET-3x + Tron visual): clone a URL to a location -> repo appears + opens a diff; client-facing -> version-bump.

## Implementation

IN PROGRESS @ DESIGN STAGE (architect decomposing; PO bringing DESIGN + SECURITY decisions to Tron for RATIFY). ★ HARD GATE: NO build until Tron ratifies. Dynamic-registry SHARED enabler (RepoRegistry mutable/persisted — supersedes R30.40's static ROOTS mechanism; tracked under R30.42-45, not a separate observable). ★ HARD GATE: Tron ratifies the architect DESIGN + SECURITY decisions BEFORE any build — task stays DESIGN-stage (refinement), NO implementation until ratified. ⚠ SECURITY-sensitive (server-local-path + clone-url = path-traversal / arbitrary-clone attack surface — PO taking security decisions to Tron). -> Tron ratify -> expert build -> deploy -> QA-Review -> gate + chain-to-Test + served==gated -> Tron visual -> Done.

## Subtasks

None (atomic task, design-stage).
