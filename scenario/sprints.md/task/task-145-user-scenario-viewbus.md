# T145: User class as scenario-unit + ViewBus-driven view updates (fixes lobby/room name stale)
[task:uuid:df4ea98b-b47c-4129-be73-a4047e919a6f]

## Status

- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req → architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:df4ea98b-b47c-4129-be73-a4047e919a6f]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng):** B6 in [scrum.pmo/backlog.md](../../backlog.md)
  - **B6 requirement** `[requirement:uuid:f7a8b9c0-d1e2-4f3a-b4c5-d6e7f8a9b0c6]`
    Verbatim Tron quote (from backlog B6):
    > "the vcard upload works. the editor is updated on all fields. but the user
    > name in the lobby not and when the user immediately enters a room also not.
    > make the user class use the same scenario model as the requirements, tasks
    > and so on. handle every views update as a model update on user....as on all
    > other classes that use scenario models."
- down
  - None (atomic at parent level; architect may split T145.x sub-tasks if scope warrants — coordinate with planner first)
- follows
  - [T125: Foundation (Unit + IOR + ClassLoaders + ClassRegistry + ScenarioIndex + ViewTemplateRegistry)](./task-125-foundation.md) — pattern T145 extends to User
  - [T126: Generated views + 7 templates](./task-126-views.md) — gains an 8th template (user) on this task
  - [T134: TraceLink as a scenario unit](./task-134-traceability-as-units.md) — class-as-scenario precedent
  - [T136: Migration extension for Requirement + UseCase units](./task-136-migration-extension-req-uc.md) — migration pattern T145 follows for User
  - [T143: Chain → tree rework](./task-143-traceability-tree-rework.md) — User joins the tree as a new class node
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** B6 (above)
  - **use case:** UC-TBD (architect — likely `user.update`, `viewBus.subscribe`, `viewBus.publish`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds new UCs as `UseCase` instances (rule #10 / T117)
  - **class/method:** `src/ts/shared/User.ts` (new — scenario class) / `src/public/ts/trace/UserLoader.ts` (new) / `src/public/ts/RoomBrowser.ts` (View) / `src/public/ts/RoomView.ts` (View) / `src/public/ts/components/rb-member-badge.ts` (View) / `src/public/ts/ProfileEditor.ts` (mutator) — TBD by architect

## Context

Tron 2026-05-31 (captured by PO/req-eng in B6 of `scrum.pmo/backlog.md`): two
problems in one directive.

1. **Bug:** After profile edit (name change via ProfileEditor or vCard upload),
   the user name in the **lobby** (RoomBrowser name input) and **in-room**
   (member badge — when the user immediately enters a room) does **not** refresh.
   It stays on the old name until a page reload. The fix is mechanical (push the
   new name into those views), but Tron doesn't want a mechanical fix.

2. **Architecture mandate:** Make the User class a **scenario unit** like
   Requirement / Task / UseCase / Class / Method / Test / TraceLink (S17's
   established pattern). Every view that shows user data subscribes via the
   **ViewBus** to model changes — the same pattern S17 already uses for the
   other scenario classes. After this, the bug fix is a free side-effect: the
   ViewBus propagates the `model.user` change, every subscribed view re-renders.
   No special-case refresh code anywhere.

## Intention

### Why this task exists
- The lobby/room name-stale bug is a symptom; the disease is that User is the
  only data-shaped class NOT in the scenario-unit + ViewBus model.
- A point-fix would leave the same class of bug ready to reappear on any new
  User field change. Standardizing User on the scenario pattern fixes the
  category, not just this instance.

### Problems this task solves
- Stale user-name in lobby + in-room after edit
- User is an exception in the otherwise uniform S17 scenario model
- Future User field changes need per-view refresh wiring; uniform model
  eliminates this

### How it solves them
- Promote User to a scenario class: schema, loader, index membership, template,
  ViewBus subscription
- Re-wire ProfileEditor's save path to mutate `model.user` (the canonical
  scenario unit), not push to views directly
- Re-wire RoomBrowser, RoomView, rb-member-badge as Views that subscribe to
  the User unit via ViewBus
- Migrate existing user JSONs to the scenario-unit form (T128.x pattern)

## Acceptance Criteria

- [ ] AC1 — User is a scenario unit with `[user:uuid:v4]` identity (or
  `class=User` in scenario JSON); ClassLoader + ScenarioIndex + ViewTemplate
  registered alongside Requirement/Task/UseCase/Class/Method/Test/TraceLink
- [ ] AC2 — Stale-name bug fixed: after a profile edit (name change via
  ProfileEditor or vCard upload), the name in the lobby AND on first-room-enter
  refreshes without a page reload
- [ ] AC3 — Every view that displays user-name subscribes via ViewBus; no
  special-case refresh code remains in ProfileEditor / RoomBrowser / RoomView /
  rb-member-badge
- [ ] AC4 — Chain audit (`trace-cli`) shows User as first-class scenario unit;
  `/trace` and `/md/scenarios/sprints.md/user/` list users
- [ ] AC5 — No regression on Sprint 9 (room identity — owner-name still loads
  correctly) or Sprint 17 (other scenario classes unaffected); full test suite
  green
- [ ] AC6 — `npm run build` succeeds; all existing tests pass
- [ ] AC7 — **Rule-pair (a)+(b) [learning #15+#16]:** `package.json` "version"
  bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set as
  the user-facing impl. (c) STATIC_SHELL: no new route expected — architect
  to confirm
- [ ] AC8 — Migration of existing user JSONs to scenario-unit form (T128.x
  pattern): every user in `data/users/` participates in the new model; no
  orphans; no data loss
- [ ] AC9 — All 4 roles committed work in this file (req anchor + architect
  design + expert impl + tester verify)

## QA Audit & User Feedback

- 2026-06-01: PO directed planner to lift T145 from backlog packet (B6) per Web4Articles + 4-role + real v4 uuids. CMM4 4-role engagement enforced (learnings #18); rule-pair (a)+(b) baked into AC7 + DoD (learnings #15+#16). Coordinate with req + architect for design refinement. Awaiting req-eng anchor confirmation → architect design → expert impl → tester verify → Tron QA.
- 2026-06-01 **robbin-req (refinement):** B6 verbatim confirmed at lines 37-41 — matches backlog.md verbatim exactly. `requirement:uuid:f7a8b9c0` at line 35 confirmed. Bug-AC (AC2: stale name) and architecture-AC (AC1: User as scenario unit, AC3: ViewBus-only updates) are already cleanly separated — no split needed. Scope note: AC4 (chain audit shows User first-class) requires `/md/scenarios/sprints.md/user/` path — architect to confirm whether User units get their own class folder or live under the sprint's units. No scope drift detected. Req refinement complete — ready for architect.

## Subtasks

None (single commit-set).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 9 (User class scenario-unit + ViewBus model parity)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 3 (eliminates the bug class; standardizes the last data-shaped class on the S17 model)*
