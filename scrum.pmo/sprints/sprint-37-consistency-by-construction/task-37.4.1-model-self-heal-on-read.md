<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.4.1: MODEL self-heal on read — ANY unit object validates on init/read (fresh-or-refuse), never returns a silently-drifted value (feeds the pipeline)

[task:uuid:236918e9-6369-450f-aec3-b741451be147]

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

Planned - C4.1 MODEL self-heal on read (subtask of T-C4 79fd2164, the MODEL guarantee of the MVC/view-pipeline fix). Chain (UC/Class/Method) at req-mint (architect confirms before expert wires). useCases[] pending architect design-step. Gate = drifted object recomputes-or-refuses, never silent-wrong. Verify Impl.tests[] on disk before any flip. 0 Done; no unevidenced ticks.

## Traceability

  - up
    - [Sprint 37 Planning](./planning.md)
    - Parent [Task 37.4](./task-37.4-objects-self-heal.md) `[task:uuid:79fd2164-3f1a-4a60-b91f-87fbaa5f8a2d]`
    - Requirement R37.4 `[requirement:uuid:c8615e9f-df2e-4ebf-b916-cbdd346ad1a1]`
  - down
    - None (leaf subtask)

## Task Description

C4.1 (subtask of T-C4/T37.4, MVC/view-pipeline shape; RE-ISSUED generic DRY, architect 55a5e2897). The MODEL layer is the only healthy one but its guarantee is incomplete on READ: GENERICALLY, ANY unit object (pin/board/task and any other ior:class:*) must VALIDATE on init/read — recompute to reflect reality (fresh) OR REFUSE to run when drifted — never return a silently-drifted value. This is what feeds the pipeline a fresh-or-refused value (never a quietly-stale one); the render surface then badges stale via C4.5. C2/C6 are the measured instances (status derived Planned while the chain had shipped an Impl = a silently-drifted read). Family: under-recorded-progress / silent-drift.

## Acceptance Criteria

- [ ] (functional) ANY unit object (pin/board/task and any other class) VALIDATES on init/read: recompute to reflect reality (fresh) OR REFUSE to run when drifted (fresh-or-refuse) — generic, not per-class special-casing.
- [ ] (functional) The objects NEVER return a silently-drifted value — always fail-loud or self-correct on read (C2/C6 = measured instances: status derived Planned while the chain had shipped an Impl). Feeds the pipeline a fresh-or-refused value.
- [ ] (DRY-AC / gate) STUB-MUST-FAIL: construct a drifted unit object -> it recomputes-to-reality OR throws/refuses (never returns silently-wrong); a NEW unit class inherits self-heal-on-read with ZERO edits to the validation mechanism (generic/registration-only); break the validate-on-read path -> gate RED. FAMILY: under-recorded-progress / silent-drift.

## Subtasks

None (leaf subtask).
