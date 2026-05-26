[Back to Sprint 15 Planning](./planning.md)

# T106: ListOverview Component + Search → remoteSearch

[task:uuid:106f5061-7283-4495-896c-f06060606106]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [x] testing (tester — run rb-list-overview.test.ts, jsdom) — rb-list-overview 7/7 PASS, 1d9d4fd
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, 2026-05-26, v0.5.16)
`src/public/ts/trace/rb-list-overview.ts` → `<rb-list-overview>`.
- AC1: renders one `<rb-object-item>` (T105) per ref; `setItems(refs)` explicit scope OR whole-graph. Resolves title/type from the graph per ref. Component holds a `graph` property.
- AC2: `.lo-search` input → debounce 300ms → provider.search → render. Empty query → full set.
- AC3: `SearchProvider { search(query): Promise<ObjectRef[]> }`; default `LocalSearch` (title/type/uuid substring over the graph). `list.searchProvider = new RemoteSearch(...)` swaps WITHOUT changing the component API (verified with a mock RemoteSearch in tests).
- AC4: explicit `.lo-empty` "No results" state on zero matches.
- AC5: subscribes `ViewBus.subscribe('graph', …)` → re-runs the active query; `runSearch` filters out refs no longer in the graph (graph.has) so removed objects drop; live item mutations re-render per-item (T105).
- AC6: NO maxlength on input, NO result cap (Tron rule).
- Decoupling: scope intersection + graph.has keep it consistent; provider holds the graph, component is provider-agnostic.
- Tests: `test/vitest/rb-list-overview.test.ts` (jsdom) — render, local filter, RemoteSearch substitution, empty state, live remove, type/uuid match, no-maxlength. Tester runs (uses runSearch() directly to avoid debounce flakiness).
- esbuild bundles; build clean. v0.5.16, sw.js rawbin-v0.5.16. Not mounted yet (T108). No deploy needed.

## Design (robbin-architect, 2026-05-26) — consumes T105 + the T103 seam

**New component:** `src/public/ts/trace/rb-list-overview.ts` → `<rb-list-overview>`. Renders a collection of `<rb-object-item>` (T105) with a search box.

**Input contract:** `setItems(refs: ObjectRef[])` (array of `type:uuid`) OR attribute `type="task"` to auto-list all objects of that type from the graph. Renders one `<rb-object-item>` per ref (reads each object's title/status from the graph to set item attributes).

**Search abstraction (AC2/AC3 — the key design):** a pluggable `SearchProvider` so local and remote share one contract:
```ts
interface SearchProvider { search(query: string): Promise<ObjectRef[]>; }
```
- Default `LocalSearch` — filters the in-memory `TraceGraph` by title/type/uuid substring (sync wrapped in Promise).
- Future `RemoteSearch` — POSTs the query to a server endpoint, returns refs. Swapping providers does NOT change `rb-list-overview`'s public API; it just calls `provider.search(q)` and renders result refs (R15.5 "extensible to remoteSearch without changing contract").
- Provider assigned via property: `list.searchProvider = new LocalSearch(graph)`, default LocalSearch.

**Search flow:** input → debounce 300ms (rb-preview pattern) → `provider.search(query)` → render result refs. Empty query → full list. No results → explicit empty state (AC4).

**MVC live-update (AC5):** (a) an object IN the list mutates → its own `<rb-object-item>` re-renders (T105 subscribes per-item); (b) objects added/removed from the set → `rb-list-overview` subscribes to a graph-level ViewBus topic (`ViewBus.subscribe('graph', …)` emitted on register/remove) and re-runs the active search.

**No artificial limits (TRON RULE):** no maxlength on search input, no result cap — render all matches.

**Decoupling:** imports T105 `rb-object-item`, client `ViewBus`, shared `TraceGraph` type. Provider holds the graph; component is provider-agnostic.

## Acceptance Criteria
- [ ] AC1: `<rb-list-overview>` renders a collection as a list of T105 `<rb-object-item>`s (`setItems(refs)` or `type=` auto-list)
- [ ] AC2: Search input filters in real time via default `LocalSearch` (title/type/uuid substring), debounced 300ms
- [ ] AC3: Search goes through `SearchProvider` (`search(query): Promise<ObjectRef[]>`); a `RemoteSearch` provider assignable via `list.searchProvider` WITHOUT changing the component API
- [ ] AC4: Explicit empty/no-results state when the query matches nothing
- [ ] AC5: ViewBus live-update — items mutating re-render (T105); add/remove on the set re-runs the active search and updates the list
- [ ] AC6: No artificial input/result limits (TRON rule)
- [ ] AC7: Tests cover render, local filtering, provider substitution (mock RemoteSearch), empty state, live add/remove
- [ ] `npm run build` + version bump

## Test Scenario (tester)
`test/vitest/rb-list-overview.test.ts` (jsdom):
1. `setItems([task:a, task:b, requirement:c])` → 3 `<rb-object-item>` rendered.
2. Type "b" (debounced) → only matching item; clear → all 3 return.
3. Assign stub `RemoteSearch` returning `[task:a]` → search renders only `task:a` (component API unchanged).
4. Non-matching query → empty-state element visible.
5. Remove `task:b` from graph + `ViewBus.notify('graph')` → list re-queries, drops `task:b`.

## Traceability
- up
  - [requirement:uuid:55e5f6a7-b8c9-4d04-8ab5-3f4a5b6c7d05](./requirements.md) — R15.5 ListOverview + search
  - [Sprint 15 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R15.5 in [requirements.md](./requirements.md)
  - **use case:** list.search / list.remoteSearch — diagrams/object-verb-usecases.puml
  - **puml:** [diagrams/object-verb-usecases.puml](./diagrams/object-verb-usecases.puml)
  - **class/method:** rb-list-overview component (search / remoteSearch)

## Task Description
Build a `rb-list-overview` component that renders a collection of `defaultItemView`s with
a search over the listed objects. The search is designed to extend cleanly to a
`remoteSearch` (server-side) without changing the component's public contract.

## Acceptance Criteria
- [ ] AC1: `rb-list-overview` renders a collection as a list of T105 `defaultItemView`s
- [ ] AC2: A search input filters the listed objects in real time (local search)
- [ ] AC3: The search contract is abstracted so a `remoteSearch` (server-side) implementation can be swapped in without changing the component API
- [ ] AC4: An empty / no-results state is rendered explicitly
- [ ] AC5: List stays consistent with the T103 MVC live-update path (added/removed objects update the list)
- [ ] AC6: Tests cover render, local search filtering, remoteSearch substitution, and empty state
- [ ] `npm run build` + version bump

## Dependencies
- **Requires:** T105
- **Enables:** T108

## Definition of Done
- [ ] All AC met; chain links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## Test Results (robbin-tester, 2026-05-26, v0.5.16) — **PASS**
- rb-list-overview.test.ts **7/7 PASS**: AC1 setItems render, AC2 local substring filter + clear, AC3 RemoteSearch provider substitution, AC4 empty state, AC5 live remove via graph re-query + type/uuid match, AC6 no-maxlength. Tests call runSearch() directly (no debounce flakiness).

## QA Audit & User Feedback
- 2026-05-26: Tron directive (Sprint 15 R1-R4). Quote in requirements.tron-literal.md.

## Subtasks
None (atomic task).

---
*Sprint 15 — Traceability Browser & Object Model*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 3 (view components)*
