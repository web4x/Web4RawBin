<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T141: Chain-link icon → sprints.json symlink in generated MD views

[task:uuid:f0af3251-3884-4238-9159-7eeac15c46d6]

## Status
- [ ] Planned
- [x] In Progress
  - [x] refinement (req → architect)
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:f0af3251-3884-4238-9159-7eeac15c46d6]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:bdda9290-56d0-499a-8277-954bdb35e818]` —
    "Generated MD views should render a chain-link icon (🔗 or similar) on every
    cross-reference, with the link pointing into the `scenarios/sprints.json/`
    speaking-name symlink tree (not the raw UUID index). Start with the UseCase
    template; architect decides whether to extend to all 7 class templates."
    (Tron via PO 2026-05-31; req-eng to anchor the verbatim Tron quote here.)
- down
  - None (atomic task; may split if architect extends to all 7 templates)
- follows
  - [T126: Generated views](./task-126-views.md) — provides the 7 class templates this task extends
  - [T131: File-browser symlink support](./task-131-file-browser-symlinks.md) — visibility of the symlink tree this task points into
  - [T134: Traceability-as-units](./task-134-traceability-as-units.md) — source of the chain edges to render
  - [T128.1: Sprint 1 exemplar migration](./task-128-migration.md) — supplies the live symlink tree to link into
- chain (req → usecase → puml → class/method)
  - **requirement:** chain-link icon → sprints.json symlink (Tron 2026-05-31)
  - **use case:** existing `view.render` UC (T124.6 PUML) — T141 extends per-class HTML+MD chain rendering; architect may add `view.renderChainLink` UC as a new instance
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) (architect adds the UC if introduced)
  - **class/method:** `src/ts/templates/` — UseCase template first (one shared helper or per-template render); affects per-class chain rendering blocks emitted by T126 ViewGenerator

## Task Description

Add the chain-link icon to generated MD views, linking each item to its sprints.json symlink (the speaking-name tree).

## Dependencies

- **Requires:** T126 (templates + ViewGenerator), T131 (symlink visibility on /md/), T134 (TraceLink unit — chain edge source), T128.1 (migrated sample to render against)
- **Coordinate-with:** T140 (source-location IOR — may also need chain-link rendering for class/method)
- **Enables:** legible chain navigation in migrated views; precondition for T128.3 active-batch migration aesthetic

## Definition of Done

- [ ] All AC met
- [ ] Rule-pair (a)+(b) ✓, (c) exempt
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-05-31: Tron via PO 2026-05-31 directed planning. CMM4 4-role engagement enforced (learnings #18). Real v4 uuids per #17. Awaiting req anchor + architect design.

## Subtasks

None (atomic task; architect may split if extend-to-all-7 is large).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 3 follow-on*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 7 (visual legibility of chain navigation in generated views)*
