# R40.86 — folders are drop targets (architect design, 2026-09-05)

Task T40.86 `b60afb24`, req R40.86, UC `af1bf20b` folder.acceptDropIntoContainer. Chain already wired (my earlier commit): UC → Class DropDispatcher `3fca4816` → Method `acceptDropIntoContainer a81ed3db` → Impl `75edb563` (designAhead — flip to BUILT on ship). **Design-only; hand the expert the exact shape.** Dependencies now satisfied: R40.84 `reDeriveDirectChildren` (in-place children refresh) live v0.8.183 + R40.92 `folderChildrenUnder` (parent-linked child render) — a dropped item will actually RENDER in the target folder.

## Measured mechanism (the pieces already exist — reuse, don't fork)
- `DropDispatcher` (drop-dispatcher.ts) = the ONE drop router; `uploadFile(file, roomId, token, relatedFileUuid?)` (:53) POSTs `/api/room/<roomId>/upload`.
- Upload endpoint (server.ts:2655) mints via **`createFileUnit(idx, {name, content, mimeType, uploaderToken, fsKey, roomUuid}, publishUnitChanged)`** — it does NOT pass `parent`, so uploads land at ROOM ROOT.
- `createFileUnit` ALREADY accepts `parent` — the room add-folder path (server.ts:2573) passes `parent: parentIor` + `location: roomcoll:<room>:files/<path>` to nest a folder. **The upload path just never passes it.**
- `rb-object-item` (the ONE tree-node component) is attribute-driven (`ref`/`type`) with existing drag machinery (iconDrag/dragGhost/drag) — a folder node already knows its own `ref`. No drop-target handler exists on it yet.

So R40.86 = (a) make folder nodes accept a drop and capture their own ref as the target parent; (b) thread that parent through the ONE upload→createFileUnit path; (c) let R40.84 render it in place. NO new mint, NO new derivation.

## The shape (expert builds)
### 1. Client — folder nodes become drop targets (rb-object-item)
On a `type==='folder'` item, add `dragover` (preventDefault + `dropEffect='copy'` + a drop-highlight class) and `drop` handlers. On drop, read the node's OWN `ref` (the target folder) + `e.dataTransfer.files`, and call the ONE drop router:
```ts
// folder-only; the node's ref IS the target container
this.addEventListener('dragover', (e) => { if (this.getAttribute('type') !== 'folder') return; e.preventDefault(); e.stopPropagation(); e.dataTransfer!.dropEffect = 'copy'; this.classList.add('drop-target'); });
this.addEventListener('dragleave', () => this.classList.remove('drop-target'));
this.addEventListener('drop', (e) => { if (this.getAttribute('type') !== 'folder') return; e.preventDefault(); e.stopPropagation(); this.classList.remove('drop-target');
  const files = [...(e.dataTransfer?.files ?? [])]; if (files.length) void dropDispatcher.acceptDropIntoContainer(files, this.getAttribute('ref')!); });
```
`stopPropagation` so the folder drop does NOT also fire the room-root drop zone (RoomView dz) = exactly ONE acceptance.

### 2. DropDispatcher.acceptDropIntoContainer (Method a81ed3db) — ROUTE, then DELEGATE
```ts
// [impl:uuid:75edb563] a folder is a drop target: route each file through the ONE upload→createFileUnit path with the
// target folder as parent; the IN-PLACE render DELEGATES to R40.84 reDeriveDirectChildren (via the upload's publishUnitChanged) —
// DropDispatcher carries NO 2nd containment/add path (req root-lens guard, LAW-8).
async acceptDropIntoContainer(files: File[], targetFolderRef: string): Promise<void> {
  const { roomId, token } = this.dropContext();          // same room context dispatch() uses
  for (const f of files) await this.uploadFile(f, roomId, token, { intoFolder: targetFolderRef }); // ONE mint per file, parent=folder
  // NO client re-derive here — the server publishUnitChanged fires reDeriveDirectChildren (R40.84) → the item live-inserts INSIDE the folder.
}
```
### 3. uploadFile — add the parent, reuse everything else
Add optional `opts?: { intoFolder?: string }`; when set, `fd.append('parent', opts.intoFolder)`. No other change.

### 4. Upload endpoint (server.ts:2655) — pass parent to the ONE mint
Read `parent` from the FormData; when present, resolve it to `parentIor` + derive the child `location` UNDER the folder (`<folder.location>/<fileName>`), and pass BOTH to the existing `createFileUnit(idx, { …, parent: parentIor, location }, publishUnitChanged)`. **Still exactly ONE createFileUnit** — parent set instead of unset. `publishUnitChanged` already fires → R40.84 live-insert; `folderChildrenUnder` (R40.92) renders it on reload.

## Constraints (all four, by construction)
1. **ONE canonical drop-acceptance path:** reuse DropDispatcher (router) → uploadFile → createFileUnit (the ONE mint) → reDeriveDirectChildren (R40.84 containment) → folderChildrenUnder (R40.92 render). `acceptDropIntoContainer` ROUTES + DELEGATES; it adds NO second container-drop derivation (the guard already encoded on a81ed3db).
2. **offered ⟺ succeeds ⟺ VISIBLE:** parent=folder → the unit renders INSIDE the folder (live via R40.84, on-reload via R40.92) + PERSISTS (createFileUnit writes to disk). A drop that succeeds invisibly is the R40.92 defect — precluded because the same derivation that fixed R40.92 renders this.
3. **No double-mint:** `createFileUnit` is the ONE mint, `parent` set — exactly one unit per file (the R40.93 lesson). No Folder-unit + no second unit.
4. **Scope — ROOM folders IN; MODEL-collection file-drop OUT (stated):** room folders accept dropped FILES via the room upload→createFileUnit path (the natural, buildable case). A model-collection folder (store-only unit under rawbin:diagram) is NOT a file-blob target — the model store holds model UNITS (minted via mintRealUnit), not uploaded content; "a file inside a model folder" has no create path and needs separate content-semantics. The drop-target MECHANISM (step 1) is generic and will serve model folders the day a model-content create path exists; and RE-PARENTING an existing item into a folder (drag-move, no mint) is a distinct future op. Out of scope for R40.86, named not silently dropped.

## Gate (tester, R40.31-isolated, stub-must-fail)
- drop a file on a room folder → EXACTLY ONE createFileUnit, `parent`=that folder; it RENDERS inside (live-insert) + survives reload. Stub: mint with `parent` unset → does NOT appear under the folder → RED (offered⟺succeeds⟺VISIBLE).
- no-double-mint: assert unit count +1 (not +2). Stub: a 2nd mint → RED.
- one-path: grep — the drop routes through DropDispatcher.acceptDropIntoContainer → uploadFile → createFileUnit; no bespoke container-mint/derivation.
- @390 device (Tron): drop a file on a room folder → it lands inside (pixel).

## ★ RENDER-FIX ADDENDUM (tester gate 9c779ad32 RED, v0.8.184 — architect owns the miss)
**My miss:** R40.86 constraint-2 asserted "renders inside via R40.84 + R40.92" but I did NOT verify the ROOM files derivation nests FILES — R40.92's `folderChildrenUnder` fixed the MODEL tree only. The data is CORRECT (tester: file.parent==folder, location `roomcoll:<id>:files/DropTarget/<file>`, folder.children[] has it, EXACTLY ONE unit) — but `roomFilesChildren` (server.ts:1393) nests FOLDERS by `model.location` yet emits FILES **only at root (`else if (!nrel)`), FLAT, ignoring location/parent** → a dropped file shows at the Files ROOT and never inside the folder. offered⟺succeeds⟺VISIBLE fails at VISIBLE — the identical R40.92 defect, on the room path that was never routed through the derivation.

**Fix — extract the ONE "direct-child-of-this-node" PREDICATE; do NOT route room node-building through folderChildrenUnder.** The genuinely-shared canonical rule is *"is this unit a direct child of node N?"* (byLoc: its containing dir == N's prefix; byParent: its parent == N's ref). Extract it once:
```ts
// THE ONE direct-child rule (R40.86) — shared by folderChildrenUnder (model) AND roomFilesChildren (room), so "nested-here"
// means the same thing in both. byParent OR byLoc; a unit with no location/parent belongs to the ROOT prefix only.
function isDirectChildOfNode(m: Record<string, unknown>, nodeRef: string, prefix: string, rootPrefix: string): boolean {
  if (String(m.parent || '') === nodeRef) return true;                 // byParent (the drop sets file.parent = folder ior)
  const loc = typeof m.location === 'string' ? m.location : '';
  const containingDir = loc ? loc.slice(0, loc.lastIndexOf('/')) : rootPrefix; // no location ⇒ a root-level unit
  return containingDir === prefix;                                     // byLoc: direct child iff its containing dir IS this node's prefix
}
```
- **`roomFilesChildren` FILE branch:** replace `else if (!nrel)` with `else if (isDirectChildOfNode(x.m, <folderRef>, currentPrefix, rootPrefix))` (rootPrefix = `roomcoll:${rcRoom}:files`). This (a) NESTS a file into its folder (at the folder's level its containingDir == currentPrefix), and (b) EXCLUDES a parented file from ROOT (at root a file located under a subfolder has containingDir ≠ rootPrefix → not emitted) — appears ONCE, nested, not twice, not flat. Legacy no-location root files still emit at root (containingDir == rootPrefix). Also give a nested folder `hasChildren` from its file children too (currently childCount counts only sub-FOLDERS — extend `directChildFolders` → direct children of BOTH kinds so a folder holding only files shows a chevron).
- **`folderChildrenUnder` (R40.92, model):** refactor its inner byParent/byLoc filter to call the SAME `isDirectChildOfNode` — so the model and room derivations share ONE definition of "nested here" and cannot drift. (Node-BUILDING stays each derivation's own — model emits mofFolder nodes, room emits file/folder items with size/sunburst; routing room node-building through folderChildrenUnder would need a mode flag to switch node shapes = the R40.93 dual-behaviour smell. Share the PREDICATE, not the node-builder.)

**Why predicate-not-whole-function** (measure-beats-relay on the tester/PO "extend folderChildrenUnder" pointer): folderChildrenUnder returns MODEL mofFolder nodes; roomFilesChildren returns ROOM items (files carry size for the sunburst, folders carry childCount). Making one function yield both shapes = a mode flag = exactly the dual-behaviour smell ruled out in R40.93. The thing that was actually inconsistent — and must be ONE — is the *nesting rule*, so THAT is what's extracted. Honors "no second derivation of what nested means" without conflating node shapes.

**Re-gate ACs (add to the existing four):** children[folder ref] now CONTAINS the dropped file (nested); children[roomcoll:files ROOT] does NOT list it (excluded, appears once); a folder holding only files shows a chevron (hasChildren). Stub-must-fail: revert the file-branch to `!nrel` → file reappears flat at root + folder empty → RED (the current baseline 9c779ad32).

## Handoff
Expert (0.1): build steps 1-4 + the RENDER-FIX ADDENDUM (extract isDirectChildOfNode; roomFilesChildren file-branch + childCount-both-kinds; folderChildrenUnder routes through the shared predicate) (client rb-object-item drop-target + acceptDropIntoContainer + uploadFile parent + upload-endpoint parent), seat `[impl:uuid:75edb563]` on acceptDropIntoContainer, flip its Impl designAhead→false. Version bump + restart (server endpoint change). I backstop (one-mint, renders-inside, delegates-not-duplicates) + tester gates. No chokepoint touched.
