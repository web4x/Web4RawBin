### R19.50: File scenario unit has a version[] array of {version, ior} entries.

<details><summary>Tron directive</summary>

> Every FileUnit scenario unit MUST have a model.version[] array. Each entry is {version: <number>, ior: <ior-to-content>} representing one version of the file's content. Version 1 is the initial upload. Subsequent versions (R19.48) append entries with incrementing version numbers. The latest version is the last entry. The current content symlink always points to the latest version's content file.

</details>

## Traceability

**Tasks:**
- [🔗 T-file-version-array: file scenario unit has version[] array {version,ior}](../task/file-version-array-version-ior.md)

**UseCases:**
- [🔗 file.uploadEndpoint](../usecase/file-uploadendpoint.md)
