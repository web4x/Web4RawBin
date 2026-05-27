[Back to README](../../README.md)

# Sprint 14 Planning — Legacy Data Migration

> ✅ **IMPL COMPLETE — awaiting tester UI verify + Tron QA (2026-05-27):** T96/T97
> migrated, T98 clean-verify PASS, T99 GATE CLEARED (T98 PASS + Tron auth) + delete
> RAN (ec0423d v0.5.19) — gate held end-to-end. The post-delete dual-write regeneration
> is FIXED: v0.5.20 (9c1b0a0) removed the dual-WRITE + dead loadFromDisk/fromPersisted/
> setPersistDir. Planner code-verified 2026-05-27: NO data/rooms write/load path in src/
> (only T99 removal comments); live FS has data/rooms ABSENT while per-user rooms present;
> expert runtime proof shows a new room writes per-user ONLY, data/rooms stays gone.
> **Remaining: tester independent UI room-create verification, then Tron QA across S14.**
> Guardrail: `rekeyUser` (T109) re-encrypts files/* on identity rekey.

## Sprint Goal
Safely migrate legacy on-disk data to the per-user / UUIDv4 model, PROVE no data
loss, then — only after verification passes and Tron authorizes — remove the
legacy code + files. Migration is copy-then-verify; deletion is gated and last.

## Why This Sprint (Tron directive 2026-05-26)
T93's root-cause work exposed that legacy `data/rooms/` (~191) shadows per-user
persistence (~173) at startup, and legacy `token-<timestamp>` dirs predate the
UUIDv4 token model. This sprint consolidates onto the per-user/UUID model with an
auditable no-data-loss proof and a GATED removal of the legacy path.

## Inputs
- **Requirements:** [requirements.md](./requirements.md) (req-eng — R14.1-R14.4 + Tron quotes)
- **Diagrams:** [diagrams/](./diagrams/) (architect — migration-workflow .puml/.svg)

## Task List

- [ ] [T96: Migrate legacy data/rooms → per-user room model](./task-96-migrate-rooms.md)
  **Status:** impl-done + committed (5dc7a53 v0.5.12, copy-only idempotent) — verify via T98, then Tron QA · R14.1 · migrate phase
  - Architect finding: all 239 legacy rooms ALREADY per-user (0 legacy-only) → T96 = never-overwrite reconciler, NOT a bulk move; orphans → _unowned quarantine

- [ ] [T97: Migrate token-<timestamp> user dirs → UUIDv4](./task-97-migrate-userdirs.md)
  **Status:** impl-done + committed (5dc7a53 v0.5.12, copy-only idempotent) — verify via T98, then Tron QA · R14.2 · migrate phase (parallel with T96)
  - Architect finding: 141 token-* dirs are self-contained (0 profiles/ssh; 171 rooms) → copy-then-rename + rewrite ownerToken in copies; remap table → token-remap.json

- [ ] [T98: Migration integrity verification (no-data-loss proof)](./task-98-verify.md)
  **Status:** ✅ CLEAN re-verify PASS (PO-confirmed) — verify-report.json PASS:true, serverVersion 0.5.17, legacy data/rooms=3 (post-purge), 141 bijective remap, 0 dangling, 3 real rooms intact. Tron QA pending. · R14.3 · **GATES T99**
  - No-data-loss proven on CURRENT data. T99 gate-(a) clean-T98-PASS is MET.

- [ ] [T99: Remove legacy load path + files — ⛔ GATED](./task-99-remove-legacy.md)
  **Status:** impl-done (v0.5.20, 9c1b0a0) — gate held + delete ran (ec0423d v0.5.19); post-delete dual-write regen FIXED (write path + dead loadFromDisk removed). Code-verified: no legacy write/load path in src/; data/rooms absent, per-user rooms present. Awaiting tester UI room-create verification, then Tron QA. · R14.4 · delete phase (LAST)
  - **GATE: starts ONLY after (a) T98 verify PASS AND (b) explicit Tron authorization. NEVER auto-runs.**
  - Remove legacy loadFromDisk; delete data/rooms/ + migrated token dirs (after backup tar)

## Dependency Graph (HARD sequence)
```
T96 migrate-rooms ──┐
                    ├──→ T98 verify ──[(a) PASS + (b) TRON AUTHORIZATION]──→ T99 remove-legacy
T97 migrate-userdirs┘                         ⛔ GATE                          (destructive, last)
```
T99 is GATED: it does NOT auto-run. Both gate conditions must be recorded in
T99's QA Audit GATE LOG before any implementation begins.

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 4 (T96-T99) |
| Tron QA-approved (Done) | 0/4 |
| Migrate done | T96, T97 (5dc7a53 v0.5.12) |
| Verify ✅ | T98 — CLEAN re-verify PASS (PO-confirmed, v0.5.17, 3 rooms, 141 bijective, 0 dangling) — Tron QA pending |
| T99 ✅ EXECUTED | gate cleared (T98 PASS + Tron auth 2026-05-26); legacy path removed (ec0423d v0.5.19); regression test pending |
| Phases | migrate (T96,T97) → verify (T98) → ⛔gate→ delete (T99) |
| Use case diagrams | 1 (architect — migration-workflow) |

## Definition of Done
- [ ] T96+T97 migrate legacy → per-user/UUID, idempotent, no data loss
- [ ] T98 verification PASS (auditable no-data-loss proof)
- [ ] T99 executed ONLY after T98 PASS + Tron authorization (gate honored + logged)
- [ ] Legacy load path + files removed; per-user/UUID is sole source of truth
- [ ] Backup taken before deletion; full suite green; no regression
- [ ] Tron QA approved

## Guardrails
- Migration is COPY-then-verify — legacy untouched until T99.
- T99 delete is GATED + last + backed-up. Never auto-run; never before T98 PASS + Tron OK.
- QA Review + Done remain Tron's gate (set only on 'QA approved by Tron' commit).

## Coordination
- **req-eng:** requirements.md text + Tron quotes
- **architect:** safe/idempotent/reversible migration design + migration-workflow diagram
- **planner:** sprint structure, planning↔task consistency, gate enforcement in docs
- Parallel sprints consistent: S10 (contacts), S11 (traceability T85-90), S12 (editor T84),
  S13 (stability T91-95). Next new task after this sprint = T100.

---
**Product Owner:** robbin-po (robbinTeam:0.0)
**Planner:** robbin-planner (robbinTeam:1.0)
**Req-eng:** robbin-req (robbinTeam:1.1)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-26
**Sprint:** Sprint 14 — Legacy Data Migration
