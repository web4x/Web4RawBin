# R30.30 — Absolute blank-anchor re-sync (snap the L1823 2-row residual to 0)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** root-cause + fix spec → req (R30.30) · **Date:** 2026-07-17
**Class:** RbDiffEditor `18165081` · **crossRef:** R30.29 (base-slice counters — shipped) · R30.16 alignPaneRows (17c71adf) · computeMergedCenter (a0b30550).

## Tester finding (v0.7.41, DET-3x)
A CLEAN 2-row (32px) misalignment starts at L1823 (send.verified / debug.log-isPane-guard MODIFICATION region) and persists to EOF: 741 anchors ALL exactly 32px, NO further accumulation (single 2-row shift, not cumulative), survives the 3-line neighbor filter → genuine.

## ROOT CAUSE
v0.7.41 (R30.29) advances CONTENT-line counters and pads each region to `maxH`:
```
if (region.buffer === 'a') { la += region.bufferLength; lb += region.oLength; } else { lb += region.bufferLength; la += region.oLength; }  // :219
```
Each region is *supposed* to add `maxH` VISUAL rows to all 3 panes (real + pad), so stable lines stay aligned. **But there is NO re-anchor** — the model TRUSTS every region's `maxH`/pad to be exact. At L1823 ONE modification region mis-pads by 2 rows (an `oLength` vs real-displayed-line-count edge at a modification adjacent to other changes / trailing context). Because nothing re-equalizes at the next stable line, that 2-row inter-pane delta is frozen and rides to EOF. **"Prevents accumulation" (R30.29 counters) ≠ "snaps residual to 0" (needs absolute re-anchor).** This is precisely the empty-line-anchored resync I specified for R30.29 that did NOT get built — v0.7.41 has the counters only.

## FIX — absolute re-anchor at every stable/blank line (single forward pass over VISUAL rows)
Track cumulative VISUAL rows per pane (`vL, vC, vR` = real content lines + spacer rows emitted so far — deterministic, we own every spacer). Walk the region sequence in order:
- **Changed / conflict region:** each pane's block = `maxH` visual rows (real + pad), as today. `vL/vC/vR += maxH`.
- **Stable region (`buffer==='o'` — every unchanged line; blank lines are the common anchor):** RE-ANCHOR FIRST —
  ```
  const target = Math.max(vL, vC, vR);
  padLocal += target - vL; padCenter += target - vC; padRemote += target - vR;   // corrective spacers
  vL = vC = vR = target;
  ```
  then emit the K stable lines; `vL/vC/vR += K`.
The re-anchor MEASURES the actual accumulated rows and snaps the laggards up to the max, so ANY single-region mis-pad (L1823's +2) is erased at the very next stable/blank line — bounded to within one block, self-healing. Deterministic (analytic row counts; no `getTopForLineNumber` needed). This SUPERSEDES "trust the counters": correctness no longer depends on every `oLength`/`maxH` being perfect.

**Where:** restructure the spacer computation (`alignPaneRows` 17c71adf + the region loop in `computeMergedCenter` a0b30550) into ONE forward pass that emits, per region, both the changed-region `maxH` pad AND the stable-region re-anchor pad. Impl-edit — markers STAY, no new units.

**Secondary (sub-pixel completeness, fold in if cheap):** pin explicit `lineHeight: 19` + `wordWrap:'off'` on the shared editor config (`mountThreePane` c4c84142) so a font-load/width variance can never add a per-line px/row delta. The L1823 residual is a whole-row (integer) miscount, so the re-anchor is the primary fix; this only guarantees 0px by construction.

## Why this is language-agnostic
Anchors = diff3 STABLE regions (identical content across all 3 panes); blank lines are the dominant case but ANY unchanged line qualifies. Inputs are line counts + region flags from the line-diff. No tokenizer, AST, or method/brace detection. "L1823 / send.verified" is only WHERE a region lands — the re-anchor corrects every stable boundary generically on any language / plain text.

## Chain to mint (req R30.30, scenario-first). RbDiffEditor 18165081 REUSE, impl-edit.
| Hop | Unit | name (EXACT) |
|-----|------|--------------|
| Req  | new R30.30 | 3-pane rows re-anchor to 0 at every blank/stable line — no persistent residual shift |
| UC   | new | `diffEditor.absoluteBlankReanchor` |
| Class| REUSE | `RbDiffEditor` (18165081) |
| Method | REUSE (impl-edit) | `RbDiffEditor.computeMergedCenter` (09af8c8d)[a0b30550] + `RbDiffEditor.alignPaneRows` (17c71adf) |
| Test | new | absolute-reanchor DET-3x (AC below) |

## LOCKED AC (DET-3x)
1. **L1823 gone:** the send.verified/debug.log-isPane-guard region → 0px at its next stable line and to EOF. All 741 anchors 0px (was 32px).
2. **Self-heal:** inject a deliberate single-region 2-row mis-pad → it snaps to 0 at the next stable/blank line (not carried forward).
3. **No regression:** insertions, modifications, conflicts, agreed-both-sides all still 0px at every stable anchor; result byte-identical.
4. Assertion-grade: `getTopForLineNumber` equal (±0px) across edLocal/edCenter/edRemote at EVERY stable/blank line, scrollTop=0 and mid-scroll.
5. Language-agnostic (works on any language / plain text).

## ★ R30.30-OPEN (v0.7.4x): the built re-anchor is a STRUCTURAL NO-OP — send.verified still drifts (9 rows/171px by L2088, 213/424 blanks)
Measured `alignPaneRows` (:344-360): it tracks `vL/vC/vR` and at each stable {ok} does `target = max(vL,vC,vR); pad laggards by target−v`. BUT **every branch advances all three equally** — stable `+K` to all (:351), changed `+maxH` to all (:359). Starting `0,0,0`, therefore **`vL==vC==vR` at ALL times**, so `max−v == 0` always → **the re-anchor NEVER pads. It corrects nothing.** That is why 213/424 blank witnesses still drift and send.verified accumulates: the "self-heal" is inert.

The REAL drift is the CHANGED-region pad itself: the pad `maxH − c.a.length` at `afterLineNumber: rL + c.a.length` (:356-358) uses the CONFLICT's ASSUMED per-pane lengths (`c.a`=base-slice/`oLength`, `picked`), and `rL/rC/rR` advance by those same assumed lengths (:359). In the long send.verified modification these assumed lengths diverge from each editor's ACTUAL content lines (diff3 oLength ≠ the pane's real rows, or a near-conflict mis-modeled as clean one-sided), so per sub-region the spacer is off by ~1 row → ~9 rows accrue — and the no-op re-anchor never catches it because the v-tracker is computed from the SAME wrong assumed lengths (model agrees with itself, disagrees with reality).

### FIX — re-anchor against ACTUAL rendered geometry, not the self-consistent model
Two-phase `alignPaneRows`:
1. **Phase 1 (unchanged):** emit per-region `maxH` pads.
2. **Phase 2 — geometry re-anchor:** after Phase 1 zones are applied, at each stable/blank anchor MEASURE the anchor line's real Y in each pane via `getTopForLineNumber(actualContentLine)` (viewZone-aware = reality); if the three Y differ, add a corrective spacer to the lagging pane(s) so the anchor line shares a row. This measures REALITY, so it heals ANY per-region length/pad error regardless of diff3/base-slice correctness — genuinely self-healing (the current pass only re-checks its own arithmetic).
   - Alternative (analytic, if a second measure pass is undesirable): drive `rL/rC/rR` and the v-tracker from the ACTUAL per-editor content-line indices (localLines/remoteLines/center-model line consumed), NOT the conflict's assumed `c.a/c.b/picked` — then max−v is real and the existing re-anchor starts doing work. But geometry-measurement (getTopForLineNumber) is the robust choice — it can't be fooled by a wrong length model.
**Gate:** send.verified/L1815+ → 0px through L2088 and to EOF; ALL 424 blank witnesses 0px (was 213 drifting); inject a deliberate per-region length error → still 0px at the next blank (proves it heals reality, not the model). Stays under `alignPaneRows` [17c71adf] + `computeMergedCenter` [a0b30550], impl-edit — R30.30-OPEN, no new units.

## Handoff
req mints R30.30 → I derive-confirm the impl-edit reuse (markers a0b30550 + 17c71adf stay, no new units) → PO build-go → expert (pure client) → I backstop (single-pass re-anchor present + L1823 0px + self-heal) → tester DET-3x + Tron.
