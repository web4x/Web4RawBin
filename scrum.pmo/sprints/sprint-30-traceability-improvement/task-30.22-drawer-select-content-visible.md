<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.22: Drawer select opens content-visible (not peek-clipped)

[task:uuid:9153e980-43b0-445b-b109-2f514bcaa12d]

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
    - Requirement `[requirement:uuid:e9432c13-0898-4a04-82cd-7c45f573ede4]`
  - down
    - [UC](./planning.md) `[uc:uuid:4c794d6c-32a6-4cae-9a65-cbe2e8e4e368]`

## Task Description

Drawer select opens content-visible (not peek-clipped) (retroactive #126 backfill — req was taskless; code+chain shipped+gated before the task unit existed).

## Context

BACKFILL (2026-07-17 gap audit): DONE #126 backfill. Gate v0.7.32 GREEN DET-3x (0dbed3c8d content-visible-on-first-select). Class RbDetailDrawer d86af73d. Supersedes R27.8(B) (closed->open+peek becomes open->expanded). served==gated.

## Intention

S30 #126 gap-closure backfill (PO-approved gap audit): give the gated req its scenario Task unit.

## Acceptance Criteria

- [x] (open) Selecting a node with detail content opens the drawer EXPANDED (body display:flex, content-height) so content is visible immediately
- [x] (close) X still minimizes to peek (R27.8 minimize / R30.20 closeOrReturn) - X-behavior unchanged
- [x] (toggle) The grab-bar toggle still expands/collapses the drawer (unchanged)
- [x] (close) ESC still closes the drawer (unchanged)
- [x] (supersede) Supersedes R27.8(B): the closed->open+peek behavior for a content-select becomes open->expanded
- [x] (verify) Tron visual + DET-3x: select task/class/impl -> content visible immediately (no grab-bar, body display:flex)

## Implementation

DONE #126 backfill. Gate v0.7.32 GREEN DET-3x (0dbed3c8d content-visible-on-first-select). Class RbDetailDrawer d86af73d. Supersedes R27.8(B) (closed->open+peek becomes open->expanded). served==gated. Retroactive #126 completion — status-sync to the gated reality; chain-to-Test verified before Done.

## Subtasks

None (atomic task).
