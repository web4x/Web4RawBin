# R40.106 — pure-edge render END-STATE + location→edge BACKFILL (boarded debt, robbin-expert 2026-09-12)

The FIX-A render (v0.8.218) is a **UNION** of two containment sources — physical `location`/`parent` **OR** the folder's
`children[]` edge set, deduped by uuid. This is a **TRANSITION, not the end-state**: a standing two-source render is the
one-SoT violation this arc removes (the architect named `location` a STALE denormalized cache under N:M). Boarded here so
the debt is visible with a measurable exit, not remembered in a commit message (PO condition).

## END-STATE (the SoT target)
Render **purely from `children[]` edges** (logical containment); demote physical `location` to a storage detail (where the
bytes live, single). `view = f(edges)`, same as board = f(units) (R37.2/3). Retire `location`/`parent` as render inputs.

## WHY NOT NOW — measured baseline (served v0.8.218, 2026-09-12)
Flipping to pure-edges TODAY would VANISH any unit contained only by physical-location with no `children[]` edge. Measured
(scripts/scratch containment differential over scenario/index):
- **FOLDER-NESTED strand = 4** ← the REAL disappearance risk (units inside a sub-folder by location, absent from that
  folder's `children[]`). THIS is the number that must drain to **0**.
- root-container "strand" = 53 — NOT a real strand: room-root membership renders via `room.fileUnits`, not a folder edge, so
  pure-edges keeps them. (Recorded so the 4-vs-57 distinction is explicit and not re-litigated.)

## THE BACKFILL (gates the flip)
Give every physically-located room unit a `children[]` edge from its containing folder (a one-pass migration, coherent with
**parentFolder-retire / INC-4a** — same read-side repoint). Then a **DRAIN-CHECK** asserts folder-nested location-only → **0**.

## FLIP CRITERION (objective, no argument — the data decides, as it did for union-vs-pure-edges)
When the drain-check reads **0 folder-nested location-only units**, pure-edge render goes on + `location` demotes to storage.
Until then the UNION stands. A standing >0 with no active drain = the two-source cache rotting → re-raise.

## OWNERS / NEXT
- Backfill migration + drain-check gate: expert, with the parentFolder-retire (INC-4a) work.
- Formalize as a sprint task: flag to robbin-planner/req to mint the R40.106-endstate task (this note = the durable board + baseline until then).
