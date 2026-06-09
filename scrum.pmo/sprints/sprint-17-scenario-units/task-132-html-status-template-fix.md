<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T132: HTML status template fix

[task:uuid:32af18ad-b6be-4987-b677-1507fdec0851]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement (req → architect)
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:32af18ad-b6be-4987-b677-1507fdec0851]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:3b6cce5a-581c-4325-88b2-b9d381c7f268]` —
    "HTML status template renders incorrectly — fix the template so generated
    `.html` views (T126 ViewGenerator output for each class) display the
    Status section the same way as the canonical Web4Articles markdown."
    (Tron via PO 2026-05-31; req-eng to anchor the verbatim Tron quote here.)
- down
  - None (atomic task)
- follows
  - [T126: Generated views](./task-126-views.md) — defines the HTML+MD templates this task fixes
  - [T130: md preview hierarchical lists](../sprint-13-stability/task-130-md-preview-hierarchical-lists.md) — same family of rendering bug (md side fixed; html side still broken)
- chain (req → usecase → puml → class/method)
  - **requirement:** r132 HTML status template fix (Tron 2026-05-31)
  - **use case:** existing `view.render` UC (T124.6 PUML) — T132 fixes the html status sub-section
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) (no new UC required — template fix)
  - **class/method:** `src/ts/templates/` (per-class HTML template files from T124.2 / T125.4) — specifically the `Status` section emitter shared by all 7 class templates (or per-class if architect determines that's where the bug lives)

## Acceptance Criteria

- [ ] AC1 — `scenario/sprints.md/task/<uuid>.html` renders Status section identically (visually) to the canonical Web4Articles markdown form (checkbox + label + nested sub-steps with indent)
- [ ] AC2 — All 7 class templates (Sprint/Task/Requirement/UseCase/Class/Method/Test) render Status correctly — no per-class divergence
- [ ] AC3 — Visual parity verified by tester via Playwright screenshot (or equivalent visual regression) on at least 1 sample per class
- [ ] AC4 — `npm run build` succeeds; full suite passes; **rule-pair (a) package.json + (b) sw.js CACHE_NAME bumped** per learnings #15; **(c) STATIC_SHELL exempt** per #16 (template-only change, no new route — confirm in commit message)
- [ ] AC5 — No regression: MD views (T130 fix in v0.5.27 MD_CSS) still render correctly

## Dependencies

- **Requires:** T126 (templates + ViewGenerator)
- **Coordinate-with:** T133 (introduces state-machine driving Status), T130 (MD side — already fixed in v0.5.27)
- **Enables:** legible migrated views (T128.2/.3/.4 batches can land once HTML status renders right)

## Definition of Done

- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓, (c) exempt
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-05-31: Tron via PO directed planning. CMM4 4-role engagement enforced (learnings #18) — req captures first, then architect, then expert, then tester. Awaiting req anchor + architect diagnosis.

## Subtasks

None (atomic task — single template fix).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 3 follow-on*
*Owners (CMM4): robbin-req (requirement), robbin-architect (design), robbin-expert (impl), robbin-tester (verify)*
*Priority: 8 (rendering correctness — blocks T128.2/.3 batches looking right)*
