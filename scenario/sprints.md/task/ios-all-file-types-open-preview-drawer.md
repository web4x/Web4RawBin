# T-ios-all-types-open-drawer: on iOS, all file types (not just vcard) must open the ContentPreviewer drawer
[task:uuid:8cc07506-9827-4acc-9b0e-902275f11b04]

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
- [🔗 contentPreviewer.touchActionFix](../usecase/contentpreviewer-touchactionfix.md)


## Task Description

R19.87 fix (iOS-specific): on iPhone Safari/PWA only text/vcard files open the ContentPreviewer drawer; image/html/url/webitem do not (works on desktop). Likely iOS touch-event delegation (click vs touchend, passive listeners, 300ms tap delay) on the file-item click handler. Restore drawer-open for ALL content types on iOS. Verify on real iPhone Safari + PWA. Singular-chain: ONE UseCase per Task; ONE Method per UseCase (learning #27). Architect to design the UC.

## Subtasks


