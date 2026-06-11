### R19.51: Content-hash index at scenario/content/ with symlinks for O(1) dedup lookup on upload.

<details><summary>Tron directive</summary>

> A content-hash INDEX directory at scenario/content/ MUST hold symlinks named <contentHash>.file.scenario.json, each pointing to the canonical FileUnit scenario unit that stores that content. On upload: (1) compute content hash (R19.49), (2) look up scenario/content/<hash>.file.scenario.json — if the symlink exists, the file is a duplicate → reuse that FileUnit UUID + add unitLink per R19.47; if not, create the new FileUnit + add the index symlink. This gives O(1) hash-based dedup lookup without scanning the entire index. ADDITIONALLY: the content-index symlink MUST be registered in the canonical File scenario unit's unitLinks[] array (per R18.29-31 unitLinks lifecycle — always-consistent bidirectional). AC: (a) symlink exists at scenario/content/<hash>.file.scenario.json AND (b) that symlink path is listed in the FileUnit's unitLinks[].

</details>

## Traceability

**Tasks:**
- [🔗 T-content-hash-index: scenario/content/ index-build for existing files + one-time cleanse](../task/content-hash-index-build-existing-files-cleanse.md)

**UseCases:**
- [🔗 file.indexByContentHash](../usecase/file-indexbycontenthash.md)
