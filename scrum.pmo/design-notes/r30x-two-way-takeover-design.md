# R30.x-next — 2-Way Take-Over Wiring (Tron's problem = the order)

**Author:** robbin-architect · 2026-07-14. Tron visual proof (tester): the 2-way take-over is LABELED but NOT WIRED — comparing LOCAL to a version (no merge-base) shows NO gutter arrows, so you can't pull a compared-version line into CENTER (the README-vs-first-version screenshot). Scenario-first design; hand chain to **req (sole minter)**; I derive-confirm → PO build-go → expert builds. **Keep the 3-way path fully intact.**

## Root cause (MEASURED, rb-diff-editor.ts src/public/ts/components/)
- `computeMergedCenter()` (a0b30550, :153): when `base===''` (no merge-base → 2-way, :160-163) it sets CENTER=LOCAL and **leaves `this.conflicts = []`**. No 2-way hunk set is ever computed.
- `renderMergeGutter()` (e24dc98a, :212): `decos = this.conflicts.map(...)` and the accept-bar is `this.conflicts.length ? ... : 'no conflicts'`. With `conflicts=[]` → **draws nothing** in 2-way. ← Tron's exact symptom.
- The R30.6 2-way LCS line-diff (`computeDiff/renderHunks/takeHunk`) was **SUPERSEDED** by the R30.9 diff3 3-way path (header :5-6) — so 2-way lost its hunk computation entirely.
- ★ The take-over MECHANISM already exists and is mode-agnostic: `Conflict{id, a:string[](local), b:string[](remote), pick:'a'|'b', span}`; `acceptChange(id,side)` (843d79d4) sets `pick` + `rebuildCenter()` re-flattens CENTER from the picked sides. **It just never gets a 2-way set to render.**

## Fix — populate a 2-way hunk set, reuse the existing render/accept machinery
### NEW: `RbDiffEditor.computeTwoWayHunks(localLines, remoteLines)`
A plain LCS 2-way line-diff (reintroduce the superseded R30.6 LCS as a focused helper) that emits one entry per differing region into `this.conflicts`, using the SAME `Conflict` shape, `pick:'a'` (default = keep Local):
- **change**: `{a:[local lines], b:[remote lines], pick:'a'}`
- **pure add** (remote-only): `{a:[], b:[remote lines], pick:'a'}` → default absent, ► inserts.
- **pure del** (local-only): `{a:[local lines], b:[], pick:'a'}` → default kept, ► removes.
Called from `computeMergedCenter`'s `base===''` branch (replaces the "leave conflicts=[]"). CENTER still starts = LOCAL (pick='a' everywhere), then re-flattens via the existing `rebuildCenter` as the user takes hunks. Pure/DOM-free/unit-testable, like the diff3 core.

### EXTEND `computeMergedCenter` (a0b30550, existing Method)
`base===''` branch: `this.conflicts = this.computeTwoWayHunks(localLines, remoteLines)` instead of `[]`. `twoWay=true` stays. (Impl-edit to the existing method; marker stays.)

### EXTEND `renderMergeGutter` (e24dc98a, existing Method)
Branch on `this.twoWay`: render the SAME gutter decos + ◄/► accept-bar, but label each entry **"change #N (take-over)"** with take-over styling — NOT "conflict #N". ◄ = keep Local, ► = take Version. 3-way branch UNCHANGED (conflict styling). (Impl-edit; marker stays.)

### REUSE `acceptChange` (843d79d4) — NO logic change
Already resolves any `conflicts[]` entry by id (pick side → `rebuildCenter`). Works for 2-way hunks once `conflicts[]` is populated. (Verify `rebuildCenter` handles 2-way spans — same Conflict shape, so it does.) Optional: `applyAllNonConflicting` in 2-way = "take all from Version" (set every hunk pick='b') — nice-to-have, not required for the fix.

## Chain to mint (scenario-first — req)
- **UC `diffEditor.twoWayTakeOver`** (R30.x, this req) → Class **RbDiffEditor 18165081 REUSE** → Method **`RbDiffEditor.computeTwoWayHunks` (NEW, name-matching)** → **Impl designAhead**.
- **Build-note (expert, not new units):** ALSO extend the EXISTING chained methods in the same commit — `computeMergedCenter` (call computeTwoWayHunks in the base==='' branch) + `renderMergeGutter` (2-way take-over labeling/styling). `acceptChange` reused unchanged. Their Impl markers STAY (impl-edits, no new Method units). **3-way path untouched.**
- Class RbDiffEditor 9→? methods: +1 (computeTwoWayHunks). 0-dup, name-exact, unit-level ownerIor.

## Gate / handoff
On req commit → I run the comprehensive derive-confirm (name-exact / RbDiffEditor REUSE 1-unit / 0-dup / designAhead / marker-attach-plan) → PASS/FAIL → PO holds build-go behind it → expert builds → I confirm marker-attach on `computeTwoWayHunks` decl + own the restart if any server change (none expected — pure client). Tester DET-3x + Tron visual re-check (2-way ◄/► now pull into CENTER).
