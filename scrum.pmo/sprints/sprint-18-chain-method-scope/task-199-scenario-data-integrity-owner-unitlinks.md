[Back to Sprint 18 Planning](./planning.md)

# T199: Scenario data integrity — backfill `ownerIor` + `unitLinks[]` on every unit (R18.32)

[task:uuid:f5b8c83e-3263-4d76-957b-4fe230e50269]

> **PO direction 2026-06-08:** Stand up a task for the scenario-data-integrity
> fix: every unit needs valid `ownerIor` + `unitLinks[]`. Measured on 768 units:
> 184 no-owner (39 missing field entirely + 145 empty/null), 501 missing
> `unitLinks[]`. req capturing (R18.32, compound-source uncommitted), architect
> assessing; owners expert (backfill) + tester (verify).

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement (req-eng captures R18.32 + architect assesses approach)
  - [ ] creating test cases
  - [ ] implementing (expert backfill)
  - [ ] testing (tester verifies 0 violations)
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only. Never checked by planner/sync.

## Traceability

`[task:uuid:f5b8c83e-3263-4d76-957b-4fe230e50269]`

- up
  - [Sprint 18 Planning](./planning.md)
  - [compound-requirement-source.md](./compound-requirement-source.md) — Follow-on H + R18.32 "Every scenario unit has valid ownerIor and unitLinks[]" (Tron verbatim: "I found scenarios without owners and without unitLists [unitLinks]." 2026-06-08)
  - **R18.32** `[requirement:uuid:76b16118-dc5d-4d40-a791-99c0bc1db3c5]` — placeholder; req-eng to canonicalize when emitting R18.32 as a formal Requirement scenario unit (planner generated per learning #17; req can adopt or replace)
- down
  - None (atomic task)
- chain (req → task → useCase → class → method → implementation → test) — populated by req+architect during refinement

## Task Description

**Measured baseline (768 units total):**
| Defect | Count |
|--------|-------|
| `ownerIor` field missing entirely | 39 |
| `ownerIor` empty/null | 145 |
| `unitLinks[]` field missing | 501 |

**Fix:** Backfill both fields on every scenario unit so the LOCKED chain
(`requirement → task → useCase → class → method → implementation → test`)
has consistent parent pointers (`ownerIor`) AND consistent symlink-state
representation (`unitLinks[]` per R18.30/R18.31).

- **ownerIor** = the parent/owner unit's IOR in the LOCKED chain (Sprint owns
  Task; Task owns UseCase; UseCase owns Class; Class owns Method; Method owns
  Implementation; Implementation owns Test).
- **unitLinks[]** = array of IORs to linked instances (the on-disk symlinks this
  unit should have); initialize to `[]` at minimum, per R18.30 schema. Lifecycle
  methods from R18.31 (`addLink`, `removeLink`, `syncLinks`) keep this consistent
  with disk state.

Architect to design the backfill approach (per-type heuristics: e.g. Task's
ownerIor = the Sprint that lists it; UC's ownerIor = the Task referencing it;
etc.). Expert implements per architect's design. Tester re-runs the
`trace-cli audit` (or equivalent measurement) and confirms zero violations.

## Acceptance Criteria
- [ ] AC1 — Zero units with missing `ownerIor` field (currently 39)
- [ ] AC2 — Zero units with empty/null `ownerIor` (currently 145)
- [ ] AC3 — Zero units missing `unitLinks[]` field (currently 501)
- [ ] AC4 — `trace-cli audit` (or equivalent live measurement) reports 0 `ownerIor` violations + 0 missing `unitLinks[]`
- [ ] AC5 — `ownerIor` values resolve via `IOR.resolve()` to an existing unit; no dangling parents
- [ ] AC6 — `unitLinks[]` values resolve; on-disk symlinks match (R18.30/R18.31 contract)
- [ ] AC7 — Rule-pair: (a) `package.json` bump + (b) `sw.js` CACHE_NAME bump IF user-facing surface changes (else data-only exempt — expert self-notes per learning #24)
- [ ] AC8 — `npm run build` + full test suite pass; champagne metric `trace:audit:strict` unaffected or improved

## Owners (CMM4 4-role)
- **robbin-req** — capture R18.32 as formal Requirement scenario unit (atomic split per R-H.2); replace planner's placeholder req:uuid with canonical v4
- **robbin-architect** — assess backfill approach (per-type ownerIor heuristics; unitLinks[] initialization + on-disk reconciliation per R18.31 lifecycle methods)
- **robbin-expert** — implement the backfill (script + commit); rule-pair if applicable
- **robbin-tester** — verify 0 violations live; champagne re-run; AC1-AC8

## Subtasks
None (atomic task — single coordinated backfill pass per architect's design).

## QA Audit & User Feedback
- 2026-06-08: Tron verbatim — "I found scenarios without owners and without unitLists [unitLinks]." Captured by robbin-req as R18.32 in compound-requirement-source.md Follow-on H.
- 2026-06-08: Measurement (PO): 184 no-owner (39 missing field + 145 empty/null), 501 missing unitLinks[] of 768 units.
- 2026-06-08: PO directive — stand up task; req capturing, architect assessing; owners expert (backfill) + tester (verify).
- Pending: req-eng formal R18.32 capture → architect refinement → expert impl → tester verify → Tron QA.

---

**Sprint:** Sprint 18 — Chain Method-Scope & Role Skills
**Requirement:** R18.32 (Follow-on H, compound-requirement-source.md)
**Priority:** HIGH — blocks audit cleanliness + R18.30/R18.31 unitLinks lifecycle correctness
