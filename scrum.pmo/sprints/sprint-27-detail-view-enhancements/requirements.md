[Back to Planning](./planning.md)

# Sprint 27 — Detail View Enhancements — Requirements

**Source:** Tron directive 2026-07-01 (Task detail view enhancements), via robbin-po.
**Standard:** [traceability-standard.md](../../standards/traceability-standard.md).
**Note:** the companion request — a clickable link to the task's sprint MD file — is ALREADY COVERED by R22.1 (AC-2a/AC-2b: Forward Links -> MD task file). Only the visual statusChecklist render is new. v0.7.6 shipped both; this captures the statusChecklist requirement so its chain is traceable (retroactive, #126).

---

## Requirements

- [ ] **R27.1 — Task detail renders the status checklist visually**
  [requirement:uuid:90b82d00-7af1-40e9-992c-c55ca177c542]
  > TRON: render the task STATUS CHECKLIST from the MD (Planned / In Progress[refinement/creating test cases/implementing/testing] / QA Review / Done) directly in the detail view. The status is already in the task scenario unit (statusChecklist field) — render it visually.
  The Task detail view renders the task's status checklist VISUALLY from the unit's model.statusChecklist field (markdown) - showing the lifecycle states Planned / In Progress [refinement, creating test cases, implementing, testing] / QA Review / Done with per-item checked/unchecked state and nested sub-items indented - rather than leaving the status as raw text or unshown.
  *(impl: rb-task-detail.ts renderStatusChecklist, v0.7.6, from model.statusChecklist; Class RbTaskDetail. Code shipped BEFORE the req — #126 slip, chain completed retroactively.)*
  **Acceptance criteria:**
  - [ ] **(source)** The status checklist is read from the task unit's model.statusChecklist field (markdown), NOT re-parsed from the .md file on disk.
  - [ ] **(render)** The detail view renders it as a VISUAL checklist showing Planned / In Progress / QA Review / Done, each with a checked/unchecked state.
  - [ ] **(nested)** Nested sub-items under 'In Progress' render indented: refinement, creating test cases, implementing, testing.
  - [ ] **(placement)** The status checklist appears in the Task detail view alongside the MD-file link (R22.1).
  - [ ] **(verify)** Verified live (headless): a task carrying a statusChecklist renders the visual checklist matching the unit field.
  → [UC27.1: taskDetail.renderStatusChecklist](./planning.md#uc27-1) `[uc:uuid:050c5b9a-e5f4-46da-843f-44eb2b70994e]` *(placeholder — architect to refine + wire to RbTaskDetail.renderStatusChecklist)*

---

## Traceability Matrix

| Req | Name | Requirement UUID | UC placeholder UUID |
|-----|------|------------------|---------------------|
| R27.1 | Task detail renders status checklist visually | 90b82d00-7af1-40e9-992c-c55ca177c542 | 050c5b9a-e5f4-46da-843f-44eb2b70994e |

*Captured by robbin-req 2026-07-01. MD-link = R22.1 (covered). statusChecklist render = R27.1 (new, v0.7.6 retroactive-chain).*
