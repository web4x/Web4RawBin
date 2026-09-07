<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.26: Discover-related completeness: adds the UseC

[task:uuid:b500f345-b58f-40ca-8273-57c9ab9097e7]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.26 (Discover-related completeness: adds the UseC). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.26; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(relationship-edge)** discover-related adds the RELATIONSHIP EDGE between the UseCase and the Class — node-build emits m.class as a typed {to,kind} relation RIDING the existing buildEdges (R32.6) both-on-diagram guard (NO second edge concept). An added node with no edge is the empty-container class.
- [ ] **(parents)** It adds the PARENTS of the discovered element to the diagram.
- [ ] **(traceability-children)** It adds the TRACEABILITY CHILDREN to the diagram.
- [ ] **(immediate-render)** Added relationships/nodes render on the diagram IMMEDIATELY, no refresh.
- [ ] **(idempotent)** Idempotent: re-running discover-related does NOT duplicate nodes or edges.
- [ ] **(device-gate)** Device-gated @390 real-WebKit, RED-baseline + STUB-MUST-FAIL, in the device lane so it re-runs.
- [ ] **(inv-da2-anti-flood)** INV-DA2 anti-flood: the neighbor set is BOUNDED ONE LEVEL (repeat-discover for depth), reusing the forwardOnly chain keys as the single source. Justification BY MEASUREMENT (not taste): the /model tree already produced a 1195-node eager flood at 390 — the one-level bound prevents that.

## Subtasks
