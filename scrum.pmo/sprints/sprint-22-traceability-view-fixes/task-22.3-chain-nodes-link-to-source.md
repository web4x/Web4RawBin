<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 22.3: Chain nodes link to their source artifacts (per type)

[task:uuid:1bac1de6-df15-42d3-b79e-41793ae0357d]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 22 Planning](./planning.md)
    - Requirement R22.3 `[requirement:uuid:2c1fd942-a6f1-414c-976f-ea7af7008201]`
  - down
    - [UC-VF.3: chainNode.linkToSource](./planning.md#uc-vf3) `[uc:uuid:1371923a-06f2-4c84-a1ca-75a98ef77f51]`

## Task Description

Each node in the chain detail view MUST be a clickable link to its real source artifact, by type: a Class node links to its PlantUML .puml diagram AND the rendered .svg; a Method node links to the source .ts file:line of the method; an Implementation node links to the source .ts file:line of the impl. Live-bug re-raise of the designed-ahead source-link specs R20.23–R20.27.

## Context

Traceability chain detail view. Nodes were rendered as raw text/IOR; they must become clickable links to the actual file:line / diagram.

## Intention

Tron: "the implementation should be a link to the source code... The Class a link to the puml diagram and its svg... the method should be a link to the source code of the method."

## Acceptance Criteria

- [x] A Class chain node links to its .puml diagram AND its rendered .svg
- [x] A Method chain node links to the source .ts file:line of the method
- [x] An Implementation chain node links to the source .ts file:line of the impl
- [x] Every chain detail-view node renders as a clickable link to its real artifact (not raw text/IOR)
- [x] Links resolve to the actual file:line / diagram (open in the browser)
- [x] Verified live (headless) — tester source-links GREEN DET-3x v0.6.78 (adddd7ae5); impl v0.6.77 (5a3e794d6, 3 prereq fixes architect-diagnosed) + v0.6.79 RbFileDetail sourceFile data-gap fill (4e3c3df0d)

## Implementation

 ✓ TRON-ACCEPTED 2026-07-01 (Tron QA review pass) -> DONE (full-AC).

## Subtasks

None (atomic task).
