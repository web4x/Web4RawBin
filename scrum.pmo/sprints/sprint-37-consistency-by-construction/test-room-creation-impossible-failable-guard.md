<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Test-room creation is IMPOSSIBLE by construction — a FAILABLE guard asserts ZERO room/identity creations by test code outside the ONE recorded SystemTester room; + scoped-cleanup guard (never re-persist a bystander)

[task:uuid:24284f6d-57eb-49cc-91d4-847ece5306ec]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

STOOD UP Planned + ranked TOP (Tron third-time mandatory, 2026-09-09). ★ OPEN DEBT (visible, not implied, per PO): the TESTER is purging the lobby of test rooms BY DISCIPLINE right NOW because this guard does NOT exist yet — a manual cleanup running AHEAD of its guard is exactly the state that bit us on 09-07 (the cleanup that re-persisted bystanders and corrupted 4 names / 9 createdAt). This row makes that debt explicit until the guard lands. ★ CLEANUP ACCEPTANCE (board THIS, not the deletion count): tester reports its ENUMERATION to PO first, THEN the deletion, THEN a RE-VERIFICATION that the 6 REAL rooms are untouched (names, createdAt, member counts) = the acceptance. ★ NO HAND-DELETION of canonical units (PO #96.13). ★ AC strings project from req 80ca8e83 once strengthened; owner=expert(build)+tester(gate). Minted SERVED tree; flagged req to strengthen 80ca8e83 + reverse-wire.

## Task Description

★★ TRON 2026-09-09, THIRD verbal correction on test-room spam ('the whole lobby is spammed by test rooms... create ONE test room and do ALL tests there!!!! remove all test rooms!!!'). The honour system has FAILED THREE TIMES => the guard is MANDATORY WORK, ranked TOP of the build queue (above the R40.106 link/remove/move/delete increments) per PO. [[scan-the-hazard-not-the-actors]]: the guard scans the dangerous OPERATION (room/identity CREATION by test code), not the actors — it COUNTS creations and asserts ZERO outside the ONE fixed SystemTester room whose uuid is RECORDED; stub-must-fail (add a creation -> RED). PLUS the scoped-cleanup guard (architect #3): a cleanup must NEVER re-persist a bystander room — STRUCTURAL, not instructional (my/PO's cleanup ORDER caused the 09-07 name/createdAt corruption precisely by re-persisting bystanders). Owner = EXPERT (build the guard) + TESTER (gate it + own the failable lint). Supersedes the honour-adjacent isolated-DATA-DIR approach (T100 59c964f9) — 'make it impossible by construction' is exactly S37 Consistency-by-Construction (CMM4 guard, not CMM2 vigilance).

## Context

Covers req 80ca8e83 (proper fix for room-flood; req STRENGTHENING 2026-09-09 with Tron's guard ACs — re-point if req mints new). crossRef T100 (data-dir = superseded honour-approach). Gate-integrity family (kin: R37.3 fail-loud guard, R37.34 axis-lints). Ranked TOP by PO on Tron's third-time-mandatory.

## Intention

Make test-room creation UNCONSTRUCTABLE outside the one recorded room, and cleanup structurally unable to re-persist a bystander — so 'make sure it never happens again' is enforced by a failable gate, not by remembering.

## Subtasks

None yet (architect may split guard vs scoped-cleanup-guard at design).
