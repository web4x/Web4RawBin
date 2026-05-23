[Back to Sprint 5 Planning](./planning.md)

# T37: Hotfixes — Private Room + Version Bar

[task:uuid:d37f0e04-7f80-4d6e-b102-004455667788]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [Sprint 5 Planning](./planning.md)
- down
  - None (atomic task)

## Task Description
- PO: Three Tron QA findings from live testing.

## QA Audit & User Feedback
- 2026-05-23: Tron — join private room still broken (blocks all private joins)
- 2026-05-23: Tron — join private section CSS is off-screen on mobile
- 2026-05-23: Tron — version must increment on each update, update bar must be RED not green

## Requirements

### 37.1 Fix private room join (server.ts line 672)
Current: `if (room.isPrivate) { send ERROR; break; }` — blocks ALL private rooms.
Fix: `if (room.isPrivate && room.roomKey !== msg.roomKey) { send ERROR 'Wrong room key'; break; }`

### 37.2 Fix join-private CSS
The `.lobby-join-private` section is off-screen on mobile. Ensure it's visible and scrollable within the lobby container.

### 37.3 Version increment + RED update bar
- Increment version in package.json from 0.1.0 to 0.2.0 (Sprint 5 = PWA milestone)
- Update /api/config to read version from package.json (not hardcoded)
- Change update banner from green to RED for visibility on thin connections
- Version displayed in update bar: "v0.2.0 available — Update Now"

## Acceptance Criteria
- [ ] Private room with key can be joined (correct key accepted, wrong key rejected)
- [ ] Join-private section visible on mobile viewport
- [ ] Version reads from package.json (not hardcoded)
- [ ] Update bar is RED
- [ ] /api/health shows new version

## Subtasks
None (atomic task).
