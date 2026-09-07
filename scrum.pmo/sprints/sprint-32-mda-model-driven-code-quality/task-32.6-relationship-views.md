<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.6: Relationship views (attribute/getter/setter whose type is another unit)

[task:uuid:d14e3884-242a-4017-acc7-2daf0c47a688]

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
    - Requirement R32.6 `[requirement:uuid:c8bc0ee4-a6c0-497a-8510-da23f51902e8]`
  - down
    - None (atomic task)

## Task Description

An attribute / getter / setter whose type is ANOTHER class / type / interface / TS-type is rendered as a RELATIONSHIP view from the owning class view to that other unit's view. ★ ACs are INITIAL (scenario-first per #126); the MDA-specific invariants (same-UUID-across-M-levels, PUML no-dup round-trip, action-sync) FINALIZE on architect (0.3) MDA-structure design - coordinating now. Chain (UC->Class->Method->Impl->Test) mints onto the built fix per the build order.

## Context

designRef: scrum.pmo/sprints/sprint-32-mda-model-driven-code-quality/PO-vision.md + design-mda-model.md

## Acceptance Criteria

- [ ] **(functional)** Edges are drawn from the model `relatesTo` (R32.5-generated typed attr/getter/setter -> element Y): for each rendered box (unit X), read X.relatesTo[] and draw an edge X->Y IFF Y is ALSO a box on THIS diagram (both endpoints visible). A relatesTo to an OFF-diagram element is SKIPPED - no dangling edge. Units are untouched (the edge reads relatesTo; same-UUID target, identity-by-reference).
- [ ] **(functional)** The arrowhead/style is chosen by the relationship's M2 metaclass (its instanceOf): UmlGeneralization (extends/implements) -> solid line + HOLLOW TRIANGLE at the target; UmlAssociation (typed attr/getter/setter) -> solid line + open/plain arrow; UmlDependency -> DASHED line + open arrow. One <defs> marker set; each edge picks its marker by kind.
- [ ] **(functional)** Edges are an ADDITIVE second SVG pass in rb-diagram-detail (after the R32.4 boxes), drawn as <path>/<line> in the SAME <svg> group as the boxes so RbPanZoom transforms edges WITH the nodes (pan/zoom for free, R31.6). Edges connect box borders (center-to-center clipped to each box x,y,w,h) and render BEHIND box fills (z-order) so boxes stay readable. NO surface/drawer fork.
- [ ] **(functional)** Clicking an edge -> selectionModel.select the relationship/member ref -> the SHARED drawer shows its relationship detail (standard selection flow, same as a node click). No capture-hook, no fork; units untouched.
- [ ] **(functional)** Edges are de-duplicated by (from, to, kind) via a Set (R31.11/R31.13 discipline) so re-render is stable and idempotent - 0 duplicate edges on re-render.
- [ ] **(functional)** The relationship edges deferred from R32.4 (AC-edges-excluded) AND R32.3 are now RENDERED here - R32.6 closes that deferral, realizing the relationship VIEW (viewKind 'relationship', from/to = the two element refs; R32.6 core derives it on-the-fly from relatesTo between visible boxes; a persisted relationship view-link is the drop-authored form).
- [ ] **(functional)** Reuse-only: the R32.4 rb-diagram-detail surface + RbPanZoom + the model relatesTo (R32.5-generated) + the M2 relationship metaclasses - NO fork of the surface or drawer. The only new code is the additive edge pass + the marker <defs>.
- [ ] **(functional)** R32.4's boxes still render exactly as before, and /trace + Server Manager + room detail-views stay UNREGRESSED (the edge pass is purely additive - no drawer/surface mechanics changed). Regression-green is part of acceptance. Gate on the R32.5 demo diagram faa4acad (Circle/Point/Shape: generalization=hollow-triangle for Shape-implements, association/dependency for typed members).

## Subtasks

None (atomic task).
