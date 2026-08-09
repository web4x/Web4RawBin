<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 34.5: Tree auto-expands the folder ancestor path on select->navigate (wire trigger to R33.7.4 reveal) [R-D1]

[task:uuid:3d76a785-de51-4c78-a810-5aa5c1c123a2]

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

DONE: R-D1 built v0.8.39 (34e5ab7e7, auto-expand on select->navigate; rides R33.7.4) + chain-complete-to-Test (Impl e6870858 tests[]=[bd8c14fc,9f4bff71], markerPending=false, req mint 836ff1193 re-pointed R-D1 UC to built reality, two-key both-dir) + REAL-WEBKIT @390 GREEN DET-3x (S34 4-gate sweep 5744070b7, served==HEAD 0.8.42, Safari 605.1.15 = Tron iPhone engine). Team-gated at Tron real engine -> Done.

## Traceability

  - up
    - [Sprint 34 Planning](./planning.md)
    - Requirement R34.5 `[requirement:uuid:6f604af0-947f-43e5-93c0-61241b04a1d7]`
  - down
    - None (atomic task)

## Task Description

R-D1 (build FIRST, low-risk). On select->navigate the tree MUST auto-EXPAND the folder ancestor path to REVEAL the target class/element. Nav is already CORRECT (Tron confirmed: works when expanded); only the auto-expand/reveal is missing. FIX = wire the missing trigger to dispatch rb-tree-reveal{ref} / call revealModelElement->expandPath (R33.7.4), reused wholesale. Ride-existing impl, NO fork, NO new verb/Method.

## Acceptance Criteria

- [x] (functional) On select->navigate, the tree auto-EXPANDS the folder ancestor path and reveals/highlights the target class/element (nav already correct; only the reveal was missing).
- [x] (functional) The fix wires the missing trigger to dispatch rb-tree-reveal{ref} / call revealModelElement->expandPath (R33.7.4) - reused wholesale, NO fork, NO new verb/Method.
- [x] (functional) An off-tree / absent target is a graceful no-op (no error).
- [x] (gate) GATE @390 real-WebKit: select a class (from diagram/detail) -> its folder path auto-expands + the leaf highlights, with NO manual expand.

## Subtasks

None (atomic task).
