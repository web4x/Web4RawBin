# R40.106 — ROOT membership by location is the REMAINING HALF of the pure-edge debt (NOT correct-by-design)

**Author:** robbin-expert, 2026-09-12, after INC-6 (v0.8.222) flipped NESTED render+count to `children[]` edges.
**PO question (answered):** is root-derives-by-location a permanent correct asymmetry, or the remaining half of the same two-source debt?

## Answer: DEBT (transitional), with a real design dependency — do NOT "fix" ad hoc, do NOT assume permanent.

After INC-6, a **nested** folder renders + counts PURELY from its `children[]` edges. But **root** (the room Files node,
`nrel=''`, `selfFolder=null`) still derives its direct members by **LOCATION**: `roomFilesChildren` emits the `files[]`
members whose `isDirectChildOfNode(rootPrefix)` holds (i.e. `containingDir === roomcoll:<id>:files`, or location-less).
That is the SAME location-based derivation INC-6 retired for nested — so root is the **remaining half of the same debt**.

### Why it isn't simply "the room has no edge set"
`room.model.files[]` (mirrored live as `room.fileUnits: Set`) IS structurally a containment-edge list — but it is a
**flat registry of ALL units in the room** (root-level AND nested), and LOCATION is what sorts them into root-vs-folder.
A folder's `children[]`, by contrast, is a per-container edge set of ONLY its direct members. So the room conflates two
roles in one field: (a) the flat unit registry (used for lookup / `fileUnits` / delete), and (b) root membership (via location).

### The latent asymmetries this leaves (why it's debt, not by-design)
- **Remove semantics differ:** removing from a folder = unlink ONE edge (FIX-B, `container` ref). Removing from ROOT has
  no edge to unlink — it goes through location/fileUnits (the FIX-B physical-remove-clears-location path). Two remove paths.
- **Multi-containment at root:** a unit edge-linked into folder B whose LOCATION is still root-level renders in BOTH B (edge)
  and root (location) — correct as N-link multi-containment, but root's half is location-governed, not edge-governed.

### The pure-edge end-state (the drain target)
Give the room a root **edge set** for its DIRECT children (or treat `files[]` as root-edges with nested units carried
only by folder edges), so root membership = edges too, symmetric with folders. DESIGN DEPENDENCY (architect): the
`files[]` flat-registry role must be preserved or replaced (lookup / fileUnits / delete rely on it) — this is why it is
NOT a 1-line mirror of INC-6.

### DRAIN-CHECK (the precondition to flip root, mirroring the nested strand=0 gate)
Before flipping root to edges: **every root-level `files[]` member must be represented in the room's root edge set** (0
root-level members reachable only by location). Reuse the tester's membership-filter probe shape, extended to root.
Baseline today: root render = `files[]` ∩ location-root-level; strand to drain = (root-level-by-location) − (root-edge-set)
once a root edge set exists. Flip only at drain=0 (the phantom-4 / strand=0 discipline).

## Recorded so the next person does not mis-handle it
- NESTED is single-source (edges) as of INC-6 — do not re-introduce a location branch for nested (bar #7, strand=0 = drain proof).
- ROOT-by-location is TRANSITIONAL DEBT, boarded here with its drain-check — not a deliberate permanent asymmetry.
- Retiring it is a NEW increment (own design + drain + gate), gated on the architect's `files[]` dual-role decision.

## ★ ARCHITECT DECISION (the files[] dual-role call): Option 2 — add `room.rootChildren[]`, keep `files[]` as the registry
Decision: **give the room a dedicated root edge set `rootChildren[]` (the room-root's direct members), and leave `files[]` UNCHANGED as the flat membership registry.** Reasons:
1. **Preserves the registry role (the hard constraint) with zero blast on its consumers.** `files[]`/`fileUnits` stays exactly what lookup/delete/membership use today — untouched. We SEPARATE the two conflated roles instead of overloading one: `files[]` = "is this unit IN this room" (membership); `rootChildren[]` = "is this unit placed at ROOT" (placement edge), symmetric with `folder.children[]` = placement in that folder.
2. **Root becomes edge-derived = the end-state**, uniform with nested (both are per-container direct-member edge sets). Root stops being location-special.
3. **Resolves the remove-path asymmetry the note flagged:** remove-from-root = unlink the `rootChildren[]` edge, exactly as remove-from-folder = unlink `folder.children[]` (FIX-B). ONE remove mechanism (unlink a container edge, root or folder); `files[]` is touched only by DELETE (remove-from-room entirely, INC-7), never by remove-from-a-container. The two-remove-path split collapses.
4. **Delete (INC-7) stays consistent:** delete = remove from `files[]` (membership) + unlink ALL placement edges (`rootChildren[]` + every `folder.children[]`) + the scan. `files[]` remains the authoritative "in this room" set.

**REJECT Option 1 (`files[]` becomes root-edges):** it DESTROYS the registry role — nested units drop out of `files[]`, so "all units in the room" (lookup/fileUnits/delete) would have to become a recursive edge-traversal (rootChildren ∪ transitive folder.children). Bigger blast on every registry consumer + a new "in files[] but not edge-reachable = stranded from membership" risk. No net win over Option 2.

**NOTE Option 3 (root-as-a-persisted-Folder unit)** — the purest full-uniformity end-state (ALL containment is `folder.children[]`, root included; `files[]` = registry). Cleaner conceptually but HEAVIER: the `roomcoll:<id>:files` collection is currently SYNTHETIC (no persisted Folder, RoomFilesService:36) → it would need to be minted/persisted as a real root Folder per room + migrated. Defer unless we want full uniformity; Option 2 reaches root-from-edges without that migration.

**DRAIN-CHECK (confirm the note's):** before flipping root render/count to `rootChildren[]`, BACKFILL every root-level `files[]` member (by location) into `rootChildren[]`; flip ONLY at root-strand=0 (every root-level unit edged), mirroring INC-6's nested gate. Same 7-point bar shape as INC-6 (render byte-identical at strand=0, count==render incl a fresh root N-link, root N-link VISIBLE, files[]-registry consumers unchanged, remove-from-root = edge-unlink). This is a NEW increment (INC-7-root or its own) — own design + backfill + drain + gate.
