[Back to Sprint 17 Planning](./planning.md)

# T177: /scenario ior-format 'Not found' — bare-uuid vs ior:instance: prefix (completes T173 dead-end fix)
[task:uuid:44bef447-f036-4ec4-9c1d-8479d0438d5d]

> **PO direction 2026-06-03:** New bug stand-up. /scenario shows "Not found" for
> some UUIDs depending on ior-format (bare-uuid vs `ior:instance:<uuid>` prefix).
> Architect diagnosing. This **completes T173's dead-end fix** — T173 routed
> `.scenario.json` clicks to `/scenario?ior=<uuid>` (no more 404), but the
> /scenario page itself now mis-handles certain ior formats and renders "Not
> found". One more lookup-normalization layer to close the dead-end story.
> 4-role.

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect diagnosing — root cause of bare-vs-prefix lookup divergence)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability
- up
  - [Sprint 17 Planning](./planning.md)
  - PO directive 2026-06-03 (Tron-relayed via robbin-po): /scenario ior-format "Not found" for some UUIDs (bare vs ior:instance: prefix)
  - **R-P** `[requirement:uuid:37e4eefc-72a6-4013-b009-248e07f8556a]` — /scenario must resolve any valid ior format (bare-uuid OR `ior:instance:<uuid>`) without "Not found" (planner pre-seed; req-eng to anchor verbatim when captured)
- follows
  - T173 (`.scenario.json` click routing → /scenario?ior= — T177 completes the dead-end fix by ensuring /scenario itself resolves the ior)
  - T174 (/scenario route + IOR-seeded tree — T177 fixes ior lookup inside that route)
- down
  - None (atomic task — one lookup-normalization layer)

## Task Description (planner seed — architect diagnosing; req-eng to capture verbatim)

**Symptom (PO 2026-06-03):** /scenario shows "Not found" for some UUIDs. The
divergence is along ior-format lines: a **bare uuid** (e.g. `46b7eadf-d0ae-…`)
behaves differently from a **prefixed ior** (`ior:instance:46b7eadf-d0ae-…`).
One of the two forms resolves; the other yields "Not found".

**Where this lives:**
- Server `/api/trace/children/<uuid>` + `/api/trace/ancestry/<uuid>` (T173) —
  these take a path segment; whether that segment is bare or prefixed determines
  the index lookup.
- Client `scenario-view.ts` / `rb-trace-tree.ts` (T174 lazy-load) — how it
  forwards the `?ior=` param to the server endpoints.
- `ScenarioIndex.get()` (T125 indexing primitive) — the indexer's key shape.

**Hypothesis for architect to verify:** the index normalizes one form but not
the other; the URL-passing layer doesn't normalize before fetch. Fix is a single
canonicalization layer (strip-or-add the `ior:instance:` prefix consistently at
the boundary).

## Owners (CMM4 — 4-role per learning #18)
- **robbin-req** — capture verbatim Tron quote (when relayed) for R-P → one-sentence atomic requirement
- **robbin-architect** — diagnose root cause (which boundary loses the prefix); design the canonicalization layer (where + how)
- **robbin-expert** — implement architect's design; rule-pair (a)+(b); (c) likely **exempt** (no new route — fixes existing /scenario lookup)
- **robbin-tester** — verify both ior formats resolve in /scenario (bare-uuid + `ior:instance:` prefix); regression check that T173 file-browser click flow still lands on a resolved view (no "Not found")

## Acceptance Criteria

**R-P (ior format normalization at /scenario):**
- [ ] AC1 — `/scenario?ior=<bare-uuid>` resolves and renders the instance tree (no "Not found")
- [ ] AC2 — `/scenario?ior=ior:instance:<uuid>` resolves identically — same instance, same tree
- [ ] AC3 — `/api/trace/children/<bare-uuid>` returns the same payload as `/api/trace/children/ior:instance:<uuid>` for the same instance
- [ ] AC4 — `/api/trace/ancestry/<bare-uuid>` parity with the prefixed form
- [ ] AC5 — Architect's chosen canonicalization point documented in this file (boundary location + direction: strip-on-entry vs add-on-entry)
- [ ] AC6 — T173 file-browser click flow (`.scenario.json` → `/scenario?ior=`) never lands on "Not found" for any valid scenario UUID in the index

**Backwards-compat + ship rules:**
- [ ] AC7 — `/trace` behavior UNCHANGED — full-tree mount + lazy expand unaffected
- [ ] AC8 — `/api/trace/{roots,children,ancestry}` endpoints unchanged in behavior beyond the normalization layer
- [ ] AC9 — Rule-pair (a) `package.json` bump + (b) `sw.js` CACHE_NAME bump; (c) STATIC_SHELL **exempt** (no new route — fixes lookup inside existing /scenario)
- [ ] AC10 — `npm run build` clean; full test suite passes; new ior-format spec passes

## Subtasks
None (atomic task — one canonicalization layer fix per architect's design).

## QA Audit & User Feedback
- 2026-06-03: PO directs T177 stand-up — "/scenario ior-format 'Not found' for some UUIDs (bare vs ior:instance: prefix) — architect diagnosing, completes the T173 dead-end fix. 4-role." Planner scaffolded T177 planner-first with placeholder ACs awaiting architect diagnosis + req-eng verbatim capture (if Tron quote relayed).
- Pending: architect diagnoses + designs the canonicalization layer → expert impls → tester verifies both ior formats resolve → Tron QA.

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** 33 — R-P (ior-format normalization; completes T173 dead-end story)
**Follows:** T173 (file-browser → /scenario?ior= routing), T174 (/scenario route + lazy tree)
**Rule-pair scope:** (a)+(b) required; (c) STATIC_SHELL exempt (no new route).
