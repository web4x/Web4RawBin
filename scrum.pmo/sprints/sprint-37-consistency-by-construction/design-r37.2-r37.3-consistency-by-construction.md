# R37.2 + R37.3 — Consistency by Construction (architect, 2026-09-06)

Sprint 37 goal (b86b53cc): *"the CurrentSprint pin + the sprint boards are GENERATED views that CANNOT drift; a FAIL-LOUD guard asserts pin==board==files, folded into ci:gates. Consistency owned by DESIGN, not vigilance (CMM4, not CMM2)."* Today the PO hand-caught — by vigilance — a lying board, a parked QA item, a stale migration hold, a circular gate, six credited SHELLs, and drove ~20 ad-hoc ownership lints. **That is the CMM2 mode this sprint exists to delete.** R37.3's guard is supposed to BE the thing that catches drift; instead a human was. Design R37.2 (generated board + one-time reconcile) + R37.3 (the ONE fail-loud pin==board==files guard + drift BITE). Not green-field — a CONSOLIDATION of the fragmented surface below.

## Measured surface — the disease is FRAGMENTATION (each drift has its own script)
Generators (units→views, already exist): `generate-sprint-md.ts`, `campaign-scoreboard-region.ts`, `approve-queue-region.ts`, `sprint-overview.ts`, `precommit-regen-sprint-md.ts`, `regenerate-views.ts`. Guards/audits (one per drift type): `consistency-strict.ts`, `check-pin-single-source.ts`, `buildorder-audit.mjs`, `checklist-chain-audit.mjs`, `overstatement-audit.mjs`, `qa-evidence-audit.mjs`, `impl-marker-audit.ts`, `release-tag-audit.mjs`, `check:sprint-md --check`, … (~20). ci:gates runs a subset. Each audit is a HAND-WRITTEN vigilance check for one way the board can lie — the ad-hoc shape of exactly what R37.3 should be ONCE, by construction.

## The ONE law (both requirements are facets of it)
**Every view is a PURE FUNCTION of the units: `view == f(units)`, byte-identical.** The units (Task status units, the CurrentSprint pin singleton, chain units) are the SOLE source of truth; the board, the sprint-md, the pin display, the campaign scoreboard, the approve-queue are all `f(units)`. If a view can only ever be a regeneration from units, it CANNOT drift — a board cannot claim something the units don't, because it is recomputed from them and asserted equal. Every ad-hoc audit becomes a corollary of this one invariant.

## R37.2 — the board IS a generated view (+ one-time reconcile-all)
1. **ONE generator, SOLE writer:** the board/sprint-md/overview/scoreboard/approve-queue are written ONLY by the generators (units→view). No hand-edit (the `<!-- GENERATED … DO NOT HAND-EDIT -->` banner becomes enforced, not advisory — see R37.3). The pin display is generated from the CurrentSprint singleton.
2. **One-time RECONCILE-ALL:** regenerate every board across all ~29 sprints from units in one pass, clearing accumulated hand-edit drift (the 29-sprint backlog the goal names). This is a gated migration: dry-run+count the per-sprint diffs (how many boards drifted, what changed), then apply; INV = after reconcile, every board == f(units) byte-identical. Preserve any genuinely-curated narrative regions via the existing region markers (campaign-scoreboard-region already does LIVE-region + curated-section separation) — regenerate the LIVE region, keep curated prose.
3. **Deliverable:** boards are generated + reconciled; hand-edits impossible-by-lint (R37.3).

## R37.3 — the ONE fail-loud guard: `pin == board == files` (+ drift-injection BITE)
Replace the ~20 ad-hoc audits with ONE guard `assertViewsAreRegeneration()`:
- **CORE ASSERT:** for every generated view, regenerate it in-memory from the units and assert **byte-identical to the on-disk view**. Any diff → RED, fail-loud, naming the sprint + the drifted line. This subsumes check:sprint-md, campaign-scoreboard drift, approve-queue drift, and every "the board says X but the units say Y" audit at once — because the board is FORCED to equal f(units).
- **pin==board==files specifically:** the CurrentSprint pin (singleton) resolves to the current task; the board's current-marker == that task; the task files' checkbox statuses == the units' statuses. One derivation, three surfaces, asserted equal.
- **Folded into `ci:gates`** (the un-skippable CI lane) — a drifted board = build RED, so drift cannot land.
- **★ DRIFT-INJECTION BITE (stub-must-fail):** the guard's own test hand-edits a board value (flip a status, change the pin) in a scratch and asserts the guard goes RED. A guard that can't prove it fails on injected drift is itself a SHELL (today's lesson: a green over nothing). The BITE proves the guard actually catches drift.
- **Retire/fold the ad-hoc audits:** each of the ~20 becomes either deleted (subsumed by view==regen) or a thin corollary; net FEWER scripts, ONE invariant.

## Why this is the whole day's fix in one construct
Every drift the PO caught by hand today — lying board, parked QA, stale statuses, six credited shells — is a case of `view != f(units)`. Under R37.2+R37.3 that state is unconstructable: the view is regenerated from units and CI asserts equality with a proven-failing BITE. **Consistency by DESIGN, not vigilance.** Same shape as the ownership lints we built ad-hoc today (scan-the-hazard, one owner) — but as the SYSTEM's guard, once, not one per defect. Connections: T37.20 (ONE DnD contract) is the same one-owner law for DnD; R37.4 (objects self-heal) is the self-heal-by-construction already ruled (emergent, no handshake); the today's ownership lints are R37.3 done piecemeal. We have been re-deriving S37 per-defect instead of building it.

## Build order + handoff
Build order (goal): R37.2 → R37.1 → R37.3 → R37.4. **Planner OWNS the board + builds R37.2 with me** (the generators are planner's domain); I design + backstop; tester builds the R37.3 drift-BITE; req mints the requirement ACs (view==f(units), pin==board==files, drift-BITE-must-fail, ci:gates-folded). **Priority: Tron's upload (capture→SLICE-A) OUTRANKS this — R37.2/R37.3 is designed now while the capture is pending; built when the P0 clears.** This design is the sprint's spine; the upload collapse (T37.20) rides the same law.

## ★★ R37.4 LIVE-MVC ENUMERATION — "the list IS the finding" (2026-09-06, PO/Tron)
Tron: *"the team still fails on using it as live mvc state changes like it works now on add folder."* Add-folder is the WORKING reference: server mutation → the ONE controller broadcasts → the owning ContainerNode re-derives its own children IN PLACE (R40.84). Every other state change must ride the SAME path.

**★ KEY FINDING (measured, reframes the ask): the ONE mechanism ALREADY EXISTS — the failure is BYPASSERS, not absence.**
- `UnitController.apply` (`src/ts/scenario/unit-controller.ts`, R37.11 "C4 SINGLETON 1 — EVERY unit mutation through the one controller", marker e3729f51) → injected `PublishFn` → server wires it to the UNIT_CHANGED wsClients broadcast (R37.12 `viewBus.emitUnitChanged`) → `live-bridge.ts` → `ViewBus.notify(type:uuid)` → the owning object re-derives (R37.4 `self-heal.ts`). This IS add-folder's path, generalized. R37.4/R37.11/R37.12 are PARTLY BUILT.

**RIDERS (server mutation flows through UnitController → publish → owner re-derive):** file-unit, folder, Room, WebItem, EmailIndex, message-unit, task-policy, AddressIndex, PhoneIndex, CompanyIndex (~10 unit types). add-folder + file-upload-view (R40.84) confirmed live-MVC.

**BYPASSERS (the gap — bespoke: rebuild / reload / separate endpoint, do NOT ride):**
| mutation | current handler | rides? |
|---|---|---|
| federation import | `RoomView.ts:215` **renderSeed** (full client rebuild) | ❌ bypass (re-seed, not owner-re-derive) |
| avatar change | `rb-avatar.uploadBlob` → `/api/avatar` base64-JSON (separate endpoint) | ❌ likely bypass (not via UnitController) |
| profile/vcard | `ProfileEditor` → `/api/vcard` base64-JSON | ❌ likely bypass |
| upload TRANSPORT | 4 client impls (SLICE-A) | ◧ view rides R40.84; transport bespoke (separate P0) |
| device-enroll / app-update | `location.reload()` | ✅ legit full-reload (not a unit-view mutation) |

**NEEDS-SCAN (honest unknowns — NOT asserting; a follow-up measurement owes these):** file/folder **delete**, **rename/move**, **member join/leave**, **room config change**. They may ride via Room.ts (a rider) or be bespoke — I have not definitively measured each, and today's lesson is do-not-assert-unmeasured. This scan is the enumeration's completion step.

**THE MECHANISM (already exists — route bypassers INTO it):** every mutation goes through `UnitController.apply` (which publishes on the owning ref by construction); the owning client object subscribes to its own ref and re-derives in place. RETIRE the bespoke handlers (federation renderSeed → owner re-derive; avatar/vcard → unit through the controller). Callers NEVER patch views — the object self-heals its own view (R37.4).

**GATE (tester, same 1→0 shape as the ownership lints):** count (a) unit mutations that do NOT flow through UnitController + (b) client view-rebuild/DOM-patch/reload paths OUTSIDE the owning object's re-derive == **0** (positional exceptions: the owner's own re-derive, legit full-reload for device-enroll/app-update). Failable: seed a bespoke handler → RED.

**CONVERGENCE (one law):** T37.20 (the drop contract carries a UNIT) + R37.4 (the unit changes → the owning OBJECT re-renders) are one law — a mutation publishes on the owner, the owner self-heals its view. The upload collapse, the board-as-generated-view (R37.2/R37.3), and this are the SAME one-owner/by-construction discipline at three layers. NEXT: complete the NEEDS-SCAN enumeration, then route each bypasser through UnitController + retire its bespoke handler. Priority: Tron's upload (capture→SLICE-A) still outranks; this is designed now, built as S37.

## ★★ R37.4 ENUMERATION — CORRECTED + tester-folded (2026-09-06)
Definition (tester, adopted so the counts reconcile): a live-MVC violation is a **MUTATION HANDLER that rebuilds** — NOT any `innerHTML`/initial render (tester rejected counting innerHTML=133 as over-broad; most are legit initial renders).

**TWO corrections to my first pass (honesty both ways):**
- **federation import RIDES — NOT a bypasser** (my earlier claim was a STALE read): RoomView.ts:216 shows the `tree.renderSeed` re-seed was DELETED (R40.84) → it now `ViewBus.notify(viewBusKey(roomcoll:<id>:files))` → the owning Node re-derives in place. Corrected.
- **FILE_ADDED RIDES** (RoomView:84, R40.84 — renderSeed removed, per-node in-place). Confirmed rider.

**BYPASSERS — MEASURED (tester's 8, a client-WS FLOOR, all RoomView.ts):**
ROOM_JOINED (:62 render), MEMBER_JOINED (:65), MEMBER_LEFT (:66), MEMBER_DISCONNECTED (:67), MEMBER_RECONNECTED (:68), HOST_CHANGED (:69) → renderMemberList(); ROOM_CONFIG_UPDATED (:73 render); ROOM_DELETED (:72 onLeave — arguably legit leave, flag for review). These mutate CLIENT arrays (`this.members`) + re-render, NOT via the unit path — members/room-config would need to be UNITS mutated through UnitController → publish → owner re-derives. + avatar (`/api/avatar`), vcard (`/api/vcard`) base64-JSON (bypass the unit path).
**Total bypassers ≥ 8 (client-WS) + avatar + vcard.** (8 is a FLOOR, not the total.)

**STILL GENUINELY UNMEASURED (do NOT assert):** file/folder **delete**, **rename/move** — NO FILE_DELETED/RENAMED/MOVED WS handler in RoomView (grep clean); IF they flow through UnitController (via Room.ts/file-unit riders) they RIDE, but that is UNCONFIRMED. + the server-side mutation seam (which server mutations bypass UnitController.apply). This is the enumeration's remaining scan.

**Design (unchanged):** members + room-config become UNITS mutated through UnitController → publish on the owning ref → the owning object re-derives; RETIRE the RoomView render()/renderMemberList() mutation-handlers (they become owner-self-heal subscribers); avatar/vcard → unit path. GATE: 0 mutation-handlers-that-rebuild outside the owner + 0 mutations-outside-UnitController; failable (seed one → RED).

## T37.20 AC COUNT — CORRECTED to 7 (req measured the unit json)
My first map said 6; **req measured the UNIT has 7** — I missed **AC-resolve-drop-payload-one-resolver** (dnd.resolveDropPayload = ONE canonical drop payload `application/rb-object-ref` + ONE shared RESOLVER/deserializer, UC e3fcf5b3). `AC-shared-contract` = the SERIALIZER/fleet-wide half; `AC-resolve-drop-payload` = the RESOLVER/CONSUME half — distinct sides of the contract, both core. ★ NOTE: the generated task-md shows 6 while the unit has 7 = a live `view != f(units)` drift — the EXACT R37.3 disease, caught in our own board. SLICE-A still closes AC-A2 + AC-shared-contract (upload serialize side); the RESOLVER AC (deserialize/round-trip) stays in the core wiring, must not be dropped. Corrected core = 7 ACs.
