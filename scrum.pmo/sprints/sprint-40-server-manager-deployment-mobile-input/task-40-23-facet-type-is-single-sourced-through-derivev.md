<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.23: Facet-type is single-sourced through deriveV

[task:uuid:c61eae9d-6c4c-46e3-8557-5bbcadc34d16]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.23 (Facet-type is single-sourced through deriveV). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.23; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(route-all-sites)** TsToModel.ts:285 routes its element->viewKind through deriveViewKind (not an incidental class-only default).
- [ ] **(route-all-sites)** server.ts:2301 import-puml routes its element->viewKind through deriveViewKind.
- [ ] **(explicit-unknown)** The client facetKind fallback becomes an EXPLICIT-UNKNOWN facet (distinct rendering, or refuse) instead of node.kind||'class' — an unknown ior-class never silently renders as a class box.
- [ ] **(family-lint-stub-must-fail)** A FAMILY LINT asserts NO hardcoded viewKind and NO silent 'class' outside deriveViewKind, and is proven non-vacuous by a STUB-MUST-FAIL bite (introduce a hardcode -> lint goes RED).

## Subtasks
