<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.45: Manage panel — repo / local path / current branch / switchable worktrees

[task:uuid:50ce893e-91a9-4a1e-894e-63c669e1af37]

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

- [ ] **(manage)** The MANAGE panel shows, for the current repo: local server path, current branch, and the list of available worktrees.
- [ ] **(manage)** RATIFIED D3: each worktree is SELECTABLE as a READ-ONLY key (worktree-as-key) - selecting one repoints the READ key so diff/header read that worktree ref; the server performs NO checkout and mutates NO working tree.
- [ ] **(manage)** After a switch, the center header + diff reflect the newly-selected worktree's branch (dynamic, per R30.40).
- [ ] **(security)** RATIFIED D3: switching only selects among the repo OWN worktrees as read keys (bounded) - no server checkout, no arbitrary path.
- [ ] **(security)** RATIFIED D3+D4: a worktree SWITCH is READ-ONLY (D3) so requires NO admin-key; any MUTATING manage action (register/remove from the registry) requires the admin-key (D4).
- [ ] **(gate)** GATE (DET-3x + Tron visual): open manage -> shows path+branch+worktrees; switch a worktree -> header/diff track it; client-facing -> version-bump.

## Implementation

QA-REVIEW: manage panel — UC6 manageInfo (path/branch/worktrees, v0.7.70) + UC7 worktree-switch (D3 read-only-key, v0.7.72). Gate r3045-uc7 GREEN DET-3x (ebdf8b080), chain both-directions (switchWorktree 1a86a852<->Test 771e2e83), served==gated v0.7.72. D4 admin-key (mutating) deferred R30.48. 5/6 ACs (gate Tron-visual pending). HELD rule#9 -> Tron VISUAL -> Done.

## Subtasks

None (atomic task, design-stage).
