<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 26.4: Lazy child resolve — structure eager, payload lazy, members by-reference

[task:uuid:9e94c188-89f4-4fb9-b631-f306a1213ec0]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 26 Planning](./planning.md)
    - Requirement R26.4 `[requirement:uuid:71b44e05-555f-4db2-a485-f375cd7ad70b]`
  - crossRef
    - R25.7 room membership dedup (members transfer by-reference, never re-create the dup)
  - down
    - [UC26.4: federation.lazyChildResolve](./planning.md#uc26-4) `[uc:uuid:67859edd-c0a6-4cb0-8834-4d11c50e7ec1]`

## Task Description

Transfer is STRUCTURE-eager / PAYLOAD-lazy: the primary unit + light metadata mint immediately (item appears instantly); file BYTES, deep subtrees, and member profiles resolve lazily on first need. Content dedups across servers by contentHash (skip the byte transfer + relink if the receiver already has it). Room MEMBERS stay federated identity references (ior@originHost), NEVER minted as local profiles — a foreign member only materializes locally on later connect+consolidate — so federation does NOT re-create the duplication R25.7 fixed.

## Context

Greenfield federation, scenario-first (#126). Design: federated-scenario-transfer.md (architect 7e940cf81). Class Transfer. crossRef R25.7 (members-by-reference ties to redirectTo; must not re-create dup). Uses R26.3 /content for lazy bytes.

## Intention

RawBin Federation: item appears instantly (eager structure) while bytes/subtrees/members resolve on demand; federating a room must NOT re-introduce the member duplication R25.7 eliminated.

## Acceptance Criteria

- [x] (eager) Eager: the primary unit + light metadata are minted immediately so the item appears in the target room instantly
- [x] (lazy) Lazy: file BYTES fetch on first preview/open (via R26.3 /content); deep subtrees and member profiles resolve on demand
- [x] (dedup) Content dedups across servers by contentHash: on import, if the receiver already stores that hash, SKIP the byte transfer and just relink
- [x] (members) Room members transfer as federated identity references (ior:instance:<memberUuid>@originHost), NOT minted as local profiles; a foreign member materializes locally only on later connect+consolidate (ties to R25.7 redirectTo)
- [x] (invariant) Federating a room NEVER mints foreign identities as local members — it must not re-create the duplication R25.7 eliminated

## Implementation

 impl v0.7.5 (a789a5d40, Transfer.resolveChildrenLazily); NO committed tester GREEN yet — testing hop OPEN. ⚠ MUST gate PER-AC (not blanket): the R25.7 members-by-reference INVARIANT (federating a room must NOT re-mint foreign identities as local members). GREEN → QA Review: tester GREEN DET-3x (af907f925, gate r262-t264-t265). ✓ The R25.7 members-by-ref INVARIANT is GATED (not blanket): child stays a federated @host ref (child-1@https://other.host), File bytes lazy by contentHash — federation does NOT re-mint foreign identities as local members. 5/5 ACs. ✓ TRON-ACCEPTED 2026-07-01 (Tron QA review pass) -> DONE (full-AC).

## Subtasks

None (atomic task).
