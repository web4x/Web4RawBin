<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 35.4: Add traceability as the 4th folder under the MDA RawBin project [R35.4, build after R35.2/3]

[task:uuid:2f902ebc-3f05-406f-8999-2972f62a09ec]

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

Planned — cluster R35.4 (build AFTER R35.2/3 foundation, before R35.1; order R35.2/3->R35.4->R35.1). server.ts:1240-1247 add mofFolder('rawbin:traceability') + childCount 3->4 @:1236; rawbin:traceability -> requirement-root MofNodes reusing rb-trace-tree (no fork). @390 real-WebKit gate + chain-complete-to-Test on ship.

## Traceability

  - up
    - [Sprint 35 Planning](./planning.md)
    - Requirement R35.4 `[requirement:uuid:476d367f-cad6-4b3e-b988-d90ee5049ac3]`
  - down
    - None (atomic task)

## Task Description

Tron: 'add the traceability tree as the fourth folder under the MDA project RawBin folder - ts, puml, diagrams, traceability.' The RawBin project node (server.ts:1240-1247, currently [ts,puml,diagram], childCount 3 @:1236) gets a 4TH folder 'traceability': (a) add mofFolder('rawbin:traceability','traceability',traceCount,'trace-icon') at :1247; (b) bump childCount 3->4 at :1236; (c) uuid==='rawbin:traceability' -> return requirement-root MofNodes (walk /api/trace roots) so it expands into the REAL trace tree via the existing rb-trace-tree (reuse, no fork); (d) folder + children resolve to real on-disk scenarios (R35.2/R35.3; trace units already real).

## Acceptance Criteria

- [ ] (functional) The MDA RawBin project node shows EXACTLY [ts, puml, diagrams, traceability] - a 4th mofFolder('rawbin:traceability',...) added at server.ts:1247 + childCount hint bumped 3->4 at :1236.
- [ ] (functional) rawbin:traceability expands into the REAL trace tree (Requirement->UseCase->Class->Method->Impl->Test) via the EXISTING rb-trace-tree - returns the requirement-root MofNodes (walk /api/trace roots), reuse no fork.
- [ ] (functional) The traceability folder + its children resolve to real on-disk scenarios containing info (ties R35.2/R35.3; trace units already real); nodes open a real detail + Scenario/Edit.
- [ ] (gate) GATE @390 real-WebKit: the RawBin project node expands to EXACTLY [ts, puml, diagrams, traceability]; the traceability folder expands to the Req->...->Test tree; nodes open real detail + both buttons resolve.

## Subtasks

None (atomic task).
