<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 34.7: Universal action bar on ALL drawer usages (shared drawer renders A1 default + host registerActionProvider) [R-E]

[task:uuid:3bec71f4-dbcd-4641-9194-7519c2546bf6]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Remaining Issues

DONE: R-E built (universal action bar on all 7 drawer usages, shared drawer A1 default + registerActionProvider, no fork) + chain-complete-to-Test (Impl ffd44b17 universalActionBar tests[]=[cbdb3210], credited markerPending=false 661a20870) + REAL-WEBKIT @390 GREEN DET-3x (S34 gate b89097eb8, served 0.8.44; HEAD 0.8.45 marker-only bump; Safari 605.1.15 = Tron iPhone engine). Team-gated at Tron real engine -> Done. NOTE: gated-page real-device confirm (server-manager/feature-manager/in-room) is Tron's spot-check, separate from the board flip (PO).

## Traceability

  - up
    - [Sprint 34 Planning](./planning.md)
    - Requirement R34.7 `[requirement:uuid:ad8c6d3e-0e28-498b-8981-bb86d9fe3e86]`
  - down
    - None (atomic task)

## Task Description

R-E (Tron 2026-08-03: 'add the action bar to all usages of the drawer'). The action-bar mechanism is shared (setActions/showActionsForType, R33.6.5) and rb-drawer-detail-shown fires on every drawer detail-render, but the ONLY listener is model.ts wireDrawerActions -> the bar shows on /model ONLY; 6 of 7 mount sites (/trace, /scenario, in-room, /server-manager, feature-manager, trace/index) show NO bar. FIX (solve-once in the SHARED drawer, NO fork): showActionsForType sets the UNIVERSAL R-A A1 default [Scenario,Edit] + exposes RbDetailDrawer.registerActionProvider(fn); the model host registers its context verbs via actionsForContext (R33.9 verbatim). UNIFIES with R-A A1 (built INTO the shared drawer = ONE universal mechanism). Client-only.

## Acceptance Criteria

- [x] (functional) INV-E1: the action bar renders on EVERY drawer usage (all 7 mount sites: /trace, /scenario, in-room, /server-manager, feature-manager, trace/index, /model) with the context-appropriate verb-set - BY CONSTRUCTION (the shared drawer sets the default itself, not gated on a per-page host wiring).
- [x] (functional) INV-E2: default [Scenario, Edit] everywhere; + model verbs (unit always / membership when a diagram is active, R33.9 actionsForContext) ONLY where the model host registered via registerActionProvider; + per-type verbs where defined. Reuse actionsForContext - no fork.
- [x] (functional) INV-E3: setActions/showActionsForType/actionsForContext reused as-is (no fork); the /model page's existing bar + verb-set UNCHANGED (unregressed); rb-drawer-detail-shown still dispatched (back-compat); empty/chat selection still clears the bar.
- [x] (functional) The «Scenario» verb opens /scenario?ior=<ref>; the «Edit» verb opens the edit flow - both GENERIC (no host needed), wired in the shared drawer's rb-drawer-action path so they work on every usage.
- [x] (functional) Unifies with R-A A1 (793760f2): A1's universal [Scenario,Edit] default is built INTO the shared drawer per this design, so A1 + R-E are ONE universal mechanism (not two parallel implementations).
- [x] (gate) GATE @390 real-WebKit: the action bar is PRESENT on a detail in /trace, /scenario, in-room, /server-manager, feature-manager (default Scenario+Edit at minimum); /model still shows its FULL model verb-set (unregressed); Scenario opens the scenario view, Edit opens edit; empty selection clears the bar; no page throws.

## Subtasks

None (atomic task).
