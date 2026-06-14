# T-s19-shared-impl-split-recovery: split 11 shared-impl regressions into own Impl+marker per method (never flip)
[task:uuid:d43fce61-58aa-4de8-a7d1-996953c7e48c]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (planner — 11 regressions diagnosed + split plan)
  - [ ] creating test cases
  - [ ] implementing (expert/backfill — split each shared impl → own Impl unit + marker per method)
  - [ ] testing (planner re-score det-3x + ground-truth each restored chain)
- [ ] QA Review
- [ ] Done

## Task Description

HONEST-CHAIN RECOVERY (count reconcile 168→160, PO 2026-06-13): 11 reqs that were genuine@seal regressed at the Impl hop because post-seal in-room-consolidation wired NEW methods to EXISTING impls (shared-impl, several cross-class), tripping the structural impl→1-method guard. FIX = SPLIT, NEVER FLIP: each borrowing method gets its OWN Impl unit + a real [impl:uuid:<FULL>] source marker; un-wire the shared impl from the foreign methods so every impl→exactly 1 method. Recovers the 11 originally-genuine chains (~171/201). Reqs (uuids in count-reconcile doc): R19.11 61c2661a, R19.12 dc2e99eb, R19.13 409ea58b, R19.21 d1391ee3, R19.27 4603db83, R19.31 836c97f9, R19.63 6052570f, R19.69 d989c0c4, R19.71 91ba9fbd, R19.72 380dc7c0, R19.73 02af5fc2. Shared impls: e289349c(x3), 32578dc6, f7b0c24a, 71c283ff, f94da2cd, 96fbfac9, 28f244c7, 6471cfbd; R19.72=25884b0c marker. Scoped into the 22:07 backfill (or expert if prioritized). Planner re-scores det-3x + ground-truths each restored chain (own impl + real marker, no shared-impl) before crediting — NEVER flip via re-wiring a shared marker (that was the original sin).

## Subtasks


