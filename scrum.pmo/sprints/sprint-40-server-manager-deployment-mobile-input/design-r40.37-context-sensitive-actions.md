# R40.37 — Context-sensitive actions (architect design, 2026-08-12)

Req a3cdb98a / Task 2e831ffd. UCs: **1de961e7** universalActionBar.applicableActionsFor · **0c58eb53** folder.createPhysicalWithUnit. Design-only. Honours PO constraints: per-action applicability resolved ONCE in the shared bar (never per-view if-chains) · hide-vs-disabled-with-reason · diagrams special BY CONSTRUCTION (a kind on the unit, not a name-match) · add-folder = physical dir + unit ATOMIC, fail-closed both ways · server guards STAY (defense-in-depth) · gate = BITE per (type,status) + stub-must-fail + Tron @390.

## Measured current state
- Actions come from TWO type-conditional providers, both `registerActionProvider` on the shared drawer bar: `universal-actions.ts` `universalActionsFor(type)` (member/file/webitem/task → bespoke + qa-approve/decline/pin) and `model.ts` `ACTIONS_BY_TYPE`/`DEFAULT_ACTIONS`/`actionsForContext(type, hasActiveDiagram)` (add-diagram/add-folder/import-puml + element verbs).
- NO status/kind applicability. **Task returns qa-approve/qa-decline UNCONDITIONALLY** (universal-actions.ts:24) → offered on a Done task → clicked → server 409 (the AC2 bug). Container actions sit in `DEFAULT_ACTIONS`/`ACTIONS_BY_TYPE['diagram']` → can surface off-context (AC3). "diagrams" is keyed by unit TYPE, not a container KIND (AC4).

## Design — one declarative applicability, resolved once (UC 1de961e7)
Replace the type-conditional providers' GATING with a **per-action applicability declaration**; providers only SUPPLY declarations, the shared bar RESOLVES once.
```ts
type ActionDecl = {
  verb: string; label: string;
  appliesTo: {
    types?: string[];     // valid unit types (omit = any type)
    statuses?: string[];  // valid unit statuses (omit = any status)
    kinds?: string[];     // valid container KIND (structural field on the unit, NOT name-match)
    when?: (ctx) => boolean; // optional extra predicate (e.g. hasActiveDiagram)
  };
  onInvalid: 'hide' | { disabledReason: string };  // hide-vs-disabled-with-reason
};
// [impl] UniversalActionBar.applicableActionsFor(unit, ctx): {offered:ActionDecl[]; disabled:{decl,reason}[]}
```
**`applicableActionsFor(unit, ctx)`** computes, for the selected unit, each declared action's applicability from `appliesTo` vs (unit.type, unit.status, unit.kind, ctx). Applicable → OFFERED (visible+enabled). Not applicable → HIDDEN or DISABLED-with-reason per `onInvalid`. **This is the ONE resolution point — no per-view if-chains; the two providers become declaration lists.**

### hide-vs-disabled-with-reason RULE (AC1)
- **HIDE** when the action is STRUCTURALLY N/A (wrong type — approve on a File; container actions on a Task) OR terminally-blocked with no path to enable (approve on a **Done** task — Done is terminal → AC2 requires ABSENT).
- **DISABLE-with-reason** when the block is TRANSIENT and the reason helps (right type, not-yet-eligible status the unit can still reach) — surfaces "possible but not now, because X".
- Declared per action (`onInvalid`); default HIDE. This satisfies AC2 (approve/decline `onInvalid:'hide'` on non-QA-Review) while allowing disabled-with-reason where it aids the user.

### The declarations (replacing the current maps)
- `qa-approve` / `qa-decline`: `appliesTo:{types:['task'], statuses:['QA Review']}`, `onInvalid:'hide'` → **AC2** (absent on Done). ★ ANTI-DRIFT: the `['QA Review']` status set = the SAME rule the server gate enforces (approve 409s unless QA Review). Put that rule in ONE shared module (e.g. `task-status.ts` `APPROVE_STATUSES`) imported by BOTH the declaration AND the server gate → the affordance and the guard cannot drift (correct-by-construction). The client declaration is the AFFORDANCE; the server stays the AUTHORITY.
- `add-diagram`: `appliesTo:{kinds:['diagrams']}` → **AC4**: offered ONLY on the diagrams container.
- `add-folder` / `import-puml`: `appliesTo:{types:[<container/model types>]}` excluding `task` → **AC3** (not on a Task).
- bespoke (vcard/preview/newtab/proxy): `appliesTo:{types:[...]}` as today, now declared not if-chained.
- membership verbs (add-to-diagram/discover/remove): `when: ctx => ctx.hasActiveDiagram` (the existing R33.9 flag, now a declared predicate).

## Design — diagrams as a typed container BY CONSTRUCTION (AC4)
Add a structural **`kind: 'diagrams'`** field on the diagrams-container unit, SET AT CREATION (a special container type/kind, distinct from a generic Folder). `add-diagram.appliesTo.kinds=['diagrams']` matches on that field — **never `name === 'diagrams'`**. Generic folders (kind absent / `folder`) never offer Add-Diagram. Diagrams container is minted with the kind; existing one gets the kind set by the R40.37 migration (or on next generate).

## ★ AC5 CORRECTION (measured 2026-08-12): model folders are VIRTUAL store-units — no filesystem dir
MEASURED: `createFolder` (28000b00, server.ts:1145) is UNIT-ONLY — mints an `ior:class:Folder` unit into `data/model-store/index` (prod scenario/index untouched); Folder unit fields = uuid/name/parent/children, **NO physical-path field**. So a model folder has NO filesystem-dir substrate; "resolve+validate a physical path" has no defined root (the expert is RIGHT not to guess — guessing = mkdir in the wrong place). RULING: **"physical" here = the committed store-UNIT appearing IMMEDIATELY (no draft/save step)** — the real AC5 intent is one-step-no-save, not a second filesystem artifact. So `FolderService.createPhysicalWithUnit` = **one atomic store-unit write** (write the Folder unit → return it → itemview renders in one step); fail-closed = write-or-nothing (no orphan draft). There is NO separate mkdir, so no orphan-dir class exists to roll back. IF Tron LITERALLY wants a real filesystem directory (per the AC wording "physical folder AND its unit"), that is a DISTINCT capability needing a defined physical-root + parent-anchor — a separate requirement (flag to Tron), NOT guessable. The block below (mkdir+rollback) is SUPERSEDED by this for the virtual-folder reality; keep it only if Tron rules real-dirs.

## Design — (ONLY IF Tron rules real filesystem dirs) Add folder creates physical dir + unit ATOMICALLY (UC 0c58eb53, AC5)
New server op behind an owner/membership-gated endpoint (guard STAYS): **`FolderService.createPhysicalWithUnit(parentRef, name)`**:
1. Resolve+validate parent + target physical path (reject traversal/dupe — fail-closed).
2. `mkdir` the physical folder.
3. Mint the Folder scenario unit (parent link, `kind:'folder'` or `'diagrams'` as appropriate) via ScenarioIndex.put.
4. **Atomic / fail-closed BOTH ways:** if mkdir fails → NO unit (return error, nothing created). If unit-put fails AFTER mkdir → `rmdir` the just-made physical dir (rollback) → return error. Never a physical dir without a unit, never a unit without its dir.
5. Return the new unit → the client `add-folder` handler inserts it into the itemview in ONE step (no separate save) → AC5.
Client: `addFolder` POSTs, receives the unit, renders it as the new folder immediately.

## Server guards STAY (constraint) — layering
The applicability declaration is a CLIENT AFFORDANCE only. Every server guard REMAINS: approve-409-unless-QA-Review, owner/membership gates, folder-create auth + path validation. R40.37 ADDS the "don't offer the impossible" layer; it NEVER deletes a guard to fix an affordance. Defense-in-depth: affordance hides it, server refuses it anyway.

## Chain (units to mint)
- UC 1de961e7 → **Class UniversalActionBar** → **Method applicableActionsFor** → Impl (design-ahead until built).
- UC 0c58eb53 → **Class FolderService** → **Method createPhysicalWithUnit** → Impl (design-ahead).
(architect mints the 2 Class + 2 Method units + wires; expert builds + places [impl] markers; req/tester supply Tests.)

## Gate (AC6 + PO)
- **BITE per (type,status)** — a matrix test: for each (unit-type × status) assert the OFFERED set == the declaration's expectation. Key cells: task+`Done`→{no approve/decline, no container}; task+`QA Review`→{approve,decline present}; task+`In Progress`→{approve/decline hidden}; diagrams-container→{add-diagram present}; folder→{add-diagram ABSENT}; file→{preview,newtab}; task→{no add-folder/add-diagram/import-puml}.
- **stub-must-fail ON THE CHECK:** mutate a declaration (e.g. approve `statuses:[]`→any) → the BITE goes RED; the folder-create rollback: force unit-put to throw → assert the physical dir was rmdir'd (no orphan). A gate that can't catch the regression certifies nothing.
- **NARROW orphan-check (this conversion only, PO-split):** assert THIS R40.37 diff left NO marked-but-uncalled-AND-unsuperseded method behind — specifically `actionsForContext` (a1a5be99) is retired WITH a `supersededBy → applicableActionsFor 4018e773` record (SUPERSEDED-honest, not orphaned), and no other `[impl:uuid]` method-marker in the diff lost its last caller without a supersede. Scoped to the R40.37 change (immediate, proves what we just did). The FLEET-WIDE version is a separate OUTSIDE requirement (report-only→strict-when-0).
- **Tron @390** (AC6, device-only, un-mockable): the impossible buttons are GONE (Approve absent on a Done task) on his phone.
