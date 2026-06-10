### R19.8: PERSISTENT rooms keep every member on the member list even when offline, shown as offline — no contact is ever lost.

<details><summary>Tron directive</summary>

> Tron literal: "persistent rooms add every one to the members list even if they are offline but show them as offline. but no contact gets ever lost."

</details>

## Traceability

**Tasks:**
- [🔗 T-persistent-retention: ws.close+LEAVE_ROOM branch on room.mode — markDisconnected vs removeMember](../task/persistent-retention-disconnect-vs-remove-by-mode.md)

**UseCases:**
- [🔗 room.maintainPersistentMembers](../usecase/room-maintainpersistentmembers.md)
- [🔗 room.retainOnDisconnect](../usecase/room-retainondisconnect.md)
