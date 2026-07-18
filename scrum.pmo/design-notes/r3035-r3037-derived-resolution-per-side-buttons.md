# R30.35+R30.37 OPTIMIZE — resolution DERIVES from center line-count; per-side buttons keyed on center-state (FOR TRON REVIEW)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** design + DESIGN QUESTION → Tron review → build · **Date:** 2026-07-18
**Class:** RbDiffEditor `18165081` · **Refines:** R30.35 (both-versions center) + R30.37 (resolution `toggleResolved c86a104d`) · gutter `renderInterPaneGutters fd99c520`.

## The optimized model (Tron)
For a change, the CENTER holds the left and/or right version. **Resolution DERIVES from the center line-count: 1 line = RESOLVED, 2 lines = UNRESOLVED.** Buttons are per-side and keyed on center-state:
- **`✕` shows ONLY when center holds BOTH versions (2 lines)** — one per side (left-`✕` / right-`✕`). Press → REMOVE that side → center = 1 line → **auto-RESOLVE + `jumpToChange(next unresolved)`**.
- **`≫`/`≪` shows when that side is NOT in center.** Press → ADD that side → 2 lines = unresolved / 1 line = resolved (derive).

### Per-side button visibility (keyed on center-state)
Let `L` = left version in center, `R` = right version in center.
| center-state | LEFT side shows | RIGHT side shows | derived |
|--------------|-----------------|------------------|---------|
| L+R (2 lines) | `✕` left-remove | `✕` right-remove | UNRESOLVED |
| L only (1 line) | — (sole line) | `≪` add-right | RESOLVED |
| R only (1 line) | `≫` add-left | — (sole line) | RESOLVED |
| neither (0) | `≫` add-left | `≪` add-right | (empty — treat unresolved) |
Rule per side: **in-center + other-side-also-in → `✕`(remove this) · not-in-center → add(`≫`/`≪`) · sole-in-center → nothing.**

## Actions
- **`✕` (remove side):** drop that side from the region's included set → count 2→1 → **derived RESOLVED** → `jumpToChange(next unresolved)`.
- **`≫`/`≪` (add side):** union that side into the included set → count → derive resolution (2=unresolved / 1=resolved). No jump.
- Both keyed off the R30.35 both-versions included-set per region (`leftInCenter`/`rightInCenter`).

## ★ DESIGN QUESTION FOR TRON — reconcile with R30.37 explicit checkmark
Resolution is now DERIVED. Two options for the R30.37 checkmark (`toggleResolved` `c86a104d`):
- **(A) PURELY DERIVED** — resolution = center line-count, full stop. The green checkmark becomes a **read-only DERIVED INDICATOR** (solid when 1 line, outlined when 2). No manual toggle. Cleanest, single source of truth, zero ambiguity. `openChangeCount` = # changes with 2 lines.
- **(B) DERIVED + MANUAL OVERRIDE** — derived by default, BUT the checkmark can force-RESOLVE a 2-line change (for the legit case: the user WANTS both versions in the result and calls it done). Override is sticky until any `≫`/`≪`/`✕` re-derives. Keeps `toggleResolved` as an escape hatch.
**Architect recommendation: (B-lite)** — derived is the source of truth (drives the indicator + `openChangeCount` + auto-jump); keep the checkmark ONLY as an override for "resolved WITH both versions" (otherwise a genuine keep-both merge could never complete under pure-derive). If Tron never wants a 2-line result marked resolved, choose (A) and drop the manual toggle. **Tron decides A vs B.**

## Impl spec (after Tron's A/B ruling — build nothing yet)
- **`renderInterPaneGutters` [fd99c520] (impl-edit):** re-gate visibility from `c.a.length>0`/`c.b.length>0` (`:500`) to CENTER-STATE: per side show `✕` iff (thisSideInCenter && otherSideInCenter); show add(`≫`/`≪`) iff !thisSideInCenter; else nothing. Uses the R30.35 included-set.
- **`✕` handler:** removeSide(id, side) → included-set −side → `renderMergeGutter()` → if count==1 `jumpToChange(+1 to next 2-line change)`.
- **`≫`/`≪` handler:** addSide(id, side) → included-set +side → `renderMergeGutter()` (derive; no jump).
- **`isResolved(change) = centerLineCount(change) === 1`** (derived). `openChangeCount() = conflicts.filter(c => centerLineCount(c) !== 1).length`. REMOVE the R30.36 `_resolved.add/delete` on actions — resolution is derived, not a set (unless option B keeps an `_override` set).
- **`toggleResolved` [c86a104d]:** option A → repurpose to a read-only indicator refresh (no state change) — flag on derive; option B → sets an `_override` (sticky force-resolved) cleared on any action.
- **Checkmark button (R30.37):** outlined = unresolved (2 lines), solid = resolved (1 line) — now driven by the derived count (+ override under B).

## LOCKED AC (DET-3x) — after approval
1. 2-line change → both sides show `✕`; no `≫`/`≪`. Press left-`✕` → left removed → 1 line → RESOLVED (checkmark solid) → jumps to next 2-line change.
2. 1-line change → the MISSING side shows its add(`≫`/`≪`); the present side shows nothing; state RESOLVED.
3. Press add on a 1-line change → 2 lines → UNRESOLVED (checkmark outlined).
4. `openChangeCount` = # 2-line changes; auto-decrements on `✕`; increments on add-to-2.
5. Resolution reflects center line-count (A: purely; B: unless manually overridden). Wording = RESOLVED.

## Handoff
Tron rules A vs B → req reconciles R30.37 (toggleResolved role) + R30.35 (button-visibility AC) → I derive-confirm (impl-edit `renderInterPaneGutters fd99c520` + action handlers + `openChangeCount 643de373` derive; markers stay) → PO build-go → expert → I backstop → tester DET + Tron. **No build until Tron picks A/B.**
