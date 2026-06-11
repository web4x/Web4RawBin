### R19.46: Room file-restore is driven by the scenario's authoritative files[] IOR list, not filesystem symlink scan.

<details><summary>Tron directive</summary>

> Room file restoration on load MUST be driven by the Room scenario unit's authoritative model.files[] IOR references (same pattern as model.members[] per R19.35), NOT by a blind filesystem symlink scan of the room folder (which produces duplicates and orphans). The Room scenario unit holds a files[] array of ior:instance:<fileUuid> refs — one entry per unique FileUnit. Restore iterates files[] and emits one FILE_ADDED per unique file scenario unit. Dedup is by file IOR — if the IOR is already in files[], it is not added again. One upload = ONE FileUnit creation + ONE files[] append. The scenario is the source of truth; symlinks are derived artifacts.

</details>

## Traceability

**Tasks:**
- [🔗 T-file-restore-scenario: Room file-restore from scenario files[] IOR list, not symlink scan + dedup](../task/file-restore-scenario-ior-list-dedup.md)

**UseCases:**
- [🔗 room.restoreFilesFromScenario](../usecase/room-restorefilesfromscenario.md)
- [🔗 file.dedupByContentHash](../usecase/file-dedupbycontenthash.md)
