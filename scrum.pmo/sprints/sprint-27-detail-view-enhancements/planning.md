# Sprint 27 — Detail View Enhancements — Planning

**Source:** Tron 2026-07-01. **Requirements:** [requirements.md](./requirements.md)

## Sprint Goal

Enhance the scenario/task detail views. R27.1: render the task status checklist visually from the unit's statusChecklist field. (The companion MD-file link is covered by R22.1.) Home for future detail-view enhancements.

## Use Case Placeholder

| Anchor | UseCase (Object.verb) | UC placeholder UUID | Covers | Class |
|--------|----------------------|---------------------|--------|-------|
| <a id="uc27-1"></a>UC27.1 | taskDetail.renderStatusChecklist | 050c5b9a-e5f4-46da-843f-44eb2b70994e | R27.1 | RbTaskDetail |
| <a id="uc27-2"></a>UC27.2 | chain.reuseCanonicalClass | 37c52953-654f-47c1-8710-b851b706849d | R27.2 | ClassRegistry/Chain |
| <a id="uc27-3"></a>UC27.3 | sprintMd.emitPerTask | 10ef702c-3141-45c9-b669-b5bed5f373b9 | R27.3 | generate-sprint-md |

The architect refines UC27.1 -> real UseCase + wires RbTaskDetail -> Method renderStatusChecklist (v0.7.6) -> Impl; the expert tags the [impl:uuid] marker on rb-task-detail.ts:renderStatusChecklist to complete the retroactive chain.

## Related / covered elsewhere

- **Task MD-file link (📄)** = R22.1 (S22) AC-2a/AC-2b (Forward Links -> MD task file). The v0.7.6 MD-link impl (rb-task-detail.ts taskMdHref, lines 62-66) is currently UNTAGGED — the expert should add an [impl:uuid] linking it to R22.1's chain (flagged).

## Definition of Done

- A task with a statusChecklist renders the visual checklist (nested In-Progress sub-items) in the detail view, sourced from model.statusChecklist, verified headless.

---

*Planned by robbin-req 2026-07-01. Sprint 27 — Detail View Enhancements.*
