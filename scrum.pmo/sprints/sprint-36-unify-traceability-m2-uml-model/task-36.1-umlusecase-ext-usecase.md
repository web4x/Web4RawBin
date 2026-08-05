<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 36.1: UmlUseCase extends UseCase — new M2 view of the same scenario (A-merge, tree-preserving) [R36.1, projections build 3rd]

[task:uuid:cec4747a-e235-4e65-b59b-3f82f0cbeee3]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned — cluster R36.1 (projections, build 3rd after FOUNDATION + R36.3). UmlUseCase M2 metaclass + UseCase instanceOf facet (A-MERGE fork-A resolve-at-detail, ONE unit per use case); drag->UML-ellipse VIEW; usedIn. ★ HARD AC-tree-unchanged (Tron): pre/post-merge tree byte-diff==0 (reuse A2/R35.4 protect-the-tree). @390 real-WebKit gate + chain-complete-to-Test on ship.

## Traceability

  - up
    - [Sprint 36 Planning](./planning.md)
    - Requirement R36.1 `[requirement:uuid:e8fc62f9-5816-4eb1-938c-3db4b44bb803]`
  - down
    - None (atomic task)

## Task Description

MINT UmlUseCase as a M2 metaclass on disk (ABSENT today) — the existing UseCase ScenarioUnit gains instanceOf:[...,UmlUseCase] (typed OOP EXTENSION / VIEW, NOT a duplicate; the EXACT M2 instanceOf multi-facet mechanism M1 ModelElement already uses). TRON RULING A (MERGE 2026-08-05): the traceability UseCase unit IS the model element — gains the instanceOf facet + draggability + usage-refs IN PLACE; TsToModel RECONCILES any generated M1 into the SAME traceability unit (deterministic same-uuid by sourceFile::qualifiedName, or a modelElement link), ONE unit per real use case (no M1/traceability duplication). Drag->diagram = a Diagram view-link to the UseCase unit rendered as a UML use-case ellipse from its EXISTING data (name=Object.verb, class, method) — a VIEW, no copy. UseCase tracks usedIn[]. HARD CONSTRAINT (Tron): the merge MUST NOT disrupt/break the current tree.

## Acceptance Criteria

- [ ] (functional) UmlUseCase is minted as a M2 metaclass ON DISK (absent today); a UseCase unit carries instanceOf:[...,UmlUseCase] — typed OOP extension, NOT a duplicate.
- [ ] (functional) A-MERGE (fork-A resolve-at-detail, architect b08995a28): the traceability UseCase unit IS the model element (enriched with the instanceOf facet + draggability + usedIn IN PLACE); a generated M1 ModelElement reconciles to the SAME canonical unit by the DETERMINISTIC key sourceFile::qualifiedName (keyToUuid same-uuid) OR a modelElement<->baseUnit link, resolved at /api/ior — ONE unit per real use case, no duplication.
- [ ] (functional) Drag->diagram creates a Diagram view-link to the UseCase unit, rendered as a UML use-case ellipse FROM its existing data (name=Object.verb/class/method) — a VIEW, no copied data.
- [ ] (functional) The UseCase unit tracks usedIn[] (diagrams/folders it is placed on) — bidirectional with Diagram.views.
- [ ] (gate) HARD AC (Tron constraint, reuse A2/R35.4 protect-the-tree): /api/model/tree + rawbin children [ts,puml,diagrams,traceability] + sprint structure + EVERY existing node render BYTE-IDENTICAL before vs after merge (byte-diff==0). A merged element STILL shows at its current node — only its detail / /api/ior / Scenario / Edit / facet-views resolve to the ONE canonical unit; NO node added/removed/reordered/recounted. The MOF tree + traceability folder + /api/model/tree UNTOUCHED. GATE @390: pre/post-merge tree byte-diff==0.
- [ ] (gate) GATE @390 real-WebKit: UmlUseCase exists on disk (M2); a UseCase instanceOf it (ONE merged unit); drag renders the ellipse from unit data (no duplicate); usedIn bidirectional.

## Subtasks

None (atomic task).
