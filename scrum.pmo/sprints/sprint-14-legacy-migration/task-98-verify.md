<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T98: Migration Integrity Verification (No Data Loss Proof)

[task:uuid:98c3e5a7-4d9f-4b12-9c68-3e5a7b9c0d98]

## Status
- [ ] Planned
- [ ] In Progress
  - [x] refinement (architect)
  - [ ] creating test cases
  - [x] implementing (expert) — verifier exists
  - [x] testing (tester) — ✅ CLEAN re-verify PASS (PO-confirmed): verify-report.json PASS:true, serverVersion 0.5.17, legacy data/rooms=3 (post-purge), 141 bijective remap, 0 dangling, 3 real rooms intact by exact ID
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

- [ ] AC1: Room coverage — `count(per-user rooms ∪ _unowned quarantine) ≥ baseline.legacyFlatRooms` (run-time baseline, NOT a hardcoded number); orphans enumerated (Inv.1)
- [ ] AC2: Content integrity on IMMUTABLE fields only (`id`, `createdAt`, `chatHistory`) — checksum/compare these; `ownerToken` is EXPECTED to differ where T97 rewrote it (assert new==newUuid, not byte-equality). (Inv.3)
- [ ] AC3: Every `token-*` dir has exactly one valid-v4 mapping in `token-remap.json`; no duplicates; every token-dir room (count == `baseline.tokenDirRooms`, run-time) present under its newUuid (Inv.2, Inv.4)
- [ ] AC4: Zero `token-<timestamp>` strings anywhere in the canonical UUID tree + profiles.json + devices.json (Inv.5 — Tron's no-dangling-ref requirement)
- [ ] AC5: Every canonical user dir + room subdir name matches v4 UUID regex; any `_unowned` rooms listed for Tron (Inv.6)
- [ ] AC6: Report `data/migration/verify-report.json` written with explicit top-level `PASS:true|false`; verifier is READ-ONLY (mutates nothing but the report)
- [ ] AC7: FAIL is loud (lists failing invariant + offending ids, non-zero exit) and BLOCKS T99 — no silent pass
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
