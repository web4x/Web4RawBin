# R37.9 — Done-Provenance Chain (design) : doneBasis + no-bare-Done guard by-construction

**Author:** robbin-architect 2026-08-10, per req. Req R37.9 `3cdd5091` (S37, 0 UCs = no chain). The STRUCTURAL fix for the S19/S20 bulk-advance incident: make it impossible to write a Done that isn't provably either Tron-approved or honestly-marked checklist-derived. Design → req mints scenario-first → planner stands up T-C9 (held until chain-complete-to-Test). Measured; verify-owner-first.

## MEASURED — the gap that let the bulk-advance happen
- **R40.10** legitimate Done = `TaskQaVerdict.approveByOwner` (Class `a20f8990`, server.ts:1454-1460): requires `status=='QA Review'` (else 409 "cannot manufacture Done") → writes `approvedBy`+`approvedAt`+`status='Done'`. **The ONLY Done with a verdict.**
- **R37.5** derive = `TaskStatus.deriveStatusEnum` (Class `abd7dac9`, task-status.ts): a CHECKED Done top-box → `status='Done'` **regardless of approvedBy**. So a checklist can reach Done with NO verdict (the bulk-advance set status=Done directly, no approvedBy — `assertStatusConsistent` would even PASS it if the checklist box were checked).
⇒ Two roads to `status='Done'`, only one carries a Tron verdict. Nothing on disk distinguishes them, so a bare unverdicted Done is invisible. **R37.9 adds the provenance layer that names the road + refuses the bare one.**

## MODEL — `doneBasis` (provenance, on the Task, distinct from `status`)
- `doneBasis = 'tron-approved'`  iff `approvedBy` present (the R40.10 verdict path) — a REAL Tron Done.
- `doneBasis = 'checklist-derived'`  iff `status='Done'` from a checked box but NO `approvedBy` — an owner-CLAIMED Done, honestly marked as *awaiting Tron*, NOT a Tron Done.
- `doneBasis = null`  iff `status != 'Done'`.
- **BARE Done** = `status='Done'` with no computable basis (neither approvedBy nor a Done-checklist) = the violation AC-f forbids by construction.
This keeps `status` = R37.5's derived enum (unchanged) and ADDS an orthogonal provenance field — the two Done kinds are DISTINCT on disk, so the scoreboard/audit can tell a claimed Done from a verdicted one (silence can't impersonate a real Done — same fail-visible family).

## CHAIN (verify-owner-first — NEW Class `DoneProvenance`, distinct layer; RIDES R37.5+R40.10, cross-wires NEITHER)
NEW Class **`DoneProvenance`** in a NEW file `src/ts/scenario/done-provenance.ts` (distinct sourceFile → distinct Class → cannot cross-wire onto TaskStatus `abd7dac9` or TaskQaVerdict `a20f8990`; one-Class-per-code-file per R27.2). It READS `approvedBy` (R40.10 evidence) + `deriveStatusEnum` (R37.5, for the checklist-Done check) — reads, never re-mints.

- **UC `doneProvenance.deriveBasis` → `DoneProvenance.deriveDoneBasis(task)` → Impl.** Pure: `approvedBy ? 'tron-approved' : (deriveStatusEnum(checklist)==='Done' ? 'checklist-derived' : null)`. Written atomically wherever `status='Done'` is written (the R37.5 generate/write point + R40.10's approveByOwner both set doneBasis via this fn) — so a Done is NEVER written without its basis (that is the by-construction half).
- **UC `doneProvenance.assertNoBareDone` → `DoneProvenance.assertNoBareDone(idx)` → Impl.** The reconcile-GUARD (AC-f): for every unit, `status='Done'` MUST have a doneBasis, and `doneBasis='tron-approved'` REQUIRES `approvedBy`. A bare Done (Done + null basis) or a lying basis (tron-approved + no approvedBy) → REFUSE/flag, fail-closed. Folds into `ci:gates` (the R37.3 fail-loud family).
  - **AC-f STUB-MUST-FAIL (two-bite):** (i) plant a bare `status='Done'`/no-basis unit in a fixture → the guard flags RED; (ii) meta-assert the GUARD ITSELF RUNS → weaken/remove it → suite RED. Converts "no bare Done" from tested to *cannot-be-written-without-the-check-going-RED*.
- **AC-e retroactive reclassify → `DoneProvenance.reclassifyBulkAdvanced(idx)` → Impl** (one-time, under the deriveBasis UC): apply `deriveDoneBasis` to the **17 bulk-advanced S19/S20 Tasks + 1 Device**. Each has `status='Done'`, no `approvedBy` → doneBasis becomes `'checklist-derived'` IF its checklist shows Done, else it is a BARE Done → **revert to its checklist-derived enum** (not Done) and flag for the owner (never silently keep a bare Done). Fail-loud list of what was reclassified vs reverted.

## INVARIANTS
- **INV-C9-1 provenance-always:** no code path writes `status='Done'` without also computing+writing `doneBasis` (deriveDoneBasis at every Done-write site).
- **INV-C9-2 tron-approved needs approvedBy:** `doneBasis='tron-approved'` ⟺ `approvedBy` present; no manufacturing a Tron Done without the R40.10 verdict.
- **INV-C9-3 no bare Done:** `status='Done' ∧ doneBasis=null` is REFUSED (AC-f, fail-closed + stub-must-fail).
- **INV-C9-4 status unchanged:** `status` stays R37.5's derived enum; doneBasis is ORTHOGONAL (no re-derivation of status, no cross-wire onto abd7dac9).
- **INV-C9-5 reads-not-owns:** R40.10 `approvedBy` + R37.5 `deriveStatusEnum` are READ as evidence; their units are untouched (verify-owner-first).

## GATE (distinct #126 Tests, no cross-wire onto R37.5/R40.10)
- deriveDoneBasis: approvedBy→tron-approved / checklist-Done-no-approvedBy→checklist-derived / not-Done→null.
- AC-f BITE: plant a bare Done → assertNoBareDone RED; a tron-approved-without-approvedBy → RED; clean tree → green. + the guard-runs meta-bite.
- AC-e: the 17 S19/S20 → each reclassified to checklist-derived or reverted (none left bare); idempotent.
- Deploy: scripts/CI + a done-provenance module; if the write-site is a shared server module, real restart; else scripts-only.
