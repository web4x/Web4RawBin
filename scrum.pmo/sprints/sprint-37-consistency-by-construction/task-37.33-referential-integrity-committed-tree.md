<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.33: Referential-integrity by construction — every committed-tree ref RESOLVES or the carry fails loud + ci-gate (kills the incomplete-carry cause)

[task:uuid:9b140eee-14fe-4276-b7ce-7cbdfccfee83]

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

STOOD UP Planned (P0-A prevention, req R37.29 38aa4fb4). OWNER = EXPERT (ci-gate implementation, like T37.32). The SYMPTOM fix (carry the dangling units) = expert end-to-end, in flight; THIS task = the by-construction CAUSE fix so it can't recur. UC full-uuid 02c03f7e-d694-4b87-8837-39ed7f137441 resolved from R37.29.useCases[] on origin/main (NOT a fabricated suffix). Minted SERVED tree; ⚠ R37.29 38aa4fb4 + UC 02c03f7e main-only -> chain carry is the EXPERT's lane now (fold into their sweep, I do NOT carry). req reverse-wires 38aa4fb4.tasks[].

## Task Description

The REAL P0-A deliverable (owner=EXPERT) — kills the CAUSE, not the symptoms. The incident (R37.1 fail-closed the pin -> empty CurrentSprint -> blocked MVC + Tron iOS verdict) was a SYMPTOM: units minted on main were referenced by served sprint units but never carried to the served tree = dangling refs. The 3-agent parallel carry (5+7+... dangles across sprint-40 AND sprint-37) fixed the symptoms; THIS makes it impossible by construction. Same class as the 47-tasks-invisible (main-only, board referenced them, never carried) — a referential-integrity gate would have caught BOTH. Reuse the existing ScenarioIndex ref-walk + ci:gates harness, NO fork.

## Context

Covers R37.29 38aa4fb4 (referential-integrity, UC 02c03f7e). P0-A prevention (symptom carry = expert end-to-end; this = the by-construction cause-fix). crossRef R37.1 (runtime fail-close = the symptom this gate makes a build-time RED). Owner=expert.

## Intention

A committed tree is referentially COMPLETE or the write fails loud — a ref to an absent unit can never merge/deploy silently.

## Acceptance Criteria

- [ ] **(by-construction)** ANY ref a unit carries (sprint.tasks[], ownerIor, parent, children, coveredRequirements, useCases, class/method/implementations/tests, any chain link) MUST resolve to an existing unit IN THE TREE THE REF IS COMMITTED TO. A ref that resolves only on another branch/tree => RED (referential-integrity violation).
- [ ] **(data-carry/write-side)** The WRITE/CARRY side dual of R37.1 (read fails closed): a cross-branch/cross-tree CARRY is referentially COMPLETE — every ref of every carried unit resolves in the TARGET tree — or it FAILS LOUD. NEVER a silent partial-carry (the 47-tasks-invisible + cross-branch-chain shape). The carry either brings the whole referential closure or reports exactly which refs would dangle.
- [ ] **(ci)** Enforced in ci:gates as part of the trace-audit family: the audit resolves EVERY ref-bearing unit's refs against the committed tree and REDs on any in-tree-unresolvable ref. Report-only-loud first if a baseline of debt exists, strict when the offender count reaches 0 (R40.43 delta-gate precedent).
- [ ] **(enumerate-not-universal)** The ref-bearing unit set + the ref-field set are DISCOVERED by glob/structural scan (every unit, every ref field), NEVER a hand-maintained list — a new unit-type or a new ref field cannot silently escape the guard (a hand-list rots exactly like the artifacts it polices, R40.55 owner-list lesson). A ref-bearing shape present but not evaluated => flagged.
- [ ] **(gate)** STUB-MUST-FAIL (prove-the-prover): plant a dangling ref (a ref to a uuid not in the committed tree) => the guard REDs; remove/weaken the guard => the suite REDs. A referential-integrity guard that cannot go RED on a real dangling ref certifies nothing.
- [ ] **(doctrine)** STATED==IMPLEMENTED: the guard's scope as written (all listed ref kinds, both the data-carry gate AND the ci:gate) equals what the code enforces — no ref kind claimed-covered but unchecked, no gate half stated but not wired. (Guards against the reminder-not-mechanism / false-coverage class.)
- [ ] **(completeness)** The guard REPORTS ALL unresolvable refs in ONE full/fixpoint sweep — it NEVER aborts on the first. A fail-closed error message names only WHERE IT STOPPED, not the full damage: today two agents under-scoped this P0 (they fixed 3 and 5 refs) because they scoped from the error message; the TRUE set was 10, found only by a full sweep. The guard's output is the COMPLETE per-unit set of dangling refs, not the first refusal.
- [ ] **(coverage)** The guard walks the FULL committed corpus including FROZEN sprints (<=18), not only current-era. The expert verified frozen sprints clean today, but a guard that walks only current-era reports a FALSE all-clear when a frozen-sprint ref dangles. Coverage is the whole corpus (discovered-not-hand-listed), frozen included; the coverage count is reported so a narrowed walk is visible, never silent.

## Subtasks

None (atomic task).
