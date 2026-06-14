# BUG9: Bug/ChangeRequest nodes return empty children on /trace

[requirement:uuid:6da84135-fc9d-4774-b9d7-05f95da8d60c] BUG9 — Bug forward keys missing from server

## Root Cause

server.ts:712 SCENARIO_FWD and :717 TRACE_FWD forward-key maps have entries for Requirement, Task, UseCase, Class, Method, Implementation, Sprint, Room — but NO entry for 'Bug' or 'ChangeRequest'.

When /api/trace/children/<bugUuid> runs, type='Bug'. fwdKeys['Bug'] = undefined. Line 726 iterates (fwdKeys[type] || []) = empty array. childRefs stays []. Returns children:[].

The Bug unit HAS useCases[] populated (UC 38204812 verified with children=[Class]). The data is there — the server just doesn't know to READ it for Bug-typed units.

Client-side forward-only.ts (line 17-18) DOES have bug/changerequest entries. Server-side is the gap.

## Fix (server.ts, 3 lines)

Line 715 (SCENARIO_FWD), add:
    Bug: ['useCases'], ChangeRequest: ['useCases'],

Line 721 (TRACE_FWD), add:
    Bug: ['useCases'], ChangeRequest: ['useCases'],

Line 785 (EXPECTED_CHILD_TYPE), add:
    Bug: ['UseCase', 'Task'], ChangeRequest: ['UseCase', 'Task'],

Same forward keys as Requirement (they extend Requirement per R20.4).

## Traceability Chain

    [requirement:uuid:6da84135-fc9d-4774-b9d7-05f95da8d60c] BUG9 Bug forward keys
      |
    [uc:uuid:d5a44c9b-f933-4d99-9203-a8d4d53a8c89] traceChildren.bugForwardKeys
      |
    [class:uuid:TODO-server-class] server /api/trace/children
      |
    [method:uuid:fabb5ae3-3dbb-4e51-8229-18d887d80860] server.addBugForwardKeys
      |
    [impl:uuid:pending] expert adds [impl:uuid] at SCENARIO_FWD+TRACE_FWD+EXPECTED_CHILD_TYPE
      |
    [test:uuid:pending] tester RED->GREEN: Bug node expands to show useCases on /trace

## Dedupe note (planner, 2026-06-14, PO-directed)

**BUG12 (d2389829) MERGED into this BUG9 — same defect.** BUG12 was a duplicate (server forward-key resolver lacks Bug entry). BUG9 is canonical (complete chain: uc d5a44c9b + method fabb5ae3 + 3-map fix). BUG12 node marked `supersededBy: 6da84135`. Unique bits from BUG12 folded in:
- **Tron evidence:** IMG_4038 — quote *"switched but no children"*.
- **Concrete RED test (from BUG12 intendedChain):** tap a Bug node (e.g. BUG8 `12cf7bb5`) in /trace → assert its UC child (`38204812`) renders → chain expands fully. Currently FAILS (no children). Use this as the tester's RED→GREEN.
- **Design link:** R20.4 (`ea212274`, Bug+ChangeRequest extend Requirement) — the OOP rationale for using the same forward keys as Requirement.

## Status
- [x] Root cause confirmed (Bug missing from SCENARIO_FWD + TRACE_FWD + EXPECTED_CHILD_TYPE)
- [x] UC designed (d5a44c9b traceChildren.bugForwardKeys)
- [x] Fix designed (3 lines in server.ts)
- [x] Deduped (BUG12 d2389829 merged → superseded; canonical = BUG9)
- [ ] Impl (expert)
- [ ] Test (tester — concrete RED test above)
