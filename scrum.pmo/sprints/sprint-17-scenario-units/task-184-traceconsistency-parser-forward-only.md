[Back to Sprint 17 Planning](./planning.md)

# T184: TraceConsistency .md-parser forward-only — strip backward keys at source so /api/trace is forward-only end-to-end (R-Z1)
[task:uuid:ab0cbe5f-d097-42c7-a1a4-82339a468ad6]

> **PO direction 2026-06-05 (LOW priority):** T181 closed forward-only DISPLAY +
> tree filter — Tron never sees backward keys. Tester then flagged the /api/trace
> *graph* still carries backward `requirements` keys on 42 Tasks at the source
> (TraceConsistency .md-parser layer; scenario index is already clean). Display
> hides them, but the data isn't forward-only end-to-end — violates Tron's
> "no-back-chaos" principle. T184 strips them at the parser so /api/trace is
> forward-only from source. Defense-in-depth: T181 display/tree filters remain
> as belt-and-braces guards.

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect — diagnose parser layer; design FORWARD_KEYS filter at emit)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability
- up
  - [Sprint 17 Planning](./planning.md)
  - **R-Z1** `[requirement:uuid:d9c419b3-8b36-4b8b-821b-b1171da62ab7]` — TraceConsistency .md-parser must emit forward-only links; /api/trace graph forward-only end-to-end (Tron's no-back-chaos principle at source, not just display).
  - Tester residual flag 2026-06-05 — 42 Tasks carry backward `requirements` keys at /api/trace despite scenario index clean + T181 display/tree filters working.
- follows
  - T181 (DISPLAY forward-only — closed in-scope; filters remain as defense-in-depth)
  - T172 (scenario data forward-only — DATA layer already clean; T184 fixes the *parsed* graph that mixes in .md-derived backward refs)
  - T168 (LOCKED chain canonical direction)
- down
  - None (atomic task)

## Task Description

**Source of the backward keys in /api/trace** (tester finding 2026-06-05):
- Scenario index `scenario/index/<5char>/<uuid>.scenario.json` — **clean** (forward-only since T172).
- TraceConsistency .md-parser — **dirty** (parses task `.md` files into graph nodes; emits backward `requirements` keys on 42 Task nodes the .md format expressed historically).

**Fix scope (architect to confirm):** apply the same `FORWARD_KEYS` filter T181 introduced at the DetailView render layer, **but at the parser emit step** in TraceConsistency. The graph returned by `/api/trace` (used by trace-cli, audit tools, and the lazy-load `/api/trace/{roots,children,ancestry}` endpoints) must contain forward-only edges per LOCKED chain — Requirement.tasks[], Task.useCases[], UseCase.classes[], Class.methods[], Method.implementations[], Implementation.tests[]. No backward keys at the data source.

**Why LOW priority:** T181's display + tree filter mean the user never sees backward keys today. T184 completes the no-back-chaos principle at the data layer so audits, CI tools, and any future graph consumer see only forward edges. Belt-and-braces preserved.

## Owners (CMM4 — 4-role per learning #18)
- **robbin-req** — anchor R-Z1 verbatim if Tron-relayed (current capture is tester-finding-plus-PO-direction; may not need a separate Tron quote)
- **robbin-architect** — diagnose .md-parser code path (which fn emits the backward keys; what node shape does the parser produce); design FORWARD_KEYS filter at emit; confirm scope (.md-only or include other parsers if any)
- **robbin-expert** — implement filter at parser emit; rule-pair (a)+(b); (c) likely EXEMPT (data-pipeline only, no user surface change — display already forward-only via T181)
- **robbin-tester** — verify `/api/trace` graph emits zero backward keys on all 42 historically-dirty Tasks; trace-cli + audit reports remain consistent; T181 display/tree filters still see forward-only data (defense-in-depth intact); T183 7-hop gate unchanged

## Acceptance Criteria

**R-Z1 — parser forward-only at emit:**
- [ ] AC1 — TraceConsistency .md-parser applies FORWARD_KEYS filter at the emit step
- [ ] AC2 — `/api/trace` returns zero backward `requirements` keys on Task nodes (was 42)
- [ ] AC3 — `/api/trace` returns zero backward keys on any node type (UseCase/Class/Method/Impl/Test included)
- [ ] AC4 — trace-cli output unchanged from user perspective (display layer still forward-only)
- [ ] AC5 — T181 DetailView + tree filters still operating (defense-in-depth — they receive forward-only data, no behavior change)

**Backwards-compat + ship rules:**
- [ ] AC6 — T183 7-hop CI gate count unchanged (or improves) — fewer backward edges does not break forward reachability
- [ ] AC7 — Rule-pair (a) `package.json` bump + (b) `sw.js` CACHE_NAME bump; (c) STATIC_SHELL likely EXEMPT (data-pipeline only; architect to confirm)
- [ ] AC8 — `npm run build` clean; full test suite passes; trace audits remain at 0 issues

## Subtasks
None (atomic task — single parser-layer fix).

## QA Audit & User Feedback
- 2026-06-05: PO direction — T181 closed (forward-only DISPLAY shipped v0.5.83). Tester flagged residual at /api/trace graph layer: 42 Tasks still carry backward `requirements` keys despite scenario index clean. Source is TraceConsistency .md-parser. PO stands up T184 (LOW priority — display already clean) to complete the no-back-chaos principle at source. 4-role planner-first.
- Pending: architect refinement (.md-parser code-path diagnosis + filter design), expert impl (rule-pair (a)+(b); (c) likely exempt), tester verifies `/api/trace` graph is forward-only end-to-end. Then Tron QA.

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 40 — R-X (parser-layer forward-only / no-back-chaos at source)
**Priority:** LOW (PO 2026-06-05 — display already clean via T181; T184 completes the principle)
**Companion:** T181 (DISPLAY forward-only, closed)
