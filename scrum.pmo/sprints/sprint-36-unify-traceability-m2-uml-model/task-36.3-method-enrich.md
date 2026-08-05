<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 36.3: Method enrichment (full signature + docs) + Method-vs-Function + Uml/ts projections [R36.3, build 2nd]

[task:uuid:2a4ec784-53ae-4761-8163-67806ff7a982]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [~] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

In Progress (chain-BUILT via R30.11 shared-credit CLEAN, 3 distinct-intent Tests PENDING @390 gate): R36.3's OWN chain built (req 1470075c8) — Method enrichMethodSignature 68d1997e (data-enrich RIDES shared Impl 382f8644=R32.2) + Method renderMethodFacet d8818494 (render RIDES shared Impl 94ad4f50=R36.2); R36.3.useCases[]=[f5e4ecb2, 8e39082a]. ★ VERIFY-NOT-RELAY CLEAN (checked on disk myself): shared Impls 382f8644 (tests[]=[ba762f5a]=R32.2, markerPending=false) + 94ad4f50 (tests[]=[e21b876d]=R36.2, markerPending=false) UNTOUCHED — NO re-credit, NO marker flip, ownerIor stays with owners. R36.3.tests[]=[] Test-PENDING. Method-vs-Function by-construction. ★ FLIP->Done ONLY when fresh tester @390 re-generate gate GREEN -> req mints the 3 DISTINCT-INTENT Tests onto the shared Impls (alongside owners' tests, R30.11) -> I verify R36.3's distinct test present on disk -> chain-complete-to-Test.

## Traceability

  - up
    - [Sprint 36 Planning](./planning.md)
    - Requirement R36.3 `[requirement:uuid:d4048137-c73c-4132-a27e-2b2fae53c5b8]`
  - down
    - None (atomic task)

## Task Description

ENRICH the Method ScenarioUnit with a FULL SIGNATURE: visibility (public/private/protected), name(parameters[]), returnType, and documentation (oosh-style). Method != Function via a parentClass field — PRESENT => Method (instanceOf UmlMethod), ABSENT => Function (instanceOf UmlFunction); Function->Method is convertible (add a parentClass), Method->Function is blocked/hard (state/attribute access) = a one-way conversion. Projections: UmlMethod/UmlFunction + ts-method-code (typed extensions of the enriched Method/Function). Cluster 2 (underpins the projections).

## Acceptance Criteria

- [ ] (functional) The Method unit carries a FULL signature: visibility {public|private|protected}, name(parameters[]), returnType, docs (oosh-style) — enriched from the source decl.
- [ ] (functional) parentClass field distinguishes Method (PRESENT => instanceOf UmlMethod) from Function (ABSENT => instanceOf UmlFunction). Function->Method convertible (add parentClass); Method->Function blocked (modelled one-way).
- [ ] (functional) UmlMethod/UmlFunction + ts-method-code projections render as typed facet-lens VIEWS of the enriched Method/Function unit (no copy).
- [ ] (gate) GATE @390 real-WebKit: Method unit shows the full signature + docs; Method/Function distinction via parentClass present/absent; projections render from the unit; Function->Method conversion works, Method->Function blocked.

## Subtasks

None (atomic task).
