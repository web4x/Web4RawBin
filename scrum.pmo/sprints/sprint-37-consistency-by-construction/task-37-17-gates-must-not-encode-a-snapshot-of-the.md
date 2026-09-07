<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.17: Gates must not encode a SNAPSHOT of the 

[task:uuid:9cb80055-d0e6-448e-87fa-0f41fd2c483a]

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

Deliver + verify requirement R37.17 (Gates must not encode a SNAPSHOT of the ). Retroactive task unit minted scenario-first from the existing CURRENT-sprint requirement (#126 gap: active S37 work untracked). Covers R37.17; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(gate)** Gates SYMBOL-ANCHOR only — slice a NAMED fn body / anchor on a declaration — NEVER a line-range slice or hardcoded line number. LINT-ENFORCED: a line-pin in gate code -> RED (r408's server.ts slice(1439,1446) is the offender; r4010's fix already dogfoods symbol-anchoring). STUB-MUST-FAIL: plant a line-pin in a gate -> the lint goes RED, else it certifies nothing.
- [ ] **(gate)** Fixtures must satisfy the product's CURRENT contract; PREFER REAL artifacts over synthetic. A synthetic fixture that no longer qualifies under a hardened/churned contract (rc3 synthetic single-Active sprint vs resolveSprintPin real-dir fail-closed; r309 same class) is a STALE GATE, not a broken product — the gate must not read pass on a fixture the current product would reject. Where synthetic is unavoidable it MUST be constructed to satisfy the current contract. STUB-MUST-FAIL: feed a fixture that violates the current contract -> the gate catches it (does not silently pass). [rc3 REAL cause corrected: not dir-resolution but OUR era-boundary change (frozen-legacy FROZEN_LEGACY_MAX=18) invalidating the synthetic sprint-2 — a fixture must satisfy the CURRENT scope/era universe, not a past one.]
- [ ] **(gate)** NEVER assert an ABSOLUTE COUNT of a TRANSIENT population (e.g. 'there are 98 gaps') — a count of something we are actively shrinking treats SUCCESS as regression. Instead assert an ID-SET + a DOWN-ONLY RATCHET: these specific IDs must not GROW, and any that CLOSE stay closed. That survives our own progress; an absolute count cannot. (rc7 hardcoded ~98 S18 gaps -> ~0 after completion -> false RED.) The sharpest form of the fixtures-current-contract guard. STUB-MUST-FAIL: shrink the population (close a tracked ID) -> the gate must STAY GREEN (progress != regression); GROW it (a new/reopened ID) -> RED.
- [ ] **(gate)** ★ EVERY gate is LOAD-CHECKED and RUN so an un-loadable or never-run gate CANNOT sit marked-pass — the structural fix for the ENTIRE stale-pass class (rc7: SyntaxError from a removed import verified NOTHING while its Test read status:pass until a manual audit). STUB-MUST-FAIL: plant an un-loadable gate (bad import/syntax) OR a never-run gate -> the load/run check goes RED and its Test cannot read pass.
- [ ] **(meta)** Each guard AC carries a STUB-MUST-FAIL arm or it certifies nothing (a guard that cannot fail proves nothing) — the meta-bite discipline shared with R37.13/R37.15/R37.16 + R37.3's gate-proves-the-gate-prover.
- [ ] **(context)** EVIDENCE-BACKED by 6 measured rot sub-mechanisms (see rotTaxonomy): (1) line-pin churn [r408] / (2->4) rc3 ASSUMED hardening but REAL cause = our era-boundary frozen-legacy exclusion / (3) our C4.3 delegation contract change [r4010] / (5) our SUCCESS closed the gaps a gate counted [rc7 98->0] / (6) API rename+removed export [rc7]. ★ 4 OF 6 were caused by US IMPROVING the product => snapshot-gates rot FASTEST when we do good work — a demonstrated cause, not a speculative one, and the reason the guard is worth building.

## Subtasks
