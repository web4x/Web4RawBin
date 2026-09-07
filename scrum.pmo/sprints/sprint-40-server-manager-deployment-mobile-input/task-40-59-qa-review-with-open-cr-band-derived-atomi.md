<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.59: QA-Review-with-open-CR band — derived, atomi

[task:uuid:146e4444-e8e6-467b-8602-fe9362f2a66c]

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

Deliver + verify requirement R40.59 (QA-Review-with-open-CR band — derived, atomi). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.59; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(atomic/RED-baseline/load-bearing)** ATOMIC LANDING (load-bearing): the band-derivation and the QA-Review-unticking land in ONE atomic change. There is NO committed state (no intermediate commit, no half-deploy) in which the untick behavior is live but the band is NOT derived — that state derives In-Progress = Tron's forbidden regress. deriveStatusEnum's new band + the untick ship together or not at all. ★ The GATE must CATCH untick-without-band: assert that unticking-QA-without-the-band DERIVES In-Progress (the forbidden regress) -> the gate REDs on it = proof atomicity is ENFORCED not hoped. RED baseline written into this AC.
- [ ] **(derived/single-writer)** DERIVED, not stored/hand-stamped: the band is DERIVED by deriveStatusEnum from (QA-Review checklist state + an OPEN-CR signal), never a stored status field. The open-CR signal is a DERIVABLE input (the processing-CR sub-step / CR 7286d45a state), so the band is single-sourced through deriveStatusEnum. No stored band copy anywhere (consistent with the derived-status single-writer, CR 461d5db6).
- [ ] **(current-able/one-place)** CURRENT-ABLE: the band joins the current-eligible set {Planned, In-Progress, QA-Review, QA-Review-with-open-CR} in the ONE existing place (getThreeSlots eligibility, CurrentSprint.ts) — never a second list. A task in the band can be the designated current. Ties to the current-role path (R40.56/57/58): eligibility is defined in ONE place; the band is added THERE. ★★ SUPERSEDED-IN-PART 2026-08-26 (Tron 'status QA means next task', architect 58c4cdc39): the band is NOT current-able. This AC's 'band joins the current-eligible set' clause is REVERSED — a task at QA-Review OR band ADVANCES (current->next). New current-eligibility = {Planned, In-Progress} only. The band's roles reduce to track-unapproved-CRs + gate-Done (see R40.60 AC-qa-review-advances-current). Kept visible: original said the band was current-able.
- [ ] **(by-construction/single-source)** SINGLE-SOURCE: one enum, one derivation — deriveStatusEnum is the ONLY producer of the band; ZERO band-derivations outside deriveStatusEnum. STATUS_ORDER (task-status-constants) + deriveStatusEnum (task-status.ts:20) extend to the band single-source, no parallel band-derivation elsewhere. Hazard-scan (0 band-derivations outside deriveStatusEnum), same shape as the current-role single-source guards.

## Subtasks
