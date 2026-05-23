# Task 3.4: Align Room.ts with Test Cases

**Status:** DONE
**Assigned:** robbin-expert (fix Room.ts) + robbin-tester (fix tests)
**Priority:** 3 (blocks T3 completion)

## Context

Expert wrote Room.ts (385 lines), tester wrote room.test.ts (484 lines, 33 tests) in parallel. First vitest run: 6 passed, 27 failed. Failures are API mismatches, not logic bugs. Both sides need alignment.

## Test Results: 6 PASS / 27 FAIL

### Category 1: info() returns object, tests expect primitives
Tests do `room.info().hostId` but get the Room object instead of the info sub-object.
**Fix:** Expert — check that `info()` returns a plain RoomInfo object (not `this`).

### Category 2: addMember not incrementing memberCount
`room.addMember(...)` returns success but `room.info().memberCount` stays 0.
**Fix:** Expert — verify `addMember` adds to `members` Map and `info().memberCount` reflects `members.size`.

### Category 3: Chat method name mismatch
Tests call `room.addChatMessage(senderId, senderName, text)`. Expert implemented `room.addChat(senderId, senderName, text)`.
**Fix:** Either rename expert method to `addChatMessage` or tester updates calls. PO preference: use `addChat` (shorter) — **tester updates tests**.

### Category 4: Archive doesn't throw on rejected join
Tests expect `room.addMember()` to throw when room is archived. Expert returns false.
**Fix:** Tester updates test to check return value instead of throw. `expect(room.addMember(...)).toBe(false)`.

### Category 5: Archive broadcast not reaching mocked ws
Tests mock ws.send but broadcast doesn't call it.
**Fix:** Expert — verify `broadcast()` calls `member.ws.send(JSON.stringify(msg))` for members with `readyState === 1`. Tester — mock `ws.readyState` to `1` (WebSocket.OPEN).

### Category 6: File persistence path.join error
`persistDir` is being passed as an object instead of string.
**Fix:** Expert — ensure Room constructor accepts `persistDir: string`. Tester — pass string path not object.

### Category 7: Spectator count in memberCount
Tests expect spectators counted in memberCount. Expert counts only members.
**Fix:** Tester updates tests — spectators should NOT be in memberCount per architecture spec. `info().memberCount` = `members.size`, not `members.size + spectators.size`.

### Category 8: findMemberRoom / findSpectatorRoom returns undefined
RoomManager.findMemberRoom doesn't find the member.
**Fix:** Expert — verify RoomManager iterates all rooms and checks `room.members.has(id)`.

### Category 9: cleanupStale parameter
Tests pass `cleanupStale(0)` (0ms threshold). Expert may not accept a threshold param.
**Fix:** Expert — add optional `maxAgeMs` parameter to `cleanupStale()`. Default = 10 minutes.

## Who Fixes What

**Expert fixes (Room.ts):**
- info() must return plain RoomInfo object
- addMember must actually add to members Map
- broadcast must call ws.send on members with readyState 1
- persistDir must be string
- findMemberRoom / findSpectatorRoom must iterate correctly
- cleanupStale accepts optional threshold parameter

**Tester fixes (room.test.ts):**
- addChatMessage → addChat
- Archive throw → check return false
- Spectator memberCount assertion → exclude spectators
- persistDir: pass string path
- Mock ws.readyState = 1

## Acceptance Criteria
- [x] All 33 tests pass
- [x] No test changes that weaken coverage
