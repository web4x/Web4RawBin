# R30.35 REWORK — Composable BOTH-versions center (Tron model) — FOR TRON REVIEW, build nothing

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** model rework → Tron review → req reworks UCs → build · **Date:** 2026-07-18
**Class:** RbDiffEditor `18165081` · **Grounded:** `prod.wo-da.de:4444/edit/otmux?repo=oosh&left=mcdonges.latest&right=dev&3way=1` **line 38** (left≠right). **Supersedes the pick-side model.**

## The CORRECT model (Tron)
The CENTER (Result) shows **BOTH** the left AND the right version of a changed region simultaneously — **older = DARK, newer = HIGHLIGHTED**. The user COMPOSES the merge by adding/removing lines:
- **`≫` = put LEFT into center** → ADD the left (local) version's lines. Idempotent. Does NOT remove the right — both COEXIST.
- **`≪` = put RIGHT into center** → ADD the right (repo) version's lines. Coexists with left.
- **`✕` = REMOVE a line from center — ALWAYS.** Drop a line/version you don't want.
- **Both can coexist** (click `≫` and `≪` → center holds both versions). **No ignore, no dismiss, no pick-a-side.**

Line 38 (mcdonges.latest ≠ dev): the center should show BOTH the `mcdonges.latest` line (older/dark) AND the `dev` line (newer/highlighted); `✕` drops whichever you reject; `≫`/`≪` add either back.

## What v0.7.51 does (why it's ALL wrong vs the new model)
- `Conflict.pick: 'a'|'b'` — ONE choice per region. `rebuildCenter` (`:307`) emits `pick==='b'?c.b:c.a` → CENTER shows exactly ONE version. **Both can never coexist.**
- `acceptChange(id,side)` (`:526`) SETS `pick` → `≫`/`≪` REPLACE the center region with that side (kills the other). NOT additive.
- `✕`/ignore (`:157`) = visual dismiss (hide overlay), center UNCHANGED. NOT a line removal.
So every action is wrong vs Tron's model: `≫`/`≪` replace instead of add-and-coexist; `✕` hides instead of removes; center holds one instead of both.

## REWORK — 3 changes (design; NOT implemented)
1. **CENTER holds BOTH versions per changed region**, styled older=dark / newer=highlighted. rebuildCenter emits, per region, the region's **included-line SET** (initially both sides), not a single picked side.
2. **`≫` add-left / `≪` add-right** — each ADDS its side's lines to the region's included set (idempotent; coexist). Replace `acceptChange(id,side:pick)` with `addSide(id, side)` that unions the side's lines into the set.
3. **`✕` remove-line — always** — removes the targeted line from the included set (per-line `✕`, not per-block dismiss). New `removeLine(id, lineRef)`.

### Data-model change
Replace `Conflict.pick: 'a'|'b'` with `Conflict.included: <ordered set of line refs>` = (left lines ∪ right lines) − removed. Default = both sides included. `rebuildCenter` emits the included set in order, tagging each line's origin+age for the dark/highlighted styling. `≫`/`≪` union; `✕` subtracts. Merge RESULT = the composed included set (can legitimately contain both versions).

## Matrix (reworked) — `diagrams/R30.35-merge-actions-matrix.{svg,puml}`
Axes: {MODIFY, CONFLICT, ADD, DELETE, MODEL} × {`≫` add-left, `≪` add-right, `✕` remove-line}. Each cell = EXPECTED (new model) vs NOW (v0.7.51 pick-model). Nearly all **BROKEN** — this is a MODEL replacement, not per-cell tweaks. Same 16 UC uuids (dual-links intact); **req reworks each `UC.expectedBehaviour` to the add/remove semantics.**

## FOR TRON REVIEW (before any build)
- Confirm: center shows BOTH versions (older dark/newer highlighted); `≫`=add-left, `≪`=add-right (coexist), `✕`=remove-line-always; no ignore/pick.
- Confirm the data-model (included-line set per region) + that a legit result may contain both versions.
- On approval: req reworks the 16 UC.expectedBehaviour; I derive-confirm; then impl-edit `rebuildCenter`/`acceptChange`→`addSide`/new `removeLine` + block rendering (dark/highlighted). **HARD GATE: nothing built until Tron approves this model + SVG.**
