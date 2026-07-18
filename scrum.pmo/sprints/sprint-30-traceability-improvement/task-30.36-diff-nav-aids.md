<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.36: Diff-nav aids — brighter current-change on up/down + open-changes count

[task:uuid:3591abf8-62a6-4e73-a12f-bd7e05a13940]

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
    - Requirement R30.36 `[requirement:uuid:dde56b34-2cfc-41bb-b432-9a0508566a62]`
  - hard-gate
    - Tron approves the architect diagram before ANY implementation
  - down
    - [UC highlightCurrentChange](./planning.md) `[uc:uuid:17700deb-dfbc-46dc-bd44-e0f01adceb40]` + [UC openChangeCount](./planning.md) `[uc:uuid:cb29d749-6d9c-443b-8a64-8d8e674cdec2]`

## Task Description

Two nav aids for the merge editor: (A) brighter CURRENT-change highlight during UP/DOWN navigation (jumpToChange impl-edit) — the focused change is pixel-distinguishable from non-current same-kind, and the highlight MOVES as you step. (B) an accurate COUNT of OPEN (unresolved) changes (NEW openChangeCount) that DECREMENTS as each is acted on via >> / << / x.

## Context

Covers R30.36 (dde56b34) -> UCs diffEditor.highlightCurrentChange (17700deb, jumpToChange impl-edit) + diffEditor.openChangeCount (cb29d749, NEW openChangeCount decrements on >>/<</x). Class RbDiffEditor 18165081. ★ HARD GATE (Tron): Tron approves the architect diagram BEFORE any implementation — this task stays PRE-IMPLEMENTATION until then. Sibling of R30.35 matrix (both diagram-gated). Sync req(0.4)+architect(0.3).

## Intention

S30 diff/merge editor, R30.36 (Tron scenario-first): make navigation legible — you can see which change is current and how many still need action.

## Acceptance Criteria

- [x] (nav-highlight) During UP/DOWN diff navigation (jumpToChange), the CURRENTLY-FOCUSED change is highlighted with a BRIGHTER color that is PIXEL-DISTINGUISHABLE from a non-current change of the SAME kind (a same-kind non-focused change is visibly dimmer).
- [x] (nav-highlight) Stepping up/down focuses the next/previous change and MOVES the brighter highlight to it (only one change is 'current' at a time).
- [x] (count) An accurate COUNT of OPEN changes (unresolved / not yet acted on) is shown; it counts only blocks that still NEED an action (>>/<</x), not already-resolved ones.
- [x] (count) The open-count DECREMENTS as changes are acted on via '>>' / '<<' / 'x' (each resolve reduces it by one), and reaches 0 when all changes are handled.
- [x] (verify) GATE: (a) the brighter current-change is PIXEL-DISTINGUISHABLE from non-current same-kind (screenshot at each nav step); (b) the open-count is accurate and decrements on each >>/<</x to 0. Client-facing -> version-bump.

## Implementation

IN PROGRESS - PRE-IMPLEMENTATION per Tron HARD GATE (architect diagram approval before any impl). (A) brighter-current = jumpToChange impl-edit (highlight the focused change brighter than non-current same-kind; move highlight on step). (B) open-count = NEW openChangeCount method (count unresolved change blocks; decrement on each >>/<</x resolve). NO implementation until Tron signs the architect diagram. Then expert builds -> gate (pixel-distinguishable current + count-accurate) -> chain-to-Test + served==gated -> Done. | ★ HARD GATE SATISFIED (2026-07-18): TRON APPROVED the architect diagram ("implement them all") — the diagram sign-off HAPPENED. No longer pre-implementation. EXPERT BUILDING NOW. Next Tron touchpoint = FINAL VISUAL VERIFY after the builds+gates land. On expert deploy -> gate (per-cell/behaviour) -> chain-to-Test + served==gated -> QA-Review -> Tron final verify -> Done. | -> QA-REVIEW (2026-07-18, arc complete): gate-GREEN + chain-complete — brighter-current (135b82795 GREEN DET-3x, current change pixel-distinguishably brighter, kind-hue preserved) + open-count (openChangeCount 8b6abf77, decrements on resolve). served==gated v0.7.55/56. ACs gate-proven. HELD rule#9 — AWAITING Tron VISUAL verify -> Done.

## Subtasks

None (atomic task, 2 UCs).
