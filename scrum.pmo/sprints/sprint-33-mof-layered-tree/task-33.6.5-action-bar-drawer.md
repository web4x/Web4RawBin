<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 33.6.5: Action bar lives inside the drawer (below the handle-bar, above the content), always present, with contents dynamically driven by the current selection

[task:uuid:eb8cf1e7-434a-4291-a42a-fe01cb2d692a]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Remaining Issues

DONE: chain-complete-to-Test (action-bar in drawer + dup-Re-Sync retirement fix v0.8.32) + REAL-WEBKIT @390 self-gated GREEN (r3365 relabeled R33.9-CRUD drawer, sweep 6a248b19a, Safari 605.1.15 = Tron iPhone engine). Team-gated at Tron real engine -> Done.

## Traceability

  - up
    - [Sprint 33 Planning](./planning.md)
    - Requirement R33.6.5 `[requirement:uuid:3c6eee8d-85ff-41d5-8c62-c2656171efe2]`
  - down
    - None (atomic task)

## Task Description

Tron items 5+6 (coupled = ONE requirement). (5) The ACTION BAR moves INTO the drawer, directly BELOW the handle/grab bar and ABOVE the diagram/content, ALWAYS present there (reuse the rb-detail-drawer R31.4 fixed-region pattern - NOT a floating/overlay bar). Its contents are DYNAMIC by selection: diagram-folder -> 'add diagram'; class -> rename / remove-from-diagram / delete / new-class. (6) Selecting ANYTHING always drives the action-bar content to change - the bar reflects the current selection's available actions at ALL times (selection-driven). Items 5 and 6 are the same mechanism (a selection-driven action bar fixed in the drawer). Reuse rb-detail-drawer (R31.4), NO fork.

## Acceptance Criteria

- [x] The action bar is a FIXED region INSIDE the rb-detail-drawer (reuse R31.4), rendered directly BELOW the handle/grab bar and ABOVE the diagram/content area, and is ALWAYS present there (not a floating bar, not an overlay). @390 it sits between the grab-bar and the content in the drawer layout.
- [x] The action bar's contents are driven by the CURRENT selection and update whenever the selection changes (item-6): diagram-folder selected -> 'add diagram'; a class selected -> rename / remove-from-diagram / delete / new-class. Selecting ANYTHING re-renders the bar to that selection's available actions.
- [x] With nothing selected (or a neutral/root selection) the action bar shows a sensible default/empty state (exact default architect-scoped on design) - the bar is still present, just without selection-specific actions.
- [x] GATE @390 (screenshot/pixel + planted bite): the bar is always below the handle inside the drawer; select the diagram-folder -> bar shows 'add diagram'; select a class -> bar shows rename/remove/delete/new-class; change selection -> bar contents change accordingly. planted-defect: selection changes but bar stays stale = RED. ★ RE-SHARPENED (device bc21ca747): assert EXACTLY ONE Re-Sync button (count=1) - the old pre-action-bar in-diagram toolbar is RETIRED, NO duplicate/old action buttons.
- [x] EXACTLY ONE Re-Sync button (the R33.6.5 action-bar one); NO pre-action-bar duplicate/old in-diagram toolbar action buttons remain - the old in-diagram toolbar is RETIRED when the actions moved INTO the drawer action-bar. Gate: count Re-Sync buttons = 1. (Device bug, architect diagnosis bc21ca747: the pre-action-bar in-diagram toolbar was not retired -> a duplicate/old Re-Sync remained alongside the action-bar one.)

## Subtasks

None (atomic task).
