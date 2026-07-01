<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 25.6: Scenario link on ALL detail views

[task:uuid:ee367cbd-913b-4153-8c3b-0cdd9a703e01]

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
    - [Sprint 25 Planning](./planning.md)
    - Requirement R25.6 `[requirement:uuid:24509e35-8627-402a-ba93-ed959fef3a5b]`
  - down
    - [UC-SL.1: detail.scenarioLink](./planning.md#uc-sl1) `[uc:uuid:dc468781-714b-429d-8dff-2ee243a81e51]`
    - [UC-SL.2: detail.scenarioLinkResolve](./planning.md#uc-sl2) `[uc:uuid:f81594b4-f0cc-46fc-9761-e480b57a1d75]`

## Task Description

Every detail-view component renders a 📄 Scenario link to its own underlying scenario unit, so any detail view (task, WebItem, member, file, requirement, etc.) exposes a one-click path to the unit that backs it — uniformly across ALL detail components.

## Context

Impl base: src/public/ts/trace/rb-*-detail.ts (the detail-view components: rb-task-detail, rb-webitem-detail, rb-detail-drawer, member/file detail) — add a uniform 📄 Scenario link to each. Scenario-first (RULE #126): unit exists before impl — no code yet. Dogfoods law #100/#103 (every view points back to its source unit).

## Intention

Tron: every detail view shall show a 📄 Scenario link to its underlying scenario unit (all detail components, uniformly).

## Acceptance Criteria

- [x] (link) Every detail-view component renders a 📄 Scenario link
- [x] (target) The link resolves to the underlying scenario unit (the /scenario or /md view of that unit's uuid)
- [x] (universal) The link appears on ALL detail components uniformly (task, WebItem, member, file, requirement, drawer, ...), not just one
- [x] (consistent) The 📄 Scenario affordance is placed/styled consistently across detail views

## Implementation

 GREEN → QA Review: impl shipped v0.6.97 (universal 📄 Scenario link, detail-children.scenarioFileHref 1bd129e0); tester GREEN DET-3x — gate 91df459ae item3 (📄 Scenario link on WebItem detail AND every detail view) + gate 414eb2ecb item3 (photo File preview renders). Covers link/target/universal/consistent. PO RULED (2026-07-01): R26.1/R26.2 are DUPLICATE LABELS of R25.5/R25.6 — there is NO Sprint 26; canonical = THIS task. The dup scenario units (803f7c6c4) were already deleted in the reconcile (598ec1e/cd5e5ea60); 0 R26 scenario units remain. Gate-file R26.1/R26.2 comment-labels (91df459ae/414eb2ecb) flagged to tester for cosmetic relabel → R25.5/R25.6. ✓ TRON-ACCEPTED 2026-07-01 (Tron QA review pass) -> DONE (full-AC).

## Subtasks

None (atomic task).
