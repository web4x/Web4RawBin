# Single status-writer — make a direct status-write IMPOSSIBLE, not fixed one site at a time (ruling)

robbin-architect 2026-08-18. PO family question: THREE out-of-seam direct status-writes found today — (1) approve assigned status directly (orphan/split-brain root, fixed), (2) `task-fsm.ts:68` assigns `Done` directly (dead-legacy, present), (3) decline assigns `In Progress` directly (server.ts:1629). Three instances = an UNENFORCED INVARIANT, and the existing guard reported GREEN with (3) in plain sight. **Design/ruling only.**

## WHY the guard missed decline (measured)
- **`check-controller-dominance.ts` / `MvcBoundaryGuard.detectDoneWrites` is VALUE-SCOPED — it matches only `status = 'Done'`.** Its plant test is `detectDoneWrites("someTask.status = 'Done';")`; its stated property is "no direct **Done**-write outside the controller." Decline writes `m.status = 'In Progress'` — NOT 'Done' — so the detector never looks at it. It asserts a specific VALUE, not the INVARIANT (any status-write outside the sole writer). A value-scoped guard binds the one instance it was written for and is BLIND to its siblings ('In Progress', 'QA Review').
- **`check-mutation-seam.ts` is REPORT-ONLY** (its header: "report-only until the ~15 bypassers are routed, THEN --strict"). Decline's direct `idx.put(taskUuid, unit)` is reported, not RED — so it doesn't bind either yet.
⇒ Neither guard binds the general invariant: the controller-dominance one is too NARROW (Done only), the seam one is not STRICT yet. So the invariant "deriveStatusEnum is the sole status writer" was asserted for `Done` only, and violated freely for the other three states.

## THE INVARIANT (what must be true)
On a Task unit, `model.status` is DERIVED by `deriveStatusEnum(statusChecklist)` and written by EXACTLY ONE sanctioned site (task-policy apply → `m.status = deriveStatusEnum(...)`). The ONLY sanctioned RHS of a `.status =` is `deriveStatusEnum(...)`. Every other `.status = <literal/expr>` anywhere is a bypass.

## RULE — enforce it by construction (two layers; make the 4th site UNSHIPPABLE)
### Layer 1 — GENERALIZE the guard from a VALUE to the INVARIANT (immediate)
- Replace `detectDoneWrites` (matches `status = 'Done'`) with **`detectStatusWrites`**: flag ANY `\.status\s*=\s*` assignment whose RHS is NOT `deriveStatusEnum(...)` — i.e., allow only `= deriveStatusEnum(...)`, RED on `= '<any literal>'` (Planned/In Progress/QA Review/Done or any string/expr). Assert the general property, not one value (this is the fix's own family lesson: gate the invariant, not the instance).
- **stub-must-fail on ALL values:** the current bite plants only `'Done'`; add plants for `'In Progress'` and `'QA Review'` → each MUST go RED. A guard that only catches 'Done' proved nothing about the other three (exactly what happened). Positive control unchanged: `= deriveStatusEnum(...)` is NOT flagged.
- **allow-list = FROZEN and MINIMAL — ideally EMPTY.** `task-fsm.ts:68` is DEAD-legacy → **DELETE it** (dead code on the allow-list is still debt; deletion makes the allow-list empty = strongest). The existing "allowlist may not GROW" bite stays; target size 0.
### Layer 2 — flip `check-mutation-seam` to `--strict` (once bypassers routed)
- Route the remaining direct `idx.put`s (decline is one — my decline-CR design routes it through `UnitController.apply`) then flip the seam lint to strict. Then BOTH enforce: no `.status =` outside deriveStatusEnum (Layer 1) AND no `idx.put` outside the seam (Layer 2). Decline violated both; both must bind.

### The deeper by-construction (the IDEAL — compile-enforced, note for later)
The strongest form: `model.status` is NOT a stored mutable field but a **read-only computed getter** over `statusChecklist` — then a direct `.status =` is a COMPILE error, not a lint finding = truly IMPOSSIBLE, not merely detectable. Bigger refactor (status is persisted for board-gen), so Layer-1+2 is the enforceable now; the derived-getter is the north star. (Same shape as the type-index: a lint detects, a shared-source/compile-property prevents.)

## L17 (recorded) — assert the INVARIANT, not an instance/value
A guard that asserts a specific VALUE (`== 'Done'`) instead of the general property (any non-derive status-write) binds the one case it was written for and is BLIND to siblings — it reports GREEN while the invariant is violated by a different value. Three status-write sites, a guard catching one value, is not three near-misses — it is a guard that never bound the invariant. Gate the invariant (the whole property), stub-must-fail across the WHOLE value space, keep the allow-list frozen-and-minimal (ideally empty), and prefer a compile-enforced property over a lint where feasible. Family: L2 (single-source), L5/R40.39 (impossible-not-detectable), L16 (narrow/wrong target). Otherwise the 4th site ships next month.

## Sequencing
BUILD queues BEHIND the live-MVC acceptance proof (Tron's older open item; expert is fix-on-demand). This ruling + my decline-CR mechanics + req's requirement are the queue; the generalized guard ships WITH the decline fix (it is what makes "decline can't bypass" hold for the next site too).
