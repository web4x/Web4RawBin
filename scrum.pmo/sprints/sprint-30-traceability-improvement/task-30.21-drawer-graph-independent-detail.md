<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.21: Drawer non-sprint detail render (graph-independent /api/ior fetch-fallback)

[task:uuid:7c88d3b8-04cb-447f-a752-a10662919308]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement `[requirement:uuid:6af715df-826f-4a91-962d-e6c0e388f9f7]`
  - down
    - [UC](./planning.md) `[uc:uuid:ab7595ea-0b2b-4a7f-9570-f6124b125272]`

## Task Description

Drawer non-sprint detail render (graph-independent /api/ior fetch-fallback) (retroactive #126 backfill — req was taskless; code+chain shipped+gated before the task unit existed).

## Context

BACKFILL (2026-07-17 gap audit): DONE #126 backfill. Gate v0.7.31 RED->GREEN DET-3x (46ccd1243, ALL 10 types); chain-to-Test CLOSED (e60340530 wired Test cc76beea onto resolveDetailUnit). Class RbDetailDrawer d86af73d. served==gated (drawer surface stable since).

## Intention

S30 #126 gap-closure backfill (PO-approved gap audit): give the gated req its scenario Task unit.

## Acceptance Criteria

- [x] (fetch) A graph-independent unit resolver (RbDetailDrawer.resolveDetailUnit) uses this.graph.get(uuid) when present, else /api/ior fetch-fallback
- [x] (types) ALL type-specific detail renders resolve through it: task/requirement/class/method/implementation/test/etc
- [x] (chain) Chain-only units NOT in the graph (e.g. impl 7f15c149, real task 5665a0dd) render via the /api/ior fetch-fallback
- [x] (regression) renderSprintDetail (R30.3) still works unchanged; the sprint detail (~5135 chars) is not affected
- [x] (gate) The R30.20-drawer case-5 (SELECT node -> content) flips GREEN: selecting a task/class/impl node in scenario-view renders content
- [x] (verify) Tron visual + DET-3x: select task/class/impl in scenario-view (no graph) -> content renders

## Implementation

DONE #126 backfill. Gate v0.7.31 RED->GREEN DET-3x (46ccd1243, ALL 10 types); chain-to-Test CLOSED (e60340530 wired Test cc76beea onto resolveDetailUnit). Class RbDetailDrawer d86af73d. served==gated (drawer surface stable since). Retroactive #126 completion — status-sync to the gated reality; chain-to-Test verified before Done.

## Subtasks

None (atomic task).
