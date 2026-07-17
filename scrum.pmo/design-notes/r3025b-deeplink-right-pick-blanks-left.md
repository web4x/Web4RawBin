# R30.25-B — Deep-link → RIGHT-pick blanks LEFT (v0.7.37 fixed the WRONG path)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** analysis + INSTRUMENTATION-FIRST spec → req scenario-first · **Date:** 2026-07-17
**Class:** RbDiffEditor `18165081` · **crossRef:** R30.25 (a604a1b5, promote-path fix — GREEN but wrong path) · R30.24 openFromParams.

## Tron's EXACT repro (deterministic)
1. Open deep-link `/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1` → `openFromParams` sets BOTH sides (LEFT=516ebb3, RIGHT=dev), both render.
2. THEN change the RIGHT editor's branch → LEFT goes EMPTY.
v0.7.37's gate tested the working-file **promote** flow, not this deep-link flow → the `_rightUserPicked`/token/promote guard doesn't touch this path.

## MEASURED: the static right-pick path does NOT write LEFT
Exhaustive enumeration (rb-diff-editor.ts):
- **Every `loadSide('left')`**: :585 (openFromParams open only), :635 (LEFT history-select only), :644 (populateLeftHistory promote only).
- **Every `edLocal.setValue`**: :129 (init), :172 (loadSide side='left'), :508 (swapSides / ⇄ button).
- Deep-link right-pick routes `pickRef('right')→setSideRef('right')→loadSide('right')` — writes ONLY `this.right`+`edRemote`+`computeMergedCenter` (:150-176). `showDiff(preselect:false)` returns early (:67, no left preselect). Deep-link has NO promote (`_deepLink`/`ref` guards) → :644 unreachable.
**⇒ No static path lets a right-pick write LEFT after the deep-link settles.** The promote-race model (R30.25) genuinely does not apply. This is a RUNTIME condition — and we must MEASURE it, not guess again (v0.7.37 already shipped a wrong-path green).

## ★ SYMPTOM MISMATCH RESOLVED — TWO DIFFERENT BUGS (2026-07-17, PO flag)
Tester's deep-link repro: LEFT byte-IDENTICAL + RIGHT-corrupt. Tron: LEFT-empty. These are **two distinct bugs**, and my exhaustive static analysis proves which is which:

**BUG-1 (tester, set-right): RIGHT-corrupt.** The set-right recompute path is now FULLY exonerated of any left-write — `loadSide('right')` (:150-176), `resolveBase` (:283-292, reads state, writes nothing), `computeMergedCenter`, `renderMergeGutter`/`alignPaneRows`/`renderSideChangeBlocks` (viewzones+decorations, not content). **Set-right leaves LEFT byte-identical — the tester is correct.** The right-corruption is a separate defect (likely the openFromParams await-order overwriting the picked right, or wrong content on the right load) — NOT the LEFT-empty.

**BUG-2 (Tron, LEFT-empty) = the DEEP-LINK OPEN's LEFT load, NOT set-right.** Since NO code path lets set-right write/blank LEFT, Tron's LEFT-empty must originate when `openFromParams` loads the LEFT (`loadSide('left', {ref:516ebb3})`, :585). Tron perceives it "on set-right" because that's when he interacts — but LEFT was empty from OPEN. The mount-race is ruled out (self-corrects: loadSide sets `this.left.content` at :171 before the null-guarded setValue :172-173, and `mountThreePane` create :129 reads `this.left.content`). That leaves ONE deterministic cause:

**PRIMARY (H-A): the deep-link LEFT ref/path/repo does not resolve → LEFT loads EMPTY, silently.** `loadSide('left',{ref:'516ebb3'})` → `/api/git/file?ref=516ebb3&path=otmux&repo=oosh`. If `!res.ok` → early-return at :163 **with NO setValue** (edLocal keeps its empty created value); or content='' at :169 → `edLocal.setValue('')`. Either way LEFT is empty from OPEN, with only a `status()` message (silent blank pane). Causes to check on Tron's exact URL: ambiguous 7-char short-hash `516ebb3`, `otmux` being a repo/dir not a file-path-in-commit, or the `repo=oosh` key not applied. The tester's repro used a resolvable left ref → LEFT loaded → tester saw only BUG-1.

**ONE measurement to confirm H-A:** log the `/api/git/file?ref=516ebb3&path=otmux&repo=oosh` response (status + content.length) at loadSide's left branch on Tron's exact URL. Empty/non-ok ⇒ H-A confirmed.

**FIX direction (once confirmed):** deep-link side-load failure must be LOUD, not a silent blank — error banner "LEFT ref `516ebb3` not found for path `otmux` (repo oosh)" + keep the pane in an explicit error state; and fix the underlying ref/path/repo resolution (short-hash disambiguation / path validation / repo-key application). Gate: deep-link with a BAD left ref shows an error (not blank); with a GOOD ref LEFT populates + stays populated across set-right.

## Superseded runtime hypotheses (kept for trace, if H-A refuted)
- **H1 — openFromParams await-sequence re-entrancy.** `openFromParams` awaits LEFT (:585) THEN RIGHT (:586) under `_deepLink=true`. If changing the right branch re-enters `openFromParams` (URL update / re-nav) OR interleaves with a still-in-flight open, :581 `this.left = {…content:''}` resets LEFT to empty and the LEFT reload (:585) may be skipped/lost → LEFT blank. (edit.ts calls openFromParams once at :147 with no popstate — but a branch-driven URL/pushState path would re-trigger it; MEASURE whether openFromParams fires a 2nd time on the right-branch change.)
- **H2 — computeMergedCenter/resolveBase throw on the new ref pair.** Changing RIGHT recomputes `resolveBase(leftRef, newRightRef)` (:188). If the merge-base or 3-way diff throws mid-recompute (after `conflicts`/`centerSeq` cleared :186-187), a partial render could leave a pane blank. MEASURE: does computeMergedCenter throw / does rebuildCenter run to completion after the right-pick?
- **H3 — Monaco viewZone/decoration (alignPaneRows :318, renderSideChangeBlocks :358) resets edLocal** on the new diff shape. MEASURE: is `edLocal.getValue()` non-empty AFTER the right-pick recompute?

## INSTRUMENTATION-FIRST chain (req mints scenario-first — THIS is the first deliverable, not a fix)
Add `addLog`-style telemetry (POST to the existing `/api/<debug-sink>` → server log ring; read via tmux `-S -2000 -J -p`) at:
- `loadSide` entry+exit: `side, ref, contentLen, willSetValue`.
- every `edLocal.setValue(v)`: `v.length` + a stack marker (init / loadSide / swapSides).
- `openFromParams` entry+exit (+ a call-count) — catches H1 re-entrancy.
- `setSideRef(side,ref)`, `computeMergedCenter` entry/exit + `resolveBase` result, any thrown error in the recompute.
Tron reproduces the EXACT deep-link→right-pick; capture the event order. The trace pins which of H1/H2/H3 fires (or a 4th) → THEN the fix chain from the measured cause.

**Chain to mint now:** Req R30.26 "Deep-link RIGHT-pick preserves LEFT" (or extend R30.25) → UC `diffEditor.deepLinkRightPickTelemetry` (instrumentation) → Class RbDiffEditor `18165081` REUSE → impl-edit riders on `loadSide` [c4da837c] + `openFromParams` [dc236c19] + `computeMergedCenter` [a0b30550] (markers STAY; telemetry added under them) + new Test = the captured trace as evidence. The FIX chain follows once the trace lands.

## AC (the eventual fix — invariant unchanged from R30.25)
Deep-link open (both sides set) → change RIGHT branch → `edLocal.getValue()` + `this.left`{path,ref,content} BYTE-IDENTICAL before/after; RIGHT=new branch; CENTER re-evaluates. Gate on the DEEP-LINK path specifically (not the promote path) — DET-3x + Tron on the exact URL.

## Handoff / discipline
Do NOT ship another fix before the trace confirms the cause (v0.7.37 = wrong-path green; match the diagnostic to the bug physics — runtime interleave needs a runtime trace). req mints instrumentation → expert builds telemetry (pure client) → Tron reproduces → I read the trace + hand the pinpoint fix chain → build → gate on the deep-link path.
