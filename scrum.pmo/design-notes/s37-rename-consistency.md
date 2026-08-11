# S37 Naming Rename — bespoke C-scheme → fleet canon (design)

**By:** robbin-architect 2026-08-11, per PO+Tron. S37 (`sprint-37-consistency-by-construction`) is the naming OUTLIER: tasks `C1..C8`, reqs `R-C1..R-C8`, while every other sprint uses `<sprint>.<index>`. The consistency-by-construction sprint must not be the inconsistency. MEASURED, not assumed.

## Fleet canon (MEASURED)
`task-<sprint>.<index>` files; ids `T<sprint>.<index>` (tasks) / `R<sprint>.<index>` (reqs) — confirmed: task-30.1, task-36.1, task-40.10. → **S37 target: `T37.1..T37.8` / `R37.1..R37.8`**, files `task-37.1-*.md`.

## ★ DRY ROOT (MEASURED — the good news): display-id is STORED, NOT derived-in-several-places
- A task/req's display-id = the **stored `model.altId`** field (classes.ts loaders carry `altId`), READ single-source — not recomputed per surface.
- The sprint PREFIX ('Sprint N') is already single-sourced in `sprint-label.ts` (R40.4) and **gate-enforced** by `check-sprint-label.ts` (ci:gates fails on any bypass).
- ⇒ The "several places" (generate-sprint-md, sprint-overview-generator, task-status, …) are READERS of `altId`/the atom, not rival derivers. **The inconsistency's root is NOT scattered derivation — it is the bespoke VALUES stored in S37's altIds + the C-scheme baked into file names and cross-ref text.** So the fix is a well-scoped DATA+TEXT rename (uuids stable), not a code-dedup.

## The rename (uuids STAY STABLE — names change, identity does not)
Mapping (preserve order/meaning): `C1→T37.1, C2→T37.2, C3→T37.3, C4→T37.4, C5→T37.5, C6→T37.6, C7→T37.7, C8→T37.8`; `R-C1→R37.1 … R-C8→R37.8`; **C4 subtasks** `C4.1→T37.4.1, C4.2→T37.4.2, … C4.8→T37.4.8` (keep the parent/child depth).
Per unit: change `model.altId` (+ `model.name` where it embeds the C-id) — **NOT the uuid** (UC pointers, chain edges, cross-wire all stay intact).

## Execution constraints
1. **Rename + regen TOGETHER** — a rename without regen leaves the generated boards orphaned (stale ids in planning.md/requirements.md/sprint .md).
2. **PRESERVE `.puml` + `design-*.md`** — known historical harm: `generate-sprint-md` regen WIPES a sprint's `*.puml` + `design-*.md`; restore them from HEAD after every regen, and write only through the **C8 `guardedWrite`/`guardedDelete`** owned-output chokepoint.
3. **Update EVERY cross-reference**: the 8 task-mds, planning.md, requirements.md, the **C4 subtask links** (`task-c4.x` → `task-37.4.x`), and design-note references (this repo's `c4-mvc-view-pipeline-shape.md` + `analysis-c4-task-statusnext.md` name `C4.1..C4.8` — update, or mark as design-history with a rename note).
4. **Mostly NO new mint** — re-valuing an existing unit's `altId` + renaming its file is a DATA edit on existing units (req-WALL-safe, R30.11 data-edit precedent). The ONE new unit is the canon-guard below → mint when req returns.

## ★ Consistency-by-construction guard (the sprint's own thesis, applied to itself)
Add a gate `check-altid-canon` (ci:gates): every Task/Requirement unit's `altId` MUST match the fleet pattern `^R?\d+\.\d+(\.\d+)?$` (T-tasks may drop the T in altId per fleet convention — MEASURE the exact stored form on a known-good unit before pinning the regex). A bespoke scheme (`C1`, `R-C1`) → RED. Two-bite: (i) plant a `C9` altId → RED; (ii) lint-runs meta → weaken → RED. This makes "the naming cannot drift again" STRUCTURAL, not a one-time cleanup — exactly what S37 is about. (New unit: UC `naming.assertAltIdCanon` → Class `NamingCanonGuard` → Method → Impl; mint when req returns.)

## Sequencing
Rename is data+text+regen (proceeds without req). The canon-guard unit mints when req returns. Do the rename as ONE atomic batch (all 8 tasks + 8 reqs + subtasks + cross-refs + regen + puml/design restore) so the board is never half-renamed. Verify: 0 `C\d`/`R-C` ids remain on disk; every generated view shows T37.x/R37.x; puml+design-*.md unchanged vs HEAD.
