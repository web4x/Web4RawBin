<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.40: Center Result header = targeted repo's ACTUAL current branch (dynamic)

[task:uuid:34d3439e-31de-4e21-87d2-2a54b12eac9f]

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
    - Requirement `[requirement:uuid:c5869b0a-8592-4d86-9250-9034a75e137c]`
  - down
    - [UC](./planning.md) `[uc:uuid:90f5e309-7ab2-49c6-b679-3ad891d5ab2f]`

## Task Description

Tron-QA BUG-B: the center Result header must show the ACTUAL current checked-out branch of the repo the diff targets — never stale/cached/hardcoded/other-clone. Root-cause (expert): the RepoRegistry 'oosh' key resolves to the WRONG worktree (Once.sh/dev on dev-teampush-astray) instead of the intended checkout — multi-worktree / OOSH_DIR issue.

## Context

Covers R30.40 (c5869b0a) -> UC diffEditor.centerHeaderActualBranch (90f5e309) -> Class RbDiffEditor + GitApi + RepoRegistry. Relates R30.38 (repo-routing / setCenterTitle / currentBranch) + R30.6.7 RepoRegistry. ⚠ ROOT-CAUSE = multi-worktree repo / OOSH_DIR (server serves wrong oosh worktree) — expert confirming+fixing. NOT a silent reopen of R30.38 — distinct new req (PO).

## Intention

S30 diff/merge editor, R30.40 (Tron QA-USE): center header showed the wrong branch because the server served the wrong oosh worktree. Header must be the targeted repo's real current branch, dynamic.

## Acceptance Criteria

- [x] (header) The center Result header shows the ACTUAL current checked-out branch of the repo the diff targets, resolved dynamically (git) at request time - matching the user's `git -C <repo> branch --show-current`.
- [x] (header) The header is NEVER a stale, cached, hardcoded, or other-clone branch name; if the targeted repo is on 'mcdonges.latest', the header reads otmux@mcdonges.latest (not dev-teampush-astray).
- [x] (root) [PENDING expert root-cause] The 'oosh' (and every) RepoRegistry key resolves to the repo clone the diff actually targets, so GitApi.currentBranch reports THAT clone's HEAD - not a different clone's. Final AC wording aligns to the confirmed root-cause.
- [x] (gate) GATE (DET-3x + Tron visual): open the real deep-link -> the center header branch == the git current-branch of the targeted repo clone (dynamic); client-facing -> version-bump + atomic deploy (R30.28).

## Implementation

IN PROGRESS (Tron-QA BUG-B). Tester has RED-baseline gate (dynamic-assert: header branch == git actual). Expert root-causing + fixing the worktree resolution (RepoRegistry 'oosh' key -> correct checkout / OOSH_DIR). -> deploy -> QA-Review -> tester DET-3x GREEN + Tron visual (center header == the git actual current branch on the real deep-link) -> Done (chain-to-Test + served==gated first). | -> QA-REVIEW (2026-07-19, prod v0.7.63): gate 99fe03e46 A/B RED->GREEN DET-3x v0.7.63 (dynamic-assert: header branch == git actual). Chain-to-Test CLOSED both-directions (verified): RepoRegistry.resolve 9b95b458<->Test 9a59921f(pass). Root-cause FIXED correct-by-construction (HOME/oosh symlink -> RepoRegistry.resolve follows it, right worktree). served==gated v0.7.63 (config/restart applied). ACs gate-proven. HELD rule#9 -> AWAITING Tron VISUAL verify (center header == git current branch) -> Done.

## Subtasks

None (atomic task).
