# Design: Changes-Focused Code-Folding — R30.53 (NATIVE Monaco folding) — supersedes R30.51 v1

**Author:** robbin-architect@WODA.prod robbinTeam2:0.3 · 2026-07-19 (Tron redesign directive)
**⚠ REVERSAL:** The R30.51 `setHiddenAreas` approach shipped BAD — Tron's screenshots show hidden lines yanked out → crammed non-contiguous line-numbers + chaotic ribbons, unreadable. **Tron OVERRODE the v1 "setHiddenAreas not FoldingController" decision.** R30.53 = redesign on NATIVE Monaco folding. Expert reverted the broken setHiddenAreas (v0.7.76); builds native at v0.7.77.

## Tron's rules
1. **Do NOT hide lines.** Use Monaco's STANDARD collapse/expand — native folding: fold-gutter chevron + collapsed `⋯` placeholder that KEEPS the region as one foldable line.
2. **Fold by METHOD boundaries** (semantic — function defs, e.g. oosh/bash `private.x() { ... }`, ts `methodName(...) { ... }`).
3. **Collapse corresponding blocks across ALL 3 editors when they contain NO change** (synced unchanged-method collapse); **change-regions stay EXPANDED**. **MOBILE must work.**

## Why native folding works now (the v1 concerns dissolve)
- v1 "can't GUARD change-regions from collapse" → NOT NEEDED. Change-methods START expanded (we only collapse UNCHANGED methods); manual folding of anything stays allowed.
- v1 "can't SYNC 3 editors" → unchanged methods have IDENTICAL content in Local/Center/Repo → the same method exists in all 3; collapse the corresponding range in each. One semantic unit → 3 aligned ranges.
- v1 "FoldingController internal/fragile" → accepted per Tron override; pinned to monaco-editor@0.52.2 (version-locked CDN); `editor.contrib.folding` id is stable.

## Method-set (→ R30.53 UC markers)
| Method | UC / marker | Purpose |
|--------|-------------|---------|
| `registerMethodFoldingProvider()` + `folding:true` (common:166) | nativeFoldByMethod → **foldByMethodBoundaries ddc5ea1c** | `monaco.languages.registerFoldingRangeProvider` at method boundaries (def-line + matching-close brace-depth scan); revert v1 `folding:false`. Native chevron+`⋯` free. |
| `computeMethodRanges()` | (supports ddc5ea1c) | per-editor method `[start,end]` list |
| `unchangedMethods()` | changeMethodsStayExpanded → **keepChangeMethodsExpanded fca7b5f7** | filter OUT methods whose `[start,end]` overlaps any conflict per-editor range (CENTER `span` / LEFT `aStart+a` / RIGHT `bStart+b`) → change-methods excluded from collapse |
| `applyChangesOnlyFolding()` | syncUnchangedCollapse → **syncNativeFold e64924cb** (initial) | FoldingController `getFoldingModel().setCollapsed(unchanged)` in all 3, at computeMergedCenter tail |
| `syncNativeFold()` | **syncNativeFold e64924cb** (ongoing) | `foldingModel.onDidChange` → mirror a method's collapse-state to the corresponding method (align 1:1 by seq/name) in the other 2; re-entrancy-guarded (syncScroll3:705 flag) |

Programmatic collapse: `const fc = ed.getContribution('editor.contrib.folding'); const fm = await fc.getFoldingModel(); fm.setCollapsed(<unchanged region idxs>, true);` — native fold (`⋯` placeholder, chevron), NOT setHiddenAreas.

## SYNC
Initial: applyChangesOnlyFolding collapses all unchanged methods in all 3. Manual fold/unfold: foldingModel.onDidChange → identify toggled method (start line → identity) → apply same state to the corresponding method in the other 2, re-entrancy-guarded. After any fold change → `renderInterPaneGutters()+renderConnectorRibbons()`.

## Coexistence (spline / decorations / highlight / MOBILE)
- **Spline:** `getTopForLineNumber` (lineY :515) is fold-aware. **Why v2 ribbons stay clean (v1 didn't):** v1 hid arbitrary GAP ranges mid-change → change endpoints shifted unpredictably. v2 folds only WHOLE UNCHANGED methods → change regions always fully expanded + contiguous → ribbon endpoints on visible lines. Recompute after fold.
- **Decorations:** folded (unchanged) lines don't render; change-line decorations render normally. No change.
- **Highlight (R30.41):** unaffected.
- **MOBILE (Tron AC):** native fold chevron + `⋯` must be TOUCH-tappable (no hover-only affordance); tap-to-fold/unfold + synced unchanged-collapse work on the mobile viewport across the 3 panes. Gate on device — flag: verify chevron tap-target size + that the reflow holds on the stacked mobile layout.

## Build order + decisions
Fold order: `folding:true` + registerMethodFoldingProvider (ddc5ea1c) → unchangedMethods (fca7b5f7) → applyChangesOnlyFolding + syncNativeFold (e64924cb) → reflow. Wire register + initial fold + onDidChange at mountThreePane / computeMergedCenter tail.
- **Method-boundary detection** is language-dependent: brace-depth scanner keyed on a per-language def-line regex (oosh/bash `^\s*[\w.]+\s*\(\)\s*\{`, ts/js `\)\s*\{$`), fallback to Monaco's BUILT-IN language folding when available. Confirm target langs (oosh/bash + ts primary).
- **FoldingController internal API** — Tron-mandated, pinned monaco 0.52.2; single revisit point on a Monaco bump.
Behavior/visual → commit+bump+rebuild+deploy + DET-3x gate at Tron's viewport (native chevron+`⋯`; unchanged methods collapsed synced across 3; change-methods expanded; MOBILE tap works; ribbons/decorations/highlight intact).

## BUG-2 — center-pane folds break (LOCKED FIX, robbin-po pick 2026-07-19)

**Root cause (measured, rb-diff-editor.ts:297-315):** `computeMethodRanges` derives `end` from a NAIVE brace-depth scan (`depth++/--` on every `{`/`}`, incl. string/comment braces — self-labelled "acceptable approximation"). The CENTER both-versions pane emits DUPLICATED older+newer rows (R30.35 `_maxH` centerLen path) → duplicate/imbalanced braces → depth never returns to 0 at the true close → method `[start,end]` land on wrong lines → center folds land wrong / swallow following methods.

**Feasibility (expert-costed, po-decided):**
- SIGNATURE-REGEX — most LOCALIZED (only `computeMethodRanges`), robust to ANY brace imbalance BY CONSTRUCTION. Minor: fold-end = next-boundary−1, not exact close-brace. **Small.** ← **LOCKED**
- PER-SIDE-MODEL — correct for L/R but CENTER duplication still needs its own answer. **Medium, insufficient alone.** Rejected as primary.
- BALANCE-RENDER (fix R30.35 dup-brace emission at source) — touches the both-versions render path = the alignment JUST device-validated → regression risk. **Larger blast radius.** Rejected.

**Why correct-by-construction (R27.2 / [[correct-by-construction]]):** brace-depth is the incidental heuristic that happens to work only while braces balance. Boundary-by-def-line NEVER counts braces, so brace imbalance cannot corrupt it — correctness is pinned by construction, not by an approximation that happens to hold.

### EXACT SPEC (hand to robbin-expert) — replace the body of `computeMethodRanges` only
Signature UNCHANGED: `private computeMethodRanges(model): Array<{start,end,sig}>` (1-based; keep `sig` — `_mirrorFold` + R30.53 parity key on it).
1. `lines`, `langId`, `defRe` — KEEP as-is (def-line detection unchanged).
2. DELETE the `depth`/`openLine` brace loop (lines 306-314).
3. Pass 1 — collect boundaries: for each line `i`, if `defRe.test(lines[i])`, record `{ line:i, indent:(lines[i].match(/^\s*)/)[0].length), sig:lines[i].trim().replace(/\s+/g,' ') }`.
4. Top-level gate BY INDENT (replaces the depth===0 gate): `methodIndent = min(indent over all matches)`; keep only boundaries whose `indent === methodIndent`. (Nested defs sit deeper → excluded. No brace counting.)
5. Ranges: for kept boundaries `b[k]`, `start = b[k].line+1`, `end = (b[k+1] ? b[k+1].line : lines.length)`; then trim trailing blank lines: while `end>start && lines[end-1].trim()===''` → `end--`. `sig = b[k].sig`.
6. Return `{start,end,sig}[]`.

### Invariants (make them assertable — don't rely on eyeballing)
- INV-1 monotonic non-overlap: `ranges[k].end < ranges[k+1].start` for all k (boundary construction guarantees; assert in the R30.53b gate).
- INV-2 identical-by-construction across panes: L/C/R all run the SAME boundary algo → CENTER parity holds even with dup braces (this is the fix).
- INV-3 sig preserved: every range carries the normalized def-line sig (keeps `_mirrorFold` signature-keying + the R30.53 parity Tests green — DO NOT regress).

### Accepted tradeoffs (documented, safe-direction)
- Fold-end may include inter-method gap lines (up to next def−1, trailing blanks trimmed) rather than the exact `}`. Cosmetic only.
- A conflict living in an inter-method gap now attributes to the PRECEDING method in `keepChangeMethodsExpanded` overlap → that method stays EXPANDED (conservative; never wrongly collapses a changed region). Parity preserved because all 3 panes share the construction.
- Multi-line signatures (params spanning lines) still undetected — pre-existing `defRe` limitation, NOT a regression.

### Do-NOT-touch (regression guard)
`_maxH` (:567), `alignPaneRows`/`renderCenterChangeBlocks`, the R30.35 A+D centerLen path, and `keepChangeMethodsExpanded`'s no-Math.max-floor fix (:322, R30.53 fix-2) — all device-validated. BUG-2 fix is confined to `computeMethodRanges`.

### Gate
DET-3x at Tron's iPhone viewport on a merge whose CENTER has a both-versions (dup-brace) block: center unchanged methods fold on correct boundaries + synced L/C/R + change-methods expanded + ribbons/decorations intact + R30.53 left-parity Tests still GREEN. Assert INV-1/2/3 in the automated gate before the device pass.

### ARCHITECT BACKSTOP — v0.7.80 / d893b1de1 (robbin-architect 2026-07-19): **PASS**
Verified impl line-by-line vs LOCKED spec (git show d893b1de1):
- defRe UNCHANGED; brace-loop DELETED; Pass-1 `bounds{line,indent,sig}` filtered by defRe; top-level gate `methodIndent=Math.min(indent)` keep `indent===methodIndent`; range `[b[k].line+1 .. b[k+1].line/EOF]` + trailing-blank trim; return `{start,end,sig}`. Matches spec exactly.
- INV-1 ✅ end_k ≤ b[k+1].line < b[k+1].line+1 = start_{k+1} (holds even pre-trim; trim only lowers end). INV-2 ✅ pane-agnostic fn → CENTER parity by construction (center dup-braces no longer desync depth). INV-3 ✅ per-range sig = normalized def-line (same normalization) → `_mirrorFold` + R30.53 parity keys intact.
- Do-NOT-touch ✅ single hunk within computeMethodRanges (:300-325); `_maxH`(:567)/`keepChangeMethodsExpanded` no-floor(:327)/`foldByMethodBoundaries`(:278) untouched. Stat: only rb-diff-editor.ts source (+dist/manifest/sw/pkg build outputs).
- Extra `if (bounds.length===0) return []` = CORRECT defensive add (guards `Math.min(...[])→Infinity`). Approved.

**Two observations (non-blocking, safe-direction):**
1. `methodIndent` is a GLOBAL-file min. A file mixing indent-0 top-level fns + a nested class → deeper-indent class methods excluded from folding. NOT a regression (old depth===0 gate likewise captured only top-level); exactly right for RawBin's oosh/bash flat-indent-0 primary target. Note for future TS-class merges.
2. CENTER both-versions yields TWO same-sig ranges for a CHANGED method — but change-methods overlap the conflict → excluded by keepChangeMethodsExpanded → never folded/mirrored. The 55 restored methods are UNCHANGED (single copy, unique sig) → no INV-3/mirror ambiguity for the actual fold set. Clean.

**Marker call:** foldByMethodBoundaries 2de3411f — decl+body unchanged → RIDES, **no new uuid**. Confirmed. BUT the BUG-2 logic physically lives in the uncredited `computeMethodRanges`. If the dup-brace DET-3x gets a champagne Test (recommended), the honest Impl site = `computeMethodRanges` → mint a FRESH [impl:uuid] there + wire the Test to it (NOT to 2de3411f, which didn't change). Architect to mint the Method/Impl unit on req/planner Test-mint; deferred to chain, flagged to req(0.4)/planner(0.6).

## R30.53 PARITY RESIDUAL — FIX-A2 (LOCKED, robbin-architect 2026-07-19, robbin-po directive)
**In-scope** — same class as BUG-1 (real left-pane fold-parity defect). Do NOT close R30.53 with it. RED baseline r3053b 1/79 (`private.complete.panes()` COLLAPSED LEFT(86-88), EXPANDED C(89-95)/R(85-91)). BUG-2 r3053c stays 104/104 GREEN — this is a pre-existing FIX-A residual EXPOSED (not caused) by BUG-2 restoring ranges below the old brace-desync boundary.

**ROOT CAUSE (measured, rb-diff-editor.ts:330-341):** `keepChangeMethodsExpanded` classifies change-vs-unchanged INDEPENDENTLY PER PANE from that pane's own conflict coords: center `[span0+1,span1]`, local `[aStart+1, aStart+a.length]`, remote `[bStart+1, bStart+b.length]`. For a GREEN-ADD conflict the added lines exist in center+remote but are ABSENT from local (`c.a.length`→0, per the fix-2 no-floor). LEFT's change-range is then empty/short → UNDER-COVERS `panes()` (86-88) → LEFT alone judges it unchanged → collapses, while C/R cover it and keep it expanded → parity break. `panes()` being 7 rows in C/R but 3 in LEFT confirms center/remote carry added lines local lacks.

**Tester nuance (correct, incorporated):** INV-2 (identical RANGES across panes) holds only for UNCHANGED methods. A change-method has different per-side content/length → parity for it is NOT identical ranges but **CONSISTENT CLASSIFICATION (expanded ×3)**. LEFT under-classifies.

**FIX-A2 — classify ONCE, mirror by SIGNATURE (same theme as FIX-B):** the change-method decision must be made ONCE across all 3 panes and applied by signature, so LEFT cannot independently under-classify. This is my FIX-A `computeSharedUnchangedFoldSet` (5d1ee46c0) direction, now required — the minimal split-floor (bec403023) left this residual.

### EXACT SPEC (hand to robbin-expert) — refactor classification to a signature-union; keep per-side chRange FORMULA (incl. fix-2 no-floor)
1. NEW helper `private changeMethodSigs(): Set<string>` — for each `[side, ed]` of `{local:edLocal, center:edCenter, remote:edRemote}`:
   - `ranges = this.computeMethodRanges(ed.getModel())` (carries sig, BUG-2).
   - `chRanges` = the EXISTING per-side formula (:336-339 verbatim — center `[span0+1,span1]`, local `[aStart+1,aStart+a.length]`, remote `[bStart+1,bStart+b.length]`; **do NOT reintroduce Math.max floor**).
   - add `r.sig` to the set for every range `r` that overlaps any chRange (same `overlaps` predicate).
   - RETURN the unioned `Set<string>`.
2. CHANGE `keepChangeMethodsExpanded(ranges: {start;end;sig}[], changeSigs: Set<string>)` → `return ranges.filter(r => !changeSigs.has(r.sig));` (collapse only methods unchanged in ALL panes). Drop the `side` param + the internal per-side chRanges (moved into the helper). Widen `ranges` type to include `sig` (computeMethodRanges already returns it).
3. `syncNativeFold` (:360, before the fold loop): `const changeSigs = this.changeMethodSigs();` ONCE. In the loop (:366): `const unchanged = this.keepChangeMethodsExpanded(this.computeMethodRanges(ed.getModel()), changeSigs);`.

### Why correct-by-construction
Membership in the change-set is by SIGNATURE-UNION across panes, not per-side coordinate. A method any pane classifies as change (e.g. `panes()` via C/R) is in `changeSigs` → stays expanded in ALL 3 → LEFT physically cannot under-classify it. The collapsible (unchanged) set is IDENTICAL BY SIGNATURE across L/C/R = fold-parity by construction.

### Composition with fix-2 (no regression)
fix-2 stops OVER-classification of the FOLLOWING method (zero-length local add must not clip the next unchanged method). FIX-A2 stops UNDER-classification of the change-method ITSELF. They compose: a genuinely-unchanged method overlaps NO pane's chRange → sig ∉ changeSigs → collapses ×3 (fix-2 intent preserved, NO floor). No conflict.

### Invariants
- INV-A2 (parity): the collapsible set filtered by `changeSigs` is IDENTICAL by signature across L/C/R (assert in r3053b gate).
- Regression: r3053c 104/104 (BUG-2 sig ranges reused, untouched); R30.53 FIX-A/FIX-B parity Tests green (_mirrorFold already sig-keys @:397 → now consistent with initial classification).

### Accepted tradeoff
Signature collision (two DISTINCT methods with identical normalized def-line — same name+params, rare) → both over-expand if one is a change-method. Conservative (over-expand never wrongly-collapses; cosmetic only). Center dup-version copies share sig → both correctly in changeSigs → both expanded. Fine.

### Do-NOT-touch (regression guard)
`_maxH`(:576)/`alignPaneRows`/`renderCenterChangeBlocks`/R30.35 centerLen (BUG-1 device-validated alignment); the per-side chRange FORMULA incl. fix-2 no-floor; `computeMethodRanges` body (BUG-2/r3053c); `foldByMethodBoundaries` 2de3411f. FIX-A2 is confined to `keepChangeMethodsExpanded` + the new `changeMethodSigs` helper + the one call-site wire in `syncNativeFold`.

### Marker call
Logic lives in `keepChangeMethodsExpanded` — RIDES on existing **640f8428** (classification refined, same method+purpose); `changeMethodSigs` = its private supporting helper (uncredited). **No new uuid.** If r3053b gets a champagne Test, wire it to 640f8428 (honest classification site). Deferred to req/planner mint.

### Gate
r3053b 79/79 (panes() expanded ×3; INV-A2 identical-by-sig collapsible set) + r3053c 104/104 unregressed + R30.53 FIX-A/FIX-B parity green + BUG-1 alignment intact → DET-3x at Tron viewport → device chevron render.
