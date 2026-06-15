# ship.versionBump

**UUID:** `0eca5ec0-6fe3-4b8b-9b69-b9e45e724a9d`
**Roles:** robbin-expert
**Requirement:** R17.18

## Description

Rule #66: Every user-facing surface change bumps package.json version + sw.js CACHE_NAME. build.mjs auto-stamps CACHE_NAME.

## Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | `string` | ✓ | New semver version |


## Returns

`void` — 

## Implementation

`ior:file:build.mjs?function=stampCacheName`

## Laws enforced (team-laws.md)
- **L3** GIT=BACKUP: version bump committed to git, no tar
