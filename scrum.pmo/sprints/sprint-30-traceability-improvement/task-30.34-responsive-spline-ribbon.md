<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.34: Mobile-first responsive 3-way merge — ONE continuous spline (both orientations)

[task:uuid:b6effc2c-71f3-4c24-834d-fc5f92e43d18]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.34 `[requirement:uuid:53ab62ed-7ced-429a-945f-8b639faa4237]`
  - supersedes
    - R30.32 (4e0b50f2 SVG connector boxes — Tron-rejected, never shipped)
  - down
    - [UC merge.responsiveSplineRibbon](./planning.md) `[uc:uuid:c3f9ea4c-9de5-41c8-9371-986e9453b066]`

## Task Description

ONE continuous filled spline ribbon per change flows Local→Result→Repository as a SINGLE SVG path (cubic-bezier across each gutter, absorbing per-pane Y offset) — NOT per-pane boxes/bands (the box-outline + trapezoid-band renderers are REPLACED/deleted; supersedes R30.32). Responsive BOTH orientations: mobile (<=~820px) = 3 STACKED panes, spline flows DOWN; desktop = side-by-side, spline flows ACROSS. Mobile-first (390px) + desktop-reliable.

## Context

Covers R30.34 (53ab62ed) → UC merge.responsiveSplineRibbon (c3f9ea4c) → Class RbDiffEditor 18165081. SUPERSEDES R30.32 (4e0b50f2 SVG connector boxes — Tron-rejected, never shipped; R30.32 req carries supersededBy→R30.34, req-side done 6f29c189c). Splines not boxes: translucent shading by kind (change=blue/conflict=red-pink/active=green), no hard outlines. Sibling: R30.31 line-mapping stays HELD.

## Intention

S30 diff/merge editor, R30.34 (supersedes R30.32 boxes, Tron-rejected). Rider 'Merge Revisions' fidelity — any change traceable at a glance from Local through merged Result to Repository via the continuous mapping.

## Acceptance Criteria

- [ ] (one-spline) ONE continuous filled spline ribbon per change flows Local→Result→Repository as a SINGLE SVG path (cubic-bezier across each gutter, absorbing per-pane Y offset) — NOT per-pane boxes/bands; the box-outline + trapezoid-band renderers are REPLACED/deleted (supersedes R30.32)
- [ ] (both-orientations) Responsive BOTH orientations: mobile (viewport <=~820px) = 3 STACKED panes with the spline flowing DOWN; desktop = side-by-side panes with the spline flowing ACROSS; both render the continuous ribbon correctly
- [ ] (subtle-shading) Splines not boxes: subtle translucent shading color-coded by kind (change=blue / conflict=red-pink / active=green), opaque enough to read on the ~#111 gutter, NO hard outlines
- [ ] (legible-mapping) At a glance ANY change is traceable Local→merged Result→Repository — the continuous mapping IS the requirement (Rider fidelity); inline accept controls (x reject / >> accept-toward-result / <<) sit ON the ribbon edge without occluding it
- [ ] (mobile-first) Mobile-FIRST (works at 390px) and desktop-reliable; layout + spline correct on a 390px phone and on desktop
- [ ] (gate) GATE = 390px-mobile screenshot + desktop screenshot + PIXEL comparison vs the Rider target image — NEVER DOM/element-count (a 3rd false-green is unacceptable); client-facing → version-bump + atomic deploy (R30.28)

## Implementation

IN PROGRESS — EXPERT BUILDING now (version-bump pending), architect backstops. Replace box-outline + trapezoid-band renderers with ONE continuous SVG spline path per change (cubic-bezier across each gutter, absorbing per-pane Y offset); responsive layout mobile<=820px stacked spline-down / desktop side-by-side spline-across. → deploy → QA-Review → tester VISUAL-gate. ★ GATE (AC-gate): 390px-mobile screenshot + desktop screenshot + PIXEL comparison vs the Rider target image — NEVER DOM/element-count (a 3rd false-green is UNACCEPTABLE). → Done only on the PIXEL gate GREEN + chain-to-Test wired + served==gated (R30.25/R30.24 lessons). Client-facing → version-bump + atomic deploy (R30.28).

## Subtasks

None (atomic task).
