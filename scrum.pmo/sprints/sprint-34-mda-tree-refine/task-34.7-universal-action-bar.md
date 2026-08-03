<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 34.7: Universal action bar on ALL drawer usages (shared drawer renders A1 default + host registerActionProvider) [R-E]

[task:uuid:3bec71f4-dbcd-4641-9194-7519c2546bf6]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned — cluster R-E (Tron 'action bar on ALL drawer usages'). Sequence after/ALONGSIDE R-A A1 (build A1's default INTO the shared drawer = ONE universal mechanism). Chain IMPL-MINT (UC a1393fcc, Impl ffd44b17 markerPending, Class RbDetailDrawer d86af73d). Client-only, restart at S34 boundary. @390 real-WebKit gate on ship.

## Traceability

  - up
    - [Sprint 34 Planning](./planning.md)
    - Requirement R34.7 `[requirement:uuid:ad8c6d3e-0e28-498b-8981-bb86d9fe3e86]`
  - down
    - None (atomic task)

## Task Description

R-E (Tron 2026-08-03: 'add the action bar to all usages of the drawer'). The action-bar mechanism is shared (setActions/showActionsForType, R33.6.5) and rb-drawer-detail-shown fires on every drawer detail-render, but the ONLY listener is model.ts wireDrawerActions -> the bar shows on /model ONLY; 6 of 7 mount sites (/trace, /scenario, in-room, /server-manager, feature-manager, trace/index) show NO bar. FIX (solve-once in the SHARED drawer, NO fork): showActionsForType sets the UNIVERSAL R-A A1 default [Scenario,Edit] + exposes RbDetailDrawer.registerActionProvider(fn); the model host registers its context verbs via actionsForContext (R33.9 verbatim). UNIFIES with R-A A1 (built INTO the shared drawer = ONE universal mechanism). Client-only.

## Acceptance Criteria

- [ ] (functional) INV-E1: the action bar renders on EVERY drawer usage (all 7 mount sites: /trace, /scenario, in-room, /server-manager, feature-manager, trace/index, /model) with the context-appropriate verb-set - BY CONSTRUCTION (the shared drawer sets the default itself, not gated on a per-page host wiring).
- [ ] (functional) INV-E2: default [Scenario, Edit] everywhere; + model verbs (unit always / membership when a diagram is active, R33.9 actionsForContext) ONLY where the model host registered via registerActionProvider; + per-type verbs where defined. Reuse actionsForContext - no fork.
- [ ] (functional) INV-E3: setActions/showActionsForType/actionsForContext reused as-is (no fork); the /model page's existing bar + verb-set UNCHANGED (unregressed); rb-drawer-detail-shown still dispatched (back-compat); empty/chat selection still clears the bar.
- [ ] (functional) The «Scenario» verb opens /scenario?ior=<ref>; the «Edit» verb opens the edit flow - both GENERIC (no host needed), wired in the shared drawer's rb-drawer-action path so they work on every usage.
- [ ] (functional) Unifies with R-A A1 (793760f2): A1's universal [Scenario,Edit] default is built INTO the shared drawer per this design, so A1 + R-E are ONE universal mechanism (not two parallel implementations).
- [ ] (gate) GATE @390 real-WebKit: the action bar is PRESENT on a detail in /trace, /scenario, in-room, /server-manager, feature-manager (default Scenario+Edit at minimum); /model still shows its FULL model verb-set (unregressed); Scenario opens the scenario view, Edit opens edit; empty selection clears the bar; no page throws.

## Subtasks

None (atomic task).
