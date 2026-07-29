<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.1: MDA MoF 3-level scenario model (M3/M2/M1, same-UUID across levels)

[task:uuid:f6165590-6f13-4f4a-8ef8-de738ad526dc]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 32 Planning](./planning.md)
    - Requirement R32.1 `[requirement:uuid:05c26eb8-2276-473e-b9f1-18cef4cca7cb]`
  - down
    - None (atomic task)

## Task Description

MDA MoF 3-level scenario model as ONE unit type ior:class:ModelElement (architect design eb64a6523, PO-accepted): model{uuid, metaLevel:M3|M2|M1, kind:class|interface|attribute|property|method|function|type|relationship, name, instanceOf:ObjectRef[] (multi-facet, reverse instances), members[] (reverse memberOf), relatesTo[] (reverse relatedFrom), diagramViews[] (reverse viewsUnit)}. M3 = Class + Relationship (reflexive: Class instanceOf Class). M2 = UML profile instanceOf M3 (UmlClass/Interface/Attribute/Method/Property/Function/Type instanceOf Class; UmlAssociation/Generalization/Dependency instanceOf Relationship; ts-class-code/puml-class-code instanceOf Class). M1 = real TS structures instanceOf M2. ★ SAME-UUID-ACROSS-LEVELS: one UUID is the identity across model/diagram/puml/ts representations; multi-facet instanceOf (e.g. X.instanceOf=[UmlClass, ts-class-code]). Reuses TraceModel (type:uuid refs + multi-ref bidirectional links + TraceGraph dup-UUID-reject) = NO schema fork. Correct-by-construction via 5 gate assertions (below), each chain-to-Test.

## Context

designRef: scrum.pmo/sprints/sprint-32-mda-model-driven-code-quality/PO-vision.md + design-mda-model.md

## Acceptance Criteria

- [ ] The model is ONE unit type ior:class:ModelElement with {uuid, metaLevel M3|M2|M1, kind, name, instanceOf[] (reverse instances), members[] (reverse memberOf), relatesTo[] (reverse relatedFrom), diagramViews[] (reverse viewsUnit)} - reuses TraceModel refs + bidirectional links (no schema fork).
- [ ] GATE 1 UUID-unique: no uuid appears twice on disk (TraceGraph dup-UUID-reject) - one identity per element.
- [ ] GATE 2 level-integrity: every instanceOf points EXACTLY one meta-level up (M1->M2, M2->M3); M3 is reflexive (Class instanceOf Class); NO level skip and NO downward instanceOf.
- [ ] GATE 3 instanceOf non-empty: every M2 and M1 unit has >=1 instanceOf; M3 units self-type (Class instanceOf Class, Relationship instanceOf Class).
- [ ] GATE 4 serialization-embeds-UUID: every .puml / .ts emission of element X carries X.uuid, so a round-trip RE-BINDS to the same unit and NEVER re-mints (the no-duplication law).
- [ ] GATE 5 same-UUID-cross-representation: an element present in >=2 representations (model / diagram / puml / ts) shows the SAME uuid in each; multi-facet instanceOf (e.g. instanceOf=[UmlClass, ts-class-code]) is one identity.
- [ ] ACs FINALIZED to architect design eb64a6523 (PO-accepted). On this mint, architect wires the M3/M2 seed units + the identity-validator design for the expert build; chain mints onto the built validator + seed.

## Subtasks

None (atomic task).
