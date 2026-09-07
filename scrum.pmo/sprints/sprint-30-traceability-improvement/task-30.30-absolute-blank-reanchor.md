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

- [ ] **(l1823)** The send.verified/debug.log-isPane-guard region -> 0px at its next stable line and to EOF: all 741 anchors 0px (was a clean 32px whole-region shift).
- [ ] **(self-heal)** Inject a deliberate single-region 2-row mis-pad -> it snaps to 0 at the next stable/blank line (not carried forward) - self-healing, bounded to one block.
- [ ] **(anchors-scope)** 0px at ALL corresponding anchors (every diff3 stable/blank region + block boundaries). Within-change INTERIOR non-alignment is correct-by-nature (IntelliJ-same, the two sides don't line-correspond inside a change) and is explicitly NOT gated.
- [ ] **(no-regression)** Insertions, modifications, conflicts, agreed-both-sides all still 0px at every stable anchor; RESULT byte-identical (re-anchor only inserts corrective blank spacer rows).
- [ ] **(mechanism)** Single forward pass over VISUAL rows: changed/conflict region adds maxH to each pane; a stable region re-anchors (target=max, pad laggards, vL=vC=vR=target) BEFORE emitting its lines. Impl-edit to computeMergedCenter (a0b30550) + alignPaneRows (17c71adf) merged into one pass; markers STAY, no new units. (Optional sub-pixel: pin lineHeight:19/wordWrap:off on mountThreePane c4c84142 - the residual is a whole-row miscount so re-anchor is primary.)
- [ ] **(verify)** Assertion-grade: getTopForLineNumber equal (+/-0px) across edLocal/edCenter/edRemote at EVERY stable/blank line, at scrollTop=0 AND mid-scroll. Language-agnostic (any language / plain text). DET-3x strict-0px gate + Tron pixel-perfect. Client fix -> version-bump.

## Implementation

DONE #126 backfill. Gate v0.7.43 CLOSED strict-0px GREEN DET-3x (fff313ba9, two-key Test wired). Class RbDiffEditor 18165081. Architect spec db9346949 (absolute blank-anchor re-sync). served==gated v0.7.43. Retroactive #126 completion — status-sync to the gated reality; chain-to-Test verified before Done.

## Subtasks

None (atomic task).
