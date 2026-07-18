# R30.35 — Merge coloring (add/delete/modify/conflict) + per-kind block actions

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** design → req mints R30.35 (adopt the mis-parented UCs) · **Date:** 2026-07-18
**Class:** RbDiffEditor `18165081` REUSE · **crossRef:** R30.29 vendor oLength · R30.32 ribbons color-by-kind. **Note:** UCs `merge.kindColoring` `9c41a415` + `merge.blockActions` `d7493e80` already exist mis-parented to R30.14 — R30.35 req ADOPTS them (re-point `coveredRequirement`→R30.35; R30.14 drops them).

## (1) Kind-derive in `computeMergedCenter` [a0b30550] (impl-edit) + vendor emit deletes
Classify each region's `kind` at Conflict creation (drop the old single `'change'`):
```
// stable one-sided region (buffer 'a'/'b'): ab = region.bufferLength (changed side), o = region.oLength (base it replaced)
if (!region.stable)      kind = 'conflict';   // true divergence (both sides differ)
else if (o === 0)        kind = 'add';        // inserted lines, base had none
else if (ab === 0)       kind = 'delete';     // removed the o base lines, changed side empty
else                     kind = 'modify';     // changed o base lines → ab new lines
```
- **Vendor (diff3.ts) infra:** today the single-hunk stable path is guarded `if (hunk.abLength > 0)` (:102) → a pure DELETE (`abLength==0, oLength>0`) is NEVER emitted as a region. R30.35 relaxes that to ALSO emit `abLength==0` deletion regions (carry `oStart/oLength` + `bufferContent=[]`), so `kind='delete'` can fire. Minimal, same class as R30.29's oLength exposure — infra under `a0b30550`.
- `computeOneSidedHunks` already sets `a`/`b` (changed side = bufferContent, opposite = base slice); it just needs to stamp the derived `kind` instead of `'change'`. Agreed-both-sides stays an `ok`-run (no block).

## (2) Extend `ConflictKind` + `CONFLICT_PALETTE` (module-level, rb-diff-editor.ts :23-25, impl-edit)
```
type ConflictKind = 'add' | 'delete' | 'modify' | 'conflict';
const CONFLICT_PALETTE: Record<ConflictKind,string> = {
  add:    '#3a8a5a',   // green
  delete: '#b83a3a',   // red
  modify: '#3a6ea5',   // blue
  conflict:'#a5603a',  // brown
};
```
Replaces the old `conflict|resolvable|change`. CSS: add `.de-block-add/.de-block-delete/.de-block-modify` (+ existing `.de-block-conflict`), fill `rgba(kind,0.20)` / inset stroke. `conflictColor(c)=CONFLICT_PALETTE[c.kind]` (pure) — `renderCenterChangeBlocks` / `renderSideChangeBlocks` / R30.32 ribbons key on `de-block-${kind}` and `conflictColor` → **pick up all 4 kinds automatically, one color source, match by construction.**

## (3) Per-kind block actions in `acceptChange` [843d79d4] (impl-edit) — `>>` / `<<` / `x`
The gutter icon strip (`renderInterPaneGutters`) already renders ≫/≪/✕ per block; wire them to `acceptChange(id, action)` with `action ∈ {'take-local','take-repo','dismiss'}`. `rebuildCenter` honors `c.pick`; `dismiss` uses the existing `this.dismissed` set.

| kind | `>>` take-Local | `<<` take-Repo | `x` dismiss |
|------|-----------------|----------------|-------------|
| **add** | `pick='a'` → center keeps Local's added lines | `pick='b'` → center takes Repo's added lines | `dismissed.add(id)` → remove the added block from center (revert to base) |
| **delete** | **RE-ADD the deleted line** → center reinserts the retained base/other-side content (the non-empty side) | keep deleted → center omits the line (`pick`=the empty side) | `dismissed.add(id)` → leave center as auto-merged |
| **modify** | `pick='a'` → Local's version | `pick='b'` → Repo's version | `dismissed.add(id)` → keep auto-merged pick |
| **conflict** | `pick='a'` → Local | `pick='b'` → Repo | `dismissed.add(id)` → leave current |

Impl of `acceptChange(id, action)`:
```
const c = conflicts.find(x=>x.id===id); if(!c) return;
if (action==='dismiss') { this.dismissed.add(id); }
else if (c.kind==='delete' && action==='take-local') { c.pick = (c.a.length ? 'a':'b'); }  // >> re-adds: pick whichever side RETAINS the line
else { c.pick = action==='take-local' ? 'a' : 'b'; }
this.rebuildCenter(); this.renderMergeGutter(); this.dirty = true;
```
(For non-delete kinds `>>`=Local/`a`, `<<`=Repo/`b`. For delete, `>>` re-adds by picking the retaining side. `x` drops the block via `dismissed`.) After any action, re-run `renderMergeGutter` (blocks + ribbons + counter refresh).

## Chain to mint (req R30.35, scenario-first). RbDiffEditor 18165081 REUSE, impl-edit.
| Hop | Unit | name (EXACT) |
|-----|------|--------------|
| Req  | new R30.35 | Merge coloring by kind (add/delete/modify/conflict) + per-kind block actions (`>>`/`<<`/`x`) |
| UC   | ADOPT `9c41a415` | `merge.kindColoring` (re-point coveredRequirement→R30.35) → Method `computeMergedCenter` 09af8c8d [a0b30550] |
| UC   | ADOPT `d7493e80` | `merge.blockActions` (re-point→R30.35) → Method **should be `acceptChange` 843d79d4** (reconcile: if `dfbbd057` is a placeholder, re-point UC.method→acceptChange) |
| Class| REUSE | `RbDiffEditor` (18165081) |
| Method | impl-edit | `computeMergedCenter` [a0b30550] (kind-derive + vendor delete-emit) · `acceptChange` [843d79d4] (per-kind `>>`/`<<`/`x`) · `ConflictKind`/`CONFLICT_PALETTE` (module-level) |
| Test | new | coloring + block-action DET (AC below) |
Markers STAY, no new units (vendor delete-emit is infra under a0b30550).

## LOCKED AC (DET-3x)
1. ADD region → green block+ribbon; DELETE → red; MODIFY → blue; CONFLICT → brown. All from the single `CONFLICT_PALETTE`.
2. Kind-derive exact: `oLength==0`→add, `abLength==0`→delete (vendor now emits it), both>0→modify, `stable:false`→conflict.
3. `>>` on modify/conflict/add → center takes Local; `>>` on DELETE → RE-ADDS the deleted line to center.
4. `<<` → center takes Repo; `x` → block dismissed (removed from center/gutter/ribbon), counter updates.
5. After any action: center CONTENT mutates (rebuildCenter), blocks+ribbons+counter re-render; result stays byte-consistent with the picks; merge is applyable.
6. Language-agnostic; color source = one `CONFLICT_PALETTE` (blocks/ribbons match by construction).

## Handoff
req mints R30.35 (adopt 9c41a415/d7493e80, re-point off R30.14) → I derive-confirm (impl-edit reuse; markers a0b30550/843d79d4 stay; vendor delete-emit infra; no new units) → PO build-go → expert (pure client) → I backstop → tester DET + Tron. Report DIRECT to robbin-po (SM down).
