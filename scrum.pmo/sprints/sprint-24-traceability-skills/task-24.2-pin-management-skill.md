<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 24.2: Pin management skill (CurrentSprint lifecycle)

[task:uuid:d40f1040-f7c8-4702-a31b-9b34af89df19]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 24 Planning](./planning.md)
    - Requirement R24.2 `[requirement:uuid:a545f899-b733-46ac-8fc7-2ef79e401cfe]`
  - down
    - [UC-SK.2: skill.pin-management-skill](./planning.md#uc-sk2) `[uc:uuid:90f9bfe3-6d57-4003-be77-6ce8ade76058]`

## Task Description

The Current Sprint pin lifecycle is an Object.verb skill (planner-drive.ts / CurrentSprint) with verbs focus, hop, gate, setChain, advance, setNextBacklog, pin, status: focus auto-derives the chain from the focused task, hop applies a per-agent realtime hop update (req|uc|class|method|impl|test x pending|in-progress|done|gate-proven), gate checks whether the task-switch gate is proven, setChain wires a full chain, setNextBacklog pins the nextBacklog slot, and pin/status surface the 3-slot pin (current/lastCompleted/nextBacklog).

## Context

Impl base (formalize, do not rewrite): scripts/planner-drive.ts (focus/hop/gate/setChain/advance/setNextBacklog/pin/status) + src/ts/scenario/CurrentSprint.ts (setFocus/hopUpdate/setChain/advance/getThreeSlots/pinCurrent/isGateProven/autoFollow). PLANNER NOTE (measured): the gate-proven block lives on setFocus (task-switch), NOT advance() — advance() unconditionally increments the activeHop pointer. setFocus needs a Task uuid + a derivable chain (≥req→uc) + a sprintName ON THE TASK UNIT (autoFollow reads m.sprintName; a task lacking it leaves the pin sprintName stale). hopUpdate records agent||expectedOwner but does NOT reject a wrong owner.

## Intention

PO 2026-06-29: formalize the scattered traceability + MD-planning TS tools as a coherent OOSH-like Object.verb SKILL set — R24.2 is pin management.

## Acceptance Criteria

- [ ] (focus) focus <task> auto-derives the chain from the focused task; blocked if the current task test hop is not gate-proven (unless --force)
- [ ] (hop) hop <hop> <status> [agent] applies a per-agent realtime hop update over req|uc|class|method|impl|test with statuses pending|in-progress|done|gate-proven
- [ ] (gate) gate reports whether the task-switch gate is proven (test hop gate-proven)
- [ ] (setChain) setChain wires req/uc/class/method/impl/test + sprint + task into the pin
- [ ] (advance) advance increments the active-hop pointer (req->uc->class->method->impl->test); pin/status report the current pin (pinCurrent). NOTE: the gate-proven block currently lives on focus/task-switch (AC-1), not advance - gating advance on gate-proven is TARGET behaviour for the formalized skill
- [ ] (object-verb) The Pin lifecycle verbs (focus/hop/gate/setChain/advance/pin/status) are Object.verb methods on a Pin/CurrentSprint class, NOT ad-hoc argv handlers
- [ ] (shim-parity) Removal of the planner-drive shim is gated on pin-parity: the Object.verb Pin surface must reproduce planner-drive behaviour before the shim is retired
- [ ] (three-slot) getThreeSlots returns the 3-slot pin - current / lastCompleted / nextBacklog - the core Current-Sprint pin model
- [ ] (backlog-slot) setNextBacklog / clearNextBacklog pin and clear the nextBacklog slot (a real planner-drive verb, part of the 3-slot pin)
- [ ] (owner) hopUpdate records the acting agent on the hop; owner-rejection (rejecting a wrong owner) is NOT enforced today - TARGET behaviour for the formalized skill

## Subtasks

None (atomic task).
