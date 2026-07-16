<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 30 Requirements — Sprint 30 — Traceability Improvement

## Requirements

- [ ] **R30.1 — Traceability tree: CurrentSprint top + eager-lazy Sprints collection**
  [requirement:uuid:6f796898-4dbb-47a3-ab8a-914b4c80b353]
  > TRON 2026-07-02 (plan in Sprint 30): traceability tree top = CurrentSprint: Sprint <N> (3 eager children Current/Last/Next); 2nd node = Sprints 01-<N> collection, collapsed, badge=count, eager sprint-nodes + LAZY tasks (load on expand); exactly 2 top-level nodes; structure-eager/payload-lazy scales like R26 federation.
  The traceability tree grows well as sprints accumulate: exactly TWO top-level nodes. (1) top = 'CurrentSprint: Sprint <N>' - the CURRENT sprint, not 'Current: Task X' - with 3 EAGER children Current / Last Completed / Next Backlog. (2) 2nd top = 'Sprints 01-<N>' COLLECTION parent, COLLAPSED, badge = sprint count; it EAGER-loads all sprint NODES but LAZY-loads their TASKS (tasks load only when a sprint node is expanded). Structure-eager / payload-lazy - the same scaling pattern as R26 federation loading - so the tree stays fast as sprints grow.
  **Acceptance criteria:**
  - [ ] **(tree)** The top node is 'CurrentSprint: Sprint <N>' - the CURRENT sprint (not 'Current: Task X').
  - [ ] **(tree)** The CurrentSprint node has 3 EAGER children: Current / Last Completed / Next Backlog (task) - loaded as-is.
  - [ ] **(tree)** The 2nd top-level node = 'Sprints 01-<N>' COLLECTION parent, COLLAPSED, with a badge = sprint count.
  - [ ] **(scaling)** EAGER-LAZY: the collection eager-loads all sprint NODES but LAZY-loads their TASKS - a sprint's tasks load ONLY when that sprint node is expanded.
  - [ ] **(tree)** Exactly TWO top-level nodes (CurrentSprint + Sprints-collection); tasks never load until their sprint is expanded.
  - [ ] **(scaling)** Structure-eager / payload-lazy so the tree scales as sprints grow - the same loading pattern as R26 federation (structure eager, payload lazy).
  -> traceTree.currentSprintEagerLazy [uc:uuid:e22113cd-022d-48f0-b434-9ec4636e2081]

- [ ] **R30.2 — Eager child-count badges**
  [requirement:uuid:850a339d-c7e5-4308-b2c7-65536bd5271e]
  Every collapsed trace-tree node shows a child-count BADGE reflecting its real childCount from server metadata BEFORE its children are loaded (structure+count eager, payload lazy). The CurrentSprint node and each Sprint node in the Sprints collection carry a badge = their true child count without expanding. Impl: RbTraceTree.computeBadges + renderCurrentSprintEagerLazy (nodeChildCount from server metadata), deployed v0.7.11.
  **Acceptance criteria:**
  - [ ] **(badge)** Every tree node child-count BADGE shows the correct count from when its PARENT loads (eager) - NOT 0-until-expand.
  - [ ] **(badge)** The count comes from the PARENT /children response metadata (childCount per child), not a per-node prefetch.
  - [ ] **(loading)** Lazy level-by-level: expanding a node loads its children WITH their own child-counts (next level badges correct); deeper content on further expand.
  - [ ] **(bug)** THE BUG: all sprint nodes showed badge=0 initially - must show the real task-count before expand.
  - [ ] **(loading)** Still PAYLOAD-LAZY: children CONTENT loads on expand; only COUNTS are eager (structure+count eager / payload lazy - R26 pattern).
  -> traceTree.eagerChildCountBadges [uc:uuid:80cb8336-c758-49f6-80d9-dafe068ad71f]

- [ ] **R30.3 — Sprint selection populates detail drawer**
  [requirement:uuid:6cd770df-0034-406e-b20c-bb8bddaadbf7]
  Selecting a Sprint node in the traceability tree POPULATES the detail drawer with that sprint's detail (name, goal, task slots), instead of an empty/stale drawer. Impl: RbDetailDrawer.renderDetailForRef sprint-case (deployed v0.7.11).
  **Acceptance criteria:**
  - [ ] **(selection)** Selecting/clicking a SPRINT node updates the detail drawer to show THAT sprint details.
  - [ ] **(bug)** THE BUG: selecting a sprint did NOT change the drawer content.
  - [ ] **(selection)** selection->drawer works for ALL tree node types (sprint/task/etc) - shows the selected unit details (fix on RbDetailDrawer.renderDetailForRef).
  -> detailDrawer.selectionUpdatesDrawer [uc:uuid:9095cd05-5528-4450-a830-f9b858129ad2]

- [ ] **R30.4 — Lobby name from profile, not random**
  [requirement:uuid:17e12898-9720-4d29-af29-18bddb929f40]
  > TRON 2026-07-13: the lobby 'Your Name' shows a random 'User NNN' instead of the profile name (Marcel Donges). RoomBrowser.ts:29 computes memberName sync before the profile loads (async race). Use the profile name once loaded; random only as a true last resort.
  The lobby 'Your Name' shows the PROFILE name (Marcel Donges), not a random 'User NNN'. THE BUG: RoomBrowser.ts:29 computes memberName SYNCHRONOUSLY before the profile has loaded (an async race) - so profile?.name is null, the random fallback fires, and a different name shows every reload. FIX: use the profile name once it is LOADED (await the profile / re-render on profile-load); the random 'User NNN' is used ONLY as a TRUE last resort (no profile at all). The profile token/uuid is stable (05e58f81) - only the displayed NAME regresses.
  **Acceptance criteria:**
  - [ ] **(name)** The lobby 'Your Name' shows the PROFILE name (Marcel Donges), NOT a random 'User NNN'.
  - [ ] **(bug)** THE BUG: RoomBrowser.ts:29 computes memberName SYNC before the profile loads (async race) -> profile?.name null -> random fallback -> a different name every reload.
  - [ ] **(fix)** Fix = use the profile name once LOADED (await profile / re-render on profile-load); random 'User NNN' only as a TRUE last resort (no profile at all).
  - [ ] **(identity)** The profile token/uuid is stable (05e58f81) - only the displayed NAME regresses; the fix must not change the stable identity token, only the name resolution.
  -> lobby.memberNameFromLoadedProfile [uc:uuid:d6d8f55a-0300-4249-b7f8-c13a80a47490]

- [ ] **R30.5 — Editor file pane shows full project filetree**
  [requirement:uuid:21ced567-d47f-4f3c-9b28-225a45dfecce]
  > TRON 2026-07-13: the /edit Files pane shows an EMPTY tree. rb-file-tree.ts:31 requests /api/files/'/' -> safePath('/') = FS-root -> fails startsWith(PROJECT_ROOT) -> Forbidden. Root request must use EMPTY relPath (not '/').
  The /edit Files pane shows the FULL project filetree (src / scenario / scrum.pmo / scripts / test / data / etc), expandable. THE BUG: rb-file-tree.ts:31 requests /api/files/'/' for the root -> the server's safePath('/') resolves to FS-root, fails startsWith(PROJECT_ROOT) -> {error:Forbidden} -> empty tree. PROVEN: /api/files/ (empty relPath) returns the full tree; /api/files/%2F -> Forbidden. FIX: the file-tree root request uses an EMPTY relPath (not '/') - a one-line fix at rb-file-tree.ts:31 (drop the "|| '/'" fallback).
  **Acceptance criteria:**
  - [ ] **(tree)** The /edit Files pane shows the FULL project filetree (src / scenario / scrum.pmo / scripts / test / data / etc), expandable.
  - [ ] **(bug)** THE BUG: rb-file-tree.ts:31 requests /api/files/'/' for root -> server safePath('/') resolves to FS-root, fails startsWith(PROJECT_ROOT) -> {error:Forbidden} -> empty tree.
  - [ ] **(bug)** PROVEN: /api/files/ (empty relPath) returns the full tree; /api/files/%2F -> Forbidden - confirming the root request must use empty relPath, not '/'.
  - [ ] **(fix)** Fix = the file-tree root request uses an EMPTY relPath (not '/') - one-line at rb-file-tree.ts:31, drop the "|| '/'" fallback.
  -> fileTree.rootUsesEmptyRelPath [uc:uuid:18d6a337-efea-4dc1-8de4-7c65dde053b4]

- [ ] **R30.6 — IntelliJ-style 3-way diff/merge editor (resolve OOSH version issue)**
  [requirement:uuid:12922d5d-470c-4044-a3a2-2f1248169b44]
  > TRON 2026-07-13: build an IntelliJ-style 3-way diff/merge editor to resolve the OOSH version issue. Left + right compared, center merged, per-hunk take-over, file selectors, git branch/commit chooser, swap.
  An IntelliJ-style 3-WAY diff/merge editor to resolve the OOSH version issue: left + right (the two compared versions) merged into a center pane, with per-hunk take-over, file selectors (RbFileTree), a git branch/commit chooser, and a swap. Decomposed into R30.6.1-5.
  **Acceptance criteria:**
  - [ ] **(three-way)** An IntelliJ-style 3-way diff/merge editor: left + right (compared versions) + center (merged).
  - [ ] **(resolve-version)** It resolves a file version conflict by merging left+right into the center result (the OOSH version issue).
  - [ ] **(decomposed)** Composed of R30.6.1 (3-way view) + R30.6.2 (file selectors) + R30.6.3 (hunk take-over) + R30.6.4 (git branch/commit chooser) + R30.6.5 (swap).
  -> diffEditor.threeWayEditor [uc:uuid:7c9138f4-9754-4fa8-9271-e707cdfa762c]

- [ ] **R30.6.1 — 3-way diff/merge VIEW (left/right/center panes)**
  [requirement:uuid:fda2dc4f-d14f-466f-992d-b93413a5c8f2]
  > TRON 2026-07-13 (R30.6 sub-feature): 3-way diff/merge VIEW (left/right/center panes).
  The editor shows THREE panes: left + right (the two compared versions) + center (the merged result), with line-level diff highlighting between left<->center and right<->center.
  **Acceptance criteria:**
  - [ ] **(panes)** Three panes: LEFT + RIGHT (the two compared versions) + CENTER (the merged result), side by side.
  - [ ] **(highlight)** Line-level diff highlighting between left<->center AND right<->center (changed/added/removed lines marked).
  -> diffEditor.computeLineDiff [uc:uuid:c6d186ec-8c6e-4305-934a-02986ada1926]

- [ ] **R30.6.2 — FILE SELECTORS (full-path + open-chooser, reuse RbFileTree)**
  [requirement:uuid:e4c9ffbf-d368-4ac3-8cbc-93859e5a2fce]
  > TRON 2026-07-13 (R30.6 sub-feature): FILE SELECTORS (full-path + open-chooser, reuse RbFileTree).
  Each pane has a file selector: a full-path selector above left + right, and a merged-path selector in the center, each with an 'open file chooser' button that browses the project tree via RbFileTree (reused from R30.5).
  **Acceptance criteria:**
  - [ ] **(path-selectors)** A full-path selector above left + right, and a merged-path selector in the center pane.
  - [ ] **(chooser)** Each selector has an 'open file chooser' button that browses the project tree, REUSING RbFileTree (R30.5) for the tree browse.
  -> diffEditor.pickFile [uc:uuid:959b0922-743b-47c2-96df-c8edaab6ef91]

- [ ] **R30.6.3 — TAKE-OVER diffs (per-hunk left->center / right->center)**
  [requirement:uuid:1d0cf9b9-b0c2-4881-b53b-65d187654f68]
  > TRON 2026-07-13 (R30.6 sub-feature): TAKE-OVER diffs (per-hunk left->center / right->center).
  Per-hunk take-over buttons: left->center and right->center (+ the reverse) apply a diff hunk into the center pane, incrementally building the merged file.
  **Acceptance criteria:**
  - [ ] **(per-hunk)** Per-hunk buttons: left->center and right->center (+ the reverse center->side) to take over a diff hunk.
  - [ ] **(merged-build)** Applying take-overs incrementally BUILDS the center merged file from the chosen hunks.
  -> diffEditor.hunkTakeover [uc:uuid:73d0fd09-ad4b-4a19-8eda-09eabd261700]

- [ ] **R30.6.4 — GIT branch/commit CHOOSER (feed left/right)**
  [requirement:uuid:7eb81522-7098-483f-9554-325b0c6017cd]
  > TRON 2026-07-13 (R30.6 sub-feature): GIT branch/commit CHOOSER (feed left/right).
  A git branch/commit chooser lets the user pick a file from a specific branch or commit to feed into the left or right pane.
  **Acceptance criteria:**
  - [ ] **(branch-commit)** A chooser to pick a file from a specific git branch or commit, feeding it into the left OR right pane.
  -> diffEditor.gitRefPicker [uc:uuid:23070341-d340-49b9-afa6-ee4a152b521f]

- [ ] **R30.6.5 — SWAP left<->right button**
  [requirement:uuid:d32e29cd-5d94-49fb-93b2-4302aae6f11e]
  > TRON 2026-07-13 (R30.6 sub-feature): SWAP left<->right button.
  A SWAP button swaps the left and right panes (and their file selections/diffs).
  **Acceptance criteria:**
  - [ ] **(swap)** A SWAP button swaps the LEFT and RIGHT panes (their files, selections, and diffs).
  -> diffEditor.swapSides [uc:uuid:56281453-5398-446b-8845-5e74f746f6f3]

- [ ] **R30.6.6 — [Open Diff] toolbar button (LEFT=current file)**
  [requirement:uuid:91e06cc8-57ce-482a-91ae-4c9f13751059]
  > TRON 2026-07-13 (R30.6.6, REFINED): reaching the diff editor is an [Open Diff] BUTTON in the toolbar (not a tab) that opens it on what I'm editing — LEFT preselected to the current file.
  An '📊 Open Diff' BUTTON in the editor toolbar (rb-editor-toolbar, not a tab) opens the 3-way diff/merge editor preloaded with the current file on the LEFT: clicking it dispatches toolbar-open-diff -> edit.ts calls RbEditorLayout.showDiff(currentFilePath), which lazily mounts <rb-diff-editor> with the LEFT pane preselected to the file being edited (its path + current content), so the diff opens ready-to-compare and the user only picks the RIGHT side.
  **Acceptance criteria:**
  - [ ] **(entry)** An '📊 Open Diff' button appears in the editor toolbar (rb-editor-toolbar, next to View/Preview + Save), NOT a tab; works in both desktop and mobile form factors.
  - [ ] **(entry)** Clicking the button dispatches a bubbling toolbar-open-diff event; edit.ts handles it and calls RbEditorLayout.showDiff(currentFilePath).
  - [ ] **(mount)** showDiff lazily mounts <rb-diff-editor> (like rb-file-tree/rb-code-editor) — not eagerly loaded before first use.
  - [ ] **(preselect)** The diff opens with the LEFT pane preselected to the CURRENT editor file — its path AND current content (reuse the editor's current-file state / rb-code-editor.getValue()) — ready to compare; the user then picks the RIGHT side.
  -> diffEditor.openDiffButton [uc:uuid:32effc0a-657d-4c5a-a187-4e073ebdafa7]

- [ ] **R30.6.7 — OOSH-repo targeting via RepoRegistry key-allowlist**
  [requirement:uuid:e8d2ac99-a844-4794-9f11-86911bb4e058]
  > TRON 2026-07-13 (R30.6.7): the diff tool must work on the OOSH repo, not just RawBin — target the OOSH repo safely.
  The diff/file tooling can target a DIFFERENT repo (e.g. the OOSH repo) safely, without hardcoding RawBin's root. The client sends a repo KEY (?repo=oosh), never an absolute path; a server-side allowlist (new Class RepoRegistry) maps the key to a configured absolute root, unknown key -> 400. GitApi's currently-hardcoded ROOT (shipped 7c9554494) is de-hardcoded to a per-request RepoRegistry.resolve(req.repo) seam that OPTS.cwd + safeRelPath read; /api/files, RbFileTree.setRepo, and the rb-diff-editor repo selector consume the same registry. Default remains rawbin=PROJECT_ROOT (R30.5 unaffected).
  **Acceptance criteria:**
  - [ ] **(security)** The client supplies a repo KEY only (e.g. ?repo=oosh); the absolute path lives server-side in a RepoRegistry allowlist. A client-supplied absolute path is NEVER resolved.
  - [ ] **(registry)** RepoRegistry.resolve(key) returns the allowlisted absolute root for the key, else null; RepoRegistry.list() returns [{key,label}] for a repo picker. Allowlist config {rawbin:PROJECT_ROOT, oosh:<abs OOSH root>}.
  - [ ] **(git)** GitApi's hardcoded ROOT is replaced by a per-request RepoRegistry.resolve(req.repo) seam that BOTH OPTS.cwd and safeRelPath read; branches/commits/fileAtRef run with cwd=resolvedRoot. Unknown ?repo -> 400.
  - [ ] **(security)** safePath still applies WITHIN the resolved root (no '..', no leading '/', resolve(root,p).startsWith(root+sep)); read-only across all repos.
  - [ ] **(wiring)** /api/files accepts optional ?repo=<key>; RbFileTree.setRepo(key) sets a repo attr + reloads (loadDir appends ?repo); rb-diff-editor exposes a repo selector from RepoRegistry.list() feeding loadSide/pickFile/pickRef.
  - [ ] **(back-compat)** ?repo absent -> rawbin=PROJECT_ROOT; R30.5 and existing callers are unchanged.
  -> diffEditor.repoTargeting [uc:uuid:522473f3-f7b8-4444-91ec-101fd2bfee77]

- [ ] **R30.7 — Uniform git-ref validation guard (one shared guard, all endpoints)**
  [requirement:uuid:3618036e-d605-4e30-8651-9a14d0a863f6]
  > Tester finding (LOW, safe) via robbin-po 2026-07-13: /api/git/commits is lenient on bad refs (200) where /api/git/file validates (400) — SAFE (execFile no-shell, zero injection) but INCONSISTENT. Capture: uniform git-ref validation guard.
  Every git endpoint validates its ref through ONE shared guard (GitApi.guardRef, allowlist ^[A-Za-z0-9._/-]+$) instead of per-endpoint checks: /api/git/file already rejects a bad ref (400) but /api/git/commits is lenient (200) - inconsistent. Route file + branches + commits + any future endpoint through the single guard so behaviour is uniform AND a newly added endpoint cannot forget the check (correct-by-construction). Defense-in-depth belt-and-suspenders over execFile (no-shell, already injection-safe) - a hardening layer, reject-first before any git invocation.
  **Acceptance criteria:**
  - [ ] **(guard)** A single shared ref-validation guard (GitApi.guardRef, allowlist ^[A-Za-z0-9._/-]+$) is applied to ALL git endpoints — file, branches, commits, and any future one — NOT duplicated per endpoint.
  - [ ] **(guard)** /api/git/commits (currently 200 on a bad ref) rejects invalid refs with 400, matching /api/git/file — behaviour is uniform across every git endpoint.
  - [ ] **(by-construction)** The guard is a single choke point every git handler routes through, so a NEWLY added git endpoint cannot bypass ref validation (correct-by-construction, not opt-in per endpoint).
  - [ ] **(security)** The guard is belt-and-suspenders OVER execFile (no-shell, already injection-safe) — a hardening layer, and rejects a bad ref BEFORE any git process is invoked (reject-first).
  - [ ] **(verify)** A probe of every git endpoint with a bad ref (traversal, shell metachars, out-of-allowlist) returns 400 (not 200); valid refs still resolve normally.
  -> gitApi.uniformRefGuard [uc:uuid:8d6743e0-5788-4b57-9467-b5c10cfcad3a]

- [ ] **R30.9 — IntelliJ-faithful base-aware 3-way merge (Monaco 3-pane + node-diff3)**
  [requirement:uuid:0d6f18cd-1496-4672-8fee-5a38eeb728dc]
  > TRON 2026-07-13 RULING: IntelliJ 3-way merge at ANY overhead cost — max fidelity to IntelliJ specifically (left local | editable result | right remote, per-change accept arrows, base-aware auto-apply, Apply-All-Non-Conflicting, sync scroll). Weight/effort no object.
  An IntelliJ-faithful base-aware 3-way merge editor: LEFT=local (read-only) | CENTER=result (editable full-Monaco, autocomplete) | RIGHT=remote (read-only), IntelliJ column order. node-diff3 computes the CENTER as the base-aware auto-merge (non-conflicting changes pre-applied) + true conflict regions, with BASE from GitApi.mergeBase (git merge-base). Per-change accept-left/accept-right gutter arrows apply a side into CENTER, plus 'Apply All Non-Conflicting Changes' and synchronized 3-pane scroll. Retires the in-house LCS (R30.6.1) + manual hunk gutter (R30.6.3). No merge-base -> documented 2-way take-over fallback. Custom build chosen over monaco-vscode-api (that is VS Code UX, not IntelliJ) and over CM5 MergeView (not base-aware, no Monaco autocomplete center).
  **Acceptance criteria:**
  - [ ] **(merge)** Two refs -> GitApi.mergeBase -> CENTER starts as the base-aware auto-merge (non-conflicting changes from either side pre-applied via node-diff3), true conflicts flagged; layout is LEFT=local | CENTER=result | RIGHT=remote (IntelliJ column order).
  - [ ] **(gutter)** Per-change accept-left / accept-right gutter arrows (renderMergeGutter + acceptChange) apply that side's chunk into CENTER at the aligned range; conflicts are highlighted for resolution.
  - [ ] **(actions)** 'Apply All Non-Conflicting Changes' (applyAllNonConflicting) is one click; syncScroll3 keeps all three panes scroll-aligned.
  - [ ] **(fidelity)** CENTER is a full Monaco editor (autocomplete/lint/keybindings) — IntelliJ's fully-functional center; the 3 editors share one Monaco via monacoLoader (reuse rb-code-editor's).
  - [ ] **(git)** BASE = GitApi.mergeBase(leftRef,rightRef) via read-only git merge-base (execFile + ref-allowlist / R30.7 guardRef).
  - [ ] **(fallback)** No merge-base (unrelated histories / working-file vs arbitrary ref / non-git) -> documented 2-way take-over fallback (CENTER=local, accept-arrows work as plain take-over).
  - [ ] **(supersede)** The in-house LCS is retired: R30.6.1 computeDiff (15843ac9) + R30.6.3 renderHunks (37636aaa)/takeHunk (6ebfac12) markers removed + Impl units noted 'superseded by IntelliJ 3-way merge (R30.9)'; node-diff3 owns diffing. save writes CENTER via /api/files.
  - [ ] **(verify)** computeMergedCenter unit test: diff3Merge auto-applies non-conflicting changes + flags true conflicts (pure, DOM-free).
  -> merge.diff3Center [uc:uuid:829f010e-e811-4a64-89a3-f324fc48995d]
  -> merge.threePane [uc:uuid:cd353f5f-9f5a-4aea-9c33-d4ddec80fe4f]
  -> merge.gutterAcceptArrows [uc:uuid:009e9cb7-d486-4d24-ad44-43d4030f0245]
  -> merge.acceptChange [uc:uuid:e9824791-ead6-4797-83a8-1e3266277bdf]
  -> merge.applyAllNonConflicting [uc:uuid:9d95ce6b-d405-47f7-870f-34f854e14650]
  -> merge.syncScroll [uc:uuid:2d3b5c12-1fd2-4b63-8b5f-9c63b116f131]
  -> git.mergeBase [uc:uuid:e7fc6679-4490-4c85-9fbd-2730df1a79ab]
  -> editor.monacoLoader [uc:uuid:cdea9222-19d8-4f7a-8880-29ab1670a949]

- [ ] **R30.10 — Right-side default = the file's git history**
  [requirement:uuid:168d5c58-2373-45f4-9018-0cd1e3528677]
  > Tron 2026-07-13 (after R30.9 'amazing'): on opening the diff for a git-tracked file, the right side should default to all versions of THAT file in history (LEFT=current working file, RIGHT=browse-its-history, default=most-recent committed).
  When the diff/merge opens for a git-tracked file, the RIGHT side defaults to that file's git history: a right-side history select is populated with all committed versions of THAT file (newest-first, git log --follow so renames are tracked) and defaults to the most-recent committed version, while LEFT stays the current working file - so the default view is 'working vs last commit', with older versions a dropdown away. Untracked/non-git files show 'no history' and fall back to manual pickFile/pickRef (no default). Path-guarded (RepoRegistry.resolve + safeRelPath), read-only execFile.
  **Acceptance criteria:**
  - [ ] **(history)** Opening the diff on a git-tracked file populates a RIGHT-side history select (newest-first, git log --follow) and defaults it to the most-recent committed version; LEFT stays the current working file (default view = working vs last commit).
  - [ ] **(history)** Selecting an older commit reloads the RIGHT side to that version (loadSide -> fileAtRef -> git show <sha>:<path>); the R30.9 base-aware merge recomputes.
  - [ ] **(fallback)** Untracked / new / non-git file -> history select shows 'no history', no default; RIGHT falls back to manual pickFile/pickRef (unchanged, graceful).
  - [ ] **(security)** fileHistory is PATH-guarded via RepoRegistry.resolve(repo key) + safeRelPath (no '..', within-root) — NOT guardRef (guardRef is for the ref on the subsequent git show, not the path); execFile array-args (no shell), read-only; unknown repo key -> 400.
  - [ ] **(verify)** GitApi.fileHistory returns the correct newest-first [{sha,date,author,subject}] list for a known path (NUL-delimited parse test).
  -> git.fileHistory [uc:uuid:3a442bc4-dfd7-4d70-a4dd-05c0ab69d24c]
  -> diffEditor.rightHistoryDefault [uc:uuid:bd62ccde-f333-4d49-ad54-77bd9c709bab]

- [ ] **R30.11 — Scoreboard/audit measures the walked chain, not denormalized/superseded artifacts**
  [requirement:uuid:651442ca-bc0d-4422-b324-fb1715f84c61]
  > robbin-po directive 2026-07-14 (R27.5 instrument-honesty theme): make the scoreboard measure TRUTH — walk Req->chain->Impl.tests[]/markers (not denormalized Req.tests[]), honor supersededBy, and repoint/retire the R30.9-supersede dangling. Origin: R22.3 false no-Test (req verify) + tester -2 false open + planner's 26-dangling measure.
  The traceability scoreboard/audit measures TRUTH by walking the chain, not by reading denormalized or superseded artifacts: (1) a Requirement's coverage is computed by walking Req->UC->Class->Method->Impl to Impl.tests[]/[impl] markers, NOT the denormalized Req.tests[] (which falsely showed R22.3 as no-Test though its Impl bd8e5d6f has Test 91d0edca); (2) Impls annotated supersededBy are excluded from open/uncovered counts (R30.6.1/6.3, retired by R30.9, were falsely scored 'open' — the tester's -2); (3) the 19 dangling Test->Impl left by the R30.9 supersede are repointed to R30.9's Impls or retired, and 7 other orphans triaged, leaving 0 dangling. By-construction: the scoreboard cannot again false-flag a tested-but-denormalized or superseded unit.
  **Acceptance criteria:**
  - [ ] **(walk-not-denorm)** A Requirement's test/impl coverage is computed by WALKING Req->UC->Class->Method->Impl to Impl.tests[]/[impl] markers, NOT the denormalized Req.tests[] — fixing the R22.3-style false 'no-Test' (R22.3 IS tested via Impl bd8e5d6f -> Test 91d0edca).
  - [ ] **(honor-superseded)** Impls (and their Methods/Tests) annotated supersededBy are EXCLUDED from open/uncovered counts, fixing the R30.6.1/6.3 false 'open' (the tester's -2).
  - [ ] **(cleanup)** The 19 dangling Test->Impl (Tests of the R30.6.1/6.3 impls retired by R30.9) are repointed to R30.9's replacement Impls OR retired-with-superseded; dry-run + count FIRST; 0 such dangling after.
  - [ ] **(cleanup)** The 7 other dangling (4 Req->UC / 2 Req->Test / 1 Task->UC) are triaged (repoint or retire) each with a reason; never silently drop a real edge.
  - [ ] **(by-construction)** After the fix, a tested-but-denormalized-empty Requirement or a superseded Impl cannot produce a false gap/open in the scoreboard (it measures the walked chain, not stale fields).
  - [ ] **(verify)** Re-run scoreboard: R22.3 scores TESTED, R30.6.1/6.3 score superseded-not-open, 0 dangling repo-wide (planner dry-run + count evidence).
  -> scoreboard.walkChainForTests [uc:uuid:5ae6ac40-1ce3-415c-82bf-622b53c242bd]

- [ ] **R30.12 — 2-way take-over wiring (no-base fallback accept arrows)**
  [requirement:uuid:c6f127bc-9f13-4f5f-945a-55a6293101eb]
  > Tron visual proof (tester) 2026-07-14: the 2-way take-over is LABELED but NOT WIRED — comparing LOCAL to a version (no merge-base) shows NO gutter arrows, so you cannot pull a compared-version line into CENTER (README-vs-first-version screenshot).
  Wire the 2-way take-over (no-merge-base fallback) so the accept arrows actually appear and pull lines into CENTER. Root cause: computeMergedCenter's base==='' branch left this.conflicts=[] , so renderMergeGutter drew nothing (Tron's symptom: comparing LOCAL to a version with no merge-base shows no arrows). Fix: a NEW RbDiffEditor.computeTwoWayHunks does an LCS local-vs-remote line-diff and populates this.conflicts with the SAME Conflict{a,b,pick,span} shape (pick='a' = keep Local by default), so the EXISTING renderMergeGutter + acceptChange + rebuildCenter machinery lights up in 2-way mode. The 3-way base-aware path is untouched. Pure/DOM-free/unit-testable, like the diff3 core.
  **Acceptance criteria:**
  - [ ] **(compute)** NEW RbDiffEditor.computeTwoWayHunks(localLines, remoteLines) does an LCS 2-way line-diff, emitting one Conflict{a,b,pick,span} per differing region (change / pure-add remote-only / pure-del local-only), pick='a' default (keep Local). Pure, DOM-free, unit-testable.
  - [ ] **(wire)** computeMergedCenter's base==='' branch sets this.conflicts = computeTwoWayHunks(...) instead of leaving [] ; twoWay=true stays; CENTER still starts = LOCAL (impl-edit to existing a0b30550, marker stays).
  - [ ] **(wire)** renderMergeGutter (twoWay branch) draws the SAME gutter decos + accept-left/accept-right bar, labeled 'change #N (take-over)' with take-over styling (NOT 'conflict'); accept-left=keep Local, accept-right=take Version (impl-edit to existing e24dc98a, marker stays).
  - [ ] **(reuse)** acceptChange (843d79d4, UNCHANGED) resolves a 2-way hunk by id (pick side -> rebuildCenter re-flattens CENTER) — works once conflicts[] is populated (same Conflict shape).
  - [ ] **(regression)** The 3-way base-aware path (merge-base present) is UNTOUCHED — same diff3 conflicts, conflict styling, behavior.
  - [ ] **(verify)** Tron visual re-check: comparing LOCAL to a version with NO merge-base now shows accept arrows that pull a compared-version line into CENTER (README-vs-first-version case); DET-3x on computeTwoWayHunks.
  -> diffEditor.twoWayTakeOver [uc:uuid:fbc0a539-1b97-4701-847c-d41af818c23e]

- [ ] **R30.13 — IntelliJ inter-pane merge gutters + connector ribbons**
  [requirement:uuid:9b525a80-5d8d-4533-a194-f63da132dd37]
  > Tron 2026-07-14 (Rider/IntelliJ merge screenshot = gold standard): inter-pane gutters with per-change accept icons + colored diagonal connector ribbons from source block to result, plus a change/conflict counter with navigation.
  IntelliJ/Rider-faithful inter-pane merge gutters + connector ribbons for the 3-pane diff/merge editor. Replaces the .de-accept-bar bottom bar (cramped on phone, invisible on desktop = effectively no controls) with two slim inter-pane action gutters (local<->result, result<->repository) carrying per-change take-over icons wired to acceptChange, plus colored diagonal SVG connector ribbons linking each changed source block to its landing rows in Result (blue non-conflict / green resolvable / red-brown conflict), scroll-synced, and a 'N changes, M conflicts' counter with up/down change navigation. Works in BOTH 2-way (R30.12) and 3-way (diff3) since they share conflicts[]. Pure client, IntelliJ column order.
  **Acceptance criteria:**
  - [ ] **(gutters)** renderInterPaneGutters replaces the .de-accept-bar bottom bar with TWO slim inter-pane action gutters (local<->result, result<->repository); per-change icons at the change's Result-row Y — take-Local / take-Repo / ignore / magic-wand at conflicts — call the existing acceptChange. Controls visible on desktop AND phone (fixes the invisible-desktop bar).
  - [ ] **(ribbons)** renderConnectorRibbons draws colored diagonal filled SVG ribbons linking each changed source block (ranges via diffIndices) to its landing rows in Result; blue=non-conflict, green=resolvable, red/brown=conflict.
  - [ ] **(align)** Gutter icons AND ribbons stay row-aligned: redraw on scroll (via syncScroll3 onDidScrollChange, requestAnimationFrame-throttled) + on resize + on rebuildCenter.
  - [ ] **(nav)** jumpToChange gives a toolbar 'N changes, M conflicts' counter + up/down buttons that reveal the prev/next change's Result line (revealLineInCenter + scroll-sync).
  - [ ] **(modes)** Gutters + ribbons light up in BOTH 2-way (R30.12 conflicts[]) and 3-way (diff3 conflicts[]) — they render from the shared conflicts[].
  - [ ] **(scope)** renderMergeGutter (e24dc98a) keeps its in-CENTER line-decorations but DROPS the .de-accept-bar; syncScroll3 (e3431e87) gains the throttled ribbon-redraw hook (impl-edits, markers unchanged); acceptChange/computeMergedCenter/computeTwoWayHunks reused UNCHANGED.
  - [ ] **(verify)** Tron visual: inter-pane gutters visible on desktop with working take-over icons + ribbons align on scroll; DET-3x on the render/nav methods.
  -> diffEditor.interPaneGutters [uc:uuid:71af9720-3c69-40ab-82f5-48b134af294d]
  -> diffEditor.connectorRibbons [uc:uuid:115034bd-ae97-4284-b95e-9acaf761610e]
  -> diffEditor.changeNavigation [uc:uuid:77e8b3b1-7549-430a-a2c3-1d2a2da9662f]

- [ ] **R30.14 — Service-Worker auto-update (deploys visible without hard-refresh)**
  [requirement:uuid:76512c5f-3e87-4e4f-99aa-113312458e07]
  > Tron/PO 2026-07-14: Tron hard-refreshes every deploy because the SW serves the stale cached bundle. Make new deploys auto-detected -> one-tap 'New version - reload', no hard-refresh.
  A new deploy becomes visible to open pages WITHOUT a hard-refresh. Root cause: the update detection (updatefound -> banner, /api/config version compare) is correct but only fires on load/navigation, so a PWA left open never re-checks. Two targeted additions reusing the existing banner/skipWaiting flow: (1) ServiceWorker.pollForWorkerUpdate periodically (interval + visibilitychange/focus, debounced) forces registration.update() + the version compare so updatefound/the banner lights up while the app is open; (2) ServiceWorker.claimClients adds self.clients.claim() to the sw.js activate handler so the new SW controls open pages and the existing controllerchange->reload fires. Primary UX = the existing one-tap 'New version - reload' banner (no surprise mid-edit reload). Pure client, no server restart.
  **Acceptance criteria:**
  - [ ] **(detect)** ServiceWorker.pollForWorkerUpdate: while the app is open, periodically (setInterval ~60s + on visibilitychange-visible / focus, debounced) calls registration.update() AND re-runs the /api/config version compare -> a new deploy triggers updatefound / the version-mismatch -> the EXISTING banner, WITHOUT a hard-refresh.
  - [ ] **(takeover)** ServiceWorker.claimClients: the sw.js activate handler calls self.clients.claim() (after old-cache cleanup) so the newly-activated SW controls open pages -> the existing controllerchange -> location.reload() fires (with the existing SKIP_WAITING = reliable takeover).
  - [ ] **(reuse)** The existing flow is reused UNCHANGED (markers stay): registerServiceWorker updatefound wiring, showBanner + SKIP_WAITING post, controllerchange->reload, the sw.js SKIP_WAITING handler; checkForUpdate re-scoped to be callable periodically (impl-edit); ignoreSearchNav/flushAndReload untouched.
  - [ ] **(ux)** Primary UX = the existing one-tap banner ('New version - reload') — no surprise reload mid-edit. (Auto-reload-on-idle is a flagged nice-to-have follow-up, NOT in this scope.)
  - [ ] **(verify)** Tron deploy-visibility re-check: after a deploy, the banner appears within the poll interval WITHOUT a hard-refresh; DET-3x on the poll/claim behavior.
  -> swUpdate.pollForUpdate [uc:uuid:ba7b15ab-c785-4c94-a8fe-936016b0023c]
  -> swUpdate.claimClients [uc:uuid:decc53f9-13b9-4785-bddf-b1f001bb2b9c]

- [ ] **R30.15 — Right-history default is meaningful + user-pick wins**
  [requirement:uuid:c2472818-0d33-4d4d-9f34-a858c03bb346]
  > Tron/PO 2026-07-14 (expert confirmed 2 real bugs, big contributor to Tron seeing no changes): (a) Open-Diff right side should default to a version that DIFFERS from left so you see a real diff, not 0; (b) my ref pick must not get overwritten by the auto-load of the newest version.
  Fix two real bugs in the right-side git-history default (R30.10 populateRightHistory) so Open-Diff shows a meaningful diff and respects the user: (a) MEANINGFUL-DEFAULT - RIGHT defaults to the newest committed version that DIFFERS from LEFT (HEAD~1 when the clean working file already equals the newest commit, HEAD when there are uncommitted changes), so the diff is non-empty instead of comparing a file to itself (0 changes); (b) PICK-WINS - the async newest-autoload must not overwrite a user ref/file pick made while it was in flight (sequence-token/flag so the user pick wins). Impl-edits the existing populateRightHistory.
  **Acceptance criteria:**
  - [ ] **(default)** On Open-Diff for a git-tracked file, RIGHT defaults to the newest committed version that DIFFERS from LEFT: HEAD~1 when the clean working file already equals the newest commit, HEAD when there are uncommitted changes - so the diff is non-empty (not a file compared to itself = 0 changes).
  - [ ] **(race)** The async newest-autoload must NOT overwrite a user ref/file pick made while it is in flight: guard with a sequence-token/flag so a later user pick wins over the in-flight autoload.
  - [ ] **(verify)** Open-Diff on a clean git file shows working-vs-HEAD~1 (non-empty diff); a user ref-pick during autoload is preserved; DET-3x.
  -> diffEditor.meaningfulRightDefault [uc:uuid:2fff4ee3-f84d-491e-9043-6f63bf3a8c69]

- [ ] **R30.16 — IntelliJ 3-pane: line alignment + center change blocks + scroll-to-last-line**
  [requirement:uuid:6d6fa7c8-8637-4c10-9366-b1d8536d7c9f]
  > Tron R30.13 feedback #2+#3 2026-07-14: the panes are numbered independently so you cannot trace a change across panes (should line up like IntelliJ); and synced scroll will not bring a file's last line to the top.
  Align the 3 merge panes so each change's region lines up horizontally Local<->Center<->Right (IntelliJ), and fix scroll-to-last-line. alignPaneRows walks centerSeq and inserts Monaco viewZone blank-row spacers at each conflict (spacer = maxH - hPane after each pane's block, maxH = max(local.len, picked.len, remote.len)) so every pane reaches the next equal-run at the same visual row; real line numbers stay the file's own; recompute on rebuildCenter + mount. Because all 3 panes then have equal total height, the syncScroll3 length-mismatch clamp-drag is gone (synced scroll reaches each file's full extent); combined with flipping scrollBeyondLastLine to true on all 3 editors, the last line can scroll to the TOP. Ribbons (R30.13) then connect aligned rows (near-horizontal, legible).
  **Acceptance criteria:**
  - [ ] **(align)** alignPaneRows inserts Monaco viewZone blank-row spacers at each conflict (spacer = maxH - hPane after each pane's block, maxH = max(local.len, picked.len, remote.len)) so each change region lines up horizontally Local<->Center<->Right; real line numbers stay the file's own; recompute on rebuildCenter + mount.
  - [ ] **(align)** alignPaneRows runs BEFORE renderConnectorRibbons so the ribbons connect aligned rows (near-horizontal, legible); renderConnectorRibbons endpoint math is unchanged (getTopForLineNumber returns the post-align Y).
  - [ ] **(blocks)** renderCenterChangeBlocks renders Monaco range decorations on the CENTER over each hunk span as colored rounded-block backgrounds by hunk type (blue one-side / green resolvable / brown conflict), replacing the flat maroon de-conflict-line; uses the shared conflictColor()/CONFLICT_PALETTE (same helper as renderConnectorRibbons), and supersedes renderMergeGutter center flat deco (impl-edit, marker stays).
  - [ ] **(scroll)** Post-alignment all 3 panes have EQUAL total height, so the syncScroll3 length-mismatch clamp-drag is gone and synced scroll reaches each file's full extent (no wrong stop from a shorter pane clamping).
  - [ ] **(scroll)** scrollBeyondLastLine is set to TRUE on all 3 editors (companion impl-edit to mountThreePane c4c84142, currently false @ rb-diff-editor.ts:114) so the LAST line can scroll to the TOP.
  - [ ] **(modes)** Alignment + scroll fixes work in BOTH 2-way (R30.12) and 3-way (R30.9) — both populate centerSeq/conflicts.
  - [ ] **(verify)** Tron visual: change rows line up Local<->Center<->Right + ribbons connect aligned rows + last line scrolls to the top + synced scroll reaches full extent; DET-3x on alignPaneRows.
  -> diffEditor.paneLineAlignment [uc:uuid:0faad449-02fd-46f0-abb5-b731826b7ac8]
  -> diffEditor.centerChangeBlocks [uc:uuid:8d778c4f-2ef7-4dac-9c98-40b90e281c26]

- [ ] **R30.17 — R30.16 merge functional correctness (accept-mutates / one-sided ribbons / Y-align / left-history)**
  [requirement:uuid:5aa71554-03ee-410f-b0d4-d00e9a7f2efa]
  > Tron 2026-07-14 (diligent review): R30.16 merge visuals shipped but it is FUNCTIONALLY broken - the accept arrows do nothing, ribbons draw from empty sides, rows are off by one, and the history selector is on the wrong side. The gate verified appearance, not function.
  Make the R30.16 3-pane merge FUNCTIONALLY correct (it shipped visually but the merge did not mutate). Five root-caused bugs: #4 accept/cancel arrows had ZERO effect - the per-strip click listener was attached once inside if(!s) and orphaned by the R30.16 re-render; fix = delegate click from the stable component ROOT once in mountThreePane, drop the per-strip listener. #1+#3 both-sided/ghost ribbons - renderConnectorRibbons drew both bands unconditionally; fix = draw Local->Result iff a.length>0 and Result->Repo iff b.length>0 (origin from a/b), gate the take-arrows the same. #2 off-by-one row/ribbon Y - alignPaneRows mixed 0-indexed block arithmetic with Monaco 1-indexed afterLineNumber (len-0 blocks shift by one); fix = pin anchors + handle len===0, with a MANDATORY lineY(remote,bStart)==lineY(center,span[0]) test. #5 history selector on the RIGHT - move it to the LEFT (old-on-left / new-on-right convention) via populateLeftHistory. Tester gate must assert FUNCTION (click mutates CENTER), not appearance (button renders) - the exact R30.16-gate miss.
  **Acceptance criteria:**
  - [ ] **(click)** #4: accept take-arrows WORK - a single delegated click listener on the stable component ROOT (attached once in mountThreePane) routes [data-cid] clicks to acceptChange(id,side)/dismiss; renderInterPaneGutters drops its per-strip addEventListener (only sets innerHTML). Clicking take-Local/take-Repo MUTATES the CENTER Result text content (not just renders a button).
  - [ ] **(ribbons)** #1: renderConnectorRibbons draws the Local->Result band ONLY iff c.a.length>0 and the Result->Repository band ONLY iff c.b.length>0 - a one-sided change no longer draws both bands.
  - [ ] **(ribbons)** #3: no ghost ribbon from an empty side (origin taken from a/b length); the gutter take-arrows are gated the same (take-Local shown iff a.length, take-Repo iff b.length).
  - [ ] **(align)** #2: alignPaneRows afterLineNumber uses a consistent index base (handles len===0 blocks, spacer BEFORE the gap); anchors pinned to the hunk first-changed line. MANDATORY: post-alignment lineY(edRemote, c.bStart) === lineY(edCenter, c.span[0]) (and Local) - source row and its center landing share Y (+-0).
  - [ ] **(history)** #5: the .de-history <select> renders on the LEFT pane (s==='local'); populateLeftHistory populates the LEFT with the file's git history (old-on-left), RIGHT = working/current; pane labels read old(left)/new(right); swapSides + acceptChange left/right semantics preserved.
  - [ ] **(gate)** ★ Tester DET-3x asserts FUNCTION not appearance (the R30.16 miss): (a) click take-arrow -> CENTER editor value CONTENT changes; (b) click ignore -> that change's arrows/ribbon disappear + CENTER unchanged; (c) one-sided hunk -> ribbon from ONE side only (no ghost); (d) lineY(remote,bStart)===lineY(center,span[0]); (e) history <select> on LEFT.
  -> diffEditor.leftHistoryDefault [uc:uuid:e322c683-0c92-406e-abb4-322390b1a973]

- [ ] **R30.18 — requirements.md is a generated view (extend generate-sprint-md)**
  [requirement:uuid:34ed73fd-7756-4479-ad2c-65674bb13fc9]
  > Tron 2026-07-14 (caught it live): where are all the scenario-first plannings? R30.6-R30.17 were minted as units but invisible in requirements.md. PO durable fix: auto-generate requirements.md from the scenario units (law#100 VIEW) so it is never stale + no hand-maintenance.
  requirements.md becomes a GENERATED VIEW (law #100), emitted by generate-sprint-md from the scenario Requirement units - like planning.md + the task-MDs - so it can NEVER go stale and needs NO hand-maintenance. SprintViewGenerator.generateRequirementsMd renders each sprint's requirements.md from its Requirement units (altId/name/uuid/tronQuote/description/acceptanceCriteria/UC links + the traceability matrix), with the GENERATED-FROM-SCENARIO-UNITS header + a --check byte-match round-trip. Fixes the root cause of the invisible-plannings bug (R30.6-R30.17 were minted as units but the hand-maintained requirements.md never updated); ONE --all regen brings every sprint (S21-S28) in sync, and the regen+git-diff IS the staleness audit.
  **Acceptance criteria:**
  - [ ] **(generate)** generate-sprint-md emits requirements.md per sprint from the scenario Requirement units (altId / name / uuid / tronQuote / description / acceptanceCriteria / UC links + traceability matrix), the same way it emits planning.md.
  - [ ] **(view)** The generated requirements.md carries the GENERATED-FROM-SCENARIO-UNITS header (law #100); the hand-maintained WARN is removed - no hand-maintenance.
  - [ ] **(ci)** --check (checkRoundTrip) byte-match round-trip covers requirements.md; regen -> --check is green; CI gates drift.
  - [ ] **(audit)** ONE `--all` regen brings every sprint's requirements.md in sync (fixes S21-S28 staleness at once); regen + git diff IS the staleness audit - no per-sprint manual audit.
  - [ ] **(by-construction)** A newly-minted Requirement unit appears in requirements.md on the next regen automatically - a req unit on disk can NEVER again be invisible in the doc humans read (fixes the R30.6-R30.17 invisible-plannings class).
  - [ ] **(verify)** After the change: regen S30 -> requirements.md is byte-generated from the 23 units (matches/supersedes the hand-written e190db49f); --check green across all sprints.
  -> sprintMd.generateRequirementsMd [uc:uuid:c9fe8823-16fd-4599-b99f-2a2568caba2e]

- [ ] **R30.19 — 3-pane change-block highlights (source panes too, not just center)**
  [requirement:uuid:d74360d2-41ca-4d6d-9015-0194629b40eb]
  > TRON 2026-07-14 (screenshot IMG_4518): the colored change-block highlights only show in the CENTER pane; the LEFT + RIGHT source panes show the changed lines with no block highlight. IntelliJ highlights the changed block in ALL 3 panes (matching color) so you see which source block merges into center.
  Highlight the changed block in ALL THREE panes, not just CENTER. Today renderCenterChangeBlocks draws the colored rounded-block background only on the CENTER Result pane; the LEFT (Local) + RIGHT (Repository) SOURCE panes show the changed lines with just gutter arrows, no block highlight. IntelliJ highlights the changed block in all 3 panes in a MATCHING color so you SEE which source block merges into center and the ribbon visibly connects highlighted-source -> highlighted-center. Fix: extend renderCenterChangeBlocks to ALSO render change-blocks on the LEFT (a-lines) + RIGHT (b-lines) source panes, using the SAME center CONFLICT_PALETTE color (shared color = blocks + ribbons match by construction, like R30.16). Impl-edit to the existing renderCenterChangeBlocks (marker stays); one-sided changes highlight only the side(s) that changed.
  **Acceptance criteria:**
  - [ ] **(render)** renderCenterChangeBlocks ALSO renders colored rounded change-blocks on the LEFT (Local, a-lines) + RIGHT (Repository, b-lines) source panes - not only the CENTER Result pane.
  - [ ] **(color)** The source-pane block color MATCHES the center block + the connector ribbon for that hunk (shared CONFLICT_PALETTE / conflictColor) - blocks and ribbons match by construction (like R30.16).
  - [ ] **(sides)** A left-only change (c.a.length>0, c.b.length===0) highlights a block in Local + Center, NOT Repository.
  - [ ] **(sides)** A right-only change (c.b.length>0, c.a.length===0) highlights a block in Repository + Center, NOT Local.
  - [ ] **(sides)** A both-sided change highlights a matching-color block in ALL 3 panes; the ribbon visibly connects the highlighted source block(s) to the highlighted center block.
  - [ ] **(verify)** Tron visual (IMG_4518 case): the changed source block is highlighted in its pane(s) in the same color as the center block + ribbon; DET-3x asserts the source-pane decorations exist per side.
  -> diffEditor.sourcePaneChangeBlocks [uc:uuid:f86392d5-1b74-4201-b163-f89e0ae8a1ec]

- [ ] **R30.20 — Detail-drawer mode-aware close (in-room X->chat, trace X->minimize)**
  [requirement:uuid:ecb4e62a-3367-4c4e-9e51-4d4fe358735a]
  > TRON 2026-07-15: the in-room drawer X should return to the chat view, but the R27.8 universal-minimize made X minimize everywhere - it broke in-room X->chat.
  The detail-drawer X button is MODE-AWARE (fix the R27.8 universal-minimize regression that broke in-room X). Today rb-detail-drawer.ts:217 wires .drawer-close -> this.minimize() UNIVERSALLY (R27.8), which broke the in-room flow where X should RETURN to the chat view. Detection (measured, already the signal @ line 86): this.chatPanel!==null means IN-ROOM (ChatPanel is created ONLY via RoomView drawer.chat; the trace-view never creates it). FIX (new RbDetailDrawer.closeOrReturn): .drawer-close click -> if (this.chatPanel && this._mode==='detail') this.setMode('chat'); else this.minimize(). So in-room detail X returns to chat (regression fixed), trace-view X still minimizes (R27.8 kept, mobile+desktop), in-room chat X minimizes, ESC still closes.
  **Acceptance criteria:**
  - [ ] **(case1)** CASE 1 - trace-view (this.chatPanel===null) + detail mode: .drawer-close MINIMIZES the drawer (R27.8 behavior kept, both mobile AND desktop).
  - [ ] **(case2)** CASE 2 (REGRESSION FIXED) - in-room (this.chatPanel!==null) + detail mode: .drawer-close calls setMode('chat') -> the X RETURNS to the chat view instead of minimizing.
  - [ ] **(case3)** CASE 3 - in-room + chat mode: .drawer-close MINIMIZES (already in chat, so X minimizes).
  - [ ] **(case4)** CASE 4 - ESC closes the drawer (unchanged).
  - [ ] **(detection)** The in-room-vs-trace signal is this.chatPanel!==null (ChatPanel is created ONLY via RoomView drawer.chat; the trace-view never creates it - the existing signal @ rb-detail-drawer.ts:86). No new state flag.
  - [ ] **(verify)** Tron visual + DET-3x all cases: in-room detail X -> chat; trace-view X -> minimize (mobile+desktop); in-room chat X -> minimize; ESC -> close. Built WITH a version-bump.
  -> detailDrawer.modeAwareClose [uc:uuid:856a8929-05bf-4070-93f1-132cd745b2b6]

- [ ] **R30.21 - Drawer non-sprint detail render (graph-independent /api/ior fetch-fallback)**
  [requirement:uuid:6af715df-826f-4a91-962d-e6c0e388f9f7]
  > TRON 2026-07-15: selecting a task / class / impl in the drawer shows NO content (empty). (Sprint detail renders; the type-specific detail elements render empty when there is no graph.)
  The type-specific detail renderers (task/requirement/class/method/implementation/usecase/test/file/webitem) render CONTENT even when the drawer has no graph (scenario-view) or the unit is not in the graph (chain-only impl/test). BUG: they resolve via this.graph.get(uuid) -> 'not found' -> empty (~125 chars) when graph is null OR the unit is not in the graph; only renderSprintDetail + rb-detail-view fetch /api/ior. FIX: a graph-independent unit resolver (resolveDetailUnit) that uses this.graph.get(uuid) when present ELSE fetches /api/ior (mirroring renderSprintDetail), used by every type-specific render - so task/class/impl detail renders content in scenario-view AND trace-page AND for chain-only units. Sprint render unchanged. Client-facing -> version-bump.
  **Acceptance criteria:**
  - [ ] **(fetch)** A graph-independent unit resolver (RbDetailDrawer.resolveDetailUnit) uses this.graph.get(uuid) when available ELSE fetches /api/ior (mirroring renderSprintDetail) - so a detail renders whether the graph is set (trace-page) or null (scenario-view).
  - [ ] **(types)** ALL type-specific detail renders resolve through it: task / requirement / class / method / implementation / usecase / test / file / webitem - each renders CONTENT (not the ~125-char empty) in scenario-view AND trace-page.
  - [ ] **(chain)** Chain-only units NOT in the graph (e.g. impl 7f15c149, real task 5665a0dd) render via the /api/ior fetch - no longer empty.
  - [ ] **(regression)** renderSprintDetail (R30.3) still works unchanged; the sprint detail (~5135 chars) is not affected.
  - [ ] **(gate)** The R30.20-drawer case-5 (SELECT node -> content) flips GREEN: selecting a task/class/impl node in scenario-view renders its detail content (was the RED baseline).
  - [ ] **(verify)** Tron visual + DET-3x: select task/class/impl in scenario-view (no graph) -> content renders; trace-page still renders; sprint unchanged. Client-facing -> shipped WITH a version-bump.
  -> [detailDrawer.graphIndependentDetail uc:uuid:ab7595ea-0b2b-4a7f-9570-f6124b125272] -> RbDetailDrawer.resolveDetailUnit (NEW)

- [ ] **R30.22 - Drawer select opens content-visible (not peek-clipped)**
  [requirement:uuid:e9432c13-0898-4a04-82cd-7c45f573ede4]
  > TRON 2026-07-15: selecting a node opens the drawer clipped to peek - the detail content is there but hidden below the fold; I should not have to drag the grab-bar to see it.
  On selecting a node with detail content, the drawer opens EXPANDED (body visible, content-height) so the content is VISIBLE immediately - not the R27.8(B) minimized-peek (drawerH=40px + .drawer-body display:none) that hides the rendered content (8633 chars in DOM) below the fold until a grab-bar expand. X still minimizes to peek (R27.8/R30.20), the grab-bar toggle still works, ESC still closes. Impl-edit to selectionDriven (the select->open path); supersedes R27.8(B) closed->peek for content-select.
  **Acceptance criteria:**
  - [ ] **(open)** Selecting a node with detail content opens the drawer EXPANDED (body display:flex, content-height) so the content is VISIBLE immediately - no grab-bar click needed (was drawerH=40px peek + body display:none = hidden).
  - [ ] **(close)** X still minimizes to peek (R27.8 minimize / R30.20 closeOrReturn) - the X-behavior is unchanged.
  - [ ] **(toggle)** The grab-bar toggle still expands/collapses the drawer (unchanged).
  - [ ] **(close)** ESC still closes the drawer (unchanged).
  - [ ] **(supersede)** Supersedes R27.8(B): the closed->open+peek behavior for a content-select becomes open->expanded; R27.8 X=minimize (via R30.20) is preserved.
  - [ ] **(verify)** Tron visual + DET-3x: select task/class/impl -> content visible immediately (no grab-bar, body display:flex, content-height); X->peek; grab-bar toggles; ESC closes. Client-facing -> version-bump.
  -> [detailDrawer.selectOpensContentVisible uc:uuid:4c794d6c-32a6-4cae-9a65-cbe2e8e4e368] -> RbDetailDrawer.selectionDriven (impl-edit, marker stays)

- [ ] **R30.23 - Diff completeness: 3-way one-sided changes surfaced (no one-sided visibility)**
  [requirement:uuid:940a92d8-9254-44dc-99aa-ad6f8b1d2e1c]
  > TRON (IMG_4522): the diff shows 'merged, 0 conflicts' but the changes are only visible on one side / not shown as blocks - I want to SEE every change (local + repo) completely, origin-correct.
  For each diff3 ok-region, computeMergedCenter compares its content to the corresponding BASE slice: if DIFFERENT (a one-sided change diff3 auto-applied), it emits a Conflict{kind:'change', pick:<changed side>, span} into conflicts[]/centerSeq instead of a stable ok-run; if SAME, it keeps the ok-run. The auto-pick keeps the MERGE RESULT byte-identical (the change stays applied) - this ONLY adds visibility: each one-sided change now gets a change block + connector ribbon + take-over arrow on its origin side. Fixes the IMG_4522 one-sided-visibility gap where a 'merged, 0 conflicts' file rendered ZERO change blocks. Origin-exact: local-only -> Local block, repo-only -> Repository block, both-sides -> true conflict (not double-counted). Bounded impl-edit; no new Class/Method.
  **Acceptance criteria:**
  - [ ] **(origin-local)** A local-only change (diff3 ok-region whose content differs from its BASE slice) is emitted as Conflict{kind:'change', pick:'local'} into conflicts[]/centerSeq -> renders as a change block on the LOCAL (left) side, not swallowed as a stable ok-run.
  - [ ] **(origin-repo)** A repo-only change is emitted as Conflict{kind:'change', pick:'repo'} -> renders as a change block on the REPOSITORY (right) side.
  - [ ] **(both-conflict)** A both-sides divergence stays a true conflict (kind:'conflict'), NOT double-counted as a repo change.
  - [ ] **(result-unchanged)** Auto-pick keeps the MERGE RESULT byte-identical (the change stays applied) - this ADDS visibility + a take-over arrow only; a truly-stable ok-region (content == BASE) remains an ok-run.
  - [ ] **(downstream-free)** Downstream renderCenterChangeBlocks + R30.19 renderSideChangeBlocks + renderConnectorRibbons + jumpToChange iterate the SAME conflicts[] -> each surfaced change gets block + ribbon + arrow with NO new rendering code (impl-edit to computeMergedCenter only, marker a0b30550 stays).
  - [ ] **(verify)** IMG_4522 repro + DET-3x: a 'merged, 0 true-conflicts' file still shows every one-sided change as a block/ribbon/arrow (no ZERO-blocks / one-sided-visibility); merge output byte-identical. Client-facing -> version-bump.
  -> [diffEditor.threeWayChangeCoverage uc:uuid:18604655-55c6-4b4c-953a-8b18659a3f89] -> RbDiffEditor.computeMergedCenter (impl-edit, marker a0b30550-71c8-4497-9eaf-f73551f7bb0f stays)

- [ ] **R30.24 - 3-way diff is URL-addressable (deep-linkable + shareable)**
  [requirement:uuid:9a2c9c46-4def-4273-b896-60ad17b79a6a]
  > TRON: i need links for IMG_4522 verification - a clickable link like /edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1 that opens the exact 3-way diff; and the diff should generate a shareable link (copy-link button).
  The 3-way diff/merge editor is URL-addressable: its state (repo key, file path, left ref, right ref, optional 3way flag) lives in the URL so a diff can be OPENED/RESTORED from a link (e.g. /edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1), and the diff exposes a copy-link / share affordance that generates that URL from the current state. edit.ts reads the diff params on load and initializes rb-diff-editor to the exact diff; the repo param is a KEY resolved via R30.6.7 RepoRegistry (no client path abuse). Today the diff has NO URL (state lives only in the selectors) — so IMG_4522-style verification cannot be linked; this makes it a shareable, restorable link. Client-facing -> version-bump.
  **Acceptance criteria:**
  - [ ] **(deep-link)** Loading /edit/<path>?repo=<key>&left=<ref>&right=<ref>&3way=1 opens rb-diff-editor to that EXACT diff (repo + path + left + right + 3way), restoring the state — edit.ts reads the params on load and initializes the diff.
  - [ ] **(deep-link)** The URL carries repo (KEY, resolved via R30.6.7 RepoRegistry allowlist), path, left ref, right ref, and an optional 3way flag; no client-supplied absolute path is honored.
  - [ ] **(share)** A copy-link / share affordance on the diff generates the shareable URL from the CURRENT diff state (repo+path+left+right+3way) and copies it to the clipboard.
  - [ ] **(share)** Open->share->open round-trips: the generated link, when opened, restores the identical diff view.
  - [ ] **(security)** The ?repo= param is a KEY resolved server-side (R30.6.7); an unknown/absent key falls back to the diff's existing repo-targeting default (rawbin), no path abuse.
  - [ ] **(verify)** IMG_4522 becomes a clickable link (e.g. /edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1) that opens the exact diff; DET-3x + Tron visual; client-facing -> version-bump.
  -> [diffEditor.openFromUrl uc:uuid:cc47d004-47a6-4ac9-b18d-fe95f3b69b25] -> RbDiffEditor.openFromParams (new) | [diffEditor.shareLink uc:uuid:8e88026a-f2bc-4a7a-bd4b-c3077a5b13ad] -> RbDiffEditor.buildShareLink (new) | crossRef R30.6.6 + R30.6.7; architect derive-confirm names/schema

---

## Traceability Matrix
