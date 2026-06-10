### R19.24: Remove spectator functionality entirely.

<details><summary>Tron directive</summary>

> REMOVE all spectator functionality: isSpectator flag, spectator mode/role, spectator join flow, spectator UI elements, spectator-related server logic, spectator message types. Delete every code path that references, checks, or enables spectator mode.

</details>

## Traceability

**Tasks:**
- [🔗 T-remove-spectator: strip isSpectator/mode/role/UI/join-flow/server/MSG types](../task/remove-spectator-mode-role-ui-join-flow-msg-types.md)

**UseCases:**
- [🔗 room.stripSpectator](../usecase/room-stripspectator.md)
