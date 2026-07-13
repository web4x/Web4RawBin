<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.6.6: [Open Diff] toolbar button (editor entry point)

[task:uuid:d165fff1-74c8-4d9e-b8d2-1f554924a584]

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
    - Requirement R30.6.6 `[requirement:uuid:91e06cc8-57ce-482a-91ae-4c9f13751059]`
  - down
    - [UC](./planning.md) `[uc:uuid:32effc0a-657d-4c5a-a187-4e073ebdafa7]`

## Task Description

Add an [Open Diff] toolbar button as the entry point to RbDiffEditor (currently there is NO way to open the editor). The button launches the 3-way diff editor with the LEFT pane = the current file. Gives users a discoverable way to open the diff/merge editor.

## Context

Covers R30.6.6 (91e06cc8). Class RbDiffEditor (code rb-diff-editor). Usability completion of R30.6 umbrella.

## Intention

S30 R30.6 diff-editor USABILITY completion (R30.6.6): make the editor reachable + repo-safe.

## Acceptance Criteria

- [x] (entry) An '📊 Open Diff' button appears in the editor toolbar (rb-editor-toolbar, next to View/Preview + Save), NOT a tab; works in both desktop and mobile form factors.
- [x] (entry) Clicking the button dispatches a bubbling toolbar-open-diff event; edit.ts handles it and calls RbEditorLayout.showDiff(currentFilePath).
- [x] (mount) showDiff lazily mounts <rb-diff-editor> (like rb-file-tree/rb-code-editor) — not eagerly loaded before first use.
- [x] (preselect) The diff opens with the LEFT pane preselected to the CURRENT editor file — its path AND current content (reuse the editor's current-file state / rb-code-editor.getValue()) — ready to compare; the user then picks the RIGHT side.

## Implementation

DONE-DELIVERED 2026-07-13: Tron-VERIFIED + accepted the live [Open Diff] toolbar entry-point button (RbEditorLayout.showDiff). Editor now openable. R30.6 umbrella still open pending T30.6.7 (RepoRegistry, expert building).

## Subtasks

None (atomic task).
