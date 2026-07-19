<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.43: Add a repository by server-local path

[task:uuid:baae0489-9777-49a0-b7a0-1a20e142678c]

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
    - Requirement `[requirement:uuid:96945512-3dbf-413d-ae26-734489ad8c0c]`
  - shared-enabler
    - Dynamic RepoRegistry (mutable/persisted) — supersedes R30.40 static ROOTS; shared across R30.42-45
  - ratified
    - Tron RATIFIED DESIGN + SECURITY (D1-D4 safe options + §9, 2026-07-19) — un-gated, build queued after R30.46
  - down
    - [UC](./planning.md) `[uc:uuid:759c5f32-59da-424e-ba7f-8189b2162007]`

## Task Description

The add dialog accepts a SERVER-LOCAL PATH (e.g. /root/oosh), server-side-validates it (exists + is a git checkout; invalid rejected), and registers that existing checkout into the dynamic registry → it appears in the selector, usable for diffs/merges. ⚠ SECURITY: path validation is the attack surface.

## Context

Covers R30.43 (96945512) -> UC 759c5f32 -> Class RbDiffEditor 18165081 + RepoRegistry + server /api. Dynamic-registry SHARED enabler (RepoRegistry mutable/persisted — supersedes R30.40's static ROOTS mechanism; tracked under R30.42-45, not a separate observable). ★ HARD GATE: Tron ratifies the architect DESIGN + SECURITY decisions BEFORE any build — task stays DESIGN-stage (refinement), NO implementation until ratified. ⚠ SECURITY-sensitive (server-local-path + clone-url = path-traversal / arbitrary-clone attack surface — PO taking security decisions to Tron). ⚠ V1 SIMPLIFIED to .git-present-only (architect §10); D2 path-traversal guard backlogged.

## Intention

S30 diff/merge editor — R30.42-45 repo add/manage feature (Tron): register/manage repos dynamically (add by path, add by clone, manage worktrees) instead of a static ROOTS list.

## Acceptance Criteria

- [ ] (add) The dialog accepts a SERVER-LOCAL PATH (e.g. /root/oosh) and registers that existing checkout as a repo in the dynamic registry.
- [ ] (add) After registering, the new repo APPEARS in the repo selector and is usable for diffs/merges (resolves via the dynamic RepoRegistry).
- [ ] (security) The path is validated server-side (exists + is a git checkout); an invalid path is rejected with a clear error (no path abuse).
- [ ] (security) [PENDING Tron ratify] The server-local path a user may register is BOUNDED (allowlist / root-confinement per Tron ratify) - not arbitrary server filesystem access; a path outside the ratified bounds is rejected.
- [ ] (security) [PENDING Tron ratify] Adding/registering a repo is gated by the ratified authorization model (who may add repos) - not open to any client.
- [ ] (security) [PENDING Tron ratify] The registered repo persists in the dynamic registry per the ratified persistence mechanism (where/how, survives restart) with no secret/path leakage.
- [ ] (gate) GATE (DET-3x + Tron visual): register /root/oosh -> it appears in the selector + opens a diff; client-facing -> version-bump.

## Implementation

V1-ACTIVE, SIMPLIFIED (architect §10) → .git-PRESENT-only add-local (accept a server path that ALREADY contains .git; NO arbitrary-path handling in V1). D2 path-traversal hardening guard DEFERRED to backlog (re-activate before exposed/multi-user deploy). DESIGN RATIFIED (Tron approved the architect decomposition + PO security decisions: D1-D4 safe options + §9 refinement, 2026-07-19) — UN-GATED, QUEUED for build. Dynamic-registry SHARED enabler (RepoRegistry mutable/persisted — supersedes R30.40's static ROOTS mechanism; tracked under R30.42-45, not a separate observable). ✓ RATIFIED: Tron approved DESIGN + SECURITY (D1-D4 + §9); task now build-QUEUED — builds AFTER R30.46 working-file; expert ping-per-method as endpoint UCs ship. ⚠ SECURITY-sensitive (server-local-path + clone-url = path-traversal / arbitrary-clone attack surface — Tron RATIFIED the security model (D1-D4 safe options)). -> expert build -> deploy -> QA-Review -> gate + chain-to-Test + served==gated -> Tron visual -> Done.

## Subtasks

None (atomic task, design-stage).
