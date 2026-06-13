# STRICT-TEST TRUE FLOOR — anchor-validated (planner, 2026-06-14)

Tool: scripts/strict-marker-audit.ts (TypeScript AST). Re-run: npx tsx scripts/strict-marker-audit.ts
Credited by canonical tool = 181/205 (excl 46). Strict re-score below.

## Encoded strict-test (SM/PO locked)
PASS iff [impl:uuid] marker (a) HEADS a named member declaration (function/method/field-arrow/const-fn)
OR (b) is IN-BODY of a named member whose name MATCHES the marker label-method.
FAIL: (split for) cluster / heads-const(data) / anon-closure / in-body name-mismatch / no-named-member(file-header) / css / fake-suffix.

## 8-anchor validation (5 named anchors GREEN; PO/SM source-verified)
| anchor | expect | got | reason |
|---|---|---|---|
| R19.14 | PASS | PASS | heads-named:createFileUnit |
| R19.36 | PASS | PASS | heads-named:uploadFile |
| R19.50 | FAIL | FAIL | split-for-cluster |
| R19.72 | FAIL | FAIL | mislabeled(label=removelocalidentity vs member=open) |
| R19.84 | FAIL | FAIL | fake-suffix |
(6c cc1dcd0e / 6d 4256aef7 / 6f onDragStart: NOT in the canonical credited-181 set — coverage note for SM: confirm they are genuine-but-OPEN, not credited.)

## TRUE STRICT FLOOR = 23 champagne / 205 (excl 46).  158 currently-credited chains FAIL strict.
Inflation = 181 → 23 (158 over-credits). Buckets:
- no-named-member: 93
- split-for-cluster: 35
- mislabeled: 20
- heads-const: 7
- fake-suffix: 2
- css-attr: 1
  (no-named-member = 70 file-header blocks line<12 [R19.63 pattern] + 23 deeper)

## Full FAIL inventory
| chain | method | strict-loc | reason |
|---|---|---|---|
| R19.52 | fullWidth | src/public/app.css:268 | css-attr |
| R19.84 | dragResize | src/public/ts/trace/rb-detail-drawer.ts:108 | fake-suffix |
| R19.84 | dragResize | src/public/ts/trace/rb-detail-drawer.ts:108 | fake-suffix |
| R12.1 | backButton | src/public/ts/components/rb-editor-layout.ts:1 | heads-const:STORAGE_KEY |
| R19.30 | editCanonical | src/ts/server/RoomKeys.ts:123 | heads-const:sourceFile |
| R19.32 | ignoreSearchNav | src/public/sw.js:71 | heads-const:isNavigation |
| R19.66 | typeDispatch | src/public/ts/scenario-view.ts:58 | heads-const:obj |
| R19.71 | forwardRefs | src/ts/server/server.ts:711 | heads-const:SCENARIO_FWD |
| R19.78 | buttonsAboveName | src/public/ts/RoomView.ts:239 | heads-const:body |
| R19.94 | showBuildVersion | src/public/ts/components/rb-header.ts:2 | heads-const:__BUILD_VERSION__ |
| R18.9: Chain cycles are completely elimi | cycleGuard | src/public/ts/trace/rb-detail-view.ts:36 | mislabeled(label=room-detail vs member=render) |
| R19.1 | init | src/ts/server/Room.ts:113 | mislabeled(label=init vs member=constructor) |
| R19.5 | applySend | src/public/ts/RoomBrowser.ts:156 | mislabeled(label=applysend vs member=renderRoomList) |
| R19.6 | applySend | src/public/ts/RoomBrowser.ts:156 | mislabeled(label=applysend vs member=renderRoomList) |
| R19.8.A | retainOrPrune | src/ts/server/Room.ts:202 | mislabeled(label=retainorprune vs member=removeMember) |
| R19.8.B | retainOrPrune | src/ts/server/Room.ts:202 | mislabeled(label=retainorprune vs member=removeMember) |
| R19.18 | retainOrPrune | src/ts/server/Room.ts:202 | mislabeled(label=retainorprune vs member=removeMember) |
| R19.23 | stripSizeLimits | src/ts/server/server.ts:1581 | mislabeled(label=no vs member=handleMessage) |
| R19.38 | lazyLoadChain | src/ts/server/server.ts:451 | mislabeled(label=chat vs member=handleRequest) |
| R19.40 | lazyLoadChain | src/ts/server/server.ts:451 | mislabeled(label=chat vs member=handleRequest) |
| R19.68 | roomScopedAccess | src/ts/server/server.ts:483 | mislabeled(label=file-access vs member=handleRequest) |
| R19.69 | iframeSandbox | src/public/ts/trace/content-preview.ts:18 | mislabeled(label=iframe vs member=renderContentPreview) |
| R19.72 | removeLocalIdentity | src/public/ts/DeviceEnrollDialog.ts:66 | mislabeled(label=removelocalidentity vs member=open) |
| R19.73 | filePreview | src/public/ts/RoomView.ts:196 | mislabeled(label=in-room vs member=render) |
| R19.74 | htmlSandboxed | src/public/ts/trace/content-preview.ts:21 | mislabeled(label=html vs member=renderContentPreview) |
| R19.77 | urlFileActions | src/public/ts/trace/content-preview.ts:25 | mislabeled(label=url vs member=renderContentPreview) |
| R19.89 | removeLocalIdentity | src/public/ts/DeviceEnrollDialog.ts:65 | mislabeled(label=removelocalidentity vs member=open) |
| R19.89 | removeLocalIdentity | src/public/ts/DeviceEnrollDialog.ts:65 | mislabeled(label=removelocalidentity vs member=open) |
| R19.91 | removeLocalIdentity | src/public/ts/DeviceEnrollDialog.ts:65 | mislabeled(label=removelocalidentity vs member=open) |
| R19.100 | renderAllFiles | src/public/ts/RoomView.ts:77 | mislabeled(label=file_added vs member=constructor) |
| FLAG: This may mean Tron's device is not | updateBanner | src/public/sw.js:30 | no-named-member(const/header/nothing) |
| R-ED1: Markdown preview must render hier | renderList | src/ts/server/server.ts:6 | no-named-member(const/header/nothing) |
| R14.2 — Migrate legacy `token-<timestamp | convertLegacy | scripts/migrate-to-scenario.ts:4 | no-named-member(const/header/nothing) |
| R15.2 — Object.verb model: Object=noun/c | parent | src/ts/shared/TraceModel.ts:17 | no-named-member(const/header/nothing) |
| R15.7 — Traceability BROWSER next to the | renderObject | src/public/ts/trace/rb-detail-view.ts:1 | no-named-member(const/header/nothing) |
| R16.2: DetailsViewContainer sticky to bo | setBackground | src/public/ts/trace/rb-detail-drawer.ts:2 | no-named-member(const/header/nothing) |
| R16.4: Traceability chain data diagnosis | stickyTop | src/ts/server/server.ts:2 | no-named-member(const/header/nothing) |
| R17.2: IOR — universal reference handle | symlinkSupport | src/ts/server/FileApi.ts:2 | no-named-member(const/header/nothing) |
| R17.4: Index by UUID prefix — scenario/i | load(json): this | src/ts/scenario/types.ts:2 | no-named-member(const/header/nothing) |
| R17.6: Speaking-name tree (md) — generat | ts:migrate | scripts/migrate-to-scenario.ts:2 | no-named-member(const/header/nothing) |
| R17.7: HTML view templates per class | symlinkJson(sprint | src/ts/scenario/generator.ts:5 | no-named-member(const/header/nothing) |
| R17.8: Views generated + live-updated fr | symlinkJson(sprint | src/ts/scenario/generator.ts:5 | no-named-member(const/header/nothing) |
| R17.9: planning.md is a generated Task-o | symlinkJson(sprint | src/ts/scenario/generator.ts:5 | no-named-member(const/header/nothing) |
| R17.10: Sprint overview = list of sprint | symlinkJson(sprint | src/ts/scenario/generator.ts:5 | no-named-member(const/header/nothing) |
| R17.11: File-browser ↔ traceability-brow | symlinkJson(sprint | src/ts/scenario/generator.ts:5 | no-named-member(const/header/nothing) |
| R17.12: All files are units, referenceab | navigate | src/public/ts/trace/rb-trace-tree.ts:18 | no-named-member(const/header/nothing) |
| R17.13: Method → task → requirement trac | load(json): this | src/ts/scenario/types.ts:2 | no-named-member(const/header/nothing) |
| R17.14: Migrate all sprints/tasks/requir | sprintToScenario | scripts/migrate-to-scenario.ts:3 | no-named-member(const/header/nothing) |
| R17.15: Collaborative planning — archite | ts:migrate | scripts/migrate-to-scenario.ts:2 | no-named-member(const/header/nothing) |
| R17.18: Traceability links → first-class | scenarioUnit | src/ts/scenario/trace-link.ts:5 | no-named-member(const/header/nothing) |
| R17.20: Requirement + UseCase units in s | formalizeQuotes | src/ts/server/TraceConsistency.ts:3 | no-named-member(const/header/nothing) |
| R17.24: UC/Class/Method unit carries exa | contrastFix | src/public/ts/trace/rb-trace-tree.ts:14 | no-named-member(const/header/nothing) |
| R17.26 | renderAllTypes | src/public/ts/trace/rb-trace-tree.ts:2 | no-named-member(const/header/nothing) |
| R17.26: Traceability is a TREE, not a ch | treeRework | src/public/ts/trace/rb-trace-tree.ts:13 | no-named-member(const/header/nothing) |
| R17.31: The right detail pane has a hard | mobileCap | src/public/ts/trace/rb-trace-tree.ts:15 | no-named-member(const/header/nothing) |
| R17.32: The traceability chain starts wi | mobileCap | src/public/ts/trace/rb-trace-tree.ts:15 | no-named-member(const/header/nothing) |
| R17.48 | lazyLoad | src/public/ts/scenario-view.ts:2 | no-named-member(const/header/nothing) |
| R18.2 | classMethodScope | src/public/ts/trace/rb-trace-tree.ts:16 | no-named-member(const/header/nothing) |
| R18.6 | lazyAppend | src/public/ts/trace/rb-trace-tree.ts:10 | no-named-member(const/header/nothing) |
| R18.7 | lazyAppend | src/public/ts/trace/rb-trace-tree.ts:10 | no-named-member(const/header/nothing) |
| R18.9 | lazyAppend | src/public/ts/trace/rb-trace-tree.ts:10 | no-named-member(const/header/nothing) |
| R18.10 | lazyAppend | src/public/ts/trace/rb-trace-tree.ts:10 | no-named-member(const/header/nothing) |
| R18.10: Tree lazy-loads only the NEXT la | fetchAndRenderChildren | src/public/ts/trace/rb-trace-tree.ts:11 | no-named-member(const/header/nothing) |
| R18.11 | lazyAppend | src/public/ts/trace/rb-trace-tree.ts:10 | no-named-member(const/header/nothing) |
| R18.11: Cycle guard is ancestor-path-pre | ancestorGuard | src/public/ts/trace/rb-trace-tree.ts:7 | no-named-member(const/header/nothing) |
| R18.12 | lazyAppend | src/public/ts/trace/rb-trace-tree.ts:10 | no-named-member(const/header/nothing) |
| R18.12: True-cycle nodes are omitted cle | cycleOmit | src/public/ts/trace/rb-trace-tree.ts:4 | no-named-member(const/header/nothing) |
| R18.13 | classMethodScope | src/public/ts/trace/rb-trace-tree.ts:16 | no-named-member(const/header/nothing) |
| R18.14 | lazyAppend | src/public/ts/trace/rb-trace-tree.ts:10 | no-named-member(const/header/nothing) |
| R18.15 | lazyAppend | src/public/ts/trace/rb-trace-tree.ts:10 | no-named-member(const/header/nothing) |
| R18.16 | classMethodScope | src/public/ts/trace/rb-trace-tree.ts:16 | no-named-member(const/header/nothing) |
| R18.16: Traceability chain includes the  | classHop | src/ts/shared/TraceModel.ts:2 | no-named-member(const/header/nothing) |
| R18.17 | classMethodScope | src/public/ts/trace/rb-trace-tree.ts:16 | no-named-member(const/header/nothing) |
| R18.17: /trace sprint list shows each sp | sprintsDedupe | src/ts/server/server.ts:7 | no-named-member(const/header/nothing) |
| R18.18 | classMethodScope | src/public/ts/trace/rb-trace-tree.ts:16 | no-named-member(const/header/nothing) |
| R18.18: Sprint names in /trace include t | sprintNameFormat | src/ts/server/server.ts:10 | no-named-member(const/header/nothing) |
| R18.19 | checkRoundTrip | scripts/generate-sprint-md.ts:18 | no-named-member(const/header/nothing) |
| R18.19: Sprint numbers are zero-padded 2 | sprintZeroPad | src/ts/server/server.ts:9 | no-named-member(const/header/nothing) |
| R18.20 | classMethodScope | src/public/ts/trace/rb-trace-tree.ts:16 | no-named-member(const/header/nothing) |
| R18.20: Detail view (right pane) shows A | renderAll | src/public/ts/trace/rb-class-detail.ts:2 | no-named-member(const/header/nothing) |
| R18.21 | classMethodScope | src/public/ts/trace/rb-trace-tree.ts:16 | no-named-member(const/header/nothing) |
| R18.22 | classMethodScope | src/public/ts/trace/rb-trace-tree.ts:16 | no-named-member(const/header/nothing) |
| R18.23 | classMethodScope | src/public/ts/trace/rb-trace-tree.ts:16 | no-named-member(const/header/nothing) |
| R18.25 | lazyAppend | src/public/ts/trace/rb-trace-tree.ts:10 | no-named-member(const/header/nothing) |
| R18.25: Tree narrowed chain continues pa | chainToTest | src/public/ts/trace/rb-trace-tree.ts:6 | no-named-member(const/header/nothing) |
| R18.26 | classMethodScope | src/public/ts/trace/rb-trace-tree.ts:16 | no-named-member(const/header/nothing) |
| R18.27 | classMethodScope | src/public/ts/trace/rb-trace-tree.ts:16 | no-named-member(const/header/nothing) |
| R18.27: Browse-File link opens the file- | highlightFile | src/ts/server/FileApi.ts:5 | no-named-member(const/header/nothing) |
| R18.28 | classMethodScope | src/public/ts/trace/rb-trace-tree.ts:16 | no-named-member(const/header/nothing) |
| R18.29 | checkRoundTrip | scripts/generate-sprint-md.ts:18 | no-named-member(const/header/nothing) |
| R18.30 | checkRoundTrip | scripts/generate-sprint-md.ts:18 | no-named-member(const/header/nothing) |
| R18.31 | checkRoundTrip | scripts/generate-sprint-md.ts:18 | no-named-member(const/header/nothing) |
| R18.33 | syncSelection | src/public/ts/trace/rb-trace-tree.ts:5 | no-named-member(const/header/nothing) |
| R19.10 | modeSet | src/public/ts/RoomView.ts:6 | no-named-member(const/header/nothing) |
| R19.11 | render | src/public/ts/RoomView.ts:5 | no-named-member(const/header/nothing) |
| R19.12 | render | src/public/ts/RoomView.ts:5 | no-named-member(const/header/nothing) |
| R19.13 | render | src/public/ts/RoomView.ts:5 | no-named-member(const/header/nothing) |
| R19.16 | applyButton | src/public/ts/RoomView.ts:3 | no-named-member(const/header/nothing) |
| R19.17 | acceptApply | src/ts/server/Room.ts:3 | no-named-member(const/header/nothing) |
| R19.19 | modeSet | src/public/ts/RoomView.ts:6 | no-named-member(const/header/nothing) |
| R19.20 | linkToRoom | src/ts/scenario/file-unit.ts:2 | no-named-member(const/header/nothing) |
| R19.21 | mountTraceTree | src/public/ts/RoomView.ts:4 | no-named-member(const/header/nothing) |
| R19.21.A | folderNodeRender | src/public/ts/RoomView.ts:2 | no-named-member(const/header/nothing) |
| R19.21.B | dragGhost | src/public/ts/trace/rb-object-item.ts:4 | no-named-member(const/header/nothing) |
| R19.22 | persistAsSymlink | src/ts/server/Room.ts:5 | no-named-member(const/header/nothing) |
| R19.22.A | persistAsSymlink | src/ts/server/Room.ts:5 | no-named-member(const/header/nothing) |
| R19.24 | stripSpectator | src/ts/server/Room.ts:6 | no-named-member(const/header/nothing) |
| R19.25 | badgeRender | src/public/ts/trace/rb-object-item.ts:6 | no-named-member(const/header/nothing) |
| R19.26 | iconDrag | src/public/ts/trace/rb-object-item.ts:3 | no-named-member(const/header/nothing) |
| R19.27 | squareCollapse | src/public/ts/trace/rb-object-item.ts:5 | no-named-member(const/header/nothing) |
| R19.28 | prefetchLayer | src/public/ts/trace/rb-trace-tree.ts:9 | no-named-member(const/header/nothing) |
| R19.29 | computeBadges | src/public/ts/trace/rb-trace-tree.ts:3 | no-named-member(const/header/nothing) |
| R19.39 | ensureRawBinUser | src/ts/scenario/classes.ts:7 | no-named-member(const/header/nothing) |
| R19.51 | indexByContentHash | src/ts/scenario/file-unit.ts:8 | no-named-member(const/header/nothing) |
| R19.55.A | deviceAssociation | scripts/migrate-users-devices.ts:2 | no-named-member(const/header/nothing) |
| R19.56 | canonicalShard | src/ts/scenario/index-store.ts:1 | no-named-member(const/header/nothing) |
| R19.60 | backfillFiles | src/ts/server/Room.ts:4 | no-named-member(const/header/nothing) |
| R19.63 | filePreview | src/public/ts/trace/rb-detail-drawer.ts:9 | no-named-member(const/header/nothing) |
| R19.64 | byTypeRender | src/public/ts/trace/rb-detail-drawer.ts:10 | no-named-member(const/header/nothing) |
| R19.65 | render | src/ts/server/server.ts:8 | no-named-member(const/header/nothing) |
| R19.67 | roomScenarioDetail | src/public/ts/trace/rb-detail-view.ts:2 | no-named-member(const/header/nothing) |
| R19.96 | showUserUuid | src/public/ts/ProfileEditor.ts:1 | no-named-member(const/header/nothing) |
| S1 Foundation — Bootstrap RawBin team an | strip | src/public/ts/RawBinClient.ts:2 | no-named-member(const/header/nothing) |
| R-A2: Avatar upload must work without ex | avatarPersist | src/ts/server/server.ts:273 | split-for-cluster |
| R-R1: All user rooms load from disk on c | keylessUpload | src/ts/server/server.ts:276 | split-for-cluster |
| R-V1: Version update bar must appear on  | rekeyFix | src/ts/server/server.ts:443 | split-for-cluster |
| R10.2 — In the opened profile sheet, the | onClickDelegate | src/public/ts/trace/rb-object-item.ts:159 | split-for-cluster |
| R10.3 — Tapping your OWN member item ope | onClickDelegate | src/public/ts/trace/rb-object-item.ts:159 | split-for-cluster |
| R10.4 | onClickDelegate | src/public/ts/trace/rb-object-item.ts:159 | split-for-cluster |
| R15.5 — `ListOverview` with search over  | render | src/public/ts/trace/rb-object-item.ts:14 | split-for-cluster |
| R15.6 — Task DetailViews + planning Over | searchAndFilter | src/public/ts/trace/rb-list-overview.ts:9 | split-for-cluster |
| R16.3: pageNav() sticky to top | stickyBottom | src/public/ts/trace/rb-detail-drawer.ts:82 | split-for-cluster |
| R16.5 | open | src/public/ts/trace/rb-detail-drawer.ts:16 | split-for-cluster |
| R16.6 | render | src/public/ts/trace/rb-object-item.ts:19 | split-for-cluster |
| R16.7 | setIcon | src/public/ts/trace/rb-object-item.ts:15 | split-for-cluster |
| R16.8 | drag | src/public/ts/trace/rb-object-item.ts:21 | split-for-cluster |
| R16.9 | collapse | src/public/ts/trace/rb-object-item.ts:24 | split-for-cluster |
| R17.3: Class-based instances — typed cla | renderHtml(scenario): string | src/ts/scenario/templates.ts:9 | split-for-cluster |
| R17.17: Task status as state-machine met | renderHtml(scenario): string | src/ts/scenario/templates.ts:9 | split-for-cluster |
| R18.34 | onPinchEnd | src/ts/server/server.ts:274 | split-for-cluster |
| R18.34.B | onPinchEnd | src/ts/server/server.ts:274 | split-for-cluster |
| R19.3 | visibilityCheck | src/ts/server/Room.ts:126 | split-for-cluster |
| R19.4 | visibilityCheck | src/ts/server/Room.ts:126 | split-for-cluster |
| R19.41 | logAtLevel | src/ts/server/server.ts:277 | split-for-cluster |
| R19.42 | feedbackCycle | src/public/ts/drop-dispatcher.ts:34 | split-for-cluster |
| R19.43 | feedbackCycle | src/public/ts/drop-dispatcher.ts:34 | split-for-cluster |
| R19.44 | feedbackCycle | src/public/ts/drop-dispatcher.ts:34 | split-for-cluster |
| R19.45 | flushAndReload | src/public/sw.js:29 | split-for-cluster |
| R19.46 | restoreFilesFromScenario | src/ts/server/server.ts:272 | split-for-cluster |
| R19.47 | reuseByContentHash | src/ts/scenario/file-unit.ts:4 | split-for-cluster |
| R19.48 | versionByName | src/ts/scenario/file-unit.ts:5 | split-for-cluster |
| R19.49 | computeContentHash | src/ts/scenario/file-unit.ts:6 | split-for-cluster |
| R19.50 | uploadEndpoint | src/ts/server/server.ts:279 | split-for-cluster |
| R19.53 | canonicalDir | src/ts/server/Room.ts:125 | split-for-cluster |
| R19.54 | createUserUnit | src/ts/server/server.ts:278 | split-for-cluster |
| R19.55 | createDeviceUnit | src/ts/server/server.ts:270 | split-for-cluster |
| R19.57 | raiseAboveDrawer | src/ts/server/server.ts:271 | split-for-cluster |
| R19.61 | registerAllTypes | src/ts/scenario/templates.ts:11 | split-for-cluster |

## TOOL-FIX for canonical scorer (skill-classes.ts:86-90)
Replace hasRealImpl string-match with: locate marker line → ownerDecl(leading-trivia) named-member=PASS;
else innermost enclosing named fn with label name-match=PASS; else FAIL. Drop the bare srcContent.some(re.test).
Recommend skill-expert folds scripts/strict-marker-audit.ts logic into skill-classes.ts; planner+SM co-validate vs anchors.