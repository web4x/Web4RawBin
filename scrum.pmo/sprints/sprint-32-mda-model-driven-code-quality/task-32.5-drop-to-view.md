<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.5: Drag itemView -> diagram VIEW (composed compartments, N-views=N-links, x/y, select/move)

[task:uuid:abaf9f83-978f-4722-af21-c2b0ee76b8a2]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 32 Planning](./planning.md)
    - Requirement R32.5 `[requirement:uuid:ec0e1754-a1f0-4959-b1d1-0e9bfeb6408d]`
  - down
    - None (atomic task)

## Task Description

Dropping an MDA-unit itemView onto a diagram creates a VIEW (e.g. a class view). Views contain COMPOSED views: a class UML SVG has an attribute compartment (attribute views), a methods compartment (method views), a properties compartment (getter/setter views). N diagrams can hold N views of the SAME unit -> each view = a LINK from the diagram to the unit (views are references, NOT copies - identity-by-reference, R25.7 kinship); the unit records its N diagram-links. Drop x,y = position; the view is then selectable + movable. ★ ACs are INITIAL (scenario-first per #126); the MDA-specific invariants (same-UUID-across-M-levels, PUML no-dup round-trip, action-sync) FINALIZE on architect (0.3) MDA-structure design - coordinating now. Chain (UC->Class->Method->Impl->Test) mints onto the built fix per the build order.

## Context

designRef: scrum.pmo/sprints/sprint-32-mda-model-driven-code-quality/PO-vision.md + design-mda-model.md

## Acceptance Criteria

- [ ] Dropping an itemView onto a diagram creates a VIEW of that unit at the drop x,y.
- [ ] A class view composes sub-views into UML compartments: attributes compartment (attribute views), methods compartment (method views), properties compartment (getter/setter views).
- [ ] N views of one unit across N diagrams = N diagram-LINKS recorded on the unit; views are references NOT copies (identity-by-reference, R25.7) - editing the unit reflects in all its views.
- [ ] A view records its drop x,y and is interactively SELECTABLE + MOVABLE (drag to reposition).
- [ ] INITIAL ACs (scenario-first #126); the MDA-structure invariants finalize on architect (0.3) design; chain mints onto built fix per the build order (R32.0->R32.8).

## Subtasks

None (atomic task).
