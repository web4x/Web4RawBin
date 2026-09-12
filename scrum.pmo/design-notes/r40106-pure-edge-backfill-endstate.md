# R40.106 — pure-edge render END-STATE + location→edge BACKFILL (boarded debt, robbin-expert 2026-09-12)

The FIX-A render (v0.8.218) is a **UNION** of two containment sources — physical `location`/`parent` **OR** the folder's
`children[]` edge set, deduped by uuid. This is a **TRANSITION, not the end-state**: a standing two-source render is the
one-SoT violation this arc removes (the architect named `location` a STALE denormalized cache under N:M). Boarded here so
the debt is visible with a measurable exit, not remembered in a commit message (PO condition).

## END-STATE (the SoT target)
Render **purely from `children[]` edges** (logical containment); demote physical `location` to a storage detail (where the
bytes live, single). `view = f(edges)`, same as board = f(units) (R37.2/3). Retire `location`/`parent` as render inputs.

## CORRECTED baseline — real live strand = 0 (served v0.8.219, 2026-09-12; supersedes the initial 4)
Initial differential (no membership filter) counted **4** folder-nested location-only units + 53 root-level. BOTH over-counted:
- The **53 root-level** survive via `room.fileUnits` (not a folder edge) → never at risk under pure-edges.
- The **4 folder-nested** are **NON-MEMBER removed units with a STALE `model.location`** — slice-3/4 gate leftovers in the
  TEST room `909f1bd6` (LinkA-1828675, RemoveTgt-1731528/1733494/1733665), reconciled with the tester. They matched the
  scan only because the initial differential had **no membership filter** and because `unlink-unit` left a stale location.
- **★ MEMBER-FILTERED (real live) folder-nested strand = 0.** No real unit on Tron's tree was ever at disappearance risk.
CONSEQUENCE: the drain-check is ALREADY at target for live data → the pure-edge end-state is reachable IMMEDIATELY after FIX-B.
TWO corrections shipped so it stays honest: (a) FIX-B `unlink-unit` now CLEARS `model.location` on physical removal (no more
stale-location leftovers poisoning the scan); (b) the drain-check MUST apply a MEMBERSHIP filter (count only units in a room's
`files[]`), else it "drains" units that are already gone.

## THE BACKFILL (gates the flip)
Give every physically-located room unit a `children[]` edge from its containing folder (a one-pass migration, coherent with
**parentFolder-retire / INC-4a** — same read-side repoint). Then a **DRAIN-CHECK** asserts folder-nested location-only → **0**.

## FLIP CRITERION (objective, no argument — the data decides, as it did for union-vs-pure-edges)
When the drain-check reads **0 folder-nested location-only units**, pure-edge render goes on + `location` demotes to storage.
Until then the UNION stands. A standing >0 with no active drain = the two-source cache rotting → re-raise.

## OWNERS / NEXT
- Backfill migration + drain-check gate: expert, with the parentFolder-retire (INC-4a) work.
- Formalize as a sprint task: flag to robbin-planner/req to mint the R40.106-endstate task (this note = the durable board + baseline until then).
