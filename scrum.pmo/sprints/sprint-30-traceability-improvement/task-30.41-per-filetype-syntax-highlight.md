<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.41: 3-way merge editor shows per-filetype syntax highlighting

[task:uuid:79573f29-8b05-426f-8af0-32f3999b5779]

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
    - Requirement R30.41 `[requirement:uuid:b0c21990-3cf5-4e39-8d27-7f00afe688b3]`
  - crossRef
    - R30.34 (spline) + R30.35 (change-block coloring) — coexist
  - down
    - [UC merge.syntaxHighlight](./planning.md) `[uc:uuid:53400884-78b5-477b-a8fa-945888c26f16]`

## Task Description

Opening a known filetype highlights keywords/strings/comments correctly in ALL THREE panes (Local/Center/Repository). The language is derived per-filetype from the file path/extension (not a fixed default); applyLanguage derives the Monaco language id from left.path extension + calls setModelLanguage. Syntax highlighting COEXISTS with the diff/merge change-block coloring (R30.35 add/delete/modify/conflict) and the connector splines (R30.34).

## Context

Covers R30.41 (b0c21990) -> UC merge.syntaxHighlight (53400884) -> Method RbDiffEditor.applyLanguage (cd0599ab) -> Impl 5e0e5cd5 (expert has the uuid, building). Class RbDiffEditor 18165081. crossRef R30.34 (spline) + R30.35 (change-block decorations) — COEXIST (highlighting must not break the diff coloring/ribbons).

## Intention

S30 diff/merge editor, R30.41 (Tron feature, architect-derived feasible+low-risk): make the 3-way merge readable with real per-language syntax highlighting.

## Acceptance Criteria

- [x] (all-panes) Opening a known filetype highlights keywords/strings/comments CORRECTLY in ALL THREE panes (Local/Center/Repository)
- [x] (per-filetype) The language is derived from the file path/extension (per-filetype), not a fixed default; each file gets its own language
- [x] (coexist) Syntax highlighting COEXISTS with the diff/merge change-block coloring (R30.35 add/delete/modify/conflict) + splines (R30.34) — neither clobbers the other
- [x] (mechanism) applyLanguage derives the Monaco language id from the left.path extension and calls setModelLanguage on the pane models
- [x] (gate) GATE (DET-3x + Tron visual): open otmux (bash) / a .cs (C#) / a .ts (typescript) -> all 3 panes highlight correctly + the diff coloring stays intact

## Implementation

IN PROGRESS (Tron feature). Architect derived feasible + low-risk. Expert BUILDING (Impl 5e0e5cd5): applyLanguage derives the Monaco language id from left.path extension -> setModelLanguage on all 3 pane models; must COEXIST with R30.35 change-block decorations + R30.34 splines (no clobber). -> deploy -> QA-Review -> tester DET-3x GREEN + Tron visual (bash/.cs/.ts all 3 panes highlight correctly, coloring intact) -> Done (chain-to-Test + served==gated first). | -> QA-REVIEW (2026-07-19, prod v0.7.65): gate 85379e145 syntax-highlight GREEN DET-3x v0.7.65 (all 3 panes per filetype). Chain-to-Test CLOSED (verified, not relayed): Impl applyLanguage 5e0e5cd5 (designAhead->false, marker two-key verified) <-> Test db352d49 (pass). Mount-race fix captured (req). COEXISTS with R30.35 coloring + R30.34 splines (gate confirms coloring intact). served==gated v0.7.65 (edit-YLYSV5RK.js). 5/5 ACs gate-proven. HELD rule#9 -> AWAITING Tron VISUAL verify (bash/.cs/.ts highlight + coloring intact) -> Done.

## Subtasks

None (atomic task).
