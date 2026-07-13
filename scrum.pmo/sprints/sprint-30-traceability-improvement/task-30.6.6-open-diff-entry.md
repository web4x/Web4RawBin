<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.6.6: [Open Diff] toolbar button (editor entry point)

[task:uuid:d165fff1-74c8-4d9e-b8d2-1f554924a584]

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

- [ ] (entry) An '📊 Open Diff' button appears in the editor toolbar (rb-editor-toolbar, next to View/Preview + Save), NOT a tab; works in both desktop and mobile form factors.
- [ ] (entry) Clicking the button dispatches a bubbling toolbar-open-diff event; edit.ts handles it and calls RbEditorLayout.showDiff(currentFilePath).
- [ ] (mount) showDiff lazily mounts <rb-diff-editor> (like rb-file-tree/rb-code-editor) — not eagerly loaded before first use.
- [ ] (preselect) The diff opens with the LEFT pane preselected to the CURRENT editor file — its path AND current content (reuse the editor's current-file state / rb-code-editor.getValue()) — ready to compare; the user then picks the RIGHT side.

## Implementation

STOOD UP (planning) — status Planned; expert builds impl (per PO). Advance on architect/PO build hop-signal.

## Subtasks

None (atomic task).
