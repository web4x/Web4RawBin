<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 33.7.2: Adding or discovering an element wires its model-graph relationships onto the diagram (auto-on-add + 'Discover relationships' 1-level action)

[task:uuid:04705460-98e6-4d67-9665-1a7b00039615]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Machine-gated GREEN DET-3x (discoverRelated Test 54225f01 + buildEdges auto-wire UC1, chain-complete). QA-Review awaiting Tron @390.

## Traceability

  - up
    - [Sprint 33 Planning](./planning.md)
    - Requirement R33.7.2 `[requirement:uuid:2a3090ad-b912-42e1-b65a-db55765df179]`
  - down
    - None (atomic task)

## Task Description

Tron items 2+3 (COUPLED - both add relationships from the model graph onto the diagram; distinct triggers -> architect designs 2 UCs). NOTE: 'moving elements recalcs relationships' = R33.6.3 (reroute-on-move) - already designed, NOT re-minted here. NEW here: (item-2) ADDING an element auto-ADDS its relationships to elements ALREADY on the diagram (auto-wire connectors, no orphan). (item-3) a 'Discover relationships' action-bar action on a SELECTED element (fits the R33.6.5 class-actions bar) adds, 1 LEVEL only (immediate neighbors, NOT transitive): base class + extends; navigation links + target classes; inheriting subclasses; implemented interfaces - adds the discovered classes AND their relationships onto the diagram. Reads the model graph. Reuse R33.6.5 action-bar + model-graph read, NO fork.

## Acceptance Criteria

- [x] (item-2) When an element is ADDED to a diagram, its relationships to elements ALREADY on the diagram are auto-added - the new element's connectors to existing on-diagram elements appear immediately (no orphan-added element; only relationships to elements PRESENT on the diagram, not the whole graph).
- [x] (item-3) A 'Discover relationships' action-bar action on a SELECTED diagram element (added to the R33.6.5 class-selected action set) adds onto the diagram, from the model graph: the base class + the extends relationship; navigation links + their target classes; inheriting subclasses; implemented interfaces - the discovered classes AND their relationships.
- [x] Discover adds ONLY 1 level (the selected element's IMMEDIATE neighbors) - never transitive/recursive graph expansion. Re-running Discover on a newly-added neighbor expands the next level (user-controlled, one hop per action).
- [x] GATE @390 (screenshot/pixel + planted bite): add an element with known relationships to on-diagram elements -> connectors appear to those elements; select an element -> Discover relationships -> its 1-level neighbors (base/subclasses/interfaces/nav-targets) + relationships appear (exactly 1 level, not transitive). planted: add/discover yields no connectors, or discover goes transitive = RED.

## Subtasks

None (atomic task).
