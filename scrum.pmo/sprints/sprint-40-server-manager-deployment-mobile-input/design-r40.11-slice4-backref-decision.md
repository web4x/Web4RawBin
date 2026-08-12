# R40.11 Slice-4 — DECISION: node back-ref (produced, not hand-set), array removed, single-source (architect, 2026-08-12)

PO-requested decision-on-disk. Blocks T40.11 → QA-Review. Expert's gated scratch dry-run correctly caught (no prod mutation) that pure array-removal FAILS INV-T.

## Finding (measured, scratch)
Removing the raw `deploymentRefs` array from node `fc327458` collapses the tree: 5 ref rows → 0, INV-T byte-diff=1 ✗. ROOT: `OtmuxBridge.buildServerManagerTree:99` derives the role-set from `nm.deploymentRefs`, and the 5 slice-1 typed units carry only `sourceRole` (NO node back-ref). **The array is the SOLE node→units linkage — it is NOT dead.** The dry-run + INV-T caught this before any prod put = the gated discipline working.

## Does DERIVATION-over-storage apply here? (PO's challenge — checked against the R40.18 call)
**No, and the distinction is the decision.** R40.18 auto-progress could be pure derivation because its input — task *status* — ALREADY exists as the single source; no new field was needed. Here the node→units RELATIONSHIP does not exist in any derivable form other than the array: a unit's `sourceRole` cannot say WHICH node owns it (a second deployment node with a `ssh-service` role would collide; scanning "all deployment-typed units" assumes one node forever = fragile). The relationship MUST be stored somewhere. So this is not derivation-vs-storage — it is **storage-on-node (raw string array) vs storage-on-units (ior ref)**. The back-ref (a scenario-unit ior) is the SCENARIO-FIRST form replacing the raw string array — which is precisely T40.11's goal.

## DECISION: option A, REFINED — the back-ref is PRODUCED by buildTypedModel, single-sourced
1. **The back-ref is an OUTPUT of `buildTypedModel`, not a hand-set field.** `buildTypedModel(node)` already takes the node; it sets `deploymentNodeIor = <node ior>` on each of the 5 units it produces. So the back-ref is a **computed/regenerable** field (re-running buildTypedModel re-sets it correctly), NOT a hand-maintained second source that can drift. This is how the derivation principle applies to a must-store relationship: derive-and-set from the deterministic producer, don't hand-maintain.
2. **Resolver reads ONLY the back-ref** post-migration: `buildServerManagerTree:99` scans units WHERE `deploymentNodeIor == node`, no longer reads `nm.deploymentRefs`.
3. **Array removed** → after (1)+(2), the array is genuinely redundant → remove it → INV-T==0.

### (b) What makes it single-source + non-drifting
- **Single-source:** after the migration there is exactly ONE linkage (the back-ref); the array is GONE and the resolver no longer reads it. **Grep-lint (INV, C1-9 lineage):** no code reads `nm.deploymentRefs` / `.deploymentRefs` after the migration — a re-introduced array-read fails CI. During the migration both exist transiently; the switch-then-remove ordering collapses to one source.
- **Non-drifting:** the back-ref is set BY `buildTypedModel` (deterministic, node-keyed), so a re-gen reproduces identical back-refs — it cannot drift from the node the way a hand-set field could. `buildTypedModel` is the single writer of the relationship.

### (c) The exact PIN-5 mutation + what the expert proves BEFORE it
- **PIN-5 put (CONFIRMED):** `put()` on the 5 typed units adding `model.deploymentNodeIor = "ior:instance:fc327458-…"` (a REF field — an ior, NOT a credential/token; the 5 units are not config-singleton → pass the R31.7 guard; not a chokepoint CHANGE). Plus `buildTypedModel` updated to SET `deploymentNodeIor` on its output (the non-drift guarantee).
- **Prove BEFORE the prod put (all on SCRATCH, no prod mutation, gate all-green else HOLD):** (i) 5 units carry `deploymentNodeIor=fc327458`; (ii) resolver scans by back-ref; (iii) array removed; (iv) **INV-T byte-diff==0** — tree byte-identical, same 5 ref rows in the SAME ORDER (order the back-ref'd units by the array's key — `sourceRole` — else byte-diff on row order despite matching content); (v) 0 new dangling; (vi) grep-lint: nothing reads `nm.deploymentRefs` post-migration (single-source). Only then the prod put + array-removal.

## ★ AC MAPPING RECONCILED (PO caught my loose "AC-5 mandates"; then caught my a/b letters SWAPPING — named by CONTENT here, letters banned)
AC-5 (task line 41) is a **COMPOUND AC with two sentences / two verification modes**. Named by CONTENT (letters are positional and swap silently — the failure that just happened):
- **AC-5-DEVICE** = "Tron taps the deploymentRef node → the drawer RENDERS CONTENT (pixel evidence)" — DEVICE @390, **TRON-ONLY, never headless-greened**. (the expert's reading.)
- **AC-5-AUTO** = "AND the deploymentRefs array-removal stays a GATED dry-run+count migration with INV-T byte-diff==0" — **AUTOMATABLE**, buildable/backstoppable, **where slice-4 lands**. (my reading.)

Both are real; the array-removal is mandated by **AC-5-AUTO**, so (B) keep-array leaves AC-5-AUTO unmet → my rejection of (B) stands. **RECOMMEND req SPLIT AC-5 → AC-5-AUTO + AC-5-DEVICE** (formalize from these CONTENT names, not letters). A compound AC bundling an automatable gate with a device-pixel gate can never go cleanly green: **AC-5-AUTO is provable now and CLOSES on slice-4 + my backstop; AC-5-DEVICE waits on Tron and is EXACTLY what he still owes (the tap-pixel), nothing more.** Full map: slice-1→AC-1(graph) · slice-2→AC-2(source) · slice-3→AC-3(generic-view)+AC-4(fail-loud) · **slice-4→AC-5-AUTO** · Tron→AC-5-DEVICE.

**Meta (PO): identifiers/labels are our recurring failure surface** (today: non-resolving anchor hashes, a task-uuid cited as an Impl-uuid, and these swapped a/b letters). In decision docs: name by CONTENT, and always state WHICH KIND an id is (task/Impl/UC/commit) next to it.

## Composition
Composes with slice-2 (emit real ior) + slice-3 (generic view) — those use the unit iors, which the back-ref scan now supplies. Slice-4 scope honestly grows from "pure removal" to "produce back-ref (in buildTypedModel) + resolver-by-back-ref + remove array" — the correction the dry-run forced. I backstop the corrected scratch dry-run (the 6 proofs) before any prod put; r4011c re-runs after.
