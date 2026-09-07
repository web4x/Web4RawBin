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

- [ ] **(by-construction/ROOT)** Every STANDING RULING (a captured Tron/architect/PO ruling that CONSTRAINS the system) carries a FAILABLE INVARIANT — a registered gate that goes RED when a feature CONTRADICTS it. A ruling with NO failable guard is UNENFORCED (a reminder, not a mechanism) and is flagged. Prose ruling = reminder (overridable invisibly); ruling-as-gate = mechanism.
- [ ] **(framing/trainer)** FRAMING (trainer/ARON, folded into R40.88): a ruling is a COMMITTED TESTABLE INVARIANT — an assertion ON DISK — NOT prose in an anchor. A ruling captured only as anchor/doc prose (no on-disk testable assertion + no registered guard) is NOT an enforced ruling => flagged. Knowing a rule is not the guard; the on-disk testable assertion + its gate is.
- [ ] **(worked-example/CONCRETE)** WORKED EXAMPLE (concrete, not aspirational): the folder!=directory ruling (R40.37, 2026-08-12) carries the guard "a ior:class:Folder unit needs NO physical dir; a mkdir / physical-create for a MODEL Folder (a no-physical-dir parent) trips RED in CI." A later feature re-introducing mkdir-for-a-model-Folder (as R40.78 did, uncaught) trips RED at CI, NOT on Tron screen weeks later. Enforcement = R40.87 routing branch + this lint.
- [ ] **(self-failability/PO-required)** The ruling-guard mechanism ITSELF ships with a RED-proving fixture: seed a ruling-VIOLATION (e.g. mkdir-for-a-model-Folder) and the guard MUST go RED before it counts as wired. A ruling-guard NEVER shown RED on its own violation = unproven = counts as UNGUARDED (it cannot be a gate that certifies nothing). Generalizes R40.54 evidence-must-fail to the RULING level.
- [ ] **(shift-left/the-point)** The contradiction is caught at CI (BUILD-TIME), NOT weeks later on Tron screen. The gate lives in ci:gates. This is the whole point: shift-left from customer-sighting (a recurring Tron report) to CI. A ruling violation reaching a deploy/Tron => the guard was missing or inert => RED.
- [ ] **(single-source/coordinate)** The requirement-side (rulings-are-failable-invariants) and the trainer/ARON DOCTRINE-side are ONE mechanism, NOT two (PO). The ruling-guard follows the SAME glob-discovery PRINCIPLE (no-site-hides-by-being-unlisted) as R40.54 (AcGuard) + R40.55 (boot-currency) — REALIZED PER-GUARD, NOT a literal shared symbol. Architect MEASURED: there is no literal structuralDiscover symbol in the tree; a SELF-NAMING operation (mkdir) needs NO matcher at all — a glob for the named op IS the principle, so there is genuinely no 2nd matcher. Coordinated with ARON: trainer-doctrine + this requirement share the ONE principle + the ONE guard.
- [ ] **(enumerate-not-universal)** The set of standing rulings is DISCOVERED (by a structural marker on ruling-bearing units), NEVER a hand-list; a NEW ruling without a guard => RED (a ruling cannot hide by being unlisted). R40.54/R40.55 lineage.

## Subtasks

None (atomic task).
