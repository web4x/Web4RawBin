### R19.49: Each file scenario unit stores a content hash.

<details><summary>Tron directive</summary>

> Every FileUnit scenario unit MUST store a model.contentHash field — a cryptographic hash (e.g. SHA-256 hex) of the file's binary content computed at upload time. This hash is the dedup key for R19.47 (identical content reuse) and the difference detector for R19.48 (version-on-name-collision). The hash is immutable for a given content version.

</details>

## Traceability

**Tasks:**
- [🔗 T-file-content-hash: file scenario unit stores content hash](../task/file-content-hash-scenario-unit.md)

**UseCases:**
- [🔗 file.storeContentHash](../usecase/file-storecontenthash.md)
