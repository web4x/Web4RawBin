<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 41.3: MVC live-updates for File and Folder — view observes model, object notifies, no forced reload

[task:uuid:c9fb1a08-b66d-4ae6-a9fe-b32e966922af]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

STOOD UP Planned, top-down scenario-first. ★ Crisis-minted by robbin-req (PO urgent 2026-09-13, Tron order, Tron watching; planner being rewound) — PLANNER's lane, take over/reconcile (same lane-flag discipline as T41.1/T41.2). Architect wires class/method + provides the subscribing-vs-reload-only MEASUREMENT (AC-measured-baseline pending). Expert builds Impl+Test on PO go.

## Task Description

File/Folder views update live via MVC (observe model + notify on change, no forced reload; observing != polling). Applies the C4/R37.4 viewBus law to the two S41 classes. Written against the architect's measured subscribing-vs-reload-only coverage.

## Intention

Every 'disk is correct' reaches Tron's screen — a File/Folder view reflects its unit's change WITHOUT a reload.

## Acceptance Criteria

- [ ] **(observer/subscribe)** A File/Folder VIEW (BOTH the tree-node AND the detail view) SUBSCRIBES to its OWN object's change-event on the ViewBus, keyed on the unit's IOR — NOT a global rebuild, NOT a subscription to all traffic.
- [ ] **(observer/notify-seam)** The File/Folder UNIT EMITS a per-object change-event on mutation, via the ONE write seam (publishUnitChanged keyed by its IOR). The object notifies through the single seam; nothing mutates a File/Folder without emitting.
- [ ] **(observer/render-self)** On notify, the view re-renders THAT object via its renderSelf() (the 41.1/41.2 method) — NO wholesale tree rebuild, NO forced reload. Ask-the-object: the changed File/Folder renders itself.
- [ ] **(observer/reaches-screen)** A File/Folder change REACHES THE VIEW with NO manual refresh (the stale-render bite — every 'disk is correct' must reach Tron's screen). Bypassing the observer/seam leaves the screen stale.
- [ ] **(observer/no-polling)** NO setInterval / polling for File/Folder freshness (observing != polling). Freshness comes from the per-object event, never a timer.
- [ ] **(scope/two-classes)** SCOPED to File + Folder (tree-node + detail views of the 41.1/41.2 classes) — converges with the 41.1/41.2 renderSelf + route-writes-through-seam, scoped to these two. NOT a fleet-wide view refactor; rides the existing C4/R37.4 ViewBus, no new bus.
- [ ] **(measured/coverage)** WRITTEN AGAINST MEASURED REALITY (architect measurement, 41.3 note 95b04fa02): client surface = 94 .ts files, 13 SUBSCRIBE (ViewBus.on), 10 force RELOAD/href - live-observation is the MINORITY. Tron reload-only surfaces named: RoomView (WS-direct, no ViewBus), rb-task-detail (static/reload), model.ts host, universal-actions action-bar; drawer subscribes AND reloads. SCOPED to File/Folder: the File/Folder tree-node + detail views must SUBSCRIBE - ZERO reload-only File/Folder views after. A File/Folder view still reload-only after => RED.
