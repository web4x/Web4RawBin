### R19.82: Joining a room from lobby must succeed — stale online-status must not block rejoin.

<details><summary>Tron directive</summary>

> BUG: 'cannot join room' errors from the lobby. Root cause: after server restart/crash, persisted members have disconnected=false (stale online-status — no live WebSocket backs it). When the same user tries to rejoin, the server sees them as 'already connected' and rejects the join. FIX: on room load (R19.59 load-before-write), reset ALL persisted members' disconnected=true (no live WS exists after restart). On join, if the member already exists in members[], flip disconnected→false (R19.8.B dedup) instead of rejecting. Never reject a join for a member that has no live WS backing their online status.

</details>

## Traceability

**Tasks:**
- [🔗 T-room-join-stale-takeover: joining from lobby must succeed (same-token takeover, never reject)](../task/room-join-stale-takeover-same-token.md)

**UseCases:**
- [🔗 room.addMemberTakeover](../usecase/room-addmembertakeover.md)
