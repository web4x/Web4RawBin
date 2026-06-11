### R19.30: Edit pen (✏️) opens the canonical room scenario unit in EDIT mode.

<details><summary>Tron directive</summary>

> INTENTION: the edit pen (✏️) opens the room's CANONICAL scenario unit (scenario/index/<shard>/<roomUuid>.scenario.json) in EDIT mode — the Monaco editor with the JSON content editable. Both pen and link resolve to the SAME canonical target (the room scenario unit); the pen opens it for editing, the link opens it for viewing/navigating. BUG (original): pen navigated to data/users/<token>/... (empty/missing per-user file) instead of the canonical unit. FIX: pen href must point to /edit/<canonical-scenario-path>.

</details>

## Traceability

**Tasks:**
- [🔗 T-room-edit-pen-canonical: edit pen on room item opens canonical scenario unit](../task/room-edit-pen-opens-canonical-scenario.md)

**UseCases:**
- [🔗 room.editCanonical](../usecase/room-editcanonical.md)
