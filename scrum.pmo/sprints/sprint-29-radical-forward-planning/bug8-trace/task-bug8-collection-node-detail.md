[Back to Sprint 29 Planning](../planning.md)

# BUG8: Collection Node Detail — 'Loading children…' on synthetic UUID 404

[task:uuid:12cf7bb5-36d5-415e-92b2-75b14fb5cc23]

## Status
- [ ] Planned
- [x] In Progress
  - [x] requirement captured
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Requirement

[requirement:uuid:12cf7bb5-36d5-415e-92b2-75b14fb5cc23]

> TRON: "the collections in the room detail are not clickable" + device screenshot IMG_4037: tapping a /trace COLLECTION node (Members / Files) → detail drawer STUCK on 'Loading children…' — synthetic UUID 404s on lookup.

**Root cause:** Synthetic-UUID collections (members-<roomUuid>, files-<roomUuid>) are NOT real scenario units in the index — fetch-by-uuid returns 404. The detail drawer tries to load them as units and fails.

**Fix:** Collection detail MUST resolve via the PARENT Room's /api/trace/children (the Room knows its members[]/files[]), NOT by fetching the synthetic UUID as a standalone unit.

## Acceptance Criteria
- [ ] Tap Members collection in /trace → detail drawer shows member item list (not 'Loading children…')
- [ ] Tap Files collection in /trace → detail drawer shows file item list (not 'Loading children…')
- [ ] No 404 errors for synthetic collection UUIDs (members-*/files-*) — detected + resolved via parent
- [ ] Same fix works in room context (BUG10 da4a27bc = same family)

## Screenshots

![Bug: Loading children 404](./bug-loading-children-404.png)

## Traceability
- up
  - [requirement:uuid:12cf7bb5-36d5-415e-92b2-75b14fb5cc23] — BUG8 collection-detail-via-parent
  - [Sprint 29 Planning](../planning.md)
- chain
  - UC: collectionDetail.resolveViaParent (38204812)
  - Class: RbDetailDrawer (0dd08b2f)
  - Method: openForRef (0a902bff)
  - Impl: 36934fe3
  - Test: needed
- down
  - None (atomic task)
