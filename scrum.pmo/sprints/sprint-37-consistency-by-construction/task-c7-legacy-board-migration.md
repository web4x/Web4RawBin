<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task C7: Legacy hand-authored boards MIGRATED to generated (units-completeness-proven, zero loss) [R-C7]

[task:uuid:bb31965b-8fe7-401b-8d19-968aad127bf0]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [~] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

In Progress — BoardMigrator mechanism BUILT (proveComplete G1 + applyMigration G2-G5, expert 520885af9; markerPending=false 7e5f7b280; 5-gate BITE PASS 1b94f5da1) + gap-report ran (ed9beb540: 37 sprints 11 PASS / 26 REFUSE / 694 gaps). PENDING: chain-complete-to-Test verify + per-sprint EXECUTION (26 REFUSE need G2 units-backfill = req+planner mint-from-hand-files per architect classification). @390 N/A (scripts/CI). Verify Impl.tests[] on disk before flip.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R-C7 `[requirement:uuid:6ccbef4e-4630-408d-8178-b8af73710759]`
  - down
    - None (atomic task)

## Task Description

R-C7 (expert-surfaced during R-C2 run; Tron-authorized EXECUTABLE, data-loss-sensitive). The ~20 legacy hand-authored requirements.md + ~10 planning.md (pre-R30.18, no GENERATED_HEADER) are MIGRATED to generated views so the whole board becomes generated (closing the drift-seam R-C2 could not touch). For each legacy board its scenario UNITS must be PROVEN to carry ALL the file's content BEFORE any clobber; where they do not, units are BACKFILLED from the file FIRST. Idempotent + reversible one-sprint-at-a-time, ZERO content loss. This is what makes 37/37 REAL (R-C2 keeps its honest generator-owned-green scope).

## Acceptance Criteria

- [ ] (safety) Before ANY clobber of a legacy hand-authored board, its scenario UNITS are PROVEN to carry ALL the file's content (per-sprint units-completeness check); NO file is overwritten until completeness is proven for that sprint.
- [ ] (safety) Where the units do NOT carry all the content, the units are BACKFILLED from the file FIRST (content flows file->units, the file being that content's source of record until migrated) - THEN the generator owns the view. Content that exists only in the file is NEVER deleted.
- [ ] (safety) GENUINE narrative content (human prose NOT unit-derived) STAYS hand-authored in a preserved region (mirrors R-C6's preserved-narrative OWNED-region); the migration generates the unit-derived portions and PRESERVES genuine narrative, never flattening it.
- [ ] (safety) The migration is idempotent (re-run = no-op) and REVERSIBLE ONE-SPRINT-AT-A-TIME (each sprint's pre-migration file recoverable via git); ZERO content loss end-to-end, provable by diffing pre-file content against post-generated + units.
- [ ] (functional) The ~20 requirements.md + ~10 planning.md are the EXPLICIT tracked scope (no-silent-caps); the architect's read-only completeness audit populates the per-sprint classification (units-complete vs needs-backfill) before execution.
- [ ] (governance) TRON-AUTHORIZED EXECUTABLE (2026-08-07): the migration RUNS one sprint at a time; each sprint migrates ONLY after its units-completeness is PROVEN (per-sprint gate); the architect designs the procedure + per-sprint classification.
- [ ] (gate) BITE TEST (distinct-intent): plant a units-INCOMPLETE sprint -> the migration REFUSES to write that sprint (fail-loud, no clobber); a units-COMPLETE sprint -> migrates + --check byte-matches + original content fully present (post-generated + units) + reversible. Verify Impl.tests[] on disk before flip.

## Subtasks

None (atomic task).
