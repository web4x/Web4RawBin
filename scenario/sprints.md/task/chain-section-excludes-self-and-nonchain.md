# T-chain-excludes-self-and-nonchain: chain section excludes the Task self-node + non-chain nodes
[task:uuid:18ee26a2-bff1-43ab-8ecf-1665a56b96d1]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect — canonicalize UC/Class/Method + PUML)
  - [ ] creating test cases (tester — RED self-excluded E2E FIRST)
  - [ ] implementing (expert)
  - [ ] testing (tester — RED→GREEN E2E + screenshot)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 detailView.chainExcludesSelf](../usecase/detailview-chainexcludesself.md)


## Task Description

BUG1 (S20, Bug — dogfoods R20.4): the Traceability Chain section shows the TASK as its OWN chain node (self-referential) and mixes in non-chain nodes (all methods, not chain-relevant only). The chain must show ONLY the singular traced path req→uc→class→method→impl→test — Task is NAVIGATION, not a chain node (locked 6-step standard); ties to R20.5-A. intendedChain (for architect): UC detailView.chainExcludesSelf; Class RbDetailDrawer (or chain-walk logic); Method renderTraceabilitySection (filter out self-node + non-chain nodes); Test RED: open Task detail → assert Task does NOT appear as a node in its own Traceability Chain; assert only req→uc→class→method→impl→test nodes appear (currently FAILS: Task shown + all methods mixed). S20 DISCIPLINE: full chain designed + Test FIRST; UI → Playwright+screenshot gate; nothing ships chain-open. RELEASE → v0.6.6 + git tag (strict order: AFTER CR1 v0.6.5).

## Subtasks


