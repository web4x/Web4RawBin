<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.25: Realtime-MVC ONE VIEW BUS — unify to a single view bus + views subscribe-on-render, live-update coverage gated @390 (R37.12)

[task:uuid:a39efc32-c587-4e57-8938-494d8e90f335]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

The R37.12 view-bus HALF of the realtime-MVC slice — the other half of what Tron SEES, parallel to Task 37.24's R37.11 controller slice. Unify the ad-hoc view-update buses into ONE viewBus and make every view SUBSCRIBE-on-render, so the controller's UNIT_CHANGED emit reaches every view live and no view renders silently stale. Covers ONLY the 2 NEW realtime UCs: subscribe-on-render (mvc.subscribeOnRender 6aac0acf) + one-bus (e530e248). NOTE: R37.12 also carries 3 EXISTING uncovered UCs (77e8a39f/bfea086a/53a85195) — those are triaged SEPARATELY (backlog / own task), NOT folded into this realtime slice (req 2026-08-17).

## Context

R37.12 ONE VIEW BUS (9afbade1) via UC mvc.subscribeOnRender (6aac0acf) + one-bus (e530e248). Pairs with Task 37.24 (R37.11 controller emit): the controller emits UNIT_CHANGED on the ONE bus; every view subscribes-on-render + revalidates-or-stale-badges. Multiple ad-hoc buses = two-sources-of-update -> unify to one (single-authority family).

## Intention

Prove the view-bus half on-device: a routed write reaches EVERY subscribed view live @390, no view stale, no reload.

## Acceptance Criteria

**AC (browser-visible — the other half of what Tron SEES):** A unit change emitted on the ONE view bus (UnitController.apply UNIT_CHANGED) is reflected LIVE in EVERY subscribed view (item + detail + pin + any registered view) WITHOUT a reload, and a view that cannot prove currency renders a VISIBLE STALE badge — verified by SCREENSHOT+PIXEL on real WebKit @390 (NEVER a DOM count). PLUS **one-bus lint (STUB-MUST-FAIL):** exactly ONE view bus; a 2nd ad-hoc update-bus/emit path -> RED. PLUS **subscribe-on-render coverage:** every view registers its subscription AT render; an unsubscribed view that misses an emitted change -> RED. Gate shape matches Task 37.24 (real-WebKit @390 pixel, never DOM-count).

## Subtasks
