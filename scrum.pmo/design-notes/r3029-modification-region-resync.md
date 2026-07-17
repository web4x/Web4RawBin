# R30.29 — Alignment resync at MODIFICATION regions (opposite side = base slice)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** design → req scenario-first · **Date:** 2026-07-17
**Class:** RbDiffEditor `18165081` · **crossRef:** R30.27 (la/lb counters — right for insertions, incomplete for modifications) · R30.16 alignPaneRows · R30.23 computeOneSidedHunks.

## Residual (Tron v0.7.40, expert-measured)
R30.27 killed the big drift, but a CUMULATIVE residual remains: at `private.complete.sessions()` LEFT line 72 vs CENTER line 73 sit on different rows. NOT off-by-one — **cumulative** drift that must RESYNC method-after-method. otmux has ~50 MODIFICATION regions (`oLength>0`); the LEFT pane retains base lines the R30.27 model drops → 368px cumulative LEFT drift.

## ROOT CAUSE (confirmed)
R30.27's `computeOneSidedHunks` models the non-changed side as EMPTY (`b=[]` for buffer 'a', `a=[]` for buffer 'b') and advances ONLY the changed counter (:216-217). Correct for **INSERTIONS** (`oLength==0`, the other side genuinely has nothing). **WRONG for MODIFICATIONS** (`oLength>0`): a diff3 stable buffer='a' region means local changed base while **remote == base** there — so the REMOTE pane still shows the M = `oLength` base lines. The model drops them (`b=[]`) and never advances `lb` by M → every modification region leaks M rows → cumulative drift.

## ★ TRON'S ALGORITHM — empty-line-anchored resync (PRIMARY mechanism, 2026-07-17)
"Discover correct empty lines and resync around them with the next full line." Reframed language-agnostically and mapped to the diff3 structure:

**A corresponding blank line across all 3 panes IS a diff3 STABLE region** (`buffer='o'`, content identical in local/base/remote). Stable regions are therefore the universal resync ANCHORS — blank lines are the most common, but ANY unchanged line qualifies. Zero syntax parsing; it falls out of the line-diff.

**Mechanism (self-correcting, drift-bounded-to-one-block):**
1. Track a running VISUAL ROW per pane (`rowL`, `rowC`, `rowR`) = real lines + viewZone spacer rows emitted so far.
2. **Between anchors** (a changed/modification region): advance each pane's row by its REAL visible line count — changed side = its `N` lines; **non-changed side = the `M` base lines it retains = `oLength`**; center = picked. (Within a changed block the two sides don't line-correspond — that's fine, it's a block; only the boundaries must meet.)
3. **At each STABLE anchor** (blank line / any `buffer='o'`): RESYNC — `maxRow = max(rowL,rowC,rowR)`; pad each lagging pane with `maxRow − rowThatPane` blank viewZone rows BEFORE the stable line, so all 3 panes land the NEXT FULL (stable) line on the SAME row. Emit the K stable lines; advance all three by K.

This SNAPS cumulative drift to zero at every block boundary regardless of any within-block imbalance — exactly Tron's "drift builds within a block, resyncs at the blank line." It is strictly more robust than pure counter-threading: even if a region's accounting is slightly off, the next stable/blank anchor hard-realigns. `private.resolve.target()` stays aligned, and `private.otmux.target.isPane()` + every following method re-align at their leading blank line.

**The base-slice (below) supplies the one datum the anchor-resync needs — `M = oLength`, the non-changed pane's real line count between anchors** — plus (optionally) renders those base lines in the block. The anchor-resync is the guarantee; the base-slice/`oLength` is the correct per-region count that makes each anchor land precisely.

## FIX (impl-edit computeMergedCenter + computeOneSidedHunks [a0b30550 STAYS] + MINIMAL vendor extension)
**1. Vendor extension (vendor/diff3.ts):** `StableRegion` (buffer 'a'/'b') exposes `oStart` + `oLength`. Populate at :104 from the in-scope `hunk.oStart`/`hunk.oLength` (Hunk already carries them, :61). Two fields — no logic change.
```
StableRegion = { stable:true; buffer:'o'|'a'|'b'; bufferStart; bufferLength; bufferContent; oStart; oLength };  // +oStart,+oLength
// :104  results.push({ ...existing, oStart: hunk.oStart, oLength: hunk.oLength });
```
**2. Opposite side = base slice + advance base counter.** In the one-sided branch, the non-changed side shows `baseLines.slice(region.oStart, region.oStart + region.oLength)` (M base lines), and its counter advances by `oLength`:
```
// buffer 'a' (LOCAL changed, remote==base):  a=bufferContent(N), b=base.slice(oStart,oStart+oLength)(M); la += bufferLength; lb += oLength;
// buffer 'b' (REMOTE changed, local==base):  a=base.slice(...)(M), b=bufferContent(N);                 lb += bufferLength; la += oLength;
```
`computeOneSidedHunks(region, cid, la, lb, baseLines)` sets the opposite side to the base slice (drop the `[]`).
**3. Everything downstream is automatic:** `maxH = max(a.length, b.length, 1) = max(N,M)` → `alignPaneRows` pads each pane correctly; center = picked changed side (auto-merge) → **RESULT byte-identical**.

## ★ RESYNC CONFIRMED at EVERY modification region (PO's question)
The opposite counter advances by `oLength` at EVERY one-sided region: `0` for insertions (no leak — matches R30.27), `M` for modifications (consumes the M base lines the opposite pane really shows). So running `la`/`lb` always equal each pane's actual consumed lines → **no cumulative drift; resyncs region-after-region**, not just insertions. This is exactly the expert's 368px-across-50-regions fix.

## Connector-curves-across-gaps (Tron's IntelliJ point) — COVERED by this fix, not separate
`renderConnectorRibbons` pins endpoints to the center-span Y and origin-gates on `a.length`/`b.length`. Post-fix, a MODIFICATION has a=N and b=M both >0 → BOTH bands draw (Local↔Result AND Result↔Repository) → the region is connected across all 3 panes, spanning the aligned gap/spacer rows. INSERTIONS stay one-sided (opposite empty → one band). Once rows align exactly, the curves span the gaps correctly — no separate change needed. (A distinct gap-spanning visual beyond the aligned band would be a small separate enhancement; the "align regions across gaps" requirement is met.)

## Highlighting is naturally origin-correct
Insertion (`oLength=0`) → opposite empty → ONE side highlighted (R30.19/R30.23 origin-exact preserved). Modification (`oLength>0`) → both panes show the region (changed side + base side) → both highlighted — the correct IntelliJ behavior for a modification. `kind:'change'` (blue) unchanged.

## ★ LANGUAGE-AGNOSTIC guardrail (Tron) — ZERO method/syntax parsing
Every input to the fix is a LINE index or LINE array from the vendored line-diff3:
`region.buffer`/`bufferContent`/`bufferStart`/`bufferLength` and the new `oStart`/`oLength` are all line offsets from `diff3MergeRegions(localLines, baseLines, remoteLines)`; `baseLines.slice(oStart, oStart+oLength)` is a plain string-array slice; `la`/`lb` are line counters; `alignPaneRows` inserts blank viewZone rows by line number. **No tokenizer, no AST, no method/brace/language detection anywhere.** "private.otmux.target.isPane()" is merely WHERE a diff3 modification region lands visually — the fix corrects EVERY diff3 region's spacers generically and works identically on any language or plain text. The per-method appearance is a symptom coordinate, never an input.

## Chain to mint (req R30.29, scenario-first). RbDiffEditor 18165081 REUSE, impl-edit.
| Hop | Unit | name (EXACT) |
|-----|------|--------------|
| Req  | new R30.29 | 3-pane rows resync at modification regions — non-changed side shows base lines, no cumulative drift |
| UC   | new | `diffEditor.modificationRegionResync` |
| Class| REUSE | `RbDiffEditor` (18165081) |
| Method | REUSE (impl-edit) | `RbDiffEditor.computeMergedCenter` (09af8c8d) [Impl a0b30550] + vendor diff3.ts oStart/oLength exposure |
| Test | new | modification-resync DET-3x (AC below) |

## Tron drift-onset diagnostic (2026-07-17, confirms the fix)
Alignment is GOOD at `private.resolve.target()` (1st method), then drift STARTS at the NEXT method `private.otmux.target.isPane()` and accumulates ("each new block/method must be re-aligned"). This is the cumulative-modification signature: the first modification region leaks its M base lines and every method after it shifts. R30.29 resyncs FROM that first drift point onward — the base slice retains the opposite pane's base lines and `la`/`lb` advance by `oLength` at each region, so `private.otmux.target.isPane()` and all following methods re-align.

## LOCKED AC (DET-3x + Tron visual)
1. **Drift-onset gate:** `private.resolve.target()` stays aligned AND `private.otmux.target.isPane()` (the first drift point) + every method after it are re-aligned — corresponding lines share one visual row across all 3 panes. `private.complete.sessions()`: LEFT line 72 and CENTER line 73 on the SAME row.
2. otmux (50 modification regions): 0px cumulative LEFT drift (was 368px).
3. **Anchor-resync:** at EVERY stable/blank anchor (`buffer='o'`) all 3 panes land the next full line on the SAME row (laggards padded to `maxRow`); at EVERY modification region the non-changed pane advances by its real `M=oLength` base lines. Drift is bounded to within one block and snaps to 0 at each anchor.
4. Insertions (`oLength=0`) still one-sided — R30.27 behavior preserved (regression guard).
5. Connector curves span the aligned region across gap rows (both bands on a modification).
6. RESULT byte-identical; assertion-grade `getTopForLineNumber` equal across all 3 panes per corresponding line INCLUDING modification regions.

## Handoff
req mints → I derive-confirm the impl-edit reuse (marker a0b30550 stays, vendor extension is infra under the same Impl, no new units) → PO build-go → expert (pure client) → I backstop → tester DET-3x + Tron on the otmux repro.
