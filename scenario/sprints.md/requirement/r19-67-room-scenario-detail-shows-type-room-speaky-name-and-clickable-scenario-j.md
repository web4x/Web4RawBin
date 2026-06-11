### R19.67: Room scenario detail shows type 'Room', speaky name, and clickable Scenario.json link — not bare uuid.

<details><summary>Tron directive</summary>

> The /scenario Room detail view (R19.66) currently shows 'unknown' as type label and renders the uuid bare and repeated without a clickable link. FIX: (1) type label = 'Room' (resolved from ior:class), (2) display the room's speaky NAME (model.name), (3) render a CLICKABLE [Scenario.json](…uuid) link to the scenario unit file — not a bare uuid string. Consistent with how other types (Task, Requirement, etc.) render in /scenario.

</details>

## Traceability

**UseCases:**
- [🔗 detailView.roomScenarioDetail](../usecase/detailview-roomscenariodetail.md)
