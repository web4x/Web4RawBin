<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->


[Back to Planning](./planning.md)

# Forward-only fallback + type-check child filter

[task:uuid:bda7857d-af96-4b08-a09e-1914bfe4fb7a]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Task Description

Three fixes ensuring the chain walks forward-only and terminates correctly at Test (R18.13):

Fix 1: scanRepo fallback (line 582) now iterates fwdKeys[type] only, instead of Object.values(links).flat(). This prevents backward refs from leaking into the children response — same bug class as T181.

Fix 2: EXPECTED_CHILD_TYPE invariant — children are filtered by the allowed type per parent (Req->Task, Task->UseCase, UC->Class/Method, Class->Method, Method->Implementation, Impl->Test, Sprint->Task). Wrong-type children are silently dropped. Structurally prevents higher-type nodes from appearing below Method.

Fix 3: Method.implementation singular already populated (0 remaining).

Net effect: chain forward-only, no leakage, and chain terminates cleanly at Test. 836/836 pass.

## QA Audit & User Feedback

2026-06-05 1f2f6dcc v0.5.95 T194: forward-only fallback + type-check child filter

## Subtasks

None (atomic task).
