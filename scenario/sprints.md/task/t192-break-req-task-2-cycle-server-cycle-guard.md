# Break Req->Task 2-cycle + server-side cycle guard
[task:uuid:a1d2b3a8-a46b-4908-a266-a1ed860c101c]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Task Description

Root cause (architect): Requirement:['tasks'] + Task:['coveredRequirements'] created a 2-hop cycle (R16.4 <-> T123). Per R18.8, Task sits ABOVE Requirement in the nav layer — Requirement's forward chain goes to UseCases, not Tasks.

Fix 1: Requirement:['tasks'] -> ['useCases'] in BOTH SCENARIO_FWD and TRACE_FWD. Also removed Sprint:['requirements'] (Sprints own Tasks in nav layer).

Fix 2: server-side self-cycle filter — childRefs excludes the parent UUID. Combined with the v0.5.92 client-side cycle guard + one-layer lazy-load, this closes the immediate cycle channel. 836/836 pass.

Covers R18.9 (cycle elimination). NOTE: the Req->useCases edge introduced here is subsequently REVERTED in T193 after empirical 0-children regression — see T193 BUG1.

## QA Audit & User Feedback

2026-06-05 6bd58dc1 v0.5.93 T192: break Req→Task 2-cycle + server cycle guard

## Subtasks

None (atomic task).
