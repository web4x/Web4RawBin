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
- [ ] QA Review
- [ ] Done

## Remaining Issues

HEADLESS-COMPLETE + item-1 REVEAL now MACHINE-GATED (tester 19b0bbfee GREEN DET-3x served v0.8.20, expandPath fix 816ecad4f, cache-bust ebb0e0974; reveal no longer Tron-held). OPEN (QA-Review, NOT Done) SHRUNK to TRON-CONFIRM ONLY: (a) owner-gated create-POST write (tap Add on device -> server creates -> node appears) + (b) AC-390-pixel go-live. All 4 items logic + reveal-render machine-gated GREEN; awaiting Tron create-confirm.

## Traceability

  - up
    - [Sprint 33 Planning](./planning.md)
    - Requirement R33.5 `[requirement:uuid:3c99ce28-a6e6-4950-8fad-3cd872a7cf8b]`
  - down
    - None (atomic task)

## Task Description

Four UX refinements on the WORKING R33.3 interactive diagram editor (mostly reuse/wiring, no fork), from Tron device-QA (IMG_4778/4779). (1) Add-Diagram refreshes the tree so the new empty diagram node appears under diagrams/ immediately. (2) Selecting a box IN the diagram navigates/highlights that class in the TREE and KEEPS the diagram in the drawer (class-detail opens ONLY on a TREE click, not a box-click). (3) Dragging a SELECTED box MOVES it with NO pan; pan only when nothing selected (disambiguate by selection-state). (4) The puml/ folder is populated by enumerating the ~55 EXISTING SOURCE .puml design files (scrum.pmo/sprints/*/diagrams/) as itemviews; click -> Import via R32.7 pumlToModel (Tron-ruled 2026-07-31 = option a). Mixed CLIENT (items 1-3) + SERVER (item 4). Architect design: design-mof-tree.md ## R33.5 (1a39feb91).

## Acceptance Criteria

- [ ] INV-R33.5-1 (item 1, add-shows) — Add-Diagram creates an empty Diagram AND the new node immediately appears/reveals under diagrams/ (logic + REVEAL-RENDER now MACHINE-GATED GREEN DET-3x served v0.8.20, Test 19b0bbfee/marker 53c65a35 — expandPath type:uuid fix 816ecad4f; ★ remaining Tron-confirm = the OWNER-GATED CREATE-POST write only: tap Add on device -> server creates -> node appears).
- [x] INV-R33.5-2 (item 2, diagram-stays) — selecting a box sets a diagram-LOCAL selection (highlights the box + navigates the tree) and KEEPS the diagram in the drawer; class-detail opens ONLY on a TREE click (logic GREEN DET-3x).
- [x] INV-R33.5-3 (item 3, drag-disambig) — pan is gated by SELECTION STATE: a selected box drags/moves with NO pan; pan only when nothing is selected (logic GREEN DET-3x).
- [x] INV-R33.5-4 (item 4, puml-populated) — the puml/ folder enumerates the ~55 existing source .puml as itemviews (server mofChildren rawbin:puml, Tron opt-a); click -> Import via R32.7 pumlToModel (logic GREEN DET-3x, backstop PASS v0.8.19).
- [ ] AC-390-pixel-gate — GATE @390 on Tron REAL interaction (screenshot + pixel, planted-defect bite — NOT 'loads'). ★ Tron @390 pixel go-live pending (the honest open gate → Done).

## Subtasks

None (atomic task).
