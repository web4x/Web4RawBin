[Back to Sprint 16 Planning](./planning.md)

# T122: DetailsViewContainer sticky-to-bottom

[task:uuid:bbca5514-a5c0-4a32-8be4-bf1133290c7a]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
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

`[task:uuid:bbca5514-a5c0-4a32-8be4-bf1133290c7a]`

- up
  - [Sprint 16 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:bca276d9-8ff6-4234-a562-19e15e4ab8fb]` —
    "the detailsViewContainer is not sticky to the bottom" (Tron directive
    2026-05-29; req-eng to confirm/anchor the literal verbatim quote in this slot.)
- down
  - None (atomic task)
- follows
  - [T110: DetailViewContainer](./task-110-detailview-container.md) — drawer (sticky-bottom is a positioning fix on the same surface)
- chain (req → usecase → puml → class/method)
  - **requirement:** r122-detailview-sticky-bottom (Tron 2026-05-29)
  - **use case:** existing `detailDrawer.open` / `detailDrawer.close` (T110) — positioning fix; no new UC
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (no PUML change required)
  - **class/method:** `src/public/app.css` (`rb-detail-drawer` positioning) and/or `src/public/ts/trace/rb-detail-drawer.ts` if a JS-side anchor is required

## Task Description
Tron 2026-05-29 (literal quote — req-eng to confirm exact wording):
> "the detailsViewContainer is not sticky to the bottom"

The drawer (`rb-detail-drawer`, T110) must remain anchored to the **viewport
bottom** regardless of scroll position. Current CSS uses `position: fixed;
bottom: 0; left: 0; right: 0` — verify whether this is actually being applied,
whether a stacking-context / overflow ancestor is breaking the fixed-position
behavior, or whether the drawer is rendered inside a container that constrains
it. Fix so the drawer stays glued to the viewport bottom on all routes that
host it (today: `/trace`).

## Context
Tron iteration after using the live `/trace` browser. T120 (black background)
is a peer surface change; this is the positioning fix. Both target the same
component (`rb-detail-drawer`) — coordinate with T120 to avoid step-on commits.

## Acceptance Criteria
- [ ] AC1 — `rb-detail-drawer` stays anchored to the viewport bottom (`position: fixed; bottom: 0`) regardless of `/trace` page scroll position
- [ ] AC2 — Behavior holds on iPhone Safari (safe-area-inset-bottom respected — drawer does not hide behind the home indicator)
- [ ] AC3 — slideUp/slideDown + swipe-down dismiss + ESC + outside-click (T110 behaviors) unchanged
- [ ] AC4 — No regression with T120's black background (peer task — coordinate on the same component)
- [ ] AC5 — Tree (above the drawer) remains scrollable and visible
- [ ] AC6 — `npm run build` succeeds; vitest + playwright pass; **version + sw.js bumped** per learnings #15
- [ ] AC7 — **STATIC_SHELL untouched** per learnings #16 (no new route — confirm in commit message)

## Test Scenarios

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Open `/trace`, scroll the tree | Drawer (when open) stays anchored to viewport bottom; does not scroll with the tree |
| TS2 | Open drawer on a long tree, then scroll | Drawer stays bottom-fixed; backdrop/blur (if any) remains correct |
| TS3 | iPhone viewport (375×812) | Drawer respects safe-area-inset-bottom; no overlap with home indicator |
| TS4 | Open drawer → resize viewport (desktop browser) | Drawer re-anchors to new viewport bottom; no overflow/jump |
| TS5 | T120 black-bg applied + T122 sticky-bottom together | Both behaviors coexist; no CSS conflict |

## Dependencies
- **Requires:** T110 (drawer)
- **Coordinate-with:** T120 (peer surface change on same component)
- **Enables:** Tron's iteration on the live /trace browser UX

## Definition of Done
- [ ] All AC met; traceability chain complete + links resolve
- [ ] Tests pass, build clean
- [ ] Version + sw.js bumped (learnings #15); STATIC_SHELL untouched (learnings #16 — no new route, confirm)
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-29: Tron directive — drawer not sticky to bottom. Routed via PO. Awaiting req formal quote anchor + expert impl + tester verify, then Tron QA.

## Subtasks
None (atomic task — small CSS positioning fix).

---

*Sprint 16 — Traceability UX & DetailViews · Phase 4 (Tron iteration)*
*Owner: robbin-expert (UI positioning), robbin-tester (verify)*
*Priority: 9 (small UI fix on shipped drawer)*
