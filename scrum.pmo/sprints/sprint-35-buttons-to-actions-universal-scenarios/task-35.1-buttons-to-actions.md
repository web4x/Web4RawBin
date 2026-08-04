<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 35.1: Convert legacy per-view buttons into universal action-bar actions [R35.1, build LAST]

[task:uuid:a1d17363-dc2a-4331-a470-27e995735b8d]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned — cluster R35.1 (build LAST, depends on the S34 action mechanism; order R35.2/3->R35.4->R35.1). Convert legacy per-view buttons (vcard/preview/newtab/proxy) -> actionsForContext verbs in the shared universalActionBar; handler via rb-drawer-action -> existing fns; zoom-reset excluded. Client-only. @390 real-WebKit gate (action PRESENT + FIRES per type, no bespoke button left) + chain-complete-to-Test on ship.

## Traceability

  - up
    - [Sprint 35 Planning](./planning.md)
    - Requirement R35.1 `[requirement:uuid:b1fbf276-7e20-4e03-9e83-281f64574beb]`
  - down
    - None (atomic task)

## Task Description

Every bespoke per-item-view button (rb-detail-view vcard[member/user]+preview-file[file]; rb-file-detail new-tab[file]; rb-webitem-detail proxy-preview[webitem]) becomes an actionsForContext/ACTIONS_BY_TYPE verb [download-vcard/preview-file/open-newtab/proxy-preview] rendered in the ONE shared universalActionBar; detail views drop their own button markup; handler via rb-drawer-action (model.ts wireDrawerActions) dispatches to the existing fns (downloadVCard/renderFilePreview/window.open/toProxy). zoom-reset EXCLUDED (viewer control, not an item-action). Rides the S34 universal action bar (R-E). Client-only.

## Acceptance Criteria

- [ ] (functional) Every bespoke per-view button maps to an actionsForContext/ACTIONS_BY_TYPE verb keyed by type (member/user->download-vcard; file->preview-file+open-newtab; webitem->proxy-preview), rendered in the shared universalActionBar.
- [ ] (functional) INV-1: each converted action preserves the OLD button's effect (dispatches to the existing downloadVCard/renderFilePreview/window.open/toProxy fn) - same result, relocated into the bar.
- [ ] (functional) INV-2: NO bespoke item-action button remains in any detail view (zoom-reset EXCEPTED = in-pane viewer control, not an item-action).
- [ ] (functional) Verb-listing rides actionsForContext (a1a5be99); the click handler routes via rb-drawer-action (wireDrawerActions). Client-only.
- [ ] (gate) GATE @390 real-WebKit: each converted action is PRESENT + FIRES in the bar per type; the old bespoke buttons are gone; no behavior lost.

## Subtasks

None (atomic task).
