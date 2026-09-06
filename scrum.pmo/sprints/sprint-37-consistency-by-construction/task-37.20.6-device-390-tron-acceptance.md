<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.20.6: DEVICE @390 — Tron verifies on phone: file drags as file, every drop carries the unit, details render — [R37.20 AC-6-DEVICE]

[task:uuid:53571e22-2c58-4451-8e05-6bfb76647008]

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

STOOD UP Planned (2026-09-06), T37.20 slice 6/6 = DEVICE closing AC. OWNER=TESTER (harness). ★ ACCEPTANCE not TESTING — we verify slices 1-5 @390 real-WebKit in-harness BEFORE Tron sees it; his device confirm = acceptance, never a test-request (customer-not-tester law). Depends on 1-5 GREEN. req 3-pt verifies + wires UC. 0 Done till Tron.

## Task Description

Slice 6 of T37.20 (ae01f065 DnD drop contract) = the device-acceptance closing AC. Tron on phone @390 experiences the finished contract. UN-MOCKABLE, never headless-green — this is ACCEPTANCE (customer receives), verification is complete in our harness BEFORE he sees it. OWNER = TESTER (harness readies the @390 build we verify; Tron accepts).

## Context

Covers R37.20 03e0f803 (AC-6-DEVICE). CLOSING AC — depends on slices 1-5 GREEN in our harness first. parent S37 b86b53cc.

## Intention

On real device @390 the whole contract holds: a file drags as a file, drops onto every target carry the unit (not a URL), detail views render.

## Acceptance Criteria

- [ ] [DEVICE-ONLY @390 pixel — Tron on phone, un-mockable, NEVER headless-green] Tron verifies on device: a file drags as a file, drops onto every target carry the unit (not a URL), and detail views render. We VERIFY slices 1-5 in-harness first (real-WebKit @390); Tron ACCEPTS — never asked to test/re-try.

## Subtasks

None (atomic slice).
