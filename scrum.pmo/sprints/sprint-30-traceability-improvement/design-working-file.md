# Design: Working-File Diff Support (Tron req, left=latest)

**Author:** robbin-architect@WODA.prod robbinTeam2:0.3 · 2026-07-19 · parallel to repo-manager
**Ask:** left=latest resolves to the ON-DISK WORKING FILE (uncommitted included), WRITABLE on save, DEFAULT left on diff-open.

## Key finding: most of this already exists
- **Working READ already implemented:** loadSide (:200-212) branches — `src.content`→literal; else `st.ref`→GET /api/git/file (git show ref:path); else (**ref===''**)→GET **/api/files/<path>?repo=** = the RAW fs working file. So the working-file read IS the empty-ref branch.
- **Working WRITE already implemented:** save() ([impl a88b2b53]) PUTs edCenter → **/api/files/<this.left.path>?repo=<this.left.repo>** (R30.38). That is the SAME file left=latest reads. Round-trip is already closed.
What's missing: a NAMED `latest` pseudo-ref (explicit, shareable, pickable, defaultable — distinct from "unset"), making it the DEFAULT left, and reconciling the R30.17 promote (which currently moves the working file OFF the left).

## (1) Content resolution + the `latest` pseudo-ref
Define `const WORKING = 'latest'` (client sentinel).
- **FIX-SITE A — loadSide (:202):** change `else if (st.ref)` → `else if (st.ref && st.ref !== WORKING)` (git/file branch), so `st.ref===WORKING` falls to the /api/files working-file branch (NOT `git show latest:path`, which would fail). Title (:222,:724): render `path@latest`.
- **FIX-SITE A2 — resolveBase (:382):** it computes `git merge-base(left.ref,right.ref)`. `latest` is not a git ref → `merge-base latest <ref>` ERRORS. Guard: treat `ref===WORKING` (and '') as no-ref → return '' (→ 2-way). One-liner: `if (!isGitRef(left.ref) || !isGitRef(right.ref)) return ''`, `isGitRef = r => !!r && r !== WORKING`.
- Server unchanged: WORKING never reaches /api/git/file, so guardRef/REF_RE untouched. (Optional defense-in-depth: /api/git/file rejects ref==='latest'.)

## (2) SAVE round-trip — CONFIRMED, no change
save() → PUT /api/files/<left.path>?repo=<left.repo> = exactly where left=latest reads. loadSide mutates st.path/st.ref but NEVER st.repo, so left.repo+left.path survive the load → save writes the working file. read-working → edit CENTER → save → working. ✓ Only add a TEST locking the round-trip.

## (3) DEFAULT left=working on diff-open — the orientation FLIP
Two entry paths:
- **FIX-SITE C1 — openFromParams (:811):** `const left = params.get('left') || WORKING;` and `const right = params.get('right') || (left===WORKING ? 'HEAD' : '');`. _deepLink=true already SUPPRESSES populateLeftHistory (:224 guard) → working STAYS on the left. So the deep-link path needs only the default change.
- **FIX-SITE C2 — showDiff/preselect (rb-editor-layout.ts:69) + non-deep-link [Open Diff] (edit.ts:118):** today it does `loadSide('left',{path,content})` with ref='' → loadSide:224 populateLeftHistory PROMOTES the working file to the RIGHT + puts HEAD~1 on the LEFT (R30.17 "older-on-left"). That is the OPPOSITE of Tron's want. Change the default open to establish left=WORKING (stays left, no promote) + right='HEAD', suppressing the promote.

## (4) Interaction with R30.17 + 3-way (the real design decision)
- **R30.17 reconcile:** populateLeftHistory's promote-to-right assumed "working starts left → move to right, older on left." Tron's new default INVERTS to "working stays left, compare vs a ref on right." → Generalize the existing `_deepLink` suppressor into a **`_pinnedLeft`** flag set whenever left=WORKING is the intended default; while set, populateLeftHistory does NOT promote. Repurpose the LEFT history/⎇ picker to pick the RIGHT compare-ref (or disable left-history when left=working). This is the one behavioral decision to surface — recommend: working-left default, right defaults to HEAD, the picker chooses the right ref.
- **3-way degradation (correct-by-construction):** base = mergeBase(left,right) needs TWO git refs. left=WORKING ⇒ no base ⇒ computeMergedCenter 2-way fallback (:236/:243) = a clean 2-way diff (working vs ref). A genuine base-aware 3-way still works when BOTH sides are real refs. So: working-left ⇒ 2-way; two-refs ⇒ 3-way. Degrades correctly, no conflict. CENTER (editable, saved) = the 2-way result written to the working file.

## Fix-site summary (minimal)
| # | Site | Change |
|---|------|--------|
| A | loadSide :202 | `st.ref!==WORKING` guard → route latest to /api/files (working read) |
| A2 | resolveBase :382 | treat WORKING/'' as no-ref → 2-way (no `merge-base latest`) |
| B | save (a88b2b53) | NONE — already writes /api/files working file; add round-trip TEST |
| C1 | openFromParams :811 | default left=WORKING, right=HEAD-if-working |
| C2 | showDiff :69 / edit.ts:118 | default open = left=WORKING pinned, right=HEAD, no promote |
| D | populateLeftHistory 751934c1 | `_pinnedLeft` suppresses promote when left=working; picker → right ref |

## Decomposition (scenario-first)
New Req "Working-file diff (left=latest)". UCs:
- **UC-W1 diff.workingRef** — `latest`→fs working read (loadSide + resolveBase). [core]
- **UC-W2 diff.workingSaveRoundtrip** — confirm+TEST save→working round-trip (no code change beyond test/guard).
- **UC-W3 diff.defaultWorkingLeft** — default left=latest on open (openFromParams + showDiff) + R30.17 promote-suppression (`_pinnedLeft`). [the flip]
- **UC-W4 (opt) diff.refPickerLatest** — `latest` selectable in the ⎇ picker.
Build order: UC-W1 → UC-W2 → UC-W3 → UC-W4. UC-W3 carries the R30.17 reconcile (name-matched Impl on populateLeftHistory + openFromParams + showDiff). Behavior change → commit+bump+rebuild+deploy+gate (open a diff → left shows editable working file by default; edit+save → on-disk file updated). Parallel to repo-manager; touches diff-open + loadSide (NOT the repo-seed/UC8 surface).
