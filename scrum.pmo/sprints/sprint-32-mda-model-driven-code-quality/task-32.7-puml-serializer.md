<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.7: PUML serializer/parser (diagram <-> .puml, no-dup, same-UUID round-trip)

[task:uuid:f7a635b2-60c7-44f2-9ea6-48c8d9632000]

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
    - Requirement R32.7 `[requirement:uuid:b1fef048-dc5c-4315-b410-12a724968234]`
  - down
    - None (atomic task)

## Task Description

Serialize diagrams to .puml WITHOUT duplication (don't emit a puml class twice); parse .puml back. Treat a puml class as BOTH an M2 instanceOf Class AND an M1 instanceOf puml-class-code, SAME UUID across M-levels - round-trippable identity: parse an existing .puml -> REUSE the same-UUID unit, don't re-mint. ★ ACs are INITIAL (scenario-first per #126); the MDA-specific invariants (same-UUID-across-M-levels, PUML no-dup round-trip, action-sync) FINALIZE on architect (0.3) MDA-structure design - coordinating now. Chain (UC->Class->Method->Impl->Test) mints onto the built fix per the build order.

## Context

designRef: scrum.pmo/sprints/sprint-32-mda-model-driven-code-quality/PO-vision.md + design-mda-model.md

## Acceptance Criteria

- [ ] **(functional)** AC1 - model -> a valid .puml (@startuml...@enduml): every modeled element (class/interface + members + relations) is emitted EXACTLY ONCE (no duplication).
- [ ] **(functional)** AC2 - re-exporting the same model is BYTE-IDENTICAL: idempotent, deterministic emission order (stable sort), so export(model) == export(model) byte-for-byte.
- [ ] **(functional)** AC3 - a .puml PARSES back into MDA M1 units + diagram views (import): classes/members/relations -> ModelElement units + a Diagram with view-links.
- [ ] **(functional)** AC4 / INV-P1 SAME-UUID-ACROSS-M-LEVELS: a puml class is M2-instanceOf-Class + M1-instanceOf-puml-class-code carrying ONE uuid derived DETERMINISTICALLY (the R32.2 sourceFile::qualifiedName law) - one identity across the M-levels, not a uuid-per-level fork.
- [ ] **(functional)** AC5 / INV-P2: parsing an EXISTING .puml REUSES the same-UUID unit (deterministic key -> bindByUuid re-bind, never re-mint) - no duplicate units on re-import.
- [ ] **(functional)** AC6 / INV-P3: parse -> serialize -> parse is IDENTITY-PRESERVING (round-trip stable BY CONSTRUCTION) - the second parse yields the same units + the same .puml as the first.
- [ ] **(functional)** AC7 / INV-P4: import mutates ONLY the isolated model-store (data/model-store), NEVER prod scenario/index (the R32.5 safe-mechanism law) - gate-able: prod ModelElement count unchanged after import.
- [ ] **(functional)** AC8 - edge kinds ROUND-TRIP: generalization/association/dependency <-> the PUML arrows <|-- / --> / ..> (mirrors the R32.6 EDGE_DEFS) - export writes the right arrow per M2 kind, import resolves the arrow back to the right relationship metaclass.

## Subtasks

None (atomic task).
