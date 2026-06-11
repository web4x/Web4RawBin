### R19.53: ONE canonical room location on disk — data/users/<uuid>/rooms/<roomUuid>/, no stray dirs.

<details><summary>Tron directive</summary>

> All room data MUST live under ONE canonical location: data/users/<user-uuid>/rooms/<room-uuid>/ (with files/ and messages/ subdirs). No room data outside this path. WRONG STRAYS to remove: scenario/rooms/<roomUuid>/ and scenario/sprints.json/rooms/<roomUuid>/. CORRECT (keep): scenario/sprints.md/room/*.md = generated views, these are fine. Two actions: (a) fix the CODE that writes to the stray paths (scenario/rooms/, scenario/sprints.json/rooms/) so all future writes go to the canonical data/users/ location only; (b) one-time MIGRATION of existing stray data into canonical (backup-gated).

</details>

## Traceability

**Tasks:**
- [🔗 T-room-dir-standardize: ONE canonical room location data/users/<u>/rooms/<r>](../task/room-dir-standardize-canonical-location.md)

**UseCases:**
- [🔗 room.canonicalDir](../usecase/room-canonicaldir.md)
