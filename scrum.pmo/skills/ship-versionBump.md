# ship.versionBump + release protocol

**UUID:** `0eca5ec0-6fe3-4b8b-9b69-b9e45e724a9d`
**Roles:** robbin-expert (impl), robbin-po (authorize)
**Requirement:** R17.18, PO learning #108

## Description

Rule #66: Every user-facing surface change bumps package.json version + sw.js CACHE_NAME.
build.mjs auto-stamps CACHE_NAME from package.json.

**A release = ALL THREE** (Tron law #108, non-negotiable):
1. `package.json` version bumped
2. `sw.js` CACHE_NAME stamped (build.mjs does this)
3. Monotonic `git tag v<version>` at the impl commit

'Version bumped' ≠ released without the tag. Tag at release time, never batch/drift.

## Release recipe

```bash
# 1. Bump version
# edit package.json: "version": "0.6.XX"

# 2. Build (stamps sw.js CACHE_NAME + STATIC_SHELL)
npm run build

# 3. Commit
git add package.json src/public/sw.js src/public/dist/build-manifest.json
git commit -m "v0.6.XX: <what changed>"

# 4. Tag (SAME commit — never deferred)
git tag v0.6.XX

# 5. Deploy
# otmux send iphone:0.1 ... (per deploy ritual)
```

## Release gate (verify before task counts as released)

```bash
# All 4 must pass:
grep '"version"' package.json              # → "0.6.XX"
grep 'CACHE_NAME' src/public/sw.js         # → rawbin-v0.6.XX
git tag --list 'v0.6.XX'                   # → v0.6.XX (non-empty)
# 4th check: tag points to the RIGHT version (existence ≠ correctness)
git show v0.6.XX:package.json | grep '"version"'  # → "0.6.XX" (MUST MATCH)
```

If ANY fails → not released. Fix before advancing.
**Tag existence ≠ tag correctness** — a tag pointing to a wrong-version commit is WORSE
than a missing tag (false confidence). Always verify the tagged commit's package.json.

## Drift backfill (when tags were missed)

```bash
# Find the version-bump commit
git log --oneline --grep="v0.6.XX" | head -1
# Tag it retroactively
git tag v0.6.XX <commit-sha>
```

## Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | `string` | ✓ | New semver version |

## Implementation

`ior:file:build.mjs?function=stampCacheName`

## Laws enforced (team-laws.md)
- **L3** GIT=BACKUP: version bump + tag committed to git, no tar
- **L13** RELEASE = VERSION + CACHE_NAME + TAG: all three or not released
