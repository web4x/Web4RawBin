<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.31: Gates cannot pollute production — isolated s

[task:uuid:ede07b67-4c22-4626-8cea-b4ca9a722753]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.31 (Gates cannot pollute production — isolated s). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.31; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(isolation)** A gate targets an ISOLATED store BY CONSTRUCTION — scratch registry / temp key / dry-run — so mutating PRODUCTION is IMPOSSIBLE, not merely cleaned-up-after. The gate CANNOT reach the live store (routing PROVEN, not asserted: prove the write lands in scratch, not prod — a no-op PUT is not read-only if the server normalizes).
- [ ] **(cleanup)** Cleanup runs even on FAILURE / TIMEOUT / crash-mid-gate — NOT happy-path-only. An EXTERNAL post-run cleanup (finally / trap / harness-level) guarantees no residue survives an abort; a gate that half-writes then times out leaves ZERO prod residue.
- [ ] **(bite)** A BITE PROVES a gate cannot touch prod state (STUB-MUST-FAIL): attempt a prod-write from inside the gate -> REFUSED / routed-to-scratch (RED if it reaches prod); AND a stub gate that DOES touch prod -> the bite turns RED (proving the bite would catch a regression, not vacuously pass).
- [ ] **(offender)** NAMED OFFENDER (no-silent-caps): r3043-uc4addlocal (registered 2 repos in the LIVE registry) is BLOCKED from re-run until isolated; its fix = target a scratch registry / temp key + cleanup-on-failure. Tracked, not silently dropped; unblocked only once isolated + bited.
- [ ] **(isolation)** A Test/gate that appears to NEED a production write is REDESIGNED to dry-run / scratch — NEVER sanctioned as a real prod mutation ('the test needs it' is not a license to mutate prod).
- [ ] **(verify)** VERIFIED: a full gate run leaves the live store BYTE-IDENTICAL before==after (git clean-check / live-registry-count unchanged), INCLUDING on an injected mid-gate failure/timeout. The isolation + cleanup are gate-proven, not asserted.

## Subtasks
