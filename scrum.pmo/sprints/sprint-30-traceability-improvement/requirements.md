[Back to Planning](./planning.md)

# Sprint 30 — Traceability Improvement — Requirements

**Source:** Tron re-scope 2026-07-02 — S30 = TRACEABILITY only (Agent Messaging -> S29, drawer -> S27).
> WARN FINAL HAND-EDIT before R28.1 generate-requirements-md takes over (requirements.md is hand-maintained; R28.1 makes it generated + --check).

---

## Requirements

- [ ] **R30.1 — Traceability tree: CurrentSprint top + eager-lazy Sprints collection**
  [requirement:uuid:6f796898-4dbb-47a3-ab8a-914b4c80b353]
  > TRON 2026-07-02 (plan in Sprint 30): traceability tree top = CurrentSprint: Sprint <N> (3 eager children Current/Last/Next); 2nd node = Sprints 01-<N> collection, collapsed, badge=count, eager sprint-nodes + LAZY tasks (load on expand); exactly 2 top-level nodes; structure-eager/payload-lazy scales like R26 federation.
  The traceability tree grows well as sprints accumulate: exactly TWO top-level nodes. (1) top = 'CurrentSprint: Sprint <N>' - the CURRENT sprint, not 'Current: Task X' - with 3 EAGER children Current / Last Completed / Next Backlog. (2) 2nd top = 'Sprints 01-<N>' COLLECTION parent, COLLAPSED, badge = sprint count; it EAGER-loads all sprint NODES but LAZY-loads their TASKS (tasks load only when a sprint node is expanded). Structure-eager / payload-lazy - the same scaling pattern as R26 federation loading - so the tree stays fast as sprints grow.
  **Acceptance criteria:**
  - [ ] **(tree)** The top node is 'CurrentSprint: Sprint <N>' - the CURRENT sprint (not 'Current: Task X').
  - [ ] **(tree)** The CurrentSprint node has 3 EAGER children: Current / Last Completed / Next Backlog (task) - loaded as-is.
  - [ ] **(tree)** The 2nd top-level node = 'Sprints 01-<N>' COLLECTION parent, COLLAPSED, with a badge = sprint count.
  - [ ] **(scaling)** EAGER-LAZY: the collection eager-loads all sprint NODES but LAZY-loads their TASKS - a sprint's tasks load ONLY when that sprint node is expanded.
  - [ ] **(tree)** Exactly TWO top-level nodes (CurrentSprint + Sprints-collection); tasks never load until their sprint is expanded.
  - [ ] **(scaling)** Structure-eager / payload-lazy so the tree scales as sprints grow - the same loading pattern as R26 federation (structure eager, payload lazy).
  → [UC30.1: traceTree.currentSprintEagerLazy](./planning.md) `[uc:uuid:e22113cd-022d-48f0-b434-9ec4636e2081]`

- [ ] **R30.2 - Eager child-count badges (structure+counts eager, content lazy)** *(Tron traceability-tree bug 2026-07-13; v0.7.11 retroactive)*
  [requirement:uuid:15c8fe45-b1ff-4c08-b589-be741ae95d85]
  > TRON 2026-07-13: tree badges show 0 until expand - must show the REAL child-count eagerly from the parent response metadata; content stays lazy.
  Every traceability-tree node's child-count BADGE shows the correct count from when its PARENT loads (eager metadata) - not 0-until-expand. The count comes from the parent's /children response metadata (childCount per child), not a per-node prefetch. Lazy level-by-level: expanding loads children WITH their child-counts; deeper content loads on further expand. Structure+COUNTS eager; child CONTENT payload-lazy. THE BUG: all sprint nodes showed badge=0 initially.
  **Acceptance criteria:**
  - [ ] **(badge)** Every tree node child-count BADGE shows the correct count from when its PARENT loads (eager) - NOT 0-until-expand.
  - [ ] **(badge)** The count comes from the PARENT /children response metadata (childCount per child), not a per-node prefetch.
  - [ ] **(loading)** Lazy level-by-level: expanding a node loads its children WITH their own child-counts (next level badges correct); deeper content on further expand.
  - [ ] **(bug)** THE BUG: all sprint nodes showed badge=0 initially - must show the real task-count before expand.
  - [ ] **(loading)** Still PAYLOAD-LAZY: children CONTENT loads on expand; only COUNTS are eager (structure+count eager / payload lazy - R26 pattern).
  -> UC30.2 traceTree.eagerChildCountBadges [uc:uuid:fe0d394c-5f2e-4003-8941-ad2f390f59a5]
- [ ] **R30.3 - Sprint selection updates the detail drawer** *(Tron traceability-tree bug 2026-07-13; v0.7.11 retroactive)*
  [requirement:uuid:c1a0b382-9d57-4f33-820e-b05f56e25dd3]
  > TRON 2026-07-13: clicking a sprint node must update the detail drawer to that sprint details - currently selecting a sprint does NOT change the drawer.
  Selecting/clicking a SPRINT node in the traceability tree updates the detail drawer to show THAT sprint's details. The selection->drawer binding works for ALL tree node types (sprint/task/etc), always showing the selected unit's details. THE BUG: selecting a sprint did NOT change the drawer content.
  **Acceptance criteria:**
  - [ ] **(selection)** Selecting/clicking a SPRINT node updates the detail drawer to show THAT sprint details.
  - [ ] **(bug)** THE BUG: selecting a sprint did NOT change the drawer content.
  - [ ] **(selection)** selection->drawer works for ALL tree node types (sprint/task/etc) - shows the selected unit details.
  -> UC30.3 traceTree.selectionUpdatesDrawer [uc:uuid:23745b79-3181-40e3-9766-6b9f2f795b3b]

---

## Traceability Matrix

| Req | Name | Requirement UUID | UC UUID |
|-----|------|------------------|---------|
| R30.2 | Eager child-count badges (structure+counts e | 15c8fe45-b1ff-4c08-b589-be741ae95d85 | fe0d394c-5f2e-4003-8941-ad2f390f59a5 |
| R30.3 | Sprint selection updates the detail drawer | c1a0b382-9d57-4f33-820e-b05f56e25dd3 | 23745b79-3181-40e3-9766-6b9f2f795b3b |
| R30.1 | Traceability tree: CurrentSprint top + eager | 6f796898-4dbb-47a3-ab8a-914b4c80b353 | e22113cd-022d-48f0-b434-9ec4636e2081 |

*Re-scoped by robbin-req 2026-07-02. S30 = traceability tree only. FINAL hand-edit before R28.1 generator.*
