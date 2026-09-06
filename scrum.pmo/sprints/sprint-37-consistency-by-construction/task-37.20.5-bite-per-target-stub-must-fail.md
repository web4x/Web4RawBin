<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.20.5: BITE asserts the contract PER TARGET + stub-must-fail (serializer emits a URL again => RED) — [R37.20 AC-BITE-per-target-stub-must-fail]

[task:uuid:4c083193-699c-44b9-85bd-0f61f9c57e88]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

STOOD UP Planned (2026-09-06), T37.20 slice 5/6 = the per-target BITE. OWNER=TESTER. Covers R37.20 AC-BITE. Depends on resolver (T37.20.1) + shared serializer (T37.20.4). req 3-pt verifies + wires UC. 0 Done till Tron.

## Task Description

Slice 5 of T37.20 (ae01f065 DnD drop contract) = the failable gate. Asserts the ONE-contract PER TARGET (diagram/room/tree-collection/editor-drawer) and stub-must-fails: make the serializer emit a URL/*.show again -> RED. A target regressing to a link is caught by construction. OWNER = TESTER.

## Context

Covers R37.20 03e0f803 (AC-BITE-per-target-stub-must-fail). Depends on T37.20.1 resolver + T37.20.4 shared serializer. parent S37 b86b53cc.

## Intention

The contract is proven per-target and cannot silently regress to a per-target URL/link.

## Acceptance Criteria

- [ ] The BITE asserts the contract PER TARGET (diagram / room / tree-collection / editor-drawer) + STUB-MUST-FAIL: make the serializer emit a URL/*.show again -> assert RED. A target that regresses to a link is caught by construction.

## Subtasks

None (atomic slice).
