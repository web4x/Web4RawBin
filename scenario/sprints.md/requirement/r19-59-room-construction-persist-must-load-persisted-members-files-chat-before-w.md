### R19.59: Room construction persist must load persisted members/files/chat BEFORE writing — never wipe existing data.

<details><summary>Tron directive</summary>

> BUG (HeartSpace loss): Room.createRoom() / construction persist writes a fresh scenario unit that WIPES previously persisted members[], files[], and lastMessageIor. FIX: Room construction MUST load the existing persisted scenario unit FIRST (if it exists), merge any new construction-time fields into the loaded state, THEN persist. The load-before-write order ensures offline-retained members (R19.8/8.A), uploaded files (R19.46), and chat history (R19.40) survive server restart and Room re-creation.

</details>

## Traceability

**Tasks:**
- [🔗 T-room-load-before-write: load room from disk before persist to prevent loss](../task/room-load-before-write-prevent-loss.md)

**UseCases:**
- [🔗 room.loadBeforeWrite](../usecase/room-loadbeforewrite.md)
