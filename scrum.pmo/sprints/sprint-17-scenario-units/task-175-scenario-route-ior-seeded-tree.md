[Back to Sprint 17 Planning](./planning.md)

# T175: new `/scenario` route — IOR-seeded lazy tree reusing /trace components (R-M3)
[task:uuid:5514c6bd-4715-407f-a59c-c9a84bc1fcab]

> **PO direction 2026-06-03:** "R-M3 is the meatiest: new /scenario route reusing
> /trace view components but seeded from a single IOR + lazy-loaded tree from
> there. /trace stays full-tree from req roots." Split out from T174 (planner
> call) because R-M3 introduces a new route + new tree-seed semantics — different
> structural surface from M1/M2/M4 drawer cleanups; deserves its own task with
> its own rule-pair + STATIC_SHELL gate (per learning #16).

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req-eng captures verbatim R-M3 → architect refines)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability
- up
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source-2.md](./compound-requirement-source-2.md) *(or successor file — req-eng to anchor on the verbatim Tron source when captured)*
  - **R-M3** `[requirement:uuid:cc673ef3-9581-4143-a978-bd734589c594]` — new `/scenario` route reusing /trace components, seeded from a single IOR, lazy tree from there (req-eng: capture verbatim Tron quote)
- follows
  - T110/T158 (`rb-detail-drawer` + DetailViews — components to reuse)
  - T173 (`/api/trace/{roots,children,ancestry}` lazy-load endpoints — used by the seeded tree; `/trace?ior=` is the precedent navigation pattern)
- related
  - T174 (R-M1/M2/M4 drawer UX cleanups — sibling task)
- down
  - None (atomic task)

## Task Description (placeholder — req-eng to fill verbatim)

**PO seed (2026-06-03):** Stand up a **new `/scenario` route** that reuses the
existing `/trace` view components (tree + drawer + DetailViews) but with a
different seeding model:

- **`/trace`** (unchanged): full tree mounted from all Requirement roots; lazy
  expansion downward per LOCKED chain (T173 behavior).
- **`/scenario`** (NEW, this task): single-IOR-seeded tree. The route takes one
  IOR (likely `/scenario?ior=<uuid>` or `/scenario/<uuid>`) and renders a tree
  rooted at THAT instance, lazy-loading downward from there. Reuses
  `rb-trace-tree`, `rb-detail-drawer`, and the DetailView components.

**Pending:** req-eng captures verbatim Tron quote for R-M3 → one-sentence
atomic requirement (per R-I / R-H.2 standing rule). Architect then designs:
URL shape, server route handler, client mount point (new entry bundle? or
parameterized trace-page?), how the tree component takes an alternate root
seed, default behavior at the new root (auto-expand? show details?). Until
those land, ACs below are skeleton.

## Owners (CMM4 — 4-role per learning #18)
- **robbin-req** — capture verbatim Tron quote for R-M3 → one-sentence atomic requirement
- **robbin-architect** — refine: design `/scenario` URL shape + server handler + client mount + how the tree component takes an IOR seed instead of all-roots
- **robbin-expert** — implement per design; rule-pair (a)+(b); **(c) STATIC_SHELL** REQUIRED if a new HTML shell / new bundle is emitted (per learning #16)
- **robbin-tester** — verify ACs (URL works, tree seeds from IOR, lazy-load behaves per LOCKED chain, no regression on /trace)

## Acceptance Criteria (skeleton — req+architect to refine per verbatim)

**R-M3 (new `/scenario` route, IOR-seeded lazy tree):**
- [ ] AC1 — A new route exists at `/scenario` (exact URL shape per architect) that mounts a tree view
- [ ] AC2 — Route accepts a single IOR (e.g. `?ior=<uuid>` or path segment) — the IOR is the **single seed/root** of the rendered tree
- [ ] AC3 — Tree component is reused from `/trace` (no fork; same `rb-trace-tree` / `rb-detail-drawer` / DetailViews)
- [ ] AC4 — Children are lazy-loaded downward from the seeded root per LOCKED chain (T168 CANONICAL_WALK) via the same `/api/trace/children/<uuid>` endpoint (T173)
- [ ] AC5 — `/trace` behavior is UNCHANGED — full-tree mount from all Requirement roots (no regression)
- [ ] AC6 — Detail pane on `/scenario` opens the seeded instance's DetailView on mount

**Backwards-compat + ship rules:**
- [ ] AC7 — `/api/trace/{roots,children,ancestry}` endpoints (T173) unchanged in behavior
- [ ] AC8 — Rule-pair (a) `package.json` bump + (b) `sw.js` CACHE_NAME bump
- [ ] AC9 — **(c) STATIC_SHELL** entry for `/scenario` route + any new bundle path IF the route emits a new HTML shell / dedicated bundle (per learning #16 — route-introducing task pre-gate); if `/scenario` is implemented by extending the existing `/trace` bundle/shell with route handling client-side, (c) is exempt — architect to declare which model
- [ ] AC10 — `npm run build` clean; full test suite passes

## Subtasks
None (atomic task).

## QA Audit & User Feedback
- 2026-06-03: PO directs stand-up of T174/T175 covering R-M1/M2/M3/M4. PO hint for R-M3: "new /scenario route reusing /trace view components but seeded from a single IOR + lazy-loaded tree from there. /trace stays full-tree from req roots." Planner scaffolded T175 (split out from T174) because R-M3 is structurally different (new route, possibly new shell — different rule-pair (c) gate).
- Pending: req-eng verbatim capture → architect refinement (URL shape, mount model, (c) declaration) → expert impl → tester verify → Tron QA.

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 30 — R-M (drawer UX cleanups + new /scenario route)
**Companion:** T174 (R-M1/M2/M4 drawer UX cleanups)
**R-M3:** new `/scenario` route, IOR-seeded lazy tree; reuses /trace components; /trace stays full-tree
