# R30.37 — Resolution model: explicit green-checkmark resolve, action un-resolves (corrects R30.36 auto-resolve)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** design → req mints → build · **Date:** 2026-07-18
**Class:** RbDiffEditor `18165081` · **crossRef:** R30.36 nav-aids (`_resolved` `:454`, `openChangeCount` `:583`, jump nav `:81-82`).

## The model (Tron)
A change is RESOLVED only when the user explicitly marks it via a **green checkmark** (wording: **"resolved"**, NOT "commit change") next to the up/down nav. Any edit to the change (≫/≪/✕) makes it UNRESOLVED again. **Resolution is ONE per CHANGE — one resolved-state, one checkmark** (a both-versions change rendered as two per-side blocks per R30.38 is still ONE change with ONE resolved flag).
- **Green checkmark toggle** in the 3-Way Merge toolbar, beside ▲/▼ nav. Reflects/toggles the CURRENT (nav-focused) change.
- **OUTLINED-green = unresolved · SOLID-green = resolved.**
- **Clicking ANY action (≫ addLeft / ≪ addRight / ✕ removeLine) RESETS that change to UNRESOLVED** (you changed the composition → must re-confirm).
- **openChangeCount = # UNRESOLVED.** The toolbar "N conflicts to resolve" = unresolved; **decrements on checkmark (12→11), increments when an action resets a resolved change (11→12).**

## ★ R30.36 is BACKWARDS — reverse it
Built code AUTO-resolves on action: `acceptChange` `:563` and `✕` `:575` both `this._resolved.add(changeId)`. That's the OPPOSITE. Correct model = **checkmark resolves; action un-resolves.**

## EXPERT IMPL SPEC (exact)
**1. Toolbar button** (impl-edit connectedCallback toolbar `:77-85`, insert after `.de-jump-next` `:82`):
```
<button class="de-resolve" title="Mark resolved">✓</button>
```
CSS — reflects the CURRENT change's flag:
```
.de-resolve            { border:2px solid #2ecc71; color:#2ecc71; background:transparent; font-weight:800; }  /* UNRESOLVED = outlined */
.de-resolve.resolved   { background:#2ecc71; color:#fff; }                                                    /* RESOLVED = solid   */
.de-resolve:disabled   { opacity:.35; }                                                                       /* no current change  */
```
**2. NEW Method `RbDiffEditor.toggleResolved()`** (mint a marker) — bound to `.de-resolve` click:
```
toggleResolved(): void {
  if (this._currentId == null) return;
  if (this._resolved.has(this._currentId)) this._resolved.delete(this._currentId);   // solid → outlined
  else this._resolved.add(this._currentId);                                          // outlined → solid
  this.updateResolveButton(); this.renderMergeGutter();   // refresh button + counter + block badge
}
```
**3. REVERSE auto-resolve** — at the action handlers `acceptChange`/addSide `:563` and removeLine/✕ `:575`: replace `this._resolved.add(changeId)` with **`this._resolved.delete(changeId)`** (any action → UNRESOLVED). (Applies to whatever the reworked add/remove actions become under the R30.35 model.)
**4. `updateResolveButton()`** (NEW helper): `const el=this.querySelector('.de-resolve'); el.disabled = this._currentId==null; el.classList.toggle('resolved', this._currentId!=null && this._resolved.has(this._currentId));` — call from `jumpToChange` (current changed), `toggleResolved`, and after any action.
**5. `openChangeCount()` `:583`** — formula unchanged (`conflicts.filter(!_resolved.has(id)).length` = UNRESOLVED); now driven by the checkmark, not actions.
**6. Counter `.de-count` `:80/:365`** — render "`K conflicts to resolve`" = `openChangeCount()`; recompute after checkmark + every action → decrements/increments live to 0.
**7. Per-block badge** (recommended, impl-edit `renderCenterChangeBlocks 37c9694c`): resolved change → small SOLID-green ✓ badge on its center block; unresolved → none → progress visible across all changes.
**8. Reset** — `_resolved.clear()` on recompute (`:231`) already correct (fresh merge → all unresolved).

## Chain to mint (req R30.37, scenario-first). RbDiffEditor 18165081 REUSE.
| Hop | Unit | name (EXACT) |
|-----|------|--------------|
| Req  | new R30.37 | Resolution model — explicit green-checkmark resolve; any action un-resolves; count = unresolved |
| UC   | new | `diffNav.commitChangeToggle` → **NEW Method** `RbDiffEditor.toggleResolved` [mint marker] |
| UC   | new | `diffNav.actionUnresolves` → impl-edit the action handlers (`_resolved.delete`) + `openChangeCount` semantics |
| Class| REUSE | `RbDiffEditor` (18165081) |
| Test | new | resolution DET (AC below) |
Impl-edit riders (markers STAY): `openChangeCount 643de373` (now unresolved via checkmark), acceptChange/addSide `843d79d4`, removeLine, `renderCenterChangeBlocks 37c9694c` (badge), connectedCallback `ef6708f6` (button).

## LOCKED AC (DET-3x)
1. Green checkmark beside ▲/▼: OUTLINED-green when current change unresolved, SOLID-green when resolved; disabled when no current change.
2. Click checkmark → toggles CURRENT change resolved/unresolved; counter "N to resolve" −1 on resolve, +1 on un-resolve.
3. Clicking ANY ≫/≪/✕ on a change → that change becomes UNRESOLVED (checkmark outlined, counter +1 if it was resolved).
4. `openChangeCount()` = # unresolved; reaches 0 only when the user has checkmarked every change.
5. Recompute clears all resolved (fresh merge → all unresolved).
6. (recommended) each resolved change's block shows a solid-green ✓ badge.

## Handoff
req mints R30.37 → I derive-confirm (NEW toggleResolved name-exact/marker + impl-edit reversals; markers stay) → PO build-go → expert → I backstop (checkmark states + action-unresolves + count) → tester DET + Tron. **Independent of the R30.35 merge-action HARD GATE** (this is resolution UI; it hooks whatever the reworked actions become).
