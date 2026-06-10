### R19.22: Every per-user room.json is a symlink to the canonical Room scenario unit, and the UI shows a link to it next to the edit button.

<details><summary>Tron directive</summary>

> Every data/users/<userUuid>/rooms/<roomUuid>/room.json MUST be a filesystem symlink (ln) to the canonical Room scenario unit at scenario/index/<shard>/<roomUuid>.scenario.json — never a standalone JSON file. The UI MUST also display a link affordance next to the edit pencil button that navigates to the canonical scenario unit. Aligns with the unitLinks pattern from R18.29-R18.31 (lifecycle of unitLinks symlinks) and R19.14 / R19.20 (file scenario units carry unitLinks references to their ln links on the filesystem). Backfill required for existing room.json files that are currently empty or standalone.

</details>

## Traceability

**UseCases:**
- [🔗 room.symlinkCanonical](../usecase/room-symlinkcanonical.md)
- [🔗 room.linkToScenario](../usecase/room-linktoscenario.md)
