<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Revert Req->tasks + per-branch visited Set + invisible cycle nodes

[task:uuid:1609fb4b-b0fd-4c18-acc3-c771138e427d]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Task Description

Three fixes per architect, addressing fallout from the T192 edge change and the shared-Set false-cycle bug:

BUG1: REVERTED Requirement:['useCases'] back to ['tasks'] — useCases[] is unpopulated on 75 Reqs, yielding 0 children in the tree. Req->tasks is the legitimate chain for the navigation layer.

BUG2: visited Set is now PER BRANCH (new Set copy per child) instead of shared across siblings. Shared mutation caused false cycle stubs on DAG re-convergence — the same node reached via two sibling paths is legitimate convergence, not a cycle. This is the ancestor-path-precise guard (R18.11).

BUG3: cycle stub '↻ cycle' replaced with an empty invisible node (return empty div). True ancestor-path cycles are silently dropped — the user never sees cut nodes (R18.12 clean cycle omission).

Net effect: Req children restored + true ancestor-path cycles silently dropped + no infinite loop + no false stubs on DAG convergence. 836/836 pass.

## QA Audit & User Feedback

2026-06-05 0e1e97ee v0.5.94 T193: revert Req→tasks + per-branch visited Set + invisible cycle

## Subtasks

None (atomic task).
