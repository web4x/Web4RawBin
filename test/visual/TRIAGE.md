# test/visual triage (R42.4, T42.4)

Every script in this folder was run on 2026-11-22 against an isolated server (never prod) and sorted into one of the groups below. The goal of R42.4 is that this folder disappears: each script either moves into one of the two suites (vitest or Playwright e2e) or is deleted with a reason.

How it was run: node-only scripts with `npx tsx`; scripts that talk to a server against a fresh isolated server (`DATA_DIR` in /tmp, HTTPS 4445, the default of `_target.mjs`), 90 s timeout each. WebKit is not installed in the sandbox, so the WebKit gates were not run to the end.

The 124 screenshot PNGs that used to live here (159 MB) were referenced by no file and were deleted; new screenshots are git-ignored.

| Group | Scripts | What happens next |
|---|---:|---|
| Runs in CI (unit suite) | 47 | Keep. Runs in test/vitest/visual-node-gates.test.ts. |
| Runs in CI (e2e suite) | 8 | Keep. Runs in test/e2e/visual-server-gates.spec.ts against the isolated e2e server. |
| Needs headed WebKit (iPhone) | 212 | Convert to a Playwright spec (webkit project) when the screen it checks is touched; delete if an e2e spec already covers it. Can't run in the sandbox. |
| Uses the owner token | 70 | Violates R42.3 (no owner token in tests). Rewrite with SystemTester/SystemTester2 where the check still matters, otherwise delete. |
| Green, but mints random users or tokens | 7 | Violates R42.3. Rewrite with SystemTester/SystemTester2, then move into CI. |
| Green locally, red on the e2e server | 2 | Hardcodes SystemTester's old token; switch to test/e2e/identities.ts, then move into CI. |
| Needs prod data or files outside the repo | 24 | One-off incident probe tied to prod data, /tmp files or other machines. Delete. |
| Red: code drift | 4 | Imports or calls something that no longer exists. Delete unless the behaviour still matters, then rewrite as a vitest test. |
| Red: assertion fails | 59 | Stale expectation or a real regression. Check each against its requirement before deleting. |
| Green, not a real check | 3 | Exits 0 without reaching the server (no target, missing input). Delete or rewrite. |

Total: 436 scripts.

## Runs in CI (unit suite) (47)

Keep. Runs in test/vitest/visual-node-gates.test.ts.

`marker-reconcile.ts`, `r-test-room-single-source-lint.mjs`, `r3018-requirements-view-gate.mjs`, `r318fm-server-gate.ts`, `r3211v-viewkind-facet-gate.ts`, `r322-ts-to-model-gate.ts`, `r325-golive-oracle-gate.ts`, `r326-edges-gate.ts`, `r327-puml-roundtrip-gate.ts`, `r3720-inc1-verb-dispatch-lint.mjs`, `r3736-qa-switch-state-lint.mjs`, `r3741-selfheal-onread-gate.ts`, `r3742-unit-controller-gate.ts`, `r3743c-orphaned-verdict-scan.ts`, `r376-autoregen-oncommit-gate.ts`, `r401-resolvecr-gate.ts`, `r4018b-stale-steer-log-gate.ts`, `r401d-rollup-parent-gate.ts`, `r402-deployment-node-gate.ts`, `r4037-context-actions-gate.ts`, `r405-dedup-facet-gate.mjs`, `r4050-sprint-order-invariant.mjs`, `r4055-boot-currency-gate.mjs`, `r4057-bareuuid-property.mjs`, `r4059-actions-applicability-gate.ts`, `r4059-badge-glyph-single-source-lint.mjs`, `r406-buildtypedmodel-gate.ts`, `r4081-one-physical-store-lint.mjs`, `r4081d-splitbrain-write-lint.mjs`, `r4081t3720-openclosed-lint.mjs`, `r4081t3720-render-openclosed-lint.mjs`, `r4084-render-ownership-lint.mjs`, `r40x-pin-derivation-gate.ts`, `rc1-sprintpin-resolver-gate.ts`, `rc1refine-frozen-cancelled-metabite.ts`, `rc2-reconcile-all-write-gate.mjs`, `rc2b-prune-orphans-gate.mjs`, `rc3-consistency-guard-metabite.ts`, `rc5-taskstatus-bite-gate.ts`, `rc7-migrate-board-bite-gate.ts`, `rc7b-provecomplete-failclosed-bite-gate.ts`, `rc7c-atomicity-scope-bite-gate.ts`, `rc7e-extractids-prose-crossref-bite.ts`, `rc7f-narrative-preservation-bite.ts`, `rcd-singularchain-excludes-gate.ts`, `rcd-templates-bug-changerequest-gate.ts`, `rdiagram-addview-strip-gate.mjs`

## Runs in CI (e2e suite) (8)

Keep. Runs in test/e2e/visual-server-gates.spec.ts against the isolated e2e server.

`r224-clickable-png-gate.mjs`, `r259-t261-federated-ior-gate.mjs`, `r307-uniform-ref-guard-gate.mjs`, `r364-trace-mechanism-gate.ts`, `r40106-fixa-zero-vanished-probe.mjs`, `r40106-inc7-delete-baseline-gate.mjs`, `r88df8e4e-webitem-repair-gate.mjs`, `rsw-post-cache-gate.mjs`

## Needs headed WebKit (iPhone) (212)

Convert to a Playwright spec (webkit project) when the screen it checks is touched; delete if an e2e spec already covers it. Can't run in the sandbox.

| Script | First error line |
|---|---|
| `drawer-gate.mjs` | name: 'Error' |
| `prod-functionality-sweep.mjs` | name: 'Error' |
| `r-dndtail-confirms.mjs` | name: 'Error' |
| `r-livetransport-probe.mjs` | name: 'Error' |
| `r2030-final-gate.mjs` | name: 'Error' |
| `r2031-vcard-gate.mjs` | name: 'Error' |
| `r206a28bc-url-naming-gate.mjs` | name: 'Error' |
| `r211-vcard-persist-gate.mjs` | name: 'Error' |
| `r212-lobby-livename-gate.mjs` | name: 'Error' |
| `r219-file-detail-layout-gate.mjs` | name: 'Error' |
| `r221-detail-chain-gate.mjs` | name: 'Error' |
| `r222-dblclick-zoom-gate.mjs` | name: 'Error' |
| `r223-source-links-gate.mjs` | name: 'Error' |
| `r225-audio-youtube-gate.mjs` | name: 'Error' |
| `r2281-mp3-drop-upload-gate.mjs` | name: 'Error' |
| `r252-webitem-gate.mjs` | name: 'Error' |
| `r253-ios-email-gate.mjs` | name: 'Error' |
| `r254-email-tree-gate.mjs` | name: 'Error' |
| `r254b-readonly.mjs` | name: 'Error' |
| `r255-v0694-gate.mjs` | name: 'Error' |
| `r256-v0697-gate.mjs` | name: 'Error' |
| `r257-v0698-gate.mjs` | name: 'Error' |
| `r258-v070-gate.mjs` | name: 'Error' |
| `r260-t262-federated-dnd-gate.mjs` | name: 'Error' |
| `r264-v076-task-detail-gate.mjs` | name: 'Error' |
| `r265-v078-per-task-md-gate.mjs` | name: 'Error' |
| `r278-drawer-close-minimize-gate.mjs` | name: 'Error' |
| `r279-drawer-lifecycle-gate.mjs` | name: 'Error' |
| `r301-eager-lazy-tree-gate.mjs` | name: 'Error' |
| `r3010-file-history-gate.mjs` | name: 'Error' |
| `r3013-gutters-ribbons-gate.mjs` | name: 'Error' |
| `r3013-repro-room-2way.mjs` | name: 'Error' |
| `r3014-livecatch-tool.mjs` | name: 'Error' |
| `r3014-network-first-gate.mjs` | name: 'Error' |
| `r3014-sw-update-harness.mjs` | name: 'Error' |
| `r3015-meaningful-default-gate.mjs` | name: 'Error' |
| `r3016-accept-actions-gate.mjs` | name: 'Error' |
| `r3016-intellij-layout-gate.mjs` | name: 'Error' |
| `r3017-left-history-gate.mjs` | name: 'Error' |
| `r3019-side-blocks-gate.mjs` | name: 'Error' |
| `r302-tree-badge-drawer-gate.mjs` | name: 'Error' |
| `r3020-drawer-close-gate.mjs` | name: 'Error' |
| `r3021-select-content-gate.mjs` | name: 'Error' |
| `r3022-visible-on-select-gate.mjs` | name: 'Error' |
| `r3023-diff-completeness-gate.mjs` | name: 'Error' |
| `r3024-deeplink-diff-gate.mjs` | name: 'Error' |
| `r3025-deeplink-right-change-gate.mjs` | name: 'Error' |
| `r3025-right-pick-preserves-left-gate.mjs` | name: 'Error' |
| `r3027-three-pane-alignment-gate.mjs` | name: 'Error' |
| `r3032-connector-bands-gate.mjs` | name: 'Error' |
| `r3034-responsive-widths-gate.mjs` | name: 'Error' |
| `r3034-spline-pixel-gate.mjs` | name: 'Error' |
| `r3035-action-matrix-probe.mjs` | name: 'Error' |
| `r3035-both-versions-gate.mjs` | name: 'Error' |
| `r3035-coloring-gate.mjs` | name: 'Error' |
| `r3035-perside-alignment-gate.mjs` | name: 'Error' |
| `r3035-save404-deeplink-gate.mjs` | name: 'Error' |
| `r3035-six-polish-gate.mjs` | name: 'Error' |
| `r3035-two-per-side-verify.mjs` | name: 'Error' |
| `r3036-brighter-current-gate.mjs` | name: 'Error' |
| `r3036-navaids-gate.mjs` | name: 'Error' |
| `r3037-derived-override-gate.mjs` | name: 'Error' |
| `r3037-resolution-toggle-gate.mjs` | name: 'Error' |
| `r3038-two-block-ribbons-gate.mjs` | name: 'Error' |
| `r304-lobby-profile-name-gate.mjs` | name: 'Error' |
| `r3040-usability-sweep.mjs` | name: 'Error' |
| `r3042-add-repo-dialog-gate.mjs` | name: 'Error' |
| `r3042-save-encoding-probe.mjs` | name: 'Error' |
| `r3043-syntax-highlight-gate.mjs` | name: 'Error' |
| `r3043-uc4-add-local-gate.mjs` | name: 'Error' |
| `r3045-uc7-worktree-switch-gate.mjs` | name: 'Error' |
| `r3049-delete-integrity-gate.mjs` | name: 'Error' |
| `r3049-delete-repo-gate.mjs` | name: 'Error' |
| `r305-edit-filetree-gate.mjs` | name: 'Error' |
| `r3050-merge-actions-gate.mjs` | name: 'Error' |
| `r3051-changes-folding-gate.mjs` | name: 'Error' |
| `r3052-toolbar-layout-gate.mjs` | name: 'Error' |
| `r3052b-selected-visible-gate.mjs` | name: 'Error' |
| `r3053-native-fold-sync-gate.mjs` | name: 'Error' |
| `r3053b-leftpane-parity-gate.mjs` | name: 'Error' |
| `r3053c-fold-affordance-gate.mjs` | name: 'Error' |
| `r306-diff-editor-gate.mjs` | name: 'Error' |
| `r3066-open-diff-gate.mjs` | name: 'Error' |
| `r309-three-way-merge-gate.mjs` | name: 'Error' |
| `r30merge-visual-gate.mjs` | name: 'Error' |
| `r311-feature-grants-render-gate.mjs` | name: 'Error' |
| `r3110-owner-interactive-gate.mjs` | name: 'Error' |
| `r3110mode-resolve-gate.mjs` | name: 'Error' |
| `r3111-tree-deep-nest-gate.mjs` | name: 'Error' |
| `r3112-inroom-gate.mjs` | name: 'Error' |
| `r3112c-radio-gate.mjs` | name: 'Error' |
| `r3112d-radio-dedupe-gate.mjs` | name: 'Error' |
| `r3112e-native-radio-probe.mjs` | name: 'Error' |
| `r3112f-radio-clean-gate.mjs` | name: 'Error' |
| `r3116-readonly-notice-gate.mjs` | name: 'Error' |
| `r311a-owner-accept-gate.mjs` | name: 'Error' |
| `r315-drawer-mount-gate.mjs` | name: 'Error' |
| `r3157-drawer-position-gate.mjs` | name: 'Error' |
| `r315composed-regression-gate.mjs` | name: 'Error' |
| `r316-select-open-flow-gate.mjs` | name: 'Error' |
| `r318-feature-access-gate.mjs` | name: 'Error' |
| `r318b-feature-flip-gate.ts` | name: 'Error' |
| `r318e-fm-children-listall-gate.ts` | VERIFY-BY-PID: pid=29323 (expected 1314979) fresh=false |
| `r318fm-client-gate.mjs` | name: 'Error' |
| `r319-dry-drawer-badge-gate.mjs` | name: 'Error' |
| `r3195-tree-render-gate.mjs` | name: 'Error' |
| `r319bp-breakpoint-gate.mjs` | name: 'Error' |
| `r319bp2-fullwidth-scrollpast-gate.mjs` | name: 'Error' |
| `r31fm-functional-gate.mjs` | name: 'Error' |
| `r31r2-rendered-gate.mjs` | name: 'Error' |
| `r31r3-rendered-gate.mjs` | name: 'Error' |
| `r31r4-owner-interactive-gate.mjs` | name: 'Error' |
| `r31sliced-feature-grants-gate.mjs` | name: 'Error' |
| `r31t4-drawer-ux-gate.mjs` | name: 'Error' |
| `r31t4-elem-probe.mjs` | name: 'Error' |
| `r31t4-min-probe.mjs` | name: 'Error' |
| `r31t4-timing-probe.mjs` | name: 'Error' |
| `r3210-modelelement-drawer-gate.mjs` | name: 'Error' |
| `r323-model-tree-gate.mjs` | name: 'Error' |
| `r324-diagram-gate.ts` | name: 'Error' |
| `r325-golive-live-gate.mjs` | iter 1: v0.8.5=false drop=false(roots=undefined wrote=undefined) idempotent=false treePopulated=false[] widgetMembers=false diagramInStore=f |
| `r332a-rawbin-m1-gate.mjs` | name: 'Error' |
| `r335-item1-gate.mjs` | name: 'Error' |
| `r335b-item1-adddiagram-gate.mjs` | name: 'Error' |
| `r335c-item1-reveal-gate.mjs` | name: 'Error' |
| `r3361-empty-addview-gate.mjs` | name: 'Error' |
| `r3361-empty-repro.mjs` | name: 'Error' |
| `r3365-drawer-actions-gate.mjs` | name: 'Error' |
| `r3365-drawer-actions-independent-gate.mjs` | name: 'Error' |
| `r339-broadcast-active-diagram-gate.mjs` | name: 'Error' |
| `r34-webkit-sweep-gate.mjs` | name: 'Error' |
| `r343-delete-unit-integrity-gate.mjs` | name: 'Error' |
| `r34a2-file-folder-webkit-gate.mjs` | name: 'Error' |
| `r34e-universal-bar-webkit-gate.mjs` | name: 'Error' |
| `r35-foundation-webkit-gate.mjs` | name: 'Error' |
| `r351-universal-actions-webkit-gate.mjs` | name: 'Error' |
| `r3537-derived-resolution-verify.mjs` | name: 'Error' |
| `r354-parity-webkit-gate.mjs` | name: 'Error' |
| `r365-usedin-webkit-gate.mjs` | name: 'Error' |
| `r365b-single-resync-gate.mjs` | name: 'Error' |
| `r365c-whereused-mechanism-gate.ts` | name: 'Error' |
| `r372-discover-gate.mjs` | name: 'Error' |
| `r372-discover-related-gate.mjs` | name: 'Error' |
| `r3720-detail-codetype-sample.mjs` | name: 'Error' |
| `r3720-detail-render-sample-gate.mjs` | name: 'Error' |
| `r3720-file-detail-recheck.mjs` | name: 'Error' |
| `r3720-folder-drop-measure-gate.mjs` | name: 'Error' |
| `r3720-inc2-move-affordance-gate.mjs` | (A) discoverability: fileOffersMove=true memberOffersMove=false typeGate=PASS |
| `r3720-reparent-server-verify.mjs` | name: 'Error' |
| `r3721-revisit-gate.mjs` | name: 'Error' |
| `r3724b-pin-value-gate.mjs` | name: 'Error' |
| `r3726-sprint-displayname-gate.mjs` | name: 'Error' |
| `r3729-file-detail-render-gate.mjs` | name: 'Error' |
| `r372b-auto-relationships-gate.mjs` | name: 'Error' |
| `r374-tree-reveal-gate.mjs` | name: 'Error' |
| `r3741-tree-node-drop-harden.mjs` | name: 'Error' |
| `r40104-rename-gate.mjs` | name: 'Error' |
| `r40106-inc4-move-rewire-gate.mjs` | name: 'Error' |
| `r40106-inc4-slice3-remove-semantic-gate.mjs` | name: 'Error' |
| `r40106-inc4-slice4-link-here-gate.mjs` | name: 'Error' |
| `r40106-inc5-addfolder-nest-gate.mjs` | name: 'Error' |
| `r40106-inc6-render-gate.mjs` | name: 'Error' |
| `r40106-inc7a-bite-gate.mjs` | name: 'Error' |
| `r40106-inc7a-delete-mechanism-gate.mjs` | name: 'Error' |
| `r40106-linkhere-ui-cycle-gate.mjs` | name: 'Error' |
| `r40107-guard-live-runtime-probe.mjs` | name: 'Error' |
| `r4010c-cr-reachable-gate.mjs` | name: 'Error' |
| `r4011-carveout-unresolved-gate.mjs` | name: 'Error' |
| `r4011c-default-view-pixel-gate.mjs` | served vundefined · /api/trace/children fields-served=false |
| `r4012-music-player-pixel-gate.mjs` | name: 'Error' |
| `r4019-history-back-gate.mjs` | name: 'Error' |
| `r4021-prod-inroom-probe.mjs` | name: 'Error' |
| `r4021-prod-readonly-defects23.mjs` | name: 'Error' |
| `r4021c-room-files-sunburst-gate.mjs` | name: 'Error' |
| `r4021d-p5-dir-sunburst-gate.mjs` | name: 'Error' |
| `r4021p1p4-folder-sunburst-gate.mjs` | name: 'Error' |
| `r4021p3-redundant-links-gate.mjs` | name: 'Error' |
| `r4021p4-sunburst-gate.mjs` | name: 'Error' |
| `r4021p5-physical-tree-gate.mjs` | name: 'Error' |
| `r4022b-existing-content-render-probe.mjs` | name: 'Error' |
| `r4022c-render-preconditions.mjs` | name: 'Error' |
| `r4022e-folder-detail-prod-probe.mjs` | name: 'Error' |
| `r4025-prod-upload-env-test.mjs` | name: 'Error' |
| `r4028-newtab-gate.mjs` | name: 'Error' |
| `r4028-newtab-mechanism-selftest.mjs` | name: 'Error' |
| `r403a-served-render-confirm.mjs` | name: 'Error' |
| `r403b-keybar-failvisible-gate.mjs` | name: 'Error' |
| `r4045-livetransport-connected-gate.mjs` | name: 'Error' |
| `r404b-sprint-label-render-gate.mjs` | name: 'Error' |
| `r4050-surface-desc-gate.mjs` | name: 'Error' |
| `r4052-live-transmit-probe.mjs` | name: 'Error' |
| `r4059-detail-stability-diag.mjs` | name: 'Error' |
| `r4059-row-source-probe.mjs` | name: 'Error' |
| `r4059-substep-dom-inspect.mjs` | name: 'Error' |
| `r4059-t401-declineband-served-guarantee.mjs` | name: 'Error' |
| `r4060-pin-rerender-served-readonly.mjs` | name: 'Error' |
| `r4062-cr-under-task-render-gate.mjs` | name: 'Error' |
| `r4063-s40-tasks-render-gate.mjs` | name: 'Error' |
| `r4067-trace-expand-perf-gate.mjs` | name: 'Error' |
| `r4071-method-sourcefile-gate.mjs` | name: 'Error' |
| `r4081t3720-drop-unit-class-gate.mjs` | name: 'Error' |
| `r4081t3720-fresh-link-gate.mjs` | name: 'Error' |
| `r4081t3720-remaining-inputs-gate.mjs` | name: 'Error' |
| `r4081t3720-render-class-distinct-gate.mjs` | name: 'Error' |
| `r4086-folder-drop-target-gate.mjs` | name: 'Error' |
| `r409-preview-reuse-gate.mjs` | name: 'Error' |
| `r4090-cleanup-exec.mjs` | name: 'Error' |
| `r4090-prod-confirm.mjs` | name: 'Error' |
| `r4092-5shape-measurement.mjs` | name: 'Error' |
| `r4093-room-folder-no-double-mint-gate.mjs` | name: 'Error' |
| `r41-1-file-render-proof-gate.mjs` | name: 'Error' |
| `rcd-selection-touch-webkit-gate.mjs` | name: 'Error' |

## Uses the owner token (70)

Violates R42.3 (no owner token in tests). Rewrite with SystemTester/SystemTester2 where the check still matters, otherwise delete.

| Script | First error line |
|---|---|
| `r-next-slot-check.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r1-ac1-resolvetoken-gate.mjs` | Error: ENOENT: no such file or directory, open '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/ |
| `r275-ref-slot-registry-gate.mjs` | run 1: ac1_registry=true ac2_refintegrity=false ac4_classification=true ac3_wellformed=true axis3_oneClassPerFile=true axis4_markerHasChain= |
| `r312-owner-gate-security.mjs` |  |
| `r313-otmux-tree-parse-gate.ts` | const err = new Error(message); |
| `r318c-bootstrap-seed-gate.ts` | seedOwnerInto stub: []→[6e551e0a71ffd18becfd3ea55c65b7588db5c17ecb5044ec2038cd2c41c8aa64] (add-once=false) [OWNER]→len2 (idempotent) [xyz]→l |
| `r4001-terminal-actionbar-repro.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r40106-inc7-sweep-dryrun-gate.mjs` | b8c8e6f7 / File / owner ce981242 / protected=false real=true |
| `r40106-inc7b-deleteroom-bite-gate.mjs` | ★RED (1) folder-link closure: shared-into-B-folder SURVIVES=false + exclusive GONE=true (setup=null R1=undefined) |
| `r40107-persist-guard-pair-gate.ts` | Error: ENOENT: no such file or directory, open '/home/user/web4rawbin/data/profiles.json' |
| `r4011disc-carveout-prefact2.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4017-live-pin-norefresh-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r401ac-render-demote-verify.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4021-prod-verb-gate.mjs` | Error: ENOENT: no such file or directory, open '/root/.rawbin/owner-token' |
| `r4021-repro-badparentloc.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4021-repro-roomfiles-button.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4021-scratch-verb-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4021-twobrowser-ws-folder-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4021e-prod-client-observer-gate.mjs` | Error: ENOENT: no such file or directory, open '/root/.rawbin/owner-token' |
| `r4022-room-nest-folder-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4022d-existing-shape-scratch.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4023-tree-inplace-on-add-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4024-upload-repro.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4027-sw-fix-safety-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4031-appear-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4031-b-prefix-diagnostic.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4031-foundation.mjs` |  |
| `r4031-makecurrent-axis.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4031-model-addfolder-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4031-model-connected-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4031-owner-action-smoke.mjs` |  |
| `r4031-twoclient-proof-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4031-vanish-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4049-make-current-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4050-model-dom-scratch.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4052-owner-identity-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4053-live-mvc-byteequiv-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4053-model-probe.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4056-agreement-rerun.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4056-diagnose.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4056-verify-served.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4057-bar-source-probe.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4057-bundle-check.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4057-consumer-verify.mjs` | ── PROPERTY (re-derive-not-paint): subCallbackIgnoresPayload=true · bodyReDerivesViaFetch-noDetail=true · STUB-MUST-FAIL(paint-from-detail r |
| `r4057-d1-pinrole-baseline.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4057-live-trace.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4057-park-raw-probe.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4057-race-trace.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4057-reconcile-probe.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4059-cr-behavior-scratch-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4059-decline-keeps-qa-scratch.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4059-item6-badge-liveness.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4060-pin-rerender-observer-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4060-pin-rerender-throttled-char.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4060-pin-rerender-tron-order-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4061-flight-recorder-gate.ts` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4063-barref-agreement-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4064-live-mvc-self-capture.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4064b-live-mvc-closing-run.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4065-ios-resync-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4066-four-component-detail-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4067-staleness-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4081e-model-write-evasion-gate.mjs` | A1 FAILABLE (inject a client store-literal → RED): PASS |
| `r4086-inapp-drag-into-folder-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4086-real-drop-repro.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4086-upload-content-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4089-stale-sw-selfheal-upload-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4090-upload-parser-binary-order-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4092-model-collection-folder-gate.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `rtron-twoclient-approve-harness.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |

## Green, but mints random users or tokens (7)

Violates R42.3. Rewrite with SystemTester/SystemTester2, then move into CI.

| Script | First error line |
|---|---|
| `r218-company-units-gate.mjs` | iter 1: brand="Zorblax517f131a1" cerSeed=true createRow=true uuid=3ff48547 nameKey="zorblax517f131a1"==zorblax517f131a1:true sharedByBoth=fa |
| `r218b-domain-distinct-gate.mjs` |  |
| `r314-sw-tree-render-gate.mjs` | iter 1: version=false(undefined) sw-network-first=false sw==committed=false profile200=false sm-tree-TAG-present=true(NOT a render) renderer |
| `r40107-restore-differential-gate.mjs` |  |
| `r4062-recorder-survival-gate.mjs` | Error.captureStackTrace(err); |
| `r408-unit-realpath-gate.ts` | const err = new Error(message); |
| `system-tester-setup.mjs` |  |

## Green locally, red on the e2e server (2)

Hardcodes SystemTester's old token; switch to test/e2e/identities.ts, then move into CI.

| Script | First error line |
|---|---|
| `r261-t263-federation-api-gate.mjs` | iter 1: (1)no-grant-403=false (2)mint[noTok=0,grant=…]=false (3)unit-json=false (4)content-bytes=false(undefinedb) (5)children@host=false(0) |
| `r263-t267-federation-e2e-gate.mjs` | iter 1: (1)real+prov=false (2)lazyChildren=false[] (3)action=undefined(exp mint)=false => RED |

## Needs prod data or files outside the repo (24)

One-off incident probe tied to prod data, /tmp files or other machines. Delete.

| Script | First error line |
|---|---|
| `r1-ac1-2hop-resolve-gate.mjs` | Error: ENOENT: no such file or directory, open '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/ |
| `r3046-working-file-gate.mjs` | Error: ENOENT: no such file or directory, lstat '/root/oosh' |
| `r3047-repo-manager-security-gate.ts` | Error: ENOENT: no such file or directory, lstat '/root/oosh' |
| `r3112-boot-sweep-gate.ts` | OVERALL: RED |
| `r315-foundation-gate.mjs` | Error: ENOENT: no such file or directory, open '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/ |
| `r317-single-source-version-gate.mjs` | <ref *1> Error: spawnSync /root/.vscode-server/bin/903b1e9d8990623e3d7da1df3d33db3e42d80eda/node ENOENT |
| `r3211-dnd-diagram-gate.mjs` | Error: ENOENT: no such file or directory, open '/home/user/web4rawbin/data/model-store/index/f/a/a/4/a/faa4acad-41a6-48fc-ad0d-dd0044c123f7. |
| `r3211m-mobile-tap-gate.mjs` | Error: ENOENT: no such file or directory, open '/home/user/web4rawbin/data/model-store/index/f/a/a/4/a/faa4acad-41a6-48fc-ad0d-dd0044c123f7. |
| `r333-movable-box-gate.mjs` | Error: ENOENT: no such file or directory, open '/home/user/web4rawbin/data/model-store/index/f/a/a/4/a/faa4acad-41a6-48fc-ad0d-dd0044c123f7. |
| `r335-ux-polish-gate.mjs` | Error: ENOENT: no such file or directory, open '/home/user/web4rawbin/data/model-store/index/f/a/a/4/a/faa4acad-41a6-48fc-ad0d-dd0044c123f7. |
| `r3362-scroll-autoscroll-gate.mjs` | Error: ENOENT: no such file or directory, open '/home/user/web4rawbin/data/model-store/index/f/a/a/4/a/faa4acad-41a6-48fc-ad0d-dd0044c123f7. |
| `r3363-reroute-edges-gate.mjs` | Error: ENOENT: no such file or directory, open '/home/user/web4rawbin/data/model-store/index/f/a/a/4/a/faa4acad-41a6-48fc-ad0d-dd0044c123f7. |
| `r338-remove-gate.mjs` | Error: ENOENT: no such file or directory, open '/home/user/web4rawbin/data/model-store/index/f/a/a/4/a/faa4acad-41a6-48fc-ad0d-dd0044c123f7. |
| `r36-canonical-webkit-gate.mjs` | Error: ENOENT: no such file or directory, open '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/ |
| `r361-usecase-uml-gate.ts` | Error: ENOENT: no such file or directory, open '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/ |
| `r363-method-facet-webkit-gate.ts` | Error: ENOENT: no such file or directory, open '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/ |
| `r364b-trace-edge-webkit-gate.ts` | Error: ENOENT: no such file or directory, open '/home/user/web4rawbin/data/model-store/index/f/a/a/4/a/faa4acad-41a6-48fc-ad0d-dd0044c123f7. |
| `r371-zoom-gate.mjs` | Error: ENOENT: no such file or directory, open '/home/user/web4rawbin/data/model-store/index/f/a/a/4/a/faa4acad-41a6-48fc-ad0d-dd0044c123f7. |
| `r371b-canvas-grow-gate.mjs` | Error: ENOENT: no such file or directory, open '/home/user/web4rawbin/data/model-store/index/f/a/a/4/a/faa4acad-41a6-48fc-ad0d-dd0044c123f7. |
| `r371c-endless-zoom-gate.mjs` | Error: ENOENT: no such file or directory, open '/home/user/web4rawbin/data/model-store/index/f/a/a/4/a/faa4acad-41a6-48fc-ad0d-dd0044c123f7. |
| `r40107-createroom-onboarding-fix-gate.mjs` | Error: ENOENT: no such file or directory, open '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/ |
| `r4071-after-render-gate.mjs` | Error: ENOENT: no such file or directory, open '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/ |
| `r4081b-behaviour-pair.mjs` | Error: ENOENT: no such file or directory, open '/tmp/r4081-pre.json' |
| `r5356-woda-snapnav-gate.mjs` | Error: ENOENT: no such file or directory, open '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/ |

## Red: code drift (4)

Imports or calls something that no longer exists. Delete unless the behaviour still matters, then rewrite as a vitest test.

| Script | First error line |
|---|---|
| `r318d-fix2-opaque-ref-gate.ts` | TypeError: FeatureManager.userIdOf is not a function |
| `r40106-inc7-orphan-tripwire-bites-gate.ts` | SyntaxError: The requested module '../../src/ts/server/server.js' does not provide an export named 'deleteRoomComposite' |
| `r40106-inc7-sweep-op-bites-gate.ts` | SyntaxError: The requested module '../../src/ts/server/server.js' does not provide an export named 'sweepEnumerated' |
| `r4026-pwa-sw-upload-test.mjs` | Error: Parse error /home/user/web4rawbin/test/visual/r4026-pwa-sw-upload-test.mjs:71:642 |

## Red: assertion fails (59)

Stale expectation or a real regression. Check each against its requirement before deleting.

| Script | First error line |
|---|---|
| `r1-lobby-flap-gate.mjs` | reconnect 1: preIDENTIFY-lists=0 postAuth-lists=1 edd7fa61-present=false own-rooms-present=false rooms=0 close=1000/gate-done |
| `r214-deviceLink-challenge-gate.mjs` | iter 1: token=646a10ea challenge=41ad88c4-4dee-49ac-afcb-8a2026657b2d masked=an existing user minted(PROFILE)=false / msgs=[SERVER_CONFIG,KN |
| `r2156-email-phone-units-gate.mjs` | A) phone regression +4915253844085 -> 41ad88c4-4dee-49ac-afcb-8a2026657b2d => RED |
| `r216-e164-normalize-gate.mjs` | (3) '+4915253844085' E.164 -> status=200 key="+4915253844085" uuid=41ad88c4 => RED |
| `r217-address-units-gate.mjs` | iter 1: real=7f5866fb garb=dd4dd143 profPop=true garbInitFalse=true badge=true realFlipped=false osm=false gmaps=false garbStaysFalse=true = |
| `r231-phone-identity-merge-gate.mjs` | run 1: (1)normalize=true / (2)challenge[->05e58f81 noMint=true]=false / (3)merge[activeMarcel=? land->05e58f81]=false / (4)rooms[heart=8f74d |
| `r232-heartspaces-member-dedup-gate.mjs` | run 1: members=NONE marcelCount=0 marcelToken=- primary(8f74dfba)=false => RED |
| `r233-link-account-gate.mjs` | iter 1: (4)wrong->FAILED=true / (3)correct->OK=true / (5)noPhantom[-1==-1==-1]=false => RED |
| `r241-objectverb-gate.mjs` | run 1: scoreboard=true(198/602) followUp=true lintMarkers=false(11 lines) emitSkills=true(3805c) det=true => RED |
| `r242-getthreeslots-gate.mjs` | run 1: status=200 slots=[?, ?, ?] allSprint24=false noPhantom=true => RED |
| `r245-s24-tooling-gate.mjs` | run 1: T24.4 generate-md(null)=false / T24.5 audit.strict(16508c)=true / det=true => RED |
| `r262-t264-t265-federation-transfer-gate.mjs` | const err = new Error(message); |
| `r291-tui-stream-gate.mjs` | round 1: probes streamed in remoteShells:0.2 = 0/3 => RED |
| `r3011-honor-supersede-gate.ts` | INTEGRATION: R30.6.1 retired=true R30.6.3 retired=true R30.10 complete-via-fileHistory=true R30.11 impl check=true real-opens-preserved(R30. |
| `r3041-repo-seed-branch-gate.mjs` |  |
| `r3067-repo-registry-security-gate.mjs` | iter 1: REJECTS[nonKey=true absKey=true/true traversal=true/true PUToosh=true refInject=true noShellInj=true]=true / HAPPY[rawbin=true oosh= |
| `r3111-server-attach-gate.ts` | OVERALL: RED |
| `r3112b-nonhost-gate.mjs` | OVERALL (engine-independent): RED |
| `r3113-acgate.mjs` | const err = new Error(message); |
| `r3113-deterministic-build-gate.mjs` | const err = new Error(message); |
| `r317v4-boot-frozen-version-gate.mjs` | iter 1: served=0.8.247(target=false ==committed=true) config==health=true(0.8.247) stable5=true[0.8.247,0.8.247,0.8.247,0.8.247,0.8.247] man |
| `r319p-trace-children-p0-gate.mjs` | iter 1: SM-Feature=403(gated+noleak=false) FM-Feature=403(gated+noleak=false) / non-Feature=200 /trace=200 (no-over-gate=true) => RED |
| `r321-model-validator-gate.ts` | const err = new Error(message); |
| `r328-resync-gate.ts` | iter 1: S4-added=true S2-removed=false(removed=0) edgesReflect=true(2) pumlReflect=true S1-idempotent=true(wrote=0) bite-bidir=true S3-isola |
| `r329-featuremanager-surface-gate.mjs` | iter 1: v0.8.9=false INV-D2=false / NON-member MSG.PROFILE: gotProfile=true features=[] MDA-in-list=false → excludes-MDA(non-vacuous)=true / |
| `r331-mof-folders-gate.mjs` | iter 1: v0.8.12=false INV-MOF1-folders=true(roots=2,M2=32,M1=3) INV-MOF2-crosslevel=false(mc=undefined→inst=undefined) M1-project=false(clas |
| `r3310-folder-nav-gate.mjs` |  |
| `r332b-render-perf-gate.mjs` | iter 1: v0.8.16=false INITIAL-bounded=true(2 nodes, ≪1195) LAZY-per-expand=false(M1→3proj, RawBin→4 folders/5nodes) file-folders=false(4) cl |
| `r3364-puml-source-render-gate.mjs` |  |
| `r339-crud-gate.mjs` |  |
| `r339b-verb-context-gate.mjs` |  |
| `r362-survives-regen-gate.ts` | iter 1: {"genOk":true,"addedOk":true,"usedInAdd":true,"regenOk":true,"survived":true,"pristine":true,"netZero":true,"prodClean":false,"ok":f |
| `r365b-guardrail-gate.ts` | iter 1: {"genOk":true,"invTnoUsedInPre":true,"addedOk":true,"biElem":true,"biDiag":true,"iorShowsUsedIn":true,"filePristineAfterAdd":false," |
| `r36b-counterpart-enrichment-gate.mjs` | ScenarioIndex INV-T=true UNION=true(io=2) members=19/18 usedIn=None:true => RED |
| `r3720-dnd-contract-structural-gate.mjs` | H1 per-target get/setData OUTSIDE dnd-contract.ts : 5 RED |
| `r3724-mutation-seam-bite.ts` | live: 0 un-allowed on shipped code (--strict exit 0): RED |
| `r3735-ac-parity-lint.mjs` | PARITY VIOLATIONS (task-count != req-count) : 144 RED |
| `r3737-drift-metric-completeness-lint.mjs` | SILENTLY UNACCOUNTED (total − accounted) : 705 RED ← task/req generated MDs are NOT in the metric (floor read as total) |
| `r3743-dominance-splitbrain-verify.ts` | (e) T37.27 committed: stored='Done' derived='Done' → SPLIT-BRAIN=false (pre-v0.8.104 direct-write residue; approvedBy='sm_sessi') |
| `r40081-onestore-census.mjs` | (b) MODEL_STORE_SOURCE=scenario-index flip : false |
| `r401-rc-link-gate.mjs` | const err = new Error(message); |
| `r4010-qa-verdict-gate.ts` | R4010 REFUSES TO RUN — part (a) does a REAL owner approve on prod:4444 (leaked a false Done). It must target an R40.31 ISOLATED scratch serv |
| `r40106-slice4-link-hidden-gate.mjs` | link HIDDEN=false / move still offered=true / rename still offered=true / INC-1 verb-dispatch lint 0=false |
| `r40107-mark-durability-canary-gate.mjs` | ★ RED |
| `r40107-realowner-brace-bite-gate.mjs` | ★ RED — brace ABSENT (real-owned committed-profile deletes via bulk = the gap FINDING-2 fixes). Expected PRE-brace; flips GREEN on brace com |
| `r4010b-qa-verdict-ui-gate.mjs` |  |
| `r4011-graph-disk-gate.ts` | iter 1: phantom(undefined==0.8.247)=false / AC1-graph=true(5 typed units) / AC2-crown=false(4 FileBacked→disk) / AC3-view=false / AC4-faillo |
| `r4018-pin-autoprogress-independent-gate.ts` | 2-qa-advances: RED |
| `r4021-live-regate.mjs` | : `LIVE RE-GATE FAILED — HOLD, do NOT close: verOk=${verOk}(served ${servedVer} vs ${EXPECT_VER}) bundleOk=${bundleOk}(served ${servedBundle |
| `r402root-server-tree-gate.ts` | [REAL] served==committed==0.8.70 = false (0.8.247) |
| `r403a-keyboard-suppress-harness.mjs` | const err = new Error(message); |
| `r404-sprint-label-single-source-gate.mjs` | iter 1: clean=exit1 single-source=false(2 offenders) BITE=exit1(want 1) restored=exit1 => RED |
| `r4074-live-mvc-ownership-lint.mjs` | ★ state-changes that REBUILD a view (NOT live-mvc) : 8 RED |
| `r4081b-pair1-run.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4081c-pair2-run.mjs` | throw new Error(`owner token unavailable — no RAWBIN_OWNER_TOKEN env and no readable ${file} (post-remediation the token is not in source; o |
| `r4088-evasion-reverify.mjs` | BASELINE (no seed): RED |
| `r4088-upload-ownership-lint.mjs` | upload constructions found : 0 RED |
| `r4096-transport-ownership-lint.mjs` | multipart-transport hazards OUTSIDE the owner : 3 RED |
| `rc7d-generated-header-handrow-bite.ts` | iter 1: {"catchesHandRow":true,"catchesHandId":true,"narrativeFree":false,"cleanZero":true,"nonexistentSkipped":true,"headerNotAFreePass":tr |

## Green, not a real check (3)

Exits 0 without reaching the server (no target, missing input). Delete or rewrite.

| Script | First error line |
|---|---|
| `r-release-tag-bite.ts` | untagged row → FAIL (caught): GREEN |
| `r1-ac1-creatortoken-replica.mjs` |  |
| `r1-reconnect-storm-bite.mjs` |  |
