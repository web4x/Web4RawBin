[Back to Sprint 9 Planning](./planning.md)

# T78: Client Updates

[task:uuid:9c9d4eda-ed8b-466b-b738-a5d4c621be7a]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [ ] testing (handed to robbin-tester)
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [Sprint 9 Planning](./planning.md)
- down
  - None (atomic task)

## Task Description
- PO: Default room name from profile.name. Full UUID in cards. Persistence indicator.

## Context
See [requirements.md](./requirements.md) and [architecture.md](./architecture.md) for full spec.

## Acceptance Criteria
- [x] (a) Default room name from `profile.name` — `RoomBrowser.ts` create-form prefill + confirm fallback `${name}'s Room`
- [x] (b) Full UUID in room cards — `.room-id` span renders `room.id` (full crypto.randomUUID, not sliced)
- [x] (c) Persistence indicator — `.room-persist` "💾 Persistent" badge on every room card (all Sprint 9 rooms persist to disk with own SSH identity)
- [x] Owner attribution — `.room-owner` "by &lt;name&gt;" / "you" badge from `ownerToken`/`ownerName`
- [x] `npm run build` succeeds (v0.4.8, bundle app-G2VRAV5W.js)
- [ ] robbin-tester: verify badges render in lobby; full E2E suite stays 21/21 (no regression)

## Implementation Notes
- `src/public/ts/RoomBrowser.ts`: added `.room-persist` badge in room-info block
- `src/public/app.css`: `.room-persist` style (green, 0.65rem)
- (a) and (b) and owner attribution were already committed at v0.4.5 (a216e5a); this task adds the persistence indicator + commits the `.room-owner`/`.room-id` CSS stubs that were uncommitted

## QA Audit & User Feedback
- Pending Tron QA review.

## Subtasks
None (atomic task for this sprint).
