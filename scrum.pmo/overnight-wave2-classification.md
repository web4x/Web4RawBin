# Wave 2 Classification: 61 Reqs Without UC

**Auditor:** robbin-architect (2026-06-11)
**Input:** 61 reqs remaining after req-eng wired 28 in Wave 1.

## ORPHAN-BY-DESIGN (23) — meta/CI/process reqs with no behavioral UC

Per T199 precedent: these describe quality gates, CI enforcement, team process, or traceability-infrastructure rules. They have no Object.verb behavioral contract — they are verified by audit scripts or team protocol, not by a UC→Class→Method chain.

| # | UUID prefix | Name | Rationale |
|---|-------------|------|-----------|
| 1 | 024c7b8f | R17.21: Req-eng + planner LEARN scenarios for planning | Team process — no code UC |
| 2 | 891f1983 | R17.22: Skills on top of scenarios | Team tooling meta |
| 3 | 39a893de | R17.23: Fork skill-expert from expert | Team org meta |
| 4 | c52d63e7 | R17.33: Chain order is requirement → task → usecase... | Traceability rule — verified by audit script |
| 5 | d63e74f8 | R17.34: Implementation traces finally to test | Traceability rule — verified by audit |
| 6 | e74f85a9 | R17.35: One implementation can have multiple tests | Cardinality rule — verified by audit |
| 7 | f85a96b0 | R17.36: Every scenario unit reachable from requirement | Coverage rule — verified by trace:audit:strict |
| 8 | a96b07c1 | R17.37: Zero backward-direction links | Data rule — verified by strip-back-refs.ts |
| 9 | b07c18d2 | R17.38: Zero orphan scenario units | Data rule — verified by trace:audit |
| 10 | c18d29e3 | R17.39: Data-quality CI gate fails on traceability issues | CI gate meta — the gate itself is the verification |
| 11 | d29e3af4 | R17.40: Rule-pair CI gate enforces package.json + sw.js | CI gate meta |
| 12 | e3af4ba5 | R17.41: Chain-order CI gate validates 7-step canonical | CI gate meta |
| 13 | f4ba5cb6 | R17.42: Scrum master re-activated for monitoring | Team process meta |
| 14 | a5cb6dc7 | R17.43: All 50 untraced scenario units linked | One-shot backfill — done or not, no ongoing UC |
| 15 | d8fe90a1 | R17.46: Missing traceability data filled consistently | Data-fill meta — pipeline script, not UC |
| 16 | e9a0f1b2 | R17.47: Every Test reachable from Requirement | Coverage rule — verified by champagne audit |
| 17 | 40756631 | Every unit has valid ownerIor and unitLinks[] | Data integrity rule — verified by audit |
| 18 | 80ca8e83 | Proper fix for room-flood (prod-pollution) | Incident fix — one-shot, no ongoing UC |
| 19 | 4d525a4d | R-placeholder (T202 sibling): Shared Class chainMethod | Architecture rule — verified by T202 chain narrowing code |
| 20 | cd5b1611 | Shared Class: trace tree shows UC's method | Same as T202 — architecture rule |
| 21 | 24b2c3d4 | R14.3: Prove migration integrity | One-shot verification — migration done |
| 22 | 34c3d4e5 | R14.4: Remove legacy load path + files (GATED) | One-shot gated removal — done or pending gate |
| 23 | 4efd2fb6 | R19.15: Room scenario json passes same json test | Data-shape rule — verified by test, not a UC |

## NEED UC DESIGN (28) — real feature reqs with behavioral Object.verb

### S15 legacy (1)
| # | UUID prefix | Name | Designed UC |
|---|-------------|------|-------------|
| 24 | 35c3d4e5 | R15.4: defaultItemView per object for lists | objectItem.render (already exists — wire req→UC) |

### S18 tree/chain UX (15)
| # | UUID prefix | Name | Designed UC → Class → Method |
|---|-------------|------|------------------------------|
| 25 | f3ee66eb | R18.9: Chain cycles eliminated — forward-only with cycle guard | traceTree.cycleGuard → RbTraceTree.cycleGuard |
| 26 | 3a88164d | R18.10: Tree lazy-loads NEXT layer only | traceTree.lazyExpand → RbTraceTree.fetchAndRenderChildren |
| 27 | 9d187326 | R18.11: Cycle guard is ancestor-path-precise | traceTree.ancestorGuard → RbTraceTree.ancestorGuard |
| 28 | 700b2e94 | R18.12: True-cycle nodes omitted cleanly | traceTree.cycleOmit → RbTraceTree.cycleOmit |
| 29 | b55fe0f5 | R18.16: Chain includes Class level between UC and Method | traceGraph.classHop → TraceGraph.classHop |
| 30 | f917bc66 | R18.17: Sprint list shows each sprint exactly ONCE | sprintList.dedupe → server.sprintsDedupe |
| 31 | 8c19e98b | R18.18: Sprint names include sprint number | sprintList.numberLabel → server.sprintNameFormat |
| 32 | 8af89ef9 | R18.19: Sprint numbers zero-padded | sprintList.zeroPad → server.sprintZeroPad |
| 33 | c16ab068 | R18.20: Detail view shows ALL methods/children (full object) | detailView.showFullObject → RbClassDetail.renderAll |
| 34 | 293f04ea | R18.21: Parent link navigates to ownerIor parent | detailView.parentNav → RbDetailDrawer.parentNav |
| 35 | f07e7f82 | R18.22: Browse File link jumps to file browser | detailView.browseFile → RbDetailDrawer.browseFile |
| 36 | e53964ae | R18.23: Browse-File carries LINE info | detailView.browseFileLine → RbDetailDrawer.browseFileLine |
| 37 | 72f4ac57 | R18.24: Detail chain section shows narrowed single-thread | detailView.narrowChain → RbDetailDrawer.narrowChain |
| 38 | cacdf662 | R18.25: Tree chain continues past Method to Test | traceTree.chainToTest → RbTraceTree.chainToTest |
| 39 | 884bad43 | R18.26: Source link on ALL types | detailView.sourceLink → RbDetailDrawer.sourceLink |

### S18 file-browser (3)
| 40 | ad721573 | R18.27: Browse-File opens folder with file highlighted | fileBrowser.highlightFile → FileApi.highlightFile |
| 41 | 48d8c0cd | R18.28: Line info carried to Monaco | fileBrowser.lineInfo → FileApi.lineParam |
| 42 | b64a9d54 | Detail navigation syncs tree selection | traceTree.syncSelection → RbTraceTree.syncSelection |

### S19 room features (10)
| 43 | e61b4760 | R19.16: BY-INVITE rooms show Apply button | room.applyButton → RbRoomContent.applyButton |
| 44 | 4ca31ded | R19.17: Accepting invite joins requester | room.acceptInvite → Room.acceptApply |
| 45 | ba3fa399 | R19.18: No contact ever lost from member list | (= R19.8 alias — wire to existing UC room.retainOnDisconnect) |
| 46 | c31aaa02 | R19.19: Mode switchable PERSISTENT↔LIVE in editor | room.switchMode → RbRoomDetail.modeSet (exists) |
| 47 | 4a9d1728 | R19.20: File unit carries unitLinks[] to room folder | file.unitLinks → FileUnit.linkToRoom |
| 48 | d1391ee3 | R19.21: In-room tree reuses rb-tree + rb-tree-item | room.reuseTraceTree → RbRoomContent.traceTreeMount |
| 49 | f732d200 | R19.21.A: Members/Files are rb-object-item folder nodes | room.folderNodes → RbRoomContent.folderNodeRender |
| 50 | 3676b612 | R19.21.B: Drag preview shows full item card | objectItem.dragGhost → RbObjectItem.dragGhost |

### S19 item-view features (5)
| 51 | 6ed53825 | R19.25: Red child-count badge | objectItem.badge → RbObjectItem.badgeRender |
| 52 | ad2a7074 | R19.26: Drag icon-only | objectItem.iconDrag → RbObjectItem.iconDrag |
| 53 | 4603db83 | R19.27: Icon-tap square collapse | objectItem.squareCollapse → RbObjectItem.squareCollapse |
| 54 | e790f0bc | R19.28: One-layer-ahead prefetch | traceTree.prefetchLayer → RbTraceTree.prefetchLayer |
| 55 | a688978b | R19.29: Tree owns badges + prefetch as methods | traceTree.computeBadges → RbTraceTree.computeBadges |

### S19 nav bugs (4)
| 56 | d3416a23 | R19.22: room.json symlink + UI link next to edit | (= R19.22.A+B alias — wire to existing UCs) |
| 57 | ca351869 | R19.30: Edit pen opens canonical unit | room.editCanonical → RbRoomDetail.editCanonical |
| 58 | 836c97f9 | R19.31: Room link navigates, never 404 | room.linkResolve → RbRoomContent.linkResolve |
| 59 | 1935258b | R19.32: Share link loads app, never offline | sw.ignoreSearchNav → ServiceWorker.ignoreSearchNav |

### Older (2)
| 60 | 41c49f04 | Detail drawer with swipe dismiss | detailDrawer.swipeDismiss (already exists — wire req→UC) |
| 61 | bb37674f | Editor back button navigates to parent | editor.backNav → RbEditorLayout.backNav |

## Summary

| Category | Count |
|----------|------:|
| **Orphan-by-design** (meta/CI/process) | **23** |
| **Need UC design** (real features) | **28** |
| — of which: wire to EXISTING UC only | 5 |
| — of which: need NEW UC + Method | 23 |
