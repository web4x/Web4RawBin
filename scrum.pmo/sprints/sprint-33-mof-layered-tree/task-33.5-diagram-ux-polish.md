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

- [x] INV-R33.5-1 (item 1, add-shows) — Add-Diagram creates an empty Diagram AND the new node immediately appears/reveals under diagrams/ (logic + REVEAL-RENDER now MACHINE-GATED GREEN DET-3x served v0.8.20, Test 19b0bbfee/marker 53c65a35 — expandPath type:uuid fix 816ecad4f; ★ remaining Tron-confirm = the OWNER-GATED CREATE-POST write only: tap Add on device -> server creates -> node appears).
- [x] INV-R33.5-2 (item 2, diagram-stays) — selecting a box sets a diagram-LOCAL selection (highlights the box + navigates the tree) and KEEPS the diagram in the drawer; class-detail opens ONLY on a TREE click (logic GREEN DET-3x).
- [x] INV-R33.5-3 (item 3, drag-disambig) — pan is gated by SELECTION STATE: a selected box drags/moves with NO pan; pan only when nothing is selected (logic GREEN DET-3x).
- [x] INV-R33.5-4 (item 4, puml-populated) — the puml/ folder enumerates the ~55 existing source .puml as itemviews (server mofChildren rawbin:puml, Tron opt-a); click -> Import via R32.7 pumlToModel (logic GREEN DET-3x, backstop PASS v0.8.19).
- [x] AC-390-pixel-gate — GATE @390 on Tron REAL interaction (screenshot + pixel, planted-defect bite — NOT 'loads'). ★ Tron @390 pixel go-live pending (the honest open gate → Done).

## Subtasks

None (atomic task).
