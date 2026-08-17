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

## Backfill record #2 (2026-08-17) — the SECOND lapse

The standard lapsed AGAIN after **v0.7.91**: v0.7.92 → v0.8.100 (~10 weeks of releases) shipped untagged while prod served 0.8.100. Tron caught it ("a rule kept as a HABIT instead of a MECHANISM decays the moment attention moves"). Release-ops (robbin-planner) backfilled:

- **157 annotated tags created: v0.7.92 → v0.8.100**, each on the EXACT SHIP commit (the first commit whose `package.json` version == the target — the introduce-commit rule; NOT HEAD). Origin tags 134 → 291. Script: `scratchpad/version-tags.mjs` (introduce-commit walk, refuses to fabricate, idempotent).
- **v0.8.40 SKIPPED** — the sequence jumps v0.8.39 (34e5ab7e7) → v0.8.41 (4e3837ae9); 0.8.40 never appears in `package.json` history = never shipped. Left untagged rather than fabricated (do NOT invent a tag for a version that never shipped).
- Measured 157 (vs a ~100 estimate) — the git history is the record; the estimate was not.

## Tagging scope policy — DECLARED, not defaulted (2026-08-17)

An undeclared gap is the omission-by-default disease. So the boundary is a DECLARED CHOICE, not a silent default:

- **Tagging is meaningful from v0.6.0 onward** (the lowest existing tag; the standard era + its backfills). Everything v0.6.0 → HEAD is the tagged record consumers rely on.
- **Versions BELOW v0.6.0 (≈300: the 0.1.0–0.5.x early releases) are INTENTIONALLY UNTAGGED — pre-standard, NOT missing.** Tron's concern is that we STOPPED honoring an adopted standard, not that pre-history lacks labels; tagging ~300 archaeological versions would bury the meaningful tags in noise (291 → ~600) for no consumer. If ever wanted, it is one `version-tags.mjs` run (the script tags any range, refuses fabrication).
- ✓ **IN-SPAN GAP — RESOLVED (57 backfilled 2026-08-17, PO-authorized).** 57 versions WITHIN the v0.6.0–v0.7.90 "tagged" span were UNTAGGED (0.6.15, 0.6.17, 0.6.44–0.6.66, … + v0.7.87–0.7.90) — the 2026-07-20 backfill#1 was INCOMPLETE. Measured: all 57 appear in `package.json` history at real HEAD-ancestor deploy commits = genuine shipped-to-repo (subjects are real R20/R21/R22/R25/S31 ship commits; two are debug-instrumentation bumps v0.6.15-debug/v0.6.17-debug, still real deploys) → **all 57 tagged at their exact ship commits, 0 non-ship to declare.** In-era is now fully tagged (v0.6.0→v0.7.91 = 190/190). Total tags → 348. The only never-shipped in this era is **v0.7.30** (sequence gap, correctly untagged, per backfill#1).

## Single source (by-construction — no rival counts)

**`scripts/release-tag-audit.mjs` is THE version↔tag enumeration** both release-ops (robbin-planner) AND the tester's release-tag gate CONSUME — never a second independent count (two counts = two-source-one-fact; the 357-vs-514 that looked divergent was the same set at different scopes: 357 pre-standard + 157 in-window = 514 total untagged, one source). `--audit` (counts + untagged-shipped + never-shipped gaps), `--json` (machine list `{version,commit,tagged}` the gate asserts served==committed==TAGGED against), `--backfill LO HI` (exact-ship-commit, idempotent, refuses to fabricate for never-shipped gaps).

## What a tag CLAIMS (stamped-vs-deployed, honest caveat)

`build.mjs` stamps `package.json`+`sw`+`manifest` atomically with the commit, so a tag marks the SHIP COMMIT — which is exactly what a tag should mark. But a stamped version whose deploy/RESTART never happened was never SERVED. Therefore **"tagged" means "shipped-to-repo", NOT "served in prod".** Do not claim more. The **served == committed == tagged** identity is what the tester's gate enforces (below); the tag alone asserts only the middle term.

## The three parts (so it cannot relapse a THIRD time)

1. **The record (this file)** — release-ops, robbin-planner: the backfill history + the declared scope + this caveat.
2. **The mechanism (robbin-expert)** — auto-tag INSIDE the same atomic deploy step that stamps package.json+sw+manifest, so tagging is correct-by-construction, not a remembered habit. (Never robbin-planner's lane — planner does not touch package.json/build.mjs.)
3. **The gate (robbin-tester)** — CI asserts `served == committed == TAGGED` with a stub-must-fail bite, report-only then strict. Record + mechanism + gate together = the standard becomes a MECHANISM, not a habit.
