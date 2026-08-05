<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 36.3: Method enrichment (full signature + docs) + Method-vs-Function + Uml/ts projections [R36.3, build 2nd]

[task:uuid:2a4ec784-53ae-4761-8163-67806ff7a982]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Remaining Issues

DONE: R36.3 Method-enrich + Method-vs-Function + projections — chain-complete-to-Test via R30.11 SHARED-IMPL (verified on disk myself: DISTINCT-INTENT, NO double-credit). R36.3's OWN Methods enrichMethodSignature 68d1997e (rides shared 382f8644=R32.2) + renderMethodFacet d8818494 (rides shared 94ad4f50=R36.2). 3 DISTINCT-INTENT Tests wired ALONGSIDE owners' (verified names + status=pass, NOT claiming ba762f5a/e21b876d): T1 5bb30e23 (data-extract signature, 382f8644) + T3 84ffd586 (Method-vs-Function, 382f8644) + T2 0172b45d (signature-content render @390, 94ad4f50). Shared markers UNTOUCHED (382f8644/94ad4f50 markerPending=false, owners R32.2/R36.2). Tester GREEN DET-3x v0.8.61 (c0ed32640), served==HEAD 0.8.61. R30.11-accept (PO greenlight + joint verdict 2ebff228c + scoreboard-OK). Team-gated at Tron real engine -> Done.

## Traceability

  - up
    - [Sprint 36 Planning](./planning.md)
    - Requirement R36.3 `[requirement:uuid:d4048137-c73c-4132-a27e-2b2fae53c5b8]`
  - down
    - None (atomic task)

## Task Description

ENRICH the Method ScenarioUnit with a FULL SIGNATURE: visibility (public/private/protected), name(parameters[]), returnType, and documentation (oosh-style). Method != Function via a parentClass field — PRESENT => Method (instanceOf UmlMethod), ABSENT => Function (instanceOf UmlFunction); Function->Method is convertible (add a parentClass), Method->Function is blocked/hard (state/attribute access) = a one-way conversion. Projections: UmlMethod/UmlFunction + ts-method-code (typed extensions of the enriched Method/Function). Cluster 2 (underpins the projections).

## Acceptance Criteria

- [x] (functional) The Method unit carries a FULL signature: visibility {public|private|protected}, name(parameters[]), returnType, docs (oosh-style) — enriched from the source decl.
- [x] (functional) parentClass field distinguishes Method (PRESENT => instanceOf UmlMethod) from Function (ABSENT => instanceOf UmlFunction). Function->Method convertible (add parentClass); Method->Function blocked (modelled one-way).
- [x] (functional) UmlMethod/UmlFunction + ts-method-code projections render as typed facet-lens VIEWS of the enriched Method/Function unit (no copy).
- [x] (gate) GATE @390 real-WebKit: Method unit shows the full signature + docs; Method/Function distinction via parentClass present/absent; projections render from the unit; Function->Method conversion works, Method->Function blocked.

## Subtasks

None (atomic task).
