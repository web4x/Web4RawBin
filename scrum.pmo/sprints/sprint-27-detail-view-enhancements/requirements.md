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

- [ ] **R27.2 — One canonical Class unit per code class (no per-req Class duplication)**
  [requirement:uuid:64965538-2725-4ef2-92e7-c1be6cd58d6f]
  > TRON (via PO): ONE canonical Class unit per code class — no per-req Class duplication; the chain reuses the existing Class node. By-construction fix (cannot-happen-again).
  The scenario graph holds AT MOST ONE canonical Class unit per code class. Wiring a UseCase to a Class REUSES the existing Class node (adds the method), never mints a duplicate. The existing 55 duplicate Class units (23 code classes) are collapsed to one canonical each — by-construction, this cannot happen again.
  *(audit: scrum.pmo/design-notes/class-unit-dedup-audit.md — 163 Class units / 108 code classes / 55 collapsible; architect flagged 4x RbTaskDetail.)*
  **Acceptance criteria:**
  - [ ] **(invariant)** The scenario graph holds AT MOST ONE Class unit per code class (by class name/identity); no per-req duplication.
  - [ ] **(reuse-on-wire)** Wiring a UC to a Class REUSES the existing Class node for that code class (adds the method to it), NEVER mints a new Class unit (the R27.1 pattern).
  - [ ] **(cleanup)** The 55 existing duplicate Class units (23 code classes, per audit) are collapsed to one canonical each: methods repointed + every UC.class ref rewritten to the canonical + emptied duplicates removed.
  - [ ] **(canonical-select)** The canonical is the unit with the most methods / already on the active chain; the collapse is dry-run + count FIRST (never silently drop a method or break a UC.class ref).
  - [ ] **(by-construction)** After the fix, minting a chain for a NEW req on an EXISTING code class cannot create a duplicate Class unit (wiring reuses).
  - [ ] **(verify)** A trace audit shows exactly ONE Class unit per code class; no chain fans out through duplicate Class nodes.
  → [UC27.2: chain.reuseCanonicalClass](./planning.md#uc27-2) `[uc:uuid:37c52953-654f-47c1-8710-b851b706849d]` *(placeholder — architect to refine; cleanup = a gated migration task)*


- [ ] **R27.3 — Per-task MD view generation (every 📄 link resolves, no 404)**
  [requirement:uuid:4f6d6402-fc8d-4d5d-9523-7e35af641944]
  > TRON (screenshot): the 📄 task links 404. FIX: generate-sprint-md emits one task-<slug>.md per task unit so every 📄 resolves; tasks must not point sourceFile at planning.md.
  generate-sprint-md emits ONE `task-<slug>.md` per Task unit (title / ACs / statusChecklist / chain) so every task's 📄 MD link resolves 200, not 404; Task units must NOT set model.sourceFile to planning.md (which collapses all tasks into one view).
  *(impl base: scripts/generate-sprint-md.ts (generateTaskMd/checkSprint) + rb-task-detail.ts:88 taskMdHref. Planner diagnosis: 404 when no per-task MD emitted.)*
  **Acceptance criteria:**
  - [ ] **(emit)** generate-sprint-md emits ONE task-<slug>.md per Task unit (title + ACs + statusChecklist + chain), not only planning.md.
  - [ ] **(no-collapse)** Task units do NOT set model.sourceFile to planning.md (which collapses all tasks into one shared view); each task MD is its own file.
  - [ ] **(resolve-200)** taskMdHref (rb-task-detail.ts:88) resolves to the per-task MD -> HTTP 200, never 404 (the Tron-visible bug is gone).
  - [ ] **(roundtrip)** The per-task MD is a generated VIEW (law #100); --check (check:sprint-md) byte-match holds for the per-task files.
  - [ ] **(verify)** Verified live: every task's 📄 link opens its own MD file.
  → [UC27.3: sprintMd.emitPerTask](./planning.md#uc27-3) `[uc:uuid:10ef702c-3141-45c9-b669-b5bed5f373b9]` *(placeholder — architect to refine; Class generate-sprint-md/ViewGenerator)*


---

## Traceability Matrix

| Req | Name | Requirement UUID | UC placeholder UUID |
|-----|------|------------------|---------------------|
| R27.1 | Task detail renders status checklist visually | 90b82d00-7af1-40e9-992c-c55ca177c542 | 050c5b9a-e5f4-46da-843f-44eb2b70994e |
| R27.2 | One canonical Class unit per code class | 64965538-2725-4ef2-92e7-c1be6cd58d6f | 37c52953-654f-47c1-8710-b851b706849d |
| R27.3 | Per-task MD view generation (📄 links resolve) | 4f6d6402-fc8d-4d5d-9523-7e35af641944 | 10ef702c-3141-45c9-b669-b5bed5f373b9 |

*Captured by robbin-req 2026-07-01. MD-link = R22.1 (covered). statusChecklist render = R27.1 (new, v0.7.6 retroactive-chain).*
