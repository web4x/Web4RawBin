# Sprint 40 board re-sync #2 (planner, 2026-09-05, post major-closure)

Re-measured per my own law (a count reported earlier is stale after fleet events).

## S40 counts — the BEFORE (pre scorer-false-open fix)

- **79 task refs, 0 dangling.** Planned **58** · QA Review **17** · QA-Review-with-open-CR **2** · In Progress **2** · **Done 0** (invariant holds).
- ⚠ These are the BEFORE the PO wants: the skill-expert's SCORER FALSE-OPEN bug (correctly-placed markers read as OPEN — 5 Bucket-A + 35 others, R40.84's hop among them) means the board is likely UNDER-counting shipped work; some Planned/open will re-count higher after the fix. Not adjusting statuses for it (per PO).

## Drift + coverage (PO-named reqs)

| Req | Reality (PO) | Task | Verdict |
|-----|-------------|------|---------|
| R40.88 b118f2c1 | SATISFIED + chain-complete-to-Test (890e1fa59, guard hardened 3 rounds e2/e3/e4 CLOSED, e1 residual); **impl-marker UNSEATED (expert task 379) = 5/6 hops** | T40.88 51bd0541 **[Planned]** | ★ **DRIFT** — Planned understates a satisfied+gated req; honest target = QA-Review with the marker-unseated (5/6) noted, NOT clean. Propose advance. |
| R40.90 393e297a | root-UNOWNED, symptom-only | T40.90 e270939b [Planned] | ✓ correct (no drift) |
| R40.91 929a5117 | CLOSED end-to-end, both keys | **NO TASK** | I HELD it (was in flux — right then); now closed → **needs a covering task**. Propose mint. |
| R40.92 6009a5ad | Tron's LAST visible symptom (add-folder-invisible) FIXED v0.8.182 (48de1dcb3), tester ALL-GREEN DET-3x + regression + stub; chain f9f4c69e8; req SATISFIED but **impl-marker UNSEATED (expert task 383) = 5/6 NOT 6/6** | **NO TASK** | coverage GAP → propose mint at honest 5/6 (QA-Review-minus-marker), reflect NOT-6/6 |
| R40.93 e0c95904 | raw-mkdir-single-owner, chain wired, expert BUILDING | **NO TASK** | coverage GAP → propose mint (In-Progress) |
| R31.14 (sprint-31) | deploy-integrity ACTIVATED as single canonical home; **UNVERIFIED until the monitor is OBSERVABLY RUNNING** | (not S40) | note only — not this sprint |

## Proposal (NOT reflexive — await PO GO, as last time)

- Advance **T40.88** Planned → QA-Review-with-marker-unseated-caveat (5/6; honest, not clean).
- Mint covering tasks: **R40.91** (closed, both keys), **R40.92** (5/6, Tron-symptom-fixed, reflect NOT-6/6), **R40.93** (In-Progress, expert building). ACs mirrored no-drift, UC uuids disk-resolved, verify-owner-first.
- Hold all status changes tied to the SCORER FALSE-OPEN until it lands (PO); recount after = the AFTER.
- 0 Done till Tron on everything.
