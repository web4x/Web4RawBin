<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.33: Vendor diff3 emits pure-deletion regions so alignment resyncs (send.verified)

[task:uuid:bf311940-526d-4d2b-8147-a5c3d789877e]

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
    - Requirement `[requirement:uuid:54b316b7-4692-4b6a-a035-e295cf448432]`
  - down
    - [UC](./planning.md) `[uc:uuid:ba2f99e0-7ca8-443d-a151-1aed9d50a317]`

## Task Description

Vendor diff3 emits pure-deletion regions so alignment resyncs (send.verified) (retroactive #126 backfill — req was taskless; code+chain shipped+gated before the task unit existed).

## Context

BACKFILL (2026-07-17 gap audit): DONE #126 backfill. vendor/diff3.ts emits pure-deletion regions (5ead5828d, a61258a39 v0.7.43); gated via the R30.30 re-anchor gate (fff313ba9 strict-0px GREEN). Class RbDiffEditor 18165081 + vendor/diff3.ts. served==gated v0.7.43.

## Intention

S30 #126 gap-closure backfill (PO-approved gap audit): give the gated req its scenario Task unit.

## Acceptance Criteria

- [x] (root) Vendor diff3MergeRegions dropped a pure-DELETION region (abLength===0, oLength=2 base->dev, 2 removed) -> alignment couldn't resync there
- [x] (emit-deletion) vendor/diff3.ts emits the single-hunk region even for abLength===0 (bufferContent=[]), so pure deletions surface
- [x] (one-sided) computeOneSidedHunks puts the M=oLength base lines on the non-changed (retaining) pane + spacers opposite
- [x] (resync-gate) With the deletion region present, the existing R30.29/R30.30 re-anchor resyncs at send.verified
- [x] (no-regression) Insertions/modifications/conflicts/agreed-both-sides all still 0px at every stable anchor; RESULT byte-identical
- [x] (verify) Vendor diff3.ts emit + computeOneSidedHunks (a0b30550) + alignPaneRows -> resync at the deletion; DET-3x

## Implementation

DONE #126 backfill. vendor/diff3.ts emits pure-deletion regions (5ead5828d, a61258a39 v0.7.43); gated via the R30.30 re-anchor gate (fff313ba9 strict-0px GREEN). Class RbDiffEditor 18165081 + vendor/diff3.ts. served==gated v0.7.43. Retroactive #126 completion — status-sync to the gated reality; chain-to-Test verified before Done.

## Subtasks

None (atomic task).
