# Sprint 33 — R33.5 diagram UX polish (Tron device-QA, 2026-07-31, IMG_4778/4779)

**Tron: "wow. pretty amazing delivery!!! now we are just on ux improvements."** The working interactive diagram (R33.3) is DELIVERED + device-confirmed (IMG_4778 = real UML: Shape/Point/Circle w/ compartments + relationship edges + pan/zoom + Re-Sync). These 4 are UX refinements on top.

## THE 4 UX ITEMS (scenario-first; gate @390 Tron REAL interaction, per the re-scope discipline)
1. **AC-add-diagram-creates-itemview** — the "Add Diagram" button prompts for a name but does NOT add a new diagram itemview to the `diagrams` folder. FIX: Add-Diagram creates the Diagram in MODEL_STORE parented to `diagrams/` AND the new (empty) diagram node APPEARS in the tree under `diagrams/` immediately (ready to drop classes into). (The /create endpoint exists — wire the tree-refresh/append so it shows.)
2. **AC-class-select-keeps-diagram** — selecting a class box IN THE DIAGRAM currently opens the class-detail AND SWAPS OUT the diagram (diagram gone from UX). FIX: selecting a class box in the diagram NAVIGATES/highlights that class in the TREE (does NOT swap the drawer to class-detail); the class-detail opens ONLY when the class is clicked IN THE TREE. The diagram stays visible on box-select. (Decouple in-diagram-box-select from the drawer-detail-swap.)
3. **AC-drag-selected-no-pan** — dragging a SELECTED class box ALSO pans the diagram (both fire). FIX: pan ONLY if nothing on the diagram is selected; if a box IS selected, drag MOVES the box (no pan). Disambiguate box-drag vs canvas-pan by selection state (extends the R33.3 RbPanZoom-disambiguation).
4. **AC-puml-folder-populated** — the `puml/` folder is EMPTY. FIX: add itemviews for the existing .puml files (the 55 in scrum.pmo/sprints/*/diagrams/, or the project's .puml set) under the `puml/` folder — like the `ts/` folder holds the ts files. (Ties to Import-PUML feature D; the puml/ folder should surface the existing .puml source files as itemviews.)

## ROUTE (measure-first, scenario-first)
- **architect**: MEASURE each vs current code (rb-diagram-detail select/drag handlers, Add-Diagram /create + tree-refresh, puml-folder population under mofChildren) → design the 4 fixes (mostly reuse/wiring — the R33.3 editor exists). ~60% has runway.
- **req**: formalize as R33.5 (diagram UX polish) ACs + UUIDs. Gate = @390 Tron REAL interaction (add→see-node / select-box→tree-nav-diagram-stays / drag-selected→moves-no-pan / puml-folder→shows-items), screenshot+pixel.
- **expert**: build per design. **tester**: @390 gate each interaction, planted-defect bite.
Ref: IMG_4778 (working diagram) + IMG_4779 (class-select swaps diagram = item 2).
