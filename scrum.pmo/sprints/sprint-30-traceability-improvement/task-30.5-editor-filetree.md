<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.5: Editor file pane shows the full project filetree

[task:uuid:c80ae70e-9542-4c44-a199-adb6ad51ea17]

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
    - Requirement R30.5 `[requirement:uuid:21ced567-d47f-4f3c-9b28-225a45dfecce]`
  - down
    - [UC30.5: editor.fullFiletree](./planning.md) `[uc:uuid:18d6a337-efea-4dc1-8de4-7c65dde053b4]`

## Task Description

Fix the Editor file-pane empty-filetree regression in RbFileTree: it requests /api/files/<slash> for the root (rb-file-tree.ts:31), which the server FORBIDS -> empty tree. Fix = request the root with an EMPTY relPath (not a leading slash) so the server returns the full project filetree.

## Context

Covers R30.5 (21ced567). Class RbFileTree (rb-file-tree.ts:31 slash-root-forbidden bug). Tron regression.

## Intention

Tron regression (S30): the Editor file pane must show the full project filetree, not empty.

## Acceptance Criteria

- [ ] (tree) The /edit Files pane shows the FULL project filetree (src / scenario / scrum.pmo / scripts / test / data / etc), expandable.
- [ ] (bug) THE BUG: rb-file-tree.ts:31 requests /api/files/'/' for root -> server safePath('/') resolves to FS-root, fails startsWith(PROJECT_ROOT) -> {error:Forbidden} -> empty tree.
- [ ] (bug) PROVEN: /api/files/ (empty relPath) returns the full tree; /api/files/%2F -> Forbidden - confirming the root request must use empty relPath, not '/'.
- [ ] (fix) Fix = the file-tree root request uses an EMPTY relPath (not '/') - one-line at rb-file-tree.ts:31, drop the "|| '/'" fallback.

## Implementation

STOOD UP (planning) — status Planned; chain-build awaits architect design + req chain mint. Advance on architect/PO signal.

## Subtasks

None (atomic task).
