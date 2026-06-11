### R19.56: Cleanup legacy multi-char index shards — migrate to single-char-per-level canonical paths.

<details><summary>Tron directive</summary>

> scenario/index/ shards MUST be single-char-per-level (5-level: <u0>/<u1>/<u2>/<u3>/<u4>/<uuid>.scenario.json). Legacy multi-char prefix directories (e.g. 01666/, 08e36/, etc.) hold units in the OLD flat sharding scheme. Migrate each unit from the legacy multi-char dir to the canonical single-char shard path, update all symlinks that pointed to the old path, then REMOVE the empty legacy dirs.

</details>

## Traceability

**Tasks:**
- [🔗 T-shard-cleanup: cleanup legacy multi-char index shards — migrate to single-char](../task/shard-cleanup-legacy-multichar-to-singlechar.md)

**UseCases:**
- [🔗 index.canonicalShard](../usecase/index-canonicalshard.md)
