# Radical-OOP CLASS MODEL (architect, 2026-09-06)

Tron STANDING LAW, verbatim: *"ONLY RADICAL OOP IS ALLOWED FROM NOW ON. A ROOM IS A ROOM CLASS. A FILE IS A FILE CLASS. A UNIT IS A UNIT CLASS."* + *"YOU ARE ALL FUNCTIONAL APES AND KILLED ALL OF TYPESCRIPT"* — we write procedural JS with TS annotations: free functions taking refs+strings, mutating plain data, in a multi-thousand-line server.ts. **No Room owns its files, no Folder renders its children, no Unit resolves itself** — that void is why R40.84 happened (nobody was home to own "I gained a child, render me"; it smeared across re-seed + FILE_ADDED + upload + drop; deleting one exposed the void).

**THE RULE (every class):** a caller **ASKS THE OBJECT**; it never rebuilds the answer from a ref + external machinery. Free functions listed below **collapse INTO the owning method and are DELETED, not wrapped.** Design-only. R40.84-B ships as **Slice 1** (the class that owns children-rendering) so the live regression closes first.

---
## The classes (data owned · behaviour owned · free functions collapsed→DELETED)

### `Unit` (base for every scenario unit — the identity/resolution root)
- **Data:** ior, uuid, model, ownerIor. The ONE canonical record (post-R40.81: one store).
- **Behaviour:** `Unit.resolve(ior): Unit` (resolves itself — ONE owner, no store-fork); `children(): Unit[]` (its chain/trace children); `ref(): string`.
- **Collapses → DELETE:** `ensureViewUnit(ior)`, `resolveViewUnit(...)`, `isModelUnit(uuid)?MODEL_STORE:scenario/index` (the store-fork — becomes one `Unit.resolve`), `mofChildren(idx)` (→ `Node.children()`). (`isModelUnit` survives only as a provenance predicate for re-gen scoping, per R40.81.)

### `Node` (abstract — a tree node / container; the R40.84 owner)
- **Data:** its ref, its rendered DOM element, its child-node set, expanded state.
- **Behaviour:** `renderChildren()` — **asks** for its direct children (via the owning domain object's `children()`) and DOM-reconciles them **in place** (reflect-not-recompute, R40.83: no client re-derivation, no full rebuild); `onChildAdded(childRef)` — "I gained a child" → `renderChildren()`; subscribes to **its own ref** and re-renders on any unit-changed for it.
- **Collapses → DELETE:** `reDeriveDirectChildren(node, ref)` (→ `Node.renderChildren()`), `buildSeedNode(...)` / `buildDirectLayer(...)` (→ `Node` construction), `renderSeed(roomId)` full re-seed (→ each Node renders its own; the root is just a Node), `rb-object-item.refreshLive` child-portion, the `FILE_ADDED` handler's bespoke re-render, `RoomView.ts:215` federation `renderSeed` call.

### `Room` (a Room IS a Room class — Tron)
- **Data:** roomId, its members, its files, its collection dir.
- **Behaviour:** `files(): File[]` (**ask the room**, the ONE files derivation); `addFile(File)`; is-a container → renders its children via `Node`.
- **Collapses → DELETE:** `roomFilesChildren(idx, roomId, …)`, `isDirectChildOfNode(...)` room-arm, `getRoomDir(creator)/files` path assembly, room-collection ref handling.

### `Folder` (a Folder renders its own children + accepts drops)
- **Data:** its ref, parent, children (by parent-link OR location), physical dir (if any).
- **Behaviour:** `children(): (Folder|File)[]` (by parent-link for a model/collection folder, by location for a physical one — ONE predicate); `physicalDir(): string|null` (**the folder resolves its own dir**); `createChild(name)` (routes by its own physicality: model-store unit vs physical mkdir — the R40.87 branch becomes `Folder.createChild`); `acceptDrop(Unit)` (re-parent the dropped unit — R40.86, already `Folder.acceptDrop ced15069`).
- **Collapses → DELETE:** `folderChildrenUnder(nodeRef, dirRel, els, seen)`, `isDirectChildOfNode(...)` folder-arm, `resolveFolderRefToDir(rawRef)` (→ `Folder.physicalDir()`), `ModelView.addFolder` + `routeByParentPhysicality` (→ `Folder.createChild`), `mintRealUnit` / `createPhysicalWithUnit` / `createPhysicalFolder` / `createPhysicalDir` (→ `Folder.createChild` + `File.create` internals).

### `File` (a File IS a File class — Tron)
- **Data:** its bytes/metadata, parent (container ref), location.
- **Behaviour:** `File.create(container, name, bytes): File` (mint parented to a container — the ONE mint); `moveTo(container)` (re-parent — the in-app drop target of `Folder.acceptDrop`); `preview()`.
- **Collapses → DELETE:** `createFileUnit(...)` (→ `File.create`), the upload endpoint's inline mint, `resolveDropContainer` fork.

### `DndContract` (already minted this session, 822e663b — keep; it is already a class)
- Owns the ONE serializer+resolver (T37.20). Consumers ask it; every target BITEs the resolved `Unit`. Consistent with this model (already OOP). `serializeDragUnit`/`resolveDragUnit` are its methods, not free functions.

---
## Slice sequence (regression closes in Slice 1; then collapse outward — never boil-the-ocean)
- **★ SLICE 1 — `Node` owns children-rendering (CLOSES R40.84-B live regression).** Introduce `Node` with `renderChildren()` + `onChildAdded()` subscribed to its own ref. Collapse `reDeriveDirectChildren` → `Node.renderChildren()` (keep its FIX-2 childless-container create-`.tt-children` as the runtime case the method owns). **Delete** the federation `renderSeed` (RoomView:215) and the bespoke `FILE_ADDED` re-render → every add path (folder-add / upload / drop / federation import / room-collection / FILE_ADDED) publishes ONE event "container `<ref>` gained a child" → the owning `Node` renders its own children. The **3-line disambiguation still runs** inside `Node.renderChildren()` — it names WHICH runtime failure to handle (childless container not yet subscribed / node not in DOM), it does not shrink scope. Gate: every add path → child appears in place, one code path, no re-seed; **stub-must-fail:** reintroduce a per-caller rebuild → grep RED. This is R40.84-B, implemented as the class, not a patch.
- **SLICE 2 — `Folder`** owns `children()`/`physicalDir()`/`createChild()`/`acceptDrop()`: collapse folderChildrenUnder + isDirectChildOfNode(folder) + resolveFolderRefToDir + ModelView.addFolder/routeByParentPhysicality + the mint/mkdir family. (Absorbs R40.86/R40.87/R40.92.)
- **SLICE 3 — `Room`** owns `files()`/`addFile()`: collapse roomFilesChildren + isDirectChildOfNode(room) + getRoomDir.
- **SLICE 4 — `File`** owns `create()`/`moveTo()`: collapse createFileUnit + upload inline mint + resolveDropContainer.
- **SLICE 5 — `Unit`** owns `resolve()`/`children()`: collapse ensureViewUnit + the isModelUnit store-fork + mofChildren. **Converges with the paused R40.81 migration** (one store + `Unit.resolve` = the one canonical owner) — resume R40.81 here.

**Scope guard (Tron):** this is "put the behaviour on its rightful class + collapse its duplicates," NOT a rewrite; prod has a live regression, so Slice 1 ships alone and first. Each later slice deletes its named free functions — no second implementation survives (DRY: "fixed everywhere or it is a DRY violation").

## Handoff
Slice 1 → expert builds `Node.renderChildren()`/`onChildAdded()` + collapses the named add paths + deletes renderSeed(215)/FILE_ADDED-rebuild; I wire the chain (UC nodeContainer.renderOwnChildren → Class Node → Method renderChildren → Impl, reusing the existing 8693dc2b marker relocated onto the method); req mints Test; tester gates every add path + stub. I backstop each slice against this model. Later slices sequenced after Slice 1 lands + the regression is device-confirmed @390.
