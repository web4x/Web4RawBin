# Design: R30.50 — 3-Way Merge Toolbar Optimization (build-ready)

**Author:** robbin-architect@WODA.prod robbinTeam2:0.3 · 2026-07-19 · req 32abea56 (1f3da324e)
**Grounded on:** measured RbDiffEditor toolbar (render :83-92, wiring :114-118), renderMergeGutter (e24dc98a :397-407), openChangeCount (8b6abf77 :688), jumpToChange (65c465fa :611), addSide/removeLine/rebuildCenter (R30.35), save (a88b2b53), updateResolveButton (:636 pattern), R30.41 applyLanguage.
**Build-after:** UC7+delete push. This is design-ahead; expert re-points on build.

## AC-reconciled method-set (4 UCs)

### UC-A merge.changeNumberIndicator — IMPL-EDIT renderMergeGutter e24dc98a (NOT a new method)
**TRON RULED: COMPOSE, not replace — keep the 'X/Y open' count ALWAYS + append 'N selected'.**
- **ACs:** AC-A-indicator-number (show `N selected` = current nav#), AC-A-indicator-live (live on up/down nav). Tron override: do NOT drop the open-count — compose both.
- **Impl-site:** renderMergeGutter :405-407 — the `.de-count` textContent. COMPOSE: `cnt.textContent = (this._jumpIdx >= 0 ? \`${this._jumpIdx + 1} selected · \` : '') + (this.conflicts.length === 0 ? 'clean auto-merge' : \`${this.openChangeCount()}/${this.conflicts.length} open conflict${this.conflicts.length === 1 ? '' : 's'}\`)`. → e.g. `3 selected · 2/5 open conflicts` when navigated; `2/5 open conflicts` before any nav; `clean auto-merge` at 0 conflicts.
- **Live:** jumpToChange sets `_jumpIdx` (:614) then calls renderMergeGutter (:619) → live by construction. No new wiring.
- **EDGE:** `_jumpIdx=-1` (nothing navigated) → omit the `N selected · ` prefix (show the open-count alone).
- **openChangeCount VALUE + DISPLAY both RETAINED** (Tron: keep both counts). The old `• modified` dirty suffix MIGRATES to the Save button (C2 owns saved/unsaved via green/default) — removed from .de-count to avoid duplicating C2's signal.
- Marker: **impl-edit e24dc98a**. (req dropped the proposed updateChangeIndicator 0bf3581c — correct, not an extract.)

### UC-B merge.applyAllBySide — NEW openApplyAllMenu + NEW applyAllFromSide(side)
- **ACs:** AC-B-popup (button opens a popup with 2 modes), AC-B-left-wins (CENTER matches LEFT file = LEFT wins), AC-B-right-wins (CENTER matches RIGHT file = RIGHT wins), AC-B-scope-flag (reconcile label — PO ruling).
- **Semantic (literal AC):** "CENTER matches the LEFT/RIGHT **file**" = wholesale side-copy, resolves ALL conflicts in favor of that side. DISTINCT from the existing applyAllNonConflicting (91c452ae, keep-both-non-conflicting).
**TRON RULED: 3-MODE — keep applyAllNonConflicting 91c452ae + Local-wins + Repo-wins; relabel button 'Apply All'.**
- **openApplyAllMenu()** [NEW, popup via existing overlay() pattern]: `.de-apply-all` click (:116) RE-POINTS from `applyAllNonConflicting()` → `openApplyAllMenu()`; renders **3 options**: (1) 'Non-conflicting only' → `applyAllNonConflicting()` (existing 91c452ae, KEPT); (2) 'All — Local wins' → `applyAllFromSide('left')`; (3) 'All — Repo wins' → `applyAllFromSide('right')`.
- **Button relabel:** `.de-apply-all` text (:85) `✨ Apply All Non-Conflicting` → `✨ Apply All` (label now honest across the 3 modes).
- **applyAllFromSide(side)** [NEW 5fa11089]: set every conflict's inclusion to `side` (`incl[a|b]=true`, other=false) → `rebuildCenter()` → CENTER == that side's file; openChangeCount()→0 (all one-sided); `dirty=true`; `_saved=false`; updateSaveButtonState(). Reuses the R30.35 model → blocks/ribbons/count re-derive normally, Monaco language preserved (setValue on same model, R30.41). NO new spline/decoration code.
- **applyAllNonConflicting 91c452ae = KEPT** (no longer dead) — it is the popup's mode-1. Unchanged behavior.
- **FLAG1 (popup-split) = YES:** openApplyAllMenu (popup render) and applyAllFromSide(side) (action) are separate methods — one concern each.

### UC-C1 merge.guardedSave — NEW saveOrJumpToConflict (wrapper 76e3ab69)
- **ACs:** AC-C-save-guard (save only at 0 open conflicts), AC-C-save-jump (else JUMP to next UNRESOLVED, don't save).
- **NEW wrapper** composing existing primitives (NOT an impl-edit to save): 
  `if (openChangeCount() > 0) { jump to the NEXT UNRESOLVED conflict + status('resolve N conflicts first'); return; } await save(); this._saved = true; updateSaveButtonState();`
- **Re-point** `.de-save` click (:114) `save()` → `saveOrJumpToConflict()`. save (a88b2b53) stays the pure write.
- **IMPORTANT — "next UNRESOLVED" ≠ jumpToChange(1):** jumpToChange(±1) navigates changes of ANY kind (incl. resolved one-sided). AC-C-save-jump wants the next **unresolved** (`!isResolved(c)`). Needs an unresolved-filtered jump: from `_jumpIdx`, find the next `c` with `!isResolved(c)` (guaranteed ≥1 since open>0), set `_jumpIdx` to it, reveal via the jumpToChange reveal mechanics (revealLineInCenter + setPosition + _currentId + renderMergeGutter + updateResolveButton). Small helper or an optional `onlyUnresolved` arg on jumpToChange.

### UC-C2 merge.saveButtonState — NEW updateSaveButtonState (d84c5886)
- **ACs:** AC-C-save-green (GREEN after successful save), AC-C-save-default (DEFAULT on any subsequent change).
- **NEW method** mirroring updateResolveButton (:636): add a `private _saved = false` flag; sets `.de-save` class `saved` (green) when `_saved`, else default.
- **State transitions:** save() success (in C1) → `_saved=true`. EVERY dirty-making site → `_saved=false` + updateSaveButtonState: addSide (:655), removeLine (:668), toggleResolved (override path), applyAllFromSide (UC-B), AND the CENTER manual-edit handler `edCenter.onDidChangeModelContent` (:170, currently only sets dirty=true — add `_saved=false; updateSaveButtonState()`).
- **Call-sites:** renderMergeGutter + save + the same action sites as updateResolveButton, plus the :170 content-change handler. CSS: add a `.de-save.saved { background:#2e7d32 }` rule to the toolbar `<style>` (:81 button block).

## Coexistence (PO ask — editor / spline / highlight)
- **A** = pure `.de-count` textContent → zero interaction with Monaco tokens, decorations, or the SVG spline.
- **B** = inclusion-flags + rebuildCenter (existing R30.35 path) → blocks/ribbons/count re-derive normally; `edCenter.setValue`/rebuild keeps the SAME model → R30.41 language highlight persists; popup uses the existing overlay(). No spline/decoration code touched.
- **C1/C2** = toolbar button state + a filtered reveal (reuses jumpToChange mechanics). No editor/spline/highlight interaction.
- Orthogonal to R30.39/40 (repo/working-file) and R30.41 (highlight). All changes are additive/inline.

## Impl-site table
| UC | Method | Site | New/Edit |
|----|--------|------|----------|
| A | renderMergeGutter | :405-407 (.de-count text) — COMPOSE 'N selected · X/Y open' | IMPL-EDIT e24dc98a |
| B | openApplyAllMenu | NEW; re-point .de-apply-all click :116; 3 modes | NEW |
| B | applyAllFromSide(side) | NEW; incl→side + rebuildCenter | NEW 5fa11089 |
| B | applyAllNonConflicting | 91c452ae :695 = popup mode-1 | KEEP (Tron ruled 3-mode) |
| B | .de-apply-all label | :85 → '✨ Apply All' | IMPL-EDIT (relabel) |
| C1 | saveOrJumpToConflict | NEW; re-point .de-save click :114 | NEW 76e3ab69 (wrapper) |
| C1 | jump-next-unresolved | helper or jumpToChange onlyUnresolved arg | NEW/edit 65c465fa |
| C2 | updateSaveButtonState | NEW; +_saved flag; wire :170 + action sites | NEW d84c5886 |

## Decomposition + build order
UCs: A (indicator) · B (apply-all popup) · C1 (guarded save) · C2 (save-button state). Dependency: A independent; C2 depends on C1 (save success sets _saved); B independent (but its dirty path must call C2). 
**Build order:** A → C2 → C1 → B. (A trivial display; C2 establishes the _saved flag + button render; C1 wires save→green through C2; B last, and its applyAllFromSide dirty-path calls C2.)
Behavior change → commit+bump+rebuild+deploy + DET-3x gate (AC-gate: navigate→#; apply-all L/R→CENTER matches side; save w/ conflicts→jumps unresolved; save@0→saves+GREEN; edit→DEFAULT). **ALL FORKS RULED (Tron 2026-07-19): A=compose both counts; B=3-mode popup + relabel 'Apply All'. Fully build-ready — no open rulings.**
