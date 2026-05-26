[Back to Sprint 15 Planning](./planning.md)

# T107: Task DetailViews + Planning Overview (always consistent)

[task:uuid:107a6172-8394-45a6-897d-a07070707107]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [ ] testing (tester — run rb-detail-overview.test.ts, jsdom)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, 2026-05-26, v0.5.17)
`rb-detail-view.ts` + `rb-overview.ts` + `viewRegistry()` (index.ts).
- AC1: rb-detail-view resolves `ref` from graph, renders title/type/uuid/status + ALL typed links (from obj.toJSON().links — route-like refs) as clickable chain rows → navigate(linkedType,'show',{uuid}). Chain-navigable both directions.
- AC2: rb-overview rolls up Task objects grouped by `sprint`, per-status counts (Planned/In Progress/QA Review/Done) + a row per task (reuses T105 rb-object-item).
- AC3: both subscribe ViewBus — detail subscribes its ref + EACH linked ref; overview subscribes 'graph'. notify→re-render, no reload.
- AC4: overview is COMPUTED from the live graph on EVERY render (no cached snapshot, no hand-maintained dup) — drift structurally impossible. Verified by the status-flip test (Planned→Done + notify → recomputes Done:2).
- AC5: `viewRegistry()` (the production wiring T108 uses) registers show→rb-detail-view, task.list/planning.overview→rb-overview, <type>.list→rb-list-overview. (T103 `defaultRegistry` kept as the minimal seam-proof so its test stays valid.)
- **T101 addition (additive, non-breaking):** added optional `status`/`sprint` fields to TraceObject (default ''), included in toJSON/fromJSON only when set — needed so the overview is computed-from-graph. Verified round-trip preserves them; existing T101 tests unaffected (fields optional).
- Tests: `test/vitest/rb-detail-overview.test.ts` (jsdom) + added the jsdom registration guard to trace-routing/rb-list-overview tests (the tester-flagged module-eval-order gotcha). Tester runs.
- esbuild bundles; build clean. v0.5.17, sw.js rawbin-v0.5.17. Mounted by T108.

## Design (robbin-architect, 2026-05-26) — consumes the T103 seam

**Two new components** in `src/public/ts/trace/`:

### `<rb-detail-view>` (AC1) — one object's full detail
- Attribute `ref` (`type:uuid`). Resolves the object from the graph and renders: title, type, uuid, status, and its TYPED links as navigable rows — each linked object (requirements/tasks/useCases/classes/methods/impls/tests via T101 getters) rendered as a clickable row that calls `TraceRouter.navigate(linkedType,'show',{uuid})`. So the DetailView IS the chain navigator (req→uc→puml→method→test, both directions).
- Registered as the `show` verb handler in `VerbRegistry` for every type (T103): `#<type>.show?uuid=…` → `rb-detail-view ref=…`.
- ViewBus (AC3): subscribe(ref) on connect → re-render on `notify(ref)`; also subscribe to each linked ref so a linked object's title change updates the row. No reload.

### `<rb-overview>` (AC2/AC4) — planning rollup, DERIVED not duplicated
- Renders planning across Task objects: group by sprint (from the task's sprint link/attribute), show per-status counts (Planned/In Progress/QA Review/Done) + a row per task (reusing `<rb-object-item>` from T105).
- **Always-consistent invariant (AC4 — the core requirement R15.6):** the Overview is COMPUTED from the live `TraceGraph` every render — never a hand-maintained table, never a cached snapshot. It is registered as `planning.overview` / `task.list` verb. Subscribes to the graph-level ViewBus topic (`ViewBus.subscribe('graph', …)`) so any task add/remove/status-change recomputes the rollup. This is why drift is structurally impossible: there is no second copy to drift from (contrast the legacy hand-authored matrix table T102 fixes).
- Ties to T102: the consistency engine validates the on-disk matrix; `rb-overview` is the LIVE view of the same typed graph — they share the source, so the browser overview and the validated matrix agree by construction.

**MVC roles:** Model = TraceObjects; View = rb-detail-view/rb-overview; Controller = TraceRouter routing `show`/`overview` verbs. Live updates via ViewBus.

**Decoupling:** import shared TraceModel types + client ViewBus/TraceRouter + T105 `rb-object-item`. No protocol; renders from the graph (loaded via T103 deserialize of `graph.toJSON()`).

## Acceptance Criteria
- [ ] AC1: `<rb-detail-view ref=…>` renders a single object's full detail (title/type/uuid/status) + its typed links as clickable rows that `TraceRouter.navigate` to the linked object (chain-navigable both directions)
- [ ] AC2: `<rb-overview>` renders planning across Task objects — grouped by sprint with per-status rollup + a row per task (reusing T105 `<rb-object-item>`)
- [ ] AC3: Both subscribe to the T103 ViewBus — object/link change updates the view without reload (always consistent)
- [ ] AC4: The Overview is COMPUTED from the live typed graph every render (no hand-maintained duplicate, no cached snapshot) — drift structurally impossible
- [ ] AC5: `rb-detail-view` is the registered `show` verb handler; `rb-overview` the `planning.overview`/`task.list` handler (T103 VerbRegistry)
- [ ] AC6: Tests cover detail render + link-row navigation, overview rollup correctness, and live consistency on object/status change
- [ ] `npm run build` + version bump

## Test Scenario (tester)
`test/vitest/rb-detail-overview.test.ts` (jsdom):
1. Build a small graph (1 req → 2 tasks, 1 task DONE). `<rb-detail-view ref="requirement:<u>">` → renders title + 2 task link-rows; click a row → `TraceRouter.navigate('task','show',{uuid})` (spy).
2. `<rb-overview>` → shows sprint group with counts {Planned:1, Done:1} + 2 item rows.
3. Flip the Planned task → DONE in the graph + `ViewBus.notify('graph')` → overview recomputes to {Done:2}; assert NO stale snapshot (recomputed from graph).
4. `ViewBus.notify('requirement:<u>')` after retitling → detail view re-renders new title.

## Traceability
- up
  - [requirement:uuid:65f6a7b8-c9d0-4e15-9bc6-4a5b6c7d8e06](./requirements.md) — R15.6 DetailViews + Overview
  - [Sprint 15 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R15.6 in [requirements.md](./requirements.md)
  - **use case:** task.detail / planning.overview — diagrams/object-verb-usecases.puml
  - **puml:** [diagrams/object-verb-usecases.puml](./diagrams/object-verb-usecases.puml)
  - **class/method:** rb-detail-view, rb-overview components

## Task Description
Build a `DetailView` per task object (`rb-detail-view`) and an `Overview` rendering of
planning (`rb-overview`) that stays consistent with the underlying objects via live MVC.
The planning overview must always reflect the current typed object graph, never a stale
snapshot.

## Acceptance Criteria
- [ ] AC1: `rb-detail-view` renders a single task object's full detail (status, traceability, AC) from the T101 object
- [ ] AC2: `rb-overview` renders planning across task objects (e.g. sprint/status rollup)
- [ ] AC3: Both views subscribe to the T103 MVC live-update path — an object change updates the view without reload (always consistent)
- [ ] AC4: The Overview is derived from the typed objects, never a hand-maintained duplicate (no drift possible)
- [ ] AC5: Tests cover detail render, overview render, and live consistency on object change
- [ ] `npm run build` + version bump

## Dependencies
- **Requires:** T103
- **Enables:** T108

## Definition of Done
- [ ] All AC met; chain links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-26: Tron directive (Sprint 15 R1-R4). Quote in requirements.tron-literal.md.

## Subtasks
None (atomic task).

---
*Sprint 15 — Traceability Browser & Object Model*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 3 (view components)*
