<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.87: Add folder SUCCEEDS on a model collection (route to model-store when no physical dir) — offered implies succeeds

[task:uuid:e42e0d2e-3c9e-4849-8b47-5e019c121de2]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

RE-STATUSED to QA-Review-with-open-CR 2026-09-05 (PO correction, same-day): I minted it clean QA-Review, but R40.87 has a CONFIRMED FAILING AC on live prod = a false-clean read (the exact false-claim family we treat as a defect). ★ OPEN CR: 'stub-must-fail AC unmet — malformed ref MINTS instead of returning bad-parent-loc; fix in flight (architect discriminator isVirtualModelParent, tester RED gate first)'. HAPPY path works (Tron's c83c02f2 IS fixed — add-folder on a model collection succeeds, deployed v0.8.179 PO-verified served==committed) but the FAIL-CLOSED half is broken = SILENT DATA CREATION (tester+architect independent: garbage-xyzzy->MINTED bebe15e9, task:0000->MINTED 6b5963b0, prod index untouched 6078->6078). Done BLOCKED by this CR AND Tron. UC full-uuid abac573a resolved from disk. ACs mirrored no-drift. LOCAL push-freeze. req reverse-wires R40.87.tasks[]. 0 Done till Tron.

## Task Description

BUILD LANDED + DEPLOYED v0.8.179 (PO-verified served==committed; fixes Tron bad-parent-loc c83c02f2). QA-Review — CLOSING gate = R40.88 ruling-guard GREEN + tester; Done pending TRON acceptance. Covers R40.87 (2afa97a9), UC abac573a. Minted 2026-09-05 (PO GO after the R40.84-firefight coverage gap; planner was skipped, gap now closed). verify-owner-first: full-index scan confirmed NO prior covering task (no double-mint).

## Context

BUILD LANDED + DEPLOYED v0.8.179 (PO-verified served==committed; fixes Tron bad-parent-loc c83c02f2). QA-Review — CLOSING gate = R40.88 ruling-guard GREEN + tester; Done pending TRON acceptance.

## Intention

Board-track R40.87 at its honest status; declare the ONE canonical planning unit for this requirement (traceability = DRY enforcement).

## Acceptance Criteria

Mirrors R40.87 req ACs (no-drift, disk-resolved UC). NEVER Done till Tron.
- [ ] AC-add-folder-succeeds-on-model-collection: pressing Add folder on a MODEL COLLECTION (like diagrams) CREATES the folder and it APPEARS — NOT suppressed, NOT failed.
- [ ] AC-routing-branch-to-model-store: the model add-folder endpoint BRANCHES to the MODEL-STORE create when the parent has NO physical dir (both paths already exist); it does NOT route EVERY add-folder through the physical path.
- [ ] AC-truthful-applicability-offered-implies-succeeds: if a verb is OFFERED it MUST SUCCEED (offered IMPLIES succeeds, by construction); offered-but-fails => RED. SUCCEED, not suppress.
- [ ] ★OPEN-CR — CONFIRMED FAILING ON PROD (tester + architect, independent) AC-stub-must-fail-malformed-still-bad-parent-loc: a MALFORMED non-Folder ref MUST STILL return bad-parent-loc (fail-closed) — but the shipped v0.8.179 impl MINTS a garbage Folder instead = SILENT DATA CREATION. Tester byte-identical scratch: 'garbage-not-a-folder-xyzzy' -> 200 ok=true MINTED bebe15e9; 'task:00000000-...' -> MINTED 6b5963b0 (prod index deliberately untouched 6078->6078). Fix in flight: architect discriminator isVirtualModelParent, tester RED gate first. THIS AC BLOCKS clean-Done.
- [ ] AC-doctrine-folder-is-model-object: DOCTRINE (object-ownership lens): a Folder unit is a MODEL OBJECT, NOT inherently a directory; we ASSUMED folder==directory and THAT ASSUMPTION was the defect.
- [ ] AC-delete-harmless-comment: the harmless comment in action-applicability.ts (treating offer-then-fail on a virtual parent as acceptable) is DELETED — a shown-then-fails button is a broken promise.
- [ ] AC-verify-member-session: WE verify @390 member-session (Add folder on a diagrams model collection -> created + appears); Tron ACCEPTS — he reported this MULTIPLE times as a customer.

## Subtasks

None (atomic task).
