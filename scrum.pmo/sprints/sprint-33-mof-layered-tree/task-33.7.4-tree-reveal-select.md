<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 33.7.4: Selecting a diagram element scrolls and expands the model tree to reveal that element (reuse R33.5 expandPath, selection-triggered)

[task:uuid:a0a45d33-e255-4b3e-bf92-3d4c78ba2c12]

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

DEVICE-CONFIRMED: RED->GREEN v0.8.30 (expandPath synthetic-path fix cd77af783, Test dac73307->9cdf5072) + Tron device note tree-nav works (a36e85e22); chain-complete-to-Test. Done.

## Traceability

  - up
    - [Sprint 33 Planning](./planning.md)
    - Requirement R33.7.4 `[requirement:uuid:fc234e2d-4cd6-4b7f-bd60-5d86e8d3cd3c]`
  - down
    - None (atomic task)

## Task Description

Tron item-4. Selecting a diagram element -> the model/itemview TREE navigates/scrolls that element into view AND expands its ancestry as necessary to reveal the node. Reuse the R33.5 expandPath uuid-walk / revealNode (already built + gated) - here triggered by DIAGRAM-element SELECTION (tree-side reveal), NO re-fork.

## Acceptance Criteria

- [x] Selecting a diagram element dispatches a tree-reveal for that element's uuid: the model tree scrolls it into view AND expands the ancestry (mof-m1 -> project -> file -> class) as needed so the node is VISIBLE + highlighted. Reuse R33.5 expandPath / revealNode (uuid-walk) - selection-triggered from the diagram, no new reveal mechanism.
- [x] GATE @390 (screenshot/pixel + planted bite): select an element in the diagram -> the tree scrolls + expands to its node (visible + highlighted); planted: selection changes but the tree does not reveal/expand to it = RED.

## Subtasks

None (atomic task).
