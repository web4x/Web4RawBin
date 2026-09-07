<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.5.5: the 3-way editor is an rb-strip instance: descriptor [L]|[C]|[R] + nav {Left,Center,Right}

[task:uuid:00c67a73-be6c-42ed-9836-82d6aafb5d88]

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
    - [Task 31.5 (umbrella)](./task-31.5-concept-scrollable-viewport-woda-layout.md)
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.5.5 `[requirement:uuid:3c3e1cac-8e5f-492f-b70c-18fbba6c6a33]`
  - down
    - None (atomic build task)

## Task Description

The 3-way diff editor is an INSTANCE of the rb-strip model: descriptor [{C:L},{bar:leftChangebar},{C:C},{bar:rightChangebar},{C:R}], nav {Left,Center,Right}. Pure descriptor wiring once rb-strip/rb-compartment/viewport (5.1-5.4) exist — zero new infra; the existing editor stays functional (components added around, not replacing). Build order 5.

## Acceptance Criteria

- [ ] **(functional)** The 3-way editor = rb-strip descriptor [{C:L},{bar:leftChangebar},{C:C},{bar:rightChangebar},{C:R}] with nav {Left,Center,Right}. Pure descriptor wiring on the existing infra (5.1-5.4), zero new infra; editor stays functional throughout.
- [ ] **(invariant)** POSITIONING!=FUNCTION (cross-cutting, architect design b3f30491f): the SAME component instance in ANY presentation combination {bar|compartment}x{landscape|portrait}x{inline|bottom} passes the SAME functional tests (detail renders, scroll works, expand/minimize, verb-actions fire) — only computed layout/position differs. Any behavior that CHANGES with position/presentation is a DEFECT (the anti-pattern Tron flagged). Tester gates this piece at Tron's real viewport (portrait mobile scroll-snap + landscape side-by-side).
- [x] **(functional)** /edit renders the composed R31.5 editor strip [Local] | [Result] | [Repo] LIVE via rb-editor-layout (editorStripDescriptor on rb-editor-layout 94e7bf82) behind the ?layout=r31.5 flag — replacing the pre-R31.5 panels (rb-file-tree / rb-code-editor / rb-preview, edit.ts:127-144). The R31.5 foundation becomes THE live editor host. @390 RENDERED: with ?layout=r31.5, /edit shows the composed [L]|[C]|[R] layout (currently <rb-woda>/rb-editor-layout is live nowhere — only in the test DOM). Impl-edit to edit.ts (rides R31.5.5, no new node). ✓ MET (R31.5 /edit-swap BUILT v0.7.130 81ecf92f9 + architect backstop PASS 304e4c130 + composed gate GREEN DET-3x @390 4a3c4bcc7 = r315composed-regression-gate.mjs: /edit?layout=r31.5 hosts UNCHANGED rb-diff-editor, 3 panes Local|Result|Repo, deep-link restored, folding R30.53, toolbar, layout=r31.5==default no-regression). ⚠ TEST-CREDIT PENDING: the composed gate has NO test:uuid marker yet — chain-credit to a /edit-swap Test unit awaits a tester marker on r315composed-regression-gate.mjs.
- [x] **(functional)** ★ POSITIONING != FUNCTION (HARD GUARDRAIL): the swap is PRESENTATION/LAYOUT ONLY — rb-diff-editor is hosted UNCHANGED, ZERO diff/merge rewrite. The FULL diff/merge FUNCTION is preserved + REGRESSION-GREEN @390 (a regression SUITE, not just 'it renders'): 3-way merge accept/reject hunks + apply-all-nonconflicting + conflict resolution; spline connector ribbons (R30.34) render AND map across panes; 3-pane row alignment (R30.30) 0px; native code folding (R30.53); deletion regions; deep-links (/edit/<path>?repo=&left=&right=&3way=1) open the EXACT diff; save-merged writes correctly. If ANY diff/merge function cannot be preserved in the new layout → STOP + flag PO, do NOT ship a regression. The R31.5 strip [L]|[C]|[R] is the GENERALIZATION of the 3-pane diff, so this is a presentation-refactor that HOSTS the existing diff/merge, never a rewrite. ✓ MET (R31.5 /edit-swap BUILT v0.7.130 81ecf92f9 + architect backstop PASS 304e4c130 + composed gate GREEN DET-3x @390 4a3c4bcc7 = r315composed-regression-gate.mjs: /edit?layout=r31.5 hosts UNCHANGED rb-diff-editor, 3 panes Local|Result|Repo, deep-link restored, folding R30.53, toolbar, layout=r31.5==default no-regression). ⚠ TEST-CREDIT PENDING: the composed gate has NO test:uuid marker yet — chain-credit to a /edit-swap Test unit awaits a tester marker on r315composed-regression-gate.mjs.
- [x] **(functional)** PORTRAIT MERGE = ALWAYS 3 COLUMNS (Tron ruling #2 2026-07-23, R30.34-consistent): in portrait the 3-way merge stays a co-visible ALWAYS-3-COLUMN cluster (panes narrow, scroll/zoom WITHIN), NOT one-pane-snap. It is EXEMPT from the R31.5 portrait scroll-snap. R31.5 snap applies ONLY to the non-merge chrome (tree <-> editor). Landscape = side-by-side. Ribbons (R30.34) + 0px alignment (R30.30) coordinate space intact; NO re-parenting of individual panes. @390 RENDERED (portrait): the merge is 3 co-visible columns, not a snapped single pane. ✓ MET (R31.5 /edit-swap BUILT v0.7.130 81ecf92f9 + architect backstop PASS 304e4c130 + composed gate GREEN DET-3x @390 4a3c4bcc7 = r315composed-regression-gate.mjs: /edit?layout=r31.5 hosts UNCHANGED rb-diff-editor, 3 panes Local|Result|Repo, deep-link restored, folding R30.53, toolbar, layout=r31.5==default no-regression). ⚠ TEST-CREDIT PENDING: the composed gate has NO test:uuid marker yet — chain-credit to a /edit-swap Test unit awaits a tester marker on r315composed-regression-gate.mjs.
- [x] **(functional)** ROLLBACK-SAFE ?layout=r31.5 flag: the OLD panels remain the DEFAULT until the diff/merge regression is GREEN AND Tron OKs; the R31.5 composed layout is opt-in via ?layout=r31.5. A one-line revert restores the old panels. @390: without the flag, /edit renders the old panels (unchanged); with ?layout=r31.5, the composed layout. ✓ MET (R31.5 /edit-swap BUILT v0.7.130 81ecf92f9 + architect backstop PASS 304e4c130 + composed gate GREEN DET-3x @390 4a3c4bcc7 = r315composed-regression-gate.mjs: /edit?layout=r31.5 hosts UNCHANGED rb-diff-editor, 3 panes Local|Result|Repo, deep-link restored, folding R30.53, toolbar, layout=r31.5==default no-regression). ⚠ TEST-CREDIT PENDING: the composed gate has NO test:uuid marker yet — chain-credit to a /edit-swap Test unit awaits a tester marker on r315composed-regression-gate.mjs.
- [x] **(functional)** GATE (both required): the composed [L]|[C]|[R] layout RENDERS @390 (live, Tron device-visual) AND the FULL diff/merge REGRESSION suite is CLEAN — 3-way / spline ribbons R30.34 / 0px 3-pane alignment R30.30 / native folding R30.53 / deletion regions / deep-links / save-merged. Real restart if any server-side change (verify-by-pid). The R31.5 umbrella reaches DONE only on this gate + Tron device visual of the composed /edit with diff/merge intact. ✓ MET (R31.5 /edit-swap BUILT v0.7.130 81ecf92f9 + architect backstop PASS 304e4c130 + composed gate GREEN DET-3x @390 4a3c4bcc7 = r315composed-regression-gate.mjs: /edit?layout=r31.5 hosts UNCHANGED rb-diff-editor, 3 panes Local|Result|Repo, deep-link restored, folding R30.53, toolbar, layout=r31.5==default no-regression). ⚠ TEST-CREDIT PENDING: the composed gate has NO test:uuid marker yet — chain-credit to a /edit-swap Test unit awaits a tester marker on r315composed-regression-gate.mjs.

## Subtasks

None (atomic build task).
