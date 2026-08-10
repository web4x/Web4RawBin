# Tron diagram gaps (1) UC↔Class edge · (2) parents+trace-children · (3) class members — DESIGN

**By:** robbin-architect 2026-08-10, per PO. Measured FIRST: **all three are RENDER/WIRING gaps over data that already exists** (PO hypothesis confirmed — say so plainly). Action-bar fix confirmed working by Tron ('good actions change'). Device-facing → @390 real-WebKit RED-baseline gates; depend on nothing blocked (no Tron GO).

## GAP (1) — discover adds nodes but NOT the UC↔Class edge : WIRING (data exists)
**Measured:** the node-build (rb-diagram-detail.ts:~151-160) emits relations from `m.relations` (R32.6 typed OOP) + a `{to:m.method, kind:'trace'}` for a UseCase's Method (R36.4). It does **NOT** emit `m.class` (the UC→Class chain link). `buildEdges` draws an edge per `node.relations` IFF both endpoints are on-diagram. So the UC↔Class relationship is never emitted as a relation → no edge, even when both are on the diagram.
**FIX (ride the existing typed-relation + buildEdges, invent NOTHING):** in the node-build, for a UseCase also push `{ to: stripRef(m.class), kind: <realization/trace> }` — the SAME `{to,kind}` relation shape buildEdges already renders (R40.6 typed EdgeKind via `kindOf`; pick the existing realization/dependency kind, or reuse `'trace'` if no realization kind exists — do NOT add a second edge concept). Then buildEdges draws the UC↔Class edge by construction (both-on-diagram guard already handles off-diagram). No new edge machinery.

## GAP (2) — discover should add PARENTS + TRACEABILITY CHILDREN : WIRING (data exists), BOUNDED
**Measured:** `discoverRelated` (model.ts:161) resolves ONLY `m.relatesTo ∪ m.relatedFrom` = **direct relational neighbors, one level** (INV-DA1), and add-views each. It does NOT walk chain PARENTS (up) or TRACEABILITY CHILDREN (down).
**FIX (extend the neighbor set, keep it BOUNDED — the flood is the risk):** discover's neighbor set becomes the union of THREE direct-neighbor directions, still ONE level each:
- relational: `relatesTo ∪ relatedFrom` (existing).
- **chain PARENTS (up):** `ownerIor` + the up-chain refs (a UC's `coveredRequirement`/its Requirement; a Class's UC; a Method's Class) — DIRECT parent(s) only.
- **traceability CHILDREN (down):** the forward-chain keys ONE level (reuse the `forwardOnly` allow-list — the SAME chain keys the task-detail uses, single-source: UC→class/method, Class→methods, Method→implementations, Impl→tests).
**BOUND (explicit INV-DA2, not accidental):** discover adds **DIRECT neighbors only** in all three directions — NEVER transitive/recursive. Deeper exploration = the user clicks Discover again on a newly-added node (user-driven, bounded per click). This is the anti-flood rule (the /model tree already had a 1195-node eager-explode flood @390 — INV-P2b-1; discover must not reintroduce it). Report the count added ('Discovered N related').

## GAP (3) — class facet missing method SIGNATURES + attr types + relationships : RENDER/WIRING (data exists)
**Measured:** the class box IS rendered with an attrs compartment + a methods compartment (buildBox diagram-view-model.ts:55-56), but:
- the node-build pushes only `mm.name` for each member (rb-diagram-detail:151) — the R36.3-enriched **signature (visibility name(params):returnType)** and attr **type** are DISCARDED before render.
- buildBox renders `node.methods.map(m => m + '()')` — bare `name()`, no signature.
So the DATA exists on each member (`sigOf(mm)` / mm.signature, R36.3 part-1) but is thrown away at wiring.
**FIX (thread the signature through the ONE renderFacet/buildBox path — no rival renderer, no 2nd type-map):**
- node-build: push the member's SIGNATURE not just name — `methods.push(sigOf(mm) || mm.name)`, `attrs.push(attrType(mm))` (name : type). `sigOf` already exists (used for the node's own signature).
- buildBox renders `node.methods` verbatim (drop the `+ '()'` synthesis when a real signature is present).
- relationships: a class's typed relations (`m.relations`, heritage/association) already flow to buildEdges — they draw IFF the target is on-diagram. So the class's relationships appear once the related nodes are on the diagram (which GAP-2 discover now adds). No separate work — (1)+(2)+(3) compose.
- INV: rendered through `renderFacet`/`buildBox` ONLY (the tester's diagram==detail assertion guards no rival renderer / no second type-map).

## ★ EMPTY vs ABSENT (fail-visible, across all 3) — the PO's non-negotiable
A class with genuinely NO methods must NOT look identical to a class whose members FAILED to load (same principle as the unknown-facet box):
- members resolved, count 0 → an explicit empty compartment / '(no members)' label (EMPTY, truthful).
- members fetch FAILED / absent (a `null` from fetchModel) → a distinct '⚠ members unavailable' indicator, NEVER a silently-empty box (ABSENT, fail-visible).
The node-build already gets `null` for a failed `fetchModel` (`if (!mm) continue` at :151 currently SWALLOWS it) — change: track a `membersLoadFailed` flag when any member ref returns null, and render the ABSENT indicator instead of an empty compartment.

## Chain-map (for req R40.26/R40.27, verify-owner-first) — EDIT existing Methods; DISTINCT Impl on a SHARED Method
These fixes EDIT existing diagram Methods (discoverRelated, renderFacet, the node-build). Per verify-owner-first + R30.11: each new req gets a NEW UC + a NEW Impl (the completeness increment, distinct-intent) placed on the EXISTING Method — **do NOT re-credit the original reqs' Impls** (R33.7.2 / R36.1-2 / R32.6), and each needs a DISTINCT Test.

**R40.26 discover-related-completeness (`8b110074-c7f1-4808-9397-74dc7714c5e8`)** = gaps (1)+(2):
- Primary Method = `ModelView.discoverRelated` (`e6cc8e85`, existing, R33.7.2) — EXTEND: neighbor set = relational ∪ direct-chain-parents ∪ direct-trace-children, BOUNDED one level (INV-DA2). NEW Impl (completeness increment) on discoverRelated, distinct Test; do NOT re-credit R33.7.2's Impl.
- Supporting = the UC↔Class edge: the diagram node-build emits `m.class` as a typed `{to,kind}` relation → rides the EXISTING `DiagramViewModel.buildEdges` (`8c68b925`, UC `diagram.renderEdges` `20fe541e`, R32.6). An edit that rides R32.6's buildEdges (both-on-diagram guard already there) — no new edge unit; NOT cross-wired onto R32.6 (its Impl stays R32.6's; R40.26's edge-emit is the new increment).
- UC = new `discover.completeness` under R40.26 → Class `ModelView` → Method discoverRelated (+ the buildEdges edit rides R32.6).

**R40.27 class-facet-completeness (`81d1928d-cb68-4c05-8197-0647d553c0ec`)** = gap (3):
- Method = `DiagramViewModel.renderFacet` (`a6a05d34`, existing, R36.1/R36.2) + the node-build threads `sigOf(mm)`/attr-type into `node.methods`/`node.attrs` (currently only `mm.name`). NEW Impl (member-render increment) on renderFacet, distinct Test; do NOT re-credit R36.1/2's Impl. Routes through the SINGLE renderFacet/deriveViewKind (R40.23) path — no rival renderer (the diagram==detail assertion guards it).
- UC = new `classFacet.completeness` under R40.27 → Class `DiagramViewModel` → Method renderFacet.

req mints the 2 UCs + the 2 new Impls on the existing Methods (verify-owner-first: distinct-intent increments, not re-credit); I confirm ownership on mint. Both reuseNotes hold: R40.6 typed edges + R36.3 signatures = existing data, render/wiring only.

## GATES (@390 real-WebKit RED-baseline, device-facing)
- (1) discover a UC with its Class on-diagram → a UC↔Class EDGE renders (typed, same kind mechanism); off-diagram target → no dangling edge.
- (2) discover → direct parents + direct traceability children appear (bounded ONE level); a big-graph node does NOT flood (assert added-count ≈ direct-neighbor-count, not the transitive closure).
- (3) a class box shows method SIGNATURES (visibility name(params):returnType) + attr types + (with related nodes present) relationship edges — all via renderFacet; EMPTY class → '(no members)', LOAD-FAILED class → '⚠ members unavailable' (distinct, fail-visible).
- Single-path: the tester's diagram==detail facet assertion stays GREEN (no rival renderer/type-map).
