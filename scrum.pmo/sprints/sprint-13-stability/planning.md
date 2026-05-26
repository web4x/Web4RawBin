[Back to README](../../README.md)

# Sprint 13 Planning — Stability (Core Workflow Fixes)

## Sprint Goal
Fix confirmed bugs in core, already-shipped workflows (Avatar=S7, Rooms=S9,
PWA=S5) and document each as a complete-workflow use case diagram. Single-purpose
stability sprint for cross-feature workflow defects.

## Why This Sprint (Tron directives 2026-05-26)
Tron's real-world use surfaced workflow-level bugs spanning prior sprints. Rather
than reopening closed sprints, collect them here as tracked, standard-compliant
tasks with complete-workflow use case diagrams (architect). All tasks follow the
[traceability standard](../../standards/traceability-standard.md).

## Inputs
- **Requirements:** [requirements.md](./requirements.md) (req-eng — R-A1, R-A2, R-R1, R-V1 with Tron quotes)
- **Diagrams:** [diagrams/](./diagrams/) (architect — complete-workflow use case .puml/.svg)

## Task List

- [ ] [T91: Avatar persistence — must not revert to default](./task-91-avatar-persist.md)
  **Status:** impl + testing DONE (f2e019c v0.4.11; tester 5/5, string-desync scope) — Tron QA pending · R-A1 (with T109)
  - String-desync overwrite fixed. Recurrence (decrypt-exception) → [T109](./task-109-avatar-recurrence-fix.md). R-A1 done only when T91+T109 both verify.

- [ ] [T109: Avatar Recurrence Fix — decrypt-exception overwrite + rekey re-encrypt](./task-109-avatar-recurrence-fix.md)
  **Status:** impl-done (expert 75053e4, v0.5.9 — re-encrypt files on identity rekey) — testing + Tron QA pending · R-A1
  - ensureAvatar catch must NEVER overwrite on decrypt exception; re-encrypt files/* on identity rekey so avatar.enc stays decryptable

- [ ] [T92: Avatar upload key-error UX](./task-92-avatar-upload-ux.md)
  **Status:** impl + testing DONE (f2e019c v0.4.11; tester 6/6 AC1-AC6, 3ca7830) — Tron QA pending · R-A2
  - Upload never surfaces "key not found"; auto-regenerate or friendly retry; log real error

- [ ] [T93: Multi-room lobby listing (load-from-disk)](./task-93-multi-room-lobby.md)
  **Status:** impl + testing DONE (492221a v0.5.2; tester 4/4 live, 27ef9c6) — Tron QA pending · R-R1
  - All of a user's rooms load from disk on connect and appear in lobby

- [ ] [T94: PWA update banner fix](./task-94-pwa-update-banner.md)
  **Status:** impl + testing DONE (f884672 v0.5.4, per-request version read; tester 3/3 + curl, 63f0219) — Tron QA pending · R-V1 · **CRITICAL**
  - New version shows update bar → reload picks up new build; architect audited SW path end-to-end

- [ ] [T95: Lobby Rooms Ordered Newest-First](./task-95-newest-rooms-first.md)
  **Status:** impl + testing DONE (3748f0e v0.5.5; tester TS1 1/1 + 10/10, 073b027) — Tron QA pending
  **Owner:** robbin-architect (design), robbin-expert (implement), robbin-tester (verify)
  - Sort lobby room list by createdAt desc (legacy `|| 0` → bottom, deterministic across restart)

- [ ] [T100: Test Data Isolation — DATA_DIR override](./task-100-test-data-isolation.md)
  **Status:** impl + testing DONE (v0.5.7; AC4 PASS ed5c5de — port-isolated run, prod 3→3 sha-identical, live stayed up) — Tron QA pending · R-T1 · test-infra
  - DATA_DIR env (default=prod). All AC1-AC5 met. Follow-up (tester): 7 disk-asserting specs to honor E2E_DATA_DIR (not a T100 bug)

## Dependency Graph
```
Independent bug fixes (no inter-task deps):
  T91 (avatar persist) ── R-A1
  T92 (avatar upload UX) ── R-A2
  T93 (multi-room load) ── R-R1
  T94 (PWA update bar) ── R-V1  [CRITICAL — may mask stale-SW root cause]
Each: architect use case diagram → expert impl → tester verify → Tron QA
```

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 7 (T91-95, T100, T109) |
| Tron QA-approved (Done) | 0/7 |
| Tested, awaiting Tron QA | T91, T92, T93, T94, T95, T100 (6) |
| Impl-done, testing pending | T109 (avatar recurrence fix, v0.5.9) |
| Note | R-A1 (avatar persist) done only when T91 + T109 both verify |
| Use case diagrams | 4 (architect, in diagrams/) |

## Definition of Done
- [ ] All 4 bug sets fixed (T91-T94 acceptance criteria)
- [ ] 4 complete-workflow use case diagrams authored + linked in task chains
- [ ] Version bumped + sw.js cache per task (PWA update reaches device)
- [ ] No regression in Sprints 5/7/9
- [ ] Tron QA approved

## Coordination
- **req-eng:** requirements.md (entries + Tron quotes) — DONE
- **architect:** complete-workflow use case .puml in diagrams/; T94 SW-path audit first
- **planner:** sprint structure, planning↔task consistency, chain links
- Parallel sprints consistent: S10 (contacts), S11 (traceability T85-T90), S12 (editor T84).
  Next new task = T100 (T96-T99 are Sprint 14 Legacy Migration).

---
**Product Owner:** robbin-po (robbinTeam:0.0)
**Planner:** robbin-planner (robbinTeam:1.0)
**Req-eng:** robbin-req (robbinTeam:1.1)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-26
**Sprint:** Sprint 13 — Stability (Core Workflow Fixes)
