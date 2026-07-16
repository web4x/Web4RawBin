<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.19: 3-pane change-block highlights (source panes too, not just center)

[task:uuid:fa115b1b-354a-445a-b15a-b64c898afcd0]

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
    - Requirement R30.19 `[requirement:uuid:d74360d2-41ca-4d6d-9015-0194629b40eb]`
  - crossRef
    - R30.16 (matching block/ribbon color by construction, shared CONFLICT_PALETTE)
  - down
    - [UC renderSideChangeBlocks](./planning.md) `[uc:uuid:f86392d5-1b74-4201-b163-f89e0ae8a1ec]`

## Task Description

renderCenterChangeBlocks ALSO renders colored rounded change-blocks on the LEFT (Local, a-lines) + RIGHT (Repository, b-lines) source panes, not only the CENTER Result pane. Source-pane block color matches the center block + connector ribbon (shared CONFLICT_PALETTE/conflictColor). Side-gating: left-only highlights Local+Center (not Repo), right-only highlights Repo+Center (not Local), both-sided highlights all 3 panes.

## Context

Covers R30.19 (d74360d2) → UC f86392d5 (renderSideChangeBlocks). Class RbDiffEditor. Matching-by-construction like R30.16 (shared palette). ⚠ BACKFILL: task unit minted post-hoc — R30.19 was requirement-only (#126 gap; code+chain+gate shipped v0.7.28 before this Task unit existed). Surfaced by PO's board-status query post-rewind.

## Intention

S30 diff/merge editor (R30.19, IMG_4518) — change highlights on the SOURCE panes too, matching-color with center + ribbon, so a changed source block is visibly highlighted where it lives.

## Acceptance Criteria

- [x] (render) renderCenterChangeBlocks ALSO renders colored rounded change-blocks on the LEFT (Local, a-lines) + RIGHT (Repository, b-lines) source panes — not only the CENTER Result pane
- [x] (color) The source-pane block color MATCHES the center block + the connector ribbon for that hunk (shared CONFLICT_PALETTE / conflictColor) — blocks and ribbons match by construction (like R30.16)
- [x] (sides) A left-only change (c.a.length>0, c.b.length===0) highlights a block in Local + Center, NOT Repository
- [x] (sides) A right-only change (c.b.length>0, c.a.length===0) highlights a block in Repository + Center, NOT Local
- [x] (sides) A both-sided change highlights a matching-color block in ALL 3 panes; the ribbon visibly connects the highlighted source block(s) to the highlighted center block
- [x] (verify) Tron visual (IMG_4518): the changed source block is highlighted in its pane(s) in the same color as the center block + ribbon; DET-3x asserts the source-pane decorations exist per side

## Implementation

DONE v0.7.28 GREEN DET-3x (gate c776ea55f test/visual/r3019-side-blocks-gate.mjs 98-line, edit-YCBWO635.js; expert 68922236e). Chain-to-Test on origin: Test a3ad0177 (b148e78d5) wired onto Impl renderSideChangeBlocks (ad54851f2, chain COMPLETE, side-blocks money-shot). New Method renderSideChangeBlocks per architect df243841a (revised from impl-edit to new-method, 4b92a96ac). Tron visual-verified (IMG_4518), board 0-false-open.

## Subtasks

None (atomic task).
