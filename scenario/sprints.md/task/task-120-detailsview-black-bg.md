# T120: DetailsView black background
[task:uuid:e7cb6434-97a2-4752-8d63-f8bea13646b6]

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

## Traceability

`[task:uuid:e7cb6434-97a2-4752-8d63-f8bea13646b6]`

- up
  - [Sprint 16 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:20be0ac2-3a4b-41ef-b744-72354c90d62f]` —
    "DetailsView (the drawer's typed views) must have a black background."
    (Tron directive 2026-05-29; req-eng to capture the literal verbatim quote
    in this slot.)
- down
  - None (atomic task)
- follows
  - [T110: DetailViewContainer](./task-110-detailview-container.md) — drawer
  - [T111: Specialized DetailViews](./task-111-detail-views.md) — typed views inside the drawer
- chain (req → usecase → puml → class/method)
  - **requirement:** r120-detailsview-black-bg (Tron 2026-05-29)
  - **use case:** existing UC `detailDrawer.open` / `detailDrawer.close` (T110) and the per-type `rb-*-detail` render UCs (T111); T120 changes the rendered surface, not the lifecycle
  - **puml:** [diagrams/s16-usecases.puml](./diagrams/s16-usecases.puml) (no PUML change required — surface-only)
  - **class/method:** `src/public/app.css` (`rb-detail-drawer` background + `.dv-*` typography color) and/or `src/public/ts/trace/rb-detail-drawer.ts` (if scope requires an attribute / theme hook)

## Task Description

Tron 2026-05-29 (literal quote to be filled in by req-eng):
> "<verbatim Tron quote pending req capture>"

Change the DetailsView surface (the drawer + its hosted typed views from T111
— `rb-task-detail`, `rb-requirement-detail`, `rb-usecase-detail`, and the
generic `rb-detail-view` fallback) from the current white/light surface to a
**black background**. Preserve readability — text + link colors must achieve
adequate contrast on black; type badges (`dv-type-task` blue, `dv-type-requirement`
green, `dv-type-usecase` orange) re-tinted as needed for black-bg legibility.

## Context

Surface-level UI change to the drawer + DetailViews shipped in S16 Phase 1
(T110 + T111). Tron iteration after using the live `/trace` browser on device.

## Acceptance Criteria

- [ ] AC1 — `rb-detail-drawer` background is black (or near-black, architect/expert call within Tron's intent); existing slideUp/Down + dismiss behavior unchanged
- [ ] AC2 — Hosted typed views (`rb-task-detail`, `rb-requirement-detail`, `rb-usecase-detail`, `rb-detail-view`) render legibly on the black background — body text, labels, links, code blocks all readable (WCAG contrast where reasonable)
- [ ] AC3 — Type badges (`dv-type-task` / `dv-type-requirement` / `dv-type-usecase`) remain visually distinct against black
- [ ] AC4 — Chain link rows (`dv-link`, `dv-rel`, `dv-link-title`) remain tappable + visually distinguishable
- [ ] AC5 — No regression: tree (above the drawer), tree-item visual, drag, collapse/expand, children expander all still look correct
- [ ] AC6 — `npm run build` succeeds; vitest + playwright pass; **version + sw.js bumped** (per learnings #15); **if any new route/bundle introduced (not expected), STATIC_SHELL entry added** (per learnings #16)
- [ ] AC7 — Visual regression covered by an updated `test/e2e/contacts-ui.spec.ts` or a dedicated `trace-drawer-theme.spec.ts` (architect/expert call)

## QA Audit & User Feedback

- 2026-05-29: Tron directive — DetailsView background must be black. Routed via PO. Awaiting req formal quote capture + architect/expert design + impl, then Tron QA.

## Subtasks

None (atomic task).

---

*Sprint 16 — Traceability UX & DetailViews · Phase 4 (Tron iteration)*
*Owner: robbin-expert (UI), robbin-tester (verify)*
*Priority: 8 (UI iteration on shipped DetailViews)*
