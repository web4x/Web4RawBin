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
