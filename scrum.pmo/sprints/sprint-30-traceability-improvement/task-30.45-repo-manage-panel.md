<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.45: Manage panel — repo / local path / current branch / switchable worktrees

[task:uuid:50ce893e-91a9-4a1e-894e-63c669e1af37]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement `[requirement:uuid:b6b21710-bee6-4f6e-b382-3578643da85a]`
  - shared-enabler
    - Dynamic RepoRegistry (mutable/persisted) — supersedes R30.40 static ROOTS; shared across R30.42-45
  - ratified
    - Tron RATIFIED DESIGN + SECURITY (D1-D4 safe options + §9, 2026-07-19) — un-gated, build queued after R30.46
  - down
    - [UC](./planning.md) `[uc:uuid:3a17f2e5-1093-4c96-aaa9-33aaad92de54]`
    - [UC](./planning.md) `[uc:uuid:47c2c3ea-9df8-46f8-841d-3178a4ec62ea]`

## Task Description

The MANAGE panel shows, per current repo: local server path, current branch, and its worktrees; each worktree is SWITCHABLE (selecting one repoints the active checkout/worktree so diffs target it); after a switch the center header + diff reflect the newly-selected worktree's branch.

## Context

Covers R30.45 (b6b21710) -> UC 3a17f2e5 -> Class RbDiffEditor 18165081 + RepoRegistry + server /api. Dynamic-registry SHARED enabler (RepoRegistry mutable/persisted — supersedes R30.40's static ROOTS mechanism; tracked under R30.42-45, not a separate observable). ★ HARD GATE: Tron ratifies the architect DESIGN + SECURITY decisions BEFORE any build — task stays DESIGN-stage (refinement), NO implementation until ratified. ⚠ SECURITY-sensitive (server-local-path + clone-url = path-traversal / arbitrary-clone attack surface — PO taking security decisions to Tron).

## Intention

S30 diff/merge editor — R30.42-45 repo add/manage feature (Tron): register/manage repos dynamically (add by path, add by clone, manage worktrees) instead of a static ROOTS list.

## Acceptance Criteria

- [ ] (manage) The MANAGE panel shows, for the current repo: local server path, current branch, and the list of available worktrees.
- [ ] (manage) Each worktree is SWITCHABLE: selecting one repoints the active checkout/worktree so diff/header/save use it (consistent with R30.40 HOME/oosh symlink-follow).
- [ ] (manage) After a switch, the center header + diff reflect the newly-selected worktree's branch (dynamic, per R30.40).
- [ ] (security) [PENDING Tron ratify] Worktree switching only repoints among the repo OWN ratified worktrees (bounded) - not an arbitrary path; consistent with R30.40 HOME/oosh symlink-follow.
- [ ] (security) [PENDING Tron ratify] Managing/switching is gated by the ratified authorization model.
- [ ] (gate) GATE (DET-3x + Tron visual): open manage -> shows path+branch+worktrees; switch a worktree -> header/diff track it; client-facing -> version-bump.

## Implementation

V1-ACTIVE (architect §10 — UC6 manageInfo + UC7 worktree-switch; safe subset). DESIGN RATIFIED (Tron approved the architect decomposition + PO security decisions: D1-D4 safe options + §9 refinement, 2026-07-19) — UN-GATED, QUEUED for build. Dynamic-registry SHARED enabler (RepoRegistry mutable/persisted — supersedes R30.40's static ROOTS mechanism; tracked under R30.42-45, not a separate observable). ✓ RATIFIED: Tron approved DESIGN + SECURITY (D1-D4 + §9); task now build-QUEUED — builds AFTER R30.46 working-file; expert ping-per-method as endpoint UCs ship. ⚠ SECURITY-sensitive (server-local-path + clone-url = path-traversal / arbitrary-clone attack surface — Tron RATIFIED the security model (D1-D4 safe options)). -> expert build -> deploy -> QA-Review -> gate + chain-to-Test + served==gated -> Tron visual -> Done.

## Subtasks

None (atomic task, design-stage).
