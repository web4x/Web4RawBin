### R19.23: Remove all room size and capacity limits — rooms are unbounded.

<details><summary>Tron directive</summary>

> REMOVE all room size/capacity functionality: maxMembers, maxPlayers, room-size configuration in model/UI/server validation. Rooms have no upper bound on members. Delete every code path that checks, enforces, displays, or configures room capacity.

</details>

## Traceability

**Tasks:**
- [🔗 T-remove-room-sizes: strip maxMembers/maxPlayers/size config from model+UI+server](../task/remove-room-sizes-max-members-players-config.md)

**UseCases:**
- [🔗 room.stripSizeLimits](../usecase/room-stripsizelimits.md)
