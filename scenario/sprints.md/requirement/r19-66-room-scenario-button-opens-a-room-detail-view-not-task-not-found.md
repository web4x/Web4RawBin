### R19.66: Room Scenario button opens a Room detail view, not 'Task not found'.

<details><summary>Tron directive</summary>

> BUG: clicking a room's Scenario button navigates to /scenario?ior=<roomUuid> which renders 'Task not found' — the route assumes the IOR is a Task and fails when it resolves to a Room. FIX: the /scenario route MUST resolve the unit by UUID, detect its ior:class type (Room in this case), and render the appropriate DETAIL VIEW for that type. The Room detail view shows the room's scenario data (members, files, chat, config) with an action button to open the scenario editor (per R19.2/R19.2.A). This is a type-dispatch fix on the /scenario route — it must handle ALL scenario types, not just Task.

</details>

## Traceability

**Tasks:**
- [🔗 T-room-scenario-detail: Room Scenario button opens a Room detail view, not 'Task not found'](../task/room-scenario-detail-view-not-task-not-found.md)

**UseCases:**
- [🔗 scenarioView.typeDispatch](../usecase/scenarioview-typedispatch.md)
