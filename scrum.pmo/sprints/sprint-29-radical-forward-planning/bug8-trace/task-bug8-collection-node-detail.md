# BUG8: /trace collection node detail stuck 'Loading children...'

[requirement:uuid:12cf7bb5] BUG8 — collection detail via parent

## Root Cause

Collection nodes (Members/Files) in the /trace tree are SYNTHETIC: the server builds them with fabricated UUIDs (members-roomUuid / files-roomUuid) that do NOT exist in the scenario index. When clicked, renderDetailForRef fetches /api/trace/children/syntheticUuid -> 404 (no scenario unit) -> stuck on "Loading children..."

TWO layers:

**Layer 1 (server data shape):** Server originally returned uuid:'members' (bare). Fixed to uuid:'members-roomUuid' so the client can extract the parent room UUID.

**Layer 2 (client nesting mismatch):** Server returns the room's children as TWO collection WRAPPER nodes, each with Member/File items NESTED inside .children. Client renderDetailForRef filtered data.children at the TOP level (found only the 2 wrappers, type=collection, not Member/File) -> 0 matches -> "None". Fix: find the matching wrapper by UUID, read ITS .children:

    // rb-detail-drawer.ts:102 -- BEFORE (broken):
    const children = (data.children || []).filter(c => kind === 'members' ? c.type === 'Member' : c.type === 'File');
    
    // AFTER (fixed -- wrapper lookup):
    const coll = (data.children || []).find(c => c.uuid === uuid);
    const children = coll?.children || [];

## Traceability Chain

    [requirement:uuid:12cf7bb5]  BUG8 collection detail via parent
      |
    [uc:uuid:38204812-e251-438a-be74-14c3c7291d3c]  collectionDetail.resolveViaParent
      |
    [class:uuid:0dd08b2f]  RbDetailDrawer (canonical, 14 methods)
      |
    [method:uuid:0a902bff]  RbDetailDrawer.renderDetailForRef @ rb-detail-drawer.ts:84
      |
    [impl:uuid:36934fe3]  renderDetailForRef.collectionHandler @ rb-detail-drawer.ts:90
      |
    [test:uuid:pending]  tester writes RED->GREEN

PUML ref: shared detail-drawer chain family

## Use Case

[uc:uuid:38204812-e251-438a-be74-14c3c7291d3c] collectionDetail.resolveViaParent

Collection node click -> detect synthetic UUID (members-*/files-*) -> fetch PARENT room /api/trace/children -> find matching collection wrapper by UUID -> render ITS nested children (Member/File items). Falls back gracefully if wrapper not found.

## Evidence

- bug-loading-children-404.png -- Tron screenshot: "Loading children..." stuck
- fix-files-22.png -- after fix: Files collection renders 22 file items
- fix-members-50.png -- after fix: Members collection renders 50 member items

## Status
- [x] Root cause identified (2 layers: server uuid + client nesting)
- [x] UC designed (fd31756f collectionDetail.resolveViaParent)
- [x] Method linked (0a902bff RbDetailDrawer.renderDetailForRef)
- [x] Impl exists (36934fe3 collectionHandler)
- [ ] Test (tester RED->GREEN)
- [ ] QA Review (Tron)
