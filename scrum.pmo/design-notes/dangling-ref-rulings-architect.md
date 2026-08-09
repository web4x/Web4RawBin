# Dangling-Ref Audit — Architect Rulings (3 classes)

**By:** robbin-architect 2026-08-09, on req's audit (dangling-ref-audit.md, 94eb9a46b), per PO. Analysis + naming only, no build. Measured full-uuid (never 8-char).

## ★ RULING 1 — the two "missing parent hubs" are NOT missing: PREFIX COLLISION (repoint + restore back-link)
The audit's 8-char reporting masked the truth. Measured with FULL uuids:
- Tasks' `ownerIor` → **`29d92990-3514-4627-8780-eb0d2e462eeb`** (phantom, never existed) — but the REAL **Sprint 03** unit exists = **`29d92990-3512-48c8-8648-e08ee757bb57`** ("Sprint 03 — E2E Hardening"), tasks[] EMPTY.
- Tasks' `ownerIor` → **`2aac7676-bc8a-4f9a-aa07-e9a8dba3f0cd`** (phantom) — real **Sprint 09** = **`2aac7676-bc88-4eb0-a81b-07c913fda5ee`** ("Sprint 09 — Room Identity"), tasks[] EMPTY.
- Same 8-char prefix, different full uuid. The 10 orphans under -3514 are exactly **T13–T22** (dir `sprint-03-e2e-hardening/`); the 7 under -bc8a are **T74–T80** (dir `sprint-09-room-identity/`). Content + directory + real Sprint unit all agree.

**RULE:** the refs are WRONG (fabricated owner uuids that reused the real sprint's 8-char prefix + a fake tail — same fabrication family as Ruling 2, but here the real owner is RECOVERABLE). The owner is NOT missing and NOTHING is minted-from-child — the parent identity comes from the **real S3/S9 Sprint units** (confirmed by content + directory, not fabricated). Fix = **(a) repoint the 17 Tasks' `ownerIor` to the real full uuids** (S3 `29d92990-3512-…`, S9 `2aac7676-bc88-…`); **(b) restore the back-link** — add the 17 tasks to S3/S9 `tasks[]` (currently empty). One ruling clears 17. This CORRECTS the audit premise "never created, nothing to restore": the parents exist; the child refs were fabricated onto a colliding prefix.
**LESSON (repeat):** resolve refs by FULL uuid — an 8-char prefix hid two live sprint owners.

## RULING 2 — the 14 fabricated refs: NONE mintable; the REF is the defect
Template/tool grep for zero-uuid / patterned-uuid defaults = **EMPTY** → these were **hand-fabricated** (fake-suffix anti-pattern, [[standard-task-template-no-fork]]/never-fake-suffix), NOT emitted by a live tool. Patterns:
- **All-zero tails** (`…-0000-0000-0000-000000000000`): `64af2638-0000…` (Task ownerIor), `7e717383-0000…` + `ae410763-0000…` (Requirement `tests[]`). The zero-uuid = an unfilled placeholder/template default.
- **Hand-typed hex words**: `…-e1f2a3b4c5d6` (ascending bytes — hub for 5 Methods' ownerIor), `…-cafebec000de`.
- **Bad v4 variant** (variant nibble ∉ {8,9,a,b}): `d1135c9f-…-e5d1-…`, `b1113a7d-…-c3b9-…`.

**RULE (per sub-class):**
- **The 3 all-zero `Requirement.tests[]` refs = DELETE** (FALSE-GREEN risk — a Req claiming a zero-uuid Test reads as tested; delete the fake test-ref, the Req has no real Test). Never mint a zero-uuid Test.
- **The fabricated `ownerIor`/`parent` targets (5 Methods → `…e1f2a3b4c5d6`, etc.) = REPOINT to the real owner if identifiable from the referrer's own content, else DELETE the ref** (the referrer is genuinely unowned). Do NOT mint (entrenches the fabrication).
- **The fabricated `implementations[]` targets (Tests → bad-variant Impls) = DELETE** the verify-link (Test points at a non-existent Impl).

**MECHANISM DIAGNOSIS (the cause, per PO):** NOT a live tool — hand-fabricated uuids (fake-suffix) + a template zero-uuid default that was never replaced. The real fix is **correct-by-construction: a mint-path guard that REJECTS a non-v4 or all-zero uuid at unit creation** ([[correct-by-construction]]) — so a fabricated id can't enter the graph again. Recommend folding into the R-C3 fail-closed guard family (a fabricated-uuid BITE). The 14 are the symptom; the missing mint-guard is the class.

## RULING 3 — the 16 missing UCs: ALL HOLLOW (leave dangling, do NOT mint)
Measured each referrer (14 Requirement.useCases + 2 Task.useCases): **0/16 have a built downstream** (no Method/Impl/Test unit implements the req), and each has ONLY the one missing UC (no resolving sibling). The 4 that cite an altId anywhere are **incidental** — a Bug unit (R18.16→"BUG7"), Sprint descriptions (R27.6→S28 goal, R40.11→SM sprint), an unrelated Class/Method (R29.9→RbFileTree) — NOT a built chain.

These are REAL, CAPTURED/DESIGNED requirements that are **NOT BUILT** — notably several are design-only and ON HOLD for Tron: **R40.14** (loginToken), **R40.15** (secretCode), **R40.21** (creds-in-URLs), **R40.22** (identity-decoupling) — the security-incident designs. Others: R40.13/16/17/18/20, R28.1, R29.9, R27.6, R18.16.

**RULE (applying the PO guard + fail-closed [[false-low-worse-than-absent]]):** name a UC ONLY where the downstream (Method+Impl+Test) is REAL. Here **none proves a built downstream → do NOT mint any**. Minting a hollow UC manufactures a chain climbing on nothing and makes the scoreboard read "in progress" on unbuilt work — STRICTLY WORSE than the honest "open/not-built" a dangling ref shows. **Leave the 16 dangling** (the honest state: designed-not-built). If req wants any specific one minted, it must FIRST prove that req's Method+Impl+Test exist on disk — I name the UC **per-unit on proof, never batch**.
**ONE FLAG for closer look:** **R28.1** ("generate requirements.md") — the generator code EXISTS (generate-sprint-md.ts:145) but is chain-credited to R30.18/generator units, not R28.1. So R28.1 is a **shared-impl candidate** ([[verify-owner-first-in-shared-credit]]), NOT a fresh-mint and NOT purely hollow — verify-owner-first before any wiring (do not cross-wire onto R30.18's units).

## ★★ RULING 2 — CORRECTED: truncation FEEDS fabrication (PO hypothesis TESTED = largely CONFIRMED; I overturn "no live tool")
My "hand-fabricated, no live tool" was WRONG on target: I grepped TEMPLATES/zero-uuid-defaults; the PO named the right thing — an **EXPANDER**. Tested both ways:
- **TEST 1 (prefix-match):** of the fabricated targets, **every all-zero tail's 8-char prefix matches a REAL unit** — `7e717383`→…207e, `ae410763`→…e446, `64af2638`→…d011 (S20). The statistical argument is decisive: an 8-char prefix matching a real unit 3/3 (plus the S03/S09 hubs) is not coincidence (~1 in 10^5+ each) → **causal**. `3e0ceb94`'s tail is a corruption of a real unit's tail (prefix-match + mangled). (3/7 — the `cafebec000de` + 2 bad-v4-variant — do NOT prefix-match a live unit: a second path OR expansions of a since-deleted target; I do NOT overclaim universality.)
- **TEST 2 (the expander exists):** `resolvePrefix(x)` (skill-classes.ts:440) = `idx.list().find(u => u.startsWith(prefix))` — first-match; used at **:245/:507/:571/:694 as `resolvePrefix(x) || x`** (expand-or-KEEP-the-truncation). On a prefix collision it returns the WRONG unit's full uuid; on no-match it keeps the 8-char. Plus zero-fill synthesizers (`repair-collision-artifacts.ts:151` `${h}0000-0000-4000-…`; `TsToModel.ts:51`/`detUuid`). R27.7 (trace-audit.ts:16-17,264-266) DOCUMENTS this exact family: "silent prefix-resolution hides collision debt — an 8-char ref resolves today, a future collision mis-resolves"; and the **64 truncated field-refs** are the population.

**⇒ VERDICT: the PO is right about the dominant, dangerous class.** MECHANISM (unifies rulings 1+2 into one root): a **truncated 8-char ref** meets a **prefix-expander** that fills the tail UNSAFELY (first-`startsWith` match on a collision, or zero-fill, or `|| keep`) → a wrong/synthesized full uuid is written = fabrication. Rulings 1 (phantom sprint-owner tails on a real prefix) and 2 (all-zero tails on a real prefix) are the SAME defect. **Truncation is the precondition; R27.7's silent prefix-tolerance was not just a reporting gap — it is the fuel line.**

**CONSEQUENCES (agreeing, with one hard caution):**
- (a) **The guard must reject UNSAFE PREFIX-EXPANSION, not just non-v4/all-zero.** `resolvePrefix` must be **FAIL-CLOSED**: resolve ONLY to a UNIQUE full-uuid match; on non-unique OR no-match → REFUSE (never `|| keep-prefix`, never first-match, never zero-fill/synthesize). Fold into the R-C3 guard family (post-GO, R-C3 is src/ts/frozen) with a prefix-expansion BITE + the fabricated-uuid BITE.
- (b) **req's (E) truncated batch = PREVENTION, re-prioritize** (removes the fuel: expand the 64 to their correct full uuids so no future expander mis-resolves them). ★ HARD CAUTION: the repair MUST use **verified-unique** resolution (fail-closed on collision), NOT the same `resolvePrefix`, or it RE-FABRICATES. Leave the **18 known prefix-pairs** (ambiguous) for architect adjudication — `repair-collision-artifacts.ts` (my spec 1dfc71d1d) already correctly leaves them UNTOUCHED; that instinct is the model.

**I OWN THE CORRECTION** (symmetry with the PO owning ruling 1): we each hit the prefix-hazard from opposite ends — PO's history-search false-negatived a live unit; my expander-grep false-negatived a live mechanism. Same root: don't reason about uuids at 8 chars.

## ★★ MINT-PATH FABRICATED-UUID GUARD — THREE signatures (the 3rd survives a format check)
A live case (tester BITE markers `3c9f2a71…` / `4d0a3b82…` / `5e1b4c93…`) exposed a 3rd fabrication family that PASSES a v4/variant check. Measured (never assumed):
- `4d0a3b82`→`5e1b4c93` per-nibble delta = **1,1,1,1,1,1,1,1** (constant +1); `3c9f2a71`→`4d0a3b82` = 1,1,7,11,1,1,1,1 (near-constant). **The signature is a CONSTANT INTER-ID DELTA across the co-minted SET**, NOT intra-id monotonicity — each id's internal +1 run = **1** (they look individually random). A single-id entropy test would MISS this.
- False-positive control: 200 real `crypto.randomUUID()` → max intra-id +1 run = **4**; and real random ids never share a constant per-nibble delta. So the tests below have ~0 false-positive by construction.

**THREE signatures the guard must reject (structure-in-the-VALUES, not just wellformedness):**
1. **All-zero / near-zero tail** — exact check.
2. **Bad v4** — version nibble ≠ 4 OR variant ∉ {8,9,a,b}.
3. **Sequential / constant-delta SET** — the new one. PRIMARY test = **set-delta**: when ≥2 uuids are minted together (a batch, or all markers in a file/commit), REJECT if they are related by a near-constant per-nibble delta (≥~6 of 8 head-nibbles equal delta). SECONDARY = intra-id monotonic run ≥8 (cheap, catches an internally-sequential single id; threshold ≥8 ⇒ 0 FP given reals max at 4) — but note it would NOT have caught THIS case, so the set-delta is the load-bearing test.

**KEY DESIGN CONSEQUENCE:** signature 3 is a SET property → the guard cannot be single-id-only. It must run where co-minted ids are visible together — (a) in any mint tool that creates multiple markers/units in one call, and (b) a CI scan over the `[*:uuid:…]` markers per file/commit. A per-id format check alone is insufficient (that is exactly how it slipped past inside the anti-corruption requirement — caught only because req measured the digits).

**BITE (stub-must-fail):** feed the exact 3 heads → MUST be rejected via the set-delta test; PLUS a **positive control** — 100+ real `crypto.randomUUID()` → ALL pass (0 false-positive). The positive control is mandatory: an over-aggressive entropy test that rejects real uuids is worse than none ([[false-low-worse-than-absent]]) and would get disabled. Fold into the R-C3 fail-closed guard family (post-GO, src/ts) beside the prefix-expansion + non-v4/all-zero guards.

## Summary for req
- (1) **Repoint** 17 Tasks' ownerIor → real S3 `29d92990-3512-48c8-8648-e08ee757bb57` / S9 `2aac7676-bc88-4eb0-a81b-07c913fda5ee` + restore S3/S9 tasks[]. Parents exist (prefix collision).
- (2) **Delete** the 2 all-zero Req.tests[] (live false-credit, FIRST) + the fabricated impl-links; **repoint-or-delete** the fabricated ownerIors. ROOT = truncation→expander (CORRECTED): make `resolvePrefix` fail-closed (unique-or-refuse) + prevention batch (E) + prefix-expansion BITE, all post-GO in R-C3.
- (3) **Leave all 16 dangling** (designed-not-built); mint per-unit only on proven downstream; R28.1 = shared-impl verify-owner-first.
