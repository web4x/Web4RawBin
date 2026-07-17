# R30.25 — Picking a branch on the RIGHT blanks the LEFT editor (live Tron bug)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** diagnosis + fix spec → hand to req (scenario-first, #126) · **Date:** 2026-07-16
**Class:** RbDiffEditor `18165081` REUSE · **crossRef:** R30.17 TRON4 left-history promote (751934c1) · R30.24 deep-link guard.

## Symptom (Tron, live)
In the 3-way diff editor, selecting a branch on the RIGHT (Repository) editor makes the LEFT (Local) editor go EMPTY.

## Root cause (MEASURED — asymmetric race, promote vs right-pick)
`edLocal` is blanked only by `loadSide('left', content='')` (rb-diff-editor.ts:169). The ONLY side-effect path that calls `loadSide('left')` is **`populateLeftHistory`** (marker `751934c1`, the R30.17 TRON4 "older-on-left" auto-promote), reached fire-and-forget from `loadSide:173` (`void populateLeftHistory()`) whenever a working file loads on the left.

`populateLeftHistory` does, across two awaited fetches:
1. **:609** unconditionally REPLACES `this.right` with the promoted working buffer.
2. `await` file-history (:615) + `await` newestContent (:624).
3. **:625** computes `defaultIdx` by reading **live `this.right.content`**.
4. **:627** fire-and-forget `void loadSide('left', { ref: history[defaultIdx] })`.

**The defect is an ASYMMETRY.** Guards exist for every case EXCEPT a right-pick:
- `_leftUserPicked` (:530, :627) → an explicit LEFT pick WINS over the async default. ✅
- `_deepLink` (:173, :575) → suppresses the promote during a URL restore so it can't clobber the RIGHT. ✅
- **`_rightUserPicked` — DOES NOT EXIST.** `setSideRef('right')` / `pickRef('right')` set no flag, and `populateLeftHistory` checks none.

So when the user picks a branch on the RIGHT while the promote is in flight (or the promote fires right after):
- `setSideRef('right')` → `loadSide('right')` sets `this.right` = file@branch — no flag raised.
- The promote resumes: :625 now reads the **mutated** `this.right.content` (file@branch, not the promoted working) → `defaultIdx` mis-derives; :627's `void loadSide('left', …)` reloads LEFT and races the right-pick's `computeMergedCenter` on the shared `this.left`/`this.right`. The stale promote wins and the LEFT editor ends **blank** (empty/mismatched resolve).

This is exactly the PO-named interaction: `loadSide` / `pickRef` / `populateLeftHistory` / `computeMergedCenter`. Fire-and-forget + no right-side guard + reading live `this.right.content` mid-flight = the blanking.

## Fix spec (impl-edits to existing methods — markers STAY, no new Method; R30.23-style boundedness)
1. **Symmetric `_rightUserPicked` guard** — set in `setSideRef('right')` (and the right history/ref path). `populateLeftHistory` must, when `_rightUserPicked`: NOT replace `this.right` (:609) and NOT run its default left-reload — a user-driven RIGHT WINS over the auto-promote, exactly mirroring `_leftUserPicked`.
2. **Serialize the promote (kill fire-and-forget)** — `await populateLeftHistory()` at :173; give it an in-flight generation token. If a newer `loadSide` (either side) begins, the stale promote's tail (:627) aborts on token mismatch so it can never reload LEFT over a fresh user pick.
3. **Snapshot working content** — in `populateLeftHistory` capture `const workingContent = this.left.content` BEFORE the awaits; use it at :625 for `defaultIdx` instead of the live `this.right.content`.

Rides existing Impls (markers unchanged): `loadSide` `c4da837c`, `populateLeftHistory` `751934c1`, `pickRef`/`setSideRef` `f0b7ef57`. New private field `_rightUserPicked` + `_promoteToken`. No new Class/Method.

## Chain to mint (req, scenario-first). RbDiffEditor 18165081 REUSE, impl-edit.
| Hop | Unit | name (EXACT) |
|-----|------|--------------|
| Req  | new R30.25 | Picking a RIGHT ref preserves the LEFT side — no blanking |
| UC   | new | `diffEditor.rightPickPreservesLeft` |
| Class| REUSE | `RbDiffEditor` (18165081) |
| Method | REUSE (impl-edit) | `RbDiffEditor.populateLeftHistory` (751934c1) + `RbDiffEditor.loadSide` (c4da837c) + `RbDiffEditor.setSideRef`/`pickRef` (f0b7ef57) |
| Test | new | right-pick-preserves-left DET-3x (AC below) |

## LOCKED AC (anti-regression, DET-3x)
1. **FIRES:** open a working file (promote → older-on-left) → pick a branch on the RIGHT → LEFT still renders its content, RIGHT = file@branch, center recomputes. LEFT NEVER blanks. Include the **race window**: pick the RIGHT branch immediately after open (promote still in flight).
2. **TRON4 preserved:** working-file left load with NO right interaction still auto-promotes (older-on-left) as before.
3. **No regression:** R30.17 left PICK-WINS + R30.24 `_deepLink` suppression both still hold.
4. **State sane:** after the right-pick, `buildShareLink`/`openFromParams` (R30.24) still round-trip.

## Instrumentation (tester CONFIRM the interleave — measure, don't assume)
Add `addLog` at promote entry/exit, `loadSide(side,ref)`, `setSideRef(side)` → on the repro, capture the event order (server log ring / tmux `-S -2000 -J -p`) and verify the promote's :627 left-reload fires AFTER the right-pick. Gate the fix by re-running the same trace showing NO post-pick left-reload.

## ★ SHARPENED INVARIANT (TRON re-confirmed live, 2026-07-17)
**"RIGHT-pick touches ONLY right + center, NEVER left."** Setting the RIGHT (3rd/Repository) editor to a branch (e.g. `dev`) must → CENTER re-evaluates the LEFT↔RIGHT diff, and the LEFT editor stays COMPLETELY UNTOUCHED (no reload, no blank, no promote).

**Confirmed enforcement (measured):** every RIGHT action (`setSideRef`/`pickRef`/repo-selector) routes to `loadSide('right')`, which writes ONLY `this.right` + `edRemote` + `computeMergedCenter` (center re-eval reads `this.left.content` READ-ONLY). No RIGHT path directly writes left. The ONLY invariant violator is the promote race: `populateLeftHistory`'s fire-and-forget `loadSide('left')` (:627, or the promote's `this.right` replace :609) resuming during/after a right-pick. The 3-part fix maps exactly:
- `_rightUserPicked` (set in `setSideRef('right')`) ⇒ `populateLeftHistory` skips BOTH the `this.right` replace (:609) AND the left-default reload (:627) — so a user-driven right can never trigger a left touch/promote.
- serialize + generation token ⇒ any promote already in flight when the right-pick starts aborts its :627 tail on token-mismatch (never reloads left over the pick).
- working-content snapshot ⇒ :625 default never reads a right-mutated buffer.
Net: right-pick → right + center only; left byte-untouched. Add an assertion-grade AC: capture `edLocal` value + `this.left` {path,ref,content} BEFORE and AFTER a right-pick — MUST be identical.

## Handoff
req mints (scenario-first) → planner tasks → I derive-confirm the impl-edit reuse (markers stay, no new units) → PO build-go → expert (pure client, no restart) → tester DET-3x + instrumentation trace → Tron verify.
