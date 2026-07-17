# R30.27 — 3-pane line alignment is random (one-sided hunks place spacers at line 0)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** root-cause + fix spec → req scenario-first · **Date:** 2026-07-17
**Class:** RbDiffEditor `18165081` · **crossRef:** R30.16 alignPaneRows (17c71adf) · R30.23 computeOneSidedHunks (under computeMergedCenter a0b30550) — **this is an R30.23 regression** · r30x-pane-line-alignment-design.md.

## Invariant (Tron, 4 screenshots)
Identical/corresponding lines must sit on the SAME VISUAL ROW across all 3 panes (line 1 == line 1 == line 1 on Local/Center/Repository). Currently rows look random.

## ROOT CAUSE (measured — hardcoded 0 opposite-side start)
`alignPaneRows` (:319) positions each pane's blank-row spacers by the hunk's per-pane start:
- local spacer `after: c.aStart + c.a.length`, remote `after: c.bStart + c.b.length`, center `after: c.span[1]`; pad = `maxH − thatPane'sBlockLen`.
This is correct — IF `aStart`/`bStart` are the true line positions in each pane.

But `computeOneSidedHunks` (:241-253, added by R30.23) sets the NON-changed side's start to **`0`**:
```
aStart: local ? region.bufferStart : 0,   // repo-only → aStart = 0
bStart: local ? 0 : region.bufferStart,   // local-only → bStart = 0
```
Because `StableRegion` (vendor/diff3.ts:65) carries ONLY `bufferStart` (start in the CHANGED buffer) — it has no opposite-buffer position, so the code fell back to 0.

**Consequence:** for a LOCAL-only change (`b=[]`, needs `maxH−0 = N` spacer rows in the REMOTE pane so remote content shifts down to align), `alignPaneRows` computes remote `after: c.bStart + 0 = 0` → inserts those N spacers at **line 0 (top of the Repository pane)** instead of at the aligned change position. Symmetrically, repo-only changes dump the Local pane's spacers at line 0. Every one-sided change piles its opposite-pane spacers at the top and leaves NONE at the real position → cumulative drift → "random." A pure-conflict diff (both sides present, real aStart/bStart) aligns fine; but real diffs are mostly one-sided → looks random. **R30.23 introduced this** (before it, one-sided regions were folded into `ok` center content and never became padded hunks).

## FIX (impl-edit to computeMergedCenter + computeOneSidedHunks — marker a0b30550 STAYS, no new units)
`StableRegion` can't give the opposite-side position, so THREAD running per-buffer line counters through the region loop (:212-225) and pass the aligned opposite offset into `computeOneSidedHunks`:
```
let la = 0, lb = 0;                                   // running Local / Remote line counts
for (const region of diff3MergeRegions(...)) {
  if (region.stable && region.buffer === 'o') { push ok; la += len; lb += len; continue; }
  if (region.stable && region.buffer === 'a') {       // LOCAL-only
     push computeOneSidedHunks(region, cid, la, lb);   // aStart = la (= bufferStart), bStart = lb  ← aligned remote pos
     la += region.bufferLength;                        // lb UNCHANGED
  } else if (region.stable && region.buffer === 'b') { // REPO-only
     push computeOneSidedHunks(region, cid, la, lb);   // aStart = la, bStart = lb (= bufferStart)
     lb += region.bufferLength;                        // la UNCHANGED
  } else { /* conflict */ aStart=region.aStart; bStart=region.bStart; la=aStart+aLen; lb=bStart+bLen; }
}
```
`computeOneSidedHunks(region, cid, la, lb)` sets `aStart: la, bStart: lb` (drop the `0` fallbacks). Everything else (a/b content, pick, kind='change') unchanged. `alignPaneRows`, `renderCenterChangeBlocks`, `renderSideChangeBlocks`, ribbons — ALL unchanged; they now read correct starts → spacers land at the aligned positions by construction. Advance the `agreed-both-sides` ok-run (:218-219) counters too (la+=len, lb+=len).

## Chain to mint (req, scenario-first). RbDiffEditor 18165081 REUSE, impl-edit.
| Hop | Unit | name (EXACT) |
|-----|------|--------------|
| Req  | new R30.27 | 3-pane rows align — corresponding lines share one visual row across Local/Center/Repository |
| UC   | new | `diffEditor.threePaneRowAlignment` |
| Class| REUSE | `RbDiffEditor` (18165081) |
| Method | REUSE (impl-edit) | `RbDiffEditor.computeMergedCenter` (09af8c8d) [Impl a0b30550] — thread la/lb + fix computeOneSidedHunks starts |
| Test | new | row-alignment DET-3x (AC below) |

## LOCKED AC (DET-3x + Tron visual)
1. **Line 1 == line 1 == line 1**: a 3-way diff with ≥1 one-sided change → the top stable line sits on the SAME visual row in all 3 panes; every corresponding stable line thereafter shares a row.
2. **One-sided insertion aligns**: LEFT inserts N lines → REMOTE shows N blank spacer rows AT that position (not at the top); content below stays row-matched.
3. **Repo-only + conflict** both still align (regression guard on the conflict path — real aStart/bStart untouched).
4. **Result byte-identical** (pick semantics unchanged — this only moves spacers).
5. Assertion-grade: for each stable line, `getTopForLineNumber` is equal (±0) across edLocal/edCenter/edRemote.

## Handoff
req mints → I derive-confirm the impl-edit reuse (marker a0b30550 stays, no new units) → PO build-go → expert (pure client, no restart) → I backstop (marker AST-attached + la/lb threading + no `0`-start left) → tester DET-3x + Tron visual on the 4-screenshot repro.
