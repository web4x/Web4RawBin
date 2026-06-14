# T-move-remove-id-to-enroll: relocate red Remove-Local-Identity button ProfileEditor → DeviceEnrollDialog secret-code screen
[task:uuid:9628370d-8991-4ef5-9a9a-4aaaa1bfbf59]

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
- [🔗 deviceEnroll.removeLocalIdentity](../usecase/deviceenroll-removelocalidentity.md)


## Task Description

R19.89 fix: the red 'Remove current ID data' button (R19.72, impl 25884b0c) is on the WRONG screen — ProfileEditor.ts:68 (gate mode) instead of the DeviceEnrollDialog 'Authorize This Device' secret-code screen. MOVE it to DeviceEnrollDialog, where a locked-out user without the secret code actually needs the escape path. Remove it from ProfileEditor (established/authenticated users — no purpose there). R19.72's 'secret-code page' = DeviceEnrollDialog. Singular-chain: ONE UseCase per Task; ONE Method per UseCase (learning #27). Architect to design the UC.

## Subtasks


