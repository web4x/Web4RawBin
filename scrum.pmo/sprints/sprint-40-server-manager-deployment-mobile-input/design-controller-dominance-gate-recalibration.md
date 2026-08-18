# check-controller-dominance — gate recalibration ruling (architect, 2026-08-18)

## ⚠ UPDATE — my 'false-RED' was OVERCONFIDENT (measured against myself, PO's live datapoint was right)
DO NOT apply the recalibration below yet — it is a HYPOTHESIS, not a clearance. Measured facts that undercut 'deriveStatusEnum is the sole writer': (1) **f5986d69 (T37.27) is a CONFIRMED SPLIT-BRAIN** — stored `status='Done'` but its checklist Done box is `- [ ] Done` UNTICKED (deriveStatusEnum(checklist)='QA Review' ≠ stored 'Done'), so a Done was written OUTSIDE deriveStatusEnum. (2) **A direct Done-writer EXISTS at `task-fsm.ts:68` `m.status='Done'`** (old flat 7-state fsm, superseded per task-policy.ts:5) — live-vs-dead/allowlisted is the tester's call. ⇒ the RED is likely a REAL second-writer/split-brain signal, not merely a stale statusNext-proxy. The CURRENT approve (task-policy.ts:103 tickBox→deriveStatusEnum) is clean, so new taps won't split-brain, but the residue + task-fsm.ts:68 are real. Tester(0.5) resolves: task-fsm live/dead, repair f5986d69 + siblings, stub-must-fail. RED STANDS. This is exactly why the accused party can't self-clear.

## (original recalibration hypothesis below — conditional on the tester proving sole-writer first)


`check:controller-dominance` has been RED since v0.8.104. **It is a FALSE-RED: the code is correct; the GATE asserts a stale proxy.** Recalibrate the gate + its Test, NOT the code. Capture-only (PO schedules); do NOT touch approveByOwner.

## Why it's a false-RED (measured)
- The single-Done-writer INVARIANT holds: `deriveStatusEnum` is the SOLE 4-state writer of a Task's `model.status` (`task-policy.ts:5`; TaskPolicy.apply sets `m.status = deriveStatusEnum(statusChecklist)` at :86/93/101, MvcBoundaryGuard-enforced).
- `UnitController.apply` **SUBSUMES** statusNext — "statusNext is a thin façade over this" (`unit-controller.ts:35`). apply → TaskPolicy.apply → deriveStatusEnum.
- My R40.10 approve-seam ruling routes `approveByOwner` → `UnitController.apply(Task,{target:'Done'})` (server.ts:1567) → deriveStatusEnum. ONE writer, and the Done-needs-approvedBy evidence-gate still fires (`task-policy.ts:83`).
- The GATE (`check-controller-dominance.ts:49`) greps the approveByOwner function text for a LITERAL `statusNext(` call: `check(/statusNext\(/.test(approveFn), 'approveByOwner must DELEGATE to statusNext')`. That is the OLD direct-delegation proxy; my ruling correctly moved approve onto the canonical seam (apply, which subsumes statusNext), so the literal `statusNext(` is gone while the invariant is INTACT. **The gate measures a proxy, not the invariant (L9).**

## Recalibration (what the gate SHOULD assert)
1. **KEEP (unchanged, the core):** `deriveStatusEnum` is the SOLE writer of a Task `model.status` — no `m.status =` / `.status='Done'` anywhere except inside deriveStatusEnum + the frozen legacy allowlist. Plus STUB-MUST-FAIL: plant a direct Done-write → `detectDoneWrites` flags RED; a sanctioned deriveStatusEnum write is NOT flagged.
2. **CHANGE the positive control (:49):** replace `/statusNext\(/.test(approveFn)` with **`/UnitController\.apply\(/.test(approveFn)`** — assert approveByOwner routes through the SEAM (which subsumes statusNext), NOT a literal statusNext call. (Accept either apply OR statusNext if you want to tolerate both paths, but apply is the canonical one my ruling uses.)
3. **Update the carried Test `3b8f21c6`** (T37.4.3 / R37.11 C4.3) accordingly: its assertion "approveByOwner delegates to statusNext" → "approveByOwner routes through UnitController.apply (subsumes statusNext); deriveStatusEnum sole-writer". verify-owner-first: keep the Test's own credit; it asserts the same single-Done-writer property, just via the current canonical path.

## ★ THE RED STANDS until INDEPENDENT verify — I do NOT clear my own accused gate (PO, correct)
This is my ANALYSIS, not a clearance. The party whose design a gate flags cannot also clear it (that is how check:task-status got silently removed). Before the RED clears, the **tester (0.5)** must, by DIRECT independent measurement, prove: (a) `deriveStatusEnum` is the SOLE writer of a Task `model.status` (grep the whole tree, not my say-so); (b) `approveByOwner` genuinely routes through `UnitController.apply` (which subsumes statusNext). AND the recalibrated gate must be **STUB-MUST-FAIL proven**: inject a SECOND Done-writer → assert the gate goes RED; a sanctioned deriveStatusEnum write → stays GREEN. Only then is the recalibration (below) applied. Until that independent proof + failure-proof, **the RED STANDS** — it blocks nothing (capture-only) and I do not touch approveByOwner OR the gate on my own authority.

## Net
IF independently verified: code is correct and single-Done-writer HOLDS; only the gate + its Test lagged the (correct) move from a literal statusNext-delegation to the subsuming apply seam. Recalibrate, don't revert. This is the same "gate red because the code improved past the gate's proxy" class to watch for — gate the INVARIANT (sole deriveStatusEnum writer), not a specific call-site spelling.
