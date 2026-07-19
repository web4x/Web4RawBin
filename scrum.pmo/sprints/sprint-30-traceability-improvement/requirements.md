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
  - [ ] **(invariant)** INVARIANT (Tron: clean releases, NO hard reloads): a version bump MUST auto-propagate to EVERY running client; a manual HARD-RELOAD must NEVER be required to receive the new version. A running client that only updates after a manual hard-reload is a HARD FAIL.
  - [ ] **(network)** ROOT-CAUSE FIX (architect-measured): the SW fetch handler serves the app SHELL (index.html) + bundles NETWORK-FIRST - fetch fresh, fall back to cache ONLY when offline. The prior CACHE-FIRST shell served a STALE shell+bundle until a manual hard-reload and DEFEATED pollForWorkerUpdate + claimClients (they swapped the SW, but the cache-first shell kept serving the old bundle). Network-first is the missing piece that makes a deploy actually reach the running client.
  - [ ] **(poll)** CONTINUOUS version poll: ServiceWorker.pollForWorkerUpdate periodically (setInterval ~60s + on visibilitychange/focus) reg.update() + /api/config version compare - detects a deploy without a navigation/hard-refresh.
  - [ ] **(banner)** One-click 'New version - reload' banner is the auto-pickup UX (no surprise auto-reload mid-edit, never nuke unsaved merge state); ServiceWorker.claimClients (skipWaiting + clients.claim in the sw.js activate) gives reliable takeover so the pending version applies on the one tap.
  - [ ] **(atomic)** ATOMIC deploy: sw.js + shell + bundles + the /api/config version flip land TOGETHER (R30.28, served==committed==HEAD) so a running client never fetches a MISMATCHED shell / bundle / version during the swap.
  - [ ] **(gate)** GATE (verified on a REAL long-open running client, NOT a fresh navigation): deploy a new version -> the left-open client picks it up within <=60s with NO manual hard-reload (network-first shell serves the fresh bundle + poll detects + one-click banner) and then reports the new version. Confirm across a deploy; version-confirm/screenshot, NEVER DOM/element-count.
  -> swUpdate.pollForUpdate [uc:uuid:ba7b15ab-c785-4c94-a8fe-936016b0023c]
  -> swUpdate.claimClients [uc:uuid:decc53f9-13b9-4785-bddf-b1f001bb2b9c]
  -> serviceWorker.networkFirstShell [uc:uuid:a5dd44bc-e7c6-4db1-8bc4-04478bd9d3ef]

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

- [ ] **R30.21 — Drawer non-sprint detail render (graph-independent /api/ior fetch-fallback)**
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
  -> detailDrawer.graphIndependentDetail [uc:uuid:ab7595ea-0b2b-4a7f-9570-f6124b125272]

- [ ] **R30.22 — Drawer select opens content-visible (not peek-clipped)**
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
  -> detailDrawer.selectOpensContentVisible [uc:uuid:4c794d6c-32a6-4cae-9a65-cbe2e8e4e368]

- [ ] **R30.23 — Diff completeness: 3-way one-sided changes surfaced (no one-sided visibility)**
  [requirement:uuid:940a92d8-9254-44dc-99aa-ad6f8b1d2e1c]
  > TRON 2026-07 (IMG_4522): the diff shows 'merged, 0 conflicts' but the changes are only visible on one side / not shown as blocks — I want to SEE every change (local + repo) completely, origin-correct.
  For each diff3 ok-region, computeMergedCenter compares its content to the corresponding BASE slice: if DIFFERENT (a one-sided change diff3 auto-applied), it emits a Conflict{kind:'change', pick:<changed side>, span} into conflicts[]/centerSeq instead of a stable ok-run; if SAME, it keeps the ok-run. The auto-pick keeps the MERGE RESULT byte-identical (the change stays applied) - this ONLY adds visibility: each one-sided change now gets a change block + connector ribbon + take-over arrow on its origin side. Fixes the IMG_4522 one-sided-visibility gap where a 'merged, 0 conflicts' file rendered ZERO change blocks. Origin-exact: local-only -> Local block, repo-only -> Repository block, both-sides -> true conflict (not double-counted). Bounded impl-edit; no new Class/Method.
  **Acceptance criteria:**
  - [ ] **(origin)** A local-only change (diff3 ok-region whose content differs from its BASE slice) is emitted as Conflict{kind:'change', pick:'local'} into conflicts[]/centerSeq -> renders as a change block on the LOCAL (left) side, not swallowed as a stable ok-run.
  - [ ] **(origin)** A repo-only change is emitted as Conflict{kind:'change', pick:'repo'} -> renders as a change block on the REPOSITORY (right) side.
  - [ ] **(both)** A both-sides divergence stays a true conflict (kind:'conflict'), NOT double-counted as a repo change.
  - [ ] **(result)** Auto-pick keeps the MERGE RESULT byte-identical (the change stays applied) - this ADDS visibility + a take-over arrow only; a truly-stable ok-region (content == BASE) remains an ok-run.
  - [ ] **(downstream)** Downstream renderCenterChangeBlocks + R30.19 renderSideChangeBlocks + renderConnectorRibbons + jumpToChange iterate the SAME conflicts[] -> each surfaced change gets block + ribbon + arrow with NO new rendering code (impl-edit to computeMergedCenter only, marker a0b30550 stays).
  - [ ] **(verify)** IMG_4522 repro + DET-3x: a 'merged, 0 true-conflicts' file still shows every one-sided change as a block/ribbon/arrow (no ZERO-blocks / one-sided-visibility); merge output byte-identical. Client-facing -> version-bump.
  -> diffEditor.threeWayChangeCoverage [uc:uuid:18604655-55c6-4b4c-953a-8b18659a3f89]

- [ ] **R30.24 — 3-way diff is URL-addressable (deep-linkable + shareable)**
  [requirement:uuid:9a2c9c46-4def-4273-b896-60ad17b79a6a]
  > TRON 2026-07-16: i need links for IMG_4522 verification — a clickable link like /edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1 that opens the exact 3-way diff; and the diff should generate a shareable link (copy-link button). Today the diff has no URL (state via selectors).
  The 3-way diff/merge editor is URL-addressable: its state (repo key, file path, left ref, right ref, optional 3way flag) lives in the URL so a diff can be OPENED/RESTORED from a link (e.g. /edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1), and the diff exposes a copy-link / share affordance that generates that URL from the current state. edit.ts reads the diff params on load and initializes rb-diff-editor to the exact diff; the repo param is a KEY resolved via R30.6.7 RepoRegistry (no client path abuse). Today the diff has NO URL (state lives only in the selectors) — so IMG_4522-style verification cannot be linked; this makes it a shareable, restorable link. Client-facing -> version-bump.
  **Acceptance criteria:**
  - [ ] **(deep-link)** Loading /edit/<path>?repo=<key>&left=<ref>&right=<ref>&3way=1 opens rb-diff-editor to that EXACT diff (repo + path + left + right + 3way), restoring the state — edit.ts reads the params on load and initializes the diff.
  - [ ] **(deep-link)** The URL carries repo (KEY, resolved via R30.6.7 RepoRegistry allowlist), path, left ref, right ref, and an optional 3way flag; no client-supplied absolute path is honored.
  - [ ] **(share)** A copy-link / share affordance on the diff generates the shareable URL from the CURRENT diff state (repo+path+left+right+3way) and copies it to the clipboard.
  - [ ] **(share)** Open->share->open round-trips: the generated link, when opened, restores the identical diff view.
  - [ ] **(security)** The ?repo= param is a KEY resolved server-side (R30.6.7); an unknown/absent key falls back to the diff's existing repo-targeting default (rawbin), no path abuse.
  - [ ] **(verify)** IMG_4522 becomes a clickable link (e.g. /edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1) that opens the exact diff; DET-3x + Tron visual; client-facing -> version-bump.
  -> diffEditor.openFromUrl [uc:uuid:cc47d004-47a6-4ac9-b18d-fe95f3b69b25]
  -> diffEditor.shareLink [uc:uuid:8e88026a-f2bc-4a7a-bd4b-c3077a5b13ad]

- [ ] **R30.25 — Picking a RIGHT ref preserves the LEFT side (no blanking)**
  [requirement:uuid:a604a1b5-9d7b-4b31-a465-d684dfc256c2]
  > TRON 2026-07-16 (live bug): in the 3-way diff editor, selecting a branch on the RIGHT (Repository) editor makes the LEFT (Local) editor go EMPTY.
  Selecting a branch/ref on the RIGHT (Repository) editor must NOT blank the LEFT (Local) editor. Root cause (architect-measured): an asymmetric race - the R30.17 left-history auto-promote (populateLeftHistory) fires fire-and-forget, has no _rightUserPicked guard, and reads live this.right.content mid-flight; when a RIGHT ref-pick lands while the promote is in flight, the promote re-derives from the mutated this.right and reloads LEFT, racing the pick's computeMergedCenter on the shared this.left/this.right so LEFT ends blank. Fix (impl-edits, markers STAY, no new Method): (1) a symmetric _rightUserPicked guard set in setSideRef('right') so a user-driven RIGHT wins over the auto-promote (mirrors _leftUserPicked); (2) serialize the promote (await + a generation token; a stale promote's left-reload tail aborts on token mismatch); (3) snapshot this.left.content before the awaits and use it for defaultIdx instead of the live this.right.content.
  **Acceptance criteria:**
  - [ ] **(fires)** Open a working file (promote -> older-on-left), then pick a branch on the RIGHT: LEFT still renders its content, RIGHT = file@branch, center recomputes - LEFT NEVER blanks. Includes the RACE WINDOW (pick RIGHT immediately after open, promote still in flight).
  - [ ] **(fix)** A symmetric _rightUserPicked guard (set in setSideRef('right')/the right ref path) makes a user-driven RIGHT WIN over the auto-promote: populateLeftHistory does NOT replace this.right and does NOT run its default left-reload when _rightUserPicked (mirrors _leftUserPicked).
  - [ ] **(fix)** The promote is serialized (await populateLeftHistory + a generation token); a stale promote's left-reload tail aborts on token mismatch so it can never reload LEFT over a fresh user pick. defaultIdx is computed from a snapshot of this.left.content taken BEFORE the awaits, not the live this.right.content.
  - [ ] **(no-regression)** TRON4 preserved: a working-file left load with NO right interaction still auto-promotes (older-on-left) as before.
  - [ ] **(no-regression)** R30.17 left PICK-WINS (_leftUserPicked) + R30.24 _deepLink promote-suppression both still hold; buildShareLink/openFromParams (R30.24) still round-trip after the right-pick.
  - [ ] **(verify)** DET-3x + instrumentation trace (addLog at promote entry/exit, loadSide(side,ref), setSideRef(side)): on the repro the event order shows NO post-pick left-reload. Client fix (pure client, no restart) -> version-bump; Tron visual verify.
  -> diffEditor.rightPickPreservesLeft [uc:uuid:1bcee6db-1f2c-4b14-9f84-e7fc4085db7f]

- [ ] **R30.27 — 3-pane rows align - corresponding lines share one visual row (Local/Center/Repository)**
  [requirement:uuid:674bae73-43ae-403a-9feb-ce8784ab1f20]
  > TRON 2026-07-17 (4 screenshots): identical/corresponding lines must sit on the SAME visual row across all 3 panes (line 1 == line 1 == line 1); right now the rows look random.
  Corresponding lines sit on the SAME VISUAL ROW across all 3 panes (line 1 == line 1 == line 1 on Local/Center/Repository). R30.23 REGRESSION: computeOneSidedHunks hardcoded the NON-changed side's start to 0 (StableRegion only carries bufferStart for the changed buffer), so alignPaneRows dumped a one-sided change's opposite-pane spacer rows at line 0 (top) instead of the aligned change position - cumulative drift = 'random' rows (a pure-conflict diff aligned fine; real diffs are mostly one-sided). FIX (impl-edit to computeMergedCenter/computeOneSidedHunks, marker a0b30550 STAYS): thread running per-buffer line counters la/lb through the region loop and pass the aligned opposite offset into computeOneSidedHunks (aStart:la, bStart:lb; drop the 0 fallbacks); advance la/lb on ok-runs and the conflict path too. alignPaneRows / render* / ribbons unchanged - they read correct starts so spacers land at the aligned positions by construction.
  **Acceptance criteria:**
  - [ ] **(aligned)** A 3-way diff with >=1 one-sided change: the top stable line sits on the SAME visual row in all 3 panes; every corresponding stable line thereafter shares a row across Local/Center/Repository.
  - [ ] **(aligned)** A LEFT (local-only) insertion of N lines shows N blank spacer rows in the REMOTE pane AT that position (not piled at the top); content below stays row-matched. Symmetric for repo-only.
  - [ ] **(no-regression)** Repo-only changes AND pure conflicts both still align - the conflict path's real aStart/bStart are untouched (regression guard).
  - [ ] **(result)** The merge RESULT is byte-identical - pick/kind semantics unchanged; this only moves where spacer rows are inserted.
  - [ ] **(fix)** Running per-buffer line counters la/lb are threaded through the region loop; computeOneSidedHunks(region, cid, la, lb) sets aStart:la / bStart:lb (the 0 fallbacks removed); ok-runs (la+=len, lb+=len) and the conflict path advance the counters. alignPaneRows / renderCenterChangeBlocks / renderSideChangeBlocks / ribbons unchanged.
  - [ ] **(verify)** Assertion-grade: for each stable line, getTopForLineNumber is equal (+/-0) across edLocal/edCenter/edRemote. DET-3x + Tron visual on the 4-screenshot repro. Client fix (no restart) -> version-bump.
  -> diffEditor.threePaneRowAlignment [uc:uuid:a01ee01d-e77e-4d37-99ea-bb3dbd7e423e]

- [ ] **R30.26 — Deep-link right-pick preserves the user's pick (no in-flight-load clobber)**
  [requirement:uuid:2fd1c9fb-b03c-438f-b760-115a1ddbefd3]
  > TRON (BUG-1): deep-link diff corrupts the RIGHT side / loses the user's ref pick when a load is in flight.
  When a diff is opened from a deep-link URL and the user then picks a RIGHT ref (or a right-load is in flight), the user's pick is PRESERVED - an in-flight deep-link/right load can no longer clobber it. Two guards (impl-edits, both markers STAY): (1) openFromParams guards against overwriting a user pick that lands while the deep-link load is in flight (R30.25.1); (2) loadSide carries a _rightLoadSeq sequence token so a stale in-flight load whose result arrives after a newer pick is DISCARDED - the newest load wins (R30.25.2). Retroactive #126 chain-completion: the fix shipped + is DET-3x gated on v0.7.39 (Test 7d3e1a52) but had no requirement unit - this mints it over the built impl-edits (markers dc236c19 openFromParams + c4da837c loadSide), no new units. Status DONE (already gated).
  **Acceptance criteria:**
  - [ ] **(preserved)** Open a diff from a deep-link URL, then pick a RIGHT ref: the user's pick is preserved (RIGHT = the picked ref), NOT clobbered by the in-flight deep-link/right load.
  - [ ] **(guard)** openFromParams guards against overwriting a user pick that lands while the deep-link load is still in flight (R30.25.1).
  - [ ] **(seq)** loadSide uses a _rightLoadSeq sequence token: a stale in-flight load whose result returns AFTER a newer pick is discarded - the newest load wins (R30.25.2).
  - [ ] **(no-regression)** R30.24 deep-link open/restore + share round-trip still work; R30.25 right-pick-preserves-left still holds.
  - [ ] **(impl-edit)** Impl-edits to EXISTING RbDiffEditor.openFromParams (Impl dc236c19) + RbDiffEditor.loadSide (Impl c4da837c) - markers STAY, no new Method/Class.
  - [ ] **(verify)** DET-3x GREEN on v0.7.39 (Test 7d3e1a52 R30.25.1/.2 deep-link change-RIGHT, status pass, on both Impls). Status DONE - retroactive #126 completion; planner backfills T30.26.
  -> diffEditor.deepLinkRightPickPreserved [uc:uuid:1cc5ed1c-726e-47a0-aba8-821c1d2e4829]

- [ ] **R30.28 — Deploy commits atomically - served == committed == HEAD (no phantom-version window)**
  [requirement:uuid:06ac71d5-5308-44ea-9720-ec5c01921915]
  > robbin-po/ScrumMaster 2026-07-17 (2nd phantom-version caught): the deploy serves BEFORE committing -> a phantom window each deploy (served != committed, ungateable). Fix by-construction: commit version-bump+dist before/with serving; served==committed==HEAD always; a guard fails if prod version != HEAD package.json.
  The deploy workflow commits ATOMICALLY: build.mjs/deploy commits the version-bump + built dist BEFORE (or with) serving the new bundle, so the invariant served == committed == HEAD holds at all times - eliminating the phantom-version window where the served bundle differs from any commit (ungateable: a user hits a version that does not exist in git). A guard fails the deploy/startup if the running prod version != HEAD package.json version, so a serve-before-commit cannot recur silently. By-construction: the commit-then-serve ordering + the guard are structural, not a manual step. (2nd phantom-version class the ScrumMaster caught - companion to R30.14 SW-auto-update which fixed the CLIENT stale-cache side; this fixes the SERVER serve-before-commit side.)
  **Acceptance criteria:**
  - [ ] **(atomic)** The deploy commits the version-bump + built dist BEFORE (or atomically with) serving the new bundle - it never serves an uncommitted build.
  - [ ] **(invariant)** served == committed == HEAD at all times: the version the server serves equals the committed dist equals HEAD package.json version. No phantom window (served != committed).
  - [ ] **(guard)** A guard FAILS the deploy/startup if the running prod version != HEAD package.json version - a serve-before-commit is caught, not silent.
  - [ ] **(invariant)** The phantom-version window (served != committed, ungateable) is eliminated: every served bundle is reproducible from a commit.
  - [ ] **(by-construction)** Atomicity is structural (commit-then-serve ordering + the guard), not a manual step - a new deploy path cannot skip it.
  - [ ] **(verify)** A deploy leaves served==committed==HEAD; the guard trips on a deliberate version mismatch (gate the guard). Companion to R30.14 (client side).
  -> deploy.commitBeforeServe [uc:uuid:fd00cbc6-4f0f-4ef1-aebc-17e75d7a178b]
  -> deploy.assertVersionAtHead [uc:uuid:9eff5d30-4c78-4334-8c05-cc465ba957b4]

- [ ] **R30.29 — 3-pane rows resync at modification regions - non-changed side shows base lines, no cumulative drift**
  [requirement:uuid:61241686-e982-4928-aaa0-3aed895d565d]
  > TRON 2026-07-17 (v0.7.40): alignment is good at the 1st method then drift starts at the next and accumulates - each new block must re-align. Discover the correct (empty) lines and resync around them with the next full line.
  Corresponding lines share one visual row across all 3 panes at MODIFICATION regions too (not just insertions), with NO cumulative drift. R30.27 fixed insertions but modeled a modification's non-changed side as EMPTY - so for a diff3 stable buffer='a'/'b' region with oLength>0 (local/remote changed base while the OTHER side == base), the opposite pane still shows M=oLength base lines that R30.27 dropped, leaking M rows per region -> cumulative drift (otmux: 368px over ~50 modification regions). FIX (impl-edit to computeMergedCenter/computeOneSidedHunks, marker a0b30550 STAYS, + minimal vendor diff3.ts extension - infra under the same Impl, no new units): (1) vendor StableRegion exposes oStart+oLength (populated from the in-scope Hunk); (2) the one-sided branch sets the non-changed side to baseLines.slice(oStart, oStart+oLength) (M base lines, drop the []) and advances its counter by oLength; (3) empty-line-anchored resync - stable regions (buffer='o', incl blank lines) are universal language-agnostic anchors: pad each lagging pane to maxRow before the stable line so all 3 land the next full line on the SAME row -> drift snaps to 0 at every anchor. maxH=max(N,M) so alignPaneRows pads correctly; center=picked -> RESULT byte-identical. Zero syntax/AST parsing - all inputs are line indices/arrays from the line-diff3.
  **Acceptance criteria:**
  - [ ] **(drift-onset)** private.resolve.target() stays aligned AND private.otmux.target.isPane() (the first drift point) + every method after it re-align - corresponding lines share one visual row across all 3 panes. private.complete.sessions(): LEFT line 72 and CENTER line 73 land on the SAME row.
  - [ ] **(cumulative)** otmux (~50 modification regions): 0px cumulative LEFT drift (was 368px).
  - [ ] **(anchor-resync)** At EVERY stable/blank anchor (buffer='o') all 3 panes land the next full line on the SAME row (laggards padded to maxRow); at EVERY modification region the non-changed pane advances by its real M=oLength base lines. Drift is bounded to within one block and snaps to 0 at each anchor.
  - [ ] **(base-slice)** The vendor diff3.ts StableRegion exposes oStart+oLength (from the in-scope Hunk); the one-sided branch shows baseLines.slice(oStart, oStart+oLength) on the non-changed side (drop []) and advances la/lb by oLength - infra under the same Impl a0b30550, no new units.
  - [ ] **(regression)** Insertions (oLength=0) stay one-sided - R30.27 origin-exact behavior preserved (regression guard). Connector curves span the aligned modification region across gap rows (both bands draw when a=N>0 and b=M>0).
  - [ ] **(verify)** RESULT byte-identical; assertion-grade getTopForLineNumber equal across all 3 panes per corresponding line INCLUDING modification regions. DET-3x + Tron on the otmux repro. Client fix -> version-bump.
  -> diffEditor.modificationRegionResync [uc:uuid:9b088010-5b4c-44ac-8997-d25df2f657c3]

- [ ] **R30.30 — 3-pane rows re-anchor to 0px at every blank/stable line - no persistent residual shift**
  [requirement:uuid:b4f0f0db-720a-41b8-a998-6b7e86ce2135]
  > Tron/tester (v0.7.41): a clean 2-row (32px) misalignment starts at L1823 and persists to EOF - pixel-perfect alignment needed. Re-sync absolutely at the blank/stable lines.
  Corresponding lines land on the SAME visual row at EVERY stable/blank anchor with ZERO persistent residual - a single forward pass ABSOLUTELY re-anchors each pane at every unchanged line. R30.29 advanced content counters + padded each region to maxH but TRUSTED every region's pad to be exact - so one modification region near L1823 (send.verified) mis-pads by 2 rows and, with no re-equalize at the next stable line, that 32px delta rides to EOF (741 anchors all 32px, single non-cumulative shift). FIX (impl-edit to computeMergedCenter [a0b30550 STAYS] + alignPaneRows [17c71adf STAYS], no new units): track cumulative VISUAL rows per pane (vL/vC/vR = real + spacer rows emitted); at each STABLE region (buffer='o', blanks the common case) RE-ANCHOR FIRST - target=max(vL,vC,vR), pad each laggard up to target, set vL=vC=vR=target - THEN emit the stable lines. This MEASURES the actual accumulated rows and snaps any single-region mis-pad to 0 at the very next anchor (bounded to one block, self-healing) - correctness no longer depends on every oLength/maxH being perfect. Deterministic (analytic row counts). Scope: 0px at all corresponding ANCHORS + block boundaries; within-change INTERIOR non-alignment is correct-by-nature (IntelliJ-same) and NOT gated.
  **Acceptance criteria:**
  - [ ] **(l1823)** The send.verified/debug.log-isPane-guard region -> 0px at its next stable line and to EOF: all 741 anchors 0px (was a clean 32px whole-region shift).
  - [ ] **(self-heal)** Inject a deliberate single-region 2-row mis-pad -> it snaps to 0 at the next stable/blank line (not carried forward) - self-healing, bounded to one block.
  - [ ] **(anchors-scope)** 0px at ALL corresponding anchors (every diff3 stable/blank region + block boundaries). Within-change INTERIOR non-alignment is correct-by-nature (IntelliJ-same, the two sides don't line-correspond inside a change) and is explicitly NOT gated.
  - [ ] **(no-regression)** Insertions, modifications, conflicts, agreed-both-sides all still 0px at every stable anchor; RESULT byte-identical (re-anchor only inserts corrective blank spacer rows).
  - [ ] **(mechanism)** Single forward pass over VISUAL rows: changed/conflict region adds maxH to each pane; a stable region re-anchors (target=max, pad laggards, vL=vC=vR=target) BEFORE emitting its lines. Impl-edit to computeMergedCenter (a0b30550) + alignPaneRows (17c71adf) merged into one pass; markers STAY, no new units. (Optional sub-pixel: pin lineHeight:19/wordWrap:off on mountThreePane c4c84142 - the residual is a whole-row miscount so re-anchor is primary.)
  - [ ] **(verify)** Assertion-grade: getTopForLineNumber equal (+/-0px) across edLocal/edCenter/edRemote at EVERY stable/blank line, at scrollTop=0 AND mid-scroll. Language-agnostic (any language / plain text). DET-3x strict-0px gate + Tron pixel-perfect. Client fix -> version-bump.
  -> diffEditor.absoluteBlankReanchor [uc:uuid:1d74c00e-e13a-4e10-9103-575dbd3e5240]

- [ ] **R30.32 — SVG connector overlays visible - L<->C + C<->R curves + IntelliJ change boxes (line mapping)**
  [requirement:uuid:4e0b50f2-49a6-4e2f-b5ca-8b022b3044b0]
  > TRON (screenshot 3, HARD req): WE NEED THESE - the connector overlays between the panes (left<->center and center<->right) showing how the lines map, IntelliJ-style boxes on the connectors. They are invisible right now.
  The SVG connector overlays that map corresponding change regions Local<->Center and Center<->Repository are VISIBLE and IntelliJ-styled. renderConnectorRibbons already draws both trapezoid bands (SVG .de-ribbons, z-5, pointer-events:none, origin-gated, colored by conflictColor) and the blocks are backgrounded on all 3 panes - so this is VERIFY-VISIBLE + IntelliJ-parity ENHANCE, NOT a new overlay (must not duplicate). PRIMARY fix: the bands span the inter-pane GUTTER (lRight->cLeft, cRight->rLeft); if a later layout change (R30.16/R30.30) narrowed the gutter to ~0 the bands collapse to invisible (same class as R30.13: visibility was WIDTH not z/opacity) - restore the ~34px inter-pane gutter so the bands have width. ENHANCE (IntelliJ screenshot 3): add a 1px STROKE OUTLINE box (de-block-outline-<kind>, CONFLICT_PALETTE[kind]) around each change block on all 3 panes (complement the fill); draw bands for MODIFICATIONS too (post-R30.29 a>0 AND b>0 -> both bands connect a modification across all 3 panes); keep pointer-events:none/z-5. Impl-edit; markers STAY (renderConnectorRibbons + the two block renderers), no new units unless a dedicated box helper is preferred.
  **Acceptance criteria:**
  - [ ] **(visible)** Both connector sets are VISIBLE: Local<->Center AND Center<->Repository trapezoid curves render with NON-ZERO width for every change region (measure lRight<cLeft and cRight<rLeft with gap > ~20px).
  - [ ] **(gutter)** PRIMARY: a real inter-pane gutter (~34px each side, .de-panes) is restored so the bands have width - the invisibility was a WIDTH regression (gutter->~0), same class as R30.13, not a z/opacity issue. No duplicate overlay is minted (renderConnectorRibbons already draws them).
  - [ ] **(boxes)** Each change block shows a BOXED outline on all 3 panes (existing fill + a 1px stroke de-block-outline-<kind> colored by kind: conflict/change/resolvable) - IntelliJ screenshot 3.
  - [ ] **(mod-both-bands)** A MODIFICATION connects across all 3 panes (both L<->C and C<->R bands, post-R30.29 a>0 AND b>0); a one-sided INSERTION shows ONE band (origin-exact, R30.17/R30.19 preserved).
  - [ ] **(scroll-legible)** Curves track the aligned rows on scroll (re-render, already wired via syncScroll3); pointer-events:none + z-5 under the z-6 icon strips (don't block the editor). The overlay makes the mapping legible: unchanged lines read straight/aligned, changes fan through trapezoids. Language-agnostic (geometry from lineY/getTopForLineNumber, no syntax parsing).
  - [ ] **(verify)** DET-3x + Tron visual (screenshot-3 repro): both band sets non-zero width, boxed blocks all 3 panes, modification=both-bands, scroll-tracked. Client fix -> version-bump. (If a dedicated box-drawing Method is preferred over impl-editing the two block renderers, architect re-derives it as a NEW name-exact Method; default is impl-edit under the existing markers.)
  -> diffEditor.connectorOverlays [uc:uuid:3f641eb5-5f5e-47a7-a6c9-d88ac757a1ad]

- [ ] **R30.33 — Vendor diff3 emits pure-deletion regions so alignment resyncs (send.verified)**
  [requirement:uuid:54b316b7-4692-4b6a-a035-e295cf448432]
  > Tester/Tron (v0.7.4x): send.verified still drifts 2 lines from L1813 - the re-anchor could not fix it. (Expert root: a pure-deletion region was being DROPPED by the vendor diff3 guard.)
  Vendor diff3 emits PURE-DELETION regions so 3-pane alignment resyncs at send.verified. Shipped root cause (expert, deeper than the geometry-re-anchor design): base->dev has a pure DELETION (abLength===0, oLength=2 - lines removed, nothing added), and vendor diff3MergeRegions' abLength>0 guard DROPPED that single-hunk region entirely - so the model was 2 lines short from L1813 (send.verified) and the R30.29/R30.30 re-anchor could not fix a region that was not even present. FIX (shipped v0.7.43, a61258a39; vendor/diff3.ts infra under a0b30550 + 17c71adf, markers STAY, no new units): emit the single-hunk region even for abLength===0 (bufferContent=[]); computeOneSidedHunks then puts the M=oLength base lines on the non-changed (retaining) pane and spacers on the deleting pane, advancing la/lb by oLength - so the deletion region has correct per-pane counts and the existing re-anchor resyncs at send.verified. (Deletion = block on the retaining side, origin-correct.)
  **Acceptance criteria:**
  - [ ] **(root)** Vendor diff3MergeRegions dropped a pure-DELETION region (abLength===0, oLength=2 - base->dev, 2 removed lines) via its abLength>0 guard, so the model was 2 lines short from L1813 (send.verified) and the re-anchor could not resync a region absent from the model.
  - [ ] **(emit-deletion)** vendor/diff3.ts emits the single-hunk region even for abLength===0 (bufferContent=[]), so pure deletions ARE represented in the region stream.
  - [ ] **(one-sided)** computeOneSidedHunks puts the M=oLength base lines on the non-changed (retaining) pane + spacers on the deleting pane and advances la/lb by oLength - the deletion has correct per-pane counts and renders origin-correct (block on the retaining side).
  - [ ] **(resync-gate)** With the deletion region present, the existing R30.29/R30.30 re-anchor resyncs at send.verified: the CORRECTED gate is GREEN (content-located, notFound=0) on ALL corresponding lines including send.verified. Deployed v0.7.43.
  - [ ] **(no-regression)** Insertions / modifications / conflicts / agreed-both-sides all still 0px at every stable anchor; RESULT byte-identical (deletion adds base lines on the retaining pane + spacers, no content change).
  - [ ] **(verify)** Vendor diff3.ts emit + computeOneSidedHunks (under computeMergedCenter [a0b30550]) + alignPaneRows [17c71adf] - markers STAY, no new units. Covers deployed v0.7.43 (a61258a39). DET-3x corrected strict-0px gate + Tron pixel-perfect. (Tester independently re-gating v0.7.43 = the real close.)
  -> diffEditor.deletionRegionResync [uc:uuid:ba2f99e0-7ca8-443d-a151-1aed9d50a317]

- [ ] **R30.34 — 3-way merge is ALWAYS 3 side-by-side columns with continuous splines (IntelliJ target, never stacked)**
  [requirement:uuid:53ab62ed-7ced-429a-945f-8b639faa4237]
  > TRON 2026-07-18: ALWAYS 3 columns, no matter what. The IntelliJ target picture is CRYSTAL CLEAR - use SPLINES not boxes, ONE continuous mapping across the 3 editors. Narrow viewport = scroll/zoom within the columns, never stack.
  The 3-way merge editor is ALWAYS three side-by-side columns (Local | Result | Repository) at EVERY viewport width - it NEVER stacks, there is NO orientation switch and NO media-query breakpoint. This matches the crystal-clear IntelliJ/Rider target (scrum.pmo/sprints/sprint-30-traceability-improvement/diagrams/R30.32-TARGET-rider-merge-connectors.png = 3 columns + continuous curved splines across the gutters). A narrow (phone) viewport is handled by HORIZONTAL SCROLL / ZOOM WITHIN the 3 columns - the layout does not change, only the viewport pans/zooms. One continuous filled cubic-bezier spline ribbon per change flows Local -> Result -> Repository across the gutters (color-coded translucent by kind, no boxes/outlines) so any change is traceable at a glance. SUPERSEDES R30.32 (box-outlines, Tron-rejected). NOTE: this replaces the earlier 'mobile-first responsive / both-orientations / stacking' framing (PO's wrong framing that CAUSED the P0 desktop-stacking regression) - Tron ruled ALWAYS 3 columns. Client-facing -> version-bump + atomic deploy (R30.28).
  **Acceptance criteria:**
  - [ ] **(always)** INVARIANT (Tron: 'ALWAYS 3 columns, no matter what'): the 3-way merge is ALWAYS three SIDE-BY-SIDE COLUMNS (Local | Result | Repository) at EVERY viewport width - NEVER stacked, NO orientation switch, NO media-query breakpoint. A rendering that stacks or reflows the panes at any width is a HARD FAIL. Matches the IntelliJ target picture scrum.pmo/sprints/sprint-30-traceability-improvement/diagrams/R30.32-TARGET-rider-merge-connectors.png.
  - [ ] **(narrow)** A narrow (phone) viewport is handled by HORIZONTAL SCROLL / ZOOM WITHIN the 3 columns - the 3-column layout is unchanged; only the viewport pans/zooms. There is NO responsive stacking and NO breakpoint (this removes the earlier mobile-first-stacking premise that caused the desktop regression).
  - [ ] **(one)** ONE continuous filled cubic-bezier spline ribbon per change flows Local -> Result -> Repository as a SINGLE SVG path across the gutters (absorbing the per-pane Y offset), color-coded translucent by kind (change=blue / conflict=red-pink / active=green), NO per-pane boxes / bands / hard-outlines - matching the target's continuous ribbons. Supersedes R30.32 (boxes deleted).
  - [ ] **(target)** The rendered 3-way merge MATCHES the IntelliJ target picture scrum.pmo/sprints/sprint-30-traceability-improvement/diagrams/R30.32-TARGET-rider-merge-connectors.png: desktop side-by-side columns with continuous curved splines across. Matching the target IS the requirement (Rider 'Merge Revisions' fidelity).
  - [ ] **(legible)** At a glance ANY change is traceable Local -> merged Result -> Repository; inline accept controls (x reject / >> accept-toward-result / <<) sit ON the ribbon edge without occluding it.
  - [ ] **(gate)** GATE = 3 COLUMNS + continuous splines verified by SCREENSHOT + PIXEL vs the target scrum.pmo/sprints/sprint-30-traceability-improvement/diagrams/R30.32-TARGET-rider-merge-connectors.png across the REAL DESKTOP WIDTH RANGE - MULTIPLE widths (e.g. 1920 / 1440 / 1280) AND windowed 700-819px AND phone 390px ALL render 3 side-by-side columns (never stacked). A single headless width is NOT acceptance; NEVER DOM/element-count. Client-facing -> version-bump + atomic deploy (R30.28).
  -> merge.threeColumnSplineRibbon [uc:uuid:c3f9ea4c-9de5-41c8-9371-986e9453b066]

- [ ] **R30.35 — Diff coloring by kind (add=green/delete=red/modify=blue/conflict=brown) + per-block IntelliJ merge actions**
  [requirement:uuid:96634144-2069-4d3d-809c-f804873d7401]
  > TRON (tested): coloring is all one-sided=BLUE=WRONG. ADDITION=green; DELETION (line removed from result, e.g. local-only line dropped in dev)=red (currently blue=the bug); MODIFICATION (both present)=blue; CONFLICT (both diverge)=red/brown. Merge actions per block: '>>' take Local->Result (a DELETION re-adds the deleted line), '<<' take Repo->Result, 'x' dismiss/delete the block from center.
  The 3-way merge colors each change block by its true diff3 KIND and offers per-block IntelliJ merge actions - fixing the current bug where ALL one-sided changes render BLUE. KIND is derivable in computeMergedCenter from the diff3 region: oLength==0 -> ADDITION, abLength==0 -> DELETION, both>0 -> MODIFICATION, stable:false -> CONFLICT. COLORS (extend ConflictKind + CONFLICT_PALETTE): ADDITION=GREEN, DELETION=RED (currently wrongly BLUE - the core bug: a local-only line dropped in dev reads as an addition), MODIFICATION=BLUE, CONFLICT=RED/BROWN. Per changed region the CENTER shows BOTH versions (left+right; older=dark, newer=highlighted); actions are ADD/REMOVE: '>>' puts the LEFT version into center, '<<' puts the RIGHT version into center (both can coexist), 'x' REMOVES the line from center (ALWAYS - no ignore/dismiss/pick-side). Client-facing -> version-bump + atomic deploy (R30.28). RENDERING: a both-versions change renders as TWO per-side blocks (left changed line to its center line; right changed line to its center line), each linking ONE side to its specific center line - never one merged block spanning both.
  **Acceptance criteria:**
  - [ ] **(kind)** KIND is derived in computeMergedCenter from the diff3 region: oLength==0 -> ADDITION, abLength==0 -> DELETION, both>0 -> MODIFICATION, stable:false -> CONFLICT. ConflictKind is extended and CONFLICT_PALETTE maps add=green / delete=red / modify=blue / conflict=brown (one place, pure fn of the block).
  - [ ] **(color)** ADDITION (one side adds lines, oLength==0) renders GREEN.
  - [ ] **(color)** DELETION (a line removed from the result - e.g. a local-only line dropped in dev, abLength==0) renders RED. This FIXES the current defect where every one-sided change rendered BLUE (a deletion looked like an addition).
  - [ ] **(color)** MODIFICATION (changed, both sides present, both>0) renders BLUE.
  - [ ] **(color)** CONFLICT (both sides diverge, stable:false) renders RED/BROWN (brown, visually distinct from delete-red).
  - [ ] **(block)** Per changed region the CENTER shows BOTH versions (left line + right line; older=dark, newer=highlighted). Actions are ADD/REMOVE (NO ignore/dismiss/pick-side): '>>' PUTS the LEFT version into the center, '<<' PUTS the RIGHT version into the center (BOTH can be in the center at once), 'x' REMOVES that line from the center (ALWAYS). See the 16-cell behaviour matrix (mergeAction.* UCs).
  - [ ] **(action-visibility)** UNIFIED per-line button-visibility (supersedes 'x only when both versions'): for EACH side, PER LINE-IN-CENTER - if that side's line IS in the center, show 'x' (remove that side); if it is NOT in the center, show '>>' (left) / '<<' (right) (add that side). Applies uniformly to BOTH one-sided changes AND conflicts.
  - [ ] **(action-visibility)** Pressing 'x' on a side REMOVES that side's line from the center. From 2 lines -> 1 line (the change AUTO-RESOLVES to the remaining version and the editor JUMPS to the next change via jumpToChange). From 1 line -> 0 lines (the region is un-merged/removed - a deliberate resolved outcome; '>>'/'<<' then show on both sides to re-add either).
  - [ ] **(action-visibility)** The '>>' (left) / '<<' (right) add-side action shows when that side's line is NOT currently in the center.
  - [ ] **(action-visibility)** A ONE-SIDED change (1 line in center) follows the same per-line rule: 'x' on the present side removes it (-> 0 lines, un-merged) and '>>'/'<<' shows on the absent side; after removing to 0 lines, BOTH '>>'/'<<' show so either side can be re-added. No special-case - the per-line rule covers one-sided and conflicts identically.
  - [ ] **(resolution)** The resolved-state DERIVES from the center line-count: 2 lines = UNRESOLVED (both versions present, undecided); 1 line = RESOLVED (one version chosen); 0 lines = RESOLVED (region removed / neither - a deliberate choice, re-openable via '>>'/'<<'). Unresolved ONLY when the center holds 2 versions. The R30.37 checkmark reflects this derived state and can manually override it.
  - [ ] **(rendering)** A both-versions change (a>0 && b>0) renders as TWO PER-SIDE blocks, NOT one merged block spanning both center lines. MECHANISM (architect design e6a58f982): centerLeft span = [span0, span0+a.len] = the LEFT/older version (DARK); centerRight span = [span0+a.len, span1] = the RIGHT/newer version (HIGHLIGHTED). renderCenterChangeBlocks [37c9694c] emits 2 decorations (centerLeft + centerRight); renderConnectorRibbons [5051b2a4] draws 2 HALF-ribbons - Local<->centerLeft AND Repository<->centerRight - each side connecting to ITS specific center line, never one merged ribbon spanning both. One-sided changes (insertions/deletions) unchanged. Impl-edit, markers stay. The 2 blocks are VISUAL ONLY: the change remains ONE unit for resolution (one R30.37 'RESOLVED' checkmark, one resolved-state) - 2 blocks does NOT mean 2 resolve targets. (Ref screenshot: line 73 left / center 74+75 / right 74 -> 2 blocks.)
  - [ ] **(gate)** GATE = SCREENSHOT the 4 kinds show the CORRECT colors (add=green / delete=red / modify=blue / conflict=brown) AND each action (>> / << / x) does the right thing per kind - especially '>>' RE-ADDS a deleted line on a DELETION block. Pixel/screenshot, NEVER DOM/element-count. Client-facing -> version-bump + atomic deploy (R30.28).
  -> merge.kindColoring [uc:uuid:9c41a415-a96a-4bd1-adca-5c6c1b7391b6]
  -> merge.blockActions [uc:uuid:d7493e80-83f6-46d7-b320-00876be7d387]
  -> mergeAction.addPutLeft [uc:uuid:1eed3029-0017-41c2-ba2d-a6125ebe9da1]
  -> mergeAction.addPutRight [uc:uuid:4b47be33-0fcf-47b1-9c5c-c3de1b842d40]
  -> mergeAction.addRemoveLine [uc:uuid:3662f00b-0571-4240-9345-40109b13ab37]
  -> mergeAction.deletePutLeft [uc:uuid:fd08c146-277a-4bf4-bd35-3c88e3228b85]
  -> mergeAction.deletePutRight [uc:uuid:98c235e0-1c5b-4757-bbe7-1eaeebe3526a]
  -> mergeAction.deleteRemoveLine [uc:uuid:74167c20-2adc-437a-aef5-54354c8c8210]
  -> mergeAction.modifyPutLeft [uc:uuid:33ade681-7d78-4c94-b5ab-ec6a84e131aa]
  -> mergeAction.modifyPutRight [uc:uuid:352b05ec-f18c-4c71-aa86-29a1da9226db]
  -> mergeAction.modifyRemoveLine [uc:uuid:c014b832-22fe-4386-8171-21db7eb3e6c6]
  -> mergeAction.conflictPutLeft [uc:uuid:b934da9e-f4e1-4fb2-927b-91e57c29bad9]
  -> mergeAction.conflictPutRight [uc:uuid:72668662-5aa8-412d-a005-f1a60b1076db]
  -> mergeAction.conflictRemoveLine [uc:uuid:a328ddac-8918-47f0-9942-b7cc063daec4]
  -> mergeAction.edgeBothVersionsInCenter [uc:uuid:45cac75f-8645-4519-8a87-337d643717ac]
  -> mergeAction.edgeCenterShowsBothVersions [uc:uuid:bc52e3ed-d45d-4d1c-a4a6-e501119afa03]
  -> mergeAction.edgeRemoveIsAlways [uc:uuid:e11a2842-a27b-4dd4-bdaf-6b81b5895476]
  -> mergeAction.edgeReAddAfterRemove [uc:uuid:c4ecb985-9749-4d80-8aaa-f7463fda1bb2]

- [ ] **R30.36 — Diff-nav aids: brighter current-change on up/down + open-changes-remaining count**
  [requirement:uuid:dde56b34-2cfc-41bb-b432-9a0508566a62]
  > TRON (scenario-first): highlight the CURRENT change brighter as I step up/down through changes; and show a COUNT of open changes that still need to be acted on (that decrements as I resolve them).
  Two diff-navigation aids for the 3-way merge: (a) HIGHLIGHT the CURRENT change with a BRIGHTER color during up/down navigation - as you step through changes (jumpToChange), the focused change stands out brighter than the others, pixel-distinguishable from a non-current change of the SAME kind; (b) show a COUNT of OPEN changes still needing to be ACTED ON (unresolved / not yet handled) - the 'N conflicts to resolve' count = OPEN (UNRESOLVED) changes; a change is resolved ONLY via the R30.37 green checkmark (NOT auto on a merge action). The count decrements on checkmark-resolve and increments when a merge action resets a resolved change to unresolved.
  **Acceptance criteria:**
  - [ ] **(nav-highlight)** During UP/DOWN diff navigation (jumpToChange), the CURRENTLY-FOCUSED change is highlighted with a BRIGHTER color that is PIXEL-DISTINGUISHABLE from a non-current change of the SAME kind (a same-kind non-focused change is visibly dimmer).
  - [ ] **(nav-highlight)** Stepping up/down focuses the next/previous change and MOVES the brighter highlight to it (only one change is 'current' at a time).
  - [ ] **(count)** The 'N conflicts to resolve' count = # of UNRESOLVED changes, where UNRESOLVED = the center holds 2 versions (derived from line-count), unless manually overridden via the R30.37 checkmark. Resolving (via 'x'/derived 1-line OR the checkmark) decrements it; re-opening increments it.
  - [ ] **(count)** The count DECREMENTS when a change is resolved via the R30.37 checkmark (12->11) and INCREMENTS when a merge action (x/>>/<<) RESETS a resolved change back to unresolved. It does NOT auto-decrement on a merge action (that was the expert's inverted build - corrected here to Tron's model).
  - [ ] **(verify)** GATE: (a) the brighter current-change is PIXEL-DISTINGUISHABLE from non-current same-kind (screenshot at each nav step); (b) the open-count is accurate and decrements on each >>/<</x to 0. Client-facing -> version-bump.
  -> diffNav.highlightCurrentChange [uc:uuid:17700deb-dfbc-46dc-bd44-e0f01adceb40]
  -> diffNav.openChangeCount [uc:uuid:cb29d749-6d9c-443b-8a64-8d8e674cdec2]

- [ ] **R30.37 — Per-change RESOLVED-state toggle (green checkmark: outlined=unresolved / solid=resolved)**
  [requirement:uuid:5abdb2d4-f358-4e02-bcad-95e5b0354d80]
  > TRON: a green checkmark per change (labelled 'RESOLVED', not 'commit') next to the up/down nav - outlined-green = unresolved, solid-green = resolved; clicking toggles resolved; clicking any x/>>/<< on that change resets it to unresolved. ONE resolved-state per change even if it renders as 2 blocks.
  A per-change RESOLVED-STATE toggle: a GREEN CHECKMARK (labelled 'RESOLVED') sits next to the up/down nav in the 3-Way Merge toolbar for the current change. OUTLINED-green = UNRESOLVED; SOLID-green = RESOLVED. Clicking the checkmark TOGGLES the change's resolved state. Clicking ANY merge action (x / >> / <<) on that change RESETS it to UNRESOLVED (an action means you're re-working it). Resolution is EXPLICIT via the checkmark - it is NOT auto-set by an action. Drives the R30.36 open-count (open = unresolved). Client-facing -> version-bump + atomic deploy (R30.28). RECONCILE (Tron conflict-merge optimize): resolution DERIVES from the center line-count (1 line = resolved, 2 lines = unresolved) - the checkmark REFLECTS that derived state (SOLID=1-line/resolved, OUTLINED=2-line/unresolved, auto-updating) AND is a MANUAL OVERRIDE (force-resolve a still-2-line change when you intend to keep BOTH versions; or re-open a 1-line change). WORDING is 'RESOLVED' (button/label/tooltip), never 'commit'. ONE resolved-state per CHANGE (even rendered as 2 SVG blocks). 'x' (visible only when 2 lines, per side) removes a side -> 1 line -> auto-resolves + jumps to next; '>>'/'<<' add a side and the state re-derives from line-count.
  **Acceptance criteria:**
  - [ ] **(toggle)** Each change shows a GREEN CHECKMARK labelled 'RESOLVED' (button/label/tooltip say 'RESOLVED' - NEVER 'commit'/'committed') next to the up/down nav in the 3-Way Merge toolbar for the current change.
  - [ ] **(toggle)** The checkmark REFLECTS the DERIVED resolved-state: SOLID-green when the center holds <=1 version (RESOLVED - 1 line=chosen, 0 lines=removed), OUTLINED-green when it holds 2 versions (UNRESOLVED - both present, undecided) - auto-updating from the center line-count. Pixel-distinguishable. Unresolved ONLY when 2 lines.
  - [ ] **(toggle)** The checkmark is a MANUAL OVERRIDE on top of the derived state: click to force-RESOLVE a still-2-line change (intentionally keep BOTH versions) or to re-open (force-unresolve) a 1-line change. Default resolution is DERIVED from the center line-count; the checkmark both INDICATES and OVERRIDES it - it is not the sole resolution mechanism.
  - [ ] **(toggle)** There is ONE resolved-state per CHANGE. Even when a change renders as TWO SVG blocks (the R30.35 two-per-side rendering), it is ONE change with ONE checkmark and ONE resolved-state - resolving/unresolving applies to the whole change, NOT per block. 2 blocks = VISUAL only, not 2 resolve targets.
  - [ ] **(reset)** Merge actions change the center line-count so the derived state updates automatically: 'x' -> 1 line -> resolved (+ jump to next); '>>'/'<<' -> re-derive (2 lines = unresolved, 1 line = resolved). A manual override persists until an action changes the line-count or the user toggles again.
  - [ ] **(count)** The resolved state drives R30.36's open-count (open = unresolved): resolving via checkmark decrements it, an action resetting a resolved change increments it.
  - [ ] **(verify)** GATE: checkmark toggles resolved (outlined<->solid, pixel-distinguishable); an action resets to unresolved; the open-count tracks accordingly. Client-facing -> version-bump.
  -> merge.toggleResolved [uc:uuid:fa87d094-a723-443c-8f71-b4a1ce54ba24]

- [ ] **R30.38 — Merge Save writes to the diff's repo/current branch (no 404) + center header shows filename@currentBranch**
  [requirement:uuid:4aa5ec49-34f0-41a5-b19e-5530cae2ad34]
  > TRON (v0.7.60): all conflicts resolved ('0/61 open, modified') but Save -> 'save failed (404)'. FIX: Save ALWAYS writes to the file in the CURRENT CHECKED-OUT branch/commit (correct repo/branch, no 404); the CENTER pane header shows filename@currentBranch (e.g. otmux@<branch>).
  The 3-way merge SAVE writes to the file in the DIFF'S repo on the CURRENT CHECKED-OUT branch/commit - no 404. BUG (v0.7.60): with all conflicts resolved ('0/61 open conflicts, modified'), Save -> 'save failed (404)'. ROOT (expert-measured): the save PUT hits the MAIN/rawbin repo while the diff file (e.g. otmux) lives in the OOSH repo -> the write path does not exist -> 404. This is the SAME wrong-repo root as the C read-fix (R30.6.7). FIX: route the save PUT through the diff's repo KEY (RepoRegistry, mirroring the read path) so it writes to the correct repo/branch; the server /api/files PUT endpoint accepts ?repo=<key> and resolves the write there (server-side - needs a restart). ALSO: the CENTER pane header shows 'filename@currentBranch' (e.g. otmux@<branch>) reflecting WHERE the save writes. Client-facing -> version-bump + atomic deploy (R30.28).
  **Acceptance criteria:**
  - [ ] **(save)** The merge Save routes the PUT through the DIFF'S repo (the repo the file lives in, e.g. OOSH for 'otmux'), NOT the main/rawbin repo, writing to the file in the CURRENT CHECKED-OUT branch/commit. A file in a non-rawbin repo saves WITHOUT a 404.
  - [ ] **(save)** The server save PUT endpoint (/api/files PUT) accepts the repo KEY (?repo=<key>, R30.6.7 RepoRegistry) and resolves the write path in that repo - mirroring the C read-path fix. (Server-side change -> requires a server restart; expert authority.)
  - [ ] **(header)** The CENTER pane header shows 'filename@currentBranch' (e.g. otmux@<currentBranch>) reflecting WHERE the save writes.
  - [ ] **(gate)** With all conflicts resolved, pressing Save SUCCEEDS (HTTP 200, file written) - no 'save failed (404)'.
  - [ ] **(gate)** GATE on the REAL deep-link (e.g. /edit/otmux?repo=oosh&left=<ref>&right=<ref>&3way=1): resolve conflicts -> Save succeeds (no 404), the file is written to the OOSH repo's checked-out branch, and the center header reads otmux@<branch>. Verified live; version-bump + atomic deploy (R30.28).
  -> merge.saveToCurrentBranch [uc:uuid:bcc27da9-21da-421e-8d22-f3403d6100f5]
  -> merge.centerHeaderBranch [uc:uuid:abad9982-86de-4962-988f-5957ab96d288]
  -> merge.currentBranchApi [uc:uuid:9757bf00-1395-4bb3-935b-8e1ca1a2a905]
  -> merge.saveWriteBounded [uc:uuid:c76c6b3a-4fe7-4e66-8380-1cc27196c3db]

- [ ] **R30.39 — Deep-link ?repo seeds BOTH left and right repo selectors on load**
  [requirement:uuid:95ebc2ed-ff7a-4979-9df8-15cb4d74ebff]
  > TRON (v0.7.61, screenshot): the ?repo query param must seed BOTH left AND right repo selectors on load - i had to set BOTH manually, neither was seeded (only default RawBin).
  When the 3-way diff/merge editor opens from a deep-link with ?repo=<key>, BOTH the left AND the right repo selectors MUST be seeded to that repo on load. BUG (v0.7.61, Tron screenshot): neither selector is seeded from ?repo - both stay at the default (RawBin), so Tron had to set BOTH manually. openFromParams (rb-diff-editor.ts:771) sets this.left.repo + this.right.repo from the key and runs a .de-repo forEach, yet the selectors still show the default on load - so the fix-site is NOT the naive data-set (a later populateRepos, or a distinct right selector, re-defaults them). Impl-site pending expert+architect derive-confirm. crossRef R30.24 (openFromParams deep-link seeding) + R30.6.7 (RepoRegistry key resolution).
  **Acceptance criteria:**
  - [ ] **(seed)** Opening the editor from a deep-link with ?repo=<key> seeds BOTH the left AND the right repo selectors to that repo on load - neither is left at the default (RawBin).
  - [ ] **(seed)** The user does NOT have to set either selector manually after a ?repo deep-link; both reflect the URL's repo immediately.
  - [ ] **(security)** The ?repo value is a KEY resolved via R30.6.7 RepoRegistry (no client absolute-path abuse); an unknown/absent key falls back to the default (rawbin) for BOTH selectors.
  - [ ] **(seed)** Preselecting a repo via ?repo=<key> is behaviorally IDENTICAL to a MANUAL selector change: the SAME downstream update path fires either way - the file-history selector updates AND all dependent state refresh, not merely the selector value being set. populateRepos must drive the same change/update flow a manual pick triggers (dispatch the change handler, not just assign sel.value).
  - [ ] **(gate)** GATE (DET-3x + Tron visual): open /edit/otmux?repo=oosh&left=..&right=..&3way=1 -> both left and right selectors read 'oosh' on load, no manual setting; client-facing -> version-bump + atomic deploy (R30.28).
  -> diffEditor.seedBothRepoSelectors [uc:uuid:bd5392ef-61f5-4da3-a966-7b92c47d1417]
  -> diffEditor.repoAwareHistoryFillParity [uc:uuid:246a3649-d4ec-4c82-995f-c62efb99981e]

- [ ] **R30.40 — Center Result header shows the targeted repo's ACTUAL current branch, resolved dynamically**
  [requirement:uuid:c5869b0a-8592-4d86-9250-9034a75e137c]
  > TRON (v0.7.61, screenshot): the center Result header must show the CORRECT current branch of the selected repo - my git status is 'mcdonges.latest' but center shows 'otmux@dev-teampush-astray' which is NOT the current branch. it must match the repo's real current branch dynamically, not a hardcoded/stale name.
  The center Result header (filename@branch) MUST show the ACTUAL current checked-out branch of the repo the diff TARGETS, resolved dynamically at request time - never a stale/other-clone/hardcoded branch. BUG (v0.7.61, Tron screenshot): Tron's working repo is on branch 'mcdonges.latest' but the center header reads 'otmux@dev-teampush-astray'. ROOT (expert-measured, emerging): the server's 'oosh' RepoRegistry key resolves to a DIFFERENT clone (the EAMD clone at /home/shared/EAMD.ucp/.../Once.sh/dev, whose HEAD=dev-teampush-astray) than the user's working clone (/root/oosh, mcdonges.latest) - so GitApi.currentBranch returns that other clone's HEAD. AC aligns to the confirmed root once expert posts it. crossRef R30.38 (centerHeaderBranch + currentBranch chain) + R30.6.7 (RepoRegistry clone resolution).
  **Acceptance criteria:**
  - [ ] **(header)** The center Result header shows the ACTUAL current checked-out branch of the repo the diff targets, resolved dynamically (git) at request time - matching the user's `git -C <repo> branch --show-current`.
  - [ ] **(header)** The header is NEVER a stale, cached, hardcoded, canonicalized, or OOSH_DIR-overridden branch; when HOME/oosh points to the mcdonges.latest worktree the header reads otmux@mcdonges.latest (not dev-teampush-astray).
  - [ ] **(root)** The 'oosh' RepoRegistry root resolves BY CONSTRUCTION to os.homedir()+'/oosh' - the HOME/oosh SYMLINK path (path.resolve, NOT realpath'd/canonicalized to a fixed worktree), NOT an OOSH_DIR env override. Git FOLLOWS the symlink live, so the header reflects the branch of WHATEVER worktree HOME/oosh currently points to (now mcdonges.latest); if `oo` mode-switch repoints the symlink (dev/macos/prod/mcdonges.latest), the header tracks it DYNAMICALLY. Never a misconfigurable env, never a canonicalized fixed worktree.
  - [ ] **(gate)** GATE (DET-3x + Tron visual): open the real deep-link -> the center header branch == the git current-branch of the targeted repo clone (dynamic); client-facing -> version-bump + atomic deploy (R30.28).
  -> repoRegistry.ooshRootFollowsHomeSymlink [uc:uuid:90f5e309-7ab2-49c6-b679-3ad891d5ab2f]

- [ ] **R30.41 — 3-way merge editor shows per-filetype syntax highlighting in all three panes**
  [requirement:uuid:b0c21990-3cf5-4e39-8d27-7f00afe688b3]
  > TRON (v0.7.63): the 3-way merge editors must show correct per-filetype syntax highlighting in all three panes (Local/Result/Repository), driven by the file language, coexisting with the diff/merge change-coloring + spline.
  The 3-way merge editor shows correct per-filetype SYNTAX HIGHLIGHTING in all three panes (Local/Result/Repository), driven by the file's language, COEXISTING with the diff/merge change-coloring (R30.35 add/delete/modify/conflict) + the continuous spline (R30.34) - neither overrides the other. Language derives from the file's path/extension (otmux=bash, .cs=C#, .ts=typescript). Architect derives the impl approach + current-state in parallel; impl-AC aligns on confirm. crossRef R30.34 (spline) + R30.35 (change-coloring).
  **Acceptance criteria:**
  - [ ] **(highlight)** Opening a known filetype highlights keywords/strings/comments CORRECTLY in ALL THREE panes (Local / Result / Repository), driven by the file language (otmux -> bash, .cs -> C#, .ts -> typescript).
  - [ ] **(highlight)** The language is derived from the file path/extension (per-filetype), not a fixed default; each of the 3 editor models is set to that language.
  - [ ] **(coexist)** Syntax highlighting COEXISTS with the diff/merge change-block coloring (R30.35 add/delete/modify/conflict) AND the continuous spline (R30.34): all render intact together, neither the tokenizer nor the diff decorations override the other.
  - [ ] **(impl)** applyLanguage derives the Monaco language id from the left.path extension and calls setModelLanguage(model,id) on all 3 editors at the END of loadSide, mutating the SAME model so R30.35 decorations + R30.34 spline persist (architect-confirmed).
  - [ ] **(gate)** GATE (DET-3x + Tron visual): open otmux (bash) / a .cs (C#) / a .ts (typescript) -> all 3 panes highlight keywords/strings/comments AND the change-blocks + spline still render intact; client-facing -> version-bump + atomic deploy (R30.28).
  -> merge.syntaxHighlight [uc:uuid:53400884-78b5-477b-a8fa-945888c26f16]

- [ ] **R30.42 — Repo selector first option is 'Add repository' and opens the add/manage dialog**
  [requirement:uuid:7d6e15c0-7f8e-41a5-b204-01008a67b78d]
  > TRON (v0.7.65): the repo selector's first entry should be 'Add repository' - clicking it opens a dialog to add a repo (by local path or clone URL) and manage existing repos.
  The repo selector's FIRST option is 'Add repository'; selecting/clicking it opens a dialog to add or manage repositories. Shared IMPL-ENABLER (architect's decomposition, NOT a separate Tron-observable): the RepoRegistry becomes a DYNAMIC, mutable, persisted registry (add/register/clone/switch at runtime) - superseding the R30.40 static ROOTS allowlist. Architect derives the impl-units (dynamic-registry / add-local / add-clone / manage-switch); I mint/re-point methods+impls on confirm.
  **Acceptance criteria:**
  - [ ] **(ui)** The repo selector's FIRST option reads 'Add repository' (above the actual repos).
  - [ ] **(ui)** Selecting/clicking 'Add repository' opens the add/manage dialog (does not try to load a repo named 'Add repository').
  - [ ] **(gate)** GATE (DET-3x + Tron visual): the selector shows 'Add repository' first; clicking opens the dialog; client-facing -> version-bump.
  -> repoManage.addRepositoryOption [uc:uuid:6716c678-f652-4ec3-a2d7-01493c8ea0eb]
  -> repoManage.openDialog [uc:uuid:2c447645-9b02-42cd-9d9d-98d737477264]

- [ ] **R30.43 — Add a repository by entering a server-local path to register an existing checkout**
  [requirement:uuid:96945512-3dbf-413d-ae26-734489ad8c0c]
  > TRON (v0.7.65): add a repo by entering a server-local path (e.g. /root/oosh) to register an existing checkout.
  In the add dialog, entering a SERVER-LOCAL PATH (e.g. /root/oosh) registers that existing checkout as a repo in the dynamic registry, usable in the selector. Shared IMPL-ENABLER (architect's decomposition, NOT a separate Tron-observable): the RepoRegistry becomes a DYNAMIC, mutable, persisted registry (add/register/clone/switch at runtime) - superseding the R30.40 static ROOTS allowlist. Architect derives the impl-units (dynamic-registry / add-local / add-clone / manage-switch); I mint/re-point methods+impls on confirm.
  **Acceptance criteria:**
  - [ ] **(add)** The dialog accepts a SERVER-LOCAL PATH (e.g. /root/oosh) and registers that existing checkout as a repo in the dynamic registry.
  - [ ] **(add)** After registering, the new repo APPEARS in the repo selector and is usable for diffs/merges (resolves via the dynamic RepoRegistry).
  - [ ] **(security)** V1 (Tron scope-simplification 2026-07-19): the chosen directory MUST contain a .git (a FILE or a FOLDER = a git checkout or worktree) - this is the SOLE validation. NO REPO_ALLOW allowlist, NO admin-auth for v1. An invalid dir (no .git) is rejected with a clear error.
  - [ ] **(security)** [BACKLOG v1 - deferred, NOT lost; rationale: path traversal / info-disclosure defense] RATIFIED D1 (deferred to a post-v1 admin-endpoint): the server-local path, after realpath, within HOME subtree OR REPO_ALLOW allowlist. V1 drops this - sole check is .git-present (AC-validate).
  - [ ] **(security)** [BACKLOG v1 - deferred, NOT lost; rationale: write-auth] RATIFIED D4 (deferred): register requires admin-key. V1 drops admin-auth for add-local.
  - [ ] **(security)** V1: the registration persists in the dynamic registry (survives restart). [BACKLOG v1: the admin-key gating of that write is deferred with D4.]
  - [ ] **(gate)** GATE (DET-3x + Tron visual): register /root/oosh -> it appears in the selector + opens a diff; client-facing -> version-bump.
  -> repoManage.addByLocalPathV1 [uc:uuid:759c5f32-59da-424e-ba7f-8189b2162007]

- [ ] **R30.44 — [BACKLOG v1] Add a repository by entering a git clone URL then picking a checkout location to clone and register**
  [requirement:uuid:3c9f69c1-8bee-4309-9e30-df61cea34de3]
  > TRON (v0.7.65): add a repo by entering a git clone URL, then pick a checkout location -> clone + register.
  In the add dialog, entering a GIT CLONE URL then choosing a CHECKOUT LOCATION clones the repo to that location and registers it in the dynamic registry. Shared IMPL-ENABLER (architect's decomposition, NOT a separate Tron-observable): the RepoRegistry becomes a DYNAMIC, mutable, persisted registry (add/register/clone/switch at runtime) - superseding the R30.40 static ROOTS allowlist. Architect derives the impl-units (dynamic-registry / add-local / add-clone / manage-switch); I mint/re-point methods+impls on confirm.
  **Acceptance criteria:**
  - [ ] **(add)** The dialog accepts a GIT CLONE URL and a CHECKOUT LOCATION (server path); it clones the repo to that location.
  - [ ] **(add)** After a successful clone, the repo is registered in the dynamic registry and APPEARS in the selector.
  - [ ] **(add)** Clone progress/failure is surfaced (success -> repo usable; failure -> clear error, nothing half-registered).
  - [ ] **(security)** RATIFIED D1: the clone CHECKOUT LOCATION, after realpath, MUST be within the HOME subtree OR REPO_ALLOW; a location outside those bounds is REJECTED before cloning.
  - [ ] **(security)** RATIFIED D2 (architect §9 Guard-2, built GitApi.assertAllowedUrl v0.7.67): The clone URL is validated by GitApi.assertAllowedUrl using the WHATWG URL parser (new URL(); NEVER legacy url.parse - its authority split is @-confusion-prone). ACCEPTED iff ALL hold: (a) scheme in {https, ssh} only (reject http/file/git/ext); (b) NO password component; (c) username is EMPTY (anonymous https) OR exactly "git" (ssh) - any other username rejected; (d) hostname EXACTLY matches an entry in HOST_ALLOW {github.com, <TEAM_GIT_HOST>}. Otherwise -> 400. The clone subprocess additionally runs env GIT_ALLOW_PROTOCOL=https:ssh + -c protocol.file.allow=never (defense-in-depth vs redirect/submodule escape). Exact-host is the PRIMARY @-confusion/SSRF defense: WHATWG sets host = substring after the LAST @, so credential-confusion forms (e.g. https://github.com@evil.com) resolve host=evil.com and are rejected.
  - [ ] **(security)** RATIFIED D4: cloning requires the admin-key (all writes admin-key-gated).
  - [ ] **(security)** RATIFIED D4: registration is an admin-key-gated write; a failed clone leaves NOTHING half-registered (atomic).
  - [ ] **(security)** RATIFIED D2 invariant (must-hold, mirror of the R30.39 over-reject bug): EMPTY username MUST remain ALLOWED - the rule is "reject if username && username!==git", NOT "require username===git" (else it re-breaks anonymous https clones). An anonymous https URL (no username) is ACCEPTED.
  - [ ] **(security)** RATIFIED D2 invariant (must-hold): the URL parser MUST be WHATWG new URL() (never legacy url.parse) - with both invariants held there is NO residual SSRF hole.
  - [ ] **(gate)** GATE (DET-3x + Tron visual): clone a URL to a location -> repo appears + opens a diff; client-facing -> version-bump.
  -> repoManage.addByCloneUrl [uc:uuid:eb0902d5-b5f8-4c45-b27a-c89287e89a64]

- [ ] **R30.45 — Manage panel shows current repo, local path, current branch and available worktrees, each switchable**
  [requirement:uuid:b6b21710-bee6-4f6e-b382-3578643da85a]
  > TRON (v0.7.65): a manage panel showing the current repo + local server path + current branch + available worktrees, each switchable.
  The dialog's MANAGE panel shows, for the current repo: the local server path, the current branch, and the available worktrees. RATIFIED D3: selecting a worktree is a READ-ONLY ref-pick (worktree-as-key) - the server does NOT checkout or mutate any working tree; the pick repoints the READ key so diff/header read that worktree's ref. Consistent with R30.40 (the oosh root follows HOME/oosh). Shared enabler = dynamic/persisted RepoRegistry; architect derives impl-units.
  **Acceptance criteria:**
  - [ ] **(manage)** The MANAGE panel shows, for the current repo: local server path, current branch, and the list of available worktrees.
  - [ ] **(manage)** RATIFIED D3: each worktree is SELECTABLE as a READ-ONLY key (worktree-as-key) - selecting one repoints the READ key so diff/header read that worktree ref; the server performs NO checkout and mutates NO working tree.
  - [ ] **(manage)** After a switch, the center header + diff reflect the newly-selected worktree's branch (dynamic, per R30.40).
  - [ ] **(security)** RATIFIED D3: switching only selects among the repo OWN worktrees as read keys (bounded) - no server checkout, no arbitrary path.
  - [ ] **(security)** RATIFIED D3+D4: a worktree SWITCH is READ-ONLY (D3) so requires NO admin-key; any MUTATING manage action (register/remove from the registry) requires the admin-key (D4).
  - [ ] **(gate)** GATE (DET-3x + Tron visual): open manage -> shows path+branch+worktrees; switch a worktree -> header/diff track it; client-facing -> version-bump.
  -> repoManage.worktreeSwitch [uc:uuid:3a17f2e5-1093-4c96-aaa9-33aaad92de54]
  -> repoManage.manageInfo [uc:uuid:47c2c3ea-9df8-46f8-841d-3178a4ec62ea]

- [ ] **R30.47 — RepoRegistry is a dynamic, persisted, bounds-checked registry (foundation for repo add/manage)**
  [requirement:uuid:b87eb99a-c83e-4745-9948-a84a1bb3ea00]
  > (Foundation for Tron's repo add/manage feature; D1-D4 ratified. Covering req for the built UC3 spine + UC8 guards per architect design-repo-manager.md §9.)
  The RepoRegistry is DYNAMIC (runtime register/unregister), PERSISTED (survives restart via load/persist), and is a PURE MECHANISM (register=pure store, load=stale-drop by .git existence, resolve=pure lookup); the D1 bounds POLICY (assertAllowedRoot) is a BACKLOG endpoint-guard (§10.1 mechanism/policy separation) - superseding the R30.40 static ROOTS allowlist. This is the architect's UC3 spine + UC8 guard-foundation (design-repo-manager.md §9); the R30.42-R30.45 observable endpoints (add-option/add-local/add-clone/manage) build ON it. UC3 register/unregister/persist/load BUILT v0.7.66 (8b4f36893); UC8 guards: assertAllowedRoot scaffold now (real D1 bounds next), assertAllowedUrl (D2) + requireAdmin (D4) land with the UC8 real-bounds pass.
  **Acceptance criteria:**
  - [ ] **(registry)** The registry supports runtime register/unregister (not a fixed compile-time allowlist).
  - [ ] **(registry)** The registry persists (persist) + reloads on startup (load) so registered repos survive a restart.
  - [ ] **(security)** §10.1 MECHANISM/POLICY SEPARATION: the spine is PURE MECHANISM - register = pure store (no policy throw); load = keep entry IFF .git STILL present at root (stale-drop by EXISTENCE, a mechanism integrity check, NOT an allowlist); resolve = pure lookup (no TOCTOU re-assert). The D1 bounds POLICY (assertAllowedRoot) is a BACKLOG endpoint-guard - re-wired at the ADD endpoint alongside requireAdmin (symmetric), NOT inside the registry mechanism.
  - [ ] **(registry)** Supersedes the R30.40 static ROOTS: the oosh root now lives in the dynamic registry, still resolving HOME/oosh by construction (R30.40 symlink-follow preserved).
  - [ ] **(gate)** GATE (DET-3x): register a root -> appears + persists across restart (load); an out-of-bounds root is rejected at the choke; version-bump.
  -> repoRegistry.register [uc:uuid:9b34f2fb-fc65-49c2-96ad-9b41853a68bc]
  -> repoRegistry.unregister [uc:uuid:3b5ff9d1-747a-4c9f-a160-929e9ad77ef0]
  -> repoRegistry.persist [uc:uuid:b27eecb3-c758-4f30-9fe7-c7f2b5012d02]
  -> repoRegistry.load [uc:uuid:2280431a-1e82-4271-8458-1c9401318558]
  -> repoRegistry.assertAllowedRoot [uc:uuid:f3f052a5-16e3-46e6-98df-d07c9ac63786]
  -> repoRegistry.assertAllowedUrl [uc:uuid:490aaaf7-69fb-4569-99cb-d8217aa89f63]
  -> repoRegistry.requireAdmin [uc:uuid:6ef3bee2-7f4c-4bf8-91cc-98b231e4d613]

- [ ] **R30.46 — Working-file diff: left=latest resolves to the on-disk working file (uncommitted), written on save, default-shown**
  [requirement:uuid:88e97c14-59cb-4223-a28b-b043d7bea6e2]
  > TRON (v0.7.66, 'most important currently'): prod.wo-da.de:4444/edit/otmux?repo=oosh&left=latest&right=dev&3way=1 - left=latest is UNSUPPORTED. left=latest must resolve to the current on-disk working file (uncommitted), be written on save, and be the default left shown when a diff opens.
  The 3-way/2-way diff supports the WORKING FILE as the left side. A 'latest'/'working' pseudo-ref resolves to the CURRENT ON-DISK working file (incl UNCOMMITTED changes) - read raw via /api/files, NOT git show <ref>:file; that file is WRITTEN on save (R30.38 save already PUTs the same file - CONFIRMED, no code change); and opening a diff DEFAULTS to comparing against the real working file (left=WORKING pinned, first thing shown). Architect design-working-file.md; read+write already exist so the req is small. Order W1->W2->W3->W4.
  **Acceptance criteria:**
  - [ ] **(resolve)** W1: a 'latest'/'working' pseudo-ref resolves to the CURRENT on-disk working file (incl uncommitted changes) - loadSide reads it raw via /api/files, NOT git show <ref>:file; resolveBase treats WORKING/'' as no-ref (2-way).
  - [ ] **(save)** W2: saving with left=working writes the on-disk working file (R30.38 save PUTs the same file) - the edit round-trips to disk. CONFIRMED no code change; locked by a TEST.
  - [ ] **(default)** W3 (THE FLIP): opening a diff DEFAULTS left=WORKING (+ right=HEAD), pinned and shown first - openFromParams/showDiff default-open left=working with NO auto-promote (a _pinnedLeft flag suppresses the R30.17 promote when left=working).
  - [ ] **(picker)** [DEFERRED - optional, SKIPPED out-of-scope v0.7.68] W4 (optional): the left picker is repurposed to choose the RIGHT compare-ref (since left is pinned to working).
  - [ ] **(gate)** GATE (DET-3x + Tron visual): open /edit/otmux?repo=oosh&left=latest&right=dev&3way=1 -> left shows the live working file (uncommitted visible), edit+save round-trips to disk, and a bare open defaults left=working; client-facing -> version-bump.
  -> diff.workingRef [uc:uuid:6c46d917-2973-42fd-8b16-de3f776eac72]
  -> diff.workingSaveRoundtrip [uc:uuid:eaf0cecc-42b0-42f1-b99c-e3c643df2a1e]
  -> diff.defaultWorkingLeft [uc:uuid:3fcf6237-fa79-4764-8653-e347129a3d74]

- [ ] **R30.48 — BACKLOG: re-activate repo-manager security hardening before multi-user / exposed deployment**
  [requirement:uuid:f06068ff-4b65-4f35-ad48-8864b8caf02f]
  > (Architect §10 deferred-risk, captured per robbin-po: V1=trusted-local; re-activate assertAllowedRoot+requireAdmin (+assertAllowedUrl if clone ships) before multi-user/exposed hardening.)
  DEFERRED-RISK (architect §10, Tron V1 scope): V1 repo-manager is TRUSTED-LOCAL - any same-origin/token client can register + read/save ANY server .git dir (add-local has ONLY the .git-present check; no path-allowlist, no admin-auth; clone is hidden). This is acceptable for the current single-trusted-user local deployment. BEFORE any multi-user / network-exposed / untrusted deployment, RE-ACTIVATE the built-but-deferred guards: assertAllowedRoot (D1 HOME-subtree+REPO_ALLOW realpath) + requireAdmin (D4 admin-key on all writes) + assertAllowedUrl (D2 clone-URL SSRF host-allowlist, if/when clone ships). The guard code is BUILT + gated (v0.7.67) - re-activation = wiring, not re-implementation.
  **Acceptance criteria:**
  - [ ] **(backlog)** [BACKLOG] Before exposed deployment: re-activate assertAllowedRoot (D1) so add-local paths are bounded to HOME-subtree + REPO_ALLOW (realpath-checked).
  - [ ] **(backlog)** [BACKLOG] Before exposed deployment: re-activate requireAdmin (D4) so all registry writes (register/unregister/clone) require the admin-key.
  - [ ] **(backlog)** [BACKLOG] If/when clone (R30.44) ships: re-activate assertAllowedUrl (D2) clone-URL SSRF host-allowlist (WHATWG new URL, https/ssh, no-password, username empty-or-git, exact-host).
  - [ ] **(backlog)** [BACKLOG] The V1=trusted-local posture is documented so the exposed-deployment transition cannot silently skip re-activation.

- [ ] **R30.49 — A dynamic repo is deletable from the manage panel; builtins are never removable**
  [requirement:uuid:37b58836-2e9c-4de3-ac53-6e3289b48203]
  > (Repo-manager V1 manage-panel delete, approved by robbin-po: a dynamic repo is deletable from the manage panel and disappears from the selector; a builtin is never removable; V1 read-auth, D4 deferred.)
  In the repo-manager manage panel, a DYNAMIC (user-added) repo MUST be deletable: deleting it removes it from the RepoRegistry (reusing the built pure-mechanism RepoRegistry.unregister) so it disappears from the repo selector. A BUILTIN repo (rawbin, oosh) MUST NEVER be removable - the delete affordance is absent/disabled for builtins and unregister no-ops/rejects a builtin key. V1 uses read-auth only (no admin-key); D4 requireAdmin stays deferred (R30.48 backlog) until multi-user/exposed. The server mechanism is already BUILT + gated (RepoRegistry.unregister, Impl 559b508b, R30.47 spine); re-activation = wiring the manage-panel delete button to unregister. BUILD holds for PO green-light to expert.
  **Acceptance criteria:**
  - [ ] **(delete)** A DYNAMIC (user-added) repo can be deleted from the manage panel via RepoRegistry.unregister; after delete it is gone from the RepoRegistry AND from the repo selector.
  - [ ] **(guard)** A BUILTIN repo (rawbin, oosh) is NEVER removable: the delete affordance is absent/disabled for builtins, and unregister no-ops/rejects a builtin key (builtins stay in the selector).
  - [ ] **(auth)** V1 delete uses read-auth only (no admin-key). D4 requireAdmin stays deferred (R30.48 backlog) until multi-user / exposed deployment.
  - [ ] **(gate)** GATE: add a dynamic repo -> delete it from the manage panel -> it is gone from selector + registry; attempt to delete a builtin -> rejected/absent (builtin still listed). Verified live.
  -> repoManage.deleteRemovable [uc:uuid:e496716b-d3bc-4274-82be-1082c361f70a]

- [ ] **R30.50 — 3-way merge toolbar: change-number indicator, apply-all-non-conflicting popup, guarded save**
  [requirement:uuid:32abea56-5631-41a1-8167-3b651c70c709]
  > TRON (via robbin-po): 3-WAY MERGE TOOLBAR optimization - (A) change-number indicator: replace 'X/Y open conflicts - modified' with '- N selected' = the current change/conflict number navigated to, live as he navigates. (B) 'Apply All Non-Conflicting' -> popup (automagic) with 2 modes: accept-all so CENTER matches the LEFT file (left wins) / accept-all so CENTER matches the RIGHT file (right wins). (C) Save only saves when 0 open conflicts; if conflicts remain Save jumps to the next unresolved conflict; after a successful save the Save button turns GREEN; on any subsequent change it returns to DEFAULT.
  Tron 3-way-merge TOOLBAR optimization, 3 sub-features. (A) CHANGE-NUMBER INDICATOR: replace the toolbar 'X/Y open conflicts - modified' with '- N selected' where N is the CURRENT change/conflict number navigated to (up/down nav position), so the user sees WHICH change# he is on; live-updates as he navigates. (B) APPLY-ALL-NON-CONFLICTING POPUP: the 'Apply All Non-Conflicting' action opens a popup (automagic) with 2 auto-resolve modes - (1) accept-all so CENTER matches the LEFT file (LEFT wins), (2) accept-all so CENTER matches the RIGHT file (RIGHT wins). (C) GUARDED SAVE: Save only actually saves when 0 open conflicts; if conflicts remain, Save instead JUMPS to the next unresolved conflict (guides the user); after a successful save the Save button turns GREEN; on any subsequent change it returns to DEFAULT (unsaved). Minted scenario-first (capture-now, build-after UC7/delete). Methods design-ahead PROPOSED on RbDiffEditor - FLAGGED for architect design-derive (A may impl-edit openChangeCount; B naming-tension non-conflicting-vs-all-by-side; C1 wraps save+jump).
  **Acceptance criteria:**
  - [ ] **(indicator)** The toolbar composes '- N selected . X/Y open' (KEEP the open-conflict count per Tron) where N is the CURRENT change/conflict number navigated to (nav position).
  - [ ] **(indicator)** N live-updates as the user navigates changes up/down.
  - [ ] **(applyall)** The '✨ Apply All' button (relabelled from 'Apply All Non-Conflicting' per Tron ruling) opens a popup (automagic) offering 3 auto-resolve modes: 'Non-conflicting only' (existing applyAllNonConflicting - conflicts remain), 'All - Local wins', and 'All - Repo wins'.
  - [ ] **(applyall)** Mode 'All - Local wins': accept-all so CENTER matches the LEFT file (Local/left wins - resolves conflicts too, via applyAllFromSide).
  - [ ] **(applyall)** Mode 'All - Repo wins': accept-all so CENTER matches the RIGHT file (Repo/right wins - resolves conflicts too, via applyAllFromSide).
  - [ ] **(applyall)** [RESOLVED - Tron ruling] 3-MODE ADD (not replace): the 'Apply All' popup offers 'Non-conflicting only' (existing 91c452ae kept) + 'All-Local wins' + 'All-Repo wins'; button relabelled 'Apply All'.
  - [ ] **(save)** Save only actually SAVES when there are 0 open conflicts (all resolved).
  - [ ] **(save)** If conflicts REMAIN, pressing Save instead JUMPS to the next UNRESOLVED conflict (and does not save).
  - [ ] **(save)** After a successful save, the Save button turns GREEN (saved indicator).
  - [ ] **(save)** On ANY subsequent change, the Save button returns to DEFAULT (unsaved indicator).
  - [ ] **(gate)** GATE (screenshot + behavior, DET-3x, at Tron's viewport): navigate -> indicator shows current change#; apply-all left/right -> CENTER matches that side; Save with conflicts -> jumps to next unresolved; Save at 0 conflicts -> saves + button GREEN; then edit -> button DEFAULT. Per architect design + Tron visual.
  -> merge.changeNumberIndicator [uc:uuid:0feaff70-e51d-464c-8874-f5ca16966094]
  -> merge.applyAllFromSide [uc:uuid:f27ee373-4bb4-4913-88ec-9855d5c3523f]
  -> merge.saveGuardedOrJump [uc:uuid:787e7755-4529-459e-9c53-803301d4b3cb]
  -> merge.saveButtonState [uc:uuid:3b9c1f72-50dd-44f4-9bb0-0a8fcb5b069b]
  -> merge.applyAllMenu [uc:uuid:6780cb2e-42fb-46d8-9061-05d117304d47]

- [ ] **R30.51 — Changes-focused code-folding in the 3-way merge editors**
  [requirement:uuid:41a6ab2c-90ce-49cf-b975-ceae469e6ea2]
  > TRON (via robbin-po): CHANGES-FOCUSED CODE-FOLDING in the 3-way merge editors - (1) expand/collapse folding SYNCS across all THREE editors (Local/Center/Repository), fold a region in one -> all three fold aligned; (2) a foldable region that CONTAINS a change/conflict CANNOT be collapsed (stays expanded); (3) initial state on open = FULLY auto-collapsed EXCEPT the change-holding regions are expanded (changes-only view).
  Tron feature: changes-focused CODE-FOLDING in the 3-way merge editors. (1) Expand/collapse folding SYNCS across all THREE editors (Local/Center/Repository) - fold a region in one, all three fold aligned. (2) A foldable region that CONTAINS a change/conflict CANNOT be collapsed (stays expanded - changes are never hidden). (3) Initial state on open = FULLY auto-collapsed EXCEPT the change-holding regions are expanded (a changes-only view). Minted scenario-first; Monaco-folding method-set is DESIGN-AHEAD PROPOSED on RbDiffEditor - the architect is deriving the Monaco-folding impl approach in parallel; align the impl-AC on their confirm (re-point R30.11).
  **Acceptance criteria:**
  - [ ] **(fold)** Expand/collapse folding SYNCS across all THREE editors (Local/Center/Repository): folding a region in one pane folds the ALIGNED region in all three.
  - [ ] **(guard)** A foldable region that CONTAINS a change/conflict CANNOT be collapsed - it stays expanded (changes are never hidden by folding).
  - [ ] **(initial)** On open, the initial fold state is FULLY auto-collapsed EXCEPT the change-holding regions, which are expanded (a changes-only view).
  - [ ] **(impl)** Fold state = single shared _collapsedGaps Set; applyFold projects it via editor.setHiddenAreas() on all 3 editors (one state -> 3 projections; no per-editor folding model). Aligned by conflicts[] per-editor ranges (R30.16 row-alignment via getTopForLineNumber). Reflows spline+gutters after.
  - [ ] **(impl)** Native folding DISABLED (folding:false). Only computeFoldRegions gaps (complement of conflicts[]) are collapsible; a change region has no collapse control = non-collapsible by construction.
  - [ ] **(impl)** On computeMergedCenter tail (conflicts[] ready): _collapsedGaps=all gaps -> applyFold -> changes-only view; expand reveals context on demand (view-zone '... N lines . expand').
  - [ ] **(flag)** [DESIGN-FLAG - PO/Tron] Context margin K around each change region in computeFoldRegions: K=0 (pure changes-only) .. K=3 (GitHub-like context). Architect recommends K=3. Ruling affects computeFoldRegions gap boundaries.
  - [ ] **(gate)** GATE (screenshot + behavior, DET-3x, at Tron's viewport): open a 3-way diff with changes -> only change regions expanded (rest collapsed); fold a NON-change region in one pane -> all 3 fold aligned; attempt to collapse a CHANGE region -> stays expanded.
  -> merge.foldSyncAcrossPanes [uc:uuid:5dedb343-9457-4f02-bbc6-023f8fe42c78]
  -> merge.changeRegionNotCollapsible [uc:uuid:d5534ec3-c61b-4a70-b63b-fd4010947d02]
  -> merge.changesOnlyInitialFold [uc:uuid:47fbd1d7-9890-484c-b1ae-d13947f5a3a0]

- [ ] **R30.52 — 3-way merge toolbar re-layout: 'N selected' own line, 'X/Y open' buffer between ▼ and ✓ (mis-click prevention)**
  [requirement:uuid:989471e8-c5f0-44fc-831f-4b1d1ad55d0c]
  > TRON (via robbin-po): R30.50 toolbar re-layout to make a wrong click harder - (1) 'N selected' stays INLINE (same row as Apply All + nav), NOT wrapped; (2) MOVE 'X/Y open conflicts' DOWN to BETWEEN ▼ and ✓ as a non-clickable buffer above ✓. Both counts still shown, repositioned. (▼ and ✓ currently adjacent -> mis-click ✓ when aiming ▼.)
  Re-layout the 3-way merge toolbar so a wrong click is harder. Currently the compose 'N selected . X/Y open conflicts' sits on one line under 'Apply All', then ▲ ▼ ✓ - so ▼ and ✓ are adjacent (mis-click ✓ when aiming ▼). CHANGE: (1) 'N selected' renders INLINE (same horizontal row as Apply All + nav controls), NOT wrapped onto its own line; (2) MOVE the 'X/Y open conflicts' text DOWN to BETWEEN ▼ and ✓ as a non-clickable buffer above ✓. Both counts still shown, repositioned. Refines R30.50-A (renderMergeGutter/toolbar DOM order); impl-edit on the built renderMergeGutter (Impl e24dc98a). R30.50 stays closed (closure-freeze); this is a distinct new atom.
  **Acceptance criteria:**
  - [ ] **(layout)** 'N selected' renders INLINE on the SAME horizontal row as 'Apply All' + the nav controls (not wrapped onto its own line). [CORRECTED 2026-07-19: 'own line' was a mis-read of Tron's horizontal-toolbar ASCII stack.]
  - [ ] **(layout)** The 'X/Y open conflicts' text is MOVED DOWN to render BETWEEN the ▼ (down-nav) and ✓ (resolve) controls, as a NON-CLICKABLE buffer above ✓ (so a ▼ mis-click does not hit ✓).
  - [ ] **(layout)** Both counts (N selected + X/Y open conflicts) are still shown - repositioned, not removed.
  - [ ] **(gate)** GATE (screenshot+behavior): 'N selected' INLINE on the same row as Apply All + nav (not wrapped); 'X/Y open conflicts' between ▼ and ✓ as a non-clickable buffer; both counts visible; ▼ and ✓ no longer adjacent.
  -> merge.toolbarMisclickLayout [uc:uuid:dce46e2a-c341-4251-be26-40497877e407]

- [ ] **R30.53 — Changes-focused code-folding via NATIVE Monaco collapse/expand (fold by method boundaries)**
  [requirement:uuid:ac3338b6-07a1-4fa6-9040-d9144db16ee8]
  > TRON (via robbin-po): R30.51 folding was BAD+BROKEN (setHiddenAreas hide-lines REJECTED) - revert + redesign on STANDARD Monaco collapse/expand: (1) Monaco NATIVE folding (chevron collapse/expand + '...' placeholder, NOT setHiddenAreas); (2) fold by METHOD boundaries; (3) collapse corresponding UNCHANGED method-blocks SYNCED across all 3 editors, change-regions stay expanded.
  Tron REDESIGN of R30.51 (which used setHiddenAreas hide-lines - REJECTED, broke mobile, reverted to v0.7.76). Same changes-focused-folding INTENT, correct mechanism: (1) Monaco NATIVE folding - standard chevron collapse/expand + '...' placeholder (NOT setHiddenAreas); (2) fold by METHOD boundaries; (3) collapsing an UNCHANGED method-block collapses the corresponding block SYNCED across all 3 editors, change-containing method-blocks STAY EXPANDED. Native-Monaco method-set is DESIGN-AHEAD PROPOSED on RbDiffEditor - architect redesigning the impl approach in parallel; align the impl-AC on confirm (re-point R30.11). SUPERSEDES R30.51 (rejected setHiddenAreas chain).
  **Acceptance criteria:**
  - [ ] **(fold)** Code-folding uses Monaco NATIVE folding: standard chevron collapse/expand + '...' placeholder for a collapsed region (NOT setHiddenAreas hide-lines).
  - [ ] **(fold)** Foldable regions are the METHOD boundaries - folding collapses a whole method block.
  - [ ] **(sync)** Collapsing an UNCHANGED method-block collapses the corresponding block SYNCED across all 3 editors (Local/Center/Repository); method-blocks containing a change/conflict STAY EXPANDED.
  - [ ] **(impl)** Native Monaco folding (folding:true) + custom FoldingRangeProvider at method boundaries; collapse programmatic via editor.getContribution('editor.contrib.folding').getFoldingModel().setCollapsed (pinned monaco 0.52.2). Chevron + collapsed '…' placeholder — NOT setHiddenAreas.
  - [ ] **(impl)** Unchanged method-block collapse-state mirrored across all 3 (initial + foldingModel.onDidChange propagate, re-entrancy-guarded); spline/gutters reflow after (getTopForLineNumber fold-aware).
  - [ ] **(impl)** Methods overlapping conflicts[] excluded from collapse -> change-methods stay expanded+contiguous (why v2 ribbons stay clean vs v1).
  - [ ] **(impl)** Native fold chevron + '…' are TOUCH-tappable (no hover-only); tap-to-fold/unfold + synced unchanged-collapse work on the mobile viewport across the 3 panes. Gate on device (the setHiddenAreas mobile break is why v2 exists).
  - [ ] **(gate)** GATE (screenshot+behavior, DET-3x incl 390 mobile): native chevrons collapse/expand method-blocks with '...' placeholder; collapse an unchanged method-block -> all 3 collapse synced; change-containing method-blocks stay expanded. (Mobile MUST work - the setHiddenAreas regression that broke mobile is the reason for the redesign.)
  -> merge.nativeFoldByMethod [uc:uuid:fcf8b48f-8e84-47d4-905b-4cdfb355e528]
  -> merge.syncUnchangedCollapse [uc:uuid:8451731c-bb67-43ab-9a40-27a43e817d77]
  -> merge.changeMethodsStayExpanded [uc:uuid:48d56602-bfa0-4df3-ae48-81f65e936430]
