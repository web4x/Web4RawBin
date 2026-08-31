<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.28.4: req-satisfaction freshness guard — DERIVE satisfied from a tracked covering task, never a stored flag

[task:uuid:2af98c11-cb0d-439c-a294-1ea0d3402d62]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Parent [Task 37.28](./task-37-28-truth-decay-freshness-family.md) `[task:uuid:61718883-195a-4bd4-bbc9-ead8ecff8412]`
    - Requirement R37.25 `[requirement:uuid:fcc34aa1-84da-438c-942f-1c2c27efe61a]`
  - down
    - None (leaf subtask)

## Task Description

Per-class freshness guard for the req-satisfaction artifact-class (R37.25 truth-decay / no-freshness-invariant family; architect design ior:file:scrum.pmo/design-notes/design-truth-decay-freshness-invariant-family.md?commit=e31458f92). CURE = derive-first ELSE stored-with-revalidation+visible-stale; never stored-and-silent. This subtask builds the FAILABLE gate for this class (stub-must-fail). Family coord-root: Task 37.28.

## Acceptance Criteria

- [ ] (functional) req-satisfaction: (a) DERIVE satisfied from a tracked COVERING TASK state — NEVER store satisfied as an authored flag. An AC with tasks[]==empty is UN-SATISFIABLE-BY-CONSTRUCTION (rides R40.54 failable family + the untasked-AC audit). Specimen: R40.50 4c4de905 had 7 ACs / tasks[]=empty, shipped falsely-satisfied v0.8.118 then reopened.
- [ ] (gate) STUB-MUST-FAIL + 3-LINK CREDIT: a satisfaction credited via this gate needs THREE resolvable links — (1) resolvable satisfyingGate CITE, (2) GREEN-on-HEAD, (3) ASSERTS-THIS-AC (scope-match not name-match). Links 2+3 = the TESTER verdict (proof-builder separation; planner/req/architect may NOT self-credit). Bite: cite-only+gate-RED-on-HEAD => uncredited; gate-green-but-asserts-a-DIFFERENT-AC (name-match) => uncredited. FAMILY: truth-decay / no-freshness-invariant.

## Subtasks

None (leaf subtask).
