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

- [ ] RESOLVE-IN-COMMITTED-TREE: every unit ref (Sprint.tasks[]/requirements[], Task.coveredRequirements/useCases, chain refs) RESOLVES within the SAME committed tree; a ref to a unit absent on that tree is a referential-integrity violation (R37.1's runtime fail-close made a build-time check).
- [ ] DATA-CARRY COMPLETE-OR-FAIL-LOUD: a cross-tree carry brings the COMPLETE closure (unit + all transitively-referenced units) or FAILS LOUD — never a partial carry that leaves dangling refs (the incomplete-carry cause).
- [ ] CI-GATE: a ci:gates check enforces referential integrity on the served/committed tree — RED on any unresolvable ref, so an incomplete carry cannot merge/deploy silently (would have caught the 47-tasks-invisible + the 5+7 sprint dangles).
- [ ] DISCOVERED-NOT-HAND-LISTED: the gate DISCOVERS all refs structurally by walking the units (never a hand-maintained ref-type/sprint list) — a new ref-type or sprint is covered by construction.
- [ ] STUB-MUST-FAIL: proven NON-VACUOUS — a planted dangling ref -> RED (bite).
- [ ] STATED==IMPLEMENTED: the gate's stated scope EQUALS what it actually checks (no gap between the AC claim and the enforced check).
- [ ] REPORT-ALL-NOT-ABORT-ON-FIRST (architect d443674de): the gate reports EVERY unresolvable ref in ONE pass, never aborts on the first — so all dangles are fixed in a single carry, not discovered iteratively. This incident's exact friction: R37.1 aborts on the FIRST hit -> 3 agents fixed different partial scopes (me sprint-40, expert sprint-37+, architect); the gate MUST enumerate the FULL dangle set [[enumerate-full-dangle-set-not-just-first-failclose-hit]].

## Subtasks

None (atomic task).
