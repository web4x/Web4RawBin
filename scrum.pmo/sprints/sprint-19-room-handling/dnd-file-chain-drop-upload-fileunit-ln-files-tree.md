<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T-dnd-file-chain: drop file onto room drop-zone uploads and creates FileUnit with ln symlinks in Files tree

[task:uuid:7fca98ae-f32c-4160-adad-c40d09aa7188]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement architect
  - [x] creating test cases
  - [x] implementing expert (6afbc901 v0.5.157)
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Dropping a file onto the room drop-zone triggers upload, creates a FileUnit scenario unit (uuid.content + uuid.scenario.json), emits ln symlinks into the Files tree node. Full chain: drop -> upload -> FileUnit -> ln -> Files-tree. Covers R19.36.

## Subtasks
