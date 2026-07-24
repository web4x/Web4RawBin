<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.9: Detail container = ONE CSS-responsive instance (drawer<->compartment), no JS instance-switch

[task:uuid:6180c684-9d9b-458f-afa1-09963cbc58e7]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

DEVICE-QA ROUND-2 (Tron d660f68ee): round-2 ACs FORMALIZED on R31.9 (req: AC-fullwidth-intermediate-tier 4fcc23a14 + AC-scroll-past-drawer 80448203a) — both LIKELY R31.9 REGRESSIONS (the data-position/:has() layout refactor dropped drawer 100vw + bottom scroll-inset). AC1 no-fork (SAME rb-detail-drawer at 100vw via CSS, R31.5-aligned). Round-1 5 ACs + Test 2b20035d PRESERVED (met). NEXT (scenario-first): architect DIAGNOSES whether R31.9 caused the 2 regressions + designs the DRY fix (same on /trace + SM, ONE rb-detail-drawer) -> expert -> tester @390+intermediate+desktop -> Tron device. On architect method-topology, req mints per-piece chains (#126). status In-Progress = 7 met / 0 round-2 unmet.

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.9 `[requirement:uuid:f93d369a-bcc4-4c77-9816-b9c4c0de727d]`
  - crossRef
    - R31.5.7 (drawer=Details) — R31.9 WIRES its applyPosition/data-position continuous mechanism (BUILT but 0-callers)
  - down
    - UC drawer.observePosition `[uc:uuid:cc45a580-a401-4cee-9995-a10d7691bf40]` → Class RbDetailDrawer d86af73d → Method observePosition e8097351 (Impl 240c539f pre-minted (marker on build-go))

## Task Description

The ONE refinement before Sprint 31 DONE (Tron device 2026-07-24). The detail container must be a SINGLE component whose mobile-vs-desktop presentation is driven by CSS media queries (positioning != function, the R31.5 principle) — NOT a JS instance-switch / component swap at the breakpoint. Mobile (<=1024px) = bottom DRAWER; desktop (>=1025px) = Details COMPARTMENT in the R31.5 composed responsive layout (What/Overview/Details/Actions), WODA-like sizing (screenshot-4) but RawBin CI (NOT WODA's CI); SAME instance across the breakpoint, CSS transition, NO jump, NO re-mount, NO state loss, resize CONTINUOUS. This UNIFIES rb-detail-drawer (T31.4 mobile) + rb-compartment (R31.5 desktop) into ONE responsive detail-container (generic-behavior-in-shared-component / don't-fork). ★ DIAGNOSIS (architect e7debdf70): Tron's JS-instance-switch hypothesis is REFUTED — it IS one instance; the jump+resize-break come from THREE real roots: (a) a HARD @media flip (should be a CSS-continuous transition), (b) a STALE inline height persisting across the breakpoint, (c) the R31.5.7 data-position is UNWIRED. FIX (mostly impl-edits reusing R31.5.7 applyPosition d48cc0ce + RbStrip/RbCompartment): wire data-position, drive it by CSS media not a hard flip, clear the stale inline height across the BP. Optional new driver Method RbDetailDrawer.observePosition (architect offers topology on request). Route: architect diagnose+design -> expert collapse the JS switch to CSS -> tester gate @390 AND @desktop AND AT the 1025px breakpoint -> Tron device.

## Intention

The ONE refinement before Sprint 31 DONE (Tron device 2026-07-24, 444041798): the detail container JUMPS + drag-resize breaks at the 1025px breakpoint. Architect design e7debdf70 = mostly impl-edits (wire the dead R31.5.7 applyPosition, retire the @media hard-flip, clear stale inline height; desktop=Details rb-compartment). DRY reuse.

## Acceptance Criteria

- [x] **[AC-no-jump-across-breakpoint]**: Dragging the window across the 1025px breakpoint, the detail container transitions CONTINUOUSLY — NO jump. RENDERED assertion @390 (mobile bottom-drawer) AND @desktop-width (Details compartment) AND AT the 1025px breakpoint (drag the window across it): assert the SAME DOM node persists (no re-mount / no component-swap = the DRY invariant), data-position toggles inline<->bottom, and there is NO jump / discontinuity at the flip. ✓ MET (R31.9 GREEN DET-3x @390+@desktop+@1025px-BP REAL-interactive resize a403751c9 v0.7.133, self-verified — NOT seeded/structural). Chain-credited via Test ccb4a810→Impl 240c539f (observePosition).
- [x] **[AC-resize-continuous-across-breakpoint]**: The drag-bar mouse-resize is CONTINUOUS across the 1025px breakpoint: the resize handle is present AND functional on BOTH sides, with NO stale-height shift, NO break/reset of the resize behaviour when the window crosses the breakpoint. @390 AND @desktop AND AT the breakpoint (drag then resize on each side). ✓ MET (R31.9 GREEN DET-3x @390+@desktop+@1025px-BP REAL-interactive resize a403751c9 v0.7.133, self-verified — NOT seeded/structural). Chain-credited via Test ccb4a810→Impl 240c539f (observePosition).
- [x] **[AC-desktop-details-compartment]**: At desktop width (>=1025px) the detail container is NO LONGER a bottom-drawer — it is a 2-PANE INLINE Details COMPARTMENT: [host tree | Details] side-by-side (the SM/FM otmux/feature tree in the left pane, the Details compartment in the right), WODA-like sizing/proportions but RawBin's visual identity (NOT WODA's CI). ★ TRON RULING (2026-07-24, filed in the brief): this is a SINGLE Details compartment (his literal 'the details container is no longer a drawer but a COMPARTMENT'), NOT the literal 4-segment What/Overview/Details/Actions WODA composition (that full composition is R31.5.6 WODA-INSTANCE scope, SEPARATE from R31.9 — SM/FM have only a tree|details content model; the architect corrected the over-spec, design cb1b28ab1 + ruling 2c32f50d0) — SM/FM are naturally 2-pane. Mobile (<=1024px) = bottom drawer; SAME instance, CSS transition. RENDERED @390 (drawer) AND @desktop (2-pane tree|details inline compartment). NOTE: the built v0.7.133 (ca602fd33, .trace-page:has([data-position=inline])->row) ALREADY satisfies this sharpened AC — NO rework. ✓ MET (R31.9 GREEN DET-3x @390+@desktop+@1025px-BP REAL-interactive resize a403751c9 v0.7.133, self-verified — NOT seeded/structural). Chain-credited via Test ccb4a810→Impl 240c539f (observePosition).
- [x] **[AC-state-preserved-across-breakpoint]**: Content / scroll position / terminal state is PRESERVED across the 1025px breakpoint (a direct consequence of it being the SAME instance — no re-mount, no state loss). @390 AND @desktop AND AT the breakpoint: open a detail (e.g. a live terminal or a scrolled profile), drag the window across the breakpoint, assert content + scroll offset + terminal session are intact (not reset). ✓ MET (R31.9 GREEN DET-3x @390+@desktop+@1025px-BP REAL-interactive resize a403751c9 v0.7.133, self-verified — NOT seeded/structural). Chain-credited via Test ccb4a810→Impl 240c539f (observePosition).
- [x] **[AC-appcss-regression-clean]**: The shared app.css change (retire the @media hard-flip :277/:310, add the data-position branches + CSS transition, clear the stale inline height entering desktop) MUST NOT regress the OTHER drawer/compartment surfaces that share app.css — /trace, /room, /edit, SM (server-manager), FM (feature-manager) drawers all render + resize + open/close correctly. @390 AND @desktop regression suite across ALL consumers (shared component = gate every surface, not just the SM/FM detail). ✓ MET (R31.9 GREEN DET-3x @390+@desktop+@1025px-BP REAL-interactive resize a403751c9 v0.7.133, self-verified — NOT seeded/structural). Chain-credited via Test ccb4a810→Impl 240c539f (observePosition).
- [ ] **[AC-fullwidth-intermediate-tier]** (round-2, UNMET): The ONE rb-detail-drawer INSTANCE spans 100vw (full width — CSS width on the SAME element) from mobile up to the compartment breakpoint (the intermediate tier), NOT a forked second full-width component. RECONCILIATION with R31.5's no-fork invariant: this delivers Tron's 'full width' on the SINGLE drawer instance via CSS width — it is NOT the 'full-width drawer SECOND COMPONENT' the old R31.5 req warns against (that fork = the regression). BUG (v0.7.133): the drawer AUTOSIZES NARROW instead of 100vw — likely an R31.9 REGRESSION (data-position/:has() refactor dropped the 100vw). RENDERED ASSERTION: @390 AND the intermediate tier, the drawer element's computed width == 100vw up to the compartment breakpoint; @desktop (>=1025px) it becomes the inline 2-pane Details compartment (existing AC). Tron brief d660f68ee (2026-07-24).
- [ ] **[AC-scroll-past-drawer]** (round-2, UNMET): The host tree's background scroll-space RESERVES the drawer's OCCUPIED HEIGHT so the LAST tree item CLEARS the drawer (not occluded) at EVERY drawer height (min/peek/expanded). BUG (v0.7.133): the last item is OCCLUDED by the drawer — a TRUE REGRESSION (worked pre-R31.9; the data-position/:has() refactor likely dropped the bottom scroll-inset). DRY: same on /trace AND SM/FM (shared rb-detail-drawer + host tree). RENDERED ASSERTION @390 + intermediate + desktop: scroll to the end → the last item is FULLY VISIBLE above the drawer at every height. Tron brief d660f68ee (2026-07-24); cite the pre-R31.9 build as the working baseline.

## Subtasks

None (atomic refinement task).
