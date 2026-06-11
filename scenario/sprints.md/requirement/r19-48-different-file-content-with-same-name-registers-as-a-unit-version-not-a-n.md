### R19.48: Different file content with same name registers as a unit version, not a new unit.

<details><summary>Tron directive</summary>

> When a user drops a file whose content hash (R19.49) does NOT match any existing FileUnit but whose name matches an existing file in the room, the system MUST register it as a new VERSION of the existing FileUnit — not as a separate unit. The new content is stored as a new <uuid>.content, and the FileUnit's version[] array (R19.50) gains a new entry {version: N+1, ior: <new-content-ior>}. The FileUnit UUID stays the same; Room.files[] is unchanged. This is version-on-name-collision.

</details>

## Traceability

**Tasks:**
- [🔗 T-file-version-new: different content same name registers new version](../task/file-version-new-content-same-name.md)

**UseCases:**
- [🔗 file.versionByName](../usecase/file-versionbyname.md)
