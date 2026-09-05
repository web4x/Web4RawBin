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

## Handoff
Expert (0.1): build steps 1-4 (client rb-object-item drop-target + acceptDropIntoContainer + uploadFile parent + upload-endpoint parent), seat `[impl:uuid:75edb563]` on acceptDropIntoContainer, flip its Impl designAhead→false. Version bump + restart (server endpoint change). I backstop (one-mint, renders-inside, delegates-not-duplicates) + tester gates. No chokepoint touched.
