# Diagnosis — Tron's QA verdicts silently dropped (root-cause, no build)

robbin-architect 2026-08-18. Live defect: T37.26 `c8e0b1d2` has `approvedBy=05e58f81…` + `approvedAt` (Tron's real profile uuid + banner timestamp) BUT `status='QA Review'`, Done box unticked, no doneBasis; the UI reported "✓ Approved — status now Done". On /trace the same owner got "⚠ 403 owner only". THREE distinct root causes. Report only — expert holds for PO rule.

## (1) HALF-WRITE — non-atomic verdict-then-advance (the dropped Done)
`approveByOwner` (server.ts:1584-1611):
1. `:1591` set `m.approvedBy/approvedByName/approvedAt`.
2. **`:1597 idx.put(taskUuid, unit)` — persists the verdict FIRST** (comment: "the seam's validate reads approvedBy for the Done evidence-gate").
3. `:1602-1606 try { UnitController.apply(idx,'ior:class:Task',taskUuid,{target:'Done'},{publish}) } catch { return 409 'seam-refused' }`.
- The advance **throws**: `TaskPolicy.validate` (task-policy.ts:81, `EVIDENCE_GATE['Done']='testing'` at :28) REFUSES QA-Review→Done because there is **no two-keyed passing 'testing' Test on T37.26's chain** — its formatter chain was the broken phantom marker (req is repairing it). The refusal is CORRECT (you can't Done a task with no passing Test).
- **The bug is the ORDERING + no rollback:** approvedBy is already committed at :1597; when the advance is refused, `:1605` returns 409 but the persisted verdict is NOT rolled back ⇒ **verdict on disk, no Done, no doneBasis** = the half-write. Verdict and advance are not atomic.
- **Fix-direction (design):** fold the verdict INTO the same `UnitController.apply` Done-intent so validate→apply→persist is ONE transaction — a refused advance persists NOTHING; or roll back approvedBy on `seam-refused`. A verdict must never survive a refused advance. (Any task lacking Done-evidence hits this, not just T37.26.)

## (2) /trace 403 vs /model half-succeeds — owner-identity NOT single-sourced
`resolveOwner` (server.ts:942-948) has TWO paths:
- (a) **sm_session COOKIE** → owner (minted by the /server-manager flow; /model carries it).
- (b) **TOKEN path** `ServerManagerGuard.assertOwner(req, t => tokenToClient.has(t))` — asserts the `x-player-token` equals the ONE `OWNER_TOKEN` literal (`41ad88c4`, ServerManagerGuard.ts:12) + a live session. /trace uses this.
- On /trace Tron sends his **profile token `05e58f81`** (his real identity — the very value recorded as approvedBy). assertOwner compares it to `41ad88c4` → NOT equal → **403**. The token path NEVER consults the **R40.22 protected-identity set** (which INCLUDES `05e58f81`, Tron's non-literal identity). So the same human is owner-via-cookie, non-owner-via-token.
- **Fix-direction:** owner-ness = ONE truth. Both resolveOwner paths resolve against the protected-identity set (05e58f81 ∈ owner), not "cookie passes / token checks only the single literal". The surfaces must agree on who he is.

## (3) FALSE "✓ Approved — Done" banner — optimistic client
The SERVER is honest: it returns **409 'seam-refused'** on the half-write (server.ts:1605). The UI showed success regardless ⇒ the **client reports 'Done' without reading `out.code`** = optimistic UI manufacturing a success the server never gave — the exact false-Done class we spent the session killing.
- **Fix-direction:** the client renders the ACTUAL response (200 status=Done / 409 seam-refused / 403 not-permitted), never an assumed outcome. "Done" may only appear when the server returned 200 with status=Done.
- **★ ACTING-TAB re-render (Tron add — his photographed failure: banner said Approved, icon+status unchanged IN THAT TAB):** the ACTING client must re-render through the SAME path a remote tab uses — on the CONFIRMED 200 result, it emits the SAME `unit-changed` onto the ONE bus (`ViewBus.notify(ref)`) so its own surfaces re-render from the confirmed truth. NOT optimistic local UI (that is defect-3 returning); NOT a WS round-trip to itself (fragile + asymmetric). One emit, one bus, NO special case for the acting tab. **RED if:** the acting tab has its own code path, OR updates before/independently of the confirmed result, OR relies on optimistic local state. Banner AND re-render both sourced from the one confirmed result = one truth.

## Discipline note (owned)
My earlier "current approve is clean, new taps safe" was CODE-PATH-ONLY (apply ticks+derives in isolation) — this REAL end-to-end tap disproves it: the full flow half-writes when the advance is refused. Convergence-without-direct-measure again. `c8e0b1d2` (verdict-without-Done, the NEW half-write) is DISTINCT from `f5986d69` (Done-without-checklist, OLD direct-write residue) — two split-brain signatures, two causes.
