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
  - [x] testing
- [x] QA Review
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

- [ ] **(add)** The dialog accepts a SERVER-LOCAL PATH (e.g. /root/oosh) and registers that existing checkout as a repo in the dynamic registry.
- [ ] **(add)** After registering, the new repo APPEARS in the repo selector and is usable for diffs/merges (resolves via the dynamic RepoRegistry).
- [ ] **(security)** V1 (Tron scope-simplification 2026-07-19): the chosen directory MUST contain a .git (a FILE or a FOLDER = a git checkout or worktree) - this is the SOLE validation. NO REPO_ALLOW allowlist, NO admin-auth for v1. An invalid dir (no .git) is rejected with a clear error.
- [ ] **(security)** [BACKLOG v1 - deferred, NOT lost; rationale: path traversal / info-disclosure defense] RATIFIED D1 (deferred to a post-v1 admin-endpoint): the server-local path, after realpath, within HOME subtree OR REPO_ALLOW allowlist. V1 drops this - sole check is .git-present (AC-validate).
- [ ] **(security)** [BACKLOG v1 - deferred, NOT lost; rationale: write-auth] RATIFIED D4 (deferred): register requires admin-key. V1 drops admin-auth for add-local.
- [ ] **(security)** V1: the registration persists in the dynamic registry (survives restart). [BACKLOG v1: the admin-key gating of that write is deferred with D4.]
- [ ] **(gate)** GATE (DET-3x + Tron visual): register /root/oosh -> it appears in the selector + opens a diff; client-facing -> version-bump.

## Implementation

QA-REVIEW: V1 add-local (.git-present -> register). Gate r3043 GREEN DET-3x (50cc4295e), chain-to-Test both-directions (isGitRepo 3d1b156d<->Test 4a253cea), served==gated v0.7.71. V1 SIMPLIFIED: .git-present SOLE validation; D1 allowlist + D4 admin-key BACKLOG (AC4/5 -> R30.48/BH-3). 4/7 ACs (AC4/5 deferred, AC7 Tron-visual pending). HELD rule#9 -> Tron VISUAL -> Done.

## Subtasks

None (atomic task, design-stage).
