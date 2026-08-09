<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 25.7: Room membership dedup by resolved identity (structural, no duplicate members ever)

[task:uuid:d01c38b3-3a56-4586-88ae-e267708c30d1]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 25 Planning](./planning.md)
    - Requirement R25.7 `[requirement:uuid:585b6b9c-2fa7-48e2-8fab-a7e8a31e516e]`
  - crossRef
    - R23.3 identity-merge room cleanup (this HARDENS it structurally)
  - down
    - [UC-RD.1: room.dedupMembersOnLoad](./planning.md#uc-rd1) `[uc:uuid:e03132c7-ea09-4ec3-9b6a-e685e2b0f546]`
    - [UC-RD.2: consolidate.evictAbsorbedFromRooms](./planning.md#uc-rd2) `[uc:uuid:9300a275-d78b-4758-950f-d2d70d21c8e4]`
    - [UC-RD.3: connect.redirectTombstoneToPrimary](./planning.md#uc-rd3) `[uc:uuid:ede1de17-a252-4566-b5bd-f3a474d6217d]`
    - [UC-RD.4: room.addMemberIdempotent](./planning.md#uc-rd4) `[uc:uuid:85f40027-3b56-4a6e-94a2-c4b561f985e2]`

## Task Description

Duplicate room membership for one identity is made STRUCTURALLY IMPOSSIBLE via four enforcement points + an immutable, restart-durable redirectTo: (a) dedup members on room-load by resolveToken, (b) CONSOLIDATE evicts the absorbed profile from ALL rooms live, (c) tombstoned CONNECT redirects to the primary + immutable/restart-durable redirectTo, (d) Room.addMember idempotent on resolved token; memberCount/JOIN use allMemberInfo() (resolved+deduped). Plus a one-time GATED repair migration.

## Context

Architect design 662c0cc0f (scrum.pmo/design-notes/room-identity-dedup-structural-fix.md, measured vs Room.ts + server.ts HEAD) + 4 UCs refined 748122237 (Class Room + identity handlers, 4 methods, design-ahead). crossRef R23.3 (this HARDENS the R23.3 member-dedup — from display-path fix to structural). Impl base: Room.ts + server.ts.

## Intention

Tron: user appears as 3 members in Heartspaces — must NEVER happen again. Structural (not display-path) dedup so it is impossible by construction.

## Acceptance Criteria

- [x] (a room-load) At room load, each persisted member's token is mapped through resolveToken and grouped by primary — room.members holds AT MOST ONE entry per resolved identity — GREEN-outcome via orphan self-heal on load (v0.7.1 75e09c155); NOTE: achieved via self-heal + DISPLAY-hide, not a hard structural load-drop
- [ ] (b consolidate-evict) CONSOLIDATE evicts the absorbed profile from ALL rooms live (MEMBER_LEFT + corrected memberCount) — NOT verified by the v0.7.1 outcome gate
- [ ] (c connect-redirect) A tombstoned CONNECT resolves to the PRIMARY (TOKEN_REDIRECT + addMember under primary) — NOT verified
- [ ] (c immutable) redirectTo IMMUTABLE + restart-durable — ⚠ UNMET: tombstones 37fcb752 + 2703628c currently have redirectTo=NONE (lost); the lost-tombstone bug is not closed for these
- [ ] (d idempotent) Room.addMember dedups on RESOLVED token (re-key not insert) — display-deduped via allMemberInfo, not verified at the structural addMember layer
- [x] (invariant) memberCount + JOIN use allMemberInfo() (resolved + deduped) — GREEN: Heartspaces shows 1 Marcel DET-3x (tester 9d021d87f, full RED→GREEN)
- [ ] (repair) One-time GATED migration collapses 3 Heartspaces Marcel → primary 8f74dfba + restores redirectTo on 37fcb752 + 2703628c — ⚠ NOT RUN: tombstones still redirectTo=none, no migration/dry-run commit found

## Implementation

IN FLIGHT — expert implementing (not yet committed): the 4 enforcement points on Class Room + identity handlers (architect design-ahead methods, 748122237): room.dedupMembersOnLoad, consolidate.evictAbsorbedFromRooms, connect.redirectTombstoneToPrimary, room.addMemberIdempotent, + allMemberInfo()-backed count/JOIN + immutable restart-durable redirectTo. Flip implementing[x] when the version commits (source-verified); testing[x] on committed tester GREEN. AC-repair (the gated one-time migration) is operational — verify its dry-run+count before any real member collapse. v0.7.0/v0.7.1 SHIPPED (0a73e5709 structural base + 75e09c155 orphan self-heal on load + a1f58fba1 hide-orphan-at-DISPLAY-layer 'safer than load-drop'); tester GREEN DET-3x re-verify — Heartspaces 1 Marcel, full RED→GREEN (9d021d87f). ⚠ HONEST (verify-don't-relay): the OUTCOME (1 Marcel) is met via a DISPLAY-layer + self-heal approach, NOT the full structural drop; 5/7 ACs remain — AC-c-immutable UNMET (tombstones 37fcb752/2703628c redirectTo=none) + AC-repair NOT RUN (no collapse/restore migration). Status held In Progress (not QA Review) pending PO decision: accept display-layer as sufficient (descope structural-drop + repair) OR complete the structural fix + gated repair before Done.

## Subtasks

None (atomic task). NOTE (req flag): AC-repair is a one-time GATED OPERATIONAL migration (dry-run+count → collapse 3 Heartspaces Marcel to 8f74dfba → restore tombstones), distinct from the structural code fix. Currently ONE task per PO's singular T25.7 directive; can split into its own operational task (T25.8) if the team wants separate gated-migration tracking — flagged to PO.
