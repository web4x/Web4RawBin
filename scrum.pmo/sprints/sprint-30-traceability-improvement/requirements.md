[Back to Planning](./planning.md)

# Sprint 30 - Traceability Improvement - Requirements

**Source:** Tron re-scope + traceability-tree bugs 2026-07-13. S30 = TRACEABILITY only.
> WARN requirements.md is hand-maintained until R28.1 generate-requirements-md.

---

## Requirements

- [ ] **R30.1 - Traceability tree: CurrentSprint top + eager-lazy Sprints collection**
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
  -> UC30.1 [uc:uuid:e22113cd-022d-48f0-b434-9ec4636e2081]

- [ ] **R30.2 - Eager child-count badges**
  [requirement:uuid:850a339d-c7e5-4308-b2c7-65536bd5271e]
  Every collapsed trace-tree node shows a child-count BADGE reflecting its real childCount from server metadata BEFORE its children are loaded (structure+count eager, payload lazy). The CurrentSprint node and each Sprint node in the Sprints collection carry a badge = their true child count without expanding. Impl: RbTraceTree.computeBadges + renderCurrentSprintEagerLazy (nodeChildCount from server metadata), deployed v0.7.11.
  **Acceptance criteria:**
  - [ ] **(badge)** Every tree node child-count BADGE shows the correct count from when its PARENT loads (eager) - NOT 0-until-expand.
  - [ ] **(badge)** The count comes from the PARENT /children response metadata (childCount per child), not a per-node prefetch.
  - [ ] **(loading)** Lazy level-by-level: expanding a node loads its children WITH their own child-counts (next level badges correct); deeper content on further expand.
  - [ ] **(bug)** THE BUG: all sprint nodes showed badge=0 initially - must show the real task-count before expand.
  - [ ] **(loading)** Still PAYLOAD-LAZY: children CONTENT loads on expand; only COUNTS are eager (structure+count eager / payload lazy - R26 pattern).
  -> UC30.2 [uc:uuid:80cb8336-c758-49f6-80d9-dafe068ad71f]

- [ ] **R30.3 - Sprint selection populates detail drawer**
  [requirement:uuid:6cd770df-0034-406e-b20c-bb8bddaadbf7]
  Selecting a Sprint node in the traceability tree POPULATES the detail drawer with that sprint's detail (name, goal, task slots), instead of an empty/stale drawer. Impl: RbDetailDrawer.renderDetailForRef sprint-case (deployed v0.7.11).
  **Acceptance criteria:**
  - [ ] **(selection)** Selecting/clicking a SPRINT node updates the detail drawer to show THAT sprint details.
  - [ ] **(bug)** THE BUG: selecting a sprint did NOT change the drawer content.
  - [ ] **(selection)** selection->drawer works for ALL tree node types (sprint/task/etc) - shows the selected unit details (fix on RbDetailDrawer.renderDetailForRef).
  -> UC30.3 [uc:uuid:9095cd05-5528-4450-a830-f9b858129ad2]

- [ ] **R30.4 - Lobby name from profile, not random** *(Tron regression 2026-07-13; S30 reopened)*
  [requirement:uuid:17e12898-9720-4d29-af29-18bddb929f40]
  > TRON 2026-07-13: the lobby 'Your Name' shows a random 'User NNN' instead of the profile name (Marcel Donges). RoomBrowser.ts:29 computes memberName sync before the profile loads (async race). Use the profile name once loaded; random only as a true last resort.
  The lobby 'Your Name' shows the PROFILE name (Marcel Donges), not a random 'User NNN'. THE BUG: RoomBrowser.ts:29 computes memberName SYNCHRONOUSLY before the profile has loaded (an async race) - so profile?.name is null, the random fallback fires, and a different name shows every reload. FIX: use the profile name once it is LOADED (await the profile / re-render on profile-load); the random 'User NNN' is used ONLY as a TRUE last resort (no profile at all). The profile token/uuid is stable (05e58f81) - only the displayed NAME regresses.
  **Acceptance criteria:**
  - [ ] **(name)** The lobby 'Your Name' shows the PROFILE name (Marcel Donges), NOT a random 'User NNN'.
  - [ ] **(bug)** THE BUG: RoomBrowser.ts:29 computes memberName SYNC before the profile loads (async race) -> profile?.name null -> random fallback -> a different name every reload.
  - [ ] **(fix)** Fix = use the profile name once LOADED (await profile / re-render on profile-load); random 'User NNN' only as a TRUE last resort (no profile at all).
  - [ ] **(identity)** The profile token/uuid is stable (05e58f81) - only the displayed NAME regresses; the fix must not change the stable identity token, only the name resolution.
  -> UC30.4 lobby.nameFromProfile [uc:uuid:d6d8f55a-0300-4249-b7f8-c13a80a47490]

---

## Traceability Matrix

| Req | Name | Requirement UUID | UC UUID |
|-----|------|------------------|---------|
| R30.1 | Traceability tree: CurrentSprint top + eager | 6f796898-4dbb-47a3-ab8a-914b4c80b353 | e22113cd-022d-48f0-b434-9ec4636e2081 |
| R30.2 | Eager child-count badges | 850a339d-c7e5-4308-b2c7-65536bd5271e | 80cb8336-c758-49f6-80d9-dafe068ad71f |
| R30.3 | Sprint selection populates detail drawer | 6cd770df-0034-406e-b20c-bb8bddaadbf7 | 9095cd05-5528-4450-a830-f9b858129ad2 |

*Reconciled by robbin-req 2026-07-13 (dedup: canonical 850a339d/6cd770df, deleted dups 15c8fe45/c1a0b382).*
