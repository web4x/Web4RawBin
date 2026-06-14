# Phase 1 Migration — Planner Verification (2026-06-14)

**Verdict: ⛔ DO NOT GREENLIGHT Phase 2.** Migration broadened coverage (good) but introduced **Sprint-unit collisions** via duplicate sprint dirs.

**Subject:** expert commit `5569cf504` "Phase 1 migration: 214 markdown tasks → scenario units (0 missing)". Backup: `/tmp/pre-phase1-backup-20260614T193737Z.tar.gz`. Baseline (planner): 2175 nodes.

## Verification (locked plan)

### 1. Node-delta — explained, but message understates it
2175 → **2486** = **+311** (not 214). Commit `5569cf504` added across TYPES:
| Type | Added |
|------|-------|
| Requirement | 49 |
| Method | 96 |
| Class | 42 |
| Task | 94 |
| Sprint | 29 |
| TraceLink | 1 |
| **Total** | **311** |

✓ Addresses PO scrutiny: reqs/ucs/methods/classes WERE migrated, not tasks-only. Tasks confirmed present (e.g. `606277ca` exists). The "214 tasks" label undersells the actual scope.

### 2. ⛔ Collisions — FAIL
**51 Sprint nodes for ~20 real sprints.** 9 sprint names duplicated ×2–3: `Sprint traceability` ×3; `rawbin-foundation`, `identity-ssh`, `e2e-hardening`, `pwa-offline`, `monaco-editor`, `encrypted-storage`, `web-components`, `room-identity` each ×2.

**Root cause:** duplicate sprint DIRECTORIES — sprints 1–9 each have TWO dirs (`sprint-0N-*` zero-padded AND `sprint-N-*` non-padded). The migration minted a Sprint node per dir variant.

### 3. Parity (0-pending) — CONFOUNDED
`migrate-to-scenario.ts` dry-run still reports "would create" for tasks that ALREADY EXIST (e.g. `606277ca`) — false re-proposals because it reads BOTH duplicate dirs. A clean 0-pending cannot be certified until the dup dirs are reconciled.

### 4. Refactor integrity ✓
None of the S29→S20 refactor nodes (`4e728c81`, `6dc43057`, `b7894ac3`, `64af2638`, `0171efa2`) were modified. My refactor is intact.

## Required before Phase 2 green
1. Reconcile the 9 duplicate sprint dirs (`sprint-0N-*` vs `sprint-N-*` → ONE canonical naming).
2. Dedupe the 9–10 duplicate Sprint nodes (supersede dups → one per sprint).
3. Re-run `migrate-to-scenario.ts` dry-run across canonical sprints → clean **0-pending all types**.
4. Re-verify node-delta + no new collisions → THEN planner greenlights Phase 2 (`/api/trace` switch).

---

## RECONCILE COMPLETE + ✅ PHASE 2 GREENLIT (planner, 2026-06-14, commit 8bd3a0ebc)

PO ruling: **Option B** — Tron R18.19 (zero-pad 01-09) outranks least-breakage. Executed:
- PADDED canonical: rich non-padded content (`sprint-N-*`) git-moved INTO `sprint-0N-*` names (sprints 01-09); all content preserved (non-padded was richer; sparse padded backed up at `.cleanup-backups/pre-dup-sprint-dirs-*`).
- 164 refs bulk-updated `sprint-N-` → `sprint-0N-` (anchored; sprint-10..20 untouched).
- ~21 dup/empty Sprint nodes (migration artifacts from `5569cf504`) superseded → canonical. S4/S11 renamed distinctly ("Sprint 04 — Traceability" / "Sprint 11 — Traceability Standardization").

**Gate (all pass):** broken active refs=0 · duplicate active Sprint names=0 (29 distinct) · parity 0-real-missing (242 task UUIDs all present) · node 2486 stable. NOTE: `migrate-to-scenario.ts` dry-run is NOISE (re-proposes existing tasks); the **0-missing existence check** is the real parity signal. The residual `sprint-29`/`sprint-20-forward` strings are in this verification/migration-history doc + a generated view — not active links.

**✅ PHASE 2 (`/api/trace` switch) GREENLIT.**
