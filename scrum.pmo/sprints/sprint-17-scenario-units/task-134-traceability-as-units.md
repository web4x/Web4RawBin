<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T134: Traceability-as-units (links as scenario.json with ln in referenced instances + MD/HTML views)

[task:uuid:d0f39414-dfb4-4944-ac1b-56dcad0a66fe]

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

`[task:uuid:d0f39414-dfb4-4944-ac1b-56dcad0a66fe]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:dd8709c3-f076-431e-a4be-64a875cb8888]` —
    "Traceability links must themselves be units — each link is a scenario.json
    in the index, with `ln` symlinks emitted into both referenced instances'
    speaking-name trees, and MD/HTML views generated from the link unit's
    template." (Tron via PO 2026-05-31; req-eng to anchor the verbatim Tron
    quote in this slot.)
- down
  - None (atomic task — large but coherent single deliverable)
- follows
  - [T125: Foundation (Unit + IOR + class system)](./task-125-foundation.md) — T134 adds the `TraceabilityLink` class to the existing 7-class set
  - [T126: Generated views](./task-126-views.md) — T134 adds an 8th template (TraceabilityLink HTML+MD)
  - [T127: Navigation + IOR universal handler](./task-127-navigation.md) — T134 makes links navigable via IOR
  - [T128: Migration](./task-128-migration.md) — migration emits link units for every existing chain edge (T128.x flows into T134's link inventory)
- chain (req → usecase → puml → class/method)
  - **requirement:** r134 traceability-as-units (Tron 2026-05-31)
  - **use case:** traceabilityLink.create, traceabilityLink.resolve, traceabilityLink.emitSymlinks, traceabilityLink.renderView (architect refines during T134 design)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds TraceabilityLink as a class with these UCs
  - **class/method:** `src/ts/scenario/classes.ts` → new `TraceabilityLink` class extending `Unit`; new template in `src/ts/templates/traceability-link.html.ts` + `.md.ts`; update T125.3 storage layer to emit `ln` into both endpoints' speaking-name dirs

## Task Description

Represent traceability links as first-class scenario.json units with ln symlinks into the referenced instances, and render them in the generated MD/HTML views.

## Dependencies

- **Requires:** T125 (foundation classes + IOR), T126 (template architecture — extends to an 8th class), T127 (IOR resolver + nav), T128 (migration emits link units as part of the migration pass)
- **Coordinate-with:** T119 (test:uuid markers — those are also link semantics; T134 may subsume or complement)
- **Enables:** queryable traceability graph; "show me everything linking to X" becomes a directory listing; chain visualization on /trace gets first-class link nodes

## Definition of Done

- [ ] All AC met; sub-tasks committed (if architect splits)
- [ ] Migration emits link units for all existing chain edges
- [ ] `npm run trace:check` reports link graph clean
- [ ] Rule-pair held
- [ ] Tron QA approved

## QA Audit & User Feedback

- 2026-05-31: Tron via PO directed planning. CMM4 4-role engagement enforced. Awaiting req anchor + architect class design + symlink emission rules.

## Subtasks

Architect may split into T134.1 (class + IOR), T134.2 (template + view), T134.3 (storage + symlinks), T134.4 (migration hook) — decision at refinement time.

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 5 follow-on*
*Owners (CMM4): robbin-req (requirement), robbin-architect (design lead), robbin-expert (impl), robbin-tester (verify)*
*Priority: 5 (closes the "first-class everything" loop — links become navigable)*
