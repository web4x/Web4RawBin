<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 36.4: UmlTraceRelationship extends TraceLink — typed RawBin decompose/trace [R36.4, build LAST]

[task:uuid:47f0d7d9-c9a3-4c69-8ed1-6b9aad0adf7d]

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

DONE: R36.4 UmlTraceRelationship ext TraceLink (typed RawBin decompose/trace) — chain-complete-to-Test verified on disk (req per-task, I re-verified). MECHANISM chain: Test d41ee143 <-> Impl a79f6091 (authorTrace mint + draw-to-create), markerPending=false. RENDER chain: Test 3c881f31 <-> Impl dc101d02 (buildTraceEdge connector), markerPending=false. REAL-WEBKIT @390 GREEN DET-3x (r364b buildTraceEdge ce6bc49eb, engine-independent + idempotent + 403 8b5026f85, served==HEAD 0.8.59). iOS-tap on the connector = flagged Tron device-verify (NOT a board blocker; engine-independent gate GREEN). Team-gated at Tron real engine -> Done.

## Traceability

  - up
    - [Sprint 36 Planning](./planning.md)
    - Requirement R36.4 `[requirement:uuid:2265ad63-8c61-4e72-bd36-afd28c9bd731]`
  - down
    - None (atomic task)

## Task Description

NEW UmlTraceRelationship EXTENDS the existing TraceLink (reuse {from,to,fromType,toType,relation,direction,label}) with a RawBin relation VOCABULARY (decomposes/traces), NOT strict UML 2.5. Semantics: a UseCase (=Class.method/Object.verb) traces/decomposes -> its Method. Each endpoint = a typed OOP-extended ScenarioUnit tracking usage-refs. Renders as a typed connector on the diagram (reuse R32.6 edges + EDGE_DEFS kind-map, add the trace kind). Cluster 4 (build last).

## Acceptance Criteria

- [x] (functional) UmlTraceRelationship EXTENDS TraceLink (reuse from/to/fromType/toType/relation/direction/label) + a RawBin relation vocabulary (decomposes/traces) — NOT strict UML 2.5, NOT a new fork.
- [x] (functional) Semantics: a UseCase (Class.method/Object.verb) traces/decomposes -> its Method; each endpoint is a typed OOP-extended unit tracking usage-refs.
- [x] (functional) Renders as a typed connector on the diagram — reuse R32.6 edges + EDGE_DEFS kind-map with the added trace kind (no fork).
- [x] (gate) GATE @390 real-WebKit: a UmlTraceRelationship between a UseCase + its Method renders the typed trace connector; the relation vocabulary (decomposes/traces) is carried; endpoints resolve to real units.

## Subtasks

None (atomic task).
