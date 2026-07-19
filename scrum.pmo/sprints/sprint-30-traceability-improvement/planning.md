<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 30 Planning — Sprint 30 — Traceability Improvement

## Sprint Goal

Traceability tree — exactly TWO top-level nodes: 'CurrentSprint: Sprint <N>' with 3 EAGER children (Current / Last Completed / Next Backlog) + a 'Sprints 01-<N>' collection (collapsed, count badge). Structure-eager / payload-lazy: sprint nodes eager, their TASKS load only when the sprint is expanded — so the tree scales as sprints grow (same eager-structure/lazy-payload pattern as R26 federation).

**Status:** Planned

## Task Ordering

Tasks are listed in **numeric order** (T30.1 -> T30.36). Intentional gaps + notes:
- **T30.8** = unused number (never minted, clean skip).
- **T30.31** = BACKLOG (unblocked but unscheduled — no spec, not a Tron priority; no task by design).
- **T30.32** = SUPERSEDED by R30.34 (SVG connector boxes were Tron-rejected -> always-3-columns spline); no task by design.
- **T30.6.1-6.7** are children of the R30.6 diff/merge-editor umbrella (sub-numbered).
- Creation order (which differs from numeric — e.g. the #126 backfills T30.18/20/21/22/28/30/33 and the R30.25-B split T30.26 were minted late) is preserved in git history + each task's createdAt. See scrum.pmo/design-notes/s30-task-order-audit.md.

## Tasks

- [x] [Task 30.1: Traceability tree — CurrentSprint top + eager-lazy Sprints collection](./task-30.1-traceability-tree-eager-lazy.md)
- [x] [Task 30.2: Eager child-count badges](./task-30.2-eager-child-count-badges.md)
- [x] [Task 30.3: Sprint selection populates the detail drawer](./task-30.3-sprint-selection-detail-drawer.md)
- [x] [Task 30.4: Lobby shows the real profile name (not random User NNN)](./task-30.4-lobby-name-from-profile.md)
- [x] [Task 30.5: Editor file pane shows the full project filetree](./task-30.5-editor-filetree.md)
- [x] [Task 30.6.1: 3-way diff/merge view](./task-30.6.1-3way-view.md)
- [x] [Task 30.6.2: File selectors (reuse RbFileTree)](./task-30.6.2-file-selectors.md)
- [x] [Task 30.6.3: Per-hunk take-over](./task-30.6.3-hunk-takeover.md)
- [x] [Task 30.6.4: Git ref chooser](./task-30.6.4-git-chooser.md)
- [x] [Task 30.6.5: Swap sides](./task-30.6.5-swap.md)
- [x] [Task 30.6.6: [Open Diff] toolbar button (editor entry point)](./task-30.6.6-open-diff-entry.md)
- [x] [Task 30.6.7: OOSH-repo targeting via RepoRegistry allowlist](./task-30.6.7-oosh-repo-targeting.md)
- [x] [Task 30.7: Uniform ref-guard across editor targeting](./task-30.7-uniform-ref-guard.md)
- [ ] [Task 30.9: IntelliJ-faithful base-aware 3-way merge view](./task-30.9-intellij-3way-merge.md)
- [x] [Task 30.10: Right pane defaults to the files git history](./task-30.10-right-git-history-default.md)
- [x] [Task 30.11: Scoreboard measures the walked chain](./task-30.11-scoreboard-walked-chain.md)
- [x] [Task 30.12: 2-way take-over (no-base fallback)](./task-30.12-2way-takeover.md)
- [x] [Task 30.13: IntelliJ inter-pane merge gutters + connectors](./task-30.13-gutters-connectors.md)
- [ ] [Task 30.14: Service-Worker auto-update (visible deploys)](./task-30.14-sw-auto-update.md)
- [x] [Task 30.15: Right-history default meaningful + usable](./task-30.15-right-history-usable.md)
- [x] [Task 30.16: IntelliJ 3-pane line alignment + center](./task-30.16-3pane-alignment.md)
- [x] [Task 30.17: 3-pane merge functional correctness](./task-30.17-merge-correctness.md)
- [x] [Task 30.18: requirements.md is a generated view (extend generate-sprint-md)](./task-30.18-requirements-md-generated-view.md)
- [x] [Task 30.19: 3-pane change-block highlights (source panes too, not just center)](./task-30.19-side-pane-change-blocks.md)
- [x] [Task 30.20: Detail-drawer mode-aware close (in-room X->chat, trace X->minimize)](./task-30.20-drawer-mode-aware-close.md)
- [x] [Task 30.21: Drawer non-sprint detail render (graph-independent /api/ior fetch-fallback)](./task-30.21-drawer-graph-independent-detail.md)
- [x] [Task 30.22: Drawer select opens content-visible (not peek-clipped)](./task-30.22-drawer-select-content-visible.md)
- [x] [Task 30.23: Diff completeness — 3-way one-sided changes surfaced](./task-30.23-diff-completeness-one-sided.md)
- [x] [Task 30.24: 3-way diff is URL-addressable (deep-linkable + shareable)](./task-30.24-url-addressable-diff.md)
- [x] [Task 30.25: Picking a RIGHT ref preserves the LEFT side (no blanking)](./task-30.25-right-pick-preserves-left.md)
- [x] [Task 30.26: Deep-link right-pick preserves the user's pick (BUG-1)](./task-30.26-deeplink-right-pick-preserved.md)
- [x] [Task 30.27: 3-pane rows align — corresponding lines share one visual row](./task-30.27-three-pane-row-alignment.md)
- [x] [Task 30.28: Deploy commits atomically - served == committed == HEAD (no phantom-version window)](./task-30.28-atomic-deploy-invariant.md)
- [x] [Task 30.29: 3-pane rows resync at modification regions (non-changed side = base slice, no cumulative drift)](./task-30.29-modification-region-resync.md)
- [x] [Task 30.30: 3-pane rows re-anchor to 0px at every blank/stable line (no persistent residual)](./task-30.30-absolute-blank-reanchor.md)
- [x] [Task 30.33: Vendor diff3 emits pure-deletion regions so alignment resyncs (send.verified)](./task-30.33-diff3-deletion-region-resync.md)
- [x] [Task 30.34: 3-way merge is ALWAYS 3 side-by-side columns with continuous splines](./task-30.34-always-3-columns-spline.md)
- [ ] [Task 30.35: Diff coloring by kind + per-block merge-action MATRIX (WORKS/BROKEN validation)](./task-30.35-coloring-and-merge-action-matrix.md)
- [ ] [Task 30.36: Diff-nav aids — brighter current-change on up/down + open-changes count](./task-30.36-diff-nav-aids.md)
- [ ] [Task 30.37: Per-change RESOLVED-state toggle (green checkmark, outlined=unresolved / solid=resolved)](./task-30.37-resolved-state-toggle.md)
- [ ] [Task 30.38: Merge Save writes to the diff's repo / current branch (no save-404)](./task-30.38-merge-save-repo-routing.md)
- [ ] [Task 30.39: Deep-link ?repo seeds BOTH left and right repo selectors on load](./task-30.39-deeplink-seeds-both-selectors.md)
- [ ] [Task 30.40: Center Result header = targeted repo's ACTUAL current branch (dynamic)](./task-30.40-center-header-actual-branch.md)
- [ ] [Task 30.41: 3-way merge editor shows per-filetype syntax highlighting](./task-30.41-per-filetype-syntax-highlight.md)
- [ ] [Task 30.42: Repo selector first option is 'Add repository' → opens add/manage dialog](./task-30.42-add-repository-option.md)
- [ ] [Task 30.43: Add a repository by server-local path](./task-30.43-add-repo-by-local-path.md)
- [ ] [Task 30.44: Add a repository by clone URL + checkout location](./task-30.44-add-repo-by-clone-url.md)
- [ ] [Task 30.45: Manage panel — repo / local path / current branch / switchable worktrees](./task-30.45-repo-manage-panel.md)
- [ ] [Task 30.46: Working-file diff — left=latest resolves to the on-disk working file (uncommitted)](./task-30.46-working-file-left-latest.md)
- [ ] [Task 30.47: RepoRegistry — dynamic, persisted, bounds-checked registry (repo add/manage foundation)](./task-30.47-repo-registry-foundation.md)
- [ ] [Task 30.49: Delete a dynamic repo from the manage panel (builtins never removable)](./task-30.49-delete-dynamic-repo.md)
