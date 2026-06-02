# T127: File-browser ↔ traceability-browser navigation + IOR universal handler
[task:uuid:b66fdf54-04f4-4609-9ded-04c835348b32]

## Status

- [ ] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

**UseCases:**
- [🔗 tree.navigate](../sprints.md/usecase/tree-navigate.md)


## Traceability

`[task:uuid:b66fdf54-04f4-4609-9ded-04c835348b32]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **requirements:** R17.11 file-browser ↔ traceability-browser nav · R17.12 all files are units, referenceable via IOR
- down
  - T127.1 — file-browser ↔ traceability-browser bi-directional nav
  - T127.2 — IOR universal-reference handler (any repo file resolves to a unit)
- chain
  - **requirement:** R17.11, R17.12
  - **use case:** nav.fileToTrace, nav.traceToFile, ior.resolveFile (T124.6 PUML)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** new client routes/handlers in `src/public/ts/trace/` + `src/ts/server/server.ts` IOR resolver
- requires
  - T125 (IOR primitive), T126 (views are the link targets on both sides)
- enables
  - End-to-end UX: tap a file in `/md/`, jump to its trace node; tap a trace node, jump to its file. Any IOR resolves to its view.

## Task Description

Two integrations that complete the nav loop on `/trace` + `/md/`:

**T127.1 — cross-nav between browsers:**
- Every node in `/trace` (rb-trace-tree + DetailViews) exposes a "Open file" link → navigates to the file's `/md/` view.
- Every file in `/md/` whose unit lives in the scenario index exposes an "Open in trace" link → navigates to `/trace#<class>.show?ior=<...>`.

**T127.2 — IOR universal-reference handler:**
- Any file in the repo (md, ts, puml, json) is a unit, identified by an IOR.
- IOR resolves to: (a) the file path, (b) the unit's class (when in `scenario/index/`), (c) the rendered view.
- A "Resolve IOR" endpoint (or client-side resolver) takes an IOR and returns `{ filePath, class, htmlView, mdView }`.

## Acceptance Criteria

- [ ] AC1 — From a Task tree node on `/trace`, "Open file" navigates to the corresponding `/md/.../task-N-*.md` (or its generated view)
- [ ] AC2 — From a `/md/` rendered task file, "Open in trace" navigates to `/trace` with the right DetailView open
- [ ] AC3 — Calling `IOR.resolve(ior)` on any repo file (md/ts/puml/json) returns `{filePath, class?, view?}` with appropriate fallbacks for non-scenario files
- [ ] AC4 — Mobile (iPhone) — both nav directions work; safe-area respected
- [ ] AC5 — `npm run build` succeeds; suite passes; **version + sw.js bumped per #15**; **STATIC_SHELL entry per #16 if any new SPA route introduced**
- [ ] AC6 — At least one playwright E2E covers the round-trip /trace → /md/ → /trace

## QA Audit & User Feedback

- 2026-05-30: Planned — awaiting T125+T126, then expert implementation.

## Subtasks

T127.1, T127.2 — files created by expert during refinement.

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 4*
*Owner: robbin-expert (impl), robbin-tester (verify)*
*Priority: 4 (navigation — gates UX usability of migrated sprints)*
