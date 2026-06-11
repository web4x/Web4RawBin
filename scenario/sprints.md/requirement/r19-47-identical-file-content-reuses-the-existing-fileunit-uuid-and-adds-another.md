### R19.47: Identical file content reuses the existing FileUnit UUID and adds another unitLink.

<details><summary>Tron directive</summary>

> When a user drops a file whose content hash (R19.49) matches an EXISTING FileUnit in the index, the system MUST NOT create a new UUID/scenario unit. Instead it reuses the existing FileUnit's UUID and adds another unitLink (symlink) from the new location to that existing unit. The Room.files[] IOR list (R19.46) is not duplicated — the existing IOR is already there. This is content-addressable dedup: same content = same unit, multiple symlinks.

</details>

## Traceability

**Tasks:**
- [🔗 T-file-dedup-reuse: identical file content reuses existing FileUnit](../task/file-dedup-reuse-identical-content.md)

**UseCases:**
- [🔗 file.reuseByContentHash](../usecase/file-reusebycontenthash.md)
