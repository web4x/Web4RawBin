# Folder-unit model repair (empty/orphaned models don't describe the thing) — data-migration + failable check

**Author:** robbin-architect 2026-09-05. Tron screenshot: folder `7d5d9712` (demo) — model `children=[]`, `parent=null`, `location=src/demo`, in model-store. The tree renders THE MODEL (empty → no badge/chevron); the sunburst reads the FILESYSTEM (js+ts → 2). Both honest; the MODEL is empty and doesn't describe the folder. The unit IS the model (capstone); a code revert does not undo data. Repair the CLASS of damage, not the one unit.

## MEASURED SHAPE OF THE DAMAGE (both stores scanned)
- **ALL 82 Folder units are in `data/model-store`; ZERO in `scenario/index`.** The whole class is in the wrong store (folder-is-a-file / one-store violation).
- **`parent=null` on 79/82** — the parent field is systemically UNPOPULATED; on-screen nesting is derived from the `location` PATH, not `parent` = a second place the parent-child truth lives (same disease).
- **`children=[]` on 9/82**; **BOTH empty-children AND null-parent on 6** (demo 7d5d9712, Trash 3e041bff, demo 671d20e2, js bf5711c5, ts ca85dfa1, test dffe3481).
- The real DAMAGE (per Tron) = `children=[]` WHILE the fs location HAS contents, and `parent=null` WHILE the folder is nested (its location has a parent segment). A genuinely-empty folder or a true root is NOT damage — the fs is the discriminator.

## Repair (class-level data-migration, gated dry-run+count, R40.31, fs = source of truth)
For every Folder unit:
1. **One store:** relocate the unit file into `scenario/index` (where models live) + symlink it where it belongs (room folder → the room files dir beside siblings, like a file; src folder → the model index) — through the ONE become-a-unit path, not a folder-copy.
2. **Populate `children[]`** from the unit's real filesystem `location`: each child file/subdir → its unit ior. (The fs has the truth; the model must match it.)
3. **Set `parent`** from the `location` path's parent segment → the parent folder's unit ior. Top-level/root folders keep `parent=null` legitimately.
4. INV: no unit content lost; the rendered `/api/trace/children` + tree stay consistent with the fs after repair (the model now DESCRIBES the thing).
- Do NOT hand-patch demo. Repair drives the whole class; demo falls out.

## ★ FAILABLE CHECK (the proof the repair worked — three single numbers, each must be 0)
A gate `check-folder-model-describes-fs` (failable, self-biting; RED now):
1. **empty-model-nonempty-fs == 0:** count Folder units with `children=[]` while `resolveFolderRefToDir(location)` HAS entries. (RED now: the demo/js/ts class.)
2. **null-parent-while-nested == 0:** count Folder units with `parent=null` while `location` has a parent segment (is nested). (RED now: most of the 79.)
3. **folder-unit-outside-one-store == 0:** count Folder units NOT in `scenario/index` (i.e., still in model-store). (RED now: 82.)
Each is one number proving the model DESCRIBES the thing it models, the parent-truth lives in ONE place (the field, not the path), and folders live in the one store. Prove each RED before trusting green (self-biting), then repair → 0 → wire into ci:gates (report-only until 0, flip to strict at 0 = the fix is durable). This check is also the DEFINITION OF DONE for the repair: green = the class is repaired, not just demo.

## Handoff
req mints the repair req + the 3 failable ACs. planner stands up the gated migration task. expert builds the migration (through the one become-a-unit path — no folder-copy) + the check script. I backstop: the 3 counts RED→0, fs=source-of-truth (no loss), one store, and the check is genuinely failable. This lands UNDER the folder-is-a-unit ship (same law) — the ship gives NEW folders the right representation; this repair fixes the EXISTING damaged class. Sequence per PO.
