<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.28.3: deploy-instruction (DEPLOY-STATE.md) freshness guard — derive-from-branch-reality OR stamp+render-stale

[task:uuid:968d966d-ea74-404b-9751-f611fdab475e]

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

Per-class freshness guard for the deploy-instruction artifact-class (R37.25 truth-decay / no-freshness-invariant family; architect design ior:file:scrum.pmo/design-notes/design-truth-decay-freshness-invariant-family.md?commit=e31458f92). CURE = derive-first ELSE stored-with-revalidation+visible-stale; never stored-and-silent. This subtask builds the FAILABLE gate for this class (stub-must-fail). Family coord-root: Task 37.28.

## Acceptance Criteria

- [ ] (functional) deploy-instruction (DEPLOY-STATE.md): (a) DERIVE the instruction from BRANCH REALITY (branch-contains + main..HEAD), OR (b) stamp it with the commit-range it was true for + render STALE when HEAD moves past that range. A stored do-NOT-merge/DELETE-branch with no re-check against branch state (14 hotfix commits incl shipped v0.8.143) => the pure specimen.
- [ ] (gate) STUB-MUST-FAIL + 3-LINK CREDIT: a satisfaction credited via this gate needs THREE resolvable links — (1) resolvable satisfyingGate CITE, (2) GREEN-on-HEAD, (3) ASSERTS-THIS-AC (scope-match not name-match). Links 2+3 = the TESTER verdict (proof-builder separation; planner/req/architect may NOT self-credit). Bite: cite-only+gate-RED-on-HEAD => uncredited; gate-green-but-asserts-a-DIFFERENT-AC (name-match) => uncredited. FAMILY: truth-decay / no-freshness-invariant.

## Subtasks

None (leaf subtask).
