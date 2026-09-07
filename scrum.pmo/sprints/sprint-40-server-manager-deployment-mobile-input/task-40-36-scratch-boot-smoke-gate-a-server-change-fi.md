<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.36: Scratch boot-smoke gate — a server change fi

[task:uuid:902c6dea-4e45-4e94-80d9-872a95ee1547]

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

Deliver + verify requirement R40.36 (Scratch boot-smoke gate — a server change fi). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.36; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(functional)** The gate boots the REAL server (not a mock) against a SCRATCH config: random high port + scratch data dir + hard TIMEOUT; asserts /api/config responds within N seconds = module-top boot succeeded. A crash-LOOP never answers -> the timeout catches it. FAIL-CLOSED: no answer within the timeout = RED.
- [ ] **(gate)** ★ LOAD-BEARING: the gate fires on the LANDING FORM — triggered by ANY change to src/ts/server (pre-commit + CI), so a BUILD-NOT-DEPLOY landing CANNOT bypass it. Mechanize against the FORM (a server-file change), NOT the intent (a 'deploy'). The disguise pattern (build-not-deploy does not look like a deploy) is exactly why the pre-existing 'server change needs a boot-check' rule did not fire.
- [ ] **(functional)** It is a FULL BOOT integration check, NOT a unit test — the actual failure was INTEGRATION behaviour (startServers retry double-binding :4000); a unit test of bootstrapSeed would have PASSED. The gate exercises the whole module-top boot path end-to-end, not a function.
- [ ] **(gate)** Isolated per R40.31: scratch store BY-CONSTRUCTION, NO prod mutation (never data/users or a real room), cleanup-that-survives-failure/timeout/crash. The smoke gate can NEVER damage prod while running (R40.31 pollution-safety).
- [ ] **(gate)** STUB-MUST-FAIL: plant a module-top throw (or a crash-loop) -> the smoke goes RED; a clean boot -> GREEN; weaken/remove the gate -> the bite suite goes RED (meta-bite). A boot-check that cannot fail certifies nothing.
- [ ] **(framing)** The requirement RECORDS WHY: the 8-minute prod outage on the R40.18 restart (parked B1 owner-safety code that had never booted; first boot = an unrelated deploy; module-top/startServers integration failure) — so the rationale is durable and the gate is never removed as 'unexplained'. B1 stays PARKED (this is a boot-safety gate, not the security work).

## Subtasks
