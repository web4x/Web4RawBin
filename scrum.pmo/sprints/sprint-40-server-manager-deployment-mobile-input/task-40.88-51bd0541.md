<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.88: Standing rulings are FAILABLE INVARIANTS — every ruling carries a guard that trips RED when a later feature contradicts it

[task:uuid:51bd0541-e18a-4f6f-838b-f9e11fcc66fa]

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

DRIFT-FIXED Planned -> QA-Review-with-open-CR 2026-09-05 (PO board-resync): I minted it Planned, but R40.88 is chain-complete-to-Test + SATISFIED-at-req-level (890e1fa59, guard hardened through 3 rounds of independent tester attack e2/e3/e4 CLOSED, e1 named residual, Test on the standing evasion harness). ★ RESOLVED 6/6 (updated 2026-09-05, minutes after the 5/6 fix — another stale-by-minutes flip): the Impl marker [impl:uuid:2ba767f2-d1e2-48b8-8d54-8fdd04e97840] is now SEATED at scripts/check-no-mkdir-for-a-model-folder.ts:186 (commit bebb235cb, VERIFIED on disk by me not relayed), req SATISFIED 6/6, implMarkerSeatPending->false. Advanced past QA-Review-with-open-CR to clean QA-Review. ⚠ NOTE: PO said 'keep at 5/6' minutes earlier — the marker seated SINCE; I advanced on the disk-verified 6/6 + FLAGGED PO (surface, not silent-countermand). Done pending TRON only. UC full-uuid 669cd55d disk-resolved. ACs mirrored no-drift. LOCAL push-freeze, path-limited. 0 Done till Tron.

## Task Description

Planned (extends R40.54 to the ruling level; guard flips GREEN on R40.87). Covers R40.88 (b118f2c1), UC 669cd55d. Minted 2026-09-05 (PO GO after the R40.84-firefight coverage gap; planner was skipped, gap now closed). verify-owner-first: full-index scan confirmed NO prior covering task (no double-mint).

## Context

Planned (extends R40.54 to the ruling level; guard flips GREEN on R40.87).

## Intention

Board-track R40.88 at its honest status; declare the ONE canonical planning unit for this requirement (traceability = DRY enforcement).

## Acceptance Criteria

Mirrors R40.88 req ACs (no-drift, disk-resolved UC). NEVER Done till Tron.
- [ ] AC-every-ruling-carries-a-failable-guard: every STANDING RULING (a captured Tron/architect/PO ruling that constrains the system) carries a FAILABLE INVARIANT — a registered gate that goes RED when a feature CONTRADICTS it.
- [ ] AC-ruling-is-a-committed-testable-invariant: a ruling is a COMMITTED TESTABLE INVARIANT (an assertion ON DISK), NOT prose in an anchor/doc.
- [ ] AC-worked-example-folder-not-directory: worked example — the folder!=directory ruling (R40.37) carries the guard 'a ior:class:Folder unit needs NO physical dir; a mkdir / physical-assumption for a model Folder => RED'.
- [ ] AC-guard-own-stub-must-fail: the ruling-guard mechanism ITSELF ships with a RED-proving fixture (seed a ruling-violation e.g. mkdir-for-a-model-Folder -> the guard MUST go RED before it counts as wired).
- [ ] AC-caught-at-CI-not-on-tron-screen: the contradiction is caught at CI (build-time), NOT weeks later on Tron's screen; the gate lives in ci:gates (shift-left from customer-sighting).
- [ ] AC-one-mechanism-with-aron-single-discovery: the requirement-side (rulings-are-failable-invariants) and the trainer/ARON doctrine-side are ONE mechanism, not two (same glob-discovery principle).
- [ ] AC-enumerate-not-universal: the set of standing rulings is DISCOVERED by a structural marker on ruling-bearing units, NEVER a hand-list; a NEW ruling without a guard => RED.

## Subtasks

None (atomic task).
