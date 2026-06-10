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

## Traceability

**UseCases:**
- [🔗 pageNav.stickyTop](../usecase/pagenav-stickytop.md)


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

## QA Audit & User Feedback

- 2026-05-29: Tron directive — pageNav must be sticky to the top. Architect diagnosed at server.ts:293 (missing feature, not regression). Expert implementing now per PO 2026-05-29. Awaiting impl commit + tester verify, then Tron QA.

## Subtasks

None (atomic task — small server-side inline-CSS addition).

---

*Sprint 16 — Traceability UX & DetailViews · Phase 4 (Tron iteration)*
*Owner: robbin-expert (impl), robbin-tester (verify)*
*Priority: 10 (small UI nav fix on shared docs/trace pageNav)*
