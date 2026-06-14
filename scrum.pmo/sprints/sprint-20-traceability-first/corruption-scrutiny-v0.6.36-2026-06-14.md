# Corruption Scrutiny — v0.6.36 "corrupt scenario.json restored" (planner, 2026-06-14)

**Verdict: DATA-LOSS RISK CLEARED.** Corruption was git merge-conflict markers (recoverable), restore git-clean, no silent loss.

## Cause (source-verified — NOT generation bug / uuid collision)
git MERGE introduced conflict markers into scenario JSON: commit `42747ae25` "merge: resolve build artifact conflicts" (build artifacts + scenario files conflicted). The TestCase generation itself (`806a998ce` v0.6.36, 1016 units) is INTACT — it did not corrupt data.

## Which files (PO said "7" — actual = 10 + 17; reconciled)
- **10 room scenario.json RESTORED** (`28c72357a`, from pre-merge `f2b0e609a`): 17728504, 32567ecd, a563a2c7, af778ee3, bc15e324, bf8a9ef3, c5899b10, e32a20a7, f672d29b, fe4d5664.
- **17 conflict-marker files RESOLVED** (`1df31f5f8`).

## GIT-CLEAN proof (no silent loss)
- Restore matched pre-corrupt: **10/10** restored == `f2b0e609a` (clean `git checkout`, git=backup).
- Completeness: **10/10** are complete valid `ior:class:Room` units (members/files intact, not truncated).
- All scenario JSON valid: **0 invalid** files (corruption sweep).
- Remaining merge-conflict markers: **0**.
- 17 conflict-resolved files: 17/17 valid JSON, 0 markers.
- 1016 TestCase units intact (no generation loss). Node count 3503.
- **broken-refs=0 EVEN POST-RESTORE**: the restore (after my [DUP] delete) did NOT re-introduce refs to the 22 deleted dup-sprints (verified 0 dangling at HEAD).

## Conclusion
Corruption = transient merge-markers, fully resolved. Restore is git-clean + complete. No silent data loss. git=backup made recovery a clean checkout.
