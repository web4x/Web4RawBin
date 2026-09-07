<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T21.2: Lobby renders real name on first connect

[task:uuid:a25e2787-9d8b-498f-839d-80cc1a8110cd]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect — req+architecture.md)
  - [x] AC + test scenarios (in requirement unit)
  - [x] implementing (expert — shipped)
  - [x] architect PDCA Check
  - [ ] testing (tester DET gate)
- [x] QA Review
- [ ] Done

## Traceability

- up
  - requirement:uuid:4f099ef2-66b6-4eba-b9e2-5b2a4c86e98b (R-unit, architect-refined AC/TS)
  - Sprint 21 Planning
- chain
  - use case: uc:uuid:dbfacb7f-2f40-4852-975b-dc308cef3b90
- context
  - Sprint 21 shipped without scenario-first planning (no planner on WODA.prod); tasks backfilled by architect per PO directive 2026-06-29.

## Task Description

RoomBrowser must show the actual profile name immediately on connect, never a blank/random fallback that only corrects on a second reload. Fix: re-render the name+avatar block on the PROFILE event (one-shot guarded), not just patch the input value; first paint uses cached profile name or a neutral skeleton. Verified headless against the running app.

## Acceptance Criteria

- [ ] **(first-render)** On first render the member name is resolved as: URL ?name= > client.getProfile()?.name > localStorage 'rawbin-name' > 'User <rand>' — the authoritative server profile name is preferred over an empty localStorage snapshot.
- [ ] **(first-render)** On a warm profile cache the correct name shows on the FIRST paint — no blank/default flash, no second reload required.
- [ ] **(self-heal)** On MSG.PROFILE_UPDATED with a non-empty profile.name, memberName is set to that name and persisted to localStorage 'rawbin-name'.
- [ ] **(self-heal)** The PROFILE_UPDATED handler updates BOTH the #member-name input value AND the rb-avatar 'name' attribute (not just the input) so the visible lobby name+avatar block self-heals.
- [ ] **(self-heal)** A PROFILE_UPDATED with an empty/absent name is ignored (no clobbering the current name).
- [ ] **(verify)** Verified headless against the running app (Strict Verify Bar): first connect on a fresh device shows the real profile name with zero second-reload.

## Dependencies

- Requires: Sprint 21 requirement + UC/Class/Method chain seeds
- Enables: tester DET gate

## Definition of Done

- [ ] All req ACs met; chain resolves Req->UC->Class->Method->Impl->Test
- [ ] Tester DET gate PASS
- [ ] Tron QA approved

## QA Audit & User Feedback

Shipped: pending/shipped per S21. Architect PDCA: design in architecture.md section 7 (race diagnosed).

## Subtasks

None (atomic task).
