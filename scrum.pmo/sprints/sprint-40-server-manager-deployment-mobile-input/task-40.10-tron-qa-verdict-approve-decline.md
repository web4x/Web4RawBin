<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.10: Tron renders his QA verdict FROM the task — Approve (records verdict + flips Done-gate) / Decline (mints a ChangeRequest)

[task:uuid:9a70ce5e-7e88-45f9-b921-0f8e9caf07a6]

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

RELEASED from held / SIGNABLE (PO 2026-08-12, verified on ORIGIN both-dir): R40.10 is chain-complete-to-Test via its OWN approve-facet Test d94b17e0 'TaskQaVerdict.approveByOwner' (measured-from-gate r4010-qa-verdict-gate.ts:25 per PO path-A) — fwd 36b6ce2e.tests[]=[d94b17e0], rev d94b17e0.implementations[]=[36b6ce2e] ownerIor=36b6ce2e, status=pass, Impl markerPending=false, gate GREEN DET-3x symbol-anchored to the C4.3 delegated contract. Explicitly NOT 67697d86 (r4010c BUG-A Test, different facet = would have been borrowed credit). Clean first-Test on previously-empty tests[], no cross-wire -> SIGNABLE. ---QA-Review (planner flip 2026-08-11, PO-authorized + VERIFY-OWNER-FIRST PASSED on disk). Chain verified: R40.10 33451271 -> UC taskDetail.renderChangeRequests -> Impl e080ef45 (markerPending=false) <-> Test 67697d86 'test:R40.10 BUG-A CR-section reachable/decline' status=pass two-keyed = R40.10's OWN distinct-intent Test (NOT a cross-credit; both Impls e080ef45 + 36b6ce2e sharedByTasks=[9a70ce5e ONLY]). Approve path Impl 36b6ce2e (approveByOwner owner-gate) markerPending=false, device-verified (r4010 gate GREEN @390, POST /approve 403 token-less, approve records approvedBy/approvedAt + reaches Done end-to-end). 5 AUTOMATABLE ACs proven (shipped markers + distinct Test + gate); AC-6 DEVICE @390 [ ] = Tron taps Approve/Decline on his device (go-live). Awaiting Tron QA verdict. 0 Done till Tron.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.10 `[requirement:uuid:33451271-29db-4e54-acaa-d0d9f59c04ad]`
  - down
    - None (atomic task)

## Task Description

R40.10 (Tron: 'for the tasks on QA add an approve by Tron action then you do not need to remind me ... also add an action decline QA, that results in a scenario-first change request unit'). A task at QA-Review carries TWO owner-only action units: APPROVE BY TRON (records approvedBy+approvedAt as DATA on the unit -> Done-gate flips; makes 'Done requires Tron QA' PROVABLE not remembered) and DECLINE QA (mints an ior:class:ChangeRequest unit capturing the reason, LINKED to the declined task/requirement, entering the board as real work). Removes the PO from the loop: no reminder pings, no batch markdown. Applies to ANY task at QA-Review (incl the S37 twelve unsigned) -> obsoletes tron-qa-batch.md + reminders. ★ Approve AND Decline ship TOGETHER (approve-without-decline pushes Tron back to prose = the thing being removed). Reuse R40.5 universalActionBar + existing ChangeRequest kind, NO fork. Scenario-first: req mints R40.10 + ACs; architect designs; expert implements; tester gates.

## Acceptance Criteria

- [x] [AUTOMATABLE, data] APPROVE fires on a QA-Review task, records approvedBy + approvedAt as DATA on the unit (so 'Done requires Tron QA' is PROVABLE from the record, not remembered), and flips the Done-gate.
- [x] [AUTOMATABLE, graph] DECLINE mints an ior:class:ChangeRequest unit (REUSE the EXISTING kind — registered templates.ts:370 + in CHAIN_TYPES; NOT a new kind) capturing the reason, LINKED to the declined task/requirement, entering the board as real work — a UNIT, not a comment that gets lost.
- [x] [AUTOMATABLE, 403] OWNER-GATED: only the owner may render a verdict; a non-owner approve/decline is 403. This gate IS the integrity of 'Done requires Tron QA' — if anyone can self-approve, the law is decorative.
- [x] [AUTOMATABLE, fail-closed] EVIDENCE PRECONDITION: the actions are available ONLY on tasks genuinely at QA-Review WITH their evidence present — approving can NEVER manufacture a Done on a task that is not chain-complete. Approval is a human judgement ON TOP of verified evidence, never a substitute for it.
- [x] [AUTOMATABLE, source] Both actions are ACTION UNITS on the R40.5 universalActionBar mechanism — NOT two hand-placed bespoke buttons (that would commit R40.5's exact defect while fixing it).
- [ ] [DEVICE @390 - Tron] The visual firing (Tron taps Approve / Decline on his device) is Tron device-verification.

## Subtasks

None (atomic task).
