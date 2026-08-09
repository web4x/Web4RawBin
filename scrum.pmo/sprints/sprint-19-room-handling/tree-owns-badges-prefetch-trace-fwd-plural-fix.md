<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-tree-owns-badges-prefetch: Tree owns computeBadges/prefetchLayer/prefetchVisibleLayer + TRACE_FWD plural-field fix

[task:uuid:5df25620-3e44-41e5-9640-835bf83b557a]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement architect
  - [x] creating test cases
  - [x] implementing expert
  - [x] testing
- [x] QA Review
- [x] Done

## Task Description

Tree component owns computeBadges(), prefetchLayer(), and prefetchVisibleLayer() — rb-object-item is passive (receives badge count, does not fetch). Also fixes TRACE_FWD plural-field bug (e.g. requirements vs requirement). Covers R19.29.

## Subtasks
