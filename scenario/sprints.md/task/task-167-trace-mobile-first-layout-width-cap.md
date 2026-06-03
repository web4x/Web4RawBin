# T167: /trace mobile-first layout + hard width-cap on right (detail) pane
[task:uuid:d0881ad6-ade5-4d60-94a2-fbe5347fd4b6]

## Traceability

`[task:uuid:d0881ad6-ade5-4d60-94a2-fbe5347fd4b6]`

- up
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source-2.md](./compound-requirement-source-2.md) → **R-D** (Tron completion 2026-06-02)
  - **R-D /trace mobile-first layout + hard right-pane width-cap**
    `[requirement:uuid:ff3f06e7-228f-408f-ac06-8db50051108e]`
    > TRON DIRECTIVE: "keep it mobile first layout and limit the with hard to the current right window size"
- down
  - None (atomic; CSS + responsive scope)
- follows
  - [T110: DetailViewContainer](./task-110-detailview-container.md) — provides the right pane this task width-caps
  - [T143: chain → tree rework (R17.26-R17.29)](./task-143-traceability-tree-rework.md) — tree-item rendering layout T167 makes mobile-first
  - [T165: tree renders ALL 7 typed classes](./task-165-tree-renders-all-7-typed-classes.md) — full coverage T167 styles
- chain (req → task → usecase(s) → class → method → implementation → test(s); 1:N at plural hops, per T168 / PO 2026-06-02) — architect fills on refinement
  - **requirement:** R-D (above)
  - **use case:** UC-TBD (architect — likely `trace.layout.mobile` / `detail.widthCap`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** `src/public/app.css` (and any `/trace` page CSS) — TBD
  - **implementation:** TBD
  - **test:** visual + responsive E2E spec TBD

## Context

Tron R-D (compound-requirement-source-2 completion 2026-06-02): `/trace` needs
to be **mobile-first** and the right pane (detail drawer / DetailViewContainer
from T110) needs a **hard width-cap** so it doesn't dominate small screens.

Today's `/trace` was built browser-first; on iPhone the layout cramps + the
drawer can fill the viewport. Tron asks for mobile-first reflow + an upper
bound on the right pane's width so the tree remains visible/usable.

## Intention

### Why this task exists
`/trace` is the primary navigation surface for the now-complete 7-class tree
(T165+T166). It must work well on iPhone — Tron's primary device.

### Problems this task solves
- `/trace` layout assumes desktop widths
- Detail drawer can dominate small viewports
- No width-cap rule for the right pane (any class's DetailView can sprawl)

### How it solves them
- Architect specifies mobile-first breakpoints + tree-primary stacking rule
- Hard `max-width` on right pane (architect picks the value — e.g. 480px / 50vw)
- Expert applies CSS; rule-pair (a)+(b) for cache invalidation

## Acceptance Criteria

- [ ] AC1 — `/trace` layout works mobile-first (iPhone 375px viewport: tree usable, no horizontal scroll)
- [ ] AC2 — Hard width-cap on right (detail) pane: enforces architect-specified max-width on all DetailViews (Req/Task/UC/Class/Method/Test/Impl)
- [ ] AC3 — Desktop layout (≥768px or architect's breakpoint) preserves the split tree+detail experience without regression
- [ ] AC4 — Width-cap holds when the detail content is wide (long titles, code blocks, deep chain links)
- [ ] AC5 — No regression on T110/T111/T143/T165/T166 (drawer + DetailViews + tree-item rendering)
- [ ] AC6 — `npm run build` succeeds; all existing tests pass
- [ ] AC7 — **Rule-pair (a)+(b) [#15+#16]:** package.json bump + sw.js CACHE_NAME bump in same commit-set; (c) STATIC_SHELL exempt (no new route)

## QA Audit & User Feedback

- 2026-06-02: PO directed planner-first stand-up of T167 (R-D from compound-source-2 Tron completion). CMM4 4-role; real v4 uuids; rule-pair (a)+(b) in AC7+DoD. Awaiting req-eng anchor → architect design → expert impl → tester verify → Tron QA.
- 2026-06-02: robbin-req anchored verbatim Tron R-D quote in traceability section.

## Subtasks

None (atomic).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 28 (mobile-first + width-cap)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 2 (Tron's primary device usability)*
