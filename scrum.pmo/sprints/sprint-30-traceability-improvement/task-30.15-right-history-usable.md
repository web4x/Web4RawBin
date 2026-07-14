<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.15: Right-history default meaningful + usable

[task:uuid:5e2ec981-3d12-4c4a-bd2f-7188f82952a9]

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
    - Requirement R30.15 `[requirement:uuid:c2472818-0d33-4d4d-9f34-a858c03bb346]`
  - down
    - [UC](./planning.md) `[uc:uuid:2fff4ee3-f84d-491e-9043-6f63bf3a8c69]`

## Task Description

Make the right-pane history default meaningful and usable: pick a sensible default git ref and let the user change it.

## Context

Covers R30.15 (c2472818). Class RbDiffEditor.

## Intention

S30 diff/merge editor completion (R30.15). Minted for #126 traceability (was requirement-only).

## Acceptance Criteria

- [ ] (default) On Open-Diff for a git-tracked file, RIGHT defaults to the newest committed version that DIFFERS from LEFT: HEAD~1 when the clean working file already equals the newest commit, HEAD when there are uncommitted changes - so the diff is non-empty (not a file compared to itself = 0 changes).
- [ ] (race) The async newest-autoload must NOT overwrite a user ref/file pick made while it is in flight: guard with a sequence-token/flag so a later user pick wins over the in-flight autoload.
- [ ] (verify) Open-Diff on a clean git file shows working-vs-HEAD~1 (non-empty diff); a user ref-pick during autoload is preserved; DET-3x.

## Implementation

STOOD UP (planning) — status Planned; was requirement-only, minted for #126 traceability. Status to be advanced per PO/architect hop-signals (some R30.1x may already be shipped/gated — verify).

## Subtasks

None (atomic task).
