# R40.92 — model-collection add-folder SUCCEEDS but never appears (architect design, 2026-09-05)

req `6009a5ad`, symptom-first, root NAMED (mine, pre-rewind; PO-confirmed). Child of Bug `c83c02f2`, sibling of R40.87 routing. **Design-only; hand the expert the exact shape. R40.81 DRY lens: extend the ONE canonical children-derivation, do NOT add a 2nd path.**

## Measured root (server.ts, the ONE mofChildren derivation)
A store-only model Folder (mintRealUnit) parented under a collection carries `model.parent = 'rawbin:diagram'` and **NO `location`** (collections have no directory). BOTH children-paths exclude it:
- **server.ts:1789** `rawbin:diagram` children = `els.filter(x => x.ior === 'ior:class:Diagram')` — Diagrams ONLY, never Folder. A Folder parented here is dropped.
- **server.ts:1780-1786** the `dir:` `userDirs` merge (the one place that DOES merge store-only Folder units into children) finds them **by `location`** (`x.m.location.startsWith(dirRel + '/')`). A collection-child Folder has parent-link, no location → excluded here too.

So: offered (R40.87 routes it) → succeeds (unit minted on disk) → **but the derivation never surfaces it** → the folder never appears. The mint is fine; the READ is blind to parent-linked folders.

## Fix — ONE helper `folderChildrenUnder`, reused by BOTH branches (DRY, no 2nd derivation)
The `dir:` branch's `userDirs` merge is ALREADY the canonical "merge direct-child Folder units" step. It only knows ONE parentage scheme (location). Generalise it into ONE helper that resolves a Folder's **direct-child-ness by EITHER parentage scheme** — parent-link (model-store collection children, no location) OR location (physical dir children) — and route BOTH branches through it. This EXTENDS the one derivation; it does not fork it.

```ts
// ONE canonical "direct-child Folder units of a node", by EITHER parentage scheme (R40.92, R40.81 DRY):
//  - model-store Folder (mintRealUnit): model.parent === nodeRef, NO location (collections have no dir)
//  - physical Folder  (createPhysicalFolder): model.location directly under dirRel (dirRel null ⇒ N/A)
// Returns mofFolder nodes, deduped against `seen` (fs-walk uuids). NOT a second scan — reuses the `els` model scan.
function folderChildrenUnder(nodeRef: string, dirRel: string | null, els: ModelEl[], seen: Set<string>): MofNode[] {
  return els
    .filter((x) => x.ior === 'ior:class:Folder')
    .filter((x) => {
      const loc = typeof x.m.location === 'string' ? (x.m.location as string) : '';
      const byParent = String(x.m.parent || '') === nodeRef;                                    // collection child (no location)
      const byLoc = !!dirRel && loc.startsWith(dirRel + '/') && !loc.slice(dirRel.length + 1).includes('/'); // direct physical child
      return byParent || byLoc;
    })
    .map((x) => {
      const loc = String(x.m.location || '');
      const ref = loc ? 'dir:' + loc : String(x.m.uuid || x.uuid);                              // physical → dir:loc ; model-store → its uuid (the ior the drawer resolves)
      const name = String(x.m.name || (loc ? loc.split('/').pop() : '') || 'folder');
      return mofFolder(ref, name, 0, 'mof-project', 'collection', 0);
    })
    .filter((d) => !seen.has(d.uuid))
    .sort((a, b) => a.name.localeCompare(b.name));
}
```

### Per-file fix table (src/ts/server/server.ts)
| Line | Current (BUG) | Fix |
|---|---|---|
| 1780-1786 | inline `userDirs` merge (location-only) | replace with `const userDirs = folderChildrenUnder(uuid, dirRel, els, seen);` — the dir: branch now routes through the ONE helper (behaviour-preserving for physical folders: `byLoc` == the old predicate). |
| 1789 (`rawbin:diagram`) | `return els.filter(ior==='Diagram').map(...).sort(...)` | derive Diagrams as today, then `const seen = new Set(diagrams.map(d=>d.uuid)); return [...diagrams, ...folderChildrenUnder('rawbin:diagram', null, els, seen)];` — collection Folder children found BY PARENT LINK now render. |

**DRY proof:** exactly ONE function derives "Folder units that are direct children of a node." The dir: branch and the collection branch are two CALL-SITES of it, not two derivations — so the two-source drift R40.91 forbids cannot arise. Any future collection that gains add-folder calls the same helper (`nodeRef`, `dirRel=null`).

## Client: no change (R40.83 ruling holds)
The client REFLECTS the server children derivation (fetches `/children`, DOM-reconciles — `reDeriveDirectChildren`), never recomputes locally. Fixing the ONE server derivation (`mofChildren`) makes the folder appear end-to-end; a client-side files[]/parent computation would be the divergence the R40.82 children-owner guard forbids. **Do NOT add client logic.**

## The 5 failable ACs (req) map cleanly
- **offered ⟺ succeeds ⟺ VISIBLE / symptom AC (folder RENDERS after add + persists):** the minted store-only Folder (parent=rawbin:diagram) is now found by `byParent` → returned by `mofChildren('rawbin:diagram')` → renders; it is on disk → survives reload. 
- **by-parent-link-not-location:** asserted by construction (`byParent` uses `model.parent`, never location, for collection children).
- **stub-must-fail:** feed a Folder unit parented under the collection, assert it appears in `mofChildren('rawbin:diagram')`; revert the fix (byParent removed) → it VANISHES → RED. Gate isolated (R40.31 scratch index, no prod mutation), must be able to fail.

## Handoff
Expert (free at 53%): add `folderChildrenUnder`, apply the 2-row fix table, no client change, no new machinery (reuses `els` + `mofFolder`). Version bump (server-side derivation change → restart to serve). Tester gates post-build: add-folder-to-collection → RENDERS + persists + stub-must-fail. req wires nothing new — the chain rides R40.87's routing family; I verify derive if req mints a Test off the fix. No chokepoint touched.
