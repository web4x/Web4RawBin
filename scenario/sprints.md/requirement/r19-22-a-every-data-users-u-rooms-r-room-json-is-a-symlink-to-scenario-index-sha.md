### R19.22.A: Every data/users/<u>/rooms/<r>/room.json is a symlink to scenario/index/<shard>/<r>.scenario.json + one-shot backfill.

<details><summary>Tron directive</summary>

> Filesystem invariant: every room.json on disk is a symlink to the canonical Room scenario unit in the index. One-shot backfill converts existing standalone room.json files to symlinks pointing at the canonical scenario unit. After backfill, Room.persist writes to the canonical unit and the symlink resolves transparently.

</details>

## Traceability

**Tasks:**
- [🔗 T-room-symlink: room.json as symlink to canonical scenario unit + one-shot backfill](../task/room-symlink-canonical-scenario-unit-backfill.md)

**UseCases:**
- [🔗 room.symlinkCanonical](../usecase/room-symlinkcanonical.md)
