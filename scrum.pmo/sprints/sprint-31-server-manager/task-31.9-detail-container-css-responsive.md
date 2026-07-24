<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.9: Detail container = ONE CSS-responsive instance (drawer<->compartment), no JS instance-switch

[task:uuid:6180c684-9d9b-458f-afa1-09963cbc58e7]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

req captured ACs + UC minted (b2ef810ed); architect design ready (e7debdf70, container-query driver wires applyPosition + retire @media hard-flip). AWAITS: expert Impl -> tester gate @390 + @desktop + @1025px-BP -> Tron device. crossRef R31.5.7.

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.9 `[requirement:uuid:f93d369a-bcc4-4c77-9816-b9c4c0de727d]`
  - crossRef
    - R31.5.7 (drawer=Details) — R31.9 WIRES its applyPosition/data-position continuous mechanism (BUILT but 0-callers)
  - down
    - UC drawer.observePosition `[uc:uuid:cc45a580-a401-4cee-9995-a10d7691bf40]` → Class RbDetailDrawer d86af73d → Method observePosition e8097351 (Impl pending expert)

## Task Description

The ONE refinement before Sprint 31 DONE (Tron device 2026-07-24). The detail container must be a SINGLE component whose mobile-vs-desktop presentation is driven by CSS media queries (positioning != function, the R31.5 principle) — NOT a JS instance-switch / component swap at the breakpoint. Mobile (<=1024px) = bottom DRAWER; desktop (>=1025px) = Details COMPARTMENT in the R31.5 composed responsive layout (What/Overview/Details/Actions), WODA-like sizing (screenshot-4) but RawBin CI (NOT WODA's CI); SAME instance across the breakpoint, CSS transition, NO jump, NO re-mount, NO state loss, resize CONTINUOUS. This UNIFIES rb-detail-drawer (T31.4 mobile) + rb-compartment (R31.5 desktop) into ONE responsive detail-container (generic-behavior-in-shared-component / don't-fork). ★ DIAGNOSIS (architect e7debdf70): Tron's JS-instance-switch hypothesis is REFUTED — it IS one instance; the jump+resize-break come from THREE real roots: (a) a HARD @media flip (should be a CSS-continuous transition), (b) a STALE inline height persisting across the breakpoint, (c) the R31.5.7 data-position is UNWIRED. FIX (mostly impl-edits reusing R31.5.7 applyPosition d48cc0ce + RbStrip/RbCompartment): wire data-position, drive it by CSS media not a hard flip, clear the stale inline height across the BP. Optional new driver Method RbDetailDrawer.observePosition (architect offers topology on request). Route: architect diagnose+design -> expert collapse the JS switch to CSS -> tester gate @390 AND @desktop AND AT the 1025px breakpoint -> Tron device.

## Intention

The ONE refinement before Sprint 31 DONE (Tron device 2026-07-24, 444041798): the detail container JUMPS + drag-resize breaks at the 1025px breakpoint. Architect design e7debdf70 = mostly impl-edits (wire the dead R31.5.7 applyPosition, retire the @media hard-flip, clear stale inline height; desktop=Details rb-compartment). DRY reuse.

## Acceptance Criteria

- [ ] **[AC-no-jump-across-breakpoint]**: Dragging the window across the 1025px breakpoint, the detail container transitions CONTINUOUSLY — NO jump. RENDERED assertion @390 (mobile bottom-drawer) AND @desktop-width (Details compartment) AND AT the 1025px breakpoint (drag the window across it): assert the SAME DOM node persists (no re-mount / no component-swap = the DRY invariant), data-position toggles inline<->bottom, and there is NO jump / discontinuity at the flip.
- [ ] **[AC-resize-continuous-across-breakpoint]**: The drag-bar mouse-resize is CONTINUOUS across the 1025px breakpoint: the resize handle is present AND functional on BOTH sides, with NO stale-height shift, NO break/reset of the resize behaviour when the window crosses the breakpoint. @390 AND @desktop AND AT the breakpoint (drag then resize on each side).
- [ ] **[AC-desktop-details-compartment]**: At desktop width (>=1025px) the detail container is NO LONGER a bottom-drawer — it is the Details COMPARTMENT in the R31.5 composed responsive-compartment layout (What / Overview / Details / Actions), with WODA-like sizing/proportions (screenshot-4) but RawBin's visual identity (NOT WODA's CI). Mobile (<=1024px) = bottom drawer. SAME instance, CSS transition. RENDERED @390 (drawer) AND @desktop (compartment in the composed layout).
- [ ] **[AC-state-preserved-across-breakpoint]**: Content / scroll position / terminal state is PRESERVED across the 1025px breakpoint (a direct consequence of it being the SAME instance — no re-mount, no state loss). @390 AND @desktop AND AT the breakpoint: open a detail (e.g. a live terminal or a scrolled profile), drag the window across the breakpoint, assert content + scroll offset + terminal session are intact (not reset).
- [ ] **[AC-appcss-regression-clean]**: The shared app.css change (retire the @media hard-flip :277/:310, add the data-position branches + CSS transition, clear the stale inline height entering desktop) MUST NOT regress the OTHER drawer/compartment surfaces that share app.css — /trace, /room, /edit, SM (server-manager), FM (feature-manager) drawers all render + resize + open/close correctly. @390 AND @desktop regression suite across ALL consumers (shared component = gate every surface, not just the SM/FM detail).

## Subtasks

None (atomic refinement task).
