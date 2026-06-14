# T-remove-id-full-wipe: removeLocalIdentity clears ALL browser state → first-run → ProfileEditor
[task:uuid:5da32d29-1e03-44e8-b216-1a8596be1580]

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
- [🔗 deviceEnroll.fullStateWipe](../usecase/deviceenroll-fullstatewipe.md)


## Task Description

R19.91 fix: removeLocalIdentity MUST (1) clear ALL identity browser state — localStorage (token, keypair, device data, name, secret), IndexedDB entries, any cached identity in SW caches; (2) reset app to first-run (no token/device/profile); (3) reload → ProfileEditor in new-user onboarding mode. Currently a partial clear leaves residual state preventing a true fresh start. Refines R19.89 (button placement now correct → action must be complete). Singular-chain: ONE UseCase per Task; ONE Method per UseCase (learning #27). Architect to design the UC. NOTE (anti-false-green standard): Test node must be a real END-TO-END Playwright test reaching the rendered view + screenshot, not a unit/source-string test.

## Subtasks


