<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.13: Deterministic build: same source -> same bundle hashes (reproducible, no per-restart churn)

[task:uuid:d1aa80fd-3a41-4f65-9da2-88a0090dcd43]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.13 `[requirement:uuid:335cb740-1594-488d-afc3-cc65d23df5bd]`
  - down
    - None (atomic task)

## Task Description

The esbuild build MUST be DETERMINISTIC: identical source produces IDENTICAL dist bundle content-hashes on every rebuild/restart. TODAY (architect-flagged, real): every restart regenerates the dist bundle content-hashes from IDENTICAL source, churning the working tree (new app-<hash>.js / build-manifest) - which FIGHTS the R31.7 tree-clean invariant INV-V3 (versionGuardTreeClean, start.mjs:84) on every deploy, forcing a spurious churn-commit per restart just to keep served==committed==tree-clean. FIX: pin esbuild's hashing to be content-deterministic (same input bytes -> same output hash; stable entry-names / no timestamp or nondeterministic salt in the hash) so a rebuild from unchanged source yields a byte-identical dist + build-manifest, ZERO tree churn, no churn-commit. This is the DURABLE COMPLEMENT to R31.7 (single-source version): R31.7 makes the VERSION single-sourced; R31.13 makes the BUILD reproducible - together = a clean deploy invariant (served==committed==tree-clean holds by construction across restarts). Route: architect designs (esbuild deterministic hashing / pin), expert implements, tester gates (rebuild twice from identical source -> byte-identical hashes + manifest). Chain wires onto the built fix.

## Acceptance Criteria

- [x] The esbuild build is content-DETERMINISTIC: rebuilding from IDENTICAL source produces IDENTICAL dist bundle content-hashes (app-<hash>.js, chunk names) - no timestamp / random salt / nondeterministic ordering in the hash input. Same source bytes in -> same hash out, every time.
- [x] A restart / redeploy with UNCHANGED source produces ZERO dist tree changes (no new app-<hash>.js, no build-manifest diff) - so there is NO spurious churn-commit per restart; served==committed==tree-clean holds without a hand-commit to absorb hash churn.
- [x] This makes the R31.7 tree-clean invariant INV-V3 (Build.versionGuardTreeClean, start.mjs:84) hold on EVERY deploy WITHOUT a spurious dist-hash churn fighting it. R31.7 = single-source VERSION; R31.13 = reproducible BUILD; together = a clean-deploy invariant (served==committed==tree-clean by construction).
- [x] Gate: build twice from byte-identical source -> the two dist outputs are BYTE-IDENTICAL (same bundle content-hashes AND identical build-manifest). A `git status` after a rebuild-on-unchanged-source shows a CLEAN dist tree (no modified/new dist files). Tester rebuild-twice determinism check.

## Subtasks

None (atomic task).
