<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.10: Tron renders his QA verdict FROM the task — Approve (records verdict + flips Done-gate) / Decline (mints a ChangeRequest)

[task:uuid:9a70ce5e-7e88-45f9-b921-0f8e9caf07a6]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned - S40 R40.10 (Tron Approve/Decline QA-verdict FROM the task; obsoletes tron-qa-batch.md + reminders). Scenario-first: req minted R40.10 33451271 (4c57b99d7); coveredRequirements + useCases 0a3e3653 wired; ACs MIRRORED (5 AUTOMATABLE + 1 DEVICE @390 Tron). ★ Approve+Decline SHIP TOGETHER (shipTogetherNote). Reuse R40.5 universalActionBar + existing ChangeRequest kind. Architect designs the chain. No build until build-go.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.10 `[requirement:uuid:33451271-29db-4e54-acaa-d0d9f59c04ad]`
  - down
    - None (atomic task)

## Task Description

R40.10 (Tron: 'for the tasks on QA add an approve by Tron action then you do not need to remind me ... also add an action decline QA, that results in a scenario-first change request unit'). A task at QA-Review carries TWO owner-only action units: APPROVE BY TRON (records approvedBy+approvedAt as DATA on the unit -> Done-gate flips; makes 'Done requires Tron QA' PROVABLE not remembered) and DECLINE QA (mints an ior:class:ChangeRequest unit capturing the reason, LINKED to the declined task/requirement, entering the board as real work). Removes the PO from the loop: no reminder pings, no batch markdown. Applies to ANY task at QA-Review (incl the S37 twelve unsigned) -> obsoletes tron-qa-batch.md + reminders. ★ Approve AND Decline ship TOGETHER (approve-without-decline pushes Tron back to prose = the thing being removed). Reuse R40.5 universalActionBar + existing ChangeRequest kind, NO fork. Scenario-first: req mints R40.10 + ACs; architect designs; expert implements; tester gates.

## Acceptance Criteria

- [ ] [AUTOMATABLE, data] APPROVE fires on a QA-Review task, records approvedBy + approvedAt as DATA on the unit (so 'Done requires Tron QA' is PROVABLE from the record, not remembered), and flips the Done-gate.
- [ ] [AUTOMATABLE, graph] DECLINE mints an ior:class:ChangeRequest unit (REUSE the EXISTING kind — registered templates.ts:370 + in CHAIN_TYPES; NOT a new kind) capturing the reason, LINKED to the declined task/requirement, entering the board as real work — a UNIT, not a comment that gets lost.
- [ ] [AUTOMATABLE, 403] OWNER-GATED: only the owner may render a verdict; a non-owner approve/decline is 403. This gate IS the integrity of 'Done requires Tron QA' — if anyone can self-approve, the law is decorative.
- [ ] [AUTOMATABLE, fail-closed] EVIDENCE PRECONDITION: the actions are available ONLY on tasks genuinely at QA-Review WITH their evidence present — approving can NEVER manufacture a Done on a task that is not chain-complete. Approval is a human judgement ON TOP of verified evidence, never a substitute for it.
- [ ] [AUTOMATABLE, source] Both actions are ACTION UNITS on the R40.5 universalActionBar mechanism — NOT two hand-placed bespoke buttons (that would commit R40.5's exact defect while fixing it).
- [ ] [DEVICE @390 - Tron] The visual firing (Tron taps Approve / Decline on his device) is Tron device-verification.

## Subtasks

None (atomic task).
