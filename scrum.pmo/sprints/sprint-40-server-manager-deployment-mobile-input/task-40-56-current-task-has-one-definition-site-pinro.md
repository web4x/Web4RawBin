<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.56: Current-task has ONE definition site — pinRo

[task:uuid:80ab1930-488b-4c5c-8fba-f325726a8590]

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

Deliver + verify requirement R40.56 (Current-task has ONE definition site — pinRo). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.56; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(single-source)** ONE definition site for current-task selection: pinRole reads slots.current from the SAME resolver (getThreeSlots) as pin/scoreboard/tree; derivedCurrentTaskUuid (server.ts:1388) is DELETED. pinRole = (slots.current?.uuid === taskUuid) ? 'current' : 'other'.
- [ ] **(single-source)** COMPUTE-ONCE-PASS-DOWN (explicit AC, not a comment): the request computes the pin slots ONCE (slotsFrom) and every current-consumer (pinRole, action-bar, scoreboard, tree) reads THAT single slots.current. slotsFrom/getThreeSlots called TWICE with DIFFERENT inputs (different resolveSprintPin hint / stale currentTaskUuid) is STILL a second source.
- [ ] **(expiry)** pinRole has NO opinion of its own — it MIRRORS slots.current including on expiry. Routing through getThreeSlots inherits EXPLICIT-WINS-WHILE-VALID for free (designation expires at Done/re-designate/gone). Expiry/fallback policy is decided in ONE place (getThreeSlots), pinRole follows.
- [ ] **(fail-closed)** HONEST ABSENCE on expiry/ambiguity: no task tagged current, derivation-fallback ONLY when unambiguous (a single active task); ties/ambiguity -> ABSENCE (fail-closed, R3 instinct), never a silent pick. The silent guess (max-lastAdvancedAt promoted to 'current') is exactly what made this defect invisible — a wrong current that looked authoritative.
- [ ] **(eligibility)** Current-eligibility = {Planned, In-Progress, QA-Review} EVERYWHERE (matches the designation-validity set CurrentSprint.ts:266). The In-Progress-ONLY filter (server.ts:1393) is the invented status-policy Tron retired at T37.26 ('reviewing IS working') — it wrongly excludes QA-Review from ever being current (why T37.24 always shows Set-Current). getThreeSlots' fallback uses the SAME {P/IP/QA} eligibility, not In-Progress-only. ★★ CORRECTED 2026-08-26 (Tron 'status QA means next task', kept visible): QA-Review is NOT current-eligible — it ADVANCES. Current-eligibility = {Planned, In-Progress} (AUTO-DERIVE :277 = {In Progress}; DESIGNATION :301 = {Planned, In-Progress}); QA-Review + band ADVANCE current->next. The earlier {Planned, In-Progress, QA-Review} is REVERSED for QA-Review. See R40.60 AC-qa-review-advances-current.
- [ ] **(by-construction)** THE GATE asserts the HAZARD, not actors: the hazard is 'a function returns a task uuid selected as the current one'. Assert that selection has a SINGLE structurally-nameable definition site — no function body outside the ONE sanctioned accessor loops ior:class:Task + returns a uuid by status/timestamp comparison. '0 such selections outside the accessor' proves single-source in ONE number (same shape as '0 raw insertAdjacentHTML outside the primitive'). REPLACES the retired check-pin-single-source 2-regex ACTOR BLOCKLIST (see metaFinding).
- [ ] **(evidence/RED-baseline)** RED-BASELINE EVIDENCE (HARD, gate-first order): the corrected gate MUST be proven RED on TODAY's unmodified tree (derivedCurrentTaskUuid PRESENT = a live known-positive specimen) BEFORE the fix, raw output recorded on this unit (redBaselineEvidence). If the corrected gate does NOT go RED on today's tree it is STILL WRONG (asserting the wrong property) -> do NOT proceed to the fix. Then delete derivedCurrentTaskUuid + the SAME gate flips GREEN (real red->green on a shipped bug, strictly stronger than a seeded stub). A gate never RED on the real defect proves nothing (R2/R4).

## Subtasks
