<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 35.1: Convert legacy per-view buttons into universal action-bar actions [R35.1, build LAST]

[task:uuid:a1d17363-dc2a-4331-a470-27e995735b8d]

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

DONE: R35.1 buttons->actions built (vcard/preview/newtab/proxy -> actionsForContext verbs in shared universalActionBar, rb-drawer-action -> existing fns; zoom-reset excluded; dead file-preview chain b1a799bb0 RETIRED supersededBy b8f284c6, INV-2) + chain-complete-to-Test (Impl b8f284c6 tests[]=[1fe8564c] single-impl, markerPending=false, req mint 0e439d66d) + REAL-WEBKIT @390 GREEN DET-3x (re-gated v0.8.50 994d5df14 INV-2 residuals fixed, served==HEAD 0.8.50, Safari 605.1.15 = Tron iPhone engine). Team-gated at Tron real engine -> Done.

## Traceability

  - up
    - [Sprint 35 Planning](./planning.md)
    - Requirement R35.1 `[requirement:uuid:b1fbf276-7e20-4e03-9e83-281f64574beb]`
  - down
    - None (atomic task)

## Task Description

Every bespoke per-item-view button (rb-detail-view vcard[member/user]+preview-file[file]; rb-file-detail new-tab[file]; rb-webitem-detail proxy-preview[webitem]) becomes an actionsForContext/ACTIONS_BY_TYPE verb [download-vcard/preview-file/open-newtab/proxy-preview] rendered in the ONE shared universalActionBar; detail views drop their own button markup; handler via rb-drawer-action (model.ts wireDrawerActions) dispatches to the existing fns (downloadVCard/renderFilePreview/window.open/toProxy). zoom-reset EXCLUDED (viewer control, not an item-action). Rides the S34 universal action bar (R-E). Client-only.

## Acceptance Criteria

- [x] (functional) Every bespoke per-view button maps to an actionsForContext/ACTIONS_BY_TYPE verb keyed by type (member/user->download-vcard; file->preview-file+open-newtab; webitem->proxy-preview), rendered in the shared universalActionBar.
- [x] (functional) INV-1: each converted action preserves the OLD button's effect (dispatches to the existing downloadVCard/renderFilePreview/window.open/toProxy fn) - same result, relocated into the bar.
- [x] (functional) INV-2: NO bespoke item-action button remains in any detail view (zoom-reset EXCEPTED = in-pane viewer control, not an item-action).
- [x] (functional) Verb-listing rides actionsForContext (a1a5be99); the click handler routes via rb-drawer-action (wireDrawerActions). Client-only.
- [x] (gate) GATE @390 real-WebKit: each converted action is PRESENT + FIRES in the bar per type; the old bespoke buttons are gone; no behavior lost.

## Subtasks

None (atomic task).
