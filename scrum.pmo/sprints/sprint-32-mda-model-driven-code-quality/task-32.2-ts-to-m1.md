<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.2: TS -> M1 generation from the TypeScript compiler base structures

[task:uuid:8559098a-4c96-48f7-b4c3-82d8048f5ad4]

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
    - Requirement R32.2 `[requirement:uuid:4a9c6ee7-653f-4745-9d27-9540c5f95384]`
  - down
    - None (atomic task)

## Task Description

From the TS compiler API / AST, generate M1 scenario units for the TS base structures: class, interface, function, attribute, accessor+mutator (getter/setter = property), method (class member). Each generated M1 unit is instanceOf its M2 UML unit. ★ ACs are INITIAL (scenario-first per #126); the MDA-specific invariants (same-UUID-across-M-levels, PUML no-dup round-trip, action-sync) FINALIZE on architect (0.3) MDA-structure design - coordinating now. Chain (UC->Class->Method->Impl->Test) mints onto the built fix per the build order.

## Context

designRef: scrum.pmo/sprints/sprint-32-mda-model-driven-code-quality/PO-vision.md + design-mda-model.md

## Acceptance Criteria

- [ ] Running the generator over TS source produces M1 scenario units for class / interface / function / attribute / accessor+mutator(property) / method (class member) - one unit per TS structure.
- [ ] Each generated M1 unit is instanceOf the correct M2 UML unit (class->UML class, method->UML method, etc.).
- [ ] Re-running the generator on unchanged TS reuses the SAME-UUID M1 units (idempotent, no duplicate mint) - the single-source/generated law (R31.7/R31.13).
- [ ] INITIAL ACs (scenario-first #126); the MDA-structure invariants finalize on architect (0.3) design; chain mints onto built fix per the build order (R32.0->R32.8).

## Subtasks

None (atomic task).
