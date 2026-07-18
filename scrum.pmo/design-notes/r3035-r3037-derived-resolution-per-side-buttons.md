# R30.35+R30.37 OPTIMIZE — resolution DERIVES from center line-count; per-side buttons keyed on center-state (EXPERT BUILD SPEC)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** DECIDED — build directly (Tron: "build it, I review at QA" — NO pre-approval); tester gates → QA-Review → Tron · **Date:** 2026-07-18
**Class:** RbDiffEditor `18165081` · **Refines:** R30.35 (both-versions center) + R30.37 (resolution `toggleResolved c86a104d`) · gutter `renderInterPaneGutters fd99c520`.
**DECISION (req 2f7e1606e, authoritative): OPTION B — resolution DERIVES from center line-count (1=resolved / 2=unresolved) AND the checkmark is a derived INDICATOR + manual OVERRIDE (force-resolve a 2-line keep-both; re-open a 1-line). Any add/remove action re-derives (clears the override).**

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

## R30.37 reconciliation — OPTION B (req 2f7e1606e): derived indicator + manual override
Resolution DERIVES from side-inclusion (below) as the DEFAULT; the checkmark also lets the user OVERRIDE:
- **Indicator (auto):** solid = resolved (one side in center), outlined = unresolved (both sides) — driven by the derive.
- **Override (manual click):** force-RESOLVE a both-sides (2-line keep-both) change, or re-OPEN a one-side (1-line) change. Stored per change; WINS over the derive.
- **Any add/remove action re-derives** — clears that change's override (the composition changed, so the derived state takes over again).
`isResolved(c) = c._override ?? derived(c)`. `openChangeCount()` = # changes where `!isResolved`. `toggleResolved` [`c86a104d`] flips the override for the current change.

## Impl spec (BUILD DIRECTLY — expert)
- **`renderInterPaneGutters` [fd99c520] (impl-edit):** re-gate visibility from `c.a.length>0`/`c.b.length>0` (`:500`) to SIDE-INCLUSION: per side show `✕` iff (`c.incl[thisSide] && c.incl[otherSide]`); show add(`≫`/`≪`) iff `!c.incl[thisSide]`; else nothing. Uses the R30.35 included flags (`incl.a`/`incl.b`).
- **`✕` handler:** removeSide(id, side) → included-set −side → `renderMergeGutter()` → if count==1 `jumpToChange(+1 to next 2-line change)`.
- **`≫`/`≪` handler:** addSide(id, side) → included-set +side → `renderMergeGutter()` (derive; no jump).
- **Derived rule (CONFIRMED per expert — SIDE-inclusion, robust for multi-line sides, NOT literal line-count):** a side (left/right version) can be multi-line, so derive from WHICH SIDES are in center, not the physical count:
  - `unresolved = incl.a && incl.b` (BOTH sides in center) · `resolved = exactly one side` (`incl.a !== incl.b`) · zero sides = empty→treat unresolved.
  - `derived(c) = (c.incl.a !== c.incl.b)` (exactly one side → resolved). **`isResolved(c) = c._override ?? derived(c)`** (override wins). `openChangeCount() = conflicts.filter(c => !isResolved(c)).length`. Marker **[impl 8b6abf77]** `RbDiffEditor.openChangeCount` (:622/:626) — Method uuid = 643de373.
- **Replace the R30.36/R30.37 `_resolved` set with a per-change `_override` (Map id→bool or `c._override?:boolean`)** — NOT set by actions. In the add/removeLine handlers (:603/:616) **delete/clear the override** for that change (re-derive), NOT `_resolved.add`.
- **`toggleResolved` [c86a104d]:** flips the CURRENT change's override — `c._override = !isResolved(c)` (force-resolve a both-sides change, or re-open a one-side change); then refresh checkmark + counter. Still clickable (the manual override).
- **Checkmark (R30.37):** outlined = unresolved, solid = resolved — from `isResolved(c)` (override ?? derived); CLICK flips the override (`toggleResolved`); refreshed on every add/remove + jump.

## LOCKED AC (DET-3x)
1. 2-line change → both sides show `✕`; no `≫`/`≪`. Press left-`✕` → left removed → 1 line → RESOLVED (checkmark solid) → jumps to next 2-line change.
2. 1-line change → the MISSING side shows its add(`≫`/`≪`); the present side shows nothing; state RESOLVED.
3. Press add on a 1-line change → 2 lines → UNRESOLVED (checkmark outlined).
4. `openChangeCount` = # 2-line changes; auto-decrements on `✕`; increments on add-to-2.
5. Resolution DERIVES from side-inclusion; the checkmark also OVERRIDES — click force-resolves a both-sides change (stays solid at 2 sides) or re-opens a one-side change; any add/remove clears the override (re-derive). Wording = RESOLVED.

## Handoff — build directly (no pre-review)
req reconciles R30.37 (toggleResolved → derived indicator) + R30.35 (center-state button-visibility AC) → I derive-confirm (impl-edit `renderInterPaneGutters fd99c520` + add/remove handlers + `openChangeCount 643de373` derived + `toggleResolved c86a104d` → indicator; markers stay, no new units) → **PO build-go → expert builds → tester DET-gates → QA-Review → Tron reviews at QA.** No Tron pre-approval.
