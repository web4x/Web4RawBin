### R19.60: Pre-existing rooms backfill files[] from on-disk FileUnits so old rooms restore files on join.

<details><summary>Tron directive</summary>

> Rooms created BEFORE the Room.files[] IOR pattern (R19.46) may have FileUnit scenario units on disk (in their room folder) but an empty files[] array. On room load/join, the server MUST backfill files[] by scanning for FileUnit symlinks in the room's canonical directory and adding their IORs to files[]. This one-time backfill ensures old rooms restore their files for joining members without requiring manual re-upload.

</details>

## Traceability

**Tasks:**
- [🔗 T-room-files-backfill: backfill room files[] from existing on-disk files](../task/room-files-backfill-existing-disk.md)

**UseCases:**
- [🔗 room.backfillFiles](../usecase/room-backfillfiles.md)
