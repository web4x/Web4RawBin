# R30.23 — Diff-Completeness: one-sided auto-merged changes must be VISIBLE (IMG_4522)

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** design → hand to req (scenario-first, #126) · **Date:** 2026-07-16
**crossRef:** v2 fast-follow spec `84f013855` (this is that backlog, now scheduled) · R30.16 (kind/CONFLICT_PALETTE) · R30.19 (renderSideChangeBlocks origin-gate).

## Repro (Tron IMG_4522)
3-way merge in the OOSH diff editor: `otmux` latest (`516ebb3`) vs `otmux@dev`. Header reads **"0 changes, 0 conflicts — clean auto-merge"**, BUT Result + Repository carry a `CURRENT|current|.|self)` case line (~L45, `private.resolve.target()`) that Local (latest) LACKS. That is a REAL non-conflicting one-sided insertion — auto-merged into the result, but **never shown, never counted**. Tron must SEE every diff, even on a clean auto-merge.

## ROOT CAUSE (measured — not whitespace, not a blind diff-algo)
`rb-diff-editor.ts:computeMergedCenter` L195–200:
```
for (const r of diff3Merge(localLines, base, remoteLines)) {
  if ('ok' in r) { this.centerSeq.push({ ok: r.ok }); continue; }   // ← one-sided auto-merge folded in here, NO hunk
  this.conflicts.push({ ...kind:'conflict'... });                    // ← ONLY true conflicts become hunks
}
```
`diff3Merge` DOES detect the one-sided insertion — it auto-applies it into the `ok` merged stream. The gap is **coverage, not detection**: the only producers of hunks are the 3-way `conflict` branch (L197) and the 2-way `computeTwoWayHunks` `change` branch (L219). A non-conflicting **one-sided** 3-way region is classified `ok` and discarded from `conflicts[]`. Since `conflicts[]` is the SOLE source for:
- the change-counter (L205 status, L268 `.de-count`),
- `renderCenterChangeBlocks` (L304, iterates `this.conflicts`),
- `renderSideChangeBlocks` (L320, iterates `this.conflicts`),

…a clean auto-merge yields **0 hunks → 0 blocks → 0 count → "clean auto-merge"**. The insertion is invisible and uncounted. **It is the highlighter/counter coverage, gated on `conflicts[]`, that has no entry for one-sided auto-merged changes.**

## FIX — surface one-sided auto-merged regions as `resolvable` hunks
Reuse Class **RbDiffEditor `18165081`** (NO new class). ONE NEW name-matching Method.

**NEW Method `RbDiffEditor.computeOneSidedHunks`** — after the diff3 loop in `computeMergedCenter`, derive non-conflicting one-sided changes vs BASE and push them as `kind:'resolvable'` hunks (green), `autoApplied:true`:
```
localD  = diffIndices(baseLines, localLines)     // regions where Local differs from base
remoteD = diffIndices(baseLines, remoteLines)    // regions where Repository differs from base
for each base-region changed on EXACTLY ONE side (in localD XOR remoteD),
    NOT overlapping a diff3 conflict already in conflicts[]:
  this.conflicts.push({
    id, kind:'resolvable', autoApplied:true, pick:'a',
    a: local-only lines | [], b: remote-only lines | [],
    aStart: localStart, bStart: remoteStart, span:[0,0]
  })
```
- Origin by construction: Local-only → `a.length>0` → renders in Local pane; Repo-only → `b.length>0` → Repository pane (renderSideChangeBlocks R30.19 gate already does this).
- Color by construction: `kind:'resolvable'` → `CONFLICT_PALETTE.resolvable` `#3a8a5a` (green) → `de-block-resolvable` (CSS already present) in center + both source panes. Green = "auto-merged, no action needed", distinct from blue 2-way take-over `change` and brown `conflict`.

**Counter / status:** count `resolvable` in its own bucket. A one-sided-only merge reads **"N auto-merged, 0 conflicts"** (NOT "clean auto-merge"). Conflicts bucket unchanged.

**Gutter:** `autoApplied:true` ⇒ **no** ◄/► accept arrow (region already in center) — distinguishes 3-way auto-applied from R30.12 2-way take-over. `renderMergeGutter` skips arrows when `autoApplied`.

**Reused unchanged:** diff3 conflict branch, computeTwoWayHunks, acceptChange, syncScroll3, renderCenterChangeBlocks/renderSideChangeBlocks (they iterate `conflicts[]` and key on `de-block-${c.kind}` → pick up `resolvable` for free).

## Chain to mint (scenario-first — req). RbDiffEditor 18165081 REUSE, 0-dup, name-exact, designAhead.
| Hop | Unit | name (EXACT) | sourceFile |
|-----|------|--------------|-----------|
| Req  | (new R30.23) | Every diff is visible — one-sided auto-merged changes are highlighted + counted, not hidden by "clean auto-merge" | — |
| UC   | new | `diffEditor.oneSidedChangeVisibility` | — |
| Class| REUSE | `RbDiffEditor` (18165081) | — |
| Method | NEW | `RbDiffEditor.computeOneSidedHunks` | src/public/ts/components/rb-diff-editor.ts |
| Impl | designAhead | `RbDiffEditor.computeOneSidedHunks impl` | src/public/ts/components/rb-diff-editor.ts |
| Test | new | one-sided-visibility DET-3x (AC below) | — |

Also impl-edits (markers STAY): `computeMergedCenter` (call tail), the counter/status producer, `renderMergeGutter` (autoApplied arrow-skip), `Conflict` interface (`autoApplied?:boolean`).

## LOCKED AC (anti-regression, DET-3x)
1. **FIRES:** IMG_4522 repro (OOSH latest `516ebb3` vs `@dev`) → ≥1 **green** `resolvable` block in Center + Repository panes; counter "≥1 auto-merged, 0 conflicts"; status NOT "clean auto-merge". Tron SEES the `CURRENT|...` insertion.
2. **Conflict intact:** a true 3-way conflict still brown `conflict`, counted as conflict, with ◄/► arrows.
3. **No phantom:** identical merge (no side differs from base) → "0 auto-merged, 0 conflicts", ZERO blocks.
4. **Origin exact:** Local-only change → Local pane block only; Repo-only → Repository pane block only; both-sides → `conflict` (NOT double-counted as resolvable).
5. **No false action:** `resolvable` auto-applied hunks show NO accept arrow (already in center); accept/cancel routing unaffected (R30.17).

## Gate / handoff
On req commit → I derive-confirm (1 NEW Method name-exact, RbDiffEditor REUSE 1-unit/0-dup, designAhead, unit-level ownerIor, impl-edit units unchanged) → PASS/FAIL → PO build-go → expert (pure client, no server restart) → I confirm `computeOneSidedHunks` marker AST-attached + counter/status wording + green blocks origin-correct → tester DET-3x + Tron visual on IMG_4522 repro.
