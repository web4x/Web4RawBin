<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.10: Right pane defaults to the files git history

[task:uuid:a2ac4e5c-ad2c-44dd-be13-53aea1997549]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

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

- [ ] (history) Opening the diff on a git-tracked file populates a RIGHT-side history select (newest-first, git log --follow) and defaults it to the most-recent committed version; LEFT stays the current working file (default view = working vs last commit).
- [ ] (history) Selecting an older commit reloads the RIGHT side to that version (loadSide -> fileAtRef -> git show <sha>:<path>); the R30.9 base-aware merge recomputes.
- [ ] (fallback) Untracked / new / non-git file -> history select shows 'no history', no default; RIGHT falls back to manual pickFile/pickRef (unchanged, graceful).
- [ ] (security) fileHistory is PATH-guarded via RepoRegistry.resolve(repo key) + safeRelPath (no '..', within-root) — NOT guardRef (guardRef is for the ref on the subsequent git show, not the path); execFile array-args (no shell), read-only; unknown repo key -> 400.
- [ ] (verify) GitApi.fileHistory returns the correct newest-first [{sha,date,author,subject}] list for a known path (NUL-delimited parse test).

## Implementation

STOOD UP (planning) — status Planned; was requirement-only, minted for #126 traceability. Status to be advanced per PO/architect hop-signals (some R30.1x may already be shipped/gated — verify).

## Subtasks

None (atomic task).
