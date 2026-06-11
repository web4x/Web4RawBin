### R19.31: Chain link (🔗) navigates to VIEW the canonical room scenario unit.

<details><summary>Tron directive</summary>

> INTENTION: the chain link (🔗) navigates to the room's CANONICAL scenario unit (scenario/index/<shard>/<roomUuid>.scenario.json) in VIEW mode — the scenario detail view or /trace browser showing the unit's data, chain, and children. Both link and pen resolve to the SAME canonical target (the room scenario unit); the link opens it for viewing/navigating, the pen opens it for editing. BUG (original): link navigated to a 404. FIX: link href must point to /md/<canonical-scenario-path> or /trace?uuid=<roomUuid>. If the room unit is not found (deleted/expired), show a 'room not found' message, not a generic 404.

</details>

## Traceability

**Tasks:**
- [🔗 T-room-link-404-fix: room link navigates to live room or editor, never 404](../task/room-link-navigates-never-404.md)

**UseCases:**
- [🔗 room.linkResolve](../usecase/room-linkresolve.md)
