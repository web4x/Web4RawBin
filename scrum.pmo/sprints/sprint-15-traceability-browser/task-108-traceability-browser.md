[Back to Sprint 15 Planning](./planning.md)

# T108: Traceability Browser — tree-navigable graph in Documentation

[task:uuid:108b7283-94a5-46b7-898e-b08080808108]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [ ] testing (tester — rb-trace-tree.test.ts + e2e)
- [ ] QA Review
- [ ] Done

## PLACEMENT FIX (robbin-expert, 2026-05-27, v0.5.21) — Tron: docs top-nav choice, NOT /edit sidebar
Tron clarified: the browser must be a TOP-NAV choice on the docs page (peer to browser/App), not the /edit sidebar. Relocated (reused all of T108 — rb-trace-tree + GET /api/trace, no component rebuild):
- NEW standalone route `GET /trace` (server.ts) → HTML page (pageHead + pageNav) mounting `#trace-tree` (rb-trace-tree) + `#trace-detail` off /api/trace, loaded by a NEW `trace-page.ts` bundle (added to build.mjs + manifest `trace-page.js`).
- `pageNav()` now includes a `Traceability` link (→ /trace) next to App — appears on every docs page (peer to Browse/App).
- REMOVED the /edit sidebar mount (`mountTraceBrowser` + its call + the trace import in edit.ts) — the browser lives ONLY in the docs nav now. Edit bundle shrank (trace layer removed).
- node-click → rb-detail-view in the detail pane via TraceRouter/viewRegistry (unchanged). v0.5.21, sw.js rawbin-v0.5.21.

## Implementation (robbin-expert, 2026-05-26, v0.5.18) — S15 CAPSTONE (original /edit placement, superseded above)
- **`rb-trace-tree.ts`** → `<rb-trace-tree>` (AC2): expand/collapse tree, root=requirements, children = each object's links (toJSON().links) with a per-path cycle guard; node rows reuse T105 `<rb-object-item>`; expand state persisted to localStorage (rawbin-trace-expanded); subscribes ViewBus 'graph'.
- **AC5**: built from the T102-validated graph. NEW server `GET /api/trace` (server.ts) runs `scanRepo`→`graph.toJSON()` + `validate()`; returns `{objects, broken[], issueCount}`. Broken/dangling node uuids render with a ⚠️ marker — shown, never hidden.
- **AC1/AC3**: mounted in `/edit` next to `<rb-file-tree>` (edit.ts `mountTraceBrowser` appends tree + detail pane into the layout tree panel — additive + guarded, never breaks the editor if /api/trace fails). Composes T105 item rows + T107 rb-detail-view (detail pane) over the T103 seam.
- **AC4**: node-row click (rb-object-item) → navigate(type,'show',{uuid}) via the active TraceRouter (viewRegistry) → renders `<rb-detail-view>` into the detail pane. Tree + detail stay consistent via ViewBus.
- Routing: TraceRouter(graph, viewRegistry(), detailPane).start() in /edit; deep-link `#type.show?uuid=…` works.
- Tests: `test/vitest/rb-trace-tree.test.ts` (jsdom) — root render, expand→tasks, persist across re-mount, broken-node warning visible, node-click→navigate spy. + e2e (tester). esbuild: edit bundle includes rb-trace-tree + /api/trace. v0.5.18, sw.js rawbin-v0.5.18. Deploying (live feature).

## Design (robbin-architect, 2026-05-26) — the capstone; integrates T102 + T105/106/107 on the T103 seam

**Where it lives (AC1):** the file browser is `<rb-file-tree>` inside the `/edit` Monaco layout (`rb-editor-layout`, `edit.ts:106`). The traceability browser is a SIBLING panel next to it — a new `<rb-trace-tree>` added to the editor layout (or a `/edit?panel=trace` / `#trace` view), so "next to the file browser in Documentation" is literal: two trees side-by-side, files on one, the traceability graph on the other.

**New component:** `src/public/ts/trace/rb-trace-tree.ts` → `<rb-trace-tree>`. Mirrors `rb-file-tree`'s expand/collapse tree idiom, but nodes are TraceObjects, edges are typed links.

**Tree model (AC2):** root = requirements; expanding a node walks the typed chain `requirement → task → useCase → class → method → implementation/test` (both directions available; default downward). Each node row reuses `<rb-object-item>` (T105) for visual consistency. Expand/collapse persisted (localStorage, like rb-file-tree).

**Built from the validated graph (AC5):** load via T103 deserialize of `graph.toJSON()` (served by `GET /api/trace`, which runs the T102 `scanRepo` → graph). Nodes flagged by T102 `validate()` as broken/dangling render with a warning marker (not hidden) so drift is visible, not silent.

**Node select → DetailView (AC4):** selecting a node calls `TraceRouter.navigate(type,'show',{uuid})` → opens `<rb-detail-view>` (T107) in the detail pane. Tree highlight + detail stay in sync via ViewBus: both subscribe; a mutation re-renders both. Three-pane feel: file-tree | trace-tree | detail (or trace-tree replaces file-tree via a toggle, detail on the right).

**Integration (AC3):** `<rb-trace-tree>` (navigation) + `<rb-object-item>` (T105 node rows) + `<rb-list-overview>` (T106, the search-filtered flat view toggle) + `<rb-detail-view>`/`<rb-overview>` (T107, the detail/planning panes). The browser is the assembly of the four, wired through TraceRouter/VerbRegistry/ViewBus — no new data plumbing, just composition.

**Routing:** add verbs `traceability.browse` (tree) and reuse `*.show` (detail) + `planning.overview`. Hash like `#traceability.browse` opens the tree; `#task.show?uuid=…` deep-links a node's detail (shareable).

**Decoupling:** pure client composition over the shared graph; no protocol. Server only adds `GET /api/trace` returning `graph.toJSON()` (flat JSON + refs) from a T102 scan.

## Acceptance Criteria
- [ ] AC1: A `<rb-trace-tree>` traceability browser renders NEXT TO the existing `<rb-file-tree>` file browser in the `/edit` Documentation UI (sibling panel or toggle)
- [ ] AC2: The graph is navigable as a TREE — expand/collapse `requirement→task→useCase→class→method→test` chain nodes; node rows reuse T105 `<rb-object-item>`; expand state persisted
- [ ] AC3: Integrates T105 defaultItemView (node rows), T106 ListOverview (search/flat toggle), T107 DetailView + Overview (detail/planning panes)
- [ ] AC4: Selecting a node calls `TraceRouter.navigate(type,'show',{uuid})` → opens its DetailView; tree highlight + detail stay consistent via T103 ViewBus
- [ ] AC5: Tree built from the T102 consistency-validated graph (`GET /api/trace` = scanRepo→`graph.toJSON()`); broken/dangling nodes shown WITH a warning marker (not silently dropped)
- [ ] AC6: Tests cover tree render, expand/collapse navigation, node-select→detail, and integration of the four view components
- [ ] `npm run build` + version bump

## Test Scenario (tester)
`test/e2e/traceability-browser.spec.ts` + `test/vitest/rb-trace-tree.test.ts`:
1. (vitest) Load a fixture graph via `TraceGraph.fromJSON`; mount `<rb-trace-tree>` → root requirements render; expand one → its tasks appear as `<rb-object-item>` rows; collapse → hidden; reload → expand state restored.
2. (vitest) A node flagged broken by T102 validate → renders with the warning marker, still visible.
3. (vitest) Select a task node → `TraceRouter.navigate('task','show',{uuid})` (spy) → `<rb-detail-view>` mounts for that ref.
4. (e2e) Navigate to `/edit` → assert both `rb-file-tree` and `rb-trace-tree` present; deep-link `#task.show?uuid=…` → detail pane shows that task; `npm run build` clean; suite green (no regression).

## Traceability
- up
  - [requirement:uuid:75a7b8c9-d0e1-4f26-8cd7-5b6c7d8e9f07](./requirements.md) — R15.7 traceability browser
  - [Sprint 15 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R15.7 in [requirements.md](./requirements.md)
  - **use case:** traceability.browse (tree) — diagrams/object-verb-usecases.puml
  - **puml:** [diagrams/object-verb-usecases.puml](./diagrams/object-verb-usecases.puml)
  - **class/method:** /docs traceability browser + tree graph (integrates item/list/detail/overview)

## Task Description
Add a traceability browser NEXT TO the file browser in the Documentation, letting users
navigate the traceability graph as a TREE. It integrates the
`defaultItemView`/`ListOverview`/`DetailView`/`Overview` components into a single
browsing experience over the typed object graph. This is the sprint capstone.

## Acceptance Criteria
- [ ] AC1: A traceability browser is rendered next to the existing file browser in the Documentation UI
- [ ] AC2: The traceability graph is navigable as a TREE (expand/collapse req→uc→puml→method→test chain nodes)
- [ ] AC3: Browser integrates T105 defaultItemView, T106 ListOverview, T107 DetailView and Overview
- [ ] AC4: Selecting a node opens its DetailView; the tree + detail stay consistent via T103 MVC live-updates
- [ ] AC5: The tree is built from the T102 consistency-validated object graph (no broken nodes shown without a flag)
- [ ] AC6: Tests cover tree render, navigation, node selection → detail, and integration of the four view components
- [ ] `npm run build` + version bump

## Dependencies
- **Requires:** T102, T105, T106, T107
- **Enables:** None (sprint capstone)

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
*Priority: 4 (capstone)*
