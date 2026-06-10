### R19.31: Room link navigates to the live room or room editor, never 404.

<details><summary>Tron directive</summary>

> BUG: clicking the room link from a room item navigates to a 404 page. FIX: the room link MUST navigate to either the live room view (/room/<roomUuid>) or the room editor — never a 404. The route must exist and the server must serve it. If the room is not found (deleted/expired), show a proper 'room not found' message, not a generic 404.

</details>

## Traceability

**UseCases:**
- [🔗 room.linkResolve](../usecase/room-linkresolve.md)
