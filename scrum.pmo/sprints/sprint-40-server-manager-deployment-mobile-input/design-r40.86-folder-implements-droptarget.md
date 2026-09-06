# R40.86 CORRECTED — Folder IMPLEMENTS DropTarget (architect, 2026-09-06)

Tron overruled the scope; **I was wrong** and own it: I designed "room folders IN / model-collection OUT" and called it *"a genuine boundary, not an omission."* It was **an omission wearing a boundary's clothes** — a per-surface carve-out, the SAME functional-construct defect we fixed three times today (two translators, flat-vs-nested children, divergent drop paths). Tron: *"a folder being a drop target is for every folder everywhere… OOP folder implements dropTarget."* This supersedes the `canAccept=false for ModelCollection` in design-r40.86-drop-target-container-unification.md.

## The axiom (capability belongs to the CLASS, not the surface)
**`Folder implements DropTarget`.** Every Folder — room folder, model-collection folder, the diagrams folder, a folder that does not exist yet — IS a drop target *by virtue of being a Folder*. This is the SAME shape as R40.88 (a guard/capability keyed to the CLASS, not "sometimes a button on some surface") and R40.86-render (one nesting RULE, not per-surface). A Folder does **not** get to answer "I can't accept" — the drop path never asks which surface it is rendered on.

## What was wrong with canAccept-false
`canAccept()` was doing two different jobs; only one is legitimate:
- ✗ ILLEGITIMATE: "this surface wasn't wired / the model store has no blob path" → false. That is a MISSING IMPLEMENTATION reported as a type answer — narrowing the interface to fit what we happened to build. **Killed.**
- ✓ LEGITIMATE (kept, narrowly): a genuine TYPE question — a non-container LEAF (a File, a Method) is not a Folder and therefore not a DropTarget at all. That is the OBJECT not implementing the interface, not a Folder refusing its own contract.
"The model store has no blob-create path" is **a capability to BUILD**, never a reason to exclude. The object must be able to honour the contract it implements; if it cannot yet, we build the capability, we do not narrow the interface.

## The contract
```ts
interface DropTarget {
  containerRef(): string;                 // this target's own ref (its folder ref) — the parent for anything dropped in
  acceptDrop(files: File[]): Promise<void>; // accept dropped content INTO this target; a Folder ALWAYS can
}
// Folder implements DropTarget ONCE. Every folder instance inherits it — room, model-collection, diagrams, future.
```
- **Client drop path (unchanged intent, now universal):** browser drop → resolve the target OBJECT from the drop-target element / selection → `target.acceptDrop(files)`. Polymorphic dispatch; NO surface branch, NO `if (roomFolder) … else if (modelCollection) …`. A leaf that is not a Folder simply is not a DropTarget (the drop is a no-op / rejected at the TYPE level, not by a Folder answering false).
- **`acceptDrop` routes to the ONE create path parented to this folder** — `createFileUnit(parent = this.containerRef())`. The STORAGE (room fileUnits vs MODEL_STORE) is resolved from the folder's OWN context (its location/roomUuid), inside the create path — not by the caller. The drop path is identical for every folder.

## BUILD the missing capability: model-store blob-create path
A model-collection folder (a store-only Folder unit under `rawbin:diagram` etc.) must accept a dropped file → the file becomes a **File unit in MODEL_STORE, parented to the folder** (mirrors the room path's `createFileUnit`, MODEL_STORE-scoped). This is the "missing implementation" Tron named — BUILD it:
- `createFileUnit` (or a thin sibling) accepts a MODEL_STORE target: mint a File unit `{parent: folderRef, location: <folder>/<name>, content/contentHash}` in MODEL_STORE (prod room stores untouched), publish for live-insert.
- RENDER already works for it BY CONSTRUCTION: a File unit parented to a model folder is surfaced by `folderChildrenUnder` (R40.92) via the shared `isDirectChildOfNode` (R40.86-render) — no new render path. So building the model-store CREATE completes the loop; the target renders inside the model folder + persists.
- Storage resolution (room vs model) lives in the ONE create path keyed on the folder's context — polymorphism inside the object's contract, not a caller carve-out.

## What to kill / change
- **Strike `AC-scope-room-files-not-model-blobs`** (req is striking it too — I'll confirm). It encodes the carve-out; delete it, replace with an AC that asserts the universal capability: *every Folder is a DropTarget; a drop into a model-collection folder mints a File unit under it and renders inside* (failable; stub: a model-folder drop that mints nothing → RED).
- The container-unification (drop path DRY, resolveDropContainer, one acceptDrop) STANDS — it is the mechanism; only the `canAccept=false for model` answer is removed and the model create path is built.
- iOS tap-select-as-container STANDS (how you point at the target differs by input; the target is still a Folder implementing DropTarget).

## ACs (failable, universal — no surface in them)
- **Folder-is-a-DropTarget by class:** the capability is on the Folder class/type, offered on EVERY folder surface (room / model-collection / diagrams / nested) with NO per-surface gate. Stub: add a surface-specific carve-out → RED.
- **model-collection drop SUCCEEDS + renders + persists:** drop a file on a diagrams/model folder → a File unit minted in MODEL_STORE under it (ONE unit), renders inside via folderChildrenUnder, survives reload. Stub: model create path absent → drop mints nothing / renders nowhere → RED.
- **no per-surface branch / no canAccept-false-for-unwired:** grep — the drop path calls the Folder's DropTarget contract; canAccept (if present) fires ONLY on a non-Folder type, never on a folder-by-surface. Stub: a Folder answering canAccept=false → RED.
- **one create, no double-mint** (carried); **@390 device** (Tron): drop onto a model folder + a room folder both land inside.

## Handoff
Expert: (1) define `DropTarget`; `Folder implements DropTarget` ONCE; (2) drop path → `target.acceptDrop`, retire any surface branch + the model canAccept-false; (3) BUILD the MODEL_STORE blob-create path in the ONE create path (storage resolved from the folder's context); (4) render rides folderChildrenUnder (built). req strikes AC-scope-room-files-not-model-blobs + adds the universal-capability AC; I wire Folder/DropTarget chain + verify. No parser touch. My apology stands on record — the carve-out was mine.
