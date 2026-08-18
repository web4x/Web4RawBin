# R40.31 landing-3 acceptance — architect rulings (I own EXPECTED)

robbin-architect 2026-08-18, on tester raw evidence 17da3327b + PO direction. Interpretation/ruling only.

## Q1 — A DIFFERENTIAL confounded + subject-pool drift → the LOAD-BEARING claim, ruled by MEASUREMENT
**Two claims, kept separate:**
- **CLAIM-P (the requirement): "control visibility follows STATUS not MEMBERSHIP."** → **A-DIRECT on 92bdca8b is GREEN and IS the landing-3 acceptance for the property**: graph-absent at test time (precondition asserted, not inferred — L21) + controls follow `/api/ior` status. Membership is absent yet controls are correct ⇒ status-driven, by construction. This STANDS regardless of the differential.
- **CLAIM-M (mechanism): "attachTaskStatus is LOAD-BEARING on current data."** This is a DISTINCT, smaller claim and the differential exists to test it.

**MEASURED (not asserted) — the load-bearing subject shape does NOT occur:**
- Scanned all 525 Task units: **519 carry a statusChecklist; 0 of them lack a stored `model.status`.** `deriveStatusEnum` (sole 4-state writer) has stored a status on **100% of current tasks**, frozen-legacy included. a39efc32 "gained" a stored status for the same reason — the confound is **systemic, not subject-specific**.
- ⇒ There is **NO real subject** on which fix-off (attachTaskStatus neutered) yields no status. On current data attachTaskStatus is **redundant** — the stored status already satisfies the render on every task.

**RULING Q1:**
1. **KEEP A-DIRECT (92bdca8b) as the property acceptance = GREEN.** Do NOT strip the stored `model.status` — mutating a real subject into an unreal (statusless) state proves nothing admissible.
2. **Do NOT chase a39efc32 or any current task** for the load-bearing differential — measurement shows all 519 are confounded by construction.
3. **(1b) I AGREE with the honest conclusion, sharpened by the count:** attachTaskStatus is a **BY-CONSTRUCTION GUARANTEE** (a read-boundary safety net for a status-absent task), **NOT an active repair on current data** (where 519/519 already carry a stored status). **This precise, smaller claim MUST be stated to TRON explicitly** — not folded into a harness note. It carries a real decision for Tron: keep attachTaskStatus as a forward guarantee, or retire it as redundant. A vague "the fix works" would hide that it changes nothing on today's data.
4. **IF the guarantee is to be KEPT, it must be CHECKED not merely asserted** (my own e421435f1/2c8a5998e doctrine: a by-construction claim asserted is inadmissible). The ONLY admissible check, given zero natural instances, is a **LABELLED pre-seam FIXTURE** — a full `/api/ior` citizen reproducing the real pre-seam shape (statusChecklist present, `model.status` absent), in an **isolated scratch index (R40.31: prod untouched, cleanup-survives-failure)**, labelled synthetic-reproducing-pre-seam with the reason stated. Run the differential on it: **fix-off → status undefined → controls HIDDEN / "⚠ unresolved" (fail-loud); fix-on → derived status → controls shown.** That converts the guarantee from asserted to checked and is able-to-fail. This is NOT tuning-until-green — it supplies the exact input the mechanism is designed for, openly labelled.

## Q1b — a39efc32 original proof is CONFOUNDED (git archaeology, measured)
PO asked: did a39efc32 gain its stored `model.status` BEFORE or AFTER v0.8.112? Measured on the unit's git history:
- `git log -S'"status"'` on `a39efc32-…scenario.json` → the status field was written in **7b1515e01 (2026-08-17 11:32, "stand up Task 37.25")**.
- v0.8.112 (attachTaskStatus deploy) = **5444e2133 (2026-08-18 21:02)** — a full day LATER. `merge-base --is-ancestor 7b1515e01 5444e2133` = **YES**.
- ⇒ **a39efc32 already carried a stored status a DAY BEFORE attachTaskStatus shipped.** The "undefined→In Progress across the fix" observation is explained by the pre-existing stored field (a seam-touch), NOT by live derivation. **The original a39efc32 causal proof is CONFOUNDED** — exactly the PO's hypothesis, confirmed by history.
- ⇒ **The seeded, labelled pre-seam FIXTURE is the ONLY admissible causal evidence** that attachTaskStatus is load-bearing (Q1 ruling 4). No current real subject can carry the proof. We must STOP citing a39efc32 as evidence.

## Q2 — /model NOT quiet: my "tree-less" premise is CORRECTED by measurement; adopt CAUSALITY-BY-EXCLUSION
**I own the error.** 70cfcdab1 picked /model for B as "tree-less → client-2 quiet." The tester MEASURED client-2 firing `/api/trace/children` (pollInQuietWindow=3). **Measurement wins.** Precise correction: /model has a **graph-LESS subject DRAWER** (true — that is why A's graph-absent precondition is VALID on /model) BUT the /model **PAGE also mounts a graph-subscribed TREE that polls.** "Graph-less drawer" ≠ "tree-less page" — I conflated them. B's "quiet client-2" premise is false on /model as-loaded; trap-1 (broadcast≠poll) is not evaluable by silence there.

**RULING Q2 — adopt the PO's THIRD option (causality-by-EXCLUSION), keep the page REAL:**
- Rejected: (a) suppress the poll = proves something about a MODIFIED page (inadmissible, our no-synthetic-conditions doctrine); (b) hunt a quiet surface = may not exist.
- **EXCLUSION (ruled):** prove the observed traffic COULD NOT have carried the change. Gate asserts, positively: **(i)** capture every client-2 poll response in the window and assert **NONE contains the new status value**; **(ii)** assert the **WS broadcast frame DID carry it**; **(iii)** then the client-2 DOM change is attributable to the broadcast **by exclusion**. Page stays real/unmodified.
- **Pairs with C1** (already PASS: broadcast-off → no update, despite polls) as the empirical half — together: polls demonstrably neither carry (i) nor cause (C1) the control change; the broadcast does (ii). trap-1 satisfied WITHOUT a synthetic quiet page.
- **Fails honestly:** if any poll response DOES contain the status value, the surface genuinely cannot support a clean causality proof → **B must MOVE** (a real finding, not a harness excuse).
- **B harness fixes (tester-owned, orthogonal):** warmup the present-before snapshot (mirror A's openAndRead + waitForSelector) so present-before is TRUE; assert live status via the control-bar/badge ELEMENT, not a textContent substring (the `statusDone=true`-before-approve noise).

## Banked GREEN (independent of the above)
C1 broadcast-off→no-update PASS · no-reload PASS · prod 92bdca8b/97e8a6ad UNCHANGED (isolation held on real tasks). A-DIRECT GREEN = the landing-3 property is accepted; the open items are the load-bearing STATEMENT-to-Tron (Q1) and B's exclusion re-run (Q2).
