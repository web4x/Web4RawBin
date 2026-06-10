# T-file-unit: Files become scenario units (uuid.content + scenario.json + unitLinks[])
[task:uuid:834fe55b-8885-47f9-bdf9-3fb2f4fe7d40]

## Status

- [ ] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [x] implementing (commit 22416694 v0.5.128 — FileLoader + createFileUnit + readFileUnitContent)
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 file.persistAsUnit](../usecase/file-persistasunit.md)


## Task Description

Files uploaded into a room are stored in the uuid index as <uuid>.content PLUS a <uuid>.scenario.json referencing the content, with unitLinks[] symlinks (e.g. in the room folder on the filesystem). Every file becomes a unique scenario unit. Singular-chain by design.

## Subtasks


