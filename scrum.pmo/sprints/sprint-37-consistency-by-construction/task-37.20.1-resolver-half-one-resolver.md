<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.20.1: ★ RESOLVER HALF — dnd.resolveDropPayload = ONE canonical payload (application/rb-object-ref) + ONE shared resolver EVERY target calls [R37.20 AC-resolve-drop-payload-one-resolver]

[task:uuid:68364f5e-4392-4d2d-ada5-819060b05110]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

STOOD UP Planned (2026-09-06), T37.20 slice 1/6 = RESOLVER HALF (build FIRST). OWNER=EXPERT. useCases=[] — req named the resolve-half UC 'e3fcf5b3' (8-char only); I do NOT fabricate a full uuid (never fabricated-suffix). req resolves + wires the real resolve-half UC full-uuid on 3-pt verify (their lane). Covers R37.20 AC-resolve-drop-payload-one-resolver. 0 Done till Tron.

## Task Description

Slice 1 of T37.20 (ae01f065 DnD drop contract), the CONSUME side — FIRST because a serializer without a resolver is HALF a contract (per-target read-side branching survives). Replaces today's 4 payload formats each target resolving itself (the per-target-resolution disease). Architect keeps it in core DndContract 822e663b. OWNER = EXPERT.

## Context

Covers R37.20 03e0f803 (AC-resolve-drop-payload-one-resolver), resolve-half UC e3fcf5b3. parent S37 b86b53cc. Sibling of T37.20 monolith (ae01f065) — sliced per-AC so none drifts unscheduled.

## Intention

ONE canonical drop payload + ONE shared resolver every drop target calls; fail-loud on unresolvable; a drop updates the view LIVE.

## Acceptance Criteria

- [ ] dnd.resolveDropPayload: ONE canonical drop payload (application/rb-object-ref) + ONE shared resolver EVERY drop target calls (fail-loud on unresolvable), replacing the 4 per-target payload formats/resolvers.
- [ ] A drop updates the view LIVE @390.
- [ ] GATE STUB-MUST-FAIL: a target with its OWN payload format/resolver -> RED (per-target-resolution caught by construction).

## Subtasks

None (atomic slice).
