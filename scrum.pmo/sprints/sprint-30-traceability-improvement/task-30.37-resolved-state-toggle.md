<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.37: Per-change RESOLVED-state toggle (green checkmark, outlined=unresolved / solid=resolved)

[task:uuid:4b624e1e-bd8f-4dec-a145-ed70175fff90]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.37 `[requirement:uuid:5abdb2d4-f358-4e02-bcad-95e5b0354d80]`
  - crossRef
    - R30.35 (2-block = ONE change/checkmark) + R30.36 (open-count = unresolved count)
  - down
    - [UC resolvedStateToggle](./planning.md) `[uc:uuid:fa87d094]`

## Task Description

Each change has a GREEN CHECKMARK labelled 'RESOLVED' (never 'commit') by the up/down nav: outlined-green=unresolved, solid-green=resolved; clicking toggles it EXPLICITLY. ONE resolved-state per change (even the R30.35 two-block render = one change / one checkmark). Any merge action (x/>>/<<) RESETS to unresolved. The resolved state drives R30.36's open-count.

## Context

Covers R30.37 (5abdb2d4) -> UC fa87d094 -> Class RbDiffEditor 18165081. Ties to R30.35 (two-block=one change) + R30.36 (open-count = unresolved count). ⚠ BACKFILL (#126 gap - R30.37 was gated-but-taskless): part of the merge-editor arc. Diagram Tron-approved (implement-them-all).

## Intention

S30 diff/merge editor, R30.37 (Tron): an explicit per-change resolution model (green-check resolve; action un-resolves) that the open-count reads.

## Acceptance Criteria

- [ ] **(toggle)** Each change shows a GREEN CHECKMARK labelled 'RESOLVED' (button/label/tooltip say 'RESOLVED' - NEVER 'commit'/'committed') next to the up/down nav in the 3-Way Merge toolbar for the current change.
- [ ] **(toggle)** The checkmark REFLECTS the DERIVED resolved-state: SOLID-green when the center holds <=1 version (RESOLVED - 1 line=chosen, 0 lines=removed), OUTLINED-green when it holds 2 versions (UNRESOLVED - both present, undecided) - auto-updating from the center line-count. Pixel-distinguishable. Unresolved ONLY when 2 lines.
- [ ] **(toggle)** The checkmark is a MANUAL OVERRIDE on top of the derived state: click to force-RESOLVE a still-2-line change (intentionally keep BOTH versions) or to re-open (force-unresolve) a 1-line change. Default resolution is DERIVED from the center line-count; the checkmark both INDICATES and OVERRIDES it - it is not the sole resolution mechanism.
- [ ] **(toggle)** There is ONE resolved-state per CHANGE. Even when a change renders as TWO SVG blocks (the R30.35 two-per-side rendering), it is ONE change with ONE checkmark and ONE resolved-state - resolving/unresolving applies to the whole change, NOT per block. 2 blocks = VISUAL only, not 2 resolve targets.
- [ ] **(reset)** Merge actions change the center line-count so the derived state updates automatically: 'x' -> 1 line -> resolved (+ jump to next); '>>'/'<<' -> re-derive (2 lines = unresolved, 1 line = resolved). A manual override persists until an action changes the line-count or the user toggles again.
- [ ] **(count)** The resolved state drives R30.36's open-count (open = unresolved): resolving via checkmark decrements it, an action resetting a resolved change increments it.
- [ ] **(verify)** GATE: checkmark toggles resolved (outlined<->solid, pixel-distinguishable); an action resets to unresolved; the open-count tracks accordingly. Client-facing -> version-bump.

## Implementation

QA-REVIEW (merge-editor arc, prod v0.7.55/56). Gate GREEN DET-3x v0.7.55 (08f2e05e1 resolution-toggle primary independent verify; expert d555b4c65 green-check resolve, action un-resolves). Chain-to-Test CLOSED: Test 6d2b9f84 wired onto Impl toggleResolved c86a104d + openChangeCount 8b6abf77 (d8332cbab). served==gated. 7/7 ACs gate-proven. HELD per rule#9 - AWAITING Tron VISUAL verify (screenshots) -> Done. | POLISH+OPT (prod v0.7.59): served==gated -> v0.7.59; derived+override optimization gated (Test 9b4e7c25 on openChangeCount 8b6abf77 + toggleResolved c86a104d) + arc polish v0.7.59 (Test 1e6a4c93). Still QA-Review AWAITING Tron VISUAL verify.

## Subtasks

None (atomic task).
