# T-seed-tree-members-and-files: /api/trace/children returns members+files (option-B synthetic Member children)
[task:uuid:b2baea58-e3a3-43e4-b650-54479ffcdabb]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect — root-caused, option-B)
  - [ ] creating test cases
  - [x] implementing (expert — in flight)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 traceChildren.roomCollections](../usecase/tracechildren-roomcollections.md)


## Task Description

R19.101 fix: consolidating the in-room tree to seed-ior (R19.90/92) regressed the Members collection — only Files render now. RESTORE: in-room tree MUST show BOTH Members AND Files as top-level folder nodes (R19.21.A) via the SAME seed-ior path, without regressing the files fix. Root cause (architect): /api/trace/children must return both members[] and files[] as children of the room seed — option-B synthetic Member children — rendered as two folder-type rb-object-items. Expert implementing. Singular-chain: ONE UseCase per Task; ONE Method per UseCase (learning #27). Architect attaches useCases[]/chain (single-owner standard). In-room UX → Test node MUST be real E2E Playwright + screenshot; gate asserts BOTH Members AND Files render (anti-false-green standard).

## Subtasks


