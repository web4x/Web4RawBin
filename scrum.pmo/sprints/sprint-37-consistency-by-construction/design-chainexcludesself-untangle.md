# §4 chainExcludesSelf UNTANGLE + systemic prefix-collision guard (architect, for req)

**Author:** robbin-architect · 2026-08-07. PO-tasked after req correctly REFUSED to wire blind (right instinct — never credit a proven Test onto a chain you're unsure of). MEASURED with FULL uuids (never 8-char). req's collision suspicion (#3) was RIGHT; findings #1/#2 were artifacts OF that collision. Real residuals below + the systemic guard.

## A. DISAMBIGUATION — FULL uuids (the whole point: 8-char lied)
TWO units share prefix `3542dcb3`:
- **`3542dcb3-a1b2-4c3d-8e4f-5a6b7c8d9e07`** = **ior:class:Implementation** `impl:RbDetailView.chainExcludesSelf`. `ownerIor → 3542dcb3-aae6` (the Method). **This is the code-marked impl** — `singular-chain.ts:49  // [impl:uuid:3542dcb3-a1b2-…] BUG1 chainExcludesSelf`.
- **`3542dcb3-aae6-48ac-b3a2-ac3cd2c0dded`** = **ior:class:Method** `RbDetailView.chainExcludesSelf`. `ownerIor → f2f84ce3-6f8f` (RbDetailView Class) ✓.
- **UC `8dc64273`** `.method → 3542dcb3-aae6` (the **Method**, correct) · `.class → f2f84ce3-6f8f` (Class, correct).

## B. RE-ASSESSMENT of the raw-read findings (against full-uuid truth)
- **#1 "UC.method points at an Impl, chain skips the Method" → ARTIFACT.** UC.method = `3542dcb3-aae6` = the Method. The 8-char `3542dcb3` also matched the Impl `-a1b2`; the raw-read picked the Impl. The Method layer is NOT skipped.
- **#2 "Impl ownerIor SELF-references" → ARTIFACT.** Impl `-a1b2`.ownerIor = `-aae6` = the Method (correct up-link). Both start `3542dcb3` → misread as self.
- **#3 "8-char prefix collision (2 units)" → TRUE.** Confirmed: `-a1b2` Impl + `-aae6` Method.
- The chain is correctly **TYPED** (Req→UC→Class→Method→Impl). It is NOT malformed in the #1/#2 ways. So (b) "mint the missing Method" and (d) "fix self-ref ownerIor" from the brief are **moot** — measurement dissolves them.

## C. THE REAL RESIDUALS (the actual untangle — single-minter req executes)
1. **UC owner is a SPRINT, not a Requirement.** `UC 8dc64273.ownerIor → 64af2638 = ior:class:Sprint 20` (wrong — a UC's owner is its Requirement). **FIX:** repoint `UC 8dc64273.ownerIor → BUG1 2d5f151e` (its desc "Chain section shows Task as its own chain node" matches chainExcludesSelf intent ✓) AND set `BUG1(2d5f151e).useCases = [8dc64273]` (currently 0). This is PO step (e) + the real Req→UC link.
2. **Method aae6.implementations[] is CORRUPTED — 6 FOREIGN impls + MISSING the real one.** It lists `[4947f284 renderObject, 07942a94 roomScenarioDetail, 8d98abfd R15.6-Overview, 4846d57e RbTraceTree.cycleGuard, 1a5ad916 filePreviewButton, 71954a38 renderFilePreview, 7d865e08 chainExcludesSelf]` — and does **NOT** include the code-marked `a1b2`. **FIX (verify-owner-first):** (i) each of the 6 foreign impls has its OWN ownerIor (a4271cb8/bb01d630/…) — confirm it's listed on ITS real method, then REMOVE it from aae6 (they were mis-accumulated here, not orphaned by the removal); (ii) ADD `a1b2` to aae6.implementations[] (the code-marked impl belongs here). This is PO step (c) done right — not "repoint UC" (already correct) but "repair the Method's forward-impl list."
3. **TWO chainExcludesSelf impls — reconcile `a1b2` vs `7d865e08`.** `a1b2` is the code-marked one (singular-chain.ts:49 = authoritative). `7d865e08` is a second `impl:RbDetailView.chainExcludesSelf` (ownerIor→`3542dcb3`, prefix-ambiguous). **VERIFY:** if `7d865e08` has no distinct code marker → it's a stale duplicate → prune (or merge into a1b2); if it marks a distinct code site → keep both, both on aae6. req/architect confirm against the code before deciding.
4. After 1-3: chain = BUG1 2d5f151e → UC 8dc64273 → Class f2f84ce3-6f8f (RbDetailView) → Method aae6 → Impl a1b2 (code-marked) → tester Test e97850c3. Well-formed → THEN wire the Test.

## D. ★ SYSTEMIC GUARD — fail-closed on ambiguous prefix resolution (S37 consistency-by-construction candidate)
The prefix-collision class has now bitten repeatedly (this + the earlier `f2f84ce3-6f8f`/`-bbbc` episode). Make it impossible-by-construction:
- **INV (fail-closed prefix resolution):** any unit lookup/`resolveUnit(id)` in chain ops must take a FULL 36-char uuid; a lookup by a shorter prefix that matches **>1 unit** MUST throw/refuse with a named reason — NEVER silently pick one ([[false-low-worse-than-absent]], same family as INV-C1-8 no-name-parse). A prefix matching exactly 1 is allowed but a prefix matching 0 or ≥2 refuses.
- **Stored refs are full uuids:** every chain edge (`ownerIor`/`method`/`class`/`implementations[]`/`useCases[]`) stores a full uuid — a trace-audit assertion flags any ref shorter than a full uuid.
- **trace-audit BITE (prefix-collision detector):** scan all units → any two sharing an 8-char prefix are reported as a latent-collision pair (so tooling/humans use full uuids for them); a chain op that resolved a colliding prefix without a full uuid FAILS the gate.
- Folds into **R-C3** (fail-closed guards) as a sub-invariant, or a small dedicated guard. This is what turns "use full uuids" from a discipline I keep repeating into a build gate.

## Notes
- req is single-minter; verify-owner-first on every step (esp. C2's 6 foreign removals + C3's a1b2/7d865e08). I backstop the well-formed chain + the systemic guard when built. No unit mutated until req executes.

---

## DEFERRED (backlog, not rejected) — extract chainExcludesSelf as its own named artifact
**Recorded by robbin-req 2026-08-08 (PO condition-4 on the §4 R30.11-ride close).**

**Insight (correct-by-construction):** `chainExcludesSelf` is a fully-fledged traceable behaviour — it owns a Bug (BUG1 2d5f151e), a UseCase (detailView.chainExcludesSelf 8dc64273), a Method (RbDetailView.chainExcludesSelf 3542dcb3-aae6), and a distinct Test (e97850c3-fad4-46d0-b8b1-709c4ed7b350). A behaviour with its own full chain *deserves its own named code artifact + its own Impl*, so the marker/label/host/unit all align and strict-AST binds precisely — instead of riding renderSingularChain's Impl (91bea17d) as a distinct-intent Test.

**Deferral rationale:** the extract touches `src/public/ts/trace/singular-chain.ts` = **CLIENT code** → a version bump (via the source config unit) + atomic commit + restart + re-verify-on-served = a full deploy cycle. At **76% weekly budget in a closing-only posture**, that deploy is not warranted for a bookkeeping/traceability benefit. So we took the no-code R30.11 ride now (Test e97850c3 rides shared Impl 91bea17d, distinct-intent; owner 09611d71 untouched) and DEFER the extract.

**When picked up:** extract the filter `steps.filter(s => s.uuid !== selfUuid && CHAIN_TYPES.has(s.type.toLowerCase()))` into `function chainExcludesSelf(steps, selfUuid): ChainStep[]`; renderSingularChain calls it; mint a fresh v4 Impl heading it; re-point Method 3542dcb3-aae6 + Test e97850c3 off the shared 91bea17d onto the new Impl; version-bump (client change) + restart + re-verify. Net: chainExcludesSelf becomes a first-class, independently-testable artifact with a clean label==host==unit strict-AST bind.
