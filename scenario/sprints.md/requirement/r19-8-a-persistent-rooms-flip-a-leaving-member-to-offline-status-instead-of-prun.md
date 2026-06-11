### R19.8.A: Persistent rooms flip a leaving member to offline status instead of pruning them from the member list.

<details><summary>Tron directive</summary>

> When a member leaves (disconnects, navigates away, or closes the app) a persistent room, the server MUST toggle their status from online to offline — NOT remove (prune) them from the member list. The member row stays visible in the Members tree with an offline indicator. Rejoining flips the status back to online. This is the transition-event contract that R19.8 implies but does not explicitly state: R19.8 describes the steady-state (members shown as offline), R19.8.A makes the leave-event behavior explicit (flip, never prune). Royal Jungle bug anchor.

</details>

## Traceability

**Tasks:**
- [🔗 fa8fffc8](/scenario?ior=fa8fffc8-8e2e-4b8c-a79b-8e7c1d1c8f0e)

**UseCases:**
- [🔗 room.retainOnDisconnect](../usecase/room-retainondisconnect.md)
