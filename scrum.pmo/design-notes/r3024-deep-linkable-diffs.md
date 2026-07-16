# R30.24 — Deep-linkable & shareable 3-way diffs (Tron: "links for IMG_4522")

**Author:** robbin-architect @ robbinTeam2:0.3 · **Status:** DERIVE-CONFIRM PASS (minted req 4c1dd799a) · **Date:** 2026-07-16
**Req:** `9a2c9c46` (R30.24) · **crossRef:** R30.6.6 showDiff (mount entry) · R30.6.7 RepoRegistry (repo-key) · R30.23 (the diff being linked).

## Need
The 3-way diff has NO URL — state lives only in the selectors, so an IMG_4522 verification can't be linked. Make the diff URL-addressable (open/restore from a link) + add a copy-link/share affordance.

## DERIVE-CONFIRM (by uuid-FILE) = PASS
Chain: Req `9a2c9c46` → UC `cc47d004` (diffEditor.openFromUrl) + UC `8e88026a` (diffEditor.shareLink) → Class **RbDiffEditor `18165081`** (REUSE) → Methods `f52b6941` (openFromParams) / `3fffd212` (buildShareLink) → Impls `dc236c19` / `bcd06c77`.
- ✅ name-exact (RbDiffEditor.openFromParams / .buildShareLink), designAhead, sourceFile rb-diff-editor.ts
- ✅ 0-dup (one Method + one Impl file each); Method→Impl links resolve
- ✅ ownerIor unit-level (Impl→Method→Class 18165081; UC→Req→Sprint); both UCs carry class+classes[]+method+coveredRequirement

## THE 3 FLAGS — resolved
**Flag 1 — method names: ACCEPT.** `openFromParams` (URL params → diff state) + `buildShareLink` (diff state → URL). Name-exact, clear, inverse pair.

**Flag 2 — owner-split: OVERRIDE PO steer — KEEP BOTH on RbDiffEditor (as minted).**
PO steered openFromParams → RbEditorLayout (sibling of showDiff). I disagree, strong reason:
1. **State-owner principle.** The diff state (`this.left`/`this.right` = {path, ref, repo} + 3way) lives on **RbDiffEditor** (rb-diff-editor.ts:148-169, 278-284). `buildShareLink` READS it; `openFromParams` WRITES it — an inverse serialize/deserialize pair on the SAME state. PO already conceded buildShareLink belongs on RbDiffEditor "because it owns st.repo/path/refs" — that same premise forces openFromParams there too. Splitting them makes RbEditorLayout reach into rb-diff-editor's private left/right.
2. **showDiff is MOUNT, not state.** `RbEditorLayout.showDiff` (marker dc302e8e) creates the overlay + mounts `<rb-diff-editor>` + `loadSide` — routing/mount only; it owns no repo/ref state. openFromParams is state-apply — a DIFFERENT concern from mount, so it is NOT "the same concern as showDiff."
3. **Composition, not relocation.** edit.ts glue composes the two existing concerns: `layout.showDiff(path)` (mount) → `diffEl.openFromParams({repo,left,right,3way})` (state-apply + recompute). Cohesion of the URL⇄state codec stays in one class.
→ **No re-point needed; minted units STAND.** (If PO still prefers the split after this, req re-points openFromParams owner→RbEditorLayout 94e7bf82 + Impl sourceFile→rb-editor-layout.ts, R30.11 pattern.)

**Flag 3 — URL schema: ACCEPT** (matches PO steer + req AC-url-schema/AC-repo-safety):
`/edit/<path>?repo=<KEY>&left=<ref>&right=<ref>&3way=1`
- `repo` = KEY resolved server-side via R30.6.7 RepoRegistry allowlist; unknown/absent → fallback default (rawbin), no client absolute path honored.
- `path` = file path (existing /edit/<path> route). `left`/`right` = git refs. `3way=1` = optional three-way flag.
- IMG_4522 link: `/edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1`.

## Build wiring (expert; markers = the two designAhead Impls)
- `openFromParams(params)` on RbDiffEditor: set this.left/this.right {path,ref,repo} + 3way from params → recompute (loadSide + computeMergedCenter). Marker `dc236c19`.
- `buildShareLink()` on RbDiffEditor: read current this.left.{repo,path,ref} + this.right.ref + 3way → build `/edit/<path>?repo=&left=&right=&3way=1` → clipboard. Marker `bcd06c77`. Add copy-link affordance to the toolbar.
- edit.ts URL glue: on load, parse `location.search` → `layout.showDiff(path)` then `diffEl.openFromParams(...)`. (glue, no new unit — it's the UC's actor step.)

## Gate / handoff
Derive-confirm PASS → PO build-go → expert (pure client, no restart) → I backstop: `openFromParams`/`buildShareLink` markers AST-attached name-exact + round-trip (open→share→open restores identical view) + repo-key safety (unknown key → rawbin fallback, no path abuse) → tester DET-3x + Tron clicks the IMG_4522 link.
