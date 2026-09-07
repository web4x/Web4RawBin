<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.60: Change Requests are first-class traceability

[task:uuid:658c05fe-6c52-41a9-889b-2bfa56dd9f77]

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

Deliver + verify requirement R40.60 (Change Requests are first-class traceability). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.60; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(structure/render)** A CR is an ior:class:ChangeRequest UNIT that is a TRACEABILITY CHILD of the TASK: ownerIor -> Task (mirrors how a Requirement parents), rendered in the Traceability Chain / All Children with the SAME shape as a Requirement. ★ PARENT RULED (architect 1345a7564): parent = TASK per Tron's ruling (NOT #86's ownerIor->Test); contestsTest is kept as a crossRef (the CR contests a Test, but its traceability PARENT is the Task). RETIRE the m.changeRequests STRING array + the separate 'Change Requests' list render.
- [ ] **(approval/per-CR)** Each CR carries its OWN approval state (approvedBy + approvedAt PER CR), approved INDIVIDUALLY. No shared/bulk state. A CR is either individually-approved or not-yet-approved, tracked on the CR unit itself.
- [ ] **(approval/no-bulk/RETIRE)** NO bulk accept-all: the '✓ Resolve CRs' bulk action (resolveCr, server.ts:1658 — one processing-CR sub-step tick for the whole task) is RETIRED / MUST NOT exist. Approval is PER-CR only — the owner approves EACH CR individually AT the task. Tron: 'There is no accept-all-CR.' ★ RETIRE resolveCr (task-policy.ts:99-104 + server.ts:1658) — the per-CR approve REPLACES it, no one-step clear (architect 1345a7564).
- [ ] **(band/by-construction)** The band is RE-SOURCED to a SINGLE definition site: ONE deriveTaskStatus(task, crChildren) that composes deriveStatusEnum(checklist) + hasUnapprovedCr (mirrors rollupParentStatus's single-site) — every consumer reads it. The band = QA-Review-with-open-CR iff ANY CR child is not-yet-approved; clears iff EVERY CR is individually approved (NEVER one tick). Done gated zero-unapproved. ★ RETIRE hasOpenCrSubstep + PROCESSING_CR_SUBSTEP as the band source (R40.59). ★ CORRECTED (Tron 'status QA means next task', architect owns #86-4 reversal, design 58c4cdc39): the band's ONLY roles are (1) track CRs awaiting the owner's per-CR approval + (2) gate Done (band NOT-IN APPROVE_STATUSES => Done-with-open-CR impossible). The band is NOT current-able (SUPERSEDES the earlier R40.59/R40.60 'band is current-able' clause). Band still DERIVES via deriveTaskStatus for CR-approval tracking, but never holds current.
- [ ] **(owner-gated/his-judgment)** Each per-CR approve is OWNER-GATED and attributable to Tron (his profile-unit uuid, non-credential — the R40.10 discipline applied PER CR); it is genuinely HIS QA judgment at the task, never team-performed nor self-certified. (Contrast: closure MECHANICS the team may perform; a CR APPROVAL is his verdict.)
- [ ] **(migration)** The 5 existing T40.1 CRs (4babebb1 #86-1 / 7286d45a #86-2 / c27ae455 #86-3 / 18ebe066 #86-4 / 461d5db6 #86-5) are re-modeled as traceability children of T40.1 with per-CR approval state (gated migration; no CR lost; each becomes individually-approvable). Their current separate-list + Test-parentage is reconciled to the traceability-child shape (architect rules exact parentage: traceability child of the TASK per this ruling; contestsTest may remain a crossRef).
- [ ] **(decline/by-construction)** A DECLINE mints a CR CHILD (unapproved) on the task -> the band DERIVES from it (via deriveTaskStatus). Cleaner than #86's untick-QA + tick-sub-step ATOMIC PAIR: there is no checklist untick/tick to keep atomic — the band is a pure derivation of the CR children's approval states.
- [ ] **(current-eligibility/Tron-corrected)** ★ CURRENT-ELIGIBILITY = {Planned, In-Progress} ONLY (Tron 'status QA means next task', architect 58c4cdc39). A task at QA-Review OR 'QA-Review-with-open-CR' (band) ADVANCES -> current moves to the next in-sprint task; nextBacklog recalcs. Code fold (into R40.60 build): CurrentSprint.ts:277 auto-derive DROPS the band -> {In Progress}; :301 designation-valid EXPIRES at QA-Review AND band (not just Done + clean-QA). SUPERSEDES the earlier auto-derived {In Progress, band} + designation-eligible {P/IP/band/QA} — QA-Review + band are NOT current-eligible on EITHER axis. ★ TWO AXES EXPLICIT (architect confirmed): AUTO-DERIVE(:277) = {In Progress} (band dropped); DESIGNATION(:301) = {Planned, In-Progress} (named allowlist, expires at QA-Review AND band). This SUBSUMES L-S40o (:296 Superseded/Cancelled leak) — the named {Planned,In-Progress} allowlist excludes dead statuses by construction, so L-S40o folds INTO this R40.60 :301 change (no longer separate).

## Subtasks
