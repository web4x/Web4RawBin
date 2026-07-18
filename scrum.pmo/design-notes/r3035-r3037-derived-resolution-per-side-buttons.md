# R30.35+R30.37 OPTIMIZE — resolution DERIVES from center line-count; per-side buttons keyed on center-state (EXPERT BUILD SPEC)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** DECIDED — build directly (Tron: "build it, I review at QA" — NO pre-approval); tester gates → QA-Review → Tron · **Date:** 2026-07-18
**Class:** RbDiffEditor `18165081` · **Refines:** R30.35 (both-versions center) + R30.37 (resolution `toggleResolved c86a104d`) · gutter `renderInterPaneGutters fd99c520`.
**DECISION (architect, Tron-directed): OPTION A — resolution is PURELY DERIVED from center line-count. The green checkmark is a DERIVED read-only INDICATOR (outlined=2 lines/unresolved, solid=1 line/resolved). No manual toggle.**

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

## R30.37 reconciliation — DECIDED: OPTION A (purely derived)
Resolution = center line-count (1=resolved, 2=unresolved). The R30.37 checkmark stays as a **read-only DERIVED indicator** — solid when the change is 1 line, outlined when 2 lines — driven by the count, NOT clicked. `toggleResolved` [`c86a104d`] is repurposed from a manual toggle to the derived-indicator refresh (no state mutation). `openChangeCount` = # changes with 2 lines. Single source of truth, no dual state. (If a genuine keep-both result is ever needed, that's a future explicit-override feature — not now.)

## Impl spec (BUILD DIRECTLY — expert)
- **`renderInterPaneGutters` [fd99c520] (impl-edit):** re-gate visibility from `c.a.length>0`/`c.b.length>0` (`:500`) to CENTER-STATE: per side show `✕` iff (thisSideInCenter && otherSideInCenter); show add(`≫`/`≪`) iff !thisSideInCenter; else nothing. Uses the R30.35 included-set.
- **`✕` handler:** removeSide(id, side) → included-set −side → `renderMergeGutter()` → if count==1 `jumpToChange(+1 to next 2-line change)`.
- **`≫`/`≪` handler:** addSide(id, side) → included-set +side → `renderMergeGutter()` (derive; no jump).
- **`isResolved(change) = centerLineCount(change) === 1`** (derived). `openChangeCount() = conflicts.filter(c => centerLineCount(c) !== 1).length`. **REMOVE the R30.36/R30.37 `_resolved` set + its `.add/.delete` on actions/checkmark** — resolution is derived, not stored.
- **`toggleResolved` [c86a104d]:** repurpose from a manual toggle to a derived-indicator refresh — reads `centerLineCount(_currentId)`, sets the checkmark outlined/solid, mutates NO state. (Bound to nothing clickable, or the checkmark is a non-interactive `<span>`.)
- **Checkmark (R30.37):** outlined = 2 lines (unresolved), solid = 1 line (resolved) — driven purely by the derived count; refreshed on every add/remove + jump.

## LOCKED AC (DET-3x)
1. 2-line change → both sides show `✕`; no `≫`/`≪`. Press left-`✕` → left removed → 1 line → RESOLVED (checkmark solid) → jumps to next 2-line change.
2. 1-line change → the MISSING side shows its add(`≫`/`≪`); the present side shows nothing; state RESOLVED.
3. Press add on a 1-line change → 2 lines → UNRESOLVED (checkmark outlined).
4. `openChangeCount` = # 2-line changes; auto-decrements on `✕`; increments on add-to-2.
5. Resolution reflects center line-count purely (checkmark = derived indicator, never clicked). Wording = RESOLVED.

## Handoff — build directly (no pre-review)
req reconciles R30.37 (toggleResolved → derived indicator) + R30.35 (center-state button-visibility AC) → I derive-confirm (impl-edit `renderInterPaneGutters fd99c520` + add/remove handlers + `openChangeCount 643de373` derived + `toggleResolved c86a104d` → indicator; markers stay, no new units) → **PO build-go → expert builds → tester DET-gates → QA-Review → Tron reviews at QA.** No Tron pre-approval.
