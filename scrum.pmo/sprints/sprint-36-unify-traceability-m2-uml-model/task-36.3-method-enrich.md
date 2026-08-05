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

In Progress (CHAIN-CREDIT code-done, @390 Test PENDING): R36.3 CODE-DONE (architect d38b5321e chain-credit R30.11, no new build) — methodSignature UC rides Impl 382f8644 (TsToModel.generate signature+parentClass data-extract d978df35d, markerPending=false) + crossRef renderFacet 94ad4f50 (render); Method-vs-Function BY-CONSTRUCTION (parentClass present->Method / absent->Function, TsToModel.ts:155/180). req chainCredit aac167c3a. ★ HELD for Done: fresh tester @390 gate (re-generate prereq -> method-facet signature render 'visibility name(params):returnType' -> Method-vs-Function) PENDING; on GREEN req mints the distinct-intent Test -> chain-complete-to-Test -> flip. Runs PARALLEL to r364b (T36.4).

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
