# Chain Gap Inventory — Wave 1 Audit (2026-06-11)

**Auditor:** robbin-architect
**Total units:** 890

## Summary

| Gap Type | Count | Priority |
|----------|------:|----------|
| Requirements without UC | 89 | HIGH — chain can't start |
| Tasks without UC | 59 | MEDIUM — navigation orphans |
| UCs without Class | 2 | HIGH — chain broken |
| UCs without Method | 8 | HIGH — chain broken |
| Classes without Method | 1 | LOW |
| Methods without Implementation | 14 | MEDIUM — S19 new methods |
| Implementations without Test | 14 | HIGH — champagne blocked |

## Triage

### Wave 1 Target: UC-level completeness (89 reqs + 8 UCs)

The 89 reqs without UC fall into categories:
- **S19 active tasks (already designed):** R19.2/A, R19.7-10, R19.21-32 — most have task chains I anchored this session, just req→UC link missing
- **S17-S18 standing/meta reqs:** R17.21-47, R18.9-28 — infrastructure/CI/quality reqs, many orphan-by-design (T199 precedent)
- **S14-S16 legacy reqs:** R14.3-4, R15.4, R16.x — old sprints, partially wired

### Wave 1 Action Plan:
1. **robbin-req:** Wire req→UC forward links for the 89 reqs that already HAVE a UC (via task→UC chain) but req.useCases[] is empty
2. **robbin-architect:** Create missing UCs for the 8 UC-without-method gaps + 2 UC-without-class gaps
3. **robbin-expert:** Create impl scenario units for the 14 methods without impl (S19 new methods)

### taskNoUC (59) — NOT a chain gap
Tasks are NAVIGATION, not chain. Task.useCases[] is for tree rendering, not the 6-step chain. These are lower priority — planner backfill.

## Full Gap Lists

### reqNoUC (89)
(See audit output — each entry has uuid prefix + name)

### ucNoClass (2)
- 725981f9 sourceLink.browse
- 89aff659 roleSkill.coSpecify

### ucNoMethod (8)
- 17a00401 migrate.sprintToScenario
- 1e908382 traceTree.renderAllTypes
- 558cbb5c symlinkTree.extendClasses
- 71d57474 treeRender.lazyAppend
- 725981f9 sourceLink.browse
- 84298ac0 detailDrawer.stickyBottom
- 89aff659 roleSkill.coSpecify
- a51a9ed3 detailView.setBackground

### classNoMethod (1)
- c3e3b9c3 AppClient

### methodNoImpl (14)
- 0e11cfb4 JoinRequestFlow.applySend
- 2686a446 RbRoomDetail.modeSet
- 2d189279 Room.visibilityCheck
- 4fed4fda Room.init
- 6fc898ab RbRoomDetail.editOpen
- 7144f6ca Room.persistAsSymlink
- 81d53df2 RbRoomDetail.scenarioLinkRender
- 8474594f RbObjectItem.onClickDelegate
- 9f53d391 RbRoomContent.render
- a83cd5a4 Room.stripSpectator
- ea02fa6d Room.memberAdd
- ed543211 FileUnit.upload
- f1dd0d77 Room.stripSizeLimits
- f82d09a5 Room.retainOrPrune

### implNoTest (14)
- 39074a59 T40 header
- 40140a01 R17.19
- 574ae9d1 T43 member badge
- 7b4d275b T45 QR popup
- 7bb9a7dd T68 markdown preview
- a4133b09 R17.15
- b1113a7d R16.2 RequirementDetailView
- b549aef8 T43 member list
- b7142a01 T142 vCard parser
- c335d0b8 T65 file tree
- c5134d0a R17.16
- d1135c9f R16.5 square SVG type icons
- e8d226f6 Assets.rebrand impl
- f8138a01 R17.18
