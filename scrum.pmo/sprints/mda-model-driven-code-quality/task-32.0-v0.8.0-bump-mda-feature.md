<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.0: v0.8.0 bump + MDA modeling registered as a FeatureManager feature

[task:uuid:2601bb4a-077a-4e24-a96c-89846ad8bef2]

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
    - Requirement R32.0 `[requirement:uuid:68aa36fe-f3c7-452c-b5cb-619f7c84bee4]`
  - down
    - None (atomic task)

## Task Description

Bump to v0.8.0 via the single-source Config unit (R31.7) -> build -> deploy served==committed==0.8.0; and register/enter the Sprint 32 MDA modeling capability as a FeatureManager feature (R31.8). ★ ACs are INITIAL (scenario-first per #126); the MDA-specific invariants (same-UUID-across-M-levels, PUML no-dup round-trip, action-sync) FINALIZE on architect (0.3) MDA-structure design - coordinating now. Chain (UC->Class->Method->Impl->Test) mints onto the built fix per the build order.

## Context

designRef: scrum.pmo/sprints/sprint-32-mda-model-driven-code-quality/PO-vision.md + design-mda-model.md

## Acceptance Criteria

- [x] The Config unit version is 0.8.0; build stamps it single-source (R31.7); served==committed==SW==0.8.0 (R31.13 deterministic).
- [x] The MDA modeling capability is registered/entered as a FeatureManager feature (R31.8) - owner-gated feature entry, appears in the feature grid.
- [x] INITIAL ACs (scenario-first #126); the MDA-structure invariants finalize on architect (0.3) design; chain mints onto built fix per the build order (R32.0->R32.8).

## Subtasks

None (atomic task).
