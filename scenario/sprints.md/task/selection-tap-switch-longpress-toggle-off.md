# T-selection-tap-switch-longpress-toggle: tap clears+selects ONE, long-press toggles off
[task:uuid:1fac9d23-6647-45e5-a0a5-458bc1892974]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect — canonicalize UC/Class/Method + PUML)
  - [ ] creating test cases (tester — RED tap-switch + longpress-toggle E2E FIRST)
  - [ ] implementing (expert — SelectionModel.tapSingleSelect clear+select; long-press toggle)
  - [ ] testing (tester — RED→GREEN E2E + screenshot)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 selectionModel.tapSwitches](../usecase/selectionmodel-tapswitches.md)


## Task Description

BUG2 (S20, Bug — in delivered R20.6c+d): (1) short tap ACCUMULATES selection instead of SWITCHING — tapSingleSelect must clear() then select (result size===1). (2) long-press does NOT toggle OFF — if item already selected, long-press must REMOVE it (toggle off); currently only adds. FIX both: tap = clear+select(1); long-press = toggle (add if absent, remove if present). intendedChain (for architect): UC selectionModel.tapSwitches; Class SelectionModel; Method tapSingleSelect (call clear() before select(ior)) + the long-press toggle path; Test RED: (1) tap A→[A], tap B→assert [B] size 1 (A gone), currently FAILS (accumulates); (2) long-press A→[A], long-press A again→assert [] (toggled off), currently FAILS (A stays). S20 DISCIPLINE: full chain designed + Test FIRST; UI → Playwright+screenshot gate; nothing ships chain-open. STRICT ORDER: this is NEXT. RELEASE → v0.6.8 + git tag.

## Subtasks


