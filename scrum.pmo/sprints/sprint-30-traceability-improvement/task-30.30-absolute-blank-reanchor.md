<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.30: 3-pane rows re-anchor to 0px at every blank/stable line (no persistent residual)

[task:uuid:e0b9c682-a339-44c4-8783-428d5c88b374]

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
    - Requirement `[requirement:uuid:b4f0f0db-720a-41b8-a998-6b7e86ce2135]`
  - down
    - [UC](./planning.md) `[uc:uuid:1d74c00e-e13a-4e10-9103-575dbd3e5240]`

## Task Description

3-pane rows re-anchor to 0px at every blank/stable line (no persistent residual) (retroactive #126 backfill — req was taskless; code+chain shipped+gated before the task unit existed).

## Context

BACKFILL (2026-07-17 gap audit): DONE #126 backfill. Gate v0.7.43 CLOSED strict-0px GREEN DET-3x (fff313ba9, two-key Test wired). Class RbDiffEditor 18165081. Architect spec db9346949 (absolute blank-anchor re-sync). served==gated v0.7.43.

## Intention

S30 #126 gap-closure backfill (PO-approved gap audit): give the gated req its scenario Task unit.

## Acceptance Criteria

- [x] (l1823) The send.verified/debug.log-isPane-guard region -> 0px at its next stable line and to EOF: all 741 anchors snap to 0
- [x] (self-heal) Inject a deliberate single-region 2-row mis-pad -> it snaps to 0 at the next stable/blank line
- [x] (anchors-scope) 0px at ALL corresponding anchors (every diff3 stable/blank region + block boundaries)
- [x] (no-regression) Insertions, modifications, conflicts, agreed-both-sides all still 0px at every stable anchor; RESULT byte-identical
- [x] (mechanism) Single forward pass over VISUAL rows: changed/conflict region adds maxH; a stable region re-anchors laggards to max
- [x] (verify) Assertion-grade: getTopForLineNumber equal (+/-0px) across edLocal/edCenter/edRemote at EVERY stable anchor

## Implementation

DONE #126 backfill. Gate v0.7.43 CLOSED strict-0px GREEN DET-3x (fff313ba9, two-key Test wired). Class RbDiffEditor 18165081. Architect spec db9346949 (absolute blank-anchor re-sync). served==gated v0.7.43. Retroactive #126 completion — status-sync to the gated reality; chain-to-Test verified before Done.

## Subtasks

None (atomic task).
