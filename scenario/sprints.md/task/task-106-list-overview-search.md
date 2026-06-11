# T106: ListOverview Component + Search → remoteSearch
[task:uuid:86617654-8510-443d-959d-343c94ab1ef0]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [x] testing (tester — run rb-list-overview.test.ts, jsdom) — rb-list-overview 7/7 PASS, 1d9d4fd
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 listOverview.searchAndFilter](../usecase/listoverview-searchandfilter.md)

**Tests:**
- [🔗 R15.5](../test/r15-5.md)


## Traceability

- up
  - [requirement:uuid:2d2ca22b-a744-4245-87a5-6562edd3b017](./requirements.md) — R15.5 ListOverview + search
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

- [ ] AC1: `<rb-list-overview>` renders a collection as a list of T105 `<rb-object-item>`s (`setItems(refs)` or `type=` auto-list)
- [ ] AC2: Search input filters in real time via default `LocalSearch` (title/type/uuid substring), debounced 300ms
- [ ] AC3: Search goes through `SearchProvider` (`search(query): Promise<ObjectRef[]>`); a `RemoteSearch` provider assignable via `list.searchProvider` WITHOUT changing the component API
- [ ] AC4: Explicit empty/no-results state when the query matches nothing
- [ ] AC5: ViewBus live-update — items mutating re-render (T105); add/remove on the set re-runs the active search and updates the list
- [ ] AC6: No artificial input/result limits (TRON rule)
- [ ] AC7: Tests cover render, local filtering, provider substitution (mock RemoteSearch), empty state, live add/remove
- [ ] `npm run build` + version bump

## QA Audit & User Feedback

- 2026-05-26: Tron directive (Sprint 15 R1-R4). Quote in requirements.tron-literal.md.

## Subtasks

None (atomic task).

---
*Sprint 15 — Traceability Browser & Object Model*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: 3 (view components)*
