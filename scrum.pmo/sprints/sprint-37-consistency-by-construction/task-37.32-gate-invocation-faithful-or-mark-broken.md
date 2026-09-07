<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.32: Gate-harness invokes faithfully or marks BROKEN — fix the 2 null-invoke gates + mark-not-silence + counted known-broken (owner: expert)

[task:uuid:b43278f7-191a-4449-9e49-7bb4bd14a6d9]

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

STOOD UP Planned (PO disposition 2026-08-30) on req's R37.28 9d70d9dd. OWNER = EXPERT (measured + holds the spawn-cwd/parse root hypothesis). PRIORITY below Tron-iOS (T37.31) + PhaseA-gate. ★ INTERIM mark-not-silence flagged to expert NOW (suite honesty can't wait for the full fix) — gates keep running with a KNOWN-BROKEN-INVOCATION marker naming T37.32 (b43278f7), NEVER removed. Planned floor = fix not yet committed; advances when expert commits the interim marking / spawn fix. UC full-uuid 12d58b12-8972-456a-99e4-ff74616a5d91 resolved from R37.28.useCases[] on origin/main (NOT a fabricated suffix). Minted SERVED tree for Tron visibility; ⚠ R37.28 9d70d9dd + UC main-only -> flag expert carry to served. Findings: scrum.pmo/reports/gate-invocation-null-findings-2026-08-30.md.

## Task Description

Gate-integrity infra (owner=EXPERT — measured it + holds the root hypothesis). Two revived gates (R37.26 repoint) RUN but return NULL on a spawned-tool call = 'can EXECUTE but cannot INVOKE', one layer up from the 22 inert gates: r241-objectverb-gate (scoreboard=null; but `objectVerb Chain scoreboard` runs GREEN standalone = 537 reqs full table => the GATE INVOCATION nulls, not the tool) + r245-s24-tooling-gate (T24.4 generate-md=null, T24.5 audit.strict=false). SUSPECTED ROOT (expert): stale subprocess cwd / output-parse in the gate SPAWN (the gate shells out with an assumption that broke). NOT a repoint regression: scenario/index reads work, the tools work standalone, 3 sibling gates (r217/r218/r218b) repointed GREEN. Findings: scrum.pmo/reports/gate-invocation-null-findings-2026-08-30.md. Reuse the existing gate harness, NO fork. PRIORITY: BELOW Tron's iOS land (T37.31) + the 4-component Phase-A gate — infrastructure yields to his open complaint.

## Context

Covers R37.28 9d70d9dd (gateHarness.invokeFaithfullyOrMarkBroken, UC 12d58b12). NEW gate-INTEGRITY family (R37.17 no-snapshot / R37.18 gate-resolves-same-as-runtime = distinct props; this = invocation-mechanics). crossRef R37.17/R37.18/R37.25/R40.54. Owner=expert (PO disposition 2026-08-30).

## Intention

A gate either INVOKES its tool faithfully, or it is explicitly MARKED known-broken (never silently null, never removed). Status explained, never status hidden.

## Acceptance Criteria

- [ ] **(fix)** Fix the gate SPAWN so a spawned-tool invocation returns the tool's REAL result — resolve the stale subprocess cwd + the output-parse that produced NULL. After the fix, r241-objectverb returns the real scoreboard (~537 reqs) and r245-s24 returns real T24.4/T24.5 results, matching standalone.
- [ ] **(by-construction)** INTERIM: a gate with a known-broken invocation STAYS in ci:gates and RUNS, carrying a KNOWN-BROKEN-INVOCATION marker that NAMES this task (status EXPLAINED, not hidden). It is NEVER removed or disabled — removing/disabling a gate to make the suite green is the check:task-status silent-deletion mistake (a deleted gate certifies nothing + hides the hole).
- [ ] **(meta/coverage-self-report)** The suite EMITS 'N gates / M known-broken (listed by name)' every run, and the M set can ONLY SHRINK (a known-broken marker is removed only by FIXING the gate, never by hiding it). A marker set that grows silently, or a known-broken gate absent from the emitted list, => RED (else the marker becomes a quiet dumping ground = decay). Same shape as R37.25 AC-coverage-self-report.
- [ ] **(armB/positive-control)** The diagnosis is EVIDENCED, not assumed: the tools are GREEN STANDALONE (positive control = the instrument CAN succeed) AND the repoint siblings (r217/r218/r218b) are GREEN => the suspect is the SPAWN invocation, NOT the tools and NOT a repoint regression. A gate's NULL is validated against the tool's standalone result before it is trusted as pass-or-fail (R37.25 Arm-B: a result asserted from a broken instrument is inadmissible).

## Subtasks

None (atomic task).
