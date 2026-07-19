<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.42: Repo selector first option is 'Add repository' → opens add/manage dialog

[task:uuid:255ac5c1-0328-480f-bc75-d38aada20e9f]

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
    - Requirement `[requirement:uuid:7d6e15c0-7f8e-41a5-b204-01008a67b78d]`
  - shared-enabler
    - Dynamic RepoRegistry (mutable/persisted) — supersedes R30.40 static ROOTS; shared across R30.42-45
  - hard-gate
    - Tron ratifies DESIGN + SECURITY before ANY build
  - down
    - [UC](./planning.md) `[uc:uuid:6716c678-f652-4ec3-a2d7-01493c8ea0eb]`

## Task Description

The repo selector's FIRST option reads 'Add repository' (above the actual repos); selecting it opens the add/manage dialog (does not try to load a repo named that).

## Context

Covers R30.42 (7d6e15c0) -> UC 6716c678 -> Class RbDiffEditor 18165081 + RepoRegistry + server /api. Dynamic-registry SHARED enabler (RepoRegistry mutable/persisted — supersedes R30.40's static ROOTS mechanism; tracked under R30.42-45, not a separate observable). ★ HARD GATE: Tron ratifies the architect DESIGN + SECURITY decisions BEFORE any build — task stays DESIGN-stage (refinement), NO implementation until ratified. ⚠ SECURITY-sensitive (server-local-path + clone-url = path-traversal / arbitrary-clone attack surface — PO taking security decisions to Tron).

## Intention

S30 diff/merge editor — R30.42-45 repo add/manage feature (Tron): register/manage repos dynamically (add by path, add by clone, manage worktrees) instead of a static ROOTS list.

## Acceptance Criteria

- [ ] (ui) The repo selector's FIRST option reads 'Add repository' (above the actual repos).
- [ ] (ui) Selecting/clicking 'Add repository' opens the add/manage dialog (does not try to load a repo named 'Add repository').
- [ ] (gate) GATE (DET-3x + Tron visual): the selector shows 'Add repository' first; clicking opens the dialog; client-facing -> version-bump.

## Implementation

IN PROGRESS @ DESIGN STAGE (architect decomposing; PO bringing DESIGN + SECURITY decisions to Tron for RATIFY). ★ HARD GATE: NO build until Tron ratifies. Dynamic-registry SHARED enabler (RepoRegistry mutable/persisted — supersedes R30.40's static ROOTS mechanism; tracked under R30.42-45, not a separate observable). ★ HARD GATE: Tron ratifies the architect DESIGN + SECURITY decisions BEFORE any build — task stays DESIGN-stage (refinement), NO implementation until ratified. ⚠ SECURITY-sensitive (server-local-path + clone-url = path-traversal / arbitrary-clone attack surface — PO taking security decisions to Tron). -> Tron ratify -> expert build -> deploy -> QA-Review -> gate + chain-to-Test + served==gated -> Tron visual -> Done.

## Subtasks

None (atomic task, design-stage).
