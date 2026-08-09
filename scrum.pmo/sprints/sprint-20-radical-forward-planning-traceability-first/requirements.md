<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 20 Requirements — Sprint 20 — Radical Forward Planning (Traceability-First)

## Requirements

- [ ] **R19.99 — R19.99: One link still renders broken in md-safari room — identify and fix.**
  [requirement:uuid:aaa36d91-35b8-49ba-877d-d39b2275e1da]
  > PO relay (Tron v0.5.228 desktop Chrome): one link still renders broken in md-safari room.
  BUG (v0.5.228, desktop Chrome macOS): one link in the md-safari room still renders broken (non-clickable, wrong href, or missing target). Identify which link it is and fix. All other links in the room work.

- [ ] **R19.100 — R19.100: Identical files must render in ALL rooms — no per-room stale-cache inversion.**
  [requirement:uuid:ca4f8758-0267-4ae4-9723-f5b87ff8a593]
  > PO relay (Tron v0.5.228): identical files in SYSTEM TEST room don't render while md-safari DOES — inversion, likely per-room stale cache.
  BUG (v0.5.228): identical files in the SYSTEM TEST room do NOT render for Tron, while the md-safari room with the same files DOES render them. This is an inversion — the same data renders in one room but not another. Likely per-room stale cache or per-room scenario-unit load inconsistency. FIX: file rendering must be deterministic per FileUnit UUID regardless of which room displays it. If the FileUnit exists in the index and is in Room.files[], it renders. No per-room cache should suppress rendering.

- [ ] **R19.102 — R19.102: Room tree supports user actions — create new folder to organize content.**
  [requirement:uuid:754be820-0697-4ce8-8d7a-824484c47c69]
  > TRON: "prepare for actions like create new folder in the room UX."
  The in-room tree (currently auto-generated Members/Files collections) MUST support USER ACTIONS for content organization — starting with 'create new folder'. A user-created folder is a scenario unit (ior:class:Folder, nestable) within the room that can contain files and sub-folders. This is a design-ahead capture for a family of actions: create folder, move file into folder, rename folder, delete folder. The folder appears as an rb-object-item folder node in the tree (same as Members/Files per R19.21.A). After Members/Files-folder render fix (R19.101) lands.

- [ ] **R20.2 — R20.2: Default detail drawer nudge becomes the wide grab-bar from the chat drawer.**
  [requirement:uuid:9993091a-aa45-4c4f-9c62-e4d5377ba3e8]
  > TRON: "the second image has the chat drawer nudge. the first image shows the bad nudge in the default detail container. fix it with full traceability."
  The default DetailViewContainer (rb-detail-drawer) nudge is a tiny grey stub pill + X button (BAD UX — not discoverable as a drag handle). The chat drawer has a WIDE GRAB-BAR that is the correct reference. FIX: the default detail drawer nudge MUST render the SAME wide grab-bar as the chat drawer — visually identical, functionally identical (drag-resize per R19.84). One DRY nudge/grab-bar component shared across both drawers.

- [ ] **R20.3 — R20.3: All item views default to COLLAPSED on render — always, every load.**
  [requirement:uuid:eeeabe81-3264-4c7b-bd41-371a3db9f118]
  > TRON: "make all itemviews by default collapsed… always."
  > TRON (clarification): "collapsed means no children visible not icon only."
  > TRON (FINAL): default = EVERYTHING collapsed incl Room root.
  EVERYTHING defaults to COLLAPSED on render — including the Room root node itself. The full expand sequence is: tap Room → Members/Files folder nodes appear (collapsed) → tap folder → items appear (collapsed) → tap item → children appear. NO auto-expand at any level. Collapsed = children/subtree HIDDEN (expander ">" closed), item shows full card (icon+name+desc). NOT icon-only compact (that is a separate state per item-view-states standard). iOS: oi-icon cursor:grab must not suppress tap-to-expand on iOS Safari.
  -> itemView.defaultCollapsed [uc:uuid:709c458d-4557-488d-8be3-0bdd5d1ee1c9]

- [ ] **R20.4 — R20.4: Bug and ChangeRequest are OOP extensions of Requirement with own icons.**
  [requirement:uuid:ea212274-22c0-4987-9bb2-99262b22f550]
  > TRON: "add bug and change request as oop extension to requirement to trace these cases. obviously as std scenarios with own icons on the item view."
  Bug and ChangeRequest become OOP EXTENSIONS (subclasses) of Requirement: ior:class:Bug extends ior:class:Requirement, ior:class:ChangeRequest extends ior:class:Requirement. They trace through the SAME 6-step chain as requirements (Req→UC→Class→Method→Impl→Test) but are distinctly typed. Each is a standard scenario unit in the index with its OWN ICON in rb-object-item (distinct from the Requirement icon). This enables tracing bug-fix chains and change-request chains with full traceability, using the existing Requirement infrastructure.

- [ ] **R20.5 — R20.5: Detail-view Traceability Chain shows ONLY traced-chain nodes; All Children = union of ALL model arrays. Universal.**
  [requirement:uuid:7734f4e1-def9-4af3-a7d2-5ccc7160b214]
  > TRON (original): "the traceability has many use cases instead of the traceability chain to test… the All children section may be right"
  > TRON (clarification): "traceability is the traceability chain not all methods. in all children all methods is correct if there are really no other children. children is obviously the sum of all array relationships in the model."
  > TRON (universal): "this is true for ALL scenarios"
  > TRON (dedup traceability): the traceability OF deduplicated requirements — dedup relationship must be traceable, surfaced in detail-view + chain.
  UNIVERSAL rule for EVERY scenario type detail view (all present and future types): (A) Traceability Chain section shows ONLY nodes in an actual traced chain at FULL DEPTH (req→uc→class→method→impl→test→gate — R20.30 chain-descent: the chain descends to leaf, NOT truncated at method; chain-relevant nodes only, e.g. the chain-relevant method, not all class methods). (B) All Children section = UNION of ALL array-relationship fields in the model (useCases[]/tasks[]/tests[]/methods[]/implementations[]/members[]/files[]/etc). Two distinct sections, two distinct data sources, one DRY implementation across all DetailViews. (C) DEDUP TRACEABILITY: when requirements are deduplicated/merged, each duplicate carries a supersededBy/duplicateOf link to the canonical, visible in the detail-view + traceable in the chain. A deduped req is never lost — it traces to its canonical. The canonical lists its duplicates via supersedes[]. Both directions surfaced in the detail-view.
  -> detailView.singularChain [uc:uuid:cd7b03bd-ba2c-4711-be57-32f43e52ff2f]

- [ ] **CR1 — CR1: Rename 'Champagne Chain' label to 'Traceability Chain' in all user-facing UI.**
  [requirement:uuid:b04fc9af-19ca-46d6-b4bd-c16663df1212]
  > TRON: "do you see the issues on this requirement and the need for change requests and bugs regarding traceability and stupid champagne marketing?"
  CHANGE REQUEST (dogfoods R20.4 ior:class:ChangeRequest): rename every "Champagne" label in the product UI to "Traceability". Scope: (1) src/public/ts/trace/singular-chain.ts:3 — comment says "champagne path" → rename to "traceability chain path". (2) ANY detail-view section heading that renders "Champagne Chain" → "Traceability Chain" (these are generated from the singular-chain module or detail-superseded.ts template strings). (3) grep dist/ for compiled remnants and rebuild. Champagne is the team internal quality-verification concept — users must NEVER see it. Only 1 source file hit (singular-chain.ts:3); the rest are in compiled dist/ (rebuild clears). Self-standing for architect→expert: rename string + rebuild + verify no "champagne" in rendered UI.
  -> detailView.unifyChainLabel [uc:uuid:e2807a7b-b72f-4030-97b6-67f73a043ae7]

- [ ] **BUG1 — BUG1: Chain section shows Task as its own chain node + mixes non-chain nodes.**
  [requirement:uuid:2d5f151e-c7a1-4599-a467-176ee6723b68]
  > TRON: "do you see the issues on this requirement and the need for change requests and bugs regarding traceability and stupid champagne marketing?"
  BUG: the Traceability Chain section in the detail-view shows the TASK as its OWN chain node (self-referential — the Task appears in its own traced chain) and mixes in non-chain nodes (all methods instead of chain-relevant only). The chain should show ONLY the singular traced path (req→uc→class→method→impl→test) — Task is NAVIGATION, not a chain node (locked 6-step standard). Ties to R20.5-A (chain shows only traced-chain nodes).
  -> detailView.chainExcludesSelf [uc:uuid:8dc64273-9148-4c04-ae2a-77f65ad6ad15]

- [ ] **R20.6a — R20.6a: Global SelectionModel — app-wide selection array singleton.**
  [requirement:uuid:2ad98e53-fa9d-4d20-b259-24f91f66e47a]
  > TRON: "create a selection model globally for the app. if nothing is selected currently, the default details drawer shows the chat in room. if a item view is clicked in the middle, its the selected item. if its clicked loooong its added to the selection array. the item view get highlighted as selected and active as css. dragging one drags all. long press toggles being in the selection or removed from the selection. this will completely dedup the multiple drawer implementations and consolidate the requirements related. the css highlight on the default drawer is just awkward. remove it as in the chat. keep the x to close the drawer." (atomic: R20.6a)
  A global SelectionModel exists as an app-wide singleton holding the current selection array of item IORs. All selection state flows through this model. Components observe it for changes.
  -> selectionModel.singleton [uc:uuid:2250545b-9259-414c-a5d9-7b9e4a3d5f91]

- [ ] **R20.6b — R20.6b: Nothing selected → default drawer shows in-room CHAT.**
  [requirement:uuid:4bc97fdc-d9a1-4104-9a09-f697abe9f98a]
  > TRON: "create a selection model globally for the app. if nothing is selected currently, the default details drawer shows the chat in room. if a item view is clicked in the middle, its the selected item. if its clicked loooong its added to the selection array. the item view get highlighted as selected and active as css. dragging one drags all. long press toggles being in the selection or removed from the selection. this will completely dedup the multiple drawer implementations and consolidate the requirements related. the css highlight on the default drawer is just awkward. remove it as in the chat. keep the x to close the drawer." (atomic: R20.6b)
  When SelectionModel.selection is empty (nothing selected), the default details drawer renders the in-room CHAT view. Chat is the default/fallback content of the drawer.
  -> selectionModel.emptyShowsChat [uc:uuid:842cffe0-22b2-40f5-be3f-03863fe55a59]

- [ ] **R20.6c — R20.6c: Tap item middle → single-select, shown in details drawer.**
  [requirement:uuid:c1dbd4c3-35b4-41e7-ac35-ed476b1b0cb6]
  > TRON: "create a selection model globally for the app. if nothing is selected currently, the default details drawer shows the chat in room. if a item view is clicked in the middle, its the selected item. if its clicked loooong its added to the selection array. the item view get highlighted as selected and active as css. dragging one drags all. long press toggles being in the selection or removed from the selection. this will completely dedup the multiple drawer implementations and consolidate the requirements related. the css highlight on the default drawer is just awkward. remove it as in the chat. keep the x to close the drawer." (atomic: R20.6c)
  Tapping/clicking an item view in the middle area sets it as the SINGLE selected item in SelectionModel (replacing any previous selection). The details drawer shows that item's detail view.
  -> selectionModel.tapSwitches [uc:uuid:aee56fad-9536-4b34-8f7a-95285c3dfc02]

- [ ] **R20.6d — R20.6d: Long-press toggles add/remove from selection array (multi-select).**
  [requirement:uuid:300a8952-2545-41e2-b974-1560fc9e46be]
  > TRON: "create a selection model globally for the app. if nothing is selected currently, the default details drawer shows the chat in room. if a item view is clicked in the middle, its the selected item. if its clicked loooong its added to the selection array. the item view get highlighted as selected and active as css. dragging one drags all. long press toggles being in the selection or removed from the selection. this will completely dedup the multiple drawer implementations and consolidate the requirements related. the css highlight on the default drawer is just awkward. remove it as in the chat. keep the x to close the drawer." (atomic: R20.6d)
  Long-pressing an item toggles it IN or OUT of the SelectionModel selection array. If not selected, adds it. If already selected, removes it. This enables multi-select without clearing existing selection.
  -> objectItem.longPressToggles [uc:uuid:47fc978b-92d6-40f1-bb12-cff173e2b751]

- [ ] **R20.6e — R20.6e: Selected items get CSS selected+active highlight.**
  [requirement:uuid:697965f7-c1da-4b68-9c8e-43e962a251d0]
  > TRON: "create a selection model globally for the app. if nothing is selected currently, the default details drawer shows the chat in room. if a item view is clicked in the middle, its the selected item. if its clicked loooong its added to the selection array. the item view get highlighted as selected and active as css. dragging one drags all. long press toggles being in the selection or removed from the selection. this will completely dedup the multiple drawer implementations and consolidate the requirements related. the css highlight on the default drawer is just awkward. remove it as in the chat. keep the x to close the drawer." (atomic: R20.6e)
  Every item in SelectionModel.selection gets a CSS class (e.g. .rb-selected + .rb-active) that visually highlights it as selected. Unselected items have no highlight.

- [ ] **R20.6f — R20.6f: Drag one selected item → drags ALL selected items.**
  [requirement:uuid:66a40392-ae1f-4fa6-91f2-e277deff5400]
  > TRON: "create a selection model globally for the app. if nothing is selected currently, the default details drawer shows the chat in room. if a item view is clicked in the middle, its the selected item. if its clicked loooong its added to the selection array. the item view get highlighted as selected and active as css. dragging one drags all. long press toggles being in the selection or removed from the selection. this will completely dedup the multiple drawer implementations and consolidate the requirements related. the css highlight on the default drawer is just awkward. remove it as in the chat. keep the x to close the drawer." (atomic: R20.6f)
  When dragging a selected item, ALL items in the current selection move together (multi-drag). The drag preview shows the count or all selected items. Single-select drag = single item drag (current behavior).

- [ ] **R20.6g — R20.6g: Consolidate multiple drawer implementations into one via SelectionModel.**
  [requirement:uuid:7cda92d6-3b75-41de-ad8f-b33df2dc21f6]
  > TRON: "create a selection model globally for the app. if nothing is selected currently, the default details drawer shows the chat in room. if a item view is clicked in the middle, its the selected item. if its clicked loooong its added to the selection array. the item view get highlighted as selected and active as css. dragging one drags all. long press toggles being in the selection or removed from the selection. this will completely dedup the multiple drawer implementations and consolidate the requirements related. the css highlight on the default drawer is just awkward. remove it as in the chat. keep the x to close the drawer." (atomic: R20.6g)
  CONSOLIDATE: chat drawer and details drawer are currently 3 SEPARATE drawer instances (trace-page L38, scenario-view L38, RoomView L160) with no global selection — each has its own drawer.ref. RoomView BYPASSES VerbRegistry (own click listener L198) and writes drawer.body.innerHTML directly (parallel path). Fresh detail-view per show (no reuse/diff, attr leaks). UNIFY all 3 drawer sites + RoomView bypass+direct-write into ONE selection-driven drawer path: central selectedItem observable (SelectionModel) drives a single drawer. Delete duplicate drawer code. ONE DRY drawer renders chat/detail/summary based on SelectionModel state.

- [ ] **R20.6h — R20.6h: Remove awkward CSS highlight on default drawer, keep X close.**
  [requirement:uuid:d6305209-43cb-4155-af45-0a9cf0daaf31]
  > TRON: "create a selection model globally for the app. if nothing is selected currently, the default details drawer shows the chat in room. if a item view is clicked in the middle, its the selected item. if its clicked loooong its added to the selection array. the item view get highlighted as selected and active as css. dragging one drags all. long press toggles being in the selection or removed from the selection. this will completely dedup the multiple drawer implementations and consolidate the requirements related. the css highlight on the default drawer is just awkward. remove it as in the chat. keep the x to close the drawer." (atomic: R20.6h)
  The default drawer has an awkward CSS highlight that doesn't match the chat drawer style. REMOVE this highlight (match the clean chat style). KEEP the X close button on the drawer.

- [ ] **BUG2 — BUG2: Short tap accumulates selection instead of switching to single-select.**
  [requirement:uuid:853d0c81-4157-45ab-80e1-7a3dc05d6895]
  > TRON: "clicking short on one after the other just selects the next ONE single selection (it switches) only long press adds to selection."
  > TRON (toggle-off): "and long press also toggles off the selection."
  BUG in delivered R20.6c+d: (1) short tap accumulates selection instead of SWITCHING — tapSingleSelect must clear() then select (result: size===1). (2) long-press does NOT toggle OFF — if item already selected, long-press should REMOVE it from selection (toggle off). Currently long-press only adds, never removes. FIX both: tap=clear+select(1), long-press=toggle(add if absent, remove if present).

- [ ] **BUG3 — BUG3: CSS regression — drawer layout must be grab-bar → actions → filename BELOW, not beside.**
  [requirement:uuid:8c1f37d1-414c-4b80-813e-c43df39eafb4]
  > TRON: "css regression. drawer bar, actions, name below [=desired/how-it-was]."
  CSS REGRESSION (v0.6.10 drawer consolidation): URL-file preview drawer layout broke — filename now renders BESIDE the action buttons and wraps badly. MUST be stacked vertically: grab-bar → actions row → filename BELOW (per Tron's 'name below' reference + IMG_4004 showing correct layout). The consolidation broke the flex-direction or element order.

- [ ] **BUG4 — BUG4: Deselect must return drawer to CHAT mode, not close it.**
  [requirement:uuid:76a2e5a4-5b40-4fd6-8c6a-e6561ca81e47]
  > TRON: "room opens with chat. good. selecting changes to content. deselecting does not change back to chat but closes the drawer completely."
  BEHAVIOR REGRESSION (v0.6.10 drawer consolidation): room opens with chat in drawer (correct per R20.6b). Selecting an item switches to detail content (correct per R20.6c). DESELECTING (tap selected item again or selection becomes empty) CLOSES the drawer entirely instead of returning to CHAT mode. Per R20.6b: empty selection = drawer shows chat. The drawer must NEVER close on deselect — it returns to chat.

- [ ] **R20.9 — R20.9: Landscape orientation uses the wide space — side-by-side panels instead of portrait stack.**
  [requirement:uuid:678ed4f1-23c2-4aa6-a230-e96a54f16285]
  > TRON: "landscape is unnecessarily wasting space. use it."
  In LANDSCAPE orientation, the layout MUST use the wide horizontal space — side-by-side panels (tree/list on LEFT + detail/drawer on RIGHT) instead of the portrait vertical stack (room-tree top + drawer bottom). Current portrait-stacked layout wastes space in landscape: cramped tree, narrow drawer, empty areas. Applies to room view + /trace + drawer. Responsive: portrait = vertical stack (current), landscape = horizontal side-by-side. Media query or orientation detection switches the layout.

- [ ] **R20.10 — R20.10: Selecting a ref opens the detail drawer for that item.**
  [requirement:uuid:0690ce5e-c783-4a8e-b927-ceaf7a815716]
  > Derived from R20.6c (tap→single-select→detail drawer) — the OPEN action specifically.
  When a user selects an item (via tap/click per R20.6c or SelectionModel change), the detail drawer MUST open and render that item's detail view. This is the OPEN-FOR-SELECTION action — the drawer transitions from closed/chat to showing the selected item's detail. Method: openForRef (0a902bff, extracted from attributeChangedCallback).
  -> detailDrawer.openForRef [uc:uuid:3d091420-0f5e-4247-9e4f-9fabd9543936]

- [ ] **R20.11 — R20.11: Drawer close action dismisses the drawer.**
  [requirement:uuid:c83f86f6-1b53-4a32-8461-d448e3139cdb]
  > Derived from existing drawer close UX — the ACTION of dismissing, not the CSS positioning of the button.
  The detail drawer MUST have a CLOSE ACTION that dismisses/hides the drawer entirely (e.g. tap X button, swipe-down dismiss). This is the close() method behavior — the drawer transitions from visible to hidden. Distinct from R19.33 (553be449 = the close AFFORDANCE stays STICKY, which is the CSS visual positioning of the X button, not the close ACTION itself). Method: close() (91efe513, rb-detail-drawer.ts:107).
  -> detailDrawer.close [uc:uuid:8d5182ba-bfd1-4a58-b31b-3190bcae15e9]

- [ ] **R20.12 — R20.12: Current Sprint pinned at TOP of the traceability sprint-list (app view).**
  [requirement:uuid:0171efa2-af28-476f-ae8d-ef7e4a4549bc]
  > TRON (v0.6.23 screenshot): sprint-list has no Current Sprint pinned at top. Planner-relayed as Tron-direct priority.
  The app's sprint-list view (rb-overview.ts) MUST render the CURRENT SPRINT as a pinned row at the TOP (ABOVE Sprint 01), with visually distinct styling (e.g. 📌 icon, highlight, bold). The pinned row names the current task (e.g. 'Sprint 20 — Drawer detail→v0.6.23'). This is the visible manifestation of the WIP=1 model in the app — the user always sees what's active NOW at the top of the list. Currently: sprint-list shows only numeric sprints 01-14 with no current-sprint pin.
  -> sprintList.pinCurrent [uc:uuid:5d0686e4-b8df-4d9a-b85c-d8d83cbac71e]

- [ ] **R20.13 — R20.13: CurrentSprint is a dedicated class that sets the chain and is used by planner's skill as planning+driving tool.**
  [requirement:uuid:c559452e-cd2e-4792-b28c-9f31b88ebbb4]
  > TRON: "the current sprint should be a dedicated class that is maintained and sets the chain by a planners skill to use it as planning and driving tool."
  CurrentSprint = a DEDICATED typed CLASS in the trace model (Object.verb pattern). It is MAINTAINED (kept current with the active WIP=1 work). It SETS THE CHAIN = defines the active narrow chain (req→uc→class→method→impl→test) for the current task. The PLANNER'S SKILL uses it as BOTH: (a) a PLANNING tool (define/set which chain is active — planner.setCurrentChain), and (b) a DRIVING tool (drive that chain across roles to delivery — planner.advanceChain). Methods: setChain(req,task), pinCurrent(), advance(), getActiveChain(). The class is a scenario unit (ior:class:CurrentSprint) maintained in the index.

- [ ] **R20.13.A — R20.13.A: Always-visible realtime view of the current task's full chain — status + assignee per hop, live-updated by planner skill.**
  [requirement:uuid:0665cb0a-895d-4a69-b712-8b2ec5ba3ff3]
  > TRON: "i want to see always the current task and its full traceability chain as you drive it with the team in realtime as data. reassigned and tracked and actualized by a planners skill."
  > TRON (concrete): "the same as on the first task always for the current one as a tree chain."
  The app MUST show an ALWAYS-VISIBLE, ALWAYS-EXPANDED tree-chain of the CURRENT TASK — the SAME task-tree-chain renderer already used in /trace (Sprint→Task→Req→UC→Class→Method→Impl→Test), REUSED (DRY, not a new widget), driven by CurrentSprint.getActiveChain(). Always-expanded: the pinned current-task shows its FULL chain tree (not collapsed). Realtime: current-sprint-changed event → re-render the tree. Per-hop status (done/active/pending) + assignee (role). Actualized by planner skill (setChain/advance/reassign update the data, tree reflects live). NOT a new component — the same rb-trace-tree task-chain rendering, always for the current task.

- [ ] **R20.14 — R20.14: Realtime Traceability Skill — CMM3 automated: bug/req fix-chain renders on /trace in realtime, zero manual steps.**
  [requirement:uuid:03e0a816-f92f-496e-b03e-2260a5ea2053]
  > TRON (18:09): "make it cmm3 automated as a skill… a realtime skill"
  Building a bug/requirement fix-chain MUST render on /trace in REALTIME as the team works — zero manual steps. A SKILL (CMM3 automated) drives this: when the team creates/advances a chain (req→UC→Class→Method→Impl→Test), the /trace view updates live without manual refresh or re-deploy. The skill orchestrates: capture req → architect UC+Class+Method → expert Impl → tester Test → each hop appears on /trace as it lands. This is the CurrentSprint.renderLiveChain (R20.13.A) driven by a skill that automates the chain-building lifecycle.

- [ ] **R20.17 — R20.17: /trace shows the current task(s) (CurrentSprint WIP) correctly.**
  [requirement:uuid:b7894ac3-8767-49f0-9ce9-b3ef2b4fc3bb]
  > TRON: "what its all about is still broken — still [want] current tasks"
  /trace MUST correctly show the CURRENT TASK(S) — the active WIP=1 task from CurrentSprint. Currently broken: the current task either doesn't appear, appears in wrong position, or its chain doesn't expand. This is the prerequisite for the realtime chain view (R20.13.A) — the current task must be findable and expandable in /trace.

- [ ] **R20.16 — R20.16: Test node in the chain displays its test-case STATUS (pass/fail badge).**
  [requirement:uuid:a43dbb8d-0644-46b8-b2c0-bd4604fdabac]
  > TRON: "i want to see the test case status on the test"
  The TEST node in a /trace chain MUST display its test-case STATUS as a visible badge — pass (green ✓) or fail (red ✗) with the result count (e.g. '5/5 PASS'). Currently the Test node shows only its name with no status indication. The status data comes from the Test scenario unit's model (last-run result, or live vitest output). Screenshot evidence: test-status-IMG_4040.png.

- [ ] **R20.19 — R20.19: Markdown is NOT source — /api/trace builds graph FROM scenario units, not MD.**
  [requirement:uuid:a7dcf3f8-7c01-421f-a58a-a13184796b20]
  > TRON: "THE MARKDOWN is NO SOURCE!!! its a view!!!"
  MARKDOWN IS NOT SOURCE — it is a GENERATED VIEW. /api/trace MUST build the traceability graph FROM scenario units (the index), NOT by scanning markdown files (scanRepo). Three phases: Phase1 = migrate 220 md-only chains to scenario units (done 5569cf504). Phase2 = switch /api/trace to unit-sourced graph building (parity: old results ⊆ new). Phase3 = drop scanRepo entirely. The scenario index is the source of truth; markdown is regenerated from it.
  -> traceGraph.buildFromIndex [uc:uuid:e5caaa7e-5068-4170-828c-e70bb5a165d1]

- [ ] **R20.20 — R20.20: Each describe()/it() test case = its own scenario unit (ior:class:TestCase).**
  [requirement:uuid:1e3f9799-943f-4716-b116-78a202301d02]
  > TRON: "trace the describe tests and the gates — add them as 1st class scenarios"
  Each describe()/it() block in a test file becomes its OWN first-class scenario unit (ior:class:TestCase) in the index. Not just a Test file-ref — individual test cases are addressable units. Links: Test → TestCase(s). Each TestCase stores: the describe/it name, file+line, last-run result (pass/fail), parent Test unit IOR. The chain extends: …→Test→TestCase(describe/it).
  -> testCase.parseFromSource [uc:uuid:e4f5b693-2150-4484-a021-e61f78674da3]

- [ ] **R20.21 — R20.21: Each verification gate = a scenario unit (ior:class:Gate) linked to its task/test.**
  [requirement:uuid:102ab818-ca11-4272-8ee8-74b9e4d8298a]
  > TRON: "trace the describe tests and the gates — add them as 1st class scenarios"
  > TRON (badge): "make the gate status visible on the gate item in the badge. NEW, Red, Green"
  Each verification GATE (deploy-gate, DET-3x, parity check, Tron-QA sign-off) becomes its OWN first-class scenario unit (ior:class:Gate) in the index. Links to the task/test it gates + records pass/fail status + timestamp + evidence. The chain extends: …→Test→TestCase→Gate; gates are queryable units showing what verification was applied and whether it passed. Types: deploy-gate, det-3x-gate, parity-gate, tron-qa-gate. BADGE: each Gate item renders with a STATUS BADGE — NEW (no verdict yet, grey/neutral), RED (verdict=FAIL), GREEN (verdict=PASS). The badge is visible on the rb-object-item in /trace tree and detail view.
  -> gate.recordVerdict [uc:uuid:37a27ef3-84bf-493e-9cf3-5c5f77ca8efb]

- [ ] **R20.22 — R20.22: Pinned Current Sprint = Sprint node with 3 tasks (current, last completed, next backlog), fully recursive children.**
  [requirement:uuid:ba274db6-8be8-4e10-bb7d-1633cf91a1c9]
  > TRON: "refactor the pinned current task. it should start with a pinned item of type sprint Current Sprint then 3 tasks: current, last completed, next in backlog, and fully recursively load their children in this special sprint node"
  Refactor the pinned current task: the pin MUST be a Sprint-type node labeled 'Current Sprint' containing exactly 3 Task children: (1) CURRENT = the active WIP/focus task, (2) LAST COMPLETED = the most recently done task, (3) NEXT IN BACKLOG = the next queued task. Each of these 3 tasks FULLY RECURSIVELY loads its children in this special sprint node (the complete chain: req→UC→Class→Method→Impl→Test expands under each task). This replaces the single-task pin (R20.12) with a 3-task context window.

- [ ] **R20.23 — R20.23: Every scenario type shows a source file:line link in the detail view.**
  [requirement:uuid:0bf80613-b27c-44e4-b467-7322876de66a]
  > TRON: "each type has a link to a source file:line, classes to the puml file and the resulting svg preview, same as methods to the puml AND the ts code, same as tests and gates"
  EVERY scenario type's detail view MUST show a clickable source file:line link — the file and line where the unit is defined/implemented. This is the universal base; per-type specializations (R20.24-27) add additional links. CLICKABLE in detail drawer: clicking the source file:line link NAVIGATES to the file browser at that file+line (Monaco opens at line). Not just displayed text — actual clickable navigation.

- [ ] **R20.24 — R20.24: Class detail links to its PUML file + rendered SVG preview.**
  [requirement:uuid:c3d6d560-217d-4cc1-8d61-4a25ee3543f1]
  > TRON: "each type has a link to a source file:line, classes to the puml file and the resulting svg preview, same as methods to the puml AND the ts code, same as tests and gates"
  A CLASS scenario unit's detail view MUST show: (a) link to the PlantUML .puml file where the class is defined, (b) rendered SVG preview of that PUML (inline or expandable). Both clickable/navigable. CLICKABLE in detail drawer: (a) clicking puml link opens the .puml file in browser/editor, (b) clicking SVG preview opens/expands the rendered SVG. Both navigable, not just text.

- [ ] **R20.25 — R20.25: Method detail links to PUML + TypeScript source code (file:line).**
  [requirement:uuid:f5b37dcd-9885-49b3-a234-cda6c627abce]
  > TRON: "each type has a link to a source file:line, classes to the puml file and the resulting svg preview, same as methods to the puml AND the ts code, same as tests and gates"
  A METHOD scenario unit's detail view MUST show: (a) link to the PlantUML .puml file where the method's use case is defined, (b) link to the TypeScript source code file:line where the method is implemented. Both clickable. CLICKABLE in detail drawer: (a) clicking puml link opens the .puml file, (b) clicking ts code link NAVIGATES to the TypeScript source at file:line (Monaco opens at that line). Both navigable.

- [ ] **R20.26 — R20.26: Test detail links to the test source file:line.**
  [requirement:uuid:2c514b18-93aa-496c-bfde-5dc5213c3fc9]
  > TRON: "each type has a link to a source file:line, classes to the puml file and the resulting svg preview, same as methods to the puml AND the ts code, same as tests and gates"
  A TEST scenario unit's detail view MUST show a clickable link to the test source file:line (the .test.ts or .spec.ts file and line where the test is defined). CLICKABLE in detail drawer: clicking the test file:line link NAVIGATES to the test source file at that line. Navigable, not just text.

- [ ] **R20.27 — R20.27: Gate detail links to its source/evidence.**
  [requirement:uuid:4d059f6a-aa3a-4e7a-8b8e-9c8729a7ee01]
  > TRON: "each type has a link to a source file:line, classes to the puml file and the resulting svg preview, same as methods to the puml AND the ts code, same as tests and gates"
  A GATE scenario unit's detail view MUST show a clickable link to its source/evidence — the verification artifact (test log, screenshot, deploy manifest, DET-3x output) that backs the gate's verdict. CLICKABLE in detail drawer: clicking the evidence link NAVIGATES to the verification artifact (log, screenshot, deploy manifest). Navigable, not just text.

- [ ] **R20.28 — R20.28: rb-file-detail shows 'Open in preview' + 'Open in new tab' buttons — rewire existing.**
  [requirement:uuid:607146d1-80d3-4aed-be81-b8eb4ebb43e1]
  > TRON: "the preview buttons are missing open in preview and open in new tab"
  The file detail view (rb-file-detail) MUST render two action buttons: (1) 'Open in preview' — opens the file in the ContentPreviewer (image→show as img, html→sandboxed iframe, per R19.64/65). (2) 'Open in new tab' — opens the file content/URL in a new browser tab (window.open target=_blank). These buttons existed in the earlier file/ProfileSheet-era implementation — they must be REWIRED into the current rb-file-detail component (not built from scratch).
  -> fileDetail.previewAndNewTabButtons [uc:uuid:62290aa8-48f5-41c9-b749-a7202c5c9940]

- [ ] **R20.29 — R20.29: Trace tree renders Method→Impl→Test→Gate chain matching the detail view.**
  [requirement:uuid:edb3c4fe-faaa-47c0-bed1-5b9bf8c14b83]
  > TRON (IMG_4060): trace tree must render Method→Impl→Test→Gate matching the detail (currently Method=0 in tree but detail traces impl).
  The /trace TREE must render the full chain from Method downward: Method→Impl→Test→Gate — matching what the detail view traces. Currently the tree shows Method with 0 children (no Impl/Test/Gate nodes expand under it) even though the detail view traces impl. The chain must complete to a green Gate in the tree AND populate the Last-Completed slot when gated. Tron evidence: IMG_4060 (Method=0 in tree but detail shows impl).

- [ ] **R20.30 — R20.30: Traceability Chain ≠ All Children — they must show DIFFERENT content.**
  [requirement:uuid:d7299c88-c56f-4686-a91f-c67bf78b8930]
  > TRON (IMG_4060): "Traceability Chain ≠ All Children — they must show DIFFERENT content."
  > TRON (precise spec): All Children = ALL child nodes (breadth). Traceability Chain = forward chain to current impl (depth).
  > TRON (prioritize+generalize): "prioritize the task to fix all children vs traceability in classes (and all other types)"
  > TRON (full depth): "traceability should not have only the one method but the chain down as much as it already exists"
  PRIORITIZED (Tron directive). The detail view Traceability Chain and All Children sections DIFFER by BREADTH vs DEPTH for ALL node types (Class, Method, UseCase, Requirement, Implementation, Test — every type, not just Class): (1) ALL CHILDREN = ALL child nodes of the node (breadth — every child, flat, matching badge count). (2) TRACEABILITY CHAIN = the forward CHAIN path to the CURRENT method's IMPLEMENTATION — the active-chain hop: the singular path through the chain-relevant child to its impl (depth — one path, deep). AC per type: open ANY type detail in a chain context → All Children lists ALL children (= badge); Traceability Chain shows only the singular chain path. They MUST differ. Evidence: r20.30-allchildren-eq-trace-IMG_4064.png (still RED for Class RbFileDetail).
  -> detailView.distinctSections [uc:uuid:d63bf19b-fbe2-4018-b995-b971f034e44b]

- [ ] **R20.31 — R20.31: vCard enrich+store — upload stores .vcf next to avatar, download adds date + geolocation maps link to NOTE.**
  [requirement:uuid:f3f26cab-792e-4e65-9cf8-98d907023396]
  > TRON: "on download vcard in the room you also add date and google maps location link to the notes"
  > TRON: "if the user uploaded a vcard store it next to the avatar and make that downloadable and add to the notes what i told you"
  THREE PARTS: (A) STORE: when a user uploads a .vcf vCard in a room, store it next to the avatar as an encrypted asset mirroring /api/avatar (server.ts:394-421 encryptFile pattern) → new category 'vcard' + POST /api/vcard endpoint, keyed by playerToken. (B) DOWNLOAD: ProfileSheet.downloadVCard (src/public/ts/ProfileSheet.ts:103-135) serves the stored vcard when one exists (instead of generating from scratch). (C) NOTE ENRICHMENT: the NOTE field (built at :127) appends: (i) DOWNLOAD DATE (ISO timestamp of when the download happens), (ii) GOOGLE MAPS LINK from the DOWNLOADER's GEOLOCATION (browser Geolocation API at download time → https://www.google.com/maps?q=LAT,LNG). Graceful fallback if geolocation denied (date still present, maps link omitted).
  -> vcard.enrichAndStore — store uploaded vCard next to avatar, downloadable, NOTE += download-date + geolocation maps link [uc:uuid:3d9daab4-b1b9-4e71-ad6a-330028434cb0]
