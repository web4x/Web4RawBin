[Back to Sprint 17 Planning](./planning.md)

# T145: User class as scenario-unit + ViewBus-driven view updates (fixes lobby/room name stale)

[task:uuid:df4ea98b-b47c-4129-be73-a4047e919a6f]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — `ccca722` req confirm + `83099ea` architect design)
  - [ ] creating test cases
  - [x] implementing (`f549114` v0.5.41 — rule-pair (a)+(b) ✓: package.json + sw.js CACHE_NAME both bumped to v0.5.41)
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — sequence req → architect → expert → tester:**
1. **robbin-req** — anchor the verbatim Tron quote (B6 in `scrum.pmo/backlog.md`); split into a bug-AC (stale name in lobby + on first room enter) and an architecture-AC (User → scenario model + ViewBus) if it helps clarity; confirm no scope drift; formalize the `requirement:uuid` link below
2. **robbin-architect** — design User as a scenario class on par with Requirement/UseCase/Task/Class/Method/Test/TraceLink: scenario JSON schema, ClassLoader, ScenarioIndex membership, ViewBus subscription pattern, View template, FSM (if applicable — likely simpler than Task FSM since User is data-shaped not workflow-shaped); decide how ProfileEditor/RoomBrowser/RoomView/rb-member-badge become Views in the ViewBus model; specify the back-fill / migration of existing user JSONs to the scenario-unit form (T128.x pattern)
3. **robbin-expert** — implement per architect's design: new User scenario class + loader + index + template + view-bus wiring; mutate via `model.user` only; migrate existing user JSONs; remove the special-case refresh paths that exist today; carry rule-pair (a)+(b) in the impl commit-set
4. **robbin-tester** — verify the stale-name bug fixed across all surfaces (lobby name input, in-room member badge, profile sheet, vCard re-export); chain audit shows User as first-class scenario unit; regression on Sprint 9 (room identity) + Sprint 17 (other scenario classes)

**This file is the single source of truth.** No chat clarification.

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

## Test Scenarios
File: `test/vitest/user-scenario.test.ts` (new) + `test/e2e/user-name-refresh.spec.ts` (new) + visual.

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Open lobby; edit profile name; save | Lobby name input updates immediately (no reload) |
| TS2 | Open lobby; edit profile name; immediately enter a room | In-room member badge shows new name (no reload) |
| TS3 | Upload vCard with new name | Lobby + room views show new name |
| TS4 | Two clients in a room; client A renames; client B sees the badge update | Cross-client propagation via existing room WS + ViewBus (architect decides scope; may defer to follow-on) |
| TS5 | Chain audit | User class first-class; no orphans; tree audit clean |
| TS6 | Sprint 9 regression: open an existing room | Owner name renders correctly |
| TS7 | S17 scenario class regression | Other classes (Requirement/Task/UC/etc.) unaffected |
| TS8 | Rule-pair post-bump | New CACHE_NAME activates; refresh reaches Tron's device |

## Dependencies
- **Requires:** T125 (foundation: Unit + IOR + ClassLoaders + ScenarioIndex + ViewTemplateRegistry), T126 (templates — adds an 8th), T136 (Req+UC migration pattern — T145 follows for User), T143 (chain → tree — User joins as a new class node)
- **Coordinate-with:** T146 (requirement format reform may overlap on the User scenario's documentation surface)
- **Enables:** future User-related data changes propagate automatically; eliminates the bug class

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** anchors B6's verbatim Tron quote here (already pasted above — req confirms); splits bug-AC vs architecture-AC if useful; closes any scope ambiguity with PO
2. **robbin-architect** designs: User scenario JSON schema; UserLoader; index membership; template; ViewBus subscription pattern across the 4 view bindings (RoomBrowser, RoomView, rb-member-badge, ProfileSheet/Editor); back-fill migration plan; whether User has a simple FSM or is data-shaped; writes the Design section here
3. **robbin-expert** implements per the design in one commit-set; carries rule-pair (a)+(b)
4. **robbin-tester** runs TS1–TS8 + visual + S9/S17 regression; commits the verification report into the QA Audit section

## Definition of Done
- [ ] All AC met (AC1–AC9)
- [ ] Rule-pair (a)+(b) ✓; (c) STATIC_SHELL if applicable
- [ ] No regression on S9 or S17
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-06-01: PO directed planner to lift T145 from backlog packet (B6) per Web4Articles + 4-role + real v4 uuids. CMM4 4-role engagement enforced (learnings #18); rule-pair (a)+(b) baked into AC7 + DoD (learnings #15+#16). Coordinate with req + architect for design refinement. Awaiting req-eng anchor confirmation → architect design → expert impl → tester verify → Tron QA.
- 2026-06-01 **robbin-req (refinement):** B6 verbatim confirmed at lines 37-41 — matches backlog.md verbatim exactly. `requirement:uuid:f7a8b9c0` at line 35 confirmed. Bug-AC (AC2: stale name) and architecture-AC (AC1: User as scenario unit, AC3: ViewBus-only updates) are already cleanly separated — no split needed. Scope note: AC4 (chain audit shows User first-class) requires `/md/scenarios/sprints.md/user/` path — architect to confirm whether User units get their own class folder or live under the sprint's units. No scope drift detected. Req refinement complete — ready for architect.

## Design (robbin-architect, 2026-06-01)

### 1. User as 8th scenario class

Add to `src/ts/scenario/classes.ts`:
```typescript
export const UserLoader = loader('User', {
  displayName: '', token: '', avatarHash: '', deviceId: '',
  sshPubKey: '', createdAt: '', updatedAt: '',
});
```
Register in `ClassRegistry.boot()` alongside the existing 7+TraceLink.

### 2. ViewBus — new module

New file: `src/public/ts/ViewBus.ts`
```typescript
type Listener = (model: Record<string, unknown>) => void;

class ViewBus {
  private subs = new Map<string, Set<Listener>>();

  subscribe(classType: string, uuid: string, listener: Listener): () => void {
    const key = `${classType}:${uuid}`;
    if (!this.subs.has(key)) this.subs.set(key, new Set());
    this.subs.get(key)!.add(listener);
    return () => this.subs.get(key)?.delete(listener);
  }

  publish(classType: string, uuid: string, model: Record<string, unknown>): void {
    const key = `${classType}:${uuid}`;
    for (const fn of this.subs.get(key) ?? []) fn(model);
  }
}

export const viewBus = new ViewBus();
```
Lightweight singleton pub/sub. No framework dependency.

### 3. Four view bindings

| View | File | After T145 |
|------|------|------------|
| **Lobby name** | `RoomBrowser.ts` | `viewBus.subscribe('User', uuid, m => nameInput.value = m.displayName)` |
| **Room badge** | `rb-member-badge.ts` | `viewBus.subscribe('User', uuid, m => this.name = m.displayName)` |
| **Profile editor** | `ProfileEditor.ts` | `viewBus.publish('User', uuid, updatedModel)` on save |
| **Chat name** | `RoomView.ts` | `viewBus.subscribe('User', uuid, m => badge.name = m.displayName)` |

### 4. Save flow
```
ProfileEditor.onSave()
  → scenarioIndex.get(userUuid).model = { ...updated }
  → viewBus.publish('User', uuid, model)
  → all 4 views update. Zero special-case refresh.
```

### 5. User scenario JSON
```json
{ "ior": "ior:class:User",
  "model": { "uuid": "<v4>", "name": "donges", "displayName": "Marcel Donges",
    "token": "<token>", "avatarHash": "<sha256>", "deviceId": "<v4>",
    "sshPubKey": "ssh-ed25519 ...", "createdAt": "...", "updatedAt": "..." },
  "ownerIor": null }
```
No FSM — data-shaped, not workflow-shaped.

### 6. Migration
Existing `data/users/<token>/profile.json` → scenario envelope → `scenario/index/<prefix>/<uuid>.scenario.json` + symlink at `scenario/sprints.json/user/<speaking-name>.scenario.json`. Original profile.json untouched (backward compat).

User units get own class folder: `scenario/sprints.json/user/` and `scenario/sprints.md/user/` (AC4 confirmed — same as requirement/task/usecase/class/method/test).

### 7. 8th template
```typescript
export const UserTemplate: ViewTemplate = {
  toHtml(m) { return `<div class="sv-user"><h3>${esc(m.displayName)}</h3><code>${esc(m.token?.slice(0,8))}</code></div>`; },
  toMd(m) { return `# ${m.displayName}\nToken: \`${m.token?.slice(0,8)}\`\n`; },
};
```

### 8. Cross-client (TS4)
Existing PROFILE_UPDATED WebSocket broadcast → receiving client calls `viewBus.publish('User', uuid, newModel)`. No new WS message type.

### No new routes, no STATIC_SHELL change.

## Subtasks
None (single commit-set).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 9 (User class scenario-unit + ViewBus model parity)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 3 (eliminates the bug class; standardizes the last data-shaped class on the S17 model)*
