[Back to README](../../README.md)

# Sprint 9 Planning — Room as Persistent SSH Identity

## Sprint Goal
Transform rooms from ephemeral shared spaces into persistent, per-user SSH identities with their own keypairs, permanent storage, and owner-controlled lifecycle.

## Sprint Overview
**Focus:** Room persistence, SSH key generation per room, owner lifecycle, lobby sync
**Team:** robbinTeam (PO, architect, expert, tester)
**Input Sources:** Tron directive 2026-05-25
**Architecture:** [architecture.md](./architecture.md) | **Requirements:** [requirements.md](./requirements.md)

## Task List

- [ ] [T74: Room Directory + SSH Keypair](./task-74-room-keys.md)
  **Priority:** 1 (CRITICAL — foundation)
  **Effort:** 3h expert + 1h tester
  - Create room folder under user dir: data/users/<token>/rooms/<uuid>/
  - Generate RSA-2048 keypair per room (OOSH .ssh/ pattern)
  - room.json metadata file
  - Default name: "${profile.name}'s Room"

- [ ] [T75: Room Persistence + Startup Load](./task-75-room-persist.md)
  **Priority:** 2 (HIGH — rooms must survive restart)
  **Effort:** 2h expert + 1h tester
  - Scan data/users/*/rooms/*/room.json on startup
  - Restore rooms as dormant (not listed until owner connects)
  - Persist on every mutation (join/leave/chat/settings)
  - Remove auto-cleanup (no more cleanupStale for persistent rooms)

- [ ] [T76: Owner Lifecycle + Manual Delete](./task-76-room-lifecycle.md)
  **Priority:** 3 (HIGH — owner-only control)
  **Effort:** 2h expert + 1h tester
  - Rooms ONLY deleted by owner (manual DELETE_ROOM)
  - Delete removes folder + .ssh/ keys + room.json
  - No auto-delete on empty, no timeout cleanup
  - Owner reconnect re-advertises rooms

- [ ] [T77: Lobby Sync + Room Advertise](./task-77-lobby-sync.md)
  **Priority:** 4 (HIGH — rooms visible to all)
  **Effort:** 2h expert + 1h tester
  - On lobby connect, owner's rooms broadcast to all clients
  - ROOM_LIST updates via WS on create/delete/join/leave
  - Dormant rooms become active when owner connects
  - Room list shows owner name, member count, private status

- [ ] [T78: Client Updates](./task-78-client-updates.md)
  **Priority:** 5 (MEDIUM — UI changes)
  **Effort:** 1h expert
  - Default room name from profile.name in RoomBrowser create form
  - Full UUID in room cards (was truncated)
  - Room persistence indicator in lobby (persistent badge)

- [ ] [T79: E2E Tests](./task-79-room-e2e.md)
  **Priority:** 6 (MEDIUM)
  **Effort:** 2h tester
  - Playwright: create room → restart server → room still listed
  - Room SSH keys exist on disk after creation
  - Owner delete removes room + keys
  - Non-owner cannot delete

## Dependency Graph
```
T74 (keys) → T75 (persist) → T76 (lifecycle) → T77 (sync)
                                                  T78 (client)
T79 (E2E — after all)
```

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 6 (T74-T79) |
| Expert effort | ~10h |
| Tester effort | ~3h |

## Definition of Done
- [ ] Rooms persist across server restarts
- [ ] Each room has RSA-2048 keypair in OOSH .ssh/ pattern
- [ ] Rooms only deleted manually by owner
- [ ] Lobby syncs room list via WS to all clients
- [ ] Default room name is "${name}'s Room"
- [ ] All vitest + Playwright pass

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-25
**Sprint:** Sprint 9 — Room as Persistent SSH Identity
