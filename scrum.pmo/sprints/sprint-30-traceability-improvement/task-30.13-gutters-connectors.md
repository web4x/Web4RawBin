<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.13: IntelliJ inter-pane merge gutters + connectors

[task:uuid:d197204c-713c-4617-a485-098813c0183d]

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
    - Requirement R30.13 `[requirement:uuid:9b525a80-5d8d-4533-a194-f63da132dd37]`
  - down
    - [UC](./planning.md) `[uc:uuid:71af9720-3c69-40ab-82f5-48b134af294d]`

## Task Description

Render IntelliJ-style inter-pane merge gutters and connector lines linking corresponding hunks across left/center/right panes.

## Context

Covers R30.13 (9b525a80). Class RbDiffEditor.

## Intention

S30 diff/merge editor completion (R30.13). Minted for #126 traceability (was requirement-only).

## Acceptance Criteria

- [x] (gutters) renderInterPaneGutters replaces the .de-accept-bar bottom bar with TWO slim inter-pane action gutters (local<->result, result<->repository); per-change icons at the change's Result-row Y — take-Local / take-Repo / ignore / magic-wand at conflicts — call the existing acceptChange. Controls visible on desktop AND phone (fixes the invisible-desktop bar).
- [x] (ribbons) renderConnectorRibbons draws colored diagonal filled SVG ribbons linking each changed source block (ranges via diffIndices) to its landing rows in Result; blue=non-conflict, green=resolvable, red/brown=conflict.
- [x] (align) Gutter icons AND ribbons stay row-aligned: redraw on scroll (via syncScroll3 onDidScrollChange, requestAnimationFrame-throttled) + on resize + on rebuildCenter.
- [x] (nav) jumpToChange gives a toolbar 'N changes, M conflicts' counter + up/down buttons that reveal the prev/next change's Result line (revealLineInCenter + scroll-sync).
- [x] (modes) Gutters + ribbons light up in BOTH 2-way (R30.12 conflicts[]) and 3-way (diff3 conflicts[]) — they render from the shared conflicts[].
- [x] (scope) renderMergeGutter (e24dc98a) keeps its in-CENTER line-decorations but DROPS the .de-accept-bar; syncScroll3 (e3431e87) gains the throttled ribbon-redraw hook (impl-edits, markers unchanged); acceptChange/computeMergedCenter/computeTwoWayHunks reused UNCHANGED.
- [x] (verify) Tron visual: inter-pane gutters visible on desktop with working take-over icons + ribbons align on scroll; DET-3x on the render/nav methods.

## Implementation

DONE 2026-07-14 (PO shipped/git-state): v0.7.21 (refined by R30.16).

## Subtasks

None (atomic task).
