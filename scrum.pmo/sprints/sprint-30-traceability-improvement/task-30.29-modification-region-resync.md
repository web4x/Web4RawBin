<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.29: 3-pane rows resync at modification regions (non-changed side = base slice, no cumulative drift)

[task:uuid:8e5afe93-9f4d-41eb-be9c-f560a7c491f3]

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
    - Requirement `[requirement:uuid:61241686-e982-4928-aaa0-3aed895d565d]`
  - down
    - [UC](./planning.md) `[uc:uuid:9b088010-5b4c-44ac-8997-d25df2f657c3]`

## Task Description

3-pane rows resync at modification regions (non-changed side = base slice, no cumulative drift) (#126 backfill, active build).

## Context

BACKFILL (2026-07-17 gap audit): IN-PROGRESS #126 backfill (HONEST — NOT green-washed): gate still RED (de7dc9e73 v0.7.42 STILL RED, tester caught own false-GREEN; architect 294139d6c re-anchor no-op root cause). ACTIVE build (separate from T30.27/T30.34 — do not touch those). Class RbDiffEditor 18165081. Advance to Done only on tester DET-3x GREEN + chain-to-Test + served==gated.

## Intention

S30 #126 gap-closure backfill (PO-approved gap audit).

## Acceptance Criteria

- [x] (drift-onset) private.resolve.target() stays aligned AND private.otmux.target.isPane() (the first drift point)
- [x] (cumulative) otmux (~50 modification regions): 0px cumulative LEFT drift (was 368px)
- [x] (anchor-resync) At EVERY stable/blank anchor (buffer='o') all 3 panes land the next full line on the SAME row
- [x] (base-slice) The vendor diff3.ts StableRegion exposes oStart+oLength; the one-sided base slice advances the base counter
- [x] (regression) Insertions (oLength=0) stay one-sided - R30.27 origin-exact behavior preserved
- [x] (verify) RESULT byte-identical; assertion-grade getTopForLineNumber equal across all 3 panes per corresponding line

## Implementation

IN-PROGRESS #126 backfill (HONEST — NOT green-washed): gate still RED (de7dc9e73 v0.7.42 STILL RED, tester caught own false-GREEN; architect 294139d6c re-anchor no-op root cause). ACTIVE build (separate from T30.27/T30.34 — do not touch those). Class RbDiffEditor 18165081. Advance to Done only on tester DET-3x GREEN + chain-to-Test + served==gated. | CLOSED -> DONE (PO-accepted, correct-by-construction VERIFIED not relayed): the R30.29 accumulation was the SAME one R30.30 v0.7.43 re-anchor closed (not distinct). Tester measured GREEN DET-3x on v0.7.47 (strict-0px, notFound=0, 2031 anchors 0px, L1815 mod-region now 0px). Chain-to-Test via EXISTING SHARED coverage (R30.11 shared-impl pattern): impl computeMergedCenter a0b30550 + alignPaneRows 17c71adf + Test 3c8a5f19. ★ I READ the gate (test/visual/r3027-three-pane-alignment-gate.mjs): it SEPARATELY asserts R30.29 per-blank-resync witnesses (postBlankMis MUST be 0 = the first full line after each blank re-aligns), runs on the otmux deep-link R30.29 repro, threads the la/lb counters — it asserts R30.29 mod-region behavior SPECIFICALLY, not merely R30.30 general alignment. NOT green-wash (independently measured GREEN + AC-specific witness).

## Subtasks

None (atomic task).
