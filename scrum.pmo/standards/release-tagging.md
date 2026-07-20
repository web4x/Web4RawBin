# Release Tagging Standard (tag-on-deploy)

**Status**: ACTIVE — Tron directive 2026-07-20. Owner: robbin-expert (tags each release); robbin-skill-expert (release-ops backfill + audit).

## The rule (going forward)

**Every version bump that gets deployed MUST get an annotated git tag `vX.Y.Z` on the commit that bumped `package.json`.**

The tag is part of the ship, not an afterthought. Sequence for each release:

1. Bump `package.json` `version` → `X.Y.Z` (rule #66 STATIC_SHELL #67 as applicable).
2. Commit the version bump + code.
3. Deploy.
4. **Tag it**: `git tag -a vX.Y.Z -m "Release vX.Y.Z: <one-line summary>"`
5. Push: `git push origin vX.Y.Z` (or `git push --tags`).

An **annotated** tag (`-a`) is required (not lightweight) — it carries author, date, and message, and survives as a first-class object.

## Why

- A tag is the durable, greppable anchor from a version number → the exact commit that shipped it. `git show vX.Y.Z`, `git diff vX.Y.Z..vX.Y.W`, bisect, rollback all key off tags.
- The practice **lapsed after v0.7.53** (2026-06 era): the entire early v0.7.x line shipped untagged. That gap was backfilled 2026-07-20 (see below). Never let it lapse again — tag-on-deploy is correct-by-construction; backfilling is archaeology.

## Backfill record (2026-07-20)

- 47 tags existed through v0.6.x; practice had lapsed for v0.7.x.
- Tron seeded v0.7.86 (HEAD). Release-ops (robbin-skill-expert) backfilled **v0.7.0 → v0.7.85** by walking `git log --reverse -- package.json` and tagging each version's *introducing* commit (first chronological commit whose `package.json` version equals the target).
- **85 tags created** (v0.7.0–v0.7.85). **v0.7.30 was SKIPPED** at bump time (package.json jumped 0.7.29 → 0.7.31) — a legitimate gap, left untagged rather than fabricated. Total v0.7 tags = 86.
- Script (reusable for any future backfill / audit): keeps the introduce-commit rule and refuses to fabricate for missing versions. Idempotent — skips versions already tagged.

## Audit / re-run

To verify no version is missing a tag, or to backfill a fresh gap, re-run the introduce-commit walk:
- For each `vX.Y.Z` in the range, find first commit (oldest-first) whose `package.json` version == `X.Y.Z`; tag if not already tagged; report MISSING for skipped version numbers.
- Determinism: same repo state → same mapping. Skipped version numbers (deliberate bump gaps) report MISSING and are NOT tagged.

## Push note

`git push --tags` may be blocked by the auto-mode classifier in some sessions. If blocked, flag robbin-po rather than forcing — the tags are committed locally (durable across rewind) and can be pushed from an authorized session.
