<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.4: Lobby shows the real profile name (not random User NNN)

[task:uuid:b4bc80c7-f48b-46d7-9b47-21f0289f3f63]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [~] implementing (architect chaining UC->RoomBrowser->Method->Impl + expert fix in flight)
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.4 `[requirement:uuid:17e12898-9720-4d29-af29-18bddb929f40]`
  - down
    - [UC30.4: lobby.nameFromProfile](./planning.md) `[uc:uuid:d6d8f55a-0300-4249-b7f8-c13a80a47490]`

## Task Description

Fix the lobby profile-name regression in RoomBrowser: the lobby shows a random "User NNN" instead of the real profile name (Marcel Donges) because RoomBrowser.ts:29 syncs memberName BEFORE the async profile load resolves -> re-randomizes every reload. Use the profile name once LOADED (async), fall back to a random name only as a true last resort. The room token (05e58f81) stays stable; only the display name regresses.

## Context

Covers R30.4 (17e12898) lobby.nameFromProfile. Class RoomBrowser (RoomBrowser.ts:29 sync-before-async-load bug). req minted solo (one-mover, R29.9).

## Intention

Tron regression (S30 reopened): lobby must show the real profile name, stably across reloads.

## Acceptance Criteria

- [ ] (name) The lobby 'Your Name' shows the PROFILE name (Marcel Donges), NOT a random 'User NNN'.
- [ ] (bug) THE BUG: RoomBrowser.ts:29 computes memberName SYNC before the profile loads (async race) -> profile?.name null -> random fallback -> a different name every reload.
- [ ] (fix) Fix = use the profile name once LOADED (await profile / re-render on profile-load); random 'User NNN' only as a TRUE last resort (no profile at all).
- [ ] (identity) The profile token/uuid is stable (05e58f81) - only the displayed NAME regresses; the fix must not change the stable identity token, only the name resolution.

## Implementation

IN PROGRESS (architect chain + expert fix in flight). Architect one-mover on the chain Method/Impl (RoomBrowser.ts:29 sync-before-async-load fix); I hold Task-side only (hands-off the chain). Awaiting architect chain + tester gate.

## Subtasks

None (atomic task).
