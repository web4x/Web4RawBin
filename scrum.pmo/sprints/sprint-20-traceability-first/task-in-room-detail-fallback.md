[Back to Sprint 20 Planning](./planning.md)

# T-BUG7B: In-room detail fallback — fetchDetailData() when no TraceGraph

[task:uuid:b7f0c1a4-8d23-4e69-a512-3f9c6e0d2b88]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only.

## Traceability
- up
  - [Sprint 20 Planning](./planning.md)
  - BUG7 (Tron, 2026-06-14): in-room detail content blank. Root = drawer.graph never set.
- down
  - None (atomic task)
- relates
  - BUG7 /trace 1-line fix (drawer.graph set) ships in v0.6.18 — this task is the SEPARATE larger in-room path.

## Context
BUG7 root: on /trace, `drawer.graph` was never set → typed-detail components (rb-task-detail / rb-requirement-detail / rb-usecase-detail / rb-detail-view) call `graph.get(uuid)` → null → blank detail. The /trace case is a 1-line fix (set drawer.graph) in v0.6.18. BUT the **in-room surface has NO TraceGraph** — there's no graph to get from — so the typed-detail components still render blank in rooms. They need a data-fetch fallback.

## Task Description
Add a `fetchDetailData(ref)` fallback to the typed-detail components (or a shared base): when `graph` is null OR `graph.get(refUuid(ref))` returns null, fetch the object via API (e.g. `GET /api/trace/object/<type>/<uuid>` or the existing trace data endpoint) → build a minimal object with the fields the view renders (title, type, status, links) → render. So detail content shows in rooms too, not only on /trace where the full graph exists.
- Async render path (loading state while fetching).
- Reuse the same view markup; only the data source differs (graph vs fetch).
- Graceful: if fetch also fails (object not found), show a clear "detail unavailable" state, not blank.

## Acceptance Criteria
- [ ] AC1 — In a ROOM (no TraceGraph), tapping an item with a detail ref shows its detail content (not blank)
- [ ] AC2 — fetchDetailData() triggers only when graph is null or graph.get() returns null (graph path unchanged on /trace)
- [ ] AC3 — Loading state shown while fetching; clear "unavailable" state if the object isn't found (never silent-blank)
- [ ] AC4 — /trace path (graph present) unchanged — no regression
- [ ] `npm run build` succeeds; version + sw.js bumped; deploy build-verified (per d3919e7a)

## Test Scenarios
| Test | Action | Expected |
|------|--------|----------|
| TS1 | in-room, tap detail item (no graph) | detail content renders via fetchDetailData |
| TS2 | fetch returns 404 | "detail unavailable" state, not blank |
| TS3 | /trace, graph present | renders via graph (fallback NOT used) — no regression |

## Dependencies
- **Requires:** BUG7 /trace graph-set fix (v0.6.18) for the /trace path
- **Enables:** in-room detail surface works (Tron's in-room UX)

## Definition of Done
- [ ] All AC met; in-room detail renders, /trace unaffected
- [ ] Tests pass, build clean + build-verified-in-dist
- [ ] Tron QA approved (in-room device-verify, per anti-false-green E2E standard)

## QA Audit & User Feedback
- 2026-06-14: Created by planner per PO directive (BUG7 in-room fallback, larger than the v0.6.18 1-line /trace fix). Awaiting refinement + impl.

## Subtasks
None (atomic task).

---

*Sprint 20 — Traceability-First*
*Owner: robbin-expert (implement), robbin-tester (verify)*
*Priority: HIGH (in-room detail blank — Tron UX)*
