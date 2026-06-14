### R19.8.B: Persistent rejoin flips the existing member back to online — never adds a duplicate entry.

<details><summary>Tron directive</summary>

> When a member rejoins a persistent room, the server MUST look up the existing member entry by playerToken and flip disconnected→false (online). It MUST NOT add a new member entry. Members are keyed by identity (playerToken) and the member list is always unique by that key. This is the rejoin half of the R19.8.A transition contract: R19.8.A covers leave (online→offline, never prune); R19.8.B covers rejoin (offline→online, never duplicate). The deduplication invariant holds at all times — no user ever appears twice in the members bar.

</details>

## Traceability

**Tasks:**
- [🔗 T-persistent-dedup: Room.addMember match-by-playerToken reconnect vs reject vs insert](../task/persistent-dedup-addmember-match-reconnect-reject-insert.md)

**UseCases:**
- [🔗 room.rejoinDedup](../usecase/room-rejoindedup.md)
