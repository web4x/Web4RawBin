[Back to Sprint 17 Planning](./planning.md)

# T174: /trace drawer UX cleanups (consolidates R-M1 + R-M2 + R-M4)
[task:uuid:46b7eadf-d0ae-4950-9602-cc96390c3697]

> **PO direction 2026-06-03:** Stand up planner-first for R-M1/M2/M3/M4. Planner
> SPLIT call: T174 = UX cleanups on the existing /trace drawer (M1/M2/M4);
> T175 = new /scenario route + IOR-seeded lazy tree (M3, meatiest). T174 stays
> scoped to the existing drawer; no new route, no component composition change.

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req-eng captures verbatim R-M1/M2/M4 → architect refines)
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
  - **R-M1** `[requirement:uuid:5d34db40-d4d6-4dea-9513-4cbff01175c5]` — UX cleanup on /trace drawer (req-eng: capture verbatim Tron quote)
  - **R-M2** `[requirement:uuid:c970f251-2e1f-405d-955c-218f7040a983]` — UX cleanup on /trace drawer (req-eng: capture verbatim Tron quote)
  - **R-M4** `[requirement:uuid:fa1bd28e-1960-4a42-bc5e-909c5f0ad1c1]` — UX cleanup on /trace drawer (req-eng: capture verbatim Tron quote)
- follows
  - T173 (/trace lazy-load + /trace?ior=, ✅ v0.5.70) — drawer is the existing surface T174 cleans up
- related
  - T175 (R-M3 new /scenario route — separate task, reuses /trace view components)
- down
  - None (atomic task — 3 small UX fixes scoped to the drawer)

## Task Description (placeholder — req-eng to fill verbatim)

**PO seed (2026-06-03):** Three UX cleanups on the existing `/trace` drawer
(`rb-detail-drawer` + adjacent tree/detail surfaces from T110/T158/T173).
Scope is the **existing** drawer — no new route, no new components.

**Pending:** req-eng captures verbatim Tron quotes for R-M1, R-M2, R-M4 from
PO's relay; each becomes a one-sentence atomic requirement (per R-I / R-H.2
standing rule). Architect then diagnoses + designs concrete diffs. Until those
land, AC list below is a placeholder skeleton — to be replaced by req+architect.

## Owners (CMM4 — 4-role per learning #18)
- **robbin-req** — capture verbatim Tron quote for each of R-M1, R-M2, R-M4 → one-sentence atomic requirements
- **robbin-architect** — refine: diagnose root cause + design concrete diffs on the drawer
- **robbin-expert** — implement per design; rule-pair (a) `package.json` + (b) `sw.js` CACHE_NAME bumps
- **robbin-tester** — verify each AC (one per R-M item); confirm no regression on T173 surfaces

## Acceptance Criteria (skeleton — req+architect to refine per verbatim)

**R-M1 (UX cleanup #1):**
- [ ] AC1 — (pending verbatim) — fix as described in R-M1 quote
- [ ] AC2 — no regression on /trace tree expansion (T173 AC5-AC9)

**R-M2 (UX cleanup #2):**
- [ ] AC3 — (pending verbatim) — fix as described in R-M2 quote

**R-M4 (UX cleanup #3):**
- [ ] AC4 — (pending verbatim) — fix as described in R-M4 quote

**Backwards-compat + ship rules:**
- [ ] AC5 — no regression on T173 (drawer + lazy-load endpoints unchanged in behavior)
- [ ] AC6 — Rule-pair (a) `package.json` bump + (b) `sw.js` CACHE_NAME bump; (c) STATIC_SHELL exempt (no new HTML route — same `/trace`)
- [ ] AC7 — `npm run build` clean; full test suite passes

## Subtasks
None (atomic task — three small UX fixes; each AC pair is one drawer-local change).

## QA Audit & User Feedback
- 2026-06-03: PO directs stand-up of T174/T175 covering R-M1/M2/M3/M4. PO hint: M1/M2/M4 are "UX cleanups on the existing drawer"; M3 is meatiest (separate T175). Planner scaffolded T174 + T175 planner-first; verbatim Tron quotes pending req-eng capture.
- Pending: req-eng verbatim capture → architect refinement → expert impl → tester verify → Tron QA.

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 30 — R-M (drawer UX cleanups + new /scenario route)
**Companion:** T175 (R-M3 new /scenario route)
**R-M1+M2+M4:** consolidated drawer-scoped UX cleanups; one task to ship them together
