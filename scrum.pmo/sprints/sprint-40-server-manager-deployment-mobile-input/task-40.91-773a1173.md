<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.91: Exactly ONE unit-changed->notify translator (single owner) — a 2nd drifted copy is the R40.84-B 4-round defect

[task:uuid:773a1173-e616-4c8e-9224-7fa532340c39]

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

STOOD UP QA Review 2026-09-05 (PO GO). CLOSED end-to-end both keys (PO): translator guard hardened through 3 rounds of independent tester attack, Test on the standing evasion harness. QA-Review — Done pending TRON acceptance. UC full-uuid 089da882-48b1-4a10-8442-683d6e1f9276 disk-resolved from R40.91.useCases[] (NOT fabricated). ACs mirrored no-drift. LOCAL push-freeze, path-limited. req reverse-wires R40.91.tasks[]. 0 Done till Tron.

## Task Description

CLOSED end-to-end both keys (PO): translator guard hardened through 3 rounds of independent tester attack, Test on the standing evasion harness. QA-Review — Done pending TRON acceptance. Covers R40.91 (929a5117), UC 089da882. Minted 2026-09-05 (PO GO — 3rd firefight-skip, PO-owned; planner now dispatched same-breath as req). verify-owner-first: full-index scan confirmed NO prior covering task.

## Context

CLOSED end-to-end both keys (PO): translator guard hardened through 3 rounds of independent tester attack, Test on the standing evasion harness. QA-Review — Done pending TRON acceptance.

## Intention

Board-track R40.91 at its honest status; declare the ONE canonical planning unit (traceability=DRY enforcement).

## Acceptance Criteria

Mirrors R40.91 req ACs (no-drift, disk-resolved UC). NEVER Done till Tron.
- [ ] AC-single-owner-translator: exactly ONE unit-changed -> notify TRANSLATOR (owner = notifyUnitChanged); a 2nd site matching msg.type==='unit-changed' that builds the notify key INLINE (instead of delegating) => RED.
- [ ] AC-measured-counts: named MEASURED counts (zero is a measured number, not an assertion): ownerCount===1 AND inlineNonOwnerTranslators===0; the guard reports BOTH; ownerCount!=1 OR inlineNonOwner!=0 => RED.
- [ ] AC-legit-emits-not-flagged: legit local ViewBus.notify(viewBusKey) emits are NOT flagged — the guard scans the NARROW hazard (an inline notify-key build on a msg.type==='unit-changed' site), not legit emits.
- [ ] AC-selftest-self-bites: FAILABLE via a built-in PER-RUN SELFTEST — injects a synthetic violation + asserts RED each run (self-bites, not just passes-today) + stub-must-fail.
- [ ] AC-scan-the-hazard-not-actors: scan the HAZARD (the inline notify-key-build on a unit-changed site), NOT the actors -> a drifted copy anywhere is UNEVADABLE + self-naming.
- [ ] AC-harden-marker-based-filename-independent: FOLLOW-UP HARDENING (architect flagged, req accepted): the built guard keys the owner by FILE (live-bridge.ts) — a rename makes ownerCount=0 -> RED (fail-closed+safe but noisy); harden to marker-based / filename-independent.

## Subtasks

None (atomic task).
