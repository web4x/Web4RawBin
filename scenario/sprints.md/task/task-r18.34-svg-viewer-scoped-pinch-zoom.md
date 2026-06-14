# R18.34 — SVG viewer with scoped pinch/pan (cross-browser)
[task:uuid:bef36fd2-aa7c-4766-8001-db2b69452d61]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect — D1→D4 PDCA across b3e8799c + 1f2524d8 + 7422733c)
  - [x] creating test cases (architect Acceptance Criteria section)
  - [x] implementing (expert — v0.5.114 → v0.5.116 → v0.5.117 → v0.5.118 → v0.5.119 → v0.5.120)
  - [ ] testing (tester — verify on iPhone + Mac per architect's cross-browser design)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

- up
  - [Sprint 18 Planning](./planning.md)
  - [Sprint 18](../../../scenario/sprints.json/sprint-18-chain-method-scope/sprint.json) `[ior:instance:5b950725-a6f6-4d45-b802-4784ee6ef962]`
  - **R18.34** `[requirement:uuid:042bab1a-46ff-4a92-8494-102b9ad928ac]` — "SVG renders in fullscreen iframe natively" (Tron verbatim, captured by robbin-req in c66ad3fd)
  - **R18.34.B** `[requirement:uuid:6ee95023-5639-4eb7-86cc-916ebb418e7e]` — "Pinch release commits SVG zoom (no pan, zoom persists)" (atomic refinement sibling of R18.34, captured by robbin-req in 83ccbd0e; bidirectional unitLinks ↔ R18.34)
- down
  - None (atomic task)
- scenario unit: `scenario/index/b/e/f/3/6/bef36fd2-aa7c-4766-8001-db2b69452d61.scenario.json` (req-eng 39af520a — chain wiring `coveredRequirements ↔ Requirement.tasks`; R18.34.B added 2026-06-09 by planner)
- pending architect units (R18.34.B chain plan per 83ccbd0e):
  - UseCase `svgViewer.pinchZoom AC9.1` (queued)
  - Class `SvgViewer` (queued)
  - Method `SvgViewer.onPinchEnd` (queued)

## QA Audit & User Feedback

- 2026-06-09: Tron verbatim (captured by robbin-req in c66ad3fd) — "we need to optimize the svg view. … iframe that basically covers most of the screen and if i pan zoom, the svg in the iframe gets panned zoomed not the whole page." + clarification "it just should show the svg in the iframe and fall back to standard panning and zooming of it as the default page functionality."
- 2026-06-09: Architect (b3e8799c) D1 — initial cross-browser design (corrected from iOS-only assumption when Tron reproduced on Chrome/desktop-Mac).
- 2026-06-09: Expert v0.5.114 (87dfee3b) — first iframe + aspect-ratio attempt. Defects surfaced on device.
- 2026-06-09: Expert v0.5.116 (f1f7bd51) — cross-browser pinch/pan per architect's design.
- 2026-06-09: Architect (1f2524d8) Defects 3+4 — inline-SVG + pinned layout box kills blur + snap-back.
- 2026-06-09: Expert v0.5.117 (2e71a312) D3+D4 inline-SVG; same-version hotfix 7422733c root-caused window.resize→reset.
- 2026-06-09: Expert v0.5.118 (5513c08f) — preserve zoom on iOS URL-bar resize.
- 2026-06-09: Expert v0.5.119 (df4d1831) — cache-bust bump for D4 verification.
- 2026-06-09: Expert v0.5.120 (acacd044) D4 belt-and-braces — persist view + orientationchange + visualViewport.
- 2026-06-09: req-eng captured R18.34.B (83ccbd0e + c6d47477) — atomic refinement "pinch release commits SVG zoom" (req:uuid 6ee95023, bidirectional unitLink with R18.34); shares this same SVG task.
- 2026-06-09: Expert v0.5.121 (8e9e6a06) — R18.34.B pinch-commit fix: `apply()` on touchend + rAF after pinch. Rule-pair (a)+(b) ✓.
- 2026-06-09: planner chain sync — `coveredRequirements[]` now includes both R18.34 + R18.34.B; R18.34.B.tasks[] reciprocates (loop closed both sides per learning #38).
- Pending: architect to create UseCase `svgViewer.pinchZoom AC9.1` + Class `SvgViewer` + Method `SvgViewer.onPinchEnd` (R18.34.B chain plan per 83ccbd0e). Tester to write champagne test (pinch→release, no pan, zoom persists) + 3-platform verify (iPhone Safari + Chrome/iPhone + Chrome/Mac). Then Tron QA.

## Subtasks

None (atomic task — D1-D4 PDCA rounds folded into a single task per learning #20).
