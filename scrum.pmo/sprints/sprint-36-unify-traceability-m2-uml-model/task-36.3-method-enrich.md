<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 36.3: Method enrichment (full signature + docs) + Method-vs-Function + Uml/ts projections [R36.3, build 2nd]

[task:uuid:2a4ec784-53ae-4761-8163-67806ff7a982]

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

Planned — cluster R36.3 (build 2nd, after FOUNDATION, before R36.1/2 projections). Enrich Method unit (full signature + docs) + parentClass Method-vs-Function distinction (one-way Function->Method) + UmlMethod/UmlFunction/ts-method projections. @390 real-WebKit gate + chain-complete-to-Test on ship.

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
