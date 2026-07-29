<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.6: Relationship views (attribute/getter/setter whose type is another unit)

[task:uuid:d14e3884-242a-4017-acc7-2daf0c47a688]

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
    - Requirement R32.6 `[requirement:uuid:c8bc0ee4-a6c0-497a-8510-da23f51902e8]`
  - down
    - None (atomic task)

## Task Description

An attribute / getter / setter whose type is ANOTHER class / type / interface / TS-type is rendered as a RELATIONSHIP view from the owning class view to that other unit's view. ★ ACs are INITIAL (scenario-first per #126); the MDA-specific invariants (same-UUID-across-M-levels, PUML no-dup round-trip, action-sync) FINALIZE on architect (0.3) MDA-structure design - coordinating now. Chain (UC->Class->Method->Impl->Test) mints onto the built fix per the build order.

## Context

designRef: scrum.pmo/sprints/sprint-32-mda-model-driven-code-quality/PO-vision.md + design-mda-model.md

## Acceptance Criteria

- [ ] When an attribute/getter/setter has a type that is another modeled unit (class/type/interface/TS-type), a RELATIONSHIP view is rendered from the owner to that unit.
- [ ] The relationship resolves to the SAME-UUID target unit (identity-by-reference), not a copy.
- [ ] INITIAL ACs (scenario-first #126); the MDA-structure invariants finalize on architect (0.3) design; chain mints onto built fix per the build order (R32.0->R32.8).

## Subtasks

None (atomic task).
