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

- [ ] **(behaviour/USER-TERMS)** Pressing Add folder on a MODEL COLLECTION (like diagrams) CREATES the folder and it APPEARS — NOT suppressed, NOT failed. (Suppressing it would recreate the sometimes-a-button behaviour Tron explicitly rejected.)
- [ ] **(by-construction/root-fix)** The model add-folder endpoint BRANCHES to the MODEL-STORE create when the parent has NO physical dir (both paths ALREADY EXIST) — it does NOT route EVERY add-folder through the PHYSICAL-create path (the root: the physical path returns bad-parent-loc for a parent with no real directory = the uncovered THIRD cause, a virtual Folder with no physical dir).
- [ ] **(doctrine/by-construction)** TRUTHFUL APPLICABILITY: if a verb is OFFERED, it MUST SUCCEED — offered IMPLIES succeeds, BY CONSTRUCTION. A verb that is offered but then fails => RED. This is SUCCEED-not-suppress: we do NOT hide the verb, we make it work. Completes R40.37 applicability into a biconditional: offered <=> can-succeed. A shown button that then fails is a BROKEN PROMISE.
- [ ] **(stub-must-fail/fail-closed-stays-real)** A MALFORMED non-Folder ref STILL returns bad-parent-loc — the fail-closed remains REAL. We route VALID virtual Folders to the model store, but a genuinely broken/non-Folder ref must still fail-closed (we do NOT paper over real errors). Stub: a malformed non-Folder ref that SUCCEEDS => RED.
- [ ] **(doctrine/RECORD)** DOCTRINE (the valuable part): a Folder unit is a MODEL OBJECT, NOT inherently a directory. We ASSUMED folder == directory, and THAT ASSUMPTION IS THE DEFECT. A Folder with no physical dir is a VALID model Folder (lives in the model store); a physical dir is one REALIZATION of a Folder, not its identity.
- [ ] **(cleanup/broken-promise)** The HARMLESS comment in action-applicability.ts (treating offer-then-fail on a virtual parent as acceptable) is DELETED — a button we show that then fails is a BROKEN PROMISE, never harmless. Gate: no code comment sanctions offering a verb that cannot succeed.
- [ ] **(verify/customer-not-tester)** WE verify @390 member-session (Add folder on a diagrams model collection -> folder created + appears). Tron ACCEPTS delivered verified work — he reported this MULTIPLE TIMES as a customer (our verification + intake failure), NOT a test he runs.

## Subtasks

None (atomic task).
