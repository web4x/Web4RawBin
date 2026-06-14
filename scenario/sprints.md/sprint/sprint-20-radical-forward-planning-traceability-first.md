## Sprint 20 — Radical Forward Planning (Traceability-First)

Apply the S19 marathon lesson FORWARD: chains are built BEFORE/WITH implementation, never functional-first-then-backfill. DISCIPLINE: every requirement gets its FULL chain (Req→UseCase→Class→Method→Implementation→Test) DESIGNED, and the Test written FIRST (or with the impl) — nothing ships chain-open. Carry forward S19 open follow-ons as proper S20 chains (R19.99 broken-link, R19.100 render-inversion, R19.102 create-folder-actions), each designed-ahead. Track tonight's scheduled (22:07) radical backfill of S19 v0.5.x chain-debt.

**Status:** Planned

## Traceability

**Requirements:**
- [🔗 R19.99: One link still renders broken in md-safari room — identify and fix.](../requirement/r19-99-one-link-still-renders-broken-in-md-safari-room-identify-and-fix.md)
- [🔗 R19.100: Identical files must render in ALL rooms — no per-room stale-cache inversion.](../requirement/r19-100-identical-files-must-render-in-all-rooms-no-per-room-stale-cache-inversi.md)
- [🔗 R19.102: Room tree supports user actions — create new folder to organize content.](../requirement/r19-102-room-tree-supports-user-actions-create-new-folder-to-organize-content.md)
- [🔗 R20.2: Default detail drawer nudge becomes the wide grab-bar from the chat drawer.](../requirement/r20-2-default-detail-drawer-nudge-becomes-the-wide-grab-bar-from-the-chat-drawer.md)
- [🔗 R20.3: All item views default to COLLAPSED on render — always, every load.](../requirement/r20-3-all-item-views-default-to-collapsed-on-render-always-every-load.md)
- [🔗 R20.4: Bug and ChangeRequest are OOP extensions of Requirement with own icons.](../requirement/r20-4-bug-and-changerequest-are-oop-extensions-of-requirement-with-own-icons.md)
- [🔗 R20.5: Detail-view Traceability Chain shows ONLY traced-chain nodes; All Children = union of ALL model arrays. Universal.](../requirement/r20-5-detail-view-traceability-chain-shows-only-traced-chain-nodes-all-children-.md)
- [🔗 CR1: Rename 'Champagne Chain' label to 'Traceability Chain' in all user-facing UI.](../changerequest/cr1-rename-champagne-chain-label-to-traceability-chain-in-all-user-facing-ui.md)
- [🔗 BUG1: Chain section shows Task as its own chain node + mixes non-chain nodes.](../bug/bug1-chain-section-shows-task-as-its-own-chain-node-mixes-non-chain-nodes.md)
- [🔗 R20.6a: Global SelectionModel — app-wide selection array singleton.](../requirement/r20-6a-global-selectionmodel-app-wide-selection-array-singleton.md)
- [🔗 R20.6b: Nothing selected → default drawer shows in-room CHAT.](../requirement/r20-6b-nothing-selected-default-drawer-shows-in-room-chat.md)
- [🔗 R20.6c: Tap item middle → single-select, shown in details drawer.](../requirement/r20-6c-tap-item-middle-single-select-shown-in-details-drawer.md)
- [🔗 R20.6d: Long-press toggles add/remove from selection array (multi-select).](../requirement/r20-6d-long-press-toggles-add-remove-from-selection-array-multi-select.md)
- [🔗 R20.6e: Selected items get CSS selected+active highlight.](../requirement/r20-6e-selected-items-get-css-selected-active-highlight.md)
- [🔗 R20.6f: Drag one selected item → drags ALL selected items.](../requirement/r20-6f-drag-one-selected-item-drags-all-selected-items.md)
- [🔗 R20.6g: Consolidate multiple drawer implementations into one via SelectionModel.](../requirement/r20-6g-consolidate-multiple-drawer-implementations-into-one-via-selectionmodel.md)
- [🔗 R20.6h: Remove awkward CSS highlight on default drawer, keep X close.](../requirement/r20-6h-remove-awkward-css-highlight-on-default-drawer-keep-x-close.md)
- [🔗 BUG2: Short tap accumulates selection instead of switching to single-select.](../bug/bug2-short-tap-accumulates-selection-instead-of-switching-to-single-select.md)
- [🔗 BUG3: CSS regression — drawer layout must be grab-bar → actions → filename BELOW, not beside.](../bug/bug3-css-regression-drawer-layout-must-be-grab-bar-actions-filename-below-not-be.md)
- [🔗 BUG4: Deselect must return drawer to CHAT mode, not close it.](../bug/bug4-deselect-must-return-drawer-to-chat-mode-not-close-it.md)
- [🔗 R20.9: Landscape orientation uses the wide space — side-by-side panels instead of portrait stack.](../requirement/r20-9-landscape-orientation-uses-the-wide-space-side-by-side-panels-instead-of-p.md)
- [🔗 R20.10: Selecting a ref opens the detail drawer for that item.](../requirement/r20-10-selecting-a-ref-opens-the-detail-drawer-for-that-item.md)
- [🔗 R20.11: Drawer close action dismisses the drawer.](../requirement/r20-11-drawer-close-action-dismisses-the-drawer.md)
- [🔗 R20.12: Current Sprint pinned at TOP of the traceability sprint-list (app view).](../requirement/r20-12-current-sprint-pinned-at-top-of-the-traceability-sprint-list-app-view.md)
- [🔗 R20.13: CurrentSprint is a dedicated class that sets the chain and is used by planner's skill as planning+driving tool.](../requirement/r20-13-currentsprint-is-a-dedicated-class-that-sets-the-chain-and-is-used-by-pla.md)
- [🔗 R20.13.A: Always-visible realtime view of the current task's full chain — status + assignee per hop, live-updated by planner skill.](../requirement/r20-13-a-always-visible-realtime-view-of-the-current-task-s-full-chain-status-as.md)
- [🔗 R20.14: Realtime Traceability Skill — CMM3 automated: bug/req fix-chain renders on /trace in realtime, zero manual steps.](../requirement/r20-14-realtime-traceability-skill-cmm3-automated-bug-req-fix-chain-renders-on-t.md)
- [🔗 R20.17: /trace shows the current task(s) (CurrentSprint WIP) correctly.](../requirement/r20-17-trace-shows-the-current-task-s-currentsprint-wip-correctly.md)
- [🔗 R20.16: Test node in the chain displays its test-case STATUS (pass/fail badge).](../requirement/r20-16-test-node-in-the-chain-displays-its-test-case-status-pass-fail-badge.md)

**Tasks:**
- [🔗 T-s19-champagne-backfill-tracking: track tonight's 22:07 radical backfill of S19 v0.5.x chain-debt](../task/s19-champagne-backfill-tracking.md)
- [🔗 T-room-create-folder-actions: room tree user actions — create new folder to organize content](../task/room-tree-create-folder-actions.md)
- [🔗 T-detail-drawer-grab-bar: default detail drawer nudge becomes the wide grab-bar (DRY with chat drawer)](../task/detail-drawer-wide-grab-bar-dry.md)
- [🔗 T-item-views-default-collapsed: every item view defaults COLLAPSED on render, always](../task/item-views-default-collapsed-always.md)
- [🔗 T-bug-changerequest-oop-extensions: Bug + ChangeRequest as Requirement subclasses with own icons](../task/bug-changerequest-requirement-subclasses-icons.md)
- [🔗 T-s19-shared-impl-split-recovery: split 11 shared-impl regressions into own Impl+marker per method (never flip)](../task/s19-shared-impl-split-recovery.md)
- [🔗 T-rename-champagne-to-traceability: 'Champagne Chain' → 'Traceability Chain' in all user-facing UI](../task/rename-champagne-chain-to-traceability.md)
- [🔗 T-chain-excludes-self-and-nonchain: chain section excludes the Task self-node + non-chain nodes](../task/chain-section-excludes-self-and-nonchain.md)
- [🔗 T-selection-model: app-wide SelectionModel + selection-driven drawer/multi-select/drag (R20.6 compound)](../task/selection-model-compound.md)
- [🔗 T-selection-tap-switch-longpress-toggle: tap clears+selects ONE, long-press toggles off](../task/selection-tap-switch-longpress-toggle-off.md)
- [🔗 T-current-sprint-planner-skill: planner SKILL maintains + drives the WIP=1 chain via the CurrentSprint class (R20.13)](../task/current-sprint-planner-skill.md)
