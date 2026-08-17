# R40.42 — Diagram: ONE scroll authority (analysis + chain design)

robbin-architect 2026-08-17. Tron req `e96f06fd` (capture-only, designRequired) — the diagram has TWO scrollbars (inner surface ~99% + outer drawer) so vertical pan is DEAD; nested scroll = two sources of scroll authority. Reuses RbPanZoom (R40.29). Priority AFTER the S37 MVC slices; does not touch the expert's current build. **Analysis + design only.** This is the single-authority family (L4/MVC-one-controller) applied to SCROLL: nested scroll = the two-source disease; ONE authority (RbPanZoom) = the by-construction fix.

## UX ANALYSIS — why vertical pan is dead (measured, not guessed)
Authority is currently SPLIT THREE WAYS by scale, plus the drawer:
1. **RbPanZoom transform-pan, only when s>1** (`pan-zoom.ts:7` "mouse drag pans only when s>1"; `:8` "1-finger pan when s>1, no page-scroll hijack at s=1"). At the DEFAULT scale (s==1) RbPanZoom **deliberately does NOT pan** — it yields, by design, to avoid hijacking page scroll.
2. **Native `overflow:auto` scroll at s<1 (grow-mode)** (`pan-zoom.ts:22,299`: growMode grows the SVG canvas and the surface is "native-scrolled (overflow:auto), pan via surface.scrollBy"). So when zoomed OUT, the `.dm-surface` becomes a NATIVE scroll container = the **INNER scrollbar**. RbPanZoom has TWO internal pan mechanisms (transform s>1, native-scroll s<1) — already a split.
3. **The drawer body scrolls independently** (`rb-detail-drawer.ts:14` "scrollable, receives detail content") = the **OUTER scrollbar**. The diagram detail lives inside it.

⇒ At the default zoom a vertical drag finds NO pan authority (rule 1 yields) and falls through to the drawer/native scroll; in grow-mode the inner native scroll and the outer drawer scroll FIGHT. Two (three) authorities, no single owner → "vertical pan is dead."

## AC-3 RULING — wheel = ZOOM (my call, per req)
On a single-authority pan-zoom surface there is NO scroll to do — pan is drag, zoom is wheel/pinch. So **wheel = ZOOM about the cursor** (already RbPanZoom's `:7` behaviour), NOT scroll. Gesture model, consistent at every scale: **drag = pan (both axes) · wheel = zoom · 2-finger pinch = zoom · double-tap = reset**. No gesture means "scroll" because the surface is not a scroll container.

## DESIGN — RbPanZoom is the SOLE authority; no nested scroll container
Extend RbPanZoom (R40.29) — no new machinery:
1. **RbPanZoom owns pan at ALL scales, both axes (AC-1, AC-2):** remove the `s>1` gate on drag/1-finger pan — pan by CSS transform `translate(tx,ty)` at every scale including s==1. The old "yield at s==1" rule is REPLACED by "RbPanZoom owns pan + does not leak to page" (AC-6 below).
2. **Kill the inner native scroll (AC-1):** grow-mode must pan the grown canvas via RbPanZoom TRANSFORM (`translate`), NOT `surface.scrollBy`/`overflow:auto`. The `.dm-surface` stays `overflow:hidden` at ALL scales (it already is at s≥1, `rb-diagram-detail.ts:25`) — one pan mechanism (transform), zero native scroll containers. (growMode keeps the canvas-grow SVG-dims behaviour for working space, but pan is transform, not native scroll.)
3. **The drawer must not provide a 2nd scroll over the diagram (AC-1):** when the drawer's detail IS a pan-zoom diagram, the drawer body is `overflow:hidden` and the diagram surface fills the drawer viewport (RbPanZoom owns the region); text/other details keep the drawer's normal scroll. Content-type-conditional — the diagram region has exactly one authority.
4. **No page-scroll leakage (AC-6):** `touch-action:none` on `.dm-surface` (already on `.dm-box` `:28`) + `preventDefault` on the pan pointer/touch stream so a drag INSIDE the diagram never leaks to page/drawer scroll. This is what makes "RbPanZoom owns pan at s==1" safe (replaces the old yield).
5. **@390 (AC-4 auto, AC-5 real-iOS device):** 1-finger drag = pan both axes at all scales; 2-finger pinch = zoom about midpoint (RbPanZoom already, `:8`); no page-scroll leak. AC-5 gates on REAL iOS WebKit @390 (two-finger + pinch) with a pixel screenshot — [[real-webkit-390-headless-gating]] / [[ios-webkit-tap-fire-fragile-elements]]: emulation (Chromium) false-negatives real-WebKit touch; gate on the real device or real-WebKit headless, not Chromium emulation.

## crossRef R33.6.2 (`570b77c7`) — distinct sibling, coordinate at build
R33.6.2 (page-scroll-during-DRAG of a box) already pans the canvas via an rAF autoscroll loop using `RbPanZoom.panBy`/`surface.scrollBy` (`rb-diagram-detail.ts:282-299`). ★ When #2 kills native scroll, that autoscroll MUST pan via `RbPanZoom.panBy` (transform), not `surface.scrollBy` — else box-drag-to-edge breaks. Phase-2 sibling; flag so the two don't collide. Not in R40.42's core scope but touches the same code.

## Chain (design-ahead; req mints, I wire on build-go)
- UC `diagram.oneScrollAuthority` (or `panZoom.ownAllScalePan`) → Class **RbPanZoom** (R40.29 `58a7c149`, existing — EXTEND, reuse) + `RbDiagramDetail`.
- Methods: `RbPanZoom.pan` (remove s>1 gate + transform-pan in grow, drop native-scroll) ; `RbDiagramDetail.fitDrawerViewport` (drawer overflow:hidden for diagram content). 
- Impl markers on the extended decls; Test = the 6 ACs, AC-5 real-iOS @390 pixel.
- Missing units for req: the UC + (extend, don't re-mint) the RbPanZoom Class/Method units from R40.29. verify-owner-first (R40.29's own Tests keep their credit; R40.42 earns its own one-authority Test).

## Constraints
Reuse RbPanZoom (R40.29) — extend, no new pan machinery. @390 mobile-first (Tron device). One authority = the L4 single-source law applied to scroll. Priority AFTER S37 MVC slices; independent of the expert's current seam build.
