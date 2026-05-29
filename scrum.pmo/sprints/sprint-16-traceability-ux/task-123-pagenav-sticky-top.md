[Back to Sprint 16 Planning](./planning.md)

# T123: pageNav() sticky-top fix

[task:uuid:05e394aa-d21b-4aaa-88ba-611cd427c2f1]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect — DONE; expert implementing)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owner:** robbin-expert (implement), robbin-tester (verify)
**This file is the single source of truth.** Expert and tester work from this file alone — no chat clarification.

## Traceability

`[task:uuid:05e394aa-d21b-4aaa-88ba-611cd427c2f1]`

- up
  - [Sprint 16 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:b2237873-39b9-4154-9624-f809a9ca4983]` —
    "pageNav() should be sticky to the top." (Tron directive 2026-05-29; req-eng
    captured the verbatim quote in this slot.)
- down
  - None (atomic task)
- follows
  - server.ts pageNav() rendering on /trace + /md routes (existing surface; T123 adds the missing sticky behavior)
- chain (req → usecase → puml → class/method)
  - **requirement:** Tron 2026-05-29 (req-uuid above)
  - **use case:** existing pageNav render UC (server.ts:293); T123 adds CSS positioning, no new UC
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (no PUML change required — server-side rendering tweak)
  - **class/method:** `src/ts/server/server.ts` → `pageNav()` (line ~293); inline CSS added so the rendered `<nav>` element is `position: sticky; top: 0;`

## Architect Diagnosis (already complete)
Not a regression — **missing feature**. `pageNav()` at `server.ts:293` renders a top-of-page navigation block but the rendered markup/inline-CSS lacks `position: sticky; top: 0;`. Today the nav scrolls away with the page. Tron wants it pinned. Surface-only fix.

## Task Description
Make the `pageNav()` output sticky to the top of the viewport on every page that
uses it (today: `/trace` browser, `/md/*` rendered docs/SVGs/PUMLs). Implement
via inline CSS on the rendered `<nav>` element (or the wrapper it lives in)
inside `pageNav()` at `src/ts/server/server.ts:293`.

## Acceptance Criteria
- [ ] AC1 — `pageNav()` rendered output stays anchored to the viewport top while the user scrolls the page body
- [ ] AC2 — Works on `/trace` (rb-trace-view tree) and `/md/*` (markdown/SVG/PUML viewer) — both routes that consume pageNav today
- [ ] AC3 — Does not interfere with the drawer (T110/T120/T122) at the bottom of `/trace`; z-index ordering stays sane
- [ ] AC4 — Mobile (iPhone Safari) — pageNav stays at top respecting safe-area-inset-top where applicable
- [ ] AC5 — `npm run build` succeeds; vitest + playwright pass; **(a) package.json + (b) sw.js CACHE_NAME bumped** per learnings #15. **(c) STATIC_SHELL exempt** per #16 (no new route — confirm in commit message)

## Test Scenarios

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Open `/trace`, scroll the tree downwards | `pageNav` stays pinned to viewport top; tree content scrolls beneath it |
| TS2 | Open a long `/md/<long-doc>.md`, scroll | `pageNav` stays pinned to viewport top |
| TS3 | iPhone viewport (375×812) | `pageNav` sits at top, safe-area-inset-top respected, content not hidden behind it |
| TS4 | `/trace` with drawer (T110) open + scroll tree | `pageNav` top-fixed + drawer bottom-fixed coexist without overlap or z-fight |

## Dependencies
- **Requires:** None (server-side inline CSS only)
- **Coordinate-with:** T120 (dark drawer bg) and T122 (drawer sticky-bottom) — peer surface work; no expected conflict
- **Enables:** consistent top-nav UX across the docs + trace routes

## Definition of Done
- [ ] All AC met; traceability chain complete + links resolve
- [ ] Tests pass, build clean
- [ ] (a) package.json + (b) sw.js CACHE_NAME bumped (learnings #15); (c) STATIC_SHELL exempt — no new route (learnings #16)
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-29: Tron directive — pageNav must be sticky to the top. Architect diagnosed at server.ts:293 (missing feature, not regression). Expert implementing now per PO 2026-05-29. Awaiting impl commit + tester verify, then Tron QA.

## Subtasks
None (atomic task — small server-side inline-CSS addition).

---

*Sprint 16 — Traceability UX & DetailViews · Phase 4 (Tron iteration)*
*Owner: robbin-expert (impl), robbin-tester (verify)*
*Priority: 10 (small UI nav fix on shared docs/trace pageNav)*
