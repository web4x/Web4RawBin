<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 36.4: UmlTraceRelationship extends TraceLink — typed RawBin decompose/trace [R36.4, build LAST]

[task:uuid:47f0d7d9-c9a3-4c69-8ed1-6b9aad0adf7d]

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

Planned — cluster R36.4 (build LAST, after projections). UmlTraceRelationship extends TraceLink + RawBin decompose/trace vocabulary (UseCase -> Method); typed connector reuses R32.6 edges + EDGE_DEFS kind-map (no fork). @390 real-WebKit gate + chain-complete-to-Test on ship.

## Traceability

  - up
    - [Sprint 36 Planning](./planning.md)
    - Requirement R36.4 `[requirement:uuid:2265ad63-8c61-4e72-bd36-afd28c9bd731]`
  - down
    - None (atomic task)

## Task Description

NEW UmlTraceRelationship EXTENDS the existing TraceLink (reuse {from,to,fromType,toType,relation,direction,label}) with a RawBin relation VOCABULARY (decomposes/traces), NOT strict UML 2.5. Semantics: a UseCase (=Class.method/Object.verb) traces/decomposes -> its Method. Each endpoint = a typed OOP-extended ScenarioUnit tracking usage-refs. Renders as a typed connector on the diagram (reuse R32.6 edges + EDGE_DEFS kind-map, add the trace kind). Cluster 4 (build last).

## Acceptance Criteria

- [ ] (functional) UmlTraceRelationship EXTENDS TraceLink (reuse from/to/fromType/toType/relation/direction/label) + a RawBin relation vocabulary (decomposes/traces) — NOT strict UML 2.5, NOT a new fork.
- [ ] (functional) Semantics: a UseCase (Class.method/Object.verb) traces/decomposes -> its Method; each endpoint is a typed OOP-extended unit tracking usage-refs.
- [ ] (functional) Renders as a typed connector on the diagram — reuse R32.6 edges + EDGE_DEFS kind-map with the added trace kind (no fork).
- [ ] (gate) GATE @390 real-WebKit: a UmlTraceRelationship between a UseCase + its Method renders the typed trace connector; the relation vocabulary (decomposes/traces) is carried; endpoints resolve to real units.

## Subtasks

None (atomic task).
