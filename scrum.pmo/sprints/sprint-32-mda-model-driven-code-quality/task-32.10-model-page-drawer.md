<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.10: /model page — select tree node opens drawer (node-detail + reachable diagram / method signature) (Tron device-QA)

[task:uuid:bfd0e01a-1b38-494f-86af-bf7c860892cc]

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

RESOLVED (Done): /model select opens drawer + typed detail + reachable diagram/signature. Chain-complete-to-Test bc8b8c230 (Test c7b558ca wired Impl 7e147ad8.tests[]), tester @390 interaction-gate two-key CLEAN. 2nd device-QA miss CLOSED.

## Traceability

  - up
    - [Sprint 32 Planning](./planning.md)
    - Requirement R32.10 `[requirement:uuid:f106673d-cd77-49bb-bfbd-3ab622c9f8c7]` (Tron device-QA)
  - down
    - None (atomic task)

## Task Description

Tron device-QA (2026-07-30): on the /model page, selecting a tree node does NOTHING — no drawer opens. Root: serverModelPage (server.ts:999) mounts <rb-trace-tree id='model-tree'> but NO rb-detail-drawer element, so diagram/methods are unreachable (the R32.9 shell forgot the drawer — 2nd 'gated-loads-not-works' miss). Fix (architect 16e64e445, no fork): Part A — model.ts imports + mounts rb-detail-drawer (mirror /scenario), shared selection-changed opens it; Part B — new rb-modelelement-detail (class→members+diagram, method→signature) + tagMap 'modelelement' + emit Diagram root. Gate the INTERACTION @390. (Root B, real RawBin multi-file model, deferred to R33.)

## Context

Scenario-first (Tron device-QA): req minted R32.10 f106673d; architect design finalized (16e64e445, Part A drawer-mount + Part B typed detail) + 5 ACs (63de26a8d). Build not yet started. Preserves the R32.9 /model gate (requireFeatureAccess 403 for non-member).

## Intention

Make the /model tree INTERACTIVE — select→drawer opens→typed detail→reachable diagram/signature. Reuses the shared rb-detail-drawer (solved once), no fork.

## Acceptance Criteria

- [ ] AC-drawer-mounted-on-model (PART A / INV-M1): model.ts imports rb-detail-drawer + appends it to .trace-page (like scenario-view/trace-page); shared selection-changed opens it — fixes 'no drawer opens', NO fork.
- [ ] AC-class-select-opens-detail (PART B / INV-M2): selecting a CLASS node opens a TYPED node-detail via new rb-modelelement-detail (drawer tagMap 'modelelement'): «kind» + members (dv-links) + relations, via standard renderDetailForRef, no fork.
- [ ] AC-class-select-reaches-diagram: class detail carries a '📐 Open diagram' dv-link → diagram:<uuid> → rb-diagram-detail (R32.4 boxes + R32.6 edges); needs /api/model/tree to also emit the store Diagram unit as a root so the link resolves.
- [ ] AC-member-select-signature: selecting a MEMBER/method node (or drilling from the class detail members) opens its SIGNATURE-detail in the drawer.
- [ ] AC-gate-interaction-390 (INV-M3): R32.9 /model gate PRESERVED (requireFeatureAccess still 403s non-member); GATED at the INTERACTION @390 — select→drawer OPENS, class→reachable diagram, method→signature — NOT at page-load. 2nd gated-loads-not-works miss; device-QA regression = a missing AC.

## Subtasks

None (atomic task).
