<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.10: Right pane defaults to the files git history

[task:uuid:a2ac4e5c-ad2c-44dd-be13-53aea1997549]

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
    - Requirement R30.10 `[requirement:uuid:168d5c58-2373-45f4-9018-0cd1e3528677]`
  - down
    - [UC](./planning.md) `[uc:uuid:3a442bc4-dfd7-4d70-a4dd-05c0ab69d24c]`

## Task Description

Default the RIGHT pane of the diff/merge editor to the files git history (prior committed version) so opening a file shows a meaningful base-vs-current comparison by default.

## Context

Covers R30.10 (168d5c58). Class RbDiffEditor.

## Intention

S30 diff/merge editor completion (R30.10). Minted for #126 traceability (was requirement-only).

## Acceptance Criteria

- [x] (history) Opening the diff on a git-tracked file populates a RIGHT-side history select (newest-first, git log --follow) and defaults it to the most-recent committed version; LEFT stays the current working file (default view = working vs last commit).
- [x] (history) Selecting an older commit reloads the RIGHT side to that version (loadSide -> fileAtRef -> git show <sha>:<path>); the R30.9 base-aware merge recomputes.
- [x] (fallback) Untracked / new / non-git file -> history select shows 'no history', no default; RIGHT falls back to manual pickFile/pickRef (unchanged, graceful).
- [x] (security) fileHistory is PATH-guarded via RepoRegistry.resolve(repo key) + safeRelPath (no '..', within-root) — NOT guardRef (guardRef is for the ref on the subsequent git show, not the path); execFile array-args (no shell), read-only; unknown repo key -> 400.
- [x] (verify) GitApi.fileHistory returns the correct newest-first [{sha,date,author,subject}] list for a known path (NUL-delimited parse test).

## Implementation

DONE 2026-07-14 (PO shipped/git-state): v-shipped ★SUPERSEDED by R30.17 populateLeftHistory.

## Subtasks

None (atomic task).
