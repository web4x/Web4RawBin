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

- [ ] **(functional)** Every unit mutation emits ONE UNIT_CHANGED{ior,uuid,hash} on the EXISTING viewBus (extended to carry the revision); no surface discovers change independently (one event shape, one emit call).
- [ ] **(functional)** The revision = a compute-on-read CONTENT-HASH reusing the federation contentHash (single-source) — NOT a monotonic counter, NOT a stored bump at the put() chokepoint; currency proved by re-hash + compare (rendered.hash != current.hash -> stale). Cache per (uuid,version) to bound cost.
- [ ] **(functional)** Every view format REGISTERS as a projection (selects+render); generate-sprint-md = PROJECTION #1; each writes through the C8 owned-output guard. Adding a format is REGISTRATION ONLY — zero bus/pipeline edits (DRY acceptance: throwaway projection works; a pipeline edit for format N+1 -> RED).
- [ ] **(functional)** The board pipeline regenerates ONLY the affected sprint's owned board(s), DEBOUNCED (coalesce a burst of transitions in one sprint into ONE regen) — never all 144 .md, never unaffected sprints. Cost-bounded so the guard stays enabled.
- [ ] **(functional)** The live client subscribes to the ws event and on notify / focus / visibilitychange REVALIDATES the affected subtree OR marks it VISIBLY STALE (a badge) — a stale render is never indistinguishable from fresh. This is how never-return-a-silently-drifted-value reaches the RENDER surface (fixes pin-swap-not-appearing).
- [ ] **(functional)** Unconfirmed currency == STALE, never fresh (same shape as NOT-RUN==RED): a dropped ws / skipped revision / offline -> the node goes stale; the (re)connect welcome piggybacks the current revision for reconcile. The client NEVER assumes fresh because no event arrived.
- [ ] **(gate)** TEST EXERCISES AC-one-event+AC-scoped-debounced+AC-revalidate-or-stale+AC-fail-closed (distinct-intent): two transitions in one sprint -> exactly ONE scoped regen (RED if it regenerates unaffected sprints / fires per-event); drop the ws / skip a revision -> the open node goes STALE (RED if it renders fresh); register a throwaway projection -> works with zero pipeline edits. Verify Impl.tests[] on disk before flip.
- [ ] **(gate)** mvc.subscribeOnRender COVERAGE INVARIANT: EVERY view that renders a ref MUST subscribe to it -> it live-updates. GATE RED if a rendered ref is not subscribed (STUB-MUST-FAIL: render a ref without subscribing -> RED). Closes the gap where AC3 live-update marker 9ce0b153 exists but no coverage unit.
- [ ] **(functional)** ONE view bus, not two: the SECOND observer (trace/ViewBus ref-keyed vs top-level ViewBus classType/uuid) is RETIRED or explicitly declared so there is ONE controller/bus (the two-source disease, R40.18 class). GATE: a 2nd live bus in use -> RED (stub-must-fail).
- [ ] **(device)** [DEVICE-ONLY @390 pixel — Tron, un-mockable, NEVER headless-green, TRON-ONLY] A unit change is VISIBLE in the ITEM view AND the DETAIL view with NO manual reload (live), gated @390 by SCREENSHOT+PIXEL (the changed value appears), NEVER a DOM count. AND INV-T: rendering NEVER mutates the model — the unit byte-diff before==after any render == 0. STUB-MUST-FAIL: a stale view / a render that mutates the unit -> RED. Closes Tron's 'not reflecting it in realtime currently'.
- [ ] **(stub-must-fail/device-390)** Setting a task as CURRENT propagates to ALL current-displaying views LIVE via the ONE VIEW BUS, with NO hard refresh. stub-must-fail: a make-current whose effect is visible ONLY after a hard refresh => RED. (Tron v0.8.121 defect A: current only after hard refresh, no live propagation.)
- [ ] **(stub-must-fail/device-390)** After a live update, each detail-view section renders EXACTLY ONCE (idempotent: replace-not-append / build-complete-then-assign-once, no double-subscription). FAMILY-WIDE (architect 073991e6a, ENUMERATED not the-views): the shared idempotent-render contract covers ALL ~9 *-detail components - rb-detail-view, rb-requirement-detail, rb-file-detail, rb-test-detail, rb-implementation-detail, rb-method-detail, rb-class-detail, rb-usecase-detail, rb-task-detail - PLUS the shared append-helpers renderChainPathSection/renderAllChildrenSection/renderSupersededSection. TWO halves: (source-invariant, deploy-independent like R40.50) a lint goes RED on ANY *-detail async render-tail NOT routed through the shared idempotent contract (raw insertAdjacentHTML with no generation-guard) - so fixing rb-task-detail alone leaves 8 loaded guns => still RED; (device @390) a live update that yields a DUPLICATED section (e.g. Parent twice, Status three times) => RED. Measured root: NO shared base + NO generation-guard in the detail bodies (only the drawer has one). The fix is ONE shared contract (RbDetailBase or a renderGuarded helper), never a per-component patch (= the copy pattern one layer down). (Tron v0.8.121 defect B.)
- [ ] **(stub-must-fail/device-390)** EVERY view that displays current re-derives on the bus event - ENUMERATED (not the-views): (1) CurrentSprint pin icon / tree-pin, (2) drawer/detail current indicator, (3) model + trace tree current-row highlight, (4) scoreboard current marker if present. stub-must-fail: after a live current-change, ANY TWO of these disagree (e.g. pin shows T37.24 while drawer shows T40.1) => RED. (Tron defect C: one view re-derived, another did not. This ENUMERATES + makes failable the existing AC-subscribe-on-render-coverage EVERY-view reminder.)

## Subtasks
