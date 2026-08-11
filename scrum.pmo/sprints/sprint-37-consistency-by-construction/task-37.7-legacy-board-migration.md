<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.7: Legacy hand-authored boards MIGRATED to generated (units-completeness-proven, zero loss) [R37.7]

[task:uuid:bb31965b-8fe7-401b-8d19-968aad127bf0]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

QA-Review (units-win): chain-complete-to-Test — Impl 73f045d8 applyMigration markerPending=false + Impl.tests[]=[0870c78b] pass, 6 BITE gates GREEN (rc7 + rc7b-f). All 4 In-Progress sub-steps [x]. ★ NOTE: the MECHANISM is chain-complete+gated (QA-Review); per-sprint EXECUTION residual (26 REFUSE need G2 units-backfill) is downstream run-work, NOT a chain gap. Done-gate [ ] = Tron's act. Board re-derived from units (PO campaign-sync 2026-08-09). ★★ C7 STANDING RULE (PO ruling 2026-08-09, from the S03/S09 refusal): a hand-authored LEGACY board (no '<!-- GENERATED FROM SCENARIO UNITS -->' marker — e.g. S03 '# Sprint 3 Planning', S09 '[Back to README]') is AUTHORITATIVE and must NEVER be blind-regenerated into generated form — a regen would CLOBBER prose + diagrams/*.puml + SVGs the units do NOT provably carry (the data-loss C7 exists to prevent). Legacy->generated is GATED: prove units carry ALL the file's content -> backfill gaps -> preserve narrative -> ONLY THEN generate. A future agent (or PO) must not 'tidy' a legacy sprint into oblivion; refusing a destructive re-derive beats obeying one. Corollary: to fix legacy DATA (e.g. de-embed a number from the sprint name), edit the UNIT field ONLY, never the hand-authored MD prose.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Requirement R37.7 `[requirement:uuid:6ccbef4e-4630-408d-8178-b8af73710759]`
  - down
    - None (atomic task)

## Task Description

R37.7 (expert-surfaced during R37.2 run; Tron-authorized EXECUTABLE, data-loss-sensitive). The ~20 legacy hand-authored requirements.md + ~10 planning.md (pre-R30.18, no GENERATED_HEADER) are MIGRATED to generated views so the whole board becomes generated (closing the drift-seam R37.2 could not touch). For each legacy board its scenario UNITS must be PROVEN to carry ALL the file's content BEFORE any clobber; where they do not, units are BACKFILLED from the file FIRST. Idempotent + reversible one-sprint-at-a-time, ZERO content loss. This is what makes 37/37 REAL (R37.2 keeps its honest generator-owned-green scope).

## Acceptance Criteria

- [ ] (safety) Before ANY clobber of a legacy hand-authored board, its scenario UNITS are PROVEN to carry ALL the file's content (per-sprint units-completeness check); NO file is overwritten until completeness is proven for that sprint.
- [ ] (safety) Where the units do NOT carry all the content, the units are BACKFILLED from the file FIRST (content flows file->units, the file being that content's source of record until migrated) - THEN the generator owns the view. Content that exists only in the file is NEVER deleted.
- [ ] (safety) GENUINE narrative content (human prose NOT unit-derived) STAYS hand-authored in a preserved region (mirrors R37.6's preserved-narrative OWNED-region); the migration generates the unit-derived portions and PRESERVES genuine narrative, never flattening it.
- [ ] (safety) The migration is idempotent (re-run = no-op) and REVERSIBLE ONE-SPRINT-AT-A-TIME (each sprint's pre-migration file recoverable via git); ZERO content loss end-to-end, provable by diffing pre-file content against post-generated + units.
- [ ] (functional) The ~20 requirements.md + ~10 planning.md are the EXPLICIT tracked scope (no-silent-caps); the architect's read-only completeness audit populates the per-sprint classification (units-complete vs needs-backfill) before execution.
- [ ] (governance) TRON-AUTHORIZED EXECUTABLE (2026-08-07): the migration RUNS one sprint at a time; each sprint migrates ONLY after its units-completeness is PROVEN (per-sprint gate); the architect designs the procedure + per-sprint classification.
- [ ] (gate) BITE TEST (distinct-intent): plant a units-INCOMPLETE sprint -> the migration REFUSES to write that sprint (fail-loud, no clobber); a units-COMPLETE sprint -> migrates + --check byte-matches + original content fully present (post-generated + units) + reversible. Verify Impl.tests[] on disk before flip.

## Subtasks

None (atomic task).
