<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.4: Interactive SVG diagram surface in the details drawer (responsive, pan/zoom)

[task:uuid:6a946cd2-7c78-4d9f-a720-2894b14ae0a3]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 32 Planning](./planning.md)
    - Requirement R32.4 `[requirement:uuid:496936cb-d0ea-4c0e-a6d3-b6e9c7189fc7]`
  - down
    - None (atomic task)

## Task Description

Interactive SVG diagrams live in the DETAILS DRAWER (rb-detail-drawer reuse), all responsive sizes, with pan + pinch-zoom (RbPanZoom reuse) like any other svg/image/html viewer in the details compartment. A blank diagram is a drop TARGET. ★ ACs are INITIAL (scenario-first per #126); the MDA-specific invariants (same-UUID-across-M-levels, PUML no-dup round-trip, action-sync) FINALIZE on architect (0.3) MDA-structure design - coordinating now. Chain (UC->Class->Method->Impl->Test) mints onto the built fix per the build order.

## Context

designRef: scrum.pmo/sprints/sprint-32-mda-model-driven-code-quality/PO-vision.md + design-mda-model.md

## Acceptance Criteria

- [ ] **(functional)** The SVG diagram SURFACE is a DRAWER DETAIL-VIEW: a NEW rb-diagram-detail element (like rb-terminal-detail/rb-class-detail) registered in the rb-detail-drawer tagMap for a `diagram:` ref, mounted via the STANDARD selection->renderDetailForRef flow - NOT showElement, NOT a bespoke overlay (the R31.12 no-fork law, exact fork R31.4 retired). It inherits the drawer's responsive position (R31.9: bottom portrait / inline landscape) + open/close/expand by construction. Selecting a diagram:<D> ref renders the surface.
- [ ] **(functional)** NODES = the Diagram unit's ordered Layer-2 `views[]` view-links: each `{ unit:'modelelement:X', x, y, w?, h?, viewKind:'class' }` -> ONE SVG UML class box at (x,y) with 3 compartments (name / attributes / methods) built from X's `members`; the box KIND + icon come from X's M2 MODEL-facet (same modelFacetType as R32.3). viewKind attr/method/prop = inner rows.
- [ ] **(functional)** Position lives on the view-LINK (x,y), NOT the unit: the box reads the UNIT for content but a move mutates x,y on the view-link ONLY - the ModelElement unit is untouched (R25.7 identity-by-reference). One unit can appear in many diagrams at different positions.
- [ ] **(functional)** The surface supports pan + pinch-zoom via RbPanZoom.applyPanZoom (the ratified R31.6 shared pan/zoom base: viewBox + CSS-transform on the viewport) - NO new/forked pan/zoom code.
- [ ] **(functional)** A ResizeObserver fits the surface to the drawer box (the same fit pattern as the R31.4 terminal); the surface just fills the already-CSS-responsive drawer at all sizes.
- [ ] **(functional)** Clicking an SVG box -> selectionModel.clear(); selectionModel.select('modelelement:X') -> selection-changed -> the SHARED drawer renders X's node detail (the R32.3 / standard detail flow, identical to the room/Server Manager pane-click). No capture-hook, no fork.
- [ ] **(functional)** EDGES (relatesTo -> UmlAssociation/UmlGeneralization) are EXCLUDED from R32.4 - they are R32.6. A view-link of viewKind 'relationship' is skipped by the R32.4 surface. R32.4 scope = SURFACE + NODES only.
- [ ] **(functional)** The shared rb-detail-drawer stays UNREGRESSED: /trace, Server Manager, and room detail-views open + render exactly as before, because the tagMap `diagram` entry is ADDITIVE (R31.12 no-fork law - no drawer mechanics touched). Regression-green is part of acceptance.

## Subtasks

None (atomic task).
