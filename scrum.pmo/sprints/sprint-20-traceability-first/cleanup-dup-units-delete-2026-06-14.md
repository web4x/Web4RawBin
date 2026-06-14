# Cleanup Unit — [DUP] Migration-Junk Delete (2026-06-14, Tron/PO)

**disk-is-truth, git=backup (NO tar).** Deleted the dup-sprint-dir migration-junk Sprint units from disk.

## Deleted: 22 [DUP/MERGED] Sprint units (commit a8758a14c)
20 `[DUP→canonical]` dup-sprint-dir artifacts + 2 `[MERGED→Sprint20]` fiction Sprint-29 nodes (incl double-dup `e89e55a1 [DUP→a4b96c49][DUP→385ca082]`). Refs re-pointed to FINAL canonical (chain-resolved) in 222 files BEFORE delete.

## Verify (all pass)
- `grep scenario/index [DUP]` = **0**
- `/api/trace [DUP]` = **0**
- broken-refs (dangling to deleted uuids) = **0**
- active Sprint nodes = 29, **0 dup names, 0 superseded sprints** → one canonical per number
- tar-backup hallucinations removed (`.cleanup-backups/`, `/tmp/*pre-*.tar.gz`); git = the backup (clean pre-delete commit + delete-commit = `git revert`).

## NOT deleted (flagged — NOT dup-sprint-dir migration artifacts)
7 superseded units remain, all meaningful supersession history (not migration junk):
- BUG12 `d2389829` `[MERGED→BUG9]` (bug-dedup record)
- 6 superseded Requirements: R19.58 (af607390), c9de63d7, R-placeholder-T202 (4d525a4d), R19.85 (b6ad2bdd), R19.89 (bd9bb433), R19.92 (b5688a42)

→ PO call: keep as supersession history, OR delete for full `supersededBy=0` (git=backup, quick follow-up). `[DUP]=0` already achieved.

## PO RULING (2026-06-14): 7 supersessions KEPT-on-disk + filtered-from-view — VERIFIED
Real supersession HISTORY (why BUG12=BUG9, req evolution) = the point of traceability; NOT junk. KEEP on disk, must NOT render in /trace.

**Planner SOURCE-VERIFIED (not relayed):**
- All 7 superseded units ON DISK ✓ (kept): BUG12 d2389829 + reqs af607390/c9de63d7/4d525a4d/b6ad2bdd/bd9bb433/b5688a42.
- All 7 ABSENT from /api/trace ✓ (0 occurrences each in served data).
- Code filter confirmed: `src/ts/scenario/skill-classes.ts:193` — `if (m.supersededBy) return true; // superseded reqs are not separate chains` (excludes supersededBy from chain/graph build).

**Distinction held + proven:** junk [DUP] DELETED · meaningful supersession KEPT-on-disk + FILTERED-from-view. Filter excludes ALL supersededBy (incl these 7).
