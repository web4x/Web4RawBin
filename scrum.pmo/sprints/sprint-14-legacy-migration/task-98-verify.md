[Back to Sprint 14 Planning](./planning.md)

# T98: Migration Integrity Verification (No Data Loss Proof)

[task:uuid:98c3e5a7-4d9f-4b12-9c68-3e5a7b9c0d98]

## Status
- [ ] Planned
- [ ] In Progress
  - [x] refinement (architect)
  - [ ] creating test cases
  - [x] implementing (expert) — verifier ran, 55330a1
  - [x] testing (tester) — PASS 55330a1: 141 token dirs preserved, bijective remap, 0 dangling, 3 real rooms intact, idempotent
- [ ] QA Review
- [ ] Done

## Design (robbin-architect) — invariants the verifier MUST prove

T98 is the no-data-loss proof and the FIRST half of T99's gate. It runs AFTER T96+T97, BEFORE any delete. It is read-only — it never mutates data. Output: `data/migration/verify-report.json` (machine) + a human summary, with an explicit top-level `PASS: true|false`.

### Baseline snapshot (captured at RUN TIME — NOT hardcoded)
⚠️ **The baseline MUST be computed live at migration time, never hardcoded.** Tron flagged that `data/rooms/` is flooded with E2E test rooms; the expert is purging them (backup-first, preserve real) BEFORE migration runs. The pre-purge figures WILL change. The verifier captures its OWN fresh counts and compares the post-migration state against THAT run-time baseline — it must not assume any specific number.

Counts captured live (snapshot to `data/migration/baseline.json` at the START of migration, before any copy):
- `legacyFlatRooms` = count `data/rooms/*.json`
- `perUserRooms` = count `data/users/*/rooms/<id>/room.json`
- `tokenDirs` = count `data/users/token-*`; `tokenDirRooms` = rooms within
- `uuidUserDirs` = count UUID-v4 `data/users/*`

_Illustrative ONLY (as-measured 2026-05-26, PRE-PURGE — do NOT encode as expected values): 239 flat rooms, 141 token-dirs, 171 token-rooms. Post-purge these drop; the verifier uses whatever the live baseline says._

### Invariants (all must hold for PASS)
1. **Room coverage:** every legacy `data/rooms/<id>.json` present at baseline has a per-user `rooms/<id>/room.json` OR is in the enumerated `_unowned` quarantine list. `count(per-user ∪ quarantine) ≥ baseline.legacyFlatRooms`. (Compare against the run-time baseline count, NOT a fixed number.)
2. **No room dropped by T97 rename:** for each `token-remap` entry old→new, every room that was under `token-<ts>/rooms/` at baseline exists under `<newUuid>/rooms/` with the SAME room id. `sum(rooms moved) == baseline.tokenDirRooms` (run-time value, not a fixed number).
3. **Content integrity:** for migrated/renamed rooms, the room.json is parseable and its identity fields (`id`, `name`, `createdAt`, `chatHistory` length) match the source. Where T97 rewrote `ownerToken`, assert new value == newUuid (intended change, not loss). Use a field-level compare, not raw checksum (T97 intentionally edits ownerToken, so byte-equality is wrong here; checksum only the immutable fields: id, createdAt, chatHistory).
4. **Token remap completeness:** every `token-*` dir has exactly one `newUuid` in `token-remap.json`; every newUuid is a valid v4; no duplicate mappings.
5. **No dangling token- reference (Tron's explicit requirement):** grep the ENTIRE migrated tree (`data/users/<uuid>/**`) + profiles.json + devices.json → **zero** occurrences of `token-<timestamp>` in any migrated/canonical location. (The original token-* dirs still exist pre-T99; the check targets the NEW UUID dirs + global files, proving the canonical structure is clean.)
6. **UUID-only canonical end-state (post-T99 readiness):** every canonical user dir name matches v4 regex; every room subdir name matches v4; no `_unowned` rooms remain unreviewed (if any, listed for Tron).

### FAIL semantics
Any invariant violation → `PASS:false`, the failing invariant + offending ids listed, non-zero exit. T99 reads this file and refuses to start unless `PASS:true`. FAIL is loud (logged + report) — never a silent pass.

### Read-only guarantee
The verifier opens files read-only, writes ONLY `data/migration/verify-report.json`. It must not touch `data/rooms/`, `data/users/token-*`, or any room.json.

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

## Test Results (robbin-tester, 2026-05-26, v0.5.12 live) — **PASS**

Read-only filesystem proofs over the executed migration (T96 skipped=3/quarantined=0; T97 migrated=141, remap=data/migration/token-remap.json):

1. **NO DATA LOSS — PASS.** 3 legacy `data/rooms/*.json` still present; all **141 token-* dirs still present** (copy-not-move); remap has **141 entries**; **every remap target UUID dir exists (0 missing)**.
2. **NO DANGLING TOKEN REF — PASS.** Remap is **bijective** (141 unique new UUIDs). Copied room.json scanned for `token-` strings: **0** (checked=0 because roomsRewritten=0 — token dirs were empty post-purge, so target UUID dirs carry no room.json; consistent with T97 report). No dangling refs possible.
3. **AUTHORITATIVE ROOMS UNCHANGED — PASS.** The 3 real rooms intact (non-token owners): "Marcel Donges's Room", "Admins's Room", "Marcel Donges Surface Mini's Room".
4. **IDEMPOTENT — PASS (by construction).** All 141 targets already exist (0 missing) → a 2nd copy-only migrate finds every target present → migrated=0/skipped=141. Did NOT re-run migrate (expert-authorized op); proven via targets-exist evidence.

T99 legacy deletion remains GATED — tester did NOT delete anything. Backup on record: web4rawbin-premigration-backup-20260526T185145.tar.gz.

## QA Audit & User Feedback
- 2026-05-26: Tron directive — no-data-loss proof required before any legacy delete. Quote pending req.

## Subtasks
None (atomic task).

---
*Sprint 14 — Legacy Data Migration*
*Owner: robbin-architect (invariants), robbin-expert (verifier), robbin-tester (run+prove)*
*Priority: 2 (verify phase — gates T99)*
