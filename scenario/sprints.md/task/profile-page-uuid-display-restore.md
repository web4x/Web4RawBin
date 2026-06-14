# T-profile-uuid-restore: restore the user's UUID display on the profile page
[task:uuid:b0576d79-cee9-4710-bbe6-c1cec8622f60]

## Status

- [x] Planned
- [x] In Progress
  - [ ] refinement (architect)
  - [ ] creating test cases
  - [ ] implementing (expert)
  - [ ] testing (tester)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 profileEditor.showUserUuid](../usecase/profileeditor-showuseruuid.md)


## Task Description

R19.96 fix (PRIORITY 3): the profile page no longer shows the user's UUID (regression) — it used to display it for sharing / account linking. RESTORE the UUID display in the profile view: show the full UUID (or short form with copy-to-clipboard) so users can identify their account and share it for account linking. Singular-chain: ONE UseCase per Task; ONE Method per UseCase (learning #27). Architect attaches useCases[]/chain (single-owner standard). User-facing UI → prefer E2E/screenshot verification.

## Subtasks


