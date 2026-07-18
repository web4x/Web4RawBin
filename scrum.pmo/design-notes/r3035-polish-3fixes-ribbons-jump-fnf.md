# R30.35 POLISH — 3 root-causes + fixes (Tron: "landed well, world class" + 3 polish bugs) — expert build spec

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** root-cause + fix → build (Tron reviews at QA) · **Date:** 2026-07-18
**Class:** RbDiffEditor `18165081` (+ edit.ts glue for C). Impl-edit, markers stay, no new units.

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
4. No regression: resolution derive/override, ✕-auto-resolve, counter, per-side buttons all unchanged.

## Consolidated impl targets (expert builds all atomically)
- **A+D** — `alignPaneRows [17c71adf]` (both-versions padding: Local→older-top, Repo→newer-bottom, height=olderLen+newerLen, `_maxH` centerLen-aware) **AND** `renderConnectorRibbons [5051b2a4]` (half-ribbon Y-extent bounded to REAL content sub-spans — `cLT/cLB`=older content, `cRT/cRB`=newer content; never the padded full span / blank rows). Both together = clean, content-bounded, one-per-side.
- **B** — `removeLine [af887908]` `:626`: auto-resolve jump `jumpToNextUnresolved()` → **`jumpToChange(1)`** (walk ALL kinds, drop the resolved-filter). `jumpToChange [65c465fa]` nav already correct (no kind filter — confirmed with expert).
- **C** — `edit.ts:97/:138`: guard `File not found` with `&& !isDiffMode()` (URL has `left`/`right`/`repo`/`3way`, or diff overlay shown).

## Handoff
Build directly (Tron reviews at QA) → tester DET-gate → QA. Impl-edit, markers stay, no new units. I derive-confirm (no new units) + backstop each of A+D / B / C.
