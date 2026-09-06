# R40.86 completion — in-app drag of an existing file onto a folder (architect, 2026-09-06)

Tron v0.8.186 iPhone (12:18): dragging existing file `Grüße-für-0f44524b.eml` onto folder `dupChildTest` — the folder **highlights** (drag chip over the row) but the drop **does not land**. Falsifies my earlier iOS platform-limit classification for the IN-APP case. **Measured, not asserted.** Design-only.

## Root cause (measured — src/public/ts/trace/rb-object-item.ts)
- **dragover (line 76):** `preventDefault()` + `stopPropagation()` + `dropEffect='copy'` + `classList.add('drop-target')`. → dragover DOES fire on the nested folder on iOS; the highlight is this line. Working.
- **drop (line 78-83):** fires, `preventDefault()` OK, then **line 81:** `const files = [...(dataTransfer?.files ?? [])]` — reads **only external OS files** — and **line 83** gates `if (files.length && ref)`.
- **onDragStart (line 150):** an in-app drag sets `dataTransfer.setData('application/rb-object-ref', refs)` + `text/plain` (hash) + `text/uri-list`. It carries **NO `dataTransfer.files`**.
- ⇒ In-app drag of an existing unit → `files.length === 0` → `acceptDropIntoContainer` **never called** → **silent no-op.** The handler implements only external file-drop; it discards the in-app `application/rb-object-ref` payload.

**Classification corrected:** (i) EXTERNAL file drop (Files/Photos→Safari, `dataTransfer.files`) = handled (upload path); my (a)platform/(c)untestable holds ONLY here. (ii) **IN-APP drag of an existing file onto a folder = OUR BUG** — dragover/highlight/drop all fire; the payload is ignored. A folder must be a drop target for BOTH.

## Fix (no new derivation; completes folder-implements-DropTarget)
The drop handler branches on payload:
1. **`dataTransfer.files` present** → existing upload path: `acceptDropIntoContainer(files, folderRef)` (unchanged).
2. **`application/rb-object-ref` present** (existing unit refs) → **RE-PARENT** the existing unit(s) INTO the folder: set each unit's parent to the folder ref / add to the folder's `children` (the containment op), then **DELEGATE render to R40.84 `reDeriveDirectChildren`** (same delegation the upload path uses — no client re-derive, no 2nd containment path, LAW-8).
3. **iOS robustness fallback:** if custom-MIME `getData('application/rb-object-ref')` is empty (some Safari builds strip custom types on drop), fall back to `text/plain` (the `#type.show?uuid=` hash → resolve the ref) and, failing that, to `selectionModel.getSelected()` (the already-shipped tap-select-as-container complement). So the dragged ref is recoverable even when iOS restricts custom dataTransfer types.

The re-parent is a **move of an existing unit** (change its container), distinct from the upload path's **mint of a new unit** — but both converge on the SAME containment + the SAME R40.84 render delegation. Server side: a re-parent endpoint/verb that sets the file unit's parent to the folder (reuse the containment the room add-folder / createFileUnit(parent) path already models; NO new store, NO MODEL_STORE blob — consistent with R40.81).

## Gates (R40.31 isolated; must be able to FAIL)
- **In-app drag → drop lands:** drag an existing file unit onto a folder → the unit is re-parented into the folder (parent/children updated, ONE unit, no duplicate) AND renders inside it via R40.84. **stub-must-fail:** revert to files-only gate → in-app drop no-ops (RED).
- **External file drop unregressed:** OS file → folder still uploads+mints+renders (the existing path).
- **@390 real-WebKit / device (Tron):** in-app drag of an existing file onto a folder → it lands inside. The un-mockable case that exposed this — the gate MUST exercise a real in-app drag (dataTransfer with `application/rb-object-ref`, no `.files`), which the prior gate never did (that miss is why it survived).
- **No double-path:** one containment + one R40.84 render delegation for both branches (grep: no 2nd re-derive).

## Chain
Rides R40.86 folder.acceptDrop (UC af1bf20b → Class Folder 77ff595d implements DropTarget → Method Folder.acceptDrop ced15069 → Impl 4d4ac272). The in-app re-parent branch is part of acceptDrop's contract (accept a new file OR an existing item); no new Method unless the re-parent server verb needs its own — I'll wire on measurement of the existing re-parent/containment path (root-lens: reuse if createFileUnit(parent)/a move verb already exists). Expert builds; I backstop (both branches land + one containment + delegates-not-duplicates + external unregressed); tester gates the in-app case with a real payload; req captures the corrected AC (folder is a drop target for in-app drags too, not only external files).
