<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 33.5: Diagram UX polish on the working R33.3 editor (add-shows / select-keeps-diagram / drag-no-pan / puml-populated)

[task:uuid:b1a688ff-ee9b-49df-a89e-f0c8bf17b8ce]

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

DONE: all 4 items real-WebKit @390 self-gated GREEN DET-3x + chain-complete-to-Test. items 2/3/4 = r335-ux-polish WK=1 (Tests 68165531/fc65297a/6b647166; item3 re-gated GREEN c6c1891c5 harness-drift-fix). item-1 = FULLY WebKit @390 GREEN via engine-swap d5c0b80f0 (r335b create-POST+no-reload LOGIC + r335c tree-refresh REVEAL renders 0->2 real diagrams, WK=1 mock-owner = PO-authorized self-gate superseding earlier Tron-held via 816ecad4f expandPath fix; Impl ffdd9347 addDiagramRefresh tests[]=[a5882399, 53c65a35]). AC-390-pixel umbrella closed by the WebKit self-gates (Safari 605.1.15 = Tron iPhone engine; Tron = spot-checker). served==HEAD 0.8.37. Team-gated at Tron real engine -> Done. S33 14/14 COMPLETE.

## Traceability

  - up
    - [Sprint 33 Planning](./planning.md)
    - Requirement R33.5 `[requirement:uuid:3c99ce28-a6e6-4950-8fad-3cd872a7cf8b]`
  - down
    - None (atomic task)

## Task Description

Four UX refinements on the WORKING R33.3 interactive diagram editor (mostly reuse/wiring, no fork), from Tron device-QA (IMG_4778/4779). (1) Add-Diagram refreshes the tree so the new empty diagram node appears under diagrams/ immediately. (2) Selecting a box IN the diagram navigates/highlights that class in the TREE and KEEPS the diagram in the drawer (class-detail opens ONLY on a TREE click, not a box-click). (3) Dragging a SELECTED box MOVES it with NO pan; pan only when nothing selected (disambiguate by selection-state). (4) The puml/ folder is populated by enumerating the ~55 EXISTING SOURCE .puml design files (scrum.pmo/sprints/*/diagrams/) as itemviews; click -> Import via R32.7 pumlToModel (Tron-ruled 2026-07-31 = option a). Mixed CLIENT (items 1-3) + SERVER (item 4). Architect design: design-mof-tree.md ## R33.5 (1a39feb91).

## Acceptance Criteria

- [ ] **(functional)** Clicking Add-Diagram creates an empty Diagram (POST /api/model/diagram/create) AND immediately refreshes the diagrams/ folder so the new diagram node APPEARS in the tree without a manual reload (reuse the rb-model-resynced / tree-reload pattern rb-trace-tree already listens to, or re-fetch /api/trace/children/rawbin:diagram + re-render that folder). The new empty diagram is ready to drop into.
- [ ] **(functional)** Selecting a box inside the diagram sets a diagram-LOCAL selection (highlights the box) and navigates/highlights that class in the TREE (reuse the existing reveal - tree-reveal event / location.hash), but does NOT call selectionModel.replaceWith, so the shared selection is untouched and the drawer STAYS on the diagram. Class-detail opens ONLY on a TREE click (unchanged). In-diagram box-select is decoupled from the drawer detail-swap.
- [ ] **(functional)** Pan is gated by SELECTION STATE: when a box is selected the canvas does NOT pan (RbPanZoom disabled via a new setEnabled(false) while a box is selected); dragging the selected box MOVES it (existing wireBoxDrag); dragging empty canvas (nothing selected) pans; clicking empty canvas clears the selection and re-enables pan. The selection-state gate subsumes the target-based edge that leaked pan @390.
- [ ] **(functional)** The puml/ folder is POPULATED by enumerating the ~55 EXISTING SOURCE .puml design files (scrum.pmo/sprints/*/diagrams/) as itemviews (mirror the ts/ file enumeration in mofChildren rawbin:puml, server-side). Clicking an itemview IMPORTS that .puml (reuse the R32.7 pumlToModel parser, already imported server.ts:32) into an interactive diagram (the R33.3 editor). ★ TRON-DECIDED 2026-07-31 = option (a) existing source .puml; the generated puml-as-code (b, via R32.7 modelToPuml) is a separate later concern, NOT this AC. Server-side mofChildren change -> real restart on ship.
- [ ] **(gate)** GATE @390 on Tron REAL interaction (screenshot + pixel, planted-defect bite - NOT 'loads'): (1) Add-Diagram -> new node appears under diagrams/; (2) select a box -> the tree highlights the class AND the diagram STAYS (drawer not swapped), class-detail only on tree-click; (3) drag a selected box -> it moves with NO pan, drag empty canvas -> it pans; (4) puml/ -> shows the .puml itemviews. Mixed client+server -> verified after a REAL server restart + boot-verify (R31.7 invariant).

## Subtasks

None (atomic task).
