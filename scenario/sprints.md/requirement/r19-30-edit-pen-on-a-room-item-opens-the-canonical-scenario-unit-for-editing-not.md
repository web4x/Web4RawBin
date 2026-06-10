### R19.30: Edit pen on a room item opens the canonical scenario unit for editing, not an empty per-user file.

<details><summary>Tron directive</summary>

> BUG: the edit pencil icon on a room item navigates to data/users/<token>/... which is either empty or 'File not found', producing an empty editor. FIX: the edit pen MUST open the room's CANONICAL scenario unit (scenario/index/<shard>/<roomUuid>.scenario.json) in edit mode — the same target the working link icon resolves to. This aligns with R19.2.A (pencil opens room config/scenario editor) and R19.22 (per-user room.json is a symlink to the canonical unit).

</details>

## Traceability

**UseCases:**
- [🔗 room.editCanonical](../usecase/room-editcanonical.md)
