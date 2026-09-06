# R37.20 — ONE shared DnD drop contract (architect design, 2026-09-06)

The T37.20 chain's pending architect design (task ae01f065, R37.20 03e0f803, UC `dnd.carryUnitPayload` 5474886a; Tron 2026-08-12, NOT STARTED). **This is the canonical home.** R40.86 (in-app drag onto folder) and my paused payload-branch design REARRIVE here — a folder is just ONE drop target that must reuse this contract. **Check-before-create failure owned:** I dispatched a parallel R40.86 design without searching for this existing home; the payload-branch (files vs `application/rb-object-ref`) IS a per-payload ad-hoc format = exactly what AC-shared-contract-fleet-wide forbids. That framing is KILLED. Design-only, scenario-first.

## Measured fleet fragmentation (the disease T37.20 names)
FOUR drop targets, four different read strategies, URL fallbacks everywhere:
- **Serializer** rb-object-item.ts:158-163 writes `text/plain = #type.show?uuid=` (a *.show URL — **AC-A2 violation**, = the `#collection.show`/`#webitem.show` Tron saw) + `text/uri-list = /app#hash` + `application/rb-object-ref` + `application/rb-federated-ref`.
- **Resolvers, each per-target:** RoomView.ts:211-246 (rb-federated-ref → uri-list/text-plain → **parses text/html href/anchor** = URL soup); rb-object-item.ts:81 (**`dataTransfer.files` ONLY** → discards `application/rb-object-ref` → the R40.86 silent no-op); rb-diagram-detail.ts:243 (`rb-object-ref || text/plain`); ProfileEditor.ts:134 (`files[0]`).
- This is "per-target format + URL fallback" precisely. A fifth ad-hoc branch (my payload-branch) would have deepened it.

## R40.86 finding folded in as EVIDENCE (not a parallel design)
Measured root of Tron's iPhone in-app-drag no-op: drop (rb-object-item.ts:81) reads only `dataTransfer.files`; an in-app drag carries the payload in `setData('application/rb-object-ref')` (onDragStart:150) with NO `.files` → `files.length===0` → silent no-op. dragover fires + folder highlights (iOS delivers to the nested target). This is a per-target resolver reading the wrong slot — exactly the defect the ONE resolver eliminates. (design-r40.86-in-app-drag-into-folder.md is SUPERSEDED by this doc.)

## The contract (ONE serializer + ONE resolver, no per-target format, no URL fallback)
### ONE serializer — `serializeDragUnit(dt, unitRef | unitRefs[])`
Every drag source (tree / diagram / room / editor) calls it. Writes the scenario **UNIT identity** into the buffer under ONE canonical type `application/rb-unit` (the resolvable unit ref/ior + uuid; multi-select = list). **NEVER a *.show URL / webitem.** A `text/plain` slot MAY carry the bare **unit ref** (`ior:…`/uuid) as a cross-app + iOS fallback the resolver can read — **never** a `#*.show` URL. The `#type.show` hash serialize is DELETED (AC-A2). (federated-ref stays only for genuine cross-origin, T26.2 — still a unit ref, not a URL.)

### ONE resolver — `resolveDragUnit(dt): { units: UnitRef[] } | { mintFrom: File[] }`
Every drop target calls it, in this fixed order — **never a URL/href parse**:
1. `application/rb-unit` present → the unit(s). (canonical)
2. else `text/plain` = a bare unit ref → the unit(s). (iOS custom-MIME strip fallback)
3. else `dataTransfer.files` present → **external OS file: no unit yet → MINT one, then ride the same contract.** The only legitimate second input; converges immediately to "a unit."
4. else (touch, buffer stripped) → `selectionModel.getSelected()` (the shipped tap-select complement).
RoomView's `text/html` href/anchor parsing is DELETED (AC-shared-contract: no URL fallback).

### Every drop target BITEs on the resolved UNIT
`resolveDragUnit` → unit(s) → per-target action: **folder re-parents the unit into itself** (Folder-implements-DropTarget = "a folder accepts a UNIT"); diagram adds-view; room places; editor inserts. Render delegates to the target's existing mechanism (folder → R40.84 reDeriveDirectChildren). No target reads the buffer directly; none has its own format.

## ACs (map 1:1 to T37.20; each must be able to FAIL)
- **A1 file-drags-as-file** — a file drag carries a File-unit, not a collection/webitem.
- **A2 buffer-carries-unit** — payload = unit ref/JSON, NEVER a `*.show?uuid=` URL, ALWAYS. stub: emit `#type.show` → RED.
- **A3 details-render** — every /model tree selection's detail renders (the resolved unit resolves to a real detail).
- **shared-contract-fleet-wide** — grep: ONE serializer + ONE resolver; 0 per-target `getData`/`setData` outside them; 0 URL/href parse in any drop handler.
- **BITE-per-target-stub-must-fail** — diagram/room/tree(folder)/editor each BITE; emit-URL-again OR read-files-only-again → RED (folder-in-app-drop is the R40.86 bite).
- **DEVICE @390 (Tron)** — in-app drag (existing file onto folder) lands + file drags as file + details render, on device. The gate MUST exercise a real in-app buffer (`application/rb-unit`, no `.files`) — the miss that let R40.86 survive.

## Chain (scenario-first #126)
UC `dnd.carryUnitPayload` (5474886a) → Class `DndContract` (new — the serializer+resolver home; NOT DropDispatcher, which is the upload mechanism) → Methods `serializeDragUnit` + `resolveDragUnit` → Impl (new module src/public/ts/dnd-contract.ts). Every drag source/drop target routes through it. R40.86's `Folder.acceptDrop` (ced15069) becomes a CONSUMER of `resolveDragUnit` (re-parent the resolved unit). I wire the chain on build-go; req mints Test; expert builds; tester BITEs per target + device @390. **No new store / no MODEL_STORE (R40.81-consistent).**

## Driver recommendation
**T37.20 should be the DRIVING task; R40.86 RIDES it** (a folder is one drop target reusing the ONE contract). The paused R40.81 migration stays paused. Retiring the four ad-hoc resolvers + the *.show serialize is the fleet-wide fix; R40.86's folder-drop is one BITE of the same contract, not a separate feature.
