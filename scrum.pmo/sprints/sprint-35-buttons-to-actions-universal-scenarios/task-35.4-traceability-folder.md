<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 35.4: Add traceability as the 4th folder under the MDA RawBin project [R35.4, build after R35.2/3]

[task:uuid:2f902ebc-3f05-406f-8999-2972f62a09ec]

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

DONE (R35.4 reopened Tron-DRY 2026-08-05 PO-delegated + RESOLVED same-day): traceability 4th MDA folder now STRUCTURAL-PARITY with /trace - traceabilityRoots reuses the shared sprintOverviewNodes() helper (server.ts:1250, called by BOTH /api/trace/sprints AND traceabilityRoots = ONE source of truth, DRY; CurrentSprint pinned + S1->S35 ordered -> reqs -> chain, NOT the earlier flat-497 roots). Built expert 3b6a96fbb v0.8.51. Chain-complete-to-Test: Impl b6c88d83 tests[]=[96a4bda8,83abce21], markerPending=false; Test 83abce21 RE-POINTED same-uuid to parity (PO-directed, name='R35.4 traceability DRY-parity with /trace sprints-overview @390', status=pass, two-key intact). REAL-WEBKIT @390 GREEN DET-3x (r354-parity-webkit-gate.mjs, re-gate 98eb0d891 v0.8.51, served==HEAD 0.8.51). AC sharpened to structural-parity (req 4f3c6cf58, +AC-reuse-sprints-overview). Team-gated at Tron real engine -> Done.

## Traceability

  - up
    - [Sprint 35 Planning](./planning.md)
    - Requirement R35.4 `[requirement:uuid:476d367f-cad6-4b3e-b988-d90ee5049ac3]`
  - down
    - None (atomic task)

## Task Description

Tron: 'add the traceability tree as the fourth folder under the MDA project RawBin folder - ts, puml, diagrams, traceability.' The RawBin project node (server.ts:1240-1247, currently [ts,puml,diagram], childCount 3 @:1236) gets a 4TH folder 'traceability': (a) add mofFolder('rawbin:traceability','traceability',traceCount,'trace-icon') at :1247; (b) bump childCount 3->4 at :1236; (c) uuid==='rawbin:traceability' -> return requirement-root MofNodes (walk /api/trace roots) so it expands into the REAL trace tree via the existing rb-trace-tree (reuse, no fork); (d) folder + children resolve to real on-disk scenarios (R35.2/R35.3; trace units already real).

## Acceptance Criteria

- [x] (functional) The MDA RawBin project node shows EXACTLY [ts, puml, diagrams, traceability] - a 4th mofFolder('rawbin:traceability',...) added at server.ts:1247 + childCount hint bumped 3->4 at :1236.
- [x] (functional) rawbin:traceability expands into the SAME current+sprints-overview structure that /trace renders (STRUCTURAL PARITY) - a CurrentSprint node PINNED first + Sprints in project order S1->S35 (ior:class:Sprint by model.number ASC = /api/trace/sprints = sprints.overview.md order); each sprint expands via the EXISTING /api/trace/children walk to its requirements -> each req to its chain (Req->UC->Class->Method->Impl->Test). NOT a flat list of 497 requirement roots, NOT a reinvented hierarchy.
- [x] (functional) The traceability folder + its children resolve to real on-disk scenarios containing info (ties R35.2/R35.3; trace units already real); nodes open a real detail + Scenario/Edit.
- [x] (gate) GATE @390 real-WebKit: RawBin project node expands to EXACTLY [ts, puml, diagrams, traceability]; rawbin:traceability expands to CurrentSprint(pinned) + ORDERED sprint nodes (~36, SAME order+uuids as /api/trace/sprints + sprints.overview.md, S1->S35), each sprint -> its reqs -> each req -> its chain (structural PARITY with /trace, NOT flat 497 roots); nodes open real detail + Scenario/Edit.
- [x] (functional) DRY / single-source: rawbin:traceability REUSES the EXISTING current+sprints-overview node-set (does NOT reinvent, does NOT flat-list 497 req roots). The ordered-Sprint enumeration lives in ONE SHARED helper sprintOverviewNodes() called by BOTH /api/trace/sprints (which /trace consumes) AND the traceability folder builder (traceabilityRoots), so the folder is STRUCTURALLY IDENTICAL to /trace by construction. sprint->req->chain rides the EXISTING /api/trace/children trace-walk (zero new walk code).

## Subtasks

None (atomic task).
