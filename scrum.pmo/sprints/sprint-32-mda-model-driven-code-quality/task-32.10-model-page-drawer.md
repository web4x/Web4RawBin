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

- [ ] **(functional)** PART A / INV-M1 (client-only, mirror /scenario) - model.ts (src/public/ts/model/model.ts) imports rb-detail-drawer (which self-imports rb-diagram-detail + the type-detail elements), createElement('rb-detail-drawer') and appends it to .trace-page (like scenario-view.ts:38-41 / trace-page.ts:35-37); the SHARED selectionModel / 'selection-changed' event then opens it. This ALONE fixes 'no drawer opens' - NO fork (the drawer is the shared component; model.ts:4 previously imported ONLY rb-trace-tree).
- [ ] **(functional)** PART B / INV-M2 - selecting a tree CLASS node opens a TYPED node-detail via a NEW rb-modelelement-detail element registered in the drawer tagMap for a 'modelelement' ref (the drawer already has 'diagram:' from R32.4 but NOT modelelement, so class/member fall to generic today). The class detail shows its «kind» + members (each a dv-link drilling to the member's signature) + relations - via the standard selection -> renderDetailForRef flow, no fork.
- [ ] **(functional)** The class detail carries a '📐 Open diagram' dv-link -> diagram:<uuid> -> rb-diagram-detail (R32.4 UML boxes + R32.6 edges) - the diagram is REACHABLE from the class. Diagram-reach needs ONE small server touch: /api/model/tree ALSO emits the store Diagram unit as a root (type:diagram) and/or a per-class diagramUuid, so the dv-link resolves.
- [ ] **(functional)** Selecting a MEMBER / method tree node (or drilling into it from the class detail's members) opens its SIGNATURE-detail (the member's signature + detail) in the drawer.
- [ ] **(gate)** INV-M3 (gate unchanged) - the R32.9 /model gate is PRESERVED (requireFeatureAccess('Model-Driven Code Quality') still 403s a non-member; drawer-mount does not weaken it). Acceptance is GATED at the INTERACTION @390 (Tron viewport): select -> drawer OPENS, class -> reachable diagram, method/attr -> signature - NOT at page-load (the page rendering the tree is NOT sufficient) [[gate-the-ac-surface]]. This is the 2nd 'gated-loads-not-works' miss (R32.9 not-listed; R32.10 drawer-not-opening) - a device-QA regression = a missing AC.

## Subtasks

None (atomic task).
