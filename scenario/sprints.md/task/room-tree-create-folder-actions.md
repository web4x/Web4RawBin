# T-room-create-folder-actions: room tree user actions — create new folder to organize content
[task:uuid:42819b8b-02f6-4104-8b6c-e0156783e38f]

## Status

- [x] Planned
- [ ] In Progress
  - [ ] refinement (architect — design FULL chain ahead)
  - [ ] creating test cases (tester — write E2E FIRST)
  - [ ] implementing (expert — against the designed chain + test)
  - [ ] testing (tester — RED→GREEN E2E)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 roomFolder.createAndManage](../usecase/roomfolder-createandmanage.md)


## Task Description

R19.102 (S20 carry-forward, TRACEABILITY-FIRST): room tree supports user actions — create a new folder to organize content. S20 DISCIPLINE: full chain (Req→UC→Class→Method→Impl→Test) DESIGNED first; the E2E Test is written FIRST (or with impl) so this never ships chain-open. Architect designs UC→Class→Method ahead of impl; tester defines the RED→GREEN E2E (create folder → folder node appears in tree → file can be moved into it → persists). In-room UX → real Playwright + screenshot gate (anti-false-green standard).

## Subtasks


