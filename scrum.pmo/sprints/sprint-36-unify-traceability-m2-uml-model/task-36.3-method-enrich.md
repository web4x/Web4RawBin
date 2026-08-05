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

In Progress (CODE-done woven-in, R30.11 shared-credit AGREED-CLEAN, chain-build + 3 Tests PENDING): R36.3 code SHIPPED but WOVEN INTO shared OTHER-owned Impls (data-enrich + method-vs-function in 382f8644 TsToModel.ts:150-180/228-232 = R32.2-owned; signature-line render in 94ad4f50 = R36.2-owned) -> CODE-done but R36.3's OWN chain UN-BUILT. JOINT VERDICT (architect+planner, commit b4a02d1b5, verify-owner-first): R30.11 SHARED-credit CLEAN — R36.3 gets its OWN methodSignature UC->Method->shared Impls + 3 DISTINCT-INTENT Tests (signature-extract-written / signature-line-CONTENT-renders / method-vs-function), NOT claiming 382f8644's ba762f5a (R32.2) or 94ad4f50's e21b876d (R36.2); markers stay R32.2/R36.2 (NO re-credit). Currently HELD-CLEAN (no premature chainCredit on disk). ★ FLIP->Done ONLY when the 3 distinct Tests WIRE (Impl.tests[] non-empty on disk) + @390 GREEN, verified myself. Joint verdict with PO for req greenlight.

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
