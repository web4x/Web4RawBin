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

- [ ] **(by-construction/ROOT)** Exactly ONE unit-changed -> notify TRANSLATOR (the owner = notifyUnitChanged). A 2nd site that matches msg.type==="unit-changed" and builds the notify key INLINE (instead of delegating to notifyUnitChanged) => RED. A 2nd drifted copy IS the R40.84-B 4-round defect (the drifted translator diverged).
- [ ] **(measured/PO-required)** NAMED MEASURED COUNTS (zero is a measured number, not an assertion): ownerCount === 1 AND inlineNonOwnerTranslators === 0. The guard reports both counts; ownerCount!=1 OR inlineNonOwnerTranslators!=0 => RED.
- [ ] **(0-noise/scan-narrow)** LEGIT local ViewBus.notify(viewBusKey) emits are NOT flagged — the guard scans the NARROW hazard (an inline notify-key build on a msg.type==="unit-changed" site), NOT legit emits. 0-noise, or it gets switched off. A false-positive on a legit ViewBus.notify => the guard is too broad => fix the scan.
- [ ] **(self-failability/PO-required/R40.88-instance)** FAILABLE via a BUILT-IN PER-RUN SELFTEST: the guard injects a SYNTHETIC violation + asserts RED EACH RUN (self-bites, not just passes-today) + stub-must-fail. A guard that never goes RED on its own injected violation = unproven = counts as UNGUARDED (R40.88 guard-own-stub-must-fail).
- [ ] **(by-construction/R40.82-pattern)** Scan the HAZARD (the inline notify-key-build OPERATION on unit-changed), NOT the actors -> a drifted copy anywhere is UNEVADABLE + self-naming (same pattern as R40.82 children-owner 9ef91a551 + R40.88 no-mkdir). Filename-independent, marker-sanctioned.
- [ ] **(robustness/follow-up)** FOLLOW-UP HARDENING (architect flagged, req accepted): the built guard keys the owner by FILE (live-bridge.ts) — a rename makes ownerCount=0 -> RED (fail-closed + safe, but NOISY on a legit rename). Harden to MARKER-BASED (the [translator-owner:unit-changed] marker seed is placed on notifyUnitChanged) = filename-INDEPENDENT, matching the R40.82 children-owner (9ef91a551) + R40.88 patterns. Then the owner is resolved by the marker, not the filename, and a rename is a no-op. ★ SATISFIED (architect 3e3b17081): the check ALREADY resolves the owner via the [translator-owner:unit-changed] MARKER, not the filename = filename-independent. Follow-up DONE.

## Subtasks

None (atomic task).
