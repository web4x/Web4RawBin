# The Object-Action Mechanism — OOP DRY MVC (robbin-architect, 2026-09-06)

Tron verbatim: **"the solution MUST BE OOP DRY MVC."** Tonight's two needs — MOVE a file into a folder, RENAME a file/folder — are the SAME pattern: **the object acts on itself**. Build them as one mechanism or we rebuild the duplication we spent the night deleting. Design-only; hand to expert; incremental (expert is the sole builder).

## ★ VERDICT (PO asked: extend or new?): **THIS EXTENDS R33.9. No parallel mechanism.**
Measured — the action-context lifecycle ALREADY EXISTS and is the seam I build on:
- **R33.9 `actionsForContext`** = the action-context LIFECYCLE (which verbs apply for the current context: unit-always / membership-when-diagram-active). It **already lists rename as a verb** + carries removeFromDiagram; R34.3 added add-folder/remove/delete "same lifecycle discipline."
- **`RbDetailDrawer.registerActionProvider(fn)`** (R34.7/R33.6.5) = the self-registering provider REGISTRY (the OFFER/declaration side, already unified across all 7 drawer usages, no fork). `action-applicability.ts applicableActionsFor` resolves visibility once.
- **So R33.9 COVERS:** the lifecycle + the provider registry + the verb declarations (incl rename). I EXTEND it by (a) letting each CLASS register its OWN actions (move/rename) through that same `registerActionProvider` seam, and (b) closing the one gap R33.9 does NOT cover — see below.
- **R40.104 (069b1f8d)** owns the rename BEHAVIOUR (the naming law); my mechanism DISPATCHES the rename verb to it — it is not re-specified here.

## ★ THE ONE GAP R33.9 DOES NOT COVER (the only genuinely-new piece)
The OFFER side is a registry; the **INVOKE side is a central switch.** `universal-actions.ts handleUniversalAction` (L41-90) is `if (verb==='add-folder')… if (verb==='qa-approve')…` — every new verb edits it. R33.9 unified *which verbs show*; it did NOT unify *how a verb runs*. **Command completes the registry the R33.9 declarations already started** — this is the extension, not a new system.

## Patterns (named, cited)
- **Command** (GoF): each action is a Command — `{ verb, run(ctx) }`. This replaces the central `if (verb === …)` dispatch chain in `universal-actions.ts` (L41-90) — that switch is the defect.
- **Self-registering Registry** = the EXISTING `RbDetailDrawer.registerActionProvider` / R33.9 `actionsForContext` seam (same family as mime `DropDispatcher.register` and render `ViewTemplateRegistry.register`): each CLASS registers its own actions there at module load — extend the seam, do not add a second one.
- **Open/Closed Principle** (SOLID): adding an action, an affordance, or a class = registration only; ZERO edits to any dispatch conditional.
- **MVC-in-the-object** (Tron): **model** = the unit knows its location (`parentFolder`) and its name (`derivedName`/`displayName`); **view** = the class renders itself AND its action surface (a folder picker renders folders by asking the **Folder** class / reusing tree rendering — never a bespoke list); **controller** = the Command lives with the object's class registration.
- **DRY, two affordances → one mechanism:** drag-drop AND the explicit menu both end in the SAME object method → the SAME proven `/api/room/<id>/move-unit` + `resolveDropContainer`.

## Design — one registry entry per action: `{ decl, run }`
`registerAction({ decl: ActionDecl, run: (ctx) => Promise<void> })` — carry the Command (`run`) ALONGSIDE the R33.9/`registerActionProvider` declaration the OFFER side already uses. Each class module registers its actions:
- `Folder` registers `move-into` (accept a dropped/selected unit) + `rename`.
- `File` (and every natural class) registers `move` + `rename` (inherited by registering a shared Command, not by copy).
- Existing verbs (add-folder, qa-approve, set-current, …) MIGRATE into registrations — incrementally.

`handleUniversalAction` becomes: `const cmd = actionRegistry.get(verb); if (cmd) return cmd.run(ctx);` — one lookup, **no switch**.

### MOVE (Command `move` / `move-into`)
- `object.move(targetFolderRef)` → `POST /api/room/<id>/move-unit` (EXISTS, drop-dispatcher.ts:90) + server `resolveDropContainer`.
- **Affordance A = drag-drop** (exists: rb-object-item → `acceptDropIntoContainer`). **Affordance B = explicit "Move…" menu** → a **folder picker that reuses the tree render** (asks the Folder class to render folders) → the SAME `object.move`. ONE Command, TWO affordances.
- ★ FIRST STEP for the expert: Tron reports move DOESN'T work today — REPRODUCE/measure why the existing drag→move-unit path fails (resolveDropContainer? move-unit? live re-render?) BEFORE adding affordance B. The mechanism design stands regardless; don't add a 2nd affordance onto a broken path.

### RENAME (Command `rename`; BEHAVIOUR = R40.104, 7 ACs) + the NAMING law
- The rename verb already exists in R33.9's list; the BEHAVIOUR is **R40.104 (069b1f8d)** — my mechanism dispatches to it, it is the owner of the naming law below.
- No rename endpoint exists — route rename through the EXISTING `UnitController.apply` seam (the ONE mutation entry), setting `model.displayName`. Do NOT mint a bespoke rename route (that re-forks the write path we unified).
- **Naming law — three DISTINCT names (R40.104 ACs), same identity law as VCard→Contact** (rename is a DISPLAY change, not identity): the class owns `name()` = `displayName ?? derivedName`.
  - `derivedName` = class-computed (reuse the `sprint-label.ts` derived-name discipline; the class names itself).
  - `displayName` = user-set, **WINS when present**.
  - `originalName` = preserved, **NEVER shown** (R40.104 AC), never overwritten.
  - **uuid/identity STABLE across rename** (R40.104 AC). Gate: rename changes `displayName` only; `uuid`+`ior` unchanged.
  - **Renders EVERYWHERE with NO reload** (R40.104 AC): rename via UnitController.apply → publishUnitChanged → live re-render (the same live-on-advance path), every surface that shows the name updates without refresh.
- **Affordance = "Rename…" menu** → inline edit → `object.rename(newName)` → UnitController.apply. Same registry, no new dispatch branch.

## Acceptance test (hold me to this)
1. A THIRD affordance (keyboard, context-menu) OR a 7TH class needs ZERO edits to action logic — **registration only**.
2. Both open/closed lints stay **0**: (a) grep 0 `verb === '…'` dispatch branches in universal-actions (all via `registry.get`); (b) grep 0 action-specific logic outside a class's own registration.
3. MOVE: drag-drop AND menu both invoke the SAME `object.move` → SAME `/api/room/<id>/move-unit` (one code path, exercised by both affordances).
4. RENAME: uuid STABLE across rename; `displayName` wins; `originalName` preserved; `derivedName` still computable.
5. The folder picker renders folders by reusing the tree render (asks the Folder class), not a bespoke list.

## Increments (for the expert @67%, sole builder)
- **INC-1 (structural, no behavior change):** the Command registry + migrate `handleUniversalAction`'s verb-switch → `registry.get(verb).run(ctx)`. Lint: 0 `verb===` branches. Proves the seam, kills the switch. (Lowest risk, highest leverage — do first.)
- **INC-2 (Move):** reproduce the current move failure → fix the ONE path → add the "Move…" affordance + folder picker (reuse tree render). Both affordances → `object.move`.
- **INC-3 (Rename):** `displayName` field via UnitController.apply + "Rename…" affordance + the naming law. Reuse derivedName discipline.
- Classes self-register (File/Folder first). No central list grows.

**No invented mechanism:** Command (GoF) + the registry that `action-applicability.ts` already is + the `move-unit` endpoint that exists + the `UnitController.apply` seam for rename + tree-render reuse for the picker.
