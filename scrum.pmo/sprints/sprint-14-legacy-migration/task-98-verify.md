[Back to Sprint 14 Planning](./planning.md)

# T98: Migration Integrity Verification (No Data Loss Proof)

[task:uuid:98c3e5a7-4d9f-4b12-9c68-3e5a7b9c0d98]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (architect)
  - [ ] creating test cases
  - [ ] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [requirement:uuid:34c3d4e5-f6a7-4b82-9c93-1d2e3f4a5b03](./requirements.md) — R14.3 migration integrity proof
  - [Sprint 14 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R14.3 in [requirements.md](./requirements.md)
  - **use case:** verify/no-data-loss (architect — diagrams/migration-workflow.puml)
  - **puml:** [diagrams/migration-workflow.puml](./diagrams/migration-workflow.puml) (pending architect)
  - **class/method:** migration verifier (new); reconciles legacy vs migrated counts/content
- gates
  - [T99](./task-99-remove-legacy.md) — T99 is GATED on T98 PASS (+ Tron authorization)

## Task Description
Produce an auditable proof that migration (T96+T97) lost nothing: every legacy
record maps to exactly one migrated record, counts reconcile, content matches
(checksums), token remap is complete. Output a verification report. **This is the
first half of T99's gate** — T99 cannot proceed unless this PASSES.
_(Architect defines the invariants; expert implements the verifier; tester runs it.)_

## Acceptance Criteria
- [ ] AC1: Legacy room count == migrated room count (minus reported orphans, which are enumerated)
- [ ] AC2: Each legacy room's content matches its migrated copy (checksum/field compare)
- [ ] AC3: Every old token has exactly one UUIDv4 mapping; no orphaned references anywhere
- [ ] AC4: Verification report written (machine + human readable); PASS/FAIL explicit
- [ ] AC5: FAIL is loud and blocks T99 (no silent pass)
- [ ] `npm run build` + version bump

## Dependencies
- **Requires:** T96 (rooms migrated), T97 (user dirs migrated)
- **Enables:** T99 (ONLY if PASS) — see gate

## Definition of Done
- [ ] All AC met; chain links resolve; verification report PASS
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-26: Tron directive — no-data-loss proof required before any legacy delete. Quote pending req.

## Subtasks
None (atomic task).

---
*Sprint 14 — Legacy Data Migration*
*Owner: robbin-architect (invariants), robbin-expert (verifier), robbin-tester (run+prove)*
*Priority: 2 (verify phase — gates T99)*
