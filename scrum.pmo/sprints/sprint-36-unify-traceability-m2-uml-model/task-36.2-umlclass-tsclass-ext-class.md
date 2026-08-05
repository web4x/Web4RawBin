<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 36.2: UmlClass + tsClass extend Class — two facet-lens views of ONE Class (A-merge, tree-preserving) [R36.2, projections build 3rd]

[task:uuid:58596fcc-781f-444b-9730-ca7e3db5f5e0]

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

Planned — cluster R36.2 (projections, build 3rd after FOUNDATION + R36.3). Class instanceOf[UmlClass, ts-class-code] two facet-lens VIEWS (A-MERGE fork-A resolve-at-detail, ONE unit per class); both draggable render-from-one-unit; usedIn bidirectional. ★ HARD AC-tree-unchanged (Tron): pre/post-merge tree byte-diff==0 (reuse A2/R35.4 protect-the-tree). @390 real-WebKit gate + chain-complete-to-Test on ship.

## Traceability

  - up
    - [Sprint 36 Planning](./planning.md)
    - Requirement R36.2 `[requirement:uuid:32bf71f2-550c-409c-8c4d-b6c26be81586]`
  - down
    - None (atomic task)

## Task Description

The existing Class ScenarioUnit gains instanceOf:[UmlClass, ts-class-code] (both M2 facets EXIST — reuse) = two facet-LENS VIEWS: UmlClass (UML box: name + attribute/method compartments from Class.methods[]+members) vs tsClass (TS signature view). Both draggable (Diagram view-link to the ONE Class unit, viewKind:'class'|'tsClass'); render from Class data; usedIn usage-refs tracked. Two projections, ONE unit — NO copy. TRON RULING A (MERGE 2026-08-05): the authored traceability Class unit IS the model element — gains the facets in place; TsToModel RECONCILES the generated M1 ModelElement into the SAME traceability Class (deterministic same-uuid sourceFile::qualifiedName, or modelElement link), removing the M1/traceability duplication (ONE unit per real class). HARD CONSTRAINT (Tron): the merge MUST NOT disrupt/break the current tree.

## Acceptance Criteria

- [ ] (functional) The Class unit carries instanceOf:[UmlClass, ts-class-code] (reuse existing M2 facets) = two facet-lens VIEWS of the ONE Class unit, no copy.
- [ ] (functional) A-MERGE (fork-A resolve-at-detail, architect b08995a28): the authored traceability Class IS the model element (enriched with instanceOf[UmlClass,ts-class-code]+members+signature+usedIn IN PLACE); the generated M1 ModelElement reconciles to the SAME canonical Class by the DETERMINISTIC key sourceFile::qualifiedName (keyToUuid same-uuid) OR a modelElement<->baseUnit link, resolved at /api/ior — ONE unit per real class, no M1/traceability duplication.
- [ ] (functional) Both UmlClass + tsClass are draggable (Diagram view-link to the ONE Class unit, viewKind class|tsClass); each renders from the SAME Class data (UML box vs TS signature).
- [ ] (functional) Usage-refs (usedIn[]) tracked bidirectionally with Diagram.views.
- [ ] (gate) HARD AC (Tron constraint, reuse A2/R35.4 protect-the-tree): /api/model/tree + rawbin children [ts,puml,diagrams,traceability] + sprint structure + EVERY existing node render BYTE-IDENTICAL before vs after merge (byte-diff==0). A merged element STILL shows at its current node — only its detail / /api/ior / Scenario / Edit / facet-views resolve to the ONE canonical unit; NO node added/removed/reordered/recounted. The MOF tree + traceability folder + /api/model/tree UNTOUCHED. GATE @390: pre/post-merge tree byte-diff==0.
- [ ] (gate) GATE @390 real-WebKit: Class instanceOf both facets (ONE merged unit); drag each renders from the ONE unit's data (no duplicate); usedIn bidirectional.

## Subtasks

None (atomic task).
