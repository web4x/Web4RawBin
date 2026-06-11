### R19.35: Room scenario unit model holds IOR references to its member units.

<details><summary>Tron directive</summary>

> The Room scenario unit's model MUST hold IOR references to its members as a members[] array of ior:instance:<memberUuid> refs (same pattern as tasks[], useCases[]). Members become first-class linked scenario units — traceable and navigable from the Room unit in /trace and the room detail view — not just runtime WebSocket session data. This makes the member list persistent in the scenario graph, surviving server restarts and enabling traceability walks from Room→Member.

</details>

## Traceability

**Tasks:**
- [🔗 T-member-iors: room scenario unit model holds IOR references to its members](../task/room-member-ior-references.md)

**UseCases:**
- [🔗 room.persistMembers](../usecase/room-persistmembers.md)
