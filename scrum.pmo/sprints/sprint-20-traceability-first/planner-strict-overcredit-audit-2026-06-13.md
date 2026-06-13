# Strict-Test Over-Credit Audit — candidate FAIL inventory (planner, 2026-06-13)

Cross-verify request → robbin-po (0.0) + scrum-master (TRONinterface:0.1).

## Mechanism (source-verified, definitive)
Canonical tool over-credits: `skill-classes.ts:86-90` hasRealImpl() only string-matches
`[impl:uuid:<uuid>]` ANYWHERE in concatenated source — NO enclosing-named-member check.
Predates the SM named-method ruling. Any marker (module-const / file-header comment /
anon-closure / CSS) currently passes. This is the inflation root.

## SM locked strict-test
PASS = marker in a NAMED+invokable member body (method OR named class-field-arrow this.x=()=>{}).
FAIL = anon-closure / module-const / comment-block(file-header) / inline-unnamed / fake-suffix / non-unique-wire / css-attr.

## Classifier validation vs PO/SM-verified anchors
- R19.50 module-const → FAIL ✓ reproduced
- R19.63 file-header comment → FAIL ✓ reproduced
- R19.72 anon-closure → my classifier FALSE-PASSED (brace-tracking picked outer method). KNOWN LIMITATION → automated FAIL list is a LOWER bound for anon-closures; needs human cross-verify.
- R19.36 heads-named-member → PASS ✓; R20.5 → FAIL comment-not-heading (PO called borderline).

## Candidate counts (credited=181): strict-PASS≈47, strict-FAIL flagged=134
HIGH-confidence FAIL=19 (module-const/anon/fake/css). NEEDS-VERIFY=115 (file-header/comment bucket — classifier weakest here; many may actually head their method).
NOTE: my pre-rewind hand-audit found 62; automated full-reclassify flags more — the TRUE floor is pending the tool-fix encoding + anchor-validation (do NOT publish a number to Tron yet).

## HIGH-confidence FAIL
| chain | method | impl uuid | source loc | reason |
|---|---|---|---|---|
| FLAG: This may mean Tron's device is not | updateBanner | 79505a42-6591-4fdb-a967-2767b7df4518 | src/public/sw.js:30 | anon-closure |
| R19.35 | persistMembers | d5f0c2b4-a09e-4f80-aaf9-fa386aa57e46 | src/ts/server/Room.ts:335 | anon-closure |
| R19.45 | flushAndReload | 4bb96a28-cfe7-4f0a-9a38-909a930e8345 | src/public/sw.js:29 | anon-closure |
| R19.52 | fullWidth | ff684e10-e57c-45ae-97b9-8f866264c737 | src/public/app.css:268 | css-attr |
| R19.84 | dragResize | 01771d5b-a1b2-4c3d-8e4f-5a6b7c8d9e0f | src/public/ts/trace/rb-detail-drawer.ts:108 | fake-suffix |
| R19.84 | dragResize | 01771d5b-a1b2-4c3d-8e4f-5a6b7c8d9e0f | src/public/ts/trace/rb-detail-drawer.ts:108 | fake-suffix |
| R-A2: Avatar upload must work without ex | avatarPersist | 340036b4-8689-4cdb-b18f-fbbb7d36e0c5 | src/ts/server/server.ts:273 | module-const |
| R-R1: All user rooms load from disk on c | keylessUpload | d688f96c-1144-4299-aba6-e1dd7271f704 | src/ts/server/server.ts:276 | module-const |
| R12.1 | backButton | 1e9916f1-7e29-4e9d-9aa9-c930fe693c9f | src/public/ts/components/rb-editor-layout.ts:1 | module-const |
| R18.34 | onPinchEnd | 37e9f3e2-0130-4f34-8c44-a90bc83495d4 | src/ts/server/server.ts:274 | module-const |
| R18.34.B | onPinchEnd | 37e9f3e2-0130-4f34-8c44-a90bc83495d4 | src/ts/server/server.ts:274 | module-const |
| R19.30 | editCanonical | 2a29b3da-c0a5-4f32-b172-af8dafaa147a | src/ts/server/RoomKeys.ts:123 | module-const |
| R19.32 | ignoreSearchNav | cec00d7f-9258-4ac1-8c35-3e45dce8a5a9 | src/public/sw.js:71 | module-const |
| R19.41 | logAtLevel | cda50b0f-be12-4e42-a436-72c4c8e0744e | src/ts/server/server.ts:277 | module-const |
| R19.50 | uploadEndpoint | 7c4a9d74-636c-44e0-b5da-86ce7a684975 | src/ts/server/server.ts:279 | module-const |
| R19.54 | createUserUnit | 8298c379-38af-4b1c-b6ae-f2569425c48c | src/ts/server/server.ts:278 | module-const |
| R19.66 | typeDispatch | d147e1fd-acca-48b0-adac-44c35be75755 | src/public/ts/scenario-view.ts:58 | module-const |
| R19.71 | forwardRefs | 28f244c7-1a9c-49c5-ab6c-249d906cb9a4 | src/ts/server/server.ts:711 | module-const |
| R19.78 | buttonsAboveName | b8714c1d-58b2-4324-93ba-da5e0f760221 | src/public/ts/RoomView.ts:239 | module-const |

## NEEDS-VERIFY (file-header / comment bucket)
| chain | method | impl uuid | source loc | reason |
|---|---|---|---|---|
| R15.2 — Object.verb model: Object=noun/c | parent | 87c9007a-2144-4030-a5ac-cd48f518bb2b | src/ts/shared/TraceModel.ts:17 | comment-not-heading-member |
| R16.5 | open | 6d75cd49-72a3-42e5-aaa7-2b40b572a83b | src/public/ts/trace/rb-detail-drawer.ts:16 | comment-not-heading-member |
| R16.6 | render | 4a158f5c-c502-4ee3-854d-167a40cf806b | src/public/ts/trace/rb-object-item.ts:19 | comment-not-heading-member |
| R16.8 | drag | d809105d-b683-4cab-a587-fbdfdb4de809 | src/public/ts/trace/rb-object-item.ts:21 | comment-not-heading-member |
| R16.9 | collapse | 0a028fb4-d3d5-476c-9dcd-977212cbaf41 | src/public/ts/trace/rb-object-item.ts:24 | comment-not-heading-member |
| R17.12: All files are units, referenceab | navigate | c9c53769-36fc-4431-bc57-8f68192592b9 | src/public/ts/trace/rb-trace-tree.ts:18 | comment-not-heading-member |
| R18.2 | classMethodScope | 9f495b68-d22d-41a7-85d1-9ccd78211506 | src/public/ts/trace/rb-trace-tree.ts:16 | comment-not-heading-member |
| R18.13 | classMethodScope | 9f495b68-d22d-41a7-85d1-9ccd78211506 | src/public/ts/trace/rb-trace-tree.ts:16 | comment-not-heading-member |
| R18.16 | classMethodScope | 9f495b68-d22d-41a7-85d1-9ccd78211506 | src/public/ts/trace/rb-trace-tree.ts:16 | comment-not-heading-member |
| R18.17 | classMethodScope | 9f495b68-d22d-41a7-85d1-9ccd78211506 | src/public/ts/trace/rb-trace-tree.ts:16 | comment-not-heading-member |
| R18.18 | classMethodScope | 9f495b68-d22d-41a7-85d1-9ccd78211506 | src/public/ts/trace/rb-trace-tree.ts:16 | comment-not-heading-member |
| R18.19 | checkRoundTrip | ee738f5f-ad04-4435-a38b-ccf1d124332f | scripts/generate-sprint-md.ts:18 | comment-not-heading-member |
| R18.20 | classMethodScope | 9f495b68-d22d-41a7-85d1-9ccd78211506 | src/public/ts/trace/rb-trace-tree.ts:16 | comment-not-heading-member |
| R18.21 | classMethodScope | 9f495b68-d22d-41a7-85d1-9ccd78211506 | src/public/ts/trace/rb-trace-tree.ts:16 | comment-not-heading-member |
| R18.22 | classMethodScope | 9f495b68-d22d-41a7-85d1-9ccd78211506 | src/public/ts/trace/rb-trace-tree.ts:16 | comment-not-heading-member |
| R18.23 | classMethodScope | 9f495b68-d22d-41a7-85d1-9ccd78211506 | src/public/ts/trace/rb-trace-tree.ts:16 | comment-not-heading-member |
| R18.26 | classMethodScope | 9f495b68-d22d-41a7-85d1-9ccd78211506 | src/public/ts/trace/rb-trace-tree.ts:16 | comment-not-heading-member |
| R18.27 | classMethodScope | 9f495b68-d22d-41a7-85d1-9ccd78211506 | src/public/ts/trace/rb-trace-tree.ts:16 | comment-not-heading-member |
| R18.28 | classMethodScope | 9f495b68-d22d-41a7-85d1-9ccd78211506 | src/public/ts/trace/rb-trace-tree.ts:16 | comment-not-heading-member |
| R18.29 | checkRoundTrip | ee738f5f-ad04-4435-a38b-ccf1d124332f | scripts/generate-sprint-md.ts:18 | comment-not-heading-member |
| R18.30 | checkRoundTrip | ee738f5f-ad04-4435-a38b-ccf1d124332f | scripts/generate-sprint-md.ts:18 | comment-not-heading-member |
| R18.31 | checkRoundTrip | ee738f5f-ad04-4435-a38b-ccf1d124332f | scripts/generate-sprint-md.ts:18 | comment-not-heading-member |
| R19.14 | upload | c546c877-9907-4f17-b61a-1157b0902765 | src/ts/scenario/file-unit.ts:26 | comment-not-heading-member |
| R19.46 | restoreFilesFromScenario | 32005bc3-7bce-4214-aeb7-f50794cedca4 | src/ts/server/server.ts:272 | comment-not-heading-member |
| R19.55 | createDeviceUnit | 51b7a457-7dd2-48ac-8dcc-9c00e9f6caf4 | src/ts/server/server.ts:270 | comment-not-heading-member |
| R19.57 | raiseAboveDrawer | 2f809076-5cca-42b3-806b-7f390890fa2b | src/ts/server/server.ts:271 | comment-not-heading-member |
| R19.70 | scenarioBrowserLink | ed71d42a-8b9c-4831-963a-973ff28d0819 | src/public/ts/trace/detail-children.ts:44 | comment-not-heading-member |
| R19.90 | setItems | c5b331a7-d844-4cea-a7a4-1e5eebceec37 | src/public/ts/trace/rb-trace-tree.ts:52 | comment-not-heading-member |
| R20.5 | singularChain | b4f6b903-bbb5-4450-9aad-ddce522bd725 | src/public/ts/trace/singular-chain.ts:25 | comment-not-heading-member |
| R-ED1: Markdown preview must render hier | renderList | 2c3612cc-193f-4082-a3f1-c882641b5495 | src/ts/server/server.ts:6 | file-header-comment |
| R14.2 — Migrate legacy `token-<timestamp | convertLegacy | d7abe1d3-d4bd-4384-8068-d3b64d450291 | scripts/migrate-to-scenario.ts:4 | file-header-comment |
| R15.5 — `ListOverview` with search over  | render | 2b1e7d26-62fe-4d8a-8129-56c09b9d78ff | src/public/ts/trace/rb-object-item.ts:14 | file-header-comment |
| R15.6 — Task DetailViews + planning Over | searchAndFilter | 03086eb9-05c8-429c-a79b-5f2f7d3e85c6 | src/public/ts/trace/rb-list-overview.ts:9 | file-header-comment |
| R15.7 — Traceability BROWSER next to the | renderObject | 4947f284-3c25-4c8a-b0fa-b31e4cf049e4 | src/public/ts/trace/rb-detail-view.ts:1 | file-header-comment |
| R16.2: DetailsViewContainer sticky to bo | setBackground | 97f2cf22-a595-455c-88a8-f38d37a893f7 | src/public/ts/trace/rb-detail-drawer.ts:2 | file-header-comment |
| R16.4: Traceability chain data diagnosis | stickyTop | 78beddd9-61f4-4604-bb1b-846fd98bbe60 | src/ts/server/server.ts:2 | file-header-comment |
| R16.7 | setIcon | 2693d9cc-4a08-4f05-ba01-597b647eb7c7 | src/public/ts/trace/rb-object-item.ts:15 | file-header-comment |
| R17.2: IOR — universal reference handle | symlinkSupport | 64fa793d-53ab-4ae4-81ff-64e917c295a2 | src/ts/server/FileApi.ts:2 | file-header-comment |
| R17.3: Class-based instances — typed cla | renderHtml(scenario): string | d0605b74-98ca-4c3a-9fde-e80a27912049 | src/ts/scenario/templates.ts:9 | file-header-comment |
| R17.4: Index by UUID prefix — scenario/i | load(json): this | 12571155-110d-4d6f-91ab-5913ec94219b | src/ts/scenario/types.ts:2 | file-header-comment |
| R17.6: Speaking-name tree (md) — generat | ts:migrate | 811e9fa5-75a6-4d39-a750-545aacded4f2 | scripts/migrate-to-scenario.ts:2 | file-header-comment |
| R17.7: HTML view templates per class | symlinkJson(sprint | 7bab1a71-8d2e-4d19-bd4a-ce5547291b03 | src/ts/scenario/generator.ts:5 | file-header-comment |
| R17.8: Views generated + live-updated fr | symlinkJson(sprint | 7bab1a71-8d2e-4d19-bd4a-ce5547291b03 | src/ts/scenario/generator.ts:5 | file-header-comment |
| R17.9: planning.md is a generated Task-o | symlinkJson(sprint | 7bab1a71-8d2e-4d19-bd4a-ce5547291b03 | src/ts/scenario/generator.ts:5 | file-header-comment |
| R17.10: Sprint overview = list of sprint | symlinkJson(sprint | 7bab1a71-8d2e-4d19-bd4a-ce5547291b03 | src/ts/scenario/generator.ts:5 | file-header-comment |
| R17.11: File-browser ↔ traceability-brow | symlinkJson(sprint | 7bab1a71-8d2e-4d19-bd4a-ce5547291b03 | src/ts/scenario/generator.ts:5 | file-header-comment |
| R17.13: Method → task → requirement trac | load(json): this | 12571155-110d-4d6f-91ab-5913ec94219b | src/ts/scenario/types.ts:2 | file-header-comment |
| R17.14: Migrate all sprints/tasks/requir | sprintToScenario | 7e895957-3b57-443f-83b1-4236ed61915f | scripts/migrate-to-scenario.ts:3 | file-header-comment |
| R17.15: Collaborative planning — archite | ts:migrate | 811e9fa5-75a6-4d39-a750-545aacded4f2 | scripts/migrate-to-scenario.ts:2 | file-header-comment |
| R17.17: Task status as state-machine met | renderHtml(scenario): string | d0605b74-98ca-4c3a-9fde-e80a27912049 | src/ts/scenario/templates.ts:9 | file-header-comment |
| R17.18: Traceability links → first-class | scenarioUnit | c5134d0a-f41b-4e85-b026-0b3f1ae5b2cd | src/ts/scenario/trace-link.ts:5 | file-header-comment |
| R17.20: Requirement + UseCase units in s | formalizeQuotes | 15a31e7e-6977-44cb-ab29-09c44583369a | src/ts/server/TraceConsistency.ts:3 | file-header-comment |
| R17.24: UC/Class/Method unit carries exa | contrastFix | 7d40684c-e6b1-410c-90c7-3d80d229568b | src/public/ts/trace/rb-trace-tree.ts:14 | file-header-comment |
| R17.26 | renderAllTypes | 08fdddd4-c2bf-4997-bae4-0faa9f6d8f83 | src/public/ts/trace/rb-trace-tree.ts:2 | file-header-comment |
| R17.26: Traceability is a TREE, not a ch | treeRework | bf4879c6-30ee-4d47-8d7d-c80aa9f26fc7 | src/public/ts/trace/rb-trace-tree.ts:13 | file-header-comment |
| R17.31: The right detail pane has a hard | mobileCap | 092a5eb3-0ee6-40fd-be9d-9cdc89b3e53c | src/public/ts/trace/rb-trace-tree.ts:15 | file-header-comment |
| R17.32: The traceability chain starts wi | mobileCap | 092a5eb3-0ee6-40fd-be9d-9cdc89b3e53c | src/public/ts/trace/rb-trace-tree.ts:15 | file-header-comment |
| R17.48 | lazyLoad | 275481cd-bcf4-4f3a-9980-e6e7fd060bad | src/public/ts/scenario-view.ts:2 | file-header-comment |
| R18.6 | lazyAppend | eb038984-43bb-415c-91ed-25f6db3114f9 | src/public/ts/trace/rb-trace-tree.ts:10 | file-header-comment |
| R18.7 | lazyAppend | eb038984-43bb-415c-91ed-25f6db3114f9 | src/public/ts/trace/rb-trace-tree.ts:10 | file-header-comment |
| R18.9 | lazyAppend | eb038984-43bb-415c-91ed-25f6db3114f9 | src/public/ts/trace/rb-trace-tree.ts:10 | file-header-comment |
| R18.10 | lazyAppend | eb038984-43bb-415c-91ed-25f6db3114f9 | src/public/ts/trace/rb-trace-tree.ts:10 | file-header-comment |
| R18.10: Tree lazy-loads only the NEXT la | fetchAndRenderChildren | 5d4ba96f-68f2-4f33-8b8f-636c704b2ee1 | src/public/ts/trace/rb-trace-tree.ts:11 | file-header-comment |
| R18.11 | lazyAppend | eb038984-43bb-415c-91ed-25f6db3114f9 | src/public/ts/trace/rb-trace-tree.ts:10 | file-header-comment |
| R18.11: Cycle guard is ancestor-path-pre | ancestorGuard | 4042da6f-e083-4564-bab7-562558b7464b | src/public/ts/trace/rb-trace-tree.ts:7 | file-header-comment |
| R18.12 | lazyAppend | eb038984-43bb-415c-91ed-25f6db3114f9 | src/public/ts/trace/rb-trace-tree.ts:10 | file-header-comment |
| R18.12: True-cycle nodes are omitted cle | cycleOmit | 1e008b80-6dcc-4f5c-aa2b-a4d809057b3a | src/public/ts/trace/rb-trace-tree.ts:4 | file-header-comment |
| R18.14 | lazyAppend | eb038984-43bb-415c-91ed-25f6db3114f9 | src/public/ts/trace/rb-trace-tree.ts:10 | file-header-comment |
| R18.15 | lazyAppend | eb038984-43bb-415c-91ed-25f6db3114f9 | src/public/ts/trace/rb-trace-tree.ts:10 | file-header-comment |
| R18.16: Traceability chain includes the  | classHop | 7995df98-396b-4f1b-ba84-69126d7c5855 | src/ts/shared/TraceModel.ts:2 | file-header-comment |
| R18.17: /trace sprint list shows each sp | sprintsDedupe | 07c16d73-27c9-4185-89de-ca81cc9ba01f | src/ts/server/server.ts:7 | file-header-comment |
| R18.18: Sprint names in /trace include t | sprintNameFormat | eef80308-52d5-4ecf-93fe-c678ac04b412 | src/ts/server/server.ts:10 | file-header-comment |
| R18.19: Sprint numbers are zero-padded 2 | sprintZeroPad | cc549bbd-84e3-432b-a188-7c81cc6c8856 | src/ts/server/server.ts:9 | file-header-comment |
| R18.20: Detail view (right pane) shows A | renderAll | ac1f9cfc-2fd2-423d-a48a-d1b28b656800 | src/public/ts/trace/rb-class-detail.ts:2 | file-header-comment |
| R18.25 | lazyAppend | eb038984-43bb-415c-91ed-25f6db3114f9 | src/public/ts/trace/rb-trace-tree.ts:10 | file-header-comment |
| R18.25: Tree narrowed chain continues pa | chainToTest | 49cb3038-9a42-455d-b636-71b60276a155 | src/public/ts/trace/rb-trace-tree.ts:6 | file-header-comment |
| R18.27: Browse-File link opens the file- | highlightFile | 5a802d49-7c12-435e-b5dd-a875f8564f05 | src/ts/server/FileApi.ts:5 | file-header-comment |
| R18.33 | syncSelection | f124b7ff-ee8e-4d00-a799-f87e1f4a1883 | src/public/ts/trace/rb-trace-tree.ts:5 | file-header-comment |
| R19.10 | modeSet | 3fbcebaf-2986-44d6-afd2-7ab810e824f2 | src/public/ts/RoomView.ts:6 | file-header-comment |
| R19.11 | render | e289349c-ba8d-4182-9288-9bbd7ac3ed56 | src/public/ts/RoomView.ts:5 | file-header-comment |
| R19.12 | render | e289349c-ba8d-4182-9288-9bbd7ac3ed56 | src/public/ts/RoomView.ts:5 | file-header-comment |
| R19.13 | render | e289349c-ba8d-4182-9288-9bbd7ac3ed56 | src/public/ts/RoomView.ts:5 | file-header-comment |
| R19.16 | applyButton | d1bae8be-a6ca-41e8-bdf6-ee78399ef41e | src/public/ts/RoomView.ts:3 | file-header-comment |
| R19.17 | acceptApply | 5811824c-0bb1-4db4-98de-f419d915236e | src/ts/server/Room.ts:3 | file-header-comment |
| R19.19 | modeSet | 3fbcebaf-2986-44d6-afd2-7ab810e824f2 | src/public/ts/RoomView.ts:6 | file-header-comment |
| R19.20 | linkToRoom | 7aea186a-1564-4bc3-902c-31d1532c346c | src/ts/scenario/file-unit.ts:2 | file-header-comment |
| R19.21 | mountTraceTree | 32578dc6-58bb-4ce1-94be-2a78a142e139 | src/public/ts/RoomView.ts:4 | file-header-comment |
| R19.21.A | folderNodeRender | 602fecd2-6fdb-4f57-8298-830f01a802fa | src/public/ts/RoomView.ts:2 | file-header-comment |
| R19.21.B | dragGhost | a1e11e85-98a7-4be0-a8f4-ec54e938d329 | src/public/ts/trace/rb-object-item.ts:4 | file-header-comment |
| R19.22 | persistAsSymlink | a6e5e49d-520f-4a80-9e51-1d8001e4bccb | src/ts/server/Room.ts:5 | file-header-comment |
| R19.22.A | persistAsSymlink | a6e5e49d-520f-4a80-9e51-1d8001e4bccb | src/ts/server/Room.ts:5 | file-header-comment |
| R19.24 | stripSpectator | b309d0dd-22a3-4f5f-ba6f-0f29d1502cf3 | src/ts/server/Room.ts:6 | file-header-comment |
| R19.25 | badgeRender | bc638f97-00a4-4756-a2e7-d0d531b2927d | src/public/ts/trace/rb-object-item.ts:6 | file-header-comment |
| R19.26 | iconDrag | 0b57d139-2df7-4024-a725-b24f558341b6 | src/public/ts/trace/rb-object-item.ts:3 | file-header-comment |
| R19.27 | squareCollapse | f7b0c24a-6b0a-4548-9b0d-2b312c211fde | src/public/ts/trace/rb-object-item.ts:5 | file-header-comment |
| R19.28 | prefetchLayer | 3d3a4239-5939-4f5b-ae8d-bba2d2c086da | src/public/ts/trace/rb-trace-tree.ts:9 | file-header-comment |
| R19.29 | computeBadges | 7e43dda4-d7fd-45db-98b5-0e7a72d222c5 | src/public/ts/trace/rb-trace-tree.ts:3 | file-header-comment |
| R19.39 | ensureRawBinUser | 7de1d230-8174-4ea5-b1e9-7b52bb6e63e8 | src/ts/scenario/classes.ts:7 | file-header-comment |
| R19.47 | reuseByContentHash | 50106c13-c538-47e5-b902-a7cb0feda61a | src/ts/scenario/file-unit.ts:4 | file-header-comment |
| R19.48 | versionByName | 148740b9-b87c-422f-8b38-53caab1294ac | src/ts/scenario/file-unit.ts:5 | file-header-comment |
| R19.49 | computeContentHash | 6ec25cdc-d6af-4361-87f7-631840c56779 | src/ts/scenario/file-unit.ts:6 | file-header-comment |
| R19.51 | indexByContentHash | 36a3b677-dc4d-415c-9eee-ffc62fff0f76 | src/ts/scenario/file-unit.ts:8 | file-header-comment |
| R19.55.A | deviceAssociation | 766fd217-0059-441d-a012-85dcbc5e8717 | scripts/migrate-users-devices.ts:2 | file-header-comment |
| R19.56 | canonicalShard | 80e26c8c-5dbf-418f-bb88-fcdaa82c0d07 | src/ts/scenario/index-store.ts:1 | file-header-comment |
| R19.60 | backfillFiles | 9c94958d-d754-4e80-adf4-ad36ea67caab | src/ts/server/Room.ts:4 | file-header-comment |
| R19.61 | registerAllTypes | 7c6911e4-d56a-4a8b-bba6-595df4ed44e2 | src/ts/scenario/templates.ts:11 | file-header-comment |
| R19.63 | filePreview | f94da2cd-e818-4f8b-be4c-b0fc30a0d689 | src/public/ts/trace/rb-detail-drawer.ts:9 | file-header-comment |
| R19.64 | byTypeRender | 301da3f0-2a47-450a-aa19-408a8a4bad0f | src/public/ts/trace/rb-detail-drawer.ts:10 | file-header-comment |
| R19.65 | render | a232ce97-c336-45fa-9e0f-68e2507729dc | src/ts/server/server.ts:8 | file-header-comment |
| R19.67 | roomScenarioDetail | 07942a94-4713-4985-b618-9d9717e86cda | src/public/ts/trace/rb-detail-view.ts:2 | file-header-comment |
| R19.75 | authToken | 4c897dae-affd-4528-bbda-2f4c373c6de8 | src/public/ts/trace/content-preview.ts:6 | file-header-comment |
| R19.81 | iframePinchZoom | 7cd70c47-d2cd-4749-8bb6-18018c64bc14 | src/public/ts/trace/content-preview.ts:7 | file-header-comment |
| R19.94 | showBuildVersion | 92f4ced4-fab4-4b90-bd1f-37621eb8cd54 | src/public/ts/components/rb-header.ts:2 | file-header-comment |
| R19.96 | showUserUuid | 5b438bb9-1602-4890-9c09-407606a28d6c | src/public/ts/ProfileEditor.ts:1 | file-header-comment |
| S1 Foundation — Bootstrap RawBin team an | strip | 79568421-462d-4c7a-b1d2-bd0c3c0d9d18 | src/public/ts/RawBinClient.ts:2 | file-header-comment |
