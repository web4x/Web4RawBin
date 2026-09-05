# R40.86 — DROP TARGET IS A CONTAINER (OOP/DRY unification) — architect, 2026-09-05

Tron: *"and DRY it has to work everywhere the same through oop!!!!"* + *"no rollback… fix it."* This is the DELIVERY path on v0.8.185, not a follow-up. **Regression must vanish by construction, not by patch.**

## Root shape (measured) — DIVERGENT drop paths, the functional-construct defect
The behaviour "accept a dropped file into me" is spread across call-sites instead of owned by the container:
- **Client, TWO entry points:** RoomView dz → `dispatch(file, roomId, token)` (NO parent) vs rb-object-item folder → `acceptDropIntoContainer(files, folderRef)` → `uploadFile(intoFolder)` (parent).
- **Server, a FORK:** upload endpoint `if (parentRef) { nest under folder } else { Files root }`.
- **Model collection:** no path at all (special-cased out).
Threading `parent` through the folder path while the room-root path stays parent-less is the divergence; the no-parent branch is where uploads broke on prod. Same shape as the two-translator bug (R40.91) and flat-vs-nested children (R40.92/R40.86-render) — **third instance today of "behaviour that belongs to an OBJECT spread across branches."**

## The unification — a Container OWNS `acceptDrop`; the drop path never asks WHICH surface
**Every drop surface is a `DropContainer` answering the SAME messages** (the OBJECT answers; the caller never branches):
- `containerRef(): string` — its OWN ref (room-root → `roomcoll:<roomId>:files`; a room folder → the folder's roomcoll location ref; a model collection → `rawbin:diagram`/etc.).
- `canAccept(file): { ok: true } | { ok: false, reason: string }` — room-root/room-folder → ok for a file; a model collection → `{ ok:false, reason:'model collection holds units, not file blobs' }` (it ANSWERS as an object; NOT special-cased by the caller — R40.86 scope boundary becomes a container answer).
- `context(): { roomId, token }`.

### ONE client path (retire both entry points)
Browser drop → resolve the `DropContainer` from the drop-target ELEMENT (the room dz element answers RoomRoot; an rb-object-item[type=folder] answers RoomFolder — the element identifies its own container, no caller `if`) → `const a = container.canAccept(file); if (!a.ok) { statusCb('info', a.reason); return; }` → **`DropDispatcher.acceptDrop(files, container)`**:
```ts
async acceptDrop(files: File[], c: DropContainer): Promise<void> {
  const { roomId, token } = c.context();
  for (const f of files) {
    const chk = c.canAccept(f); if (!chk.ok) { this.statusCb?.('info', chk.reason); continue; }
    await this.uploadFile(f, roomId, token, undefined, { parent: c.containerRef() }); // parent ALWAYS = the container's ref
  }
}
```
`dispatch()` and `acceptDropIntoContainer()` both RETIRE into `acceptDrop` (dispatch's MIME allowlist/feedback moves into RoomRoot/RoomFolder `canAccept` + the shared path). **No no-parent call anymore.** `uploadFile` always receives a `parent` (the container ref) — the `opts?.intoFolder` fork is gone (it's always set).

### ONE server resolver (retire the `if (parentRef) else root` fork)
```ts
// ONE ref → (parentIor, childLocation, publishRef). Room-root and a folder are the SAME resolution, keyed only on the ref.
function resolveDropContainer(containerRef: string, roomId: string, idx: ScenarioIndex): { parentIor: string | null; location: string; publishRef: string } {
  const rootRef = `roomcoll:${roomId}:files`;
  if (containerRef === rootRef) return { parentIor: null, location: rootRef, publishRef: rootRef };      // room-root: no parent UNIT, but a real container ref
  const uuid = containerRef.replace(/^ior:instance:/, '').split('@')[0];
  const pu = /^[0-9a-fA-F-]{16,40}$/.test(uuid) ? idx.get(uuid) : null;
  const pm = pu?.model as Record<string, unknown> | undefined;
  if (pu?.ior === 'ior:class:Folder' && String(pm?.location || '').startsWith(rootRef)) return { parentIor: `ior:instance:${uuid}`, location: String(pm!.location), publishRef: String(pm!.location) };
  return { parentIor: null, location: rootRef, publishRef: rootRef };                                     // unresolvable → room-root (fail-safe, never a 500)
}
```
The endpoint ALWAYS calls `resolveDropContainer(parentRef, roomId, idx)` and passes its result to the ONE `createFileUnit`:
```ts
const c = resolveDropContainer(parentRef || `roomcoll:${roomId}:files`, roomId, idx); // absent parent ⇒ room-root by DEFAULT, not a skipped branch
unit = createFileUnit(idx, { name: fileName, content: fileData, mimeType, uploaderToken, fsKey, roomUuid: roomId, location: `${c.location}/${fileName}`, ...(c.parentIor ? { parent: c.parentIor } : {}) }, publishUnitChanged);
// … room.addFileUnit + (c.parentIor ? add to folder.children) … publishUnitChanged('ior:class:Folder', c.publishRef);
```
`parent` (the unit-link) is set iff the container IS a unit (a folder) — that is the CONTAINER answering "am I a unit?", resolved in ONE place, NOT a caller-side with/without-parent branch. `location` is ALWAYS set (root files now carry `roomcoll:<id>:files/<name>` — renders at root via the already-built `isDirectChildOfNode`: containingDir === rootPrefix).

## Why the regression vanishes BY CONSTRUCTION
There is no "no-parent room drop" anymore: **room-root is a container that answers its own ref.** Every drop threads a `containerRef`; the server resolves root and folder through ONE function; a legacy/absent parent DEFAULTS to the room-root ref (not a skipped branch). The forked branch where uploads broke is DELETED, so the break cannot recur — and the expert's live server-error measurement should confirm it was in that fork (belt-and-suspenders, but the design does not depend on knowing the exact line).

## R40.89 — iOS real-capability (flagged, not the critical path)
HTML5 `dragover`/`drop` is dead on iOS Safari for INTERNAL drags (rb-diagram-detail.ts:77 precedent). Tron's log shows an EXTERNAL OS file-drop (Photos→Safari) DID reach the room dz, so **room-root drop works on iOS once the path is unified** (the critical fix). Per-node folder drop targets may not reliably receive an OS file-drop on iOS touch → folder-targeting on iOS is R40.89 (a tap-select-folder-then-drop or long-press affordance), OUT of this fix's critical path. Stated as a container-capability gap, not a silent omission.

## Constraints (Tron's law, by construction)
- **No per-surface branches:** the container answers `containerRef`/`canAccept`; the drop path never asks which surface.
- **No mode-flags:** each surface is its OWN container object (RoomRoot/RoomFolder/ModelCollection) — not one function toggled by a boolean (the R40.93 dual-behaviour smell). Distinct objects, one message.
- **offered ⟺ succeeds ⟺ VISIBLE:** renders via `isDirectChildOfNode` (built) + R40.84 live-insert; root files at root, folder files inside.
- **No double-mint:** ONE `createFileUnit` per file (parent/location set, never a second unit).
- **model collection:** answers `canAccept=false` (no blob store) — the boundary is an object's answer.

## Gate (must exercise the REAL chain end-to-end, the miss that let a customer falsify it)
Browser drop → DropContainer resolve → acceptDrop → uploadFile → endpoint → createFileUnit → render — as ONE flow, NOT a scratch data-check: (1) **room-root file drop UPLOADS + renders at root** (the prod regression — RED on current v0.8.185, GREEN on fix); (2) folder drop renders INSIDE, once, not at root; (3) model-collection drop shows the canAccept reason, mints nothing; (4) @390 real-WebKit iOS room-root drop works; (5) stub-must-fail: break the resolver → RED. One-mint asserted on every case.

## Handoff
Expert (0.1) — fixing forward, no rollback net: introduce `DropContainer` (RoomRoot/RoomFolder/ModelCollection) + `DropDispatcher.acceptDrop`; retire `dispatch`/`acceptDropIntoContainer` into it; `uploadFile` always passes parent; server `resolveDropContainer` retires the fork; root files carry a location. Version bump + restart. I backstop (room-root works, folder nests, no fork, one mint, no double-path) + tester gates the end-to-end chain. Chain: UC af1bf20b generalises to container.acceptDrop; I re-point Method/Impl (a81ed3db/75edb563) to the unified path on ship.
