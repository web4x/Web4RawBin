<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.15: Store-once theme-only names — a stored n

[task:uuid:c18c2efb-7306-4e5b-83ce-9fb9be7988d0]

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

Deliver + verify requirement R37.15 (Store-once theme-only names — a stored n). Retroactive task unit minted scenario-first from the existing CURRENT-sprint requirement (#126 gap: active S37 work untracked). Covers R37.15; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(functional)** A unit's stored name contains ONLY the theme, never a DERIVED field: a name embedding its own sprint number (e.g. a 'Sprint N:' prefix that model.number already carries) or any other derived/echoed field is FORBIDDEN. Store-once: a value derived elsewhere is never duplicated in free-text where it can drift.
- [ ] **(gate)** A lint/guard REFUSES (RED) a stored name that embeds its own sprint number or any derived field, folded into ci:gates — double-numbering becomes IMPOSSIBLE by construction, not merely restorable.
- [ ] **(gate)** The guard is PROVEN non-vacuous by a STUB-MUST-FAIL bite: plant a 'Sprint 37:'-prefixed sprint name -> RED naming it; a clean theme-only name -> GREEN; weaken/remove the guard -> the bite suite goes RED (meta-bite).
- [ ] **(functional)** A one-time SWEEP detects + repairs existing embedded-number names across ALL sprint units (the 3 known: S34, S01-S09 legacy, S37 b86b53cc + any others found), restoring each to theme-only. Idempotent, dry-run + count reported FIRST, verify-owner-first per unit (name field ONLY, never the number/derived source).
- [ ] **(by-construction)** BY-CONSTRUCTION: after the guard the embedded-number drift class CANNOT recur — the 3rd manual repair is the last. Per the -a1b2 precedent (kill the collision generator, not guard its output) and the fleet doctrine that a 3x-repaired defect is a missing guard, not bad luck.

## Subtasks
