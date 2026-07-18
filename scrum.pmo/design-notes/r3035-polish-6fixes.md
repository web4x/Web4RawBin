# R30.35 POLISH — root-causes + fixes (Tron polish; v0.7.59 REOPENS A+D-left, C) — expert build spec

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** root-cause + fix → build (Tron reviews at QA) · **Date:** 2026-07-18
**Class:** RbDiffEditor `18165081` (+ edit.ts glue for C). Impl-edit, markers stay, no new units.

## ★ v0.7.59 REOPENS

### (A+D-LEFT) Local↔centerLeft STILL maps empty lines — ROOT CAUSE: the fix was applied to the RIGHT only
v0.7.59 gave the REPO side a dedicated content-band alignment (`padAbove = older`, `:413-417` — Repo's newer content shifted onto center's newer band → clean). The LOCAL side got only a generic below-pad (`push('local', rL+a.length, maxH-a.length)`, `:414`) and its half-ribbon reuses the SHARED `aB = lineY(edLocal, c.aStart + max(c.a.length,1))` (`:536`) — which is NOT bounded to the older sub-span the way the Repo half is bounded to the newer sub-span. **For a 1+1 (older+newer) change the Local block = [1 older][1 blank pad below]; the shared `aB` + the below-pad leave the Local↔centerLeft half-ribbon's lower extent reaching the blank pad row / center's newer band** → the LEFT maps empty lines. The RIGHT is clean because `padAbove` explicitly binds it; the LEFT never got that mirror.
**FIX (CONFIRMED by expert Playwright measure — RIBBON LAYER only, `renderConnectorRibbons [5051b2a4]` half1):**
Expert data (change#0 aLen=1 bLen=1 olderLen=1 maxH=2): LOCAL px 703..741 (h=38=2 rows) vs CENTER-older 703..722 (h=19=1 row) → left ribbon = content+1 blank. RIGHT clean (REMOTE 722..741 == CENTER-newer). WHY: Repo's `padAbove` makes its pad-below = 0 → `bB` clean; but LOCAL keeps pad-BELOW (`maxH-aLen`, needed downstream) at `afterLineNumber = aStart+aLen`, so **`aB = lineY(edLocal, aStart+aLen)` includes that pad viewzone** → left ribbon = content + pad.
**Fix:** bound half1's local-bottom to the older CONTENT height, derived from CENTER (which has no pad): **`aB = aT + (cLB − cLT)`** (Local-older top-aligns to center-older, same row count → this = the content bottom, excludes the trailing pad). ⚠️ Note: `aB = lineY(edLocal, aStart+olderLen)` does NOT work — the pad viewzone sits at exactly that line, so it'd still include the pad; the center-derived height is the correct form. **`alignPaneRows` pad STAYS (needed for downstream alignment); ONLY `renderConnectorRibbons` half1 changes.** Symmetric to the clean right half2 (content-bounded `bT/bB`).

### (C-REAL) "File not found" STILL shows — WHAT was not found + why the guard misses
**WHAT: the file `otmux` (the URL path segment).** The /edit single-file editor calls `fetchFile('otmux')` → `GET /api/files/otmux` → **404**, because `otmux` is NOT a file in the rawbin repo — it's the DIFF's path in the `oosh` repo (`repo=oosh`). The 3-way diff renders fine (separate path); the single-file editor's load of `otmux` against the wrong (default) repo fails.
**WHY the `!isDiffMode()` guard misses:** `isDiffMode()` (`:31-36`) checks `location.search` for `left/right/repo/3way` OR a visible `.el-diff` overlay. BUT `openFile` (`:98`) does `history.replaceState({}, '', '/edit/otmux')` — **STRIPPING the query params.** After that, `isDiffMode()`'s URL check finds nothing, and if the `.el-diff` overlay isn't visible/mounted at that moment (timing), it returns FALSE → the guard doesn't fire → "File not found" shows. The guard is defeated by the code's own URL rewrite.
**Expert refined the exact site:** the visible text ("otmux Not found") is set by **`fetchFile` (edit.ts:47) on `!res.ok`** — UNGUARDED; the R30.35 `isDiffMode()` guard at `:148` runs DOWNSTREAM, after `fetchFile` already set the status.
**FIX (CONFIRMED — edit.ts `init()`):** **SKIP the whole single-file fetch block in `init()` when `isDiffMode()`** — do NOT `fetchFile(filePath)` (→ no `GET /api/files/otmux`, no 404, no status) in 3-way mode. The single-file editor is irrelevant when a diff is mounting. Then "File not found" only ever shows for a genuine single-file open. (`isDiffMode()` at init still sees the query params — they're stripped only later by `openFile`'s `replaceState`, which init doesn't hit; so the URL-param check is valid at the init guard site.)

## (A+D) Messy ribbons + ribbon SPANS EMPTY LINES on 2-line both-versions changes — SHARED ROOT: alignPaneRows mis-pads → ribbon anchors span blank rows
`_maxH` (`:377`) = `max(c.a.length, c.b.length, 1)` — the SINGLE-PICK-era height. In the both-versions model the CENTER block is `olderLen + newerLen` rows (both sides). `renderCenterChangeBlocks` (`:405`) already uses `max(a, b, centerLen, 1)` — but **`alignPaneRows`'s `_maxH` does NOT**, so:
- alignPaneRows pads Local/Repo to `max(a,b)` while CENTER is `olderLen+newerLen` rows → block height disagrees across panes; the mis-pad inserts blank spacer rows INSIDE the block.
- Local(older) AND Repo(newer) both align to the block TOP, but center's `centerRight`(newer) rows are at the BOTTOM → **(A)** the Repo↔centerRight half-ribbon slants diagonally ("wired"); **(D)** its Y-extent (`bT..bB`, `cRT..cRB`) stretches across the mis-placed blank spacer rows between the content → the ribbon **spans empty lines** instead of bounding to the real changed content. Same defect, two symptoms. (The single-line change at line 138 has one side, no mis-pad → clean, content-bounded.)

**FIX A+D (alignPaneRows `[17c71adf]`):** for a both-versions change align each side to ITS center sub-span, bounded to REAL content — **Local(older) → centerLeft (top): real `a.length` rows + pad `newerLen` BELOW; Repo(newer) → centerRight (bottom): pad `olderLen` ABOVE + real `b.length` rows.** Block height = `olderLen + newerLen`; make `_maxH` centerLen-aware (same `max(a, b, centerLen, 1)` as `:405`). Then the ribbon anchors (`:551-552`, already the older/newer sub-spans `cLT/cLB`, `cRT/cRB`) map to REAL content rows in aligned positions → each half-ribbon is a clean near-horizontal trapezoid **bounded to the change content, spanning NO blank lines** — one clean connection per side, like line 138.

## (B) Jump skips RED (delete) + GREEN (add) — ROOT CAUSE: the jump sequence filters out one-sided kinds
Tron: "skip-to-next NEVER skips to RED or GREEN — that's a bug." Two filters exclude one-sided (add/delete) changes:
1. **Auto-resolve jump `jumpToNextUnresolved` (`:631-642`)** lands only where `!isResolved(c)`. A one-sided add/delete derives as RESOLVED (one effective side) → **skipped**. So after a `✕` the jump hops over every green/red change.
2. The nav (`jumpToChange` `:566`) walks `this.conflicts` — the fix must guarantee EVERY change of EVERY kind is an entry in that list (add/delete/modify/conflict), so both nav and auto-resolve traverse them all.

**FIX (jumpToChange `[65c465fa]` + removeLine `[af887908]`):**
- **Auto-resolve (`:626`):** replace `jumpToNextUnresolved()` with **`jumpToChange(1)`** — advance to the NEXT change in sequence, ANY kind/state (so green/red are landed on). (Keep the "resolve on ✕" behaviour; only the jump target changes.)
- **Jump sequence = ALL kinds:** ensure `conflicts[]` contains every change region incl one-sided add/delete (they are pushed via `computeOneSidedHunks`, but verify none are folded into `ok`-runs); the jump list must NOT filter by kind or resolved-state. Nav ▲/▼ and auto-resolve both walk the full `conflicts[]`.
- Net: the skip-to-next lands on the next change of ANY kind (add/delete/modify/conflict) — the systematic filter bug is gone.

## (C) False "File not found" in 3-way diff mode — ROOT CAUSE: single-file check fires when there is no single file
`edit.ts:97` and `:138`: `if (!file) toolbar.setStatus('File not found', '#e74c3c')`. In 3-way diff/merge mode the URL carries `left`/`right`/`repo`/`3way` (refs) — there is NO single working-file `file`, so `!file` is true → the FALSE error, even though the diff renders fine.

**FIX (edit.ts):** SUPPRESS the File-not-found status when a diff/merge is active. Guard both sites: `if (!file && !isDiffMode()) toolbar.setStatus('File not found', …)` where `isDiffMode()` = the URL has any of `left`/`right`/`repo`/`3way` params (the same check that triggers `openFromParams`, edit.ts:145) OR the diff overlay is displayed. "File not found" then shows ONLY for a genuine single-file open that failed — never in 3-way mode. (Tron: "all is well, no error necessary here.")

## LOCKED AC (DET-3x + Tron visual)
1. A 2-line both-versions change → TWO CLEAN per-side connectors (Local↔centerLeft top, Repo↔centerRight bottom), **bounded to the change content — spanning NO blank/empty lines**, no diagonal/skew — as clean as the single-line change (line 138). One-sided unchanged.
2. ▲/▼ nav AND the ✕ auto-resolve jump land on EVERY change of ALL kinds — add(green), delete(red), modify(blue), conflict(brown); none skipped.
3. Opening a 3-way diff (`?left&right&repo&3way`) shows NO "File not found"; it renders clean. A genuine missing single file still shows it.
4. Toolbar shows ONE count `31/78 open conflicts` (openChangeCount/total); the separate "N conflicts to resolve" is gone; 0 changes → "clean auto-merge".
5. No regression: resolution derive/override, ✕-auto-resolve, per-side buttons all unchanged.

## (E) Confusing dual counter — ROOT CAUSE: TWO separate counts rendered in two places
- `.de-count` (`:374`): `${conflicts.length} changes · ${openChangeCount()} to resolve` → "78 changes · 31 to resolve".
- `.de-status` (`:277`, via `status()`): `${nc} conflicts to resolve` where `nc` = TRUE conflicts only (`kind==='conflict'`) → "12 conflicts to resolve".
Two different denominators (all-changes 78 vs true-conflicts 12) in two spots = confusing, doesn't add up.

**FIX (E) — ONE clean count `31/78 open conflicts` (openChangeCount / total-changes):**
- `.de-count` (`renderMergeGutter`, `:374`): `` `${this.openChangeCount()}/${this.conflicts.length} open conflicts` `` (0 changes → `clean auto-merge`; add `• modified` if dirty). Drop the now-unused `nc2` (`:372`).
- `.de-status` (`computeMergedCenter`, `:276-277`): **REMOVE the `${nc} conflict…to resolve`** — keep only the mode/dirty note (`2-way …` when `twoWay`, else nothing / `• modified`). No second count.
Single source of truth = `openChangeCount()` (derived-unresolved) over `conflicts.length` (total changes).

## (F) UNIFIED per-line button visibility (Tron refine) — supersedes "✕ only when both in center"
Old rule (`✕` iff both versions in center, `:502-504`) is wrong: a ONE-SIDED change also needs `✕` to un-merge, then `≫`/`≪` to re-add. UNIFIED rule = **per side, keyed on whether THAT side's line is in center** (one-sided 1 line AND conflicts 2 lines):
- side has content AND **in center** → `✕` (REMOVE that side).
- side has content AND **not in center** → add (`≫` left / `≪` right).
- side has NO content (that version empty) → NO button.
Flow (one-sided): line in center by default → `✕` un-merges → `≫`/`≪` re-adds. Flow (conflict): both `✕`; remove either → that side flips to add.

### Reconcile with derived-resolution — derive from SIDES-IN-CENTER (content), not flags
`sidesInCenter(c) = (c.incl.a && c.a.length>0 ? 1:0) + (c.incl.b && c.b.length>0 ? 1:0)`.
- **2 → UNRESOLVED** (both versions coexist, deciding) · **1 → RESOLVED** (one chosen) · **0 → RESOLVED (REJECTED)**.
★ Answer to Tron: a one-sided line REMOVED (0 in center) = deliberate rejection = **RESOLVED**, not pending (only "both still present" is pending).
`isResolved(c) = c._override ?? (sidesInCenter(c) !== 2)`. `openChangeCount()` = # with both sides in center. Fixes the flag-based `incl.a !== incl.b` (which wrongly marked 0-sides unresolved + ignored empty sides).
**Fix (F):** `renderInterPaneGutters [fd99c520]` `:502-504` — replace the `both`-gate with the per-side content+in-center rule; `openChangeCount [8b6abf77]`/`isResolved` derive from `sidesInCenter`.

## Consolidated impl targets (expert builds all atomically)
- **A+D** — `alignPaneRows [17c71adf]` (both-versions padding: Local→older-top, Repo→newer-bottom, height=olderLen+newerLen, `_maxH` centerLen-aware) **AND** `renderConnectorRibbons [5051b2a4]` (half-ribbon Y-extent bounded to REAL content sub-spans — `cLT/cLB`=older content, `cRT/cRB`=newer content; never the padded full span / blank rows). Both together = clean, content-bounded, one-per-side.
- **B** — `removeLine [af887908]` `:626`: auto-resolve jump `jumpToNextUnresolved()` → **`jumpToChange(1)`** (walk ALL kinds, drop the resolved-filter). `jumpToChange [65c465fa]` nav already correct (no kind filter — confirmed with expert).
- **C** — `edit.ts:97/:138`: guard `File not found` with `&& !isDiffMode()` (URL has `left`/`right`/`repo`/`3way`, or diff overlay shown).
- **E** — `renderMergeGutter` `.de-count` `:374` → single `X/Y open conflicts`; `computeMergedCenter [a0b30550]` status `:277` → drop the `nc conflicts to resolve`.
- **F** — `renderInterPaneGutters [fd99c520]` `:502-504` per-side content+in-center gate (`✕` if in-center / add if not / none if empty) + `openChangeCount [8b6abf77]`/`isResolved` derive from `sidesInCenter` (0-or-1 resolved, 2 unresolved).

## Handoff
Build directly (Tron reviews at QA) → tester DET-gate → QA. Impl-edit, markers stay, no new units. I derive-confirm (no new units) + backstop each of A+D / B / C.
